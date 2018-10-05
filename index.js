const _ = require("lodash");
const argv = require("minimist")(process.argv.slice(2)) || {};
const chalk = require("chalk");
const fs = require("fs");
const glob = require("glob");
const path = require("path");

const Email = require("email-templates");

module.exports = (() => {
  // Default configuration for Windmill.
  const defaults = {
    emails: [],
    src: "./src",
    dist: "./dist",
    recipients: [],
  };

  // Get environment specific variables from the dotenv environment file.
  const config = getEnvironment(defaults);

  // Actual configuration files with fallback values from `defaults`.
  const options = setOptions(defaults, config);

  console.log(options);

  // There should be a configurations file right now, abort otherwise...
  if (!options || Object.keys(options).length === 0) {
    error("Unable to set any options.");
  }

  if (options.emails.length === 0) {
    error("Unable to locate any valid email templates...");
  }
})();

/**
 * Check if the current working directory has a dotenv environment file defined.
 * Create an empty environment file if there is none.
 *
 * @param {Object} defaults The default options for Windmill.
 */
function getEnvironment(defaults) {
  const envPath = path.resolve(`${process.cwd()}/.env`);

  // Check if there is any environemnt file defined, create one otherwise.
  if (fs.existsSync(envPath)) {
    return setEnvironment(envPath, defaults);
  }
  else {
    fs.writeFile(envPath, "", "utf8", error => {
      if (error) {
        error(error);
      }

      message(`No dotenv environment file ('.env') has been defined.\nA fresh new copy has been created within: ${process.cwd()}`)

      return setEnvironment(envPath, defaults);
    });
  }
}

/**
 * Read the dotenv environemnt file from `envPath` and make it available within
 * the Node process.env object.
 *
 * @param {String} envPath Path to the environemnt file.
 * @param {Object} defaults The default options for Windmill.
 *
 * @returns {Object}
 */
function setEnvironment(envPath, defaults) {
  const env = require("dotenv").config({
    path: envPath
  });

  // Check if the current environment is a valid dotenv file.
  if (env.error) {
    error(env.error);
  }

  if (Object.keys(env.parsed).length === 0) {
    message("No environment specific configuration has been defined.");
    message("Windmill will fall back to the default configuration...");
  }

  const config = {};

  // Define the source directory with all Windmill specific assets.
  config['src'] = process.env.WINDMILL_SRC = process.env.WINDMILL_SRC || defaults.src;

  // Define the destination directory for our build.
  config['dist'] = process.env.WINDMILL_DIST = process.env.WINDMILL_SRC || defaults.dist;

  // Define the recipients to send our mails to.
  config["recipients"] = process.env.WINDMILL_RECIPIENTS = (process.env.WINDMILL_RECIPIENTS ? process.env.WINDMILL_RECIPIENTS.split(",") : []);

  // Throw an exception if `config` is not valid.
  if (!config) {
    error("Unable to read the configuration for Windmill, aborting...");
  }

  return config;
}

/**
 * Get all command-line interface arguments.
 *
 * @param {Object} defaults Default configuration options.
 * @param {Object} config Default environment configuration.
 *
 * @returns {Object}
 */
function setOptions(defaults, config) {
  const options = defaults || {};

  options["emails"] = getEmailTemplates();
  options["src"] = config.src;
  options["dist"] = config.dost;
  options["recipients"] = config.recipients;

  return options;
}

/**
 * Define all email templates to process from and filter out any non-excisting
 * directories.
 * Windmill will try to locate all email templates with a globbing pattern
 * if no arguments where inserted.
 */
function getEmailTemplates() {
  let emails = [];

  if (_processHasFileArguments()) {
    // Map each entry email within the arrays key
    emails = _.map(argv._, email => {
      const source = `./src/emails/${email}`;

      if (!fs.existsSync(source)) {
        return;
      }

      return source;
    });

    // Filter out non-excisting email template directories.
    emails = _.compact(emails);
  } else {
    emails = glob.sync("./src/emails/*");
  }

  return emails;
}

/**
 * Check if the current Node process has any files defined as arguments
 * within the actual build command.
 * You can process a specific e-mail template by defining the template
 * directory name as Node Argument.
 *
 * @param {Object} files
 *
 * @returns {Boolean}
 */
function _processHasFileArguments() {
  // Check if `argv._` even excists.
  if (!"_" in argv) {
    return false;
  }

  // Check if `argv._` has no undefined value.
  if (!argv._) {
    return false;
  }

  // Check if `argv._` is not empty
  if (typeof argv._ === "object" && Object.keys(argv._).length === 0) {
    return false;
  }

  // `argv._` should be a valid object with entry files.
  return true;
}

/**
 * Ouput a new Error Exception with Chalk.
 *
 * @param {String} error The error message to output.
 */
function error(error) {
  const ouput = chalk.red(error);

  console.error(new Error(ouput));
}

/**
 * Output a simple message with Chalk.
 *
 * @param {String} message The message to ouput.
 */
function message(message) {
  const output = chalk.cyan(message);

  console.info(output);
}
