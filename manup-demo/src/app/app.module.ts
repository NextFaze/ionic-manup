import { ErrorHandler, NgModule } from '@angular/core';
import { Http } from '@angular/http';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { ManUpModule, ManUpService } from 'ionic-manup';

import { AboutPage } from '../pages/about/about';
import { ContactPage } from '../pages/contact/contact';
import { HomePage } from '../pages/home/home';
import { TabsPage } from '../pages/tabs/tabs';
import { MyApp } from './app.component';

export function translateLoader(http: Http) {
  return new TranslateHttpLoader(http, 'assets/i18n', '.json');
}

@NgModule({
  declarations: [MyApp, AboutPage, ContactPage, HomePage, TabsPage],
  imports: [
    IonicModule.forRoot(MyApp),
    ManUpModule.forRoot({
      url: 'https://raw.githubusercontent.com/NextFaze/ionic-manup/master/manup-demo/manup.json',
      externalTranslations: true
    }),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: translateLoader,
        deps: [Http]
      }
    })
  ],
  bootstrap: [IonicApp],
  entryComponents: [MyApp, AboutPage, ContactPage, HomePage, TabsPage],
  providers: [{ provide: ErrorHandler, useClass: IonicErrorHandler }, ManUpService]
})
export class AppModule {}
