const isValueDefined = (userId, id, amount) => {
  let expectedErrorObj;

  if (!userId) {
    expectedErrorObj = { message: 'User Id is required as API Url parameter', status: 405 };
    return { expectedErrorObj };
  }
  if (userId !== id) {
    expectedErrorObj = { message: 'User unauthorized to get resource', status: 401 };
    return { expectedErrorObj };
  }
  if (!amount || Number(amount) <= 0) {
    expectedErrorObj = { message: 'Invalid request data. Amount must be entered & be more than 0 NGN', status: 400 };
    return { expectedErrorObj };
  }

  expectedErrorObj = null;
  return { expectedErrorObj };
};

module.exports = { isValueDefined };
