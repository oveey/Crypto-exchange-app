const includedProperties = ['username', 'firstName', 'lastName', 'email', 'phoneNumber'];

const selectedResponseKeys = (dou, selectedProps) => {
  const needfulKeyValuePairs = Object.keys(dou)
    .filter((key) => selectedProps.includes(key))
    .reduce((obj, key) => {
      obj[key] = dou[key];
      return obj;
    }, {});

  return needfulKeyValuePairs;
};

module.exports = { includedProperties, selectedResponseKeys };
