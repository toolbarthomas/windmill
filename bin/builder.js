const Twig = require("twig");
const Promise = require("bluebird");

const fs = require("fs");
const juice = require("juice");
const mkdirp = require("mkdirp");
const path = require("path");
const inliner = Promise.promisifyAll(require("web-resource-inliner"));

const error = require("./error");
const message = require("./message");
const success = require("./success");

module.exports = {

  process(subject, template, data, config) {
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

    message(`Preprocessing template from subject: ${subjectName}.`);

    // Process the current template path with Twig.
    const render = Twig.twig(twigOptions).render(data || {});

    if (!render) {
      return;
    }

    success('Done - Subject template preprocessed!');

    // web-resource-inliner options
    const inlinerOptions = {
      fileContent: render,
      relativeTo: config.src
    };

    message(`Embedding resources for subject: ${subjectName}.`);

    // Inline all resources defined within the processed html template.
    let embedded;

    inliner.html(inlinerOptions, (err, result) => {
      if (err) {
        error(err);
      }

      embedded = result;
    });

    success(`Done - Resources embedded for subject: ${subjectName}.`);

    message(`Inlining resources for subject ${subjectName}.`);

    const inlined = juice(embedded);

    message(`Done - Resources inlined for subject ${subjectName}.`);

    if (!inlined) {
      return;
    }

    const output = inlined;

    message(`Writing subject to: ${destinationDirectory}`)

    // Write the directory to the filesystem.
    mkdirp(destinationDirectory, (err) => {
      if (err) {
        error(err);
      }

      // Write the processed template to the filesystem.
      fs.writeFileSync(path.resolve(destinationDirectory, `${subjectName}.html`), output);

      success(`Done - Subject processed to: ${subject}`);
    });
  }

}
