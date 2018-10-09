# Windmill
Build & test email templates with Nodemailer.

Currently in development...

## Installation
Install the latest Windmill with [NPM](https://www.npmjs.com) (We assume you have pre-installed [node.js](https://nodejs.org)).

```bash
$ npm install @toolbarthomas/windmill
```

## First setup
Coming soon

## Custimize your setup
You can set specific configuration for Windmill by defining an environment file
([dotenv](https://www.npmjs.com/package/dotenv)) within working directory for NODE.

The following Environment variables can be defined within this file.

```shell
  WINDMILL_SRC # The source directory with all Windmill specific assets.
  WINDMILL_DIST # The destination directory for our build.
  WINDMILL_RECIPIENTS # The recipients to send our mails to.
  WINDMILL_ROOT # The root directory where all email templates are defined.
  WINDMILL_MODULES # The modules directory where all global partials are defined.
  WINDMILL_SENDER # The email address where the email is sent from.
```

## Usage (NPM)
After you have setup Windmill you can use it by running the following command:

```bash
$ windmill
```

Windmill will process all templates by default, but you also can process a single
template by adding the template directory name. For example:

```bash
$ windmill example # Will only process all subjects within template directory 'example'.
```

## Template structure

### Templates
Coming soon

### Subjects
Coming soon

### Modules
Coming soon

## Binding template data
Coming soon

## Processing webresources
Coming soon

## Preview in the Browser
Coming soon

## Send an email preview
Coming soon