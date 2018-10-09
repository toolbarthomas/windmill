const environment = require("./bin/environment");
const email = require("./bin/email");

module.exports = (() => {
  // Default configuration for Windmill.
  const defaults = {
    src: "./src",
    dist: "./dist",
    recipients: [],
    root: 'templates',
    sender: 'windmill@example.com',
    templates: []
  };

  // Get environment specific variables from the dotenv environment file.
  const config = environment.getConfig(defaults);

  // Get all email templates defined within ``
  const emails = email.init(config);
})();
