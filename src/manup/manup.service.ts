import { ManupConfig } from './manup.config';
import { AlertController, Platform } from 'ionic-angular';
import { Http } from '@angular/http';
import { Injectable } from '@angular/core';
import { AppVersion } from 'ionic-native';

import * as semver from 'semver';

@Injectable()
export class ManupService {

    public constructor(private http: Http, private alert: AlertController, private platform: Platform, private storage: Storage, config: ManupConfig) {}

    private inProgress: boolean = false; 
    private currentPromise: Promise<any>;
    
    /**
     * Begins the manup check process.
     * 
     * @Returns a promise that resolves if the app is able to continue.
     */
    public versionCheck(): Promise<any> {

        if (!this.inProgress) {
            this.inProgress = true;
            this.currentPromise = new Promise( (resolve, reject) => {
                this.platform.ready()
                .then( () => {
                    this.http.get(this.config.MANUP_URL + '?q=' + Math.random()).subscribe(response => {
                        this.storage.set('manup', response.text())
                        .then( () => {
                            this.evaluate(response.json()).then( () => {
                                this.inProgress = false;
                                resolve();
                            })
                        });
                    },
                    // Let the app run if we can't get the remote file
                    error => {
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
    private evaluate(versionJson: any): Promise<any> {

        if (versionJson.disabled) {
            return this.presentMaintenanceMode()
        }
        else {
            return AppVersion.getVersionNumber().then(version => {
                if (semver.lt(version, versionJson.minimum)) {
                    return this.presentMandatoryUpdate()
                }
                else if (semver.lt(version, versionJson.latest)) {
                    return this.presentOptionalUpdate()
                }
                else {
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
        return new Promise((resolve, reject) => {
            let alert = this.alert.create({
                enableBackdropDismiss: false,
                title: "App Unavailable",
                subTitle: "Elders Grain is currently unavailable, please check back again later.",
            })
            alert.present();
        });
    }

    /**
     * Displays a mandatory update alert.
     * 
     * @returns a promise that will never resolve, because the app should not continue
     */
    presentMandatoryUpdate(): Promise<any> {
        return new Promise((resolve, reject) => {
            let alert = this.alert.create({
                enableBackdropDismiss: false,
                title: "Update Required",
                subTitle: "An update to Elders Grain is required to continue.",
                buttons: [
                    {
                        text: 'Update',
                        handler: () => {
                            if (this.platform.is('ios')) {
                              new InAppBrowser("https://itunes.apple.com/au/app/elders-grain/id1145184771?mt=8", '_system');
                            }
                            else {
                              new InAppBrowser("market://details?id=com.elders.grain", '_system');
                            }
                            return false;
                        }
                    }
                ]
            })
            alert.present();
        });
    }

    /**
     * Displays an optional update alert.
     * 
     * @returns a promise that will resolves if the user selects 'not now'
     */
    presentOptionalUpdate(): Promise<any> {
        return new Promise((resolve, reject) => {
            let alert = this.alert.create({
                enableBackdropDismiss: false,
                title: "Update Available",
                subTitle: "An update to Elders Grain is available. Would you like to update?",
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
                            if (this.platform.is('ios')) {
                              new InAppBrowser("https://itunes.apple.com/au/app/elders-grain/id1145184771?mt=8", '_system');
                            }
                            else {
                              new InAppBrowser("market://details?id=com.elders.grain", '_system');
                            }
                            return false;
                        }
                    }
                ]
            })
            alert.present();
        });
    }
}