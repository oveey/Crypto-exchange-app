const axios = require('axios');
const User = require('../models/User.js');
const Bank = require('../models/Bank.js');
const handleCustomErrorResponse = require('../utilities/handleCustomErrorResponse.js');
const customError = require('../utilities/customError.js');
const { checkIsNameMatches } = require('../utilities/checkIsNameMatches.js');
const { paystackHeadersConfig } = require('../config/thirdPartyConfigs.js');

const fetchBanks = async () => {
  try {
    const banksResponse = await axios.get('https://api.paystack.co/bank');

    const { status, statusText, data: banks } = banksResponse;

    if (status !== 200) {
      throw new customError('An error occurred while fetching banks.', 500);
    }

    const { message, data: bankData } = banks;

    return { statusText, message, bankData };
  } catch (error) {
    handleCustomErrorResponse(res, error);
  }
};

const getSupportedBanksController = async (req, res) => {
  try {
    const { statusText, message, bankData } = await fetchBanks();

    const banksArr = bankData.map((bank) => ({
      id: bank.id,
      name: bank.name,
      code: bank.code,
      slug: bank.slug,
    }));

    return res.status(200).json({
      status: 'success',
      statusText,
      message,
      supportedBanks: banksArr,
    });
  } catch (error) {
    handleCustomErrorResponse(res, error);
  }
};

const getBankDetailsController = async (req, res) => {
  const id = req.user.userId;
  const { userId } = req.params;

  try {
    if (!userId) {
      throw new customError('User Id is required', 405);
    }
    if (userId !== id) {
      throw new customError('User unauthorized to get resource', 401);
    }

    const user = await User.findById(id);

    if (!user) throw new customError('User not found', 404);

    const { bankName, bankAccountNumber, bankCode } = user._doc.bankDetails;

    let matchingBank;
    if (!bankCode) {
      const { bankData } = await fetchBanks();

      matchingBank = bankData.find((bank) => bank.name === bankName);
      if (!matchingBank) {
        throw new customError('Bank code not obtainanble', 400);
      }
    }

    res.status(200).json({
      status: 'success',
      bankName: bankName,
      bankAccountNumber: bankAccountNumber,
      bankCode: bankCode ? bankCode : matchingBank?.code,
    });
  } catch (error) {
    handleCustomErrorResponse(res, error);
  }
};

// Updating bank info should be a one-time-update
const updateBankDetailsController = async (req, res) => {
  const id = req.user.userId;
  const { userId } = req.params;

  const updates = Object.keys(req.body);
  const allowedUpdates = ['bankName', 'bankAccountNumber'];

  const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

  try {
    if (!userId) {
      throw new customError('User Id is required', 405);
    }
    if (userId !== id) {
      throw new customError('User unauthorized to get resource', 401);
    }

    if (!isValidOperation) {
      throw new customError('Invalid updates!', 400);
    }

    const user = await User.findById(id);

    if (!user) throw new customError('User not found', 404);

    const { bankData } = await fetchBanks();

    const matchingBank = bankData.find((bank) => bank.name === req.body.bankName);
    if (!matchingBank) {
      throw new customError("User's Bank code not obtainanble", 400);
    }

    updates.forEach((update) => (user.bankDetails[update] = req.body[update]));
    user.bankDetails.bankCode = matchingBank?.code;

    await user.save();

    return res.status(200).json({
      status: 'success',
      message: 'Bank details updated successfully',
    });
  } catch (error) {
    handleCustomErrorResponse(res, error);
  }
};

const verifyBankAccountController = async (req, res) => {
  const id = req.user.userId;
  const { bankName, bankAccountNumber } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      throw new customError('User not obtainable for verification', 404);
    }

    const { bankData } = await fetchBanks();

    const bank = bankData.find((bank) => bank.name === bankName);
    if (!bank) {
      throw new customError('Bank not found', 400);
    }

    const response = await axios.get(
      `https://api.paystack.co/bank/resolve?account_number=${bankAccountNumber}&bank_code=${bank.code}`,
      paystackHeadersConfig
    );

    const { data } = response;

    const userFullName = `${user.firstName} ${user.lastName}`;

    if (data.status === true) {
      const accountHolderName = data.data.account_name;

      if (checkIsNameMatches(userFullName, accountHolderName)) {
        user.bankDetails.isBankDetailsVerified = true;
        await user.save();

        return res.status(200).json({
          status: 'success',
          message: 'Bank account verified successfully',
          data: data.data,
        });
      } else {
        return res.status(400).json({
          status: 'failure',
          message: 'Bank account name does not match user full name',
        });
      }
    }
  } catch (error) {
    if (error.response?.data.type === 'validation_error' || error.response?.data.status === false) {
      return res.status(error.response.status).json({
        status: 'failure',
        message: 'Bank account verification failed. Account name cannot be resolved',
      });
    }

    handleCustomErrorResponse(res, error);
  }
};

module.exports = {
  fetchBanks,
  getSupportedBanksController,
  getBankDetailsController,
  updateBankDetailsController,
  verifyBankAccountController,
};
