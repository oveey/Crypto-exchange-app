const User = require('../models/User.js');
const customError = require('../utilities/customError.js');
const handleCustomErrorResponse = require('../utilities/handleCustomErrorResponse.js');

/*
 * Identification type has to be BVN OR NIN
 */
const verificationParamsConfig = async (req, res, next) => {
  const id = req.user.userId;
  const { userId } = req.params;

  const {
    country,
    countryAlias,
    accountNumber,
    bvn,
    bankCode,
    email,
    firstName,
    lastName,
    phoneNumber,
    dateOfBirth,
    identityDocumentNumber,
  } = req.body;

  try {
    if (!userId) {
      throw new customError('User Id is required', 405);
    }
    if (userId !== id) {
      throw new customError('User unauthorized to get resource', 401);
    }

    const user = await User.findById(id);
    if (!user) {
      throw new customError('User not found and cannot continue verification', 404);
    }

    const customerVerificationParams = {
      country: countryAlias,
      type: 'bank_account',
      account_number: accountNumber,
      bvn,
      bank_code: bankCode,
      first_name: firstName,
      last_name: lastName,
    };

    customerCreationParams = {
      email,
      first_name: firstName,
      last_name: lastName,
      phone: phoneNumber,
    };

    const otherParams = {
      countryAlias,
      dateOfBirth,
      identityDocumentNumber,
    };

    req.objs = { customerVerificationParams, customerCreationParams, otherParams, user };

    next();
  } catch (error) {
    handleCustomErrorResponse(res, error);
  }
};

module.exports = verificationParamsConfig;
