const _ = require("lodash");
const argv = require("minimist")(process.argv.slice(2)) || {};
const fs = require("fs");
const glob = require("glob");
const path = require("path");

const error = require("./error");
const warning = require("./warning");

// Default configuration for Windmill.
const defaults = {
  src: "./src",
  dist: "./dist",
  modules: "modules",
  recipients: [],
  root: 'templates',
  sender: 'windmill@example.com',
  templates: []
};

module.exports = {
  /**
   * Check if the current working directory has a dotenv environment file defined.
   * Create an empty environment file if there is none.
   *
   * @param {Object} defaults The default options for Windmill.
   */
  getConfig() {
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

        warning(`No dotenv environment file ('.env') has been defined.\nA fresh new copy has been created within: ${process.cwd()}`)

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
      warning("No environment specific configuration has been defined.");
      warning("Windmill will use the default configuration...");
    }

    const config = defaults || {};

    // The source directory with all Windmill specific assets.
    config['src'] = process.env.WINDMILL_SRC = process.env.WINDMILL_SRC || defaults.src;

    // The destination directory for our build.
    config['dist'] = process.env.WINDMILL_DIST = process.env.WINDMILL_DIST || defaults.dist;

    // The recipients to send our mails to.
    config["recipients"] = process.env.WINDMILL_RECIPIENTS = (process.env.WINDMILL_RECIPIENTS ? process.env.WINDMILL_RECIPIENTS.split(",") : []);

    // The root directory where all email templates are defined.
    config["root"] = process.env.WINDMILL_ROOT = process.env.WINDMILL_ROOT || defaults.root;

    // The modules directory where all global partials are defined.
    config["modules"] = process.env.WINDMILL_MODULES = process.env.WINDMILL_MODULES || defaults.modules;

    // The email address where the email is sent from.
    config["sender"] = process.env.WINDMILL_SENDER = process.env.WINDMILL_SENDER || defaults.sender;

    // The email templates to send.
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
   *
   * @returns {Object} Array of paths to each subject template file.
   */
  getEmailTemplates() {
    const source = path.resolve(process.env.WINDMILL_SRC, process.env.WINDMILL_ROOT);

    let emails = [];

    // Check if the `templates` argument is defined by the user.
    if ('templates' in argv && argv.templates !== true) {
      const templates = (argv.templates).split(",");

      // Map each entry email within the arrays key
      emails = _.map(templates, email => {
        const file = path.resolve(source, email);

        if (!fs.existsSync(file)) {
          warning(`Template not found: ${argv.templates}`);
          return;
        }

        return file;
      });

      // Filter out non-excisting email template directories.
      emails = _.compact(emails);
    } else {
      emails = glob.sync(path.resolve(source, '*'));
    }

    return emails;
  }
}
