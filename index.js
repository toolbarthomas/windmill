const environment = require("./bin/environment");
const email = require("./bin/email");

module.exports = (() => {
  // Get environment specific variables from the dotenv environment file.
  const config = environment.getConfig();

  // Run Windmill
  email.init(config);
})();
