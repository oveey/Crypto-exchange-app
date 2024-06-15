const checkIsNameMatches = (fullName, bankAccountName) => {
  const userFullNameArr = fullName.toLowerCase().split(' ');
  const accountNameArr = bankAccountName.toLowerCase().split(' ');

  const fullNameMatch = userFullNameArr.every((word) => accountNameArr.includes(word));

  return fullNameMatch;
};

function validateBankDetails(bankDetails, requiredWithdrawalFields) {
  for (const field of requiredWithdrawalFields) {
    if (!(field in bankDetails)) return { isValidBankDetails: false };

    const value = bankDetails[field];
    if (value === undefined || value === null) return { isValidBankDetails: false };
  }

  return { isValidBankDetails: true };
}

module.exports = { checkIsNameMatches, validateBankDetails };
