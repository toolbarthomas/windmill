const _ = require("lodash");
const fs = require("fs");
const glob = require("glob");
const path = require("path");

const builder = require("./bin/builder");
const environment = require("./bin/environment");
const mailer = require("./bin/mailer");

const error = require("./bin/error");
const info = require("./bin/info");
const success = require("./bin/success");

const email = {
  /**
   * Queue each template to process as email.
   * Windmill will try to send all templates within the template directory if
   * no specific file has to be processed.
   *
   * @param {Object} config Windmill configuration object.
   *
   * @returns {Object}
   */
  init() {
    const config = environment.getConfig();

    // Check if the defined paths within the config file exists.
    environment.validateConfigPaths(config);

    if (!config.templates || config.templates.length === 0) {
      error("No templates are defined to process, aborting Windmill.");
    }

    const self = this;

    if (config.argv.watch) {
      return;
    }

    // Get all subject to send as email from each defined template directory.
    config.templates.forEach(function (template, index) {
      // Queue each subject from the current template directory.
      const subjects = self.getSubjects(template);

      // Define the globals for the current template
      const globals = self.getTemplateGlobals(template);

      const totals = `[ ${index + 1} of ${config.templates.length} ]`;

      if (!subjects) {
        info(`No subjects are defined for ${path.basename(template)} - ${totals}`);
        info(`Skipping template: ${path.basename(template)} - ${totals}`);
        return;
      }
      else {
        info(`Building subjects from template: ${template} - ${totals}`);
      }

      subjects.forEach((subject) => {
        const locals = self.getSubjectLocals(subject);

        self.processSubject(subject, template, locals, globals, config).then((build) => {
          mailer.send(build);
        });
      });
    });
  },

  processSubject(subject, template, locals, globals, config) {
    return new Promise(async (cb) => {
      try {
        const templatePath = template || this.getTemplateFromSubject(subject, config);
        const templateGlobals = globals || this.getTemplateGlobals(template)

        // Merge the current subject locals with the template globals
        const data = {
          template: templateGlobals,
          subject: locals
        };

        // Process all resources for the current subject.
        const build = await builder.process(subject, templatePath, data, config);

        return cb(build);
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
  getTemplateFromSubject(subject, config) {
    const base = path.resolve(process.cwd(), config.src, config.root);

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
  getSubjects(template) {
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
  getTemplateGlobals(template) {
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
  getSubjectLocals(subject) {
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
