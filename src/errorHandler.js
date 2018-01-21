import errno from 'errno';

const getErrorMessage = (err) => {
  const str = (errno.errno[err.errno]) ? errno.errno[err.errno].description : err.message;
  return (err.path) ? `ERROR: ${str} [${err.path}]` : `ERROR: ${str}`;
};

export default (error) => {
  const errorMessage = getErrorMessage(error);
  console.error(errorMessage);
  if (error.config) {
    console.error(error.config);
  }

  return errorMessage;
};
