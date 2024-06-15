const axios = require('axios');
const { paystackHeadersConfig } = require('../config/thirdPartyConfigs.js');
const handleCustomErrorResponse = require('../utilities/handleCustomErrorResponse.js');
const customError = require('../utilities/customError.js');

const fetchAllSupportedCountriesController = async (req, res) => {
  try {
    const response = await axios.get('https://api.paystack.co/country', paystackHeadersConfig);

    const { status, statusText, data } = response;

    if (status !== 200) {
      throw new customError('An error occurred while fetching countries.', 500);
    }

    const { message, data: countriesData } = data;

    let countriesInfoArr = [];

    countriesData.map((countryInfo) => {
      return countriesInfoArr.push({
        id: countryInfo.id,
        name: countryInfo.name,
        isoCode: countryInfo.iso_code,
        currencyCode: countryInfo.default_currency_code,
        callingCode: countryInfo.calling_code,
      });
    });

    return res.status(status).json({
      statusText,
      message,
      countriesData: countriesInfoArr,
    });
  } catch (error) {
    handleCustomErrorResponse(res, error);
  }
};

/**
 * Controller function to validate/verify customer's details using Paystack API
 * fetch all existing customers from paystack & then check if the customer (by firstName & lastName)
 * :: to be verified has a matching customer code
 */
const verifyCustomerDetailsController = async (req, res) => {
  const { customerVerificationParams, customerCreationParams, otherParams, user } = req.objs;

  try {
    const customersResponse = await axios.get('https://api.paystack.co/customer', paystackHeadersConfig);

    const { status, statusText, data } = customersResponse;

    if (status !== 200) {
      throw new customError('An error occurred while fetching all customers.', status);
    }

    const { status: successStatus, message, data: existingCustomers, meta } = data;

    const existingCustomer = existingCustomers.find((customer) => {
      customer.email === req.body.email;
    });
    let customerCode;

    if (!existingCustomer) {
      const createCustomerResponse = await axios.post(
        'https://api.paystack.co/customer',
        customerCreationParams,
        paystackHeadersConfig
      );

      const { status, data } = createCustomerResponse;

      if (status !== 200) {
        throw new customError('An error occurred while creating customers.', status);
      }

      const { data: customerData } = data;

      customerCode = customerData.customer_code;
    } else {
      customerCode = existingCustomer.customer_code;
    }

    console.log({ existingCustomers });

    if (user.isAccountVerified) {
      return res.status(200).json({
        message: 'Customer previously verified',
        isAccountVerified: user.isAccountVerified,
      });
    }

    const validateCustomerResponse = await axios.post(
      `https://api.paystack.co/customer/${customerCode}/identification`,
      customerVerificationParams,
      paystackHeadersConfig
    );

    const { response, data: customerValidationData } = validateCustomerResponse;
    console.log({ response, customerValidationData });

    console.log(validateCustomerResponse.data.status);
    console.log(validateCustomerResponse.data.status === false);

    if (validateCustomerResponse.data.status !== true) {
      throw new customError('Customer verification failed', 400);
    }

    console.log({ user });

    user.isAccountVerified = true;
    await user.save();

    return res.status(200).json({
      message: 'Customer successfully verified',
      isAccountVerified: user.isAccountVerified,
    });
  } catch (error) {
    handleCustomErrorResponse(res, error);
  }
};

module.exports = {
  fetchAllSupportedCountriesController,
  verifyCustomerDetailsController,
};
