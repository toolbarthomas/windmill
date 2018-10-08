const _ = require("lodash");
const fs = require("fs");
const glob = require("glob");
const path = require("path");

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
  getQueue(config) {
    if (!config.templates || config.templates.length === 0) {
      error("No email template is defined for Windmill, aborting...");
    }

    // Queue all the Nodemailer tranpsporter objects.
    let transporters = [];
    const $this = this;

    // Get all subject to send as email from each defined template directory.
    config.templates.forEach(function (template, index) {
      // Queue each subject from the current template directory.
      const subjects = $this.getSubjects(template);

      if (!subjects) {
        message(`No subjects are defined for ${path.basename(template)} - [${index + 1} of ${config.templates.length}]`);
        message(`Skipping template: ${path.basename(template)} - [${index + 1} of ${config.templates.length}]`);
        return;
      }
      else {
        message(`Queuing template: ${path.basename(template)} - [${index + 1} of ${config.templates.length}]`);
      }

      subjects.forEach(function (subject, index) {
        const extension = path.extname(subject);
        const basename = path.basename(subject, extension);
        const dirname = path.dirname(subject);

        message(`Processing subject: ${_.startCase(basename)}`);

        // @todo - built transport for current Subject

        message(`Successfully processed subject: ${_.startCase(basename)}`);
      });
    });

    if (!transporters || transporters.length === 0) {
      error("No valid email template could be found, aborting Windmill...");
    }

    return transporters;
  },

  /**
   * Get all subject template defined within the `subjects` directory of the
   * current template.
   *
   * @param {String} template Defines the path of the current template.
   *
   * @returns {Object}
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
  }
}
