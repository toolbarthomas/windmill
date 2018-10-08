const _ = require("lodash");
const argv = require("minimist")(process.argv.slice(2)) || {};
const fs = require("fs");
const glob = require("glob");
const path = require("path");

const message = require("./message");
const error = require("./error");

module.exports = {
  /**
   * Check if the current working directory has a dotenv environment file defined.
   * Create an empty environment file if there is none.
   *
   * @param {Object} defaults The default options for Windmill.
   */
  getConfig(defaults) {
    const envPath = path.resolve(`${process.cwd()}/.env`);

    // Check if there is any environemnt file defined, create one otherwise.
    if (fs.existsSync(envPath)) {
      return this.setConfig(envPath, defaults);
    }
    else {
      fs.writeFile(envPath, "", "utf8", error => {
        if (error) {
          error(error);
        }

        message(`No dotenv environment file ('.env') has been defined.\nA fresh new copy has been created within: ${process.cwd()}`)

        return this.setConfig(envPath, defaults);
      });
    }
  },

  /**
   * Read the dotenv environemnt file from `envPath` and make it available within
   * the Node process.env object.
   *
   * @param {String} envPath Path to the environemnt file.
   * @param {Object} defaults The default options for Windmill.
   *
   * @returns {Object}
   */
  setConfig(envPath, defaults) {
    const env = require("dotenv").config({
      path: envPath
    });

    // Check if the current environment is a valid dotenv file.
    if (env.error) {
      error(env.error);
    }

    if (Object.keys(env.parsed).length === 0) {
      message("No environment specific configuration has been defined.");
      message("Windmill will use the default configuration...");
    }

    const config = defaults || {};

    // Define the source directory with all Windmill specific assets.
    config['src'] = process.env.WINDMILL_SRC = process.env.WINDMILL_SRC || defaults.src;

    // Define the destination directory for our build.
    config['dist'] = process.env.WINDMILL_DIST = process.env.WINDMILL_SRC || defaults.dist;

    // Define the recipients to send our mails to.
    config["recipients"] = process.env.WINDMILL_RECIPIENTS = (process.env.WINDMILL_RECIPIENTS ? process.env.WINDMILL_RECIPIENTS.split(",") : []);

    // Define the root directory where all email templates are defined.
    config["root"] = process.env.WINDMILL_ROOT = process.env.WINDMILL_ROOT || defaults.root;

    // Define the email address to send our mails to.
    config["sender"] = process.env.WINDMILL_SENDER = process.env.WINDMILL_SENDER || defaults.sender;

    // Define the email templates to send.
    config['templates'] = this.getEmailTemplates() || [];

    // Throw an exception if `config` is not valid.
    if (!config || Object.keys(config).length === 0) {
      error("Windmill is unable to define the configuration.");
    }

    return config;
  },

  /**
   * Get all email templates to process from and filter out any non-excisting
   * directories.
   * Windmill will try to locate all email templates with a globbing pattern
   * if no arguments where inserted.
   */
  getEmailTemplates() {
    const source = path.resolve(process.env.WINDMILL_SRC, process.env.WINDMILL_ROOT);

    let emails = [];

    if (_processHasFileArguments()) {
      // Map each entry email within the arrays key
      emails = _.map(argv._, email => {
        const file = path.resolve(source, email);

        if (!fs.existsSync(file)) {
          return;
        }

        return file;
      });

      // Filter out non-excisting email template directories.
      emails = _.compact(emails);
    }
    else {
      emails = glob.sync(path.resolve(source, '*'));
    }

    return emails;
  }
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
