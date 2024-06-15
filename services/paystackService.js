const axios = require('axios');
const configureServerUrl = require('../utilities/configureServerUrl.js');
const { paystackHeadersConfig } = require('../config/thirdPartyConfigs.js');
require('dotenv').config();

const paystack = new axios.create({
  baseURL: 'https://api.paystack.co',
  ...paystackHeadersConfig,
});

/**
 * Check if a recipient exists based on the user's bank account information.
 * If the recipient does not exist, create a new recipient and return it.
 *
 * The possibility of having wrong bank details is almost 0 since only users won't type in thier bankDetails themselves (Autotyped & Non-editable)
 * && only users whose bankDetails are verified CAN transact
 *
 * @param {Object} user - The user object containing the bank account information.
 * @returns {Object} - The recipient object containing the recipient_code and other details.
 */
const findOrCreateRecipient = async (res, userBankDetails) => {
  const { bankAccountName, bankAccountNumber, bankName, bankCode } = userBankDetails;

  // Construct the request payload
  const payload = {
    type: 'nuban',
    name: bankAccountName,
    account_number: bankAccountNumber,
    bank_code: bankCode,
    currency: 'NGN',
  };

  let paystackRecipientError;

  // Check if the recipient already exists
  let recipientResponse = await paystack.get('/transferrecipient', payload);

  const { status: recipientStatus1, data: recipientResponseData1 } = recipientResponse;

  if (recipientStatus1 !== 200) {
    paystackRecipientError = {
      message: 'Recipient data cannot be fetched',
      status: 500,
    };

    return { paystackRecipientError };
  }

  const { data: recipientData1 } = recipientResponseData1;

  if (recipientData1 && recipientData1.length > 0) {
    // find that specific recipient within the array instead of returning the first recipient
    console.log({ paystackRecipient: recipientData1[0] });
    return { paystackRecipient: recipientData1[0] };
  }

  // Create a new recipient if none exists
  recipientResponse = await paystack.post('/transferrecipient', payload);

  const { status: recipientStatus2, data: recipientResponseData2 } = recipientResponse;

  if (recipientStatus2 !== 200) {
    paystackRecipientError = {
      message: 'New Recipient cannot be created',
      status: 500,
    };

    return { paystackRecipientError };
  }

  const { data: recipientData2 } = recipientResponseData2;

  if (!recipientData2.status) {
    paystackRecipientError = {
      message: 'Failed to create recipient',
      status: 500,
    };

    return { paystackRecipientError };
  }

  return { paystackRecipient: recipientData2.data };
};

/**
 * Deposit to the customer's account via Paystack
 * @param {string} userId - The ID of the user making the deposit
 * @param {number} amount - The amount to be deposited
 * @returns {Promise} - A promise that resolves with Paystack's response
 */
const depositToAccount = async (res, userId, email, amount) => {
  const { uri } = configureServerUrl();

  const response = await paystack.post('/transaction/initialize', {
    email,
    amount: amount * 100, // Amount in kobo
    callback_url: `${uri}/transaction/verify/${userId}`,
  });

  let paystackDepositError;

  const { status } = response.data;
  if (status !== true) {
    paystackDepositError = { message: 'Failed to initialize deposit', status: 400 };

    return { paystackDepositError };
  }

  return {
    paystackResponse: response.data,
  };
};

/**
 * Withdraw from the user's account via Paystack
 * @param {string} userId - The ID of the user making the withdrawal
 * @param {number} amount - The amount to be withdrawn
 * @returns {Promise} - A promise that resolves with Paystack's response
 */
const withdrawFromAccount = async (res, userId, amount, bankDetails) => {
  const { paystackRecipientError, paystackRecipient } = findOrCreateRecipient(res, bankDetails);

  if (paystackRecipientError) {
    return { paystackRecipientError };
  }

  const response = await paystack.post('/transfer', {
    source: 'balance',
    reason: 'Withdrawal',
    amount: amount * 100,
    recipient: paystackRecipient?.recipient_code,
    currency: 'NGN',
  });

  console.log({ response });

  const { status } = response.data;
  if (status !== true) {
    return {
      paystackRecipientError: {
        message: 'New Recipient cannot be created',
        status: 500,
      },
    };
  }

  return { paystackResponse: response.data };
};

module.exports = {
  depositToAccount,
  withdrawFromAccount,
};
