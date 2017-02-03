import { ManupConfig } from './manup.config';
import { AlertController, Platform } from 'ionic-angular';
import { Http } from '@angular/http';
import { Injectable, Optional } from '@angular/core';
import { AppVersion, InAppBrowser } from 'ionic-native';
import { Observable } from 'rxjs';

import * as semver from 'semver';

/**
 * The types of alerts we may present
 */
enum AlertType {
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

interface PlatformData {
    minimum: string,
    latest: string,
    link: string
}

/**
 * What the metadata object should look like
 */
interface ManupData {
    ios: PlatformData;
    android: PlatformData;
    windows: PlatformData;
    enabled: boolean
}

@Injectable()
export class ManupService {

    public constructor(private http: Http, private alert: AlertController, private platform: Platform, private config: ManupConfig) {}

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
                    this.getMetadata().subscribe(response => {
                        if (!response.enabled) {
                            return this.presentMaintenanceMode();
                        }
                        let platformData = this.getPlatformData(response);
                        return this.evaluate(platformData).then(alert => {
                            switch (alert) {
                                case AlertType.MANDATORY:
                                    return this.presentMandatoryUpdate(platformData);
                                case AlertType.OPTIONAL:
                                    return this.presentOptionalUpdate(platformData);
                                default:
                                    resolve();
                            }
                        })
                    },
                    // Let the app run if we can't get the remote file
                    error => {
                        console.log('could not fetch manup metadata');
                        this.inProgress = false;
                        resolve();
                    });
                })
            });
        }
        return this.currentPromise;
    }

    /**
     * Fetches the remote metadata and returns an observable with the json
     */
    private getMetadata(): Observable<ManupData> {
        return this.http.get(this.config.url).map(response => response.json());
    }

    /**
     * Returns the branch of the metadata relevant to this platform
     */
    private getPlatformData(metadata: ManupData): PlatformData {
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

    private evaluate(platformData: PlatformData): Promise<AlertType> {
        return AppVersion.getVersionNumber().then(version => {

            if (semver.lt(version, platformData.minimum)) {
                return AlertType.MANDATORY;
            }
            else if (semver.lt(version, platformData.latest)) {
                return AlertType.OPTIONAL;
            }
            return AlertType.NOP;
        });
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
        return AppVersion.getAppName().then( name => {
            return new Promise((resolve, reject) => {
                let alert = this.alert.create({
                    enableBackdropDismiss: false,
                    title: "App Unavailable",
                    subTitle: `${name} is currently unavailable, please check back again later.`,
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
        return AppVersion.getAppName().then( name => {
            return new Promise((resolve, reject) => {
                let alert = this.alert.create({
                    enableBackdropDismiss: false,
                    title: "Update Required",
                    subTitle: `An update to ${name} is required to continue.`,
                    buttons: [
                        {
                            text: 'Update',
                            handler: () => {
                                new InAppBrowser(platformData.link, '_system');
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
        return AppVersion.getAppName().then( name => {
            return new Promise((resolve, reject) => {
                let alert = this.alert.create({
                    enableBackdropDismiss: false,
                    title: "Update Available",
                    subTitle: `An update to ${name} is available. Would you like to update?`,
                    buttons: [
                        {
                            text: 'Not Now',
                            handler: () => {
                                resolve();
                            }
                        },
                        {
                            text: 'Update',
                            handler: () => {
                                new InAppBrowser(platformData.link, '_system');
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