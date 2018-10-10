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

## Builder

### Binding data
You can store local variables within a seperate JSON file for each email subject.
This JSON file should be defined within the `subjects` directory and the filename
must match with the name of the subject. For example:

```shell
subjects/
 - example.twig # Use example.json to reference variables.
 - example.json # Variables are store within an JSON object.
```

You can also define globals within each template directory that can be used within
the template files. To define a global you should create a json file within
template directory. The filename of the json file should match the name of the
template file.

All globals are available from the `subject` & `template` object and can be
accessed within the template file:

##### Structure:

```shell
templates/
  - example
    - example.json # Object of example.json will used within each subject.
    - subjects/
      welcome.json # Specific variables for subject 'welcome'.
      welcome.twig # Template can access both variables 'from example.json' & 'welcome.json'.
      ...
```

##### Template variables for: example.json
```json
{
  "company": {
    "name": "Barber Bakery",
    "address": "Foo street 1"
  },
}
```

##### Subject variables for: welcome.json
```json
{
  "title": "Greetings stranger...",
  "body": "Lorem ipsum si dolor amet..."
}
```

##### Generates the following globals:

```json
{
  "template" : {
    "name": "Barber Bakery",
    "address": "Foo street 1"
  },
  "subject" {
    "title": "Greetings stranger...",
    "body": "Lorem ipsum si dolor amet..."
  }
}
```


### Binding subject data
Coming soon

### Processing webresources
Coming soon

## Preview in the Browser
Coming soon

## Send an email preview
Coming soon