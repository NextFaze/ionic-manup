import { ManupConfig } from './manup.config';
import { AlertController, Platform } from 'ionic-angular';
import { Http } from '@angular/http';
import { Injectable, Optional } from '@angular/core';
import { AppVersion, InAppBrowser } from 'ionic-native';

import * as semver from 'semver';

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
                    console.log('fetching remote manup file: ' + this.config.url)
                    this.http.get(this.config.url).subscribe(response => {
                        console.log('got response: ')
                        console.log(response.text());
                        this.evaluate(response.json()).then( () => {
                            this.inProgress = false;
                            resolve();
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
     * Evaluates the app version against manup data, presents alerts as needed.
     */
    private evaluate(metadata: any): Promise<any> {
        let platformData: {minimum: string, latest: string, link: string};

        if (this.platform.is('ios')) {
            platformData = metadata.ios;
        }
        else if (this.platform.is('android')) {
            platformData = metadata.android;
        }
        else {
            return Promise.resolve(true);
        }

        if (metadata.disabled) {
            return this.presentMaintenanceMode()
        }
        else {
            return AppVersion.getVersionNumber().then(version => {
                try {
                    if (semver.lt(version, platformData.minimum)) {
                        return this.presentMandatoryUpdate(platformData)
                    }
                    else if (semver.lt(version, platformData.latest)) {
                        return this.presentOptionalUpdate(platformData)
                    }
                    else {
                        return Promise.resolve(true);
                    }
                }
                catch(e) {
                    return Promise.resolve(true);
                }
            });
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