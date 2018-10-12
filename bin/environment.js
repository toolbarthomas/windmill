const Promise = require("bluebird");

const _ = require("lodash");
const argv = require("minimist")(process.argv.slice(2)) || {};
const fs = require("fs");
const glob = require("glob");
const path = require("path");

const error = require("./error");
const info = require("./info");
const warning = require("./warning");

// Default configuration for Windmill.
const defaults = {
  src: "./src",
  dist: "./dist",
  modules: "modules",
  recipients: [],
  root: 'templates',
  sender: 'windmill@example.com',
  templates: [],
  argv: {
    send: false,
    templates: true,
    watch: false
  }
};

module.exports = {
  /**
   * Check if the current working directory has a dotenv environment file defined.
   * Create an empty environment file if there is none.
   *
   * @param {Object} defaults The default options for Windmill.
   */
  getConfig() {
    return new Promise((cb) => {
      const envPath = path.resolve(`${process.cwd()}/.env`);

      // Check if there is any environemnt file defined, create one otherwise.
      if (fs.existsSync(envPath)) {
        return cb(this.setConfig(envPath, defaults));
      }
      else {
        fs.writeFile(envPath, "", "utf8", error => {
          if (error) {
            error(error);
          }

          warning("No dotenv environment file ('.env') has been defined.");
          info(`A fresh new copy has been created within: ${process.cwd()}`);

          return cb(this.setConfig(envPath, defaults));
        });
      }
    });
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
      warning("No environment specific configuration has been defined.");
      warning("Windmill will use the default configuration...");
    }

    const config = defaults || {};

    // Command line interface arguments.
    const args = Object.assign(defaults.argv, _.omit(argv, '_'));

    // Parse Argument values to their correct type.
    config['argv'] = this._parseArgumentValues(args);

    // The source directory with all Windmill specific assets.
    config['src'] = process.env.WINDMILL_SRC = process.env.WINDMILL_SRC || defaults.src;

    // The destination directory for our build.
    config['dist'] = process.env.WINDMILL_DIST = process.env.WINDMILL_DIST || defaults.dist;

    // The recipients to send our mails to.
    config["recipients"] = process.env.WINDMILL_RECIPIENTS = (
      process.env.WINDMILL_RECIPIENTS ? process.env.WINDMILL_RECIPIENTS.split(",") : []
    );

    // The root directory where all email templates are defined.
    config["root"] = process.env.WINDMILL_ROOT = process.env.WINDMILL_ROOT || defaults.root;

    // The modules directory where all global partials are defined.
    config["modules"] = process.env.WINDMILL_MODULES = process.env.WINDMILL_MODULES || defaults.modules;

    // The email address where the email is sent from.
    config["sender"] = process.env.WINDMILL_SENDER = process.env.WINDMILL_SENDER || defaults.sender;

    // The email templates to send.
    config['templates'] = this.getEmailTemplates(config['argv']) || [];

    // Throw an exception if `config` is not valid.
    if (!config || Object.keys(config).length === 0) {
      error("Windmill is unable to define the configuration.");
    }

    return config;
  },

  /**
   * Get all email templates to process from and filter out any non-existing
   * directories.
   * Windmill will try to locate all email templates with a globbing pattern
   * if no arguments where inserted.
   *
   * @param {Object} options Object with all available CLI insterted arguments.
   *
   * @returns {Object} Array of paths to each subject template file.
   */
  getEmailTemplates(options) {
    const source = path.resolve(process.env.WINDMILL_SRC, process.env.WINDMILL_ROOT);

    let emails = [];

    // Check if the `templates` argument is defined by the user.
    if ('templates' in options && options.templates !== true) {
      const templates = (options.templates).split(",");

      // Map each entry email within the arrays key
      emails = _.map(templates, email => {
        const file = path.resolve(source, email);

        if (!fs.existsSync(file)) {
          warning(`Template not found: ${email}, skipping template...`);
          return;
        }

        return file;
      });

      // Filter out non-existing email template directories.
      emails = _.compact(emails);
    } else {
      emails = glob.sync(path.resolve(source, '*'));
    }

    return emails;
  },

  /**
   * Validate if all Windmill required paths exists.
   * @todo Cleanup validation.
   *
   * @param {Object} config Use Windmill configuration object.
   */
  validateConfigPaths(config) {
    let err;

    // Check if `WINDMILL_SRC` directory exists.
    err = this._validateConfigPath(
      path.resolve(process.cwd(), config["src"]),
      `The Windmill source directory '${config["src"]}' does not exists`,
      "You can customize the source directory by defining `WINDMILL_SRC` within the environment file.",
      (defaults.src === config.src)
    );

    // Check if `WINDMILL_DIST` directory exists.
    err = this._validateConfigPath(
      path.resolve(process.cwd(), config["dist"]),
      `The Windmill destination directory '${config["dist"]}' does not exists.`,
      "You can customize the destination directory by defining `WINDMILL_DIST` within the environment file.",
      (defaults.dist === config.dist)
    );

    // Check if `WINDMILL_ROOT` directory exists.
    err = this._validateConfigPath(
      path.resolve(process.cwd(), config["src"], config["root"]),
      `The root directory for all Windmill templates '${config["root"]}' does not exists`,
      "You can customize the root directory by defining `WINDMILL_ROOT` within the environment file.",
      (defaults.root === config.root)
    );

    if (err) {
      error("Windmill couldn't find the required directories.");
    }
  },

  /**
   * Check if the defined `path` exists, output feedback about defining config paths if not.
   *
   * @param {String} path Path to the validate.
   * @param {String} missingPathMessage Output message if path is missing.
   * @param {String} customizedPathMessage Explanation about how to custimize paths.
   * @param {Boolean} pathIsCustimized Output the `customizedPathMessage` message when true.
   */
  _validateConfigPath(path, missingPathMessage, customizedPathMessage, pathIsCustimized) {
    if (!fs.existsSync(path)) {
      warning(missingPathMessage);

      if (pathIsCustimized) {
        info(customizedPathMessage);
      }

      return true;
    }

    return false;
  },

  /**
   * Parse String values to their correct type
   *
   * @param {Object} args Object with all available CLI insterted arguments.
   */
  _parseArgumentValues(args) {
    if (typeof args !== "object" || Object.keys(args).length === 0) {
      return;
    }

    let parsed = args;

    Object.keys(args).forEach((key) => {
      let parsedValue = args[key];

      if (typeof parsedValue !== 'string') {
        return;
      }

      // Convert `true` || `false` as Boolean type.
      if (parsedValue === "true" || parsedValue === "false") {
        parsedValue = (parsedValue == 'true');
      }

      parsed[key] = parsedValue;
    });

    return parsed;
  }
}
