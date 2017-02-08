import { ManUpConfig } from './manup.config';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { ManUpService } from './manup.service';

@NgModule({
    providers: [
        ManUpService
    ],
})
export class ManUpModule {

    static forRoot(config: ManUpConfig): ModuleWithProviders {

        return {
            ngModule: ManUpModule,
            providers: [
                {provide: ManUpConfig, useValue: config}
            ],
        }
    }
}
