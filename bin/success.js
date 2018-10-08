const chalk = require("chalk");

/**
 * Output the success message with Chalk.
 *
 * @param {String} message The message to ouput.
 */
module.exports = (message) => {
  const output = chalk.green(message);

  console.log(output);
};
