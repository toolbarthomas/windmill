const Twig = require("twig");
const Promise = require("bluebird");

const fs = require("fs");
const juice = require("juice");
const mkdirp = require("mkdirp");
const path = require("path");
const inliner = Promise.promisifyAll(require("web-resource-inliner"));

const error = require("./error");
const info = require("./info");
const success = require("./success");

module.exports = {

  /**
   * Build a html output for each defined `subject`. Also returns generated build
   * to setup an example email.
   *
   * @param {String} subject Absolute path of the subject template file.
   * @param {*} template Absolute path of the template directory.
   * @param {*} data Defines templates data from template & subject JSON files.
   * @param {*} config Windmill configuration.
   *
   * @returns {Object} Outputs html, content and title used to send the example email.
   */
  async process(subject, template, data, config) {
    // Get the directory name of the template directory of the current subject.
    const templateName = path.basename(template);

    // Get the extension name to filter out.
    const extension = path.extname(subject);

    // Define the filename for the processed template.
    const subjectName = path.basename(subject, extension);

    /**
     * Resolve paths from config.src to config.dist so it can be replaced
     * within a resolved path.
     */
    const src = path.resolve(process.cwd(), config.src);
    const dist = path.resolve(process.cwd(), config.dist);

    // Use the same destination directory structure for the current template.
    const destinationDirectory = path.dirname(subject).replace(src, dist);
    const destinationPath = path.resolve(destinationDirectory, `${subjectName}.html`);

    // Twig options
    const twigOptions = {
      base: config.src,
      path: subject,
      async: false,
      namespaces: {
        // "modules": path.join(config.src, config.modules), // @todo: Fix multiple namespace bug.
        "template": path.join(config.src, config.root, templateName)
      }
    }

    info(`Preprocessing template from subject: ${subjectName}.`);

    // Process the current template path with Twig.
    const render = Twig.twig(twigOptions).render(data || {});

    if (!render) {
      return;
    }

    success('Subject template preprocessed!');

    // web-resource-inliner options
    const inlinerOptions = {
      fileContent: render,
      images: false,
      relativeTo: destinationDirectory // Set relative path of subject to template path.
    };

    info(`Embedding resources for subject: ${subjectName}`);

    // Inline all resources defined within the processed html template.
    let embedded;
    await new Promise((cb) => {
      inliner.html(inlinerOptions, (err, result) => {
        if (err) {
          error(err);
        }

        embedded = result;
        cb();
      });
    });

    success(`Resources embedded for subject: ${subjectName}`);

    info(`Inlining resources for subject: ${subjectName}`);

    const inlined = await juice(embedded);

    success(`Resources inlined for subject: ${subjectName}`);

    if (!inlined) {
      return;
    }

    const output = inlined;

    // Generate the template first before we continue.
    await this.generate(destinationPath, destinationDirectory, output);

    return output;
  },

  generate(destinationPath, destinationDirectory, output) {
    return new Promise(cb => {
      info(`Creating template: ${destinationPath}`);

      // Write the directory to the filesystem.
      mkdirp(destinationDirectory, (err) => {
        if (err) {
          error(err);
        }

        // Write the processed template to the filesystem.
        fs.writeFileSync(destinationPath, output);

        success(`Template created: ${destinationPath}`);

        cb();
      });
    });
  }
}
