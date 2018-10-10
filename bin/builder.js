const fs = require("fs");
const juice = require("juice");
const mkdirp = require("mkdirp");
const path = require("path");


const Twig = require("twig");


const error = require("./error");

module.exports = {

  process(templatePath, templateName, data, config) {

    // Twig options
    const options = {
      base: config.src,
      path: templatePath,
      async: false,
      namespaces: {
        "template": path.join(config.src, config.root, templateName)
      }
    }

    // Process the current template path with Twig.
    const template = Twig.twig(options).render(data || {});

    if (!template) {
      return;
    }

    // Get the extension name to filter out.
    const extension = path.extname(templatePath);
    const filename = path.basename(templatePath, extension);

    /**
     * Resolve paths from config.src to config.dist so it can be replaced
     * within a resolved path.
     */
    const src = path.resolve(process.cwd(), config.src);
    const dist = path.resolve(process.cwd(), config.dist);

    // Use the same destination directory structure for the current template.
    const destinationDirectory = path.dirname(templatePath).replace(src, dist);

    // Write the directory to the filesystem.
    mkdirp(destinationDirectory, (err) => {
      if (err) {
        error(err);
      }

      // Write the processed template to the filesystem.
      fs.writeFileSync(path.resolve(destinationDirectory, `${filename}.html`), template);
    });
  }

}
