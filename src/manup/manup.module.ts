import { NgModule } from '@angular/core';
import { ManupService } from './manup.service';

@NgModule({
    providers: [
        ManupService
    ],
    exports: [
        ManupService
    ]
})
export class ManupModule {}
