import { Injectable } from '@angular/core';

@Injectable()
/**
 * Configuration values for ManUp
 */
export class ManUpConfig {
    /**
     * The metadata URL to read version info from.
     * 
     * @type {string}
     * @memberOf ManUpConfig
     */
    url: string

    /**
     * Whether to assume translations will be provided to the module.
     * 
     * @type {boolean}
     * @memberOf ManUpConfig
     */
    externalTranslations?: boolean;
}