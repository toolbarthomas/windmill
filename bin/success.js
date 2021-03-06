const chalk = require("chalk");
const symbols = require("log-symbols");

/**
 * Output the success message with Chalk.
 *
 * @param {String} message The message to ouput.
 */
module.exports = (message) => {
  const output = chalk.green(message);

  console.log(`${symbols.success} `, output);
};
