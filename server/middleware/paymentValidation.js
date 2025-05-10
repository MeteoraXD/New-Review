const { body } = require('express-validator');

const paymentValidation = [
  body('amount')
    .isNumeric()
    .withMessage('Amount must be a number')
    .custom((value) => {
      if (value !== 100 && value !== 1000) {
        throw new Error('Amount must be either 100 or 1000');
      }
      return true;
    }),
  body('return_url')
    .optional()
    .isURL()
    .withMessage('Invalid return URL')
];

module.exports = paymentValidation; 