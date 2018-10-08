const chalk = require("chalk");

/**
 * Output a new Error Exception with Chalk.
 *
 * @param {String} error The error message to output.
 */
module.exports = (error) => {
  const output = chalk.red(error);

  console.error(output);

  process.exit(1);
};
