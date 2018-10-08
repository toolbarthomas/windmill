# Windmill
Build & test email templates with Nodemailer.

## Installation
Coming soon

## Configuration
You can set specific configuration for Windmill by defining an environment file
[dotenv](https://www.npmjs.com/package/dotenv) within working directory for NODE.

The folowing Environment variables can be defined within this file.

- **WINDMILL_SRC** - Defines the source directory for all Windmill assets & templates.
- **WINDMILL_DIST** - Defines the destination directory for Windwill build processes.
- **WINDMILL_RECIPIENTS** - Sends all processed emails to. Multiple values seperated with a comma are accepted.
- **WINDMILL_ROOT** - Defines the root directory where each email template is defined.
- **WINDMILL_SENDER** - The email address of the sender.
