## 🚧This repo is no longer actively maintained but we still review and accept any pull requests

### Upgrading from 1.0.0 to 2.0.0

As of 2.0.0 `validate` returns a promise that resolves with the `AlertType` depending on the result of the ManUp run. one of:

- `AlertType.OPTIONAL` - An optional update is available
- `AlertType.MANDATORY` - A mandatory update is required
- `AlertType.MAINTENANCE` - Application is disabled
- `AlertType.NOP` No alerts were shown - all good to initialize as normal

If the result is `null` it means there was an error fetching the ManUp result somewhere and ManUp could not resolve properly.

This allows your app code to behave differently depending on the result.

# Mandatory Update for Ionic 2+

[![Build
Status](https://travis-ci.org/NextFaze/ionic-manup.svg?branch=master)](https://travis-ci.org/NextFaze/ionic-manup)
[![Coverage
Status](https://coveralls.io/repos/github/NextFaze/ionic-manup/badge.svg)](https://coveralls.io/github/NextFaze/ionic-manup)

Sometimes you have an app which talks to services in the cloud. Sometimes,
those services change, and your app no longer works. Wouldn't it be great if
the app could let the user know there's an update? That's what this module
does.

Mandatory Update (manup) works like this:

1.  Your app starts up, before performing any application initialization, it
    downloads a small file from a remote server

2.  The small file contains the following information

    - The current latest version of the app
    - The minimum required version
    - Whether the app is enabled

3.  The app compares itself with the version metadata, and presents an alert to
    the user. Alerts come in three flavours

    - Mandatory Update required. The user will be notified that they need to
      update to continue. The alert has a link to the relevant app store.
    - Optional Update. The user will be notified there is an update, but will
      have the option to continue using the current version
    - Maintenance Mode. The user will be notified that the app is unavailable,
      and to try again later.

4.  The app waits for the manup service to complete, then continues
    initialisation like normal

## Requirements

- Ionic >2 (Currently up to 4)
- Angular >2
- `@ionic/storage` (used for caching)
- `@ionic-native/app-version`
- `cordova-plugin-app-version`
- `@ionic-native/in-app-browser`
- `cordova-plugin-inappbrowser` to launch the link to the app/play store

In your ionic project root:

```sh
npm install --save @ionic/storage @ionic-native/app-version @ionic-native/in-app-browser
ionic cordova plugin add cordova-plugin-app-version
ionic cordova plugin add cordova-plugin-inappbrowser
```

Manup assumes you are using Semantic Versioning for your app.

### Optional

- `@ngx-translate/core` Needed to handle translations

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
    "url": "http://example.com/myAppUpdate",
    "enabled": true
  },
  "android": {
    "latest": "2.5.1",
    "minimum": "2.1.0",
    "url": "http://example.com/myAppUpdate/android",
    "enabled": true
  }
}
```

### Import the module into your app

Import the module into your `app.module.ts` file, and call `ManUpModule.forRoot`, providing the URL to your metadata file:

```ts
import { ManUpModule } from 'ionic-manup';

// in your module's import array
ManUpModule.forRoot({ url: 'https://example.com/manup.json' });
```

### Run the manup service before doing any application initialisation logic

Modify your `app.component` class to call ManupService.validate():

`validate` returns a promise that resolves with an `AlertType` depending on the result. one of:

- `AlertType.OPTIONAL` - An optional update is available
- `AlertType.MANDATORY` - A mandatory update is required
- `AlertType.MAINTENANCE` - Application is disabled
- `AlertType.NOP` No alerts were shown - all good to initialize as normal

If the result is `null` it means there was an error fetching the ManUp result somewhere and ManUp could not resolve properly.

This allows your app code to behave differently depending on the result.

```ts
import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { ManUpService } from 'ionic-manup';

@Component({
  templateUrl: 'app.html',
})
export class MyApp {
  constructor(platform: Platform, private manup: ManUpService) {
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      StatusBar.styleDefault();
      Splashscreen.hide();

      manup.validate().then((result) => {
        // app initialisation depending on result
      });
    });
  }
}
```

## Provide strings remotely

One way to provide strings remotely is to [use remote translation configuration](#Internationalisation-Support)

However, you can also configure the service to read messages directly from the ManUp json file:

```
{
  "ios": {
    "latest": "2.4.1",
    "minimum": "2.1.0",
    "url": "http://example.com/myAppUpdate",
    "enabled": true,
    "alerts": {
      "maintenance": {
        "title": "MyApp is currently no available",
        "text": "We are performing some server updates and expect to be back in 2-3 hours"
      },
      "mandatory": {
        "title": "New update required",
        "text": "Our latest version fixes some critical bugs and is required to continue."
      },
      "optional": {
        "title": "New update available",
        "text": "A new update is available! It has some cool features."
      }
    }
  },
  "android": {
    "latest": "2.5.1",
    "minimum": "2.1.0",
    "url": "http://example.com/myAppUpdate/android",
    "enabled": true,
    "alerts": {
      // ... you could either use the same alerts for Android or different
    }
  }
}
```

## Internationalisation Support

The service uses [ngx-translate](https://www.npmjs.com/package/ng2-translate) to support languages other than English. This package is the way [recommended](https://ionicframework.com/docs/v2/resources/ng2-translate/) by the Ionic developers.

If you are using ngx-translate it is important you set the current and default languages _before_ validating ManUp:

```ts
translateService.defaultLang = 'en';
translateService.currentLang = 'es';
manup.validate().then((err) => {
  // app init depending on result
});
```

As a fallback, ManUp will default to English.

### With Built in translations

To make life easy for app developers, the service includes its own translation strings. All you need to do is add `ngx-translate` to your Ionic app and set the active language. Due to the way AOT works, you also need to provide a `TRANSLATE_SERVICE` for ManUp to use.

Languages supported are currently limited to English, Italian and a Google Translated Spanish. We would love pull requests for new languages. To add a language:

- Create a new file `[lang].ts` for your language.
- Using `en.ts` as an example, add the translations
- Add the new language to `i18n/index.ts`

#### Boostrap ngx-translate with your app!

```ts
    import { ManUpModule, ManUpService, TRANSLATE_SERVICE } from 'ionic-manup';
    import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';


    @NgModule({
      declarations: [MyApp, HomePage],
      imports: [
        ...
        ManUpModule.forRoot({
          url: 'https://example.com/manup.json',
          externalTranslations: true
        }),
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: translateLoader,
            deps: [HttpClient]
          }
        })
      ],
      providers: [
        { provide: TRANSLATE_SERVICE, useClass: TranslateService },
        ManUpService,
      ],
    })
```

Note: This is an absolute bare minimum example of loading the module. Follow the instructions linked to above for how to use `ngx-translate` in your app.

### With your own strings

If you want to further customise the messages, you can provide your own translations for the ManUp strings. _This is the only way we will be supporting customisation of the messages_.

#### Setup your language files

Follow the instructions for setting up `ngx-translate` with your Ionic 2 app, and add the following tree to your language files:

```json
 {
   ...

    "manup": {
        "mandatory": {
            "title": "Update Required",
            "text": "An update to {{app}} is required to continue."
        },
        "optional": {
            "title": "Update Available",
            "text": "An update to {{app}} is available. Would you like to update?"
        },
        "maintenance": {
            "title": "{app}} Unavailable",
            "text": "{{app}} is currently unavailable, please check back again later."
        },
        "buttons": {
            "update": "Update",
            "later": "Not Now"
        }
    }
 }
```

#### Tell ManUp to use external translations

You need to tell ManUp to use external translations. Modify your Bootstrap like this:

```ts
import { ManUpModule } from 'ionic-manup';

// in your module's import array
ManUpModule.forRoot({ url: 'https://example.com/manup.json', externalTranslations: true });
```

## Demonstration App

A demonstration app is in the `manup-demo` folder. This is the default Ionic 2 starter app, with ManUp added.

```sh
cd manup-demo
ionic cordova emulate ios
```

Assuming you have Ionic installed.

![Mandatory Update](https://raw.githubusercontent.com/NextFaze/ionic-manup/master/images/mandatory.png)
![Mandatory Update](https://raw.githubusercontent.com/NextFaze/ionic-manup/master/images/optional.png)
