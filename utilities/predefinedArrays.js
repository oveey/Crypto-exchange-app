const azaxAccountKeys = [
  'accountId',
  'fiatBalance',
  'bitcoinWallet',
  'ethereumWallet',
  'solanaWallet',
  'tetherWallet',
  'transactionHistory',
];

const requiredWithdrawalFields = ['bankAccountName', 'bankAccountNumber', 'bankName'];

module.exports = { azaxAccountKeys, requiredWithdrawalFields };
