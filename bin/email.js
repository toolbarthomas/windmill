const _ = require("lodash");
const fs = require("fs");
const glob = require("glob");
const path = require("path");

const builder = require("./builder");
const error = require("./error");
const message = require("./message");
const success = require("./success");

module.exports = {
  /**
   * Queue each template to process as email.
   * Windmill will try to send all templates within the template directory if
   * no specific file has to be processed.
   *
   * @param {Object} config Use Windmill configuration object.
   *
   * @returns {Object}
   */
  init(config) {
    if (!config.templates || config.templates.length === 0) {
      error("No email template is defined for Windmill, aborting...");
    }

    const self = this;

    // Get all subject to send as email from each defined template directory.
    config.templates.forEach(function (template, index) {
      // Queue each subject from the current template directory.
      const subjects = self.getSubjects(template);

      // Define the globals for the current template
      const globals = self.getTemplateGlobals(template);

      if (!subjects) {
        message(`No subjects are defined for ${path.basename(template)} - [${index + 1} of ${config.templates.length}]`);
        message(`Skipping template: ${path.basename(template)} - [${index + 1} of ${config.templates.length}]`);
        return;
      }
      else {
        message(`Building subjects from template: ${template} - [${index + 1} of ${config.templates.length}]`);
      }

      subjects.forEach(function (subject, index) {
        const locals = self.getSubjectLocals(subject);

        // Merge the current subject locals with the template globals
        const data = {
          template: globals,
          subject: locals
        };

        // Process all resources for the current subject.
        builder.process(subject, template, data, config);
      });
    });
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
