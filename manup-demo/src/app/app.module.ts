import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ErrorHandler, NgModule } from '@angular/core';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { ManUpModule, ManUpService } from 'ionic-manup';

import { HomePage } from '../pages/home/home';
import { MyApp } from './app.component';

export function translateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, 'assets/i18n', '.json');
}
@NgModule({
  declarations: [MyApp, HomePage],
  imports: [
    IonicModule.forRoot(MyApp),
    HttpClientModule,
    ManUpModule.forRoot({
      url: 'https://raw.githubusercontent.com/NextFaze/ionic-manup/master/manup-demo/manup.json',
      externalTranslations: true
    }),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: translateLoader,
        deps: [HttpClient]
      }
    })
  ],
  bootstrap: [IonicApp],
  providers: [{ provide: ErrorHandler, useClass: IonicErrorHandler }, ManUpService],
  entryComponents: [MyApp, HomePage]
})
export class AppModule {}
