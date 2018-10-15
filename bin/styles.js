const Promise = require("bluebird");

const fs = require("fs");
const path = require("path");
const mkdirp = require("mkdirp");
const rimraf = require("rimraf");
const sass = require("node-sass");

const error = require("./error");
const info = require("./info");
const success = require("./success");

module.exports = {
  /**
   * Check if the current subject has a scss file defined and process it.
   *
   * @param {String} subject Absolute path of the subject template file.
   * @param {String} template Absolute path of the template directory.
   * @param {Object} config Windmill configuration.
   *
   * @return {String}
   */
  process(subject, template, config) {
    return new Promise((cb) => {
      const templateExtension = path.extname(subject);
      const stylesheet = subject.replace(templateExtension, ".scss");

      /**
       * Process the stylesheet and write it in the same directory.
       * The proccesed stylsheet will be removed after the template is built.
       */
      const destination = stylesheet.replace(".scss", ".css");

      if (!fs.existsSync(stylesheet)) {
        info(`Not found, skipping: ${stylesheet}`);
        return;
      }

      info(`Processing: ${stylesheet}`);

      const styles = sass.renderSync({
        file: stylesheet,
        includePaths: [
          template
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

        return cb(destination);
      });
    });
  },

  /**
   * Remove the temporary processed file for the current subject.
   */
  clean(path) {
    return new Promise((cb) => {
      if (!fs.existsSync(path)) {
        return cb();
      }

      rimraf(path, (err) => {
        if (err) {
          error(err);
        }

        return cb();
      });
    })
  }
}
