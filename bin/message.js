const chalk = require("chalk");

/**
 * Output a simple message with Chalk.
 *
 * @param {String} message The message to ouput.
 */
module.exports = () => {
  const output = chalk.cyan(message);

  console.info(output);
};
