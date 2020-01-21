

import * as semver from 'semver';

import { i18n } from './i18n';
import { ManUpConfig } from './manup.config';
import {Inject, Injectable, InjectionToken, Optional} from "@angular/core";
import {AppVersion} from "@ionic-native/app-version/ngx";
import {AlertController, Platform} from "@ionic/angular";
import {HttpClient} from "@angular/common/http";
import {InAppBrowser} from "@ionic-native/in-app-browser/ngx";
import {Storage} from '@ionic/storage';


/**
 * DI InjectionToken for optional ngx-translate
 */
export const TRANSLATE_SERVICE: any = new InjectionToken('manup:translate');

const STORAGE_KEY = 'com.nextfaze.ionic-manup';

/**
 * The types of alerts we may present
 */
export enum AlertType {
  /**
   * A mandatory update is required
   */
  MANDATORY,

  /**
   * An optional update is available
   */
  OPTIONAL,

  /**
   * The app is disabled
   */
  MAINTENANCE,

  /**
   * Nothing to see here
   */
  NOP
}

export interface PlatformData {
  minimum: string;
  latest: string;
  url: string;
  enabled: boolean;
}

/**
 * What the metadata object should look like
 */
export interface ManUpData {
  ios?: PlatformData;
  android?: PlatformData;
  windows?: PlatformData;
}

@Injectable()
export class ManUpService {
  public constructor(
      private config: ManUpConfig,
      private http: HttpClient,
      private alert: AlertController,
      private platform: Platform,
      private iab: InAppBrowser,
      private AppVersion: AppVersion,
      @Optional()
      @Inject(TRANSLATE_SERVICE)
      private translate: any,
      @Optional() private storage: Storage
  ) {}

  /**
   * Loads the translations into the translation service.
   *
   * * Loads the language requested, if available
   * * Loads the default lang, if we have it
   * * Loads english into the default lang as a last resort
   */
  public loadTranslations() {
    if (i18n[this.translate.currentLang]) {
      this.translate.setTranslation(
          this.translate.currentLang,
          i18n[this.translate.currentLang].translations,
          true
      );
    }
    // load the default language, if we have it
    else if (i18n[this.translate.defaultLang]) {
      this.translate.setTranslation(
          this.translate.defaultLang,
          i18n[this.translate.defaultLang].translations,
          true
      );
    }
    // fall back to english, so we never see the raw translation strings
    else {
      this.translate.setTranslation(this.translate.defaultLang, i18n.en.translations, true);
    }
  }

  /**
   * True if there is an alert already displayed. Used to prevent multiple alerts
   * being presented on top of one another
   */
  private inProgress: boolean = false;

  /**
   * A reference to the current unresolved promise
   */
  private currentPromise: Promise<any>;

  /**
   * Begins the manup check process.
   *
   * @Returns a promise that resolves if the app is able to continue.
   */
  public async validate(): Promise<any> {
    try {
      if (!this.inProgress) {
        this.inProgress = true;
        this.currentPromise = new Promise((resolve, reject) => {
          this.platform.ready().then(async () => {
            const metadata = await this.metadata();
            // Be generous, if we couldn't get the ManUp data let the app run
            if (!metadata) {
              return resolve();
            }
            try {
              const platformData = await this.getPlatformData(metadata);
              const result = await this.evaluate(platformData);
              switch (result) {
                case AlertType.NOP:
                  resolve();
                  break;
                default: {
                  await this.presentAlert(result, platformData);
                  resolve();
                }
              }
            } catch (e) {
              return resolve();
            }
          });
        });
      }
      return this.currentPromise;
    } catch (err) {
      return Promise.resolve();
    }
  }

  /**
   * Evaluates what kind of update is required, if any.
   *
   * Returns a promise that resolves with an alert type.
   */
  public async evaluate(metadata: PlatformData): Promise<AlertType> {
    if (!metadata.enabled) {
      return Promise.resolve(AlertType.MAINTENANCE);
    }
    const version = await this.AppVersion.getVersionNumber();
    if (semver.lt(version, metadata.minimum)) {
      return AlertType.MANDATORY;
    } else if (semver.lt(version, metadata.latest)) {
      return AlertType.OPTIONAL;
    }
    return AlertType.NOP;
  }

  /**
   * Fetches the remote metadata and returns an observable with the json
   */
  public async metadata(): Promise<ManUpData> {
    try {
      const response = await this.http
          .get(this.config.url)
          .toPromise();

      if (this.storage) {
        this.saveMetadata(response).catch(() => {});
      }
      return response;
    } catch (err) {
      return this.metadataFromStorage();
    }
  }

  /**
   * Gets the version metadata from storage, if available.
   *
   * @private
   * @throws An error if the service was instantiated without a Storage component.
   * @returns {Promise<any>} That resolves with the metadata
   *
   * @memberOf ManUpService
   */
  metadataFromStorage(): Promise<ManUpData> {
    if (this.storage) {
      return this.storage.get(STORAGE_KEY + '.manup').then((data: any) => JSON.parse(data));
    } else {
      throw new Error('Storage not configured');
    }
  }

  /**
   *
   * Saves the metadata to storage.
   *
   * @private
   * @param {ManUpData} metadata The metadata to store
   * @throws {Error} if storage if not configured
   * @returns {Promise<any>} A promise that resolves when the save succeeds
   *
   * @memberOf ManUpService
   */
  public saveMetadata(metadata: ManUpData): Promise<any> {
    if (this.storage) {
      return this.storage.set(STORAGE_KEY + '.manup', JSON.stringify(metadata));
    } else {
      throw new Error('Storage not configured');
    }
  }

  /**
   * Returns the branch of the metadata relevant to this platform
   */
  public getPlatformData(metadata: ManUpData): PlatformData {
    if (!metadata) {
      throw new Error('metadata does not exist');
    }
    if (this.platform.is('ios')) {
      return metadata.ios;
    }
    if (this.platform.is('android')) {
      return metadata.android;
    }
    if (this.platform.is('desktop')) {
      return metadata.windows;
    }
    throw new Error('Unknown platform');
  }

  /**
   * Presents an update alert.
   *
   * @param type The type of alert to show
   * @param platformData The metadata for the platform
   *
   * @returns A promise that resolves when this whole thing is over.
   */
  public presentAlert(type: AlertType, platformData: any): Promise<any> {
    // load the translations unless we've been told not to
    if (this.translate && !this.config.externalTranslations) {
      this.loadTranslations();
    }
    switch (type) {
      case AlertType.MANDATORY:
        return this.presentMandatoryUpdate(platformData);

      case AlertType.OPTIONAL:
        return this.presentOptionalUpdate(platformData);

      case AlertType.MAINTENANCE:
        return this.presentMaintenanceMode();
    }
  }

  /**
   * Displays a maintenance mode alert.
   *
   * @returns a promise that will never resolve, because the app should not continue
   */
  presentMaintenanceMode(): Promise<any> {
    return this.AppVersion.getAppName().then((name: string) => {
      return new Promise((resolve, reject) => {
        this.alert.create({
          backdropDismiss: false,
          header: this.translate
              ? this.translate.instant('manup.maintenance.title', { app: name })
              : `${name} Unavailable`,
          subHeader: this.translate
              ? this.translate.instant('manup.maintenance.text', { app: name })
              : `${name} is currently unavailable. Please check back later`
        }).then(alert => alert.present());
      });
    });
  }

  /**
   * Displays a mandatory update alert.
   *
   * @returns a promise that will never resolve, because the app should not continue
   */
  presentMandatoryUpdate(platformData: any): Promise<any> {
    return this.AppVersion.getAppName().then((name: string) => {
      return new Promise((resolve, reject) => {
        this.alert.create({
          backdropDismiss: false,
          header: this.translate
              ? this.translate.instant('manup.mandatory.title', { app: name })
              : 'Update Required',
          subHeader: this.translate
              ? this.translate.instant('manup.mandatory.text', { app: name })
              : `An update to ${name} is required to continue.`,
          buttons: [
            {
              text: this.translate ? this.translate.instant('manup.buttons.update') : 'Update',
              handler: () => {
                this.iab.create(platformData.url, '_system');
                return false;
              }
            }
          ]
        }).then(alert => alert.present());
      });
    });
  }

  /**
   * Displays an optional update alert.
   *
   * @returns a promise that will resolves if the user selects 'not now'
   */
  presentOptionalUpdate(platformData: any): Promise<any> {
    return this.AppVersion.getAppName().then((name: string) => {
      return new Promise((resolve, reject) => {
        this.alert.create({
          backdropDismiss: false,
          header: this.translate
              ? this.translate.instant('manup.optional.title', { app: name })
              : 'Update Available',
          subHeader: this.translate
              ? this.translate.instant('manup.optional.text', { app: name })
              : `An update to ${name} is available. Would you like to update?`,
          buttons: [
            {
              text: this.translate ? this.translate.instant('manup.buttons.later') : 'Not Now',
              handler: () => {
                resolve();
              }
            },
            {
              text: this.translate ? this.translate.instant('manup.buttons.update') : 'Update',
              handler: () => {
                this.iab.create(platformData.url, '_system');
                return false;
              }
            }
          ]
        }).then(alert => alert.present());

      });
    });
  }
}
