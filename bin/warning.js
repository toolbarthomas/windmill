const chalk = require("chalk");
const symbols = require("log-symbols");

/**
 * Output a simple message with Chalk.
 *
 * @param {String} message The message to ouput.
 */
module.exports = (message) => {
  const output = chalk.yellow(message);

  console.log(`${symbols.warning} `, output);
};
