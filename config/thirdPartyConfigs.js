require('dotenv').config();

const paystackHeadersConfig = {
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY_TEST}`,
    'Content-Type': 'application/json',
  },
};

module.exports = { paystackHeadersConfig };
