import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ErrorHandler, NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { BrowserModule } from '@angular/platform-browser';
import { AppVersion } from '@ionic-native/app-version';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { ManUpModule, ManUpService, TRANSLATE_SERVICE } from 'ionic-manup';

import { HomePage } from '../pages/home/home';
import { MyApp } from './app.component';

export function translateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, 'assets/i18n/', '.json');
}
@NgModule({
  declarations: [MyApp, HomePage],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
    HttpModule,
    HttpClientModule,
    ManUpModule.forRoot({
      url: 'https://raw.githubusercontent.com/NextFaze/ionic-manup/master/manup-demo/manup.json',
      externalTranslations: false
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
  providers: [
    AppVersion,
    { provide: ErrorHandler, useClass: IonicErrorHandler },
    { provide: TRANSLATE_SERVICE, useClass: TranslateService },
    ManUpService,
    SplashScreen,
    InAppBrowser,
    StatusBar
  ],
  entryComponents: [MyApp, HomePage]
})
export class AppModule {}
