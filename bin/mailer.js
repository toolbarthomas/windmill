const cheerio = require("cheerio");
const htmlToText = require("nodemailer-html-to-text").htmlToText;
const nodemailer = require("nodemailer");
const path = require("path");

const error = require("./error");
const info = require("./info");
const warning = require("./warning");

module.exports = {
  /**
   * Send an example email for the generated subject.
   *
   * @param {Object} build Processed output from the subject template.
   */
  send(html, subject, config) {
    if (!html) {
      return;
    }

    // Throw an error if no sender has been defined.
    if (!config.sender) {
      warning("Unable to send the test email. No email address has been defined for the sender.");
      return;
    }

    // Throw an error if no recipients have been defined.
    if (!config.recipients || config.recipients.length === 0) {
      warning("Unable to send the test mail. No recipients have been defined.");
      return;
    }

    // Define the subject line from the title element within from processed html.
    const $ = cheerio.load(html);

    // Define the subject
    // @todo fix title tag within the builder.
    const subjectLine = $('title').text().trim() || `Example email from subject: ${path.basename(subject)}`;

    nodemailer.createTestAccount((err, account) => {
      if (err) {
        error(err);
      }

      let transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: account.user,
          pass: account.pass
        }
      });

      // Extra the text of the generated html and use it as plain text email.
      transporter.use('compile', htmlToText());

      // Send the generated subject from ethereal.email.
      transporter.sendMail({
        from: config.sender,
        subject: subjectLine,
        to: config.recipients,
        html: html
      });

      info(`Sending mail for: ${path.basename(subject)}`);
    });
  }
}
