const User = require('../models/User.js');
const AzaxAccount = require('../models/AzaxAccount.js');
const Transaction = require('../models/Transaction');
const handleCustomErrorResponse = require('../utilities/handleCustomErrorResponse.js');
const { azaxAccountKeys, requiredWithdrawalFields } = require('../utilities/predefinedArrays.js');
const paystack = require('../services/paystackService.js');
const customError = require('../utilities/customError.js');
const { isValueDefined } = require('../utilities/customValidators.js');
const { validateBankDetails } = require('../utilities/checkIsNameMatches.js');
const { fetchBanks } = require('./banks.js');

// Call this createAzaxForUser function in subsequent controllers
const defineUserAndAccount = async (userId, amount, transactionType) => {
  let expectedErrorObj;

  const registeredUser = await User.findById(userId);
  if (!registeredUser) {
    expectedErrorObj = {
      message: 'User not Registered/found. Transaction cannot be effected',
      status: 404,
    };

    return { errorObj: expectedErrorObj };
  }

  const azaxAccountData = {};
  // Create azaxAccCredentials that presets a permissible field fiatBalance only for the first Deposit
  const azaxAccCredentials = {
    fiatBalance: transactionType === 'deposit' && amount,
  };

  for (const key in azaxAccCredentials) {
    if (azaxAccountKeys.includes(key)) {
      azaxAccountData[key] = azaxAccCredentials[key];
    }
  }

  const { _id } = registeredUser._doc;

  let newUserAzaxAcc;
  let existingUserAzaxAcc;

  existingUserAzaxAcc = await AzaxAccount.findOne({
    accountId: _id,
  });

  // Set the fiatBalance to the deposit amount for a newly created Azax account making first deposit
  if (!existingUserAzaxAcc && transactionType === 'deposit') {
    newUserAzaxAcc = await AzaxAccount.create({
      accountId: _id,
      ...azaxAccountData,
    });

    return { registeredUser, newUserAzaxAcc };
  } else if (!existingUserAzaxAcc && transactionType === 'withdrawal') {
    expectedErrorObj = {
      message: 'User Azax account does not exist. Withdrawal cannot be made',
      status: 404,
    };

    return { expectedErrorObj };
  }

  return { registeredUser, existingUserAzaxAcc };
};

const defineAdminAndAdminAccount = async () => {
  const customersAdmin = await User.findOne({
    role: 'customersAdmin',
  });
  if (!customersAdmin) {
    return {
      adminErrorObj: {
        message: 'Customers Admin account not found',
        status: 404,
      },
    };
  }

  const { _id } = customersAdmin._doc;

  let customersAdminAzaxAcc = await AzaxAccount.findOne({
    accountId: _id,
  });
  if (!customersAdminAzaxAcc) {
    customersAdminAzaxAcc = await AzaxAccount.create({ accountId: _id });
  }

  return { customersAdmin, customersAdminAzaxAcc };
};

// Deposit Fiat controller
const depositFiatController = async (req, res) => {
  const { userId } = req.params;
  const { amount } = req.body;

  const { userId: id } = req.user;

  try {
    const { expectedErrorObj } = isValueDefined(userId, id, amount);
    if (expectedErrorObj) {
      throw new customError(expectedErrorObj.message, expectedErrorObj.status);
    }

    const {
      registeredUser: user,
      newUserAzaxAcc,
      existingUserAzaxAcc,
      errorObj,
    } = await defineUserAndAccount(userId, amount, 'deposit');

    if (errorObj) {
      throw new customError(errorObj.message, errorObj.status);
    }

    const { paystackDepositError, paystackResponse } = await paystack.depositToAccount(res, userId, user.email, amount);

    if (paystackDepositError) {
      throw new customError(paystackDepositError.message, paystackDepositError.status);
    }

    const { status, message, data } = paystackResponse;

    // Check if the deposit was successful
    if (status !== true) {
      throw new customError('Failed to deposit to Customers Admin Paystack', 500);
    }

    const { adminErrorObj, customersAdmin, customersAdminAzaxAcc } = await defineAdminAndAdminAccount();

    if (adminErrorObj) {
      throw new customError(adminErrorObj.message, adminErrorObj.status);
    }

    // console.log(newUserAzaxAcc ? `newAzaxAcc: ${newUserAzaxAcc}` : `existingAzaxAcc: ${existingUserAzaxAcc}`);

    // Update balances and transaction histories of Customer & CustomersAdmin
    const depositAmount = Number(amount);
    newUserAzaxAcc
      ? newUserAzaxAcc.fiatBalance
      : (existingUserAzaxAcc.fiatBalance = Number(existingUserAzaxAcc.fiatBalance) + depositAmount);
    customersAdminAzaxAcc.fiatBalance = Number(customersAdminAzaxAcc.fiatBalance) + depositAmount;

    // Create transaction records
    const userTransaction = new Transaction({
      userId: user._id,
      accountId: newUserAzaxAcc ? newUserAzaxAcc.accountId : existingUserAzaxAcc.accountId,
      type: 'credit',
      amount: depositAmount,
      transactionCategory: 'fiat',
      description: 'Deposit to CustomersAdmin Paystack & into Coinwave Acc',
      transactionId: data.reference,
    });
    newUserAzaxAcc
      ? newUserAzaxAcc.transactionHistory.push(userTransaction)
      : existingUserAzaxAcc.transactionHistory.push(userTransaction);

    const adminTransaction = new Transaction({
      userId: customersAdmin._id,
      accountId: customersAdminAzaxAcc?.accountId,
      type: 'credit',
      transactionCategory: 'fiat',
      amount: depositAmount,
      description: 'Customer deposit',
      transactionId: data.reference,
    });
    customersAdminAzaxAcc.transactionHistory.push(adminTransaction);

    // Save transactions, Update users, Update Azax Account
    await user.save();
    await userTransaction.save();
    newUserAzaxAcc ? await newUserAzaxAcc.save() : await existingUserAzaxAcc.save();

    await customersAdmin.save();
    await adminTransaction.save();
    await customersAdminAzaxAcc.save();

    return res.status(200).json({
      status: 'success',
      message: 'Deposit successful',
      fiatBalance: newUserAzaxAcc ? newUserAzaxAcc.fiatBalance : existingUserAzaxAcc.fiatBalance,
      userTransaction,
    });
  } catch (error) {
    handleCustomErrorResponse(res, error);
  }
};

// Withdraw Fiat controller
const withdrawFiatController = async (req, res) => {
  const { userId } = req.params;
  const { amount, ...bankInfo } = req.body;

  const { userId: id } = req.user;

  try {
    // Retrieve user data and azax account data
    const { expectedErrorObj } = isValueDefined(userId, id, amount);
    if (expectedErrorObj) {
      throw new customError(expectedErrorObj.message, expectedErrorObj.status);
    }

    const {
      registeredUser: user,
      existingUserAzaxAcc,
      errorObj,
    } = await defineUserAndAccount(userId, amount, 'withdrawal');

    if (errorObj) {
      throw new customError(errorObj.message, errorObj.status);
    }

    // Check if the user's account balance is sufficient for the withdrawal
    const withdrawalAmount = Number(amount);
    if (existingUserAzaxAcc.fiatBalance < withdrawalAmount) {
      throw new customError('Insufficient balance for withdrawal', 400);
    }

    const { isValidBankDetails } = validateBankDetails(bankInfo, requiredWithdrawalFields);

    if (isValidBankDetails === false) {
      throw new customError('Incomplete bank details. Withdrawal cannot be completed', 400);
    }

    const { bankDetails } = user._doc;
    let matchingBank;

    if (!bankDetails.bankCode) {
      const { bankData } = await fetchBanks();

      matchingBank = bankData.find((bank) => bank.name === bankInfo.bankName);
      if (!matchingBank) {
        throw new customError("User's Bank code not obtainanble", 400);
      }
    }

    const updatedBankDetails = {
      bankCode: bankDetails.bankCode ? bankDetails.bankCode : matchingBank?.code,
      ...bankInfo,
    };

    // Perform the withdrawal using the paystack service
    // const { paystackRecipientError, paystackResponse } = await paystack.withdrawFromAccount(
    //   res,
    //   userId,
    //   withdrawalAmount,
    //   updatedBankDetails
    // );

    // if (paystackRecipientError) {
    //   throw new customError(paystackRecipientError.message, paystackRecipientError.status);
    // }

    // const { status, message, data } = paystackResponse;

    // console.log({ status, message, data });

    // // Check if the withdrawal was successful
    // if (status !== true) {
    //   throw new customError('Failed to withdraw from customer account', 500);
    // }

    const { adminErrorObj, customersAdmin, customersAdminAzaxAcc } = await defineAdminAndAdminAccount();

    if (adminErrorObj) {
      throw new customError(adminErrorObj.message, adminErrorObj.status);
    }

    // Update balances and transaction histories of Customer & CustomersAdmin
    existingUserAzaxAcc.fiatBalance = Number(existingUserAzaxAcc.fiatBalance) - withdrawalAmount;
    customersAdminAzaxAcc.fiatBalance = Number(customersAdminAzaxAcc.fiatBalance) - withdrawalAmount;

    // Create transaction records
    const userTransaction = new Transaction({
      userId: user._id,
      accountId: existingUserAzaxAcc.accountId,
      type: 'debit',
      amount: withdrawalAmount,
      transactionCategory: 'fiat',
      description: 'Withdrawal from CustomersAdmin Paystack & from Coinwave Acc',
      // transactionId: data?.reference,
    });
    existingUserAzaxAcc.transactionHistory.push(userTransaction);

    const adminTransaction = new Transaction({
      userId: customersAdmin._id,
      accountId: customersAdminAzaxAcc?.accountId,
      type: 'debit',
      transactionCategory: 'fiat',
      amount: withdrawalAmount,
      description: 'Customer withdrawal',
      // transactionId: data?.reference,
    });
    customersAdminAzaxAcc.transactionHistory.push(adminTransaction);

    // Save transactions, Update users, Update Azax Account
    await user.save();
    await userTransaction.save();
    await existingUserAzaxAcc.save();

    await customersAdmin.save();
    await adminTransaction.save();
    await customersAdminAzaxAcc.save();

    // Return a success response
    return res.status(200).json({
      status: 'success',
      message: 'Withdrawal successful',
      fiatBalance: existingUserAzaxAcc.fiatBalance,
      userTransaction,
    });
  } catch (error) {
    handleCustomErrorResponse(res, error);
  }
};

module.exports = { depositFiatController, withdrawFiatController };
