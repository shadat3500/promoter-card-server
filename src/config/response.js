const response = ({ statusCode, message, data = {}, status = "OK" } = {}) => {
  return {
    status,
    statusCode,
    message,
    data,
  };
};

module.exports = response;
