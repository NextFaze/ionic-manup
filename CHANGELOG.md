# 2.0.0 2020-07-24 - Support custom messages and ManUp failures

See the READMe for update path.

- Return the result of the ManUp run #26

the call to `validate()` will now resolve with either:

1. the `AlertType` result that happened or
2. `null` if ManUp fails for some reason.

- Allow support for custom messages

- Fix calling `validate()` multiple times in one launch returning the same result.

See the README for information on how to configure these messages in your ManUp file

# 1.0.0 2020-01-24 - Support Ionic 4

Add support to Ionic 4. Thanks to @Mohammad-shoman

# 0.4.1 2018-09-24 - Fix optional update

Bug fix release corrects a problem where the `validate` promise was not
resolving even after the update alert had been dismissed. Thanks to @kfrederix
for finding and providing the fix to this!

# 0.4.0 2018-05-16 - Fix i18n issues, add Italian language

This release fixes issues with how ngx-translate was being used with ManUp. ManUp now loads its translation strings just before it needs to prevent an alert. Previously, it loaded translation strings on initialisation. This could cause issues with the host app losing translation strings, or ManUp showing raw untranslated strings to the user when presenting an alert.

All detailed in #31

## Italian Language Support

This release also adds translation support for Italian language! Thanks @grcasanova for the contribution!

# 0.3.5 2018-04-03 - Deal with non-cordova platforms

Bugfix release which stops ManUp throwing an unhandled exception if running on a non-Cordova platform (ie web). ManUp does not present alerts on web, because we assume the web is always on the latest version.

Not crashing with an exception is much better thand crashing.

# 0.3.4 2017-12-08 - Fix App Store Buttons

This patch release fixes #28, making the buttons linking the user to update sites work again. Thanks to @yanglongji for flagging this bug.

# 0.3.3 2017-11-13 -

This release fixes a bug where validate would always succeed, regardless of app version. Underlying bug caused by missing rxjs operator, which has now been resolved.

Thanks @TheMadBug for bringing #24 to our attention

# 0.3.1 2017-11-08 -

This release fixes an issue where ManUp threw an unhandled exception if the
http request failed, for example if the browser aborted the request due to
failed CORS preflight checks

# 0.3.0 2017-10-11 - _Dep Updates_

This release updates dependencies to the latest versions, which closes a few issues. This release has _breaking changes_ compared to `0.2`

## Use @ionic-native

Ionic has restructured Ionic Native into multiple packages, rather than one monolith. We now use `@ionic-native/*` package dependencies now too. This closes #13

### Update Instructions

Remove `ionic-native` unless you are still using it elsewhere in your app, then install the correct packages:

    npm uninstall --save ionic-native
    npm install --save @ionic-native/app-version @ionic-native/in-app-browser

## Truly optional ngx-translate

This release also updates to a more current `ngx-translate` and also fixes #16, making `ngx-translate` a truly optional dependency.

### Update instructions (I don't want translations)

Just uninstall `ngx-translate`

    npm uninstall --save @ngx-translate/core

### Update Instructions (I want translations)

You now need to add a provider for the translate service in order for the Angular DI to work properly. Full details are in the README and an example is in the demo app, but you need to update your application bootstrap:

    import { ManUpModule, ManUpService, TRANSLATE_SERVICE } from 'ionic-manup';

    @NgModule({
      declarations: [MyApp, HomePage],
      imports: [
        ...
        ManUpModule.forRoot({
          url: 'https://example.com/manup.json',
          externalTranslations: true
        })
      ],
      providers: [
        { provide: TRANSLATE_SERVICE, useClass: TranslateService },
        ManUpService,
      ],
    })

The rest should work same as before.

# 0.2.1 - 2017-07-18

This is a minor update that changes the peer dependency from ng2-translate to the current ngx-translate. Thanks @zbarbuto for the update.

# 0.2.0 - 2017-04-28 _Local Storage_

This release integrates ionic-native/storage. ManUp will save the metadata from the remote URL to Storage. If for some reason the remote URL cannot be reached, ManUp will use the cached version in Local Storage.

To get this functionality your app needs to be bootstrapped with Ionic Storage. If Storage is not in use, ManUp will continue working in the same way it did in the previous version.

# 0.1.0 - 2017-03-17 _i18n_

Welcome to `0.1.0`, ManUp is now a global citizen, supporting internationalisation via the `ng2-translate` package.

Well kindof. The only languages currently supported are English, and a Google Translate attempt at Spanish. PRs for translations in additional languages will be welcomed with open arms.

## Using i18n

The service uses [ng2-translate](https://www.npmjs.com/package/ng2-translate) to support languages other than English. This package is the way [recommended](https://ionicframework.com/docs/v2/resources/ng2-translate/) by the Ionic developers. Internationalisation is implemented in a backwards compatible, optional way. If your app is bootstrapped with `ng2-translate`, then ManUp will use it. If not you get the default English Strings.

### With Built in translations

To make life easy for app developers, the service includes its own translation strings. All you need to do is add `ng2-translate` to your Ionic app and set the active language.

Languages supported are currently limited to English and a Google Translated Spanish. We would love pull requests for new languages.

#### Boostrap ng2-translate with your app!

```ts
import { ManUpModule } from 'ionic-manup';
import { TranslateModule } from 'ng2-translate';

// in your module's import array
TranslateModule.forRoot(), ManUpModule.forRoot({ url: 'https://example.com/manup.json' });
```

Note: This is an absolute bare minimum example of loading the module. Follow the instructions linked to above for how to use `ng2-translate` in your app.

### With your own strings

If you want to further customise the messages, you can provide your own translations for the ManUp strings. _This is the only way we will be supporting customisation of the messages_.

#### Setup your language files

Follow the instructions for setting up `ng2-translate` with your Ionic 2 app, and add the following tree to your language files:

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

# 0.0.6 - 2017-03-03

A minor release that fixes a problem with type definitions that should have been fixed in 0.0.5 but wasn't.

# 0.0.5 - 2017-02-17 _Metadata Stability_

0.0.5 has some breaking changes to what the `manup.json` metadata file should look like. I expect the format will be stable going forward, perhaps with new keys added, but no more breaking changes to what the file should look like.

## New Stuff

- Adds support for the windows platform (yay!)
- Mostly refactoring code to more easily test

## Breaking Changes

### Rename to ManUp

We started with the project using `Manup` in code. However, since that is short for Mandatory Update, the module and service have been renamed to `ManUpModule` and `ManUpService`. Strict camel case for the win.

### Metadata JSON

Here's a complete example, below are the things that have changed from 0.0.4.

```json
{
  "ios": {
    "minimum": "0.0.1",
    "latest": "1.0.0",
    "url": "http://example.com",
    "enabled": true
  },
  "android": {
    "minimum": "1.0.0",
    "latest": "1.0.0",
    "url": "http://example.com",
    "enabled": true
  },
  "windows": {
    "minimum": "1.0.0",
    "latest": "1.0.0",
    "url": "http://example.com",
    "enabled": false
  }
}
```

#### Update URL

The update url now uses the key `url` instead of `link`, which is a much better name for describing a URL.

#### Enabled/Disabled

The app can be enabled or disabled (maintenance mode) on a per platform basis. So, each platform subtree of the metadata has its own `enabled` key. So, if your Windows version is broken and if you have no intention of fixing it, you can disable it without affecting other users.

# 0.0.4 - 2017-02-04 _AoT Support_

Adds Angular AoT compilation support. Package now includes AoT metadata for use in production Ionic app builds.

# 0.0.2 - 2017-02-03

Initial Release!
