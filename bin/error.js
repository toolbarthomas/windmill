const chalk = require("chalk");
const symbols = require("log-symbols");

/**
 * Output a new Error Exception with Chalk.
 *
 * @param {String} error The error message to output.
 */
module.exports = (error) => {
  const output = chalk.red(error);

  console.error(`${symbols.error} `, output);

  process.exit(1);
};
