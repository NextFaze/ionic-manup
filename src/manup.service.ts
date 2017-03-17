import { TranslateService } from 'ng2-translate';
import { ManUpConfig } from './manup.config';
import { AlertController, Platform } from 'ionic-angular';
import { Http } from '@angular/http';
import { Injectable, Optional } from '@angular/core';
import { AppVersion, InAppBrowser } from 'ionic-native';
import { Observable } from 'rxjs';
import { i18n } from './i18n';

import 'rxjs/add/operator/map';

import * as semver from 'semver';

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
    minimum: string,
    latest: string,
    url: string,
    enabled: boolean
}

/**
 * What the metadata object should look like
 */
export interface ManUpData {
    ios: PlatformData;
    android: PlatformData;
    windows: PlatformData;
}

@Injectable()
export class ManUpService {
    public AppVersion: any = AppVersion;

    public constructor(private http: Http, private alert: AlertController, private platform: Platform, private config: ManUpConfig, @Optional() private translate: TranslateService ) {
        // load the translations unless we've been told not to
        if (this.translate && !this.config.externalTranslations) {
            for (let lang of i18n) {
                this.translate.setTranslation(lang.lang, lang.translations, true);
            }
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
    public validate(): Promise<any> {

        if (!this.inProgress) {
            this.inProgress = true;
            this.currentPromise = new Promise( (resolve, reject) => {
                console.log('waiting for platform');
                this.platform.ready()
                .then( () => {
                    this.metadata()
                    .map(response => this.getPlatformData(response))
                    .subscribe(metadata => {
                        this.evaluate(metadata).then(alert => {
                            switch (alert) {
                                case AlertType.NOP:
                                    resolve();
                                    break;
                                default:
                                    return this.presentAlert(alert, metadata);
                            }
                        })
                    });
                })
            });
        }
        return this.currentPromise;
    }

    /**
     * Evaluates what kind of update is required, if any.
     * 
     * Returns a promise that resolves with an alert type.
     */
    public evaluate(metadata: PlatformData): Promise<AlertType> {
        if (!metadata.enabled) {
            return Promise.resolve(AlertType.MAINTENANCE);
        }
        return this.AppVersion.getVersionNumber().then((version:string) => {

            if (semver.lt(version, metadata.minimum)) {
                return AlertType.MANDATORY;
            } 
            else if (semver.lt(version, metadata.latest)) {
                return AlertType.OPTIONAL;
            }
            return AlertType.NOP;
        });
    }


    /**
     * Fetches the remote metadata and returns an observable with the json
     */
    private metadata(): Observable<ManUpData> {
        return this.http.get(this.config.url).map(response => response.json());
    }

    /**
     * Returns the branch of the metadata relevant to this platform
     */
    public getPlatformData(metadata: ManUpData): PlatformData {
        if (this.platform.is('ios')) {
            return metadata.ios;
        }
        if (this.platform.is('android')) {
            return metadata.android;
        }
        if (this.platform.is('windows')) {
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
    private presentAlert(type: AlertType, platformData: any): Promise<any> {
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
        return this.AppVersion.getAppName().then( (name:string) => {
            return new Promise((resolve, reject) => {
                let alert = this.alert.create({
                    enableBackdropDismiss: false,
                    title: (this.translate) ? this.translate.instant('manup.maintenance.title', {app: name}) : `${name} Unavailable`,
                    subTitle: (this.translate) ? this.translate.instant('manup.maintenance.text', {app: name}) : `${name} is currently unavailable. Please check back later`,
                })
                alert.present();
            });
        })
    }

    /**
     * Displays a mandatory update alert.
     * 
     * @returns a promise that will never resolve, because the app should not continue
     */
    presentMandatoryUpdate(platformData: any): Promise<any> {
        return this.AppVersion.getAppName().then( (name:string) => {
            return new Promise((resolve, reject) => {
                let alert = this.alert.create({
                    enableBackdropDismiss: false,
                    title: (this.translate) ? this.translate.instant('manup.mandatory.title', {app: name}) : "Update Required",
                    subTitle: (this.translate) ? this.translate.instant('manup.mandatory.text', {app: name}) : `An update to ${name} is required to continue.`,
                    buttons: [
                        {
                            text: (this.translate) ? this.translate.instant('manup.buttons.update') : 'Update',
                            handler: () => {
                                new InAppBrowser(platformData.url, '_system');
                                return false;
                            }
                        }
                    ]
                })
                alert.present();
            });
        });
    }

    /**
     * Displays an optional update alert.
     * 
     * @returns a promise that will resolves if the user selects 'not now'
     */
    presentOptionalUpdate(platformData: any): Promise<any> {
        return this.AppVersion.getAppName().then( (name:string) => {
            return new Promise((resolve, reject) => {
                let alert = this.alert.create({
                    enableBackdropDismiss: false,
                    title: (this.translate) ? this.translate.instant('manup.optional.title', {app: name}) : "Update Available",
                    subTitle: (this.translate) ? this.translate.instant('manup.optional.text', {app: name}) : `An update to ${name} is available. Would you like to update?`,
                    buttons: [
                        {
                            text: (this.translate) ? this.translate.instant('manup.buttons.later') : 'Not Now',
                            handler: () => {
                                resolve();
                            }
                        },
                        {
                            text: (this.translate) ? this.translate.instant('manup.buttons.update') : 'Update',
                            handler: () => {
                                new InAppBrowser(platformData.url, '_system');
                                return false;
                            }
                        }
                    ]
                })
                alert.present();
            });
        });
    }
}