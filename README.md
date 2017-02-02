# Mandatory Update for Ionic 2

Sometimes you have an app which talks to services in the cloud. Sometimes,
those services change, and your app no longer works. Wouldn't it be great if
the app could let the user know there's an update? That's what this module
does.

Mandatory Update (manup) works like this:

1. Your app starts up, before performing any application initialization, it
   downloads a small file from a remote server

2. The small file contains the following information

   * The current latest version of the app
   * The minimum required version
   * Whether the app is enabled

3. The app compares itself with the version metadata, and presents an alert to
   the user. Alerts come in three flavours

   * Mandatory Update required. The user will be notified that they need to
     update to continue. The alert has a link to the relevant app store.

   * Optional Update. The user will be notified there is an update, but will
     have the option to continue using the current version

   * Maintenance Mode. The user will be notified that the app is unavailable,
     and to try again later.

4. The app waits for the manup service to complete, then continues
   initialisation like normal

## Requirements

 * Ionic 2 
 * Angular 2.x
 * semver

Manup assumes you are using Semantic Versioning for your app.

## Installation

    npm install --save ionic-manup

## Usage

### Remote file
You need a hosted json file that contains the version metadata. This _could_ be part of your API. However, 
often the reason for maintenance mode is because your API is down. An s3 bucket may be a safer bet,
even though it means a little more work in maintaining the file.

```json
{
  "ios": {
    "latest": "2.4.1",
    "minimum": "2.1.0",
    "link": "",
  },
  android: {
    "latest": "2.5.1",
    "minimum": "2.1.0",
    "link": "",
  },
  "enabled": true
}
```

### Import the module into your app

### Run the manup service before doing any application initialisation logic
