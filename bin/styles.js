const fs = require("fs");
const path = require("path");
const mkdirp = require("mkdirp");
const sass = require("node-sass");

const error = require("./error");
const info = require("./info");
const success = require("./success");

module.exports = {
  async process(subject, templatePath, data, config) {
    const templateExtension = path.extname(subject);
    const stylesheet = subject.replace(templateExtension, ".scss");

    /**
     * Resolve paths from config.src to config.dist so it can be replaced
     * within a resolved path.
     */
    const src = path.resolve(process.cwd(), config.src);
    const dist = path.resolve(process.cwd(), config.dist);

    const destination = stylesheet.replace(src, dist).replace(".scss", ".css");

    if (!fs.existsSync(stylesheet)) {
      info(`Not found, skipping: ${stylesheet}`);
      return;
    }

    info(`Processing: ${stylesheet}`);

    const styles = sass.renderSync({
      file: stylesheet,
      includePaths: [
        templatePath
      ],
      sourceMap: false,
      outFile: destination
    });

    // Don't write empty files
    if (!("css" in styles) || (styles.css.length <= 0)) {
      return;
    }

    mkdirp(path.dirname(destination), (err) => {
      if (err) {
        error(err);
      }

      fs.writeFileSync(destination, styles.css);
    });
  }
}
