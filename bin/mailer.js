const Promise = require("bluebird");

const cheerio = require("cheerio");
const htmlToText = require("nodemailer-html-to-text").htmlToText;
const nodemailer = require("nodemailer");
const path = require("path");

const error = require("./error");
const info = require("./info");
const success = require("./success");

module.exports = {
  /**
   * Send an example email for the generated subject.
   *
   * @param {Object} build Processed output from the subject template.
   */
  async send(html, subject, config) {
    if (!html) {
      return;
    }

    // Throw an error if no recipients have been defined.
    if (!config.recipients || config.recipients.length === 0) {
      error(`Unable to send the email since no recipient has been defined.`);
    }

    // Get the extension name to filter out.
    const extension = path.extname(subject);

    // Define the filename for the processed template.
    const subjectName = path.basename(subject, extension);

    // Define the subject line from the title element within from processed html.
    const $ = cheerio.load(html);

    // Define the subject
    // @todo fix title tag within the builder.
    const subjectLine = $('title').text().trim() || `Example email from subject: ${subjectName}`;

    // Define the SMTP credentials from the cache.
    let credentials = {};

    credentials = await new Promise((cb) => {
      nodemailer.createTestAccount((err, account) => {
        if (err) {
          error(err);
        }

        cb(account);
      });
    });

    // Verify the generated credentials.
    if (!credentials) {
      error('No valid transporter credentials are defined, aborting Windmill.');
    }

    // Setup a text account for ethereal.email.
    let transporter = nodemailer.createTransport({
      host: credentials.smtp.host,
      port: credentials.smtp.port,
      secure: credentials.smtp.secure,
      auth: {
        user: credentials.user,
        pass: credentials.pass
      }
    });

    // Nodemailer required options.
    const mailerOptions = {
      from: config.sender,
      subject: subjectLine,
      to: config.recipients[0],
      html: html
    };

    // Extract the text of the generated html and use it as plain text email.
    transporter.use('compile', htmlToText());

    info(`Sending mail for: ${subjectName}`);

    // Send the generated subject from ethereal.email.
    transporter.sendMail(mailerOptions).then((mailInfo) => {
      info(`Message sent: ${mailInfo.messageId}`);
      info(`See preview at: ${nodemailer.getTestMessageUrl(mailInfo)}`);

      success(`Succecfully sent email for subject: ${subjectName}`);
    });
  }
}
