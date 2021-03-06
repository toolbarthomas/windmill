const Promise = require("bluebird");

const _ = require("lodash");
const fs = require("fs");
const glob = require("glob");
const path = require("path");

const builder = require("./bin/builder");
const environment = require("./bin/environment");
const mailer = require("./bin/mailer");
const styles = require("./bin/styles");
const watcher = require("./bin/watcher");

const error = require("./bin/error");
const info = require("./bin/info");
const warning = require("./bin/warning");

const email = {
  /**
   * Queue each template to process as email.
   * Windmill will try to send all templates within the template directory if
   * no specific file has to be processed.
   * Windmill won't process template directory if `config.argv.watch`
   * equals true.
   *
   * @returns {Object}
   */
  async init() {
    const config = await environment.getConfig();

    // Check if the defined paths within the config file exists.
    environment.validateConfigPaths(config);

    if (!config.templates || config.templates.length === 0) {
      error("No templates are defined to process, aborting Windmill.");
    }

    // Reference this module inside scoped functions.
    const self = this;

    // Spawn the Watch instance;
    if (config.argv.watch) {
      return this.watch();
    }

    // Get all subject to send as email from each defined template directory.
    config.templates.forEach((template, index) => {
      // Queue each subject from the current template directory.
      const subjects = self._getSubjects(template);

      // Define the globals for the current template
      const globals = self._getTemplateGlobals(template);

      const totals = `[ ${index + 1} / ${config.templates.length} ]`;

      if (!subjects) {
        warning(`No subjects are defined for ${path.basename(template)}`);
        return;
      }
      else {
        info((`Building template: ${path.basename(template)} - ${totals}`).toUpperCase());
      }

      // Process each subject template.
      subjects.forEach((subject, index) => {
        self._processSubject(subject, template, globals, config).then((html) => {
          if (!html) {
            warning(`Skipping invalid build: ${subject}.`);
            return;
          }

          // Send an example mail from the generated subject.
          if (config.argv.send) {
            mailer.send(html, subject, config);
          }
        });
      });
    });
  },

  /**
   * Setup a watch instance and process each file seperately.
   */
  watch() {
    // @todo implement watcher
    watcher.init();
  },

  _processSubject(subject, template, globals, config) {
    return new Promise(async (cb) => {
      try {
        const locals = this._getSubjectLocals(subject);
        const templatePath = template || this._getTemplateFromSubject(subject, config);
        const templateGlobals = globals || this._getTemplateGlobals(template);

        // Merge the current subject locals with the template globals
        const data = {
          template: templateGlobals,
          subject: locals
        };

        // Process all stylesheets for the current subject.
        const style = await styles.process(subject, templatePath, config);

        // Generate the html build for the current subject.
        const html = await builder.process(subject, templatePath, data, config);

        // Remove temporary generated stylesheets.
        if (style) {
          await styles.clean(style);
        }

        return cb(html);
      } catch (err) {
        error(err);
      }
    });
  },

  /**
   * Return the path of the template file for the defined subject.
   *
   * @param {String} subject Absolute path of the defined subject.
   * @param {Object} config Windmill configuration object.
   *
   * @retuns {String} Returns the absolute path of the subjects template directory.
   */
  _getTemplateFromSubject(subject, config) {
    const base = path.resolve(process.cwd(), config.src, config.root);

    // Define the relative path without resolving from process.cwd().
    const relativeSubjectPath = subject.replace(base, '');

    // Returns first dirname of the parsed path from the current subject.
    return path.normalize(relativeSubjectPath).split(path.sep)[1];
  },

  /**
   * Get all subject template defined within the `subjects` directory of the
   * current template.
   *
   * @param {String} template Defines the path of the current template.
   *
   * @returns {Object} Array of paths to each subject from the selected template.
   */
  _getSubjects(template) {
    // Get the subject directory for the current template directory.
    const subjectDirectory = path.resolve(template, 'subjects');

    /**
     * Define a new email within the current template for each subject entry
     * from the current template.
     */
    const subjects = glob.sync(path.resolve(subjectDirectory, '*.twig'));

    if (!subjects || subjects.length === 0) {
      return;
    }

    return subjects;
  },

  /**
   * Get the template globals from the json file for of current template.
   *
   * @param {String} template The template to look in to.
   *
   * @returns {Object} Returns a parsed JSON Object.
   */
  _getTemplateGlobals(template) {
    const name = path.basename(template);
    const pathToJson = path.resolve(template, `${name}.json`);

    if (!fs.existsSync(pathToJson)) {
      return {};
    }

    if (!fs.statSync(pathToJson).size) {
      return {};
    }

    return JSON.parse(fs.readFileSync(pathToJson)) || {};
  },

  /**
   * Get the subject local variables from the additional json file of the
   * current subject.
   *
   * @param {String} subject
   *
   * @returns {Object} Returns a parsed JSON Object.
   */
  _getSubjectLocals(subject) {
    const extension = path.extname(subject);
    const pathToJson = subject.replace(extension, '.json');

    if (!fs.existsSync(pathToJson)) {
      return {};
    }

    if (!fs.statSync(pathToJson).size) {
      return {};
    }

    return JSON.parse(fs.readFileSync(pathToJson));
  }
}

module.exports = email.init();
