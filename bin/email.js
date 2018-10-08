const fs = require("fs");
const glob = require("glob");
const path = require("path");

const message = require("./message");
const error = require("./error");

module.exports = {
  /**
   * Queue each template to process as email.
   * Windmill will try to send all templates within the template directory if
   * no specific file has to be processed.
   *
   * @param {Object} config Use Windmill configuration object.
   */
  getQue(config) {
    if (!config.templates || config.templates.length === 0) {
      error("No email template is defined for Windmill, aborting...");
    }

    // Queue all the Nodemailer tranpsporter objects.
    let transporters = [];

    // Get all subject to send as email from each defined template directory.
    config.templates.forEach(function (template) {
      // Get the subject directory for the current template directory.
      const subjectDirectory = path.resolve(template, 'subjects');

      /**
       * Define a new email within the current template for each subject entry
       * from the current template.
       */
      const subjects = glob.sync(path.resolve(subjectDirectory, '*.twig'));

      // Queue each subject from the current template directory.
      const subjectQueue = this.getSubjects(subjects);
    });

    return transporters;
  },

  /**
   * Get all subject template defined within the `subjects` directory of the
   * current template.
   */
  getSubjects(subjects) {

  }
}
