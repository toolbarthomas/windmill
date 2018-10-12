const error = require("./error");
const info = require("./info");
const success = require("./success");

module.exports = {
  /**
   * Send an example email for the generated subject.
   *
   * @param {Object} build Processed output from the subject template.
   */
  send(build) {
    if (!build) {
      return;
    }

    info("Sending example mail...");
  }
}
