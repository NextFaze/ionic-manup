import { ManupConfig } from './manup.config';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { ManupService } from './manup.service';

@NgModule({
    providers: [
        ManupService
    ],
})
export class ManupModule {

    static forRoot(config: ManupConfig): ModuleWithProviders {

        return {
            ngModule: ManupModule,
            providers: [
                {provide: ManupConfig, useValue: config}
            ],
        }
    }
}
