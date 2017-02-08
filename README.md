# Mandatory Update for Ionic 2

[![Build
Status](https://travis-ci.org/NextFaze/ionic-manup.svg?branch=master)](https://travis-ci.org/NextFaze/ionic-manup)
[![Coverage
Status](https://coveralls.io/repos/github/NextFaze/ionic-manup/badge.svg)](https://coveralls.io/github/NextFaze/ionic-manup)

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
 * `ionic-native` (needed to get the app version and name) 
 * `@ionic/storage` (used for caching)
 * `cordova-plugin-app-version` to get the installed app name and version
 * `cordova-plugin-inappbrowser` to launch the link to the app/play store

In your ionic project root:

```sh
npm install --save @ionic/storage ionic-native
ionic plugin add cordova-plugin-app-version
ionic plugin add cordova-plugin-inappbrowser
```

Manup assumes you are using Semantic Versioning for your app.

## Installation

```sh
npm install --save ionic-manup
```

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
  "android": {
    "latest": "2.5.1",
    "minimum": "2.1.0",
    "link": "",
  },
  "enabled": true
}
```

### Import the module into your app

Import the module into your `app.module.ts` file, and call `ManupModule.forRoot`, providing the URL to your metadata file:

```ts
    import { ManupModule } from 'ionic-manup';

    // in your module's import array
    ManupModule.forRoot({url: 'https://example.com/manup.json'})
```

### Run the manup service before doing any application initialisation logic

Modify your `app.component` class to call ManupService.validate():

`validate` returns a promise that resolves if the version check was ok and the app can continue initialising.

```ts
import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { ManupService } from 'ionic-manup';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {

  constructor(platform: Platform, private manup: ManupService) {
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      StatusBar.styleDefault();
      Splashscreen.hide();

      manup.validate().then( () => {
        // app initialisation
      })

    });
  }
}
```


## Demonstration App

A demonstration app is in the `manup-demo` folder. This is the default Ionic 2 tabs starter app, with Manup added.

```sh
cd manup-demo
ionic emulate ios
```

Assuming you have Ionic installed.

![Mandatory Update](https://raw.githubusercontent.com/NextFaze/ionic-manup/master/images/mandatory.png)
![Mandatory Update](https://raw.githubusercontent.com/NextFaze/ionic-manup/master/images/optional.png)
