import { Observable, of, throwError } from 'rxjs';
import { setTimeout } from 'timers';
import { i18n } from './i18n';
import { ManUpConfig } from './manup.config';
import { AlertType, ManUpService } from './manup.service';

class MockAppVersion {
  static appName = 'MyApp';
  static defaultVersion = '2.3.4';
  static version = '2.3.4';
  public static reset() {
    this.version = this.defaultVersion;
  }
  public static getVersionNumber() {
    return Promise.resolve(MockAppVersion.version);
  }
  public static getAppName() {
    return Promise.resolve(MockAppVersion.appName);
  }
}

describe('Manup Spec', function () {
  describe('constructor', function () {});

  describe('loadTranslations', () => {
    let manup: ManUpService;
    let mockTranslate: any;
    beforeEach(() => {
      const config = {
        externalTranslations: true,
      };
      mockTranslate = {
        setTranslation: jasmine.createSpy('setTranslation').and.returnValue(Promise.resolve()),
      };
      manup = new ManUpService(<any>config, null, null, null, null, null, mockTranslate, null);
    });

    it('Should load translations for a language we support', () => {
      mockTranslate.currentLang = 'en';
      manup.loadTranslations();
      expect(mockTranslate.setTranslation).toHaveBeenCalledWith('en', i18n.en.translations, true);
    });
    it('Should load translations for the default lang if we dont support the requested lang', () => {
      mockTranslate.defaultLang = 'it';
      mockTranslate.currentLang = 'asdf';
      manup.loadTranslations();
      expect(mockTranslate.setTranslation).toHaveBeenCalledWith('it', i18n.it.translations, true);
    });
    it('Should load english if we dont support the requested or default languages', () => {
      mockTranslate.defaultLang = 'notReal';
      mockTranslate.currentLang = 'asdf';
      manup.loadTranslations();
      expect(mockTranslate.setTranslation).toHaveBeenCalledWith(
        'notReal',
        i18n.en.translations,
        true
      );
    });
  });

  describe('validate', function () {
    let json = {
      minimum: '2.4.5',
      latest: '2.4.5',
      url: 'http://example.com',
      enabled: true,
    };
    const mockTranslate = {
      setTranslation: function () {},
    };
    const mockHttp = {
      get: function (url: string): Observable<Object> {
        return of({
          ios: {
            ...json,
          },
        });
      },
    };
    const config = {
      externalTranslations: false,
      url: 'http://example.com',
    };
    const mockAlert = {
      create: jasmine.createSpy('create').and.returnValue(
        Promise.resolve({
          present: () => Promise.resolve(),
        })
      ),
    };

    beforeEach(() => {
      json = {
        minimum: '2.4.5',
        latest: '2.4.5',
        url: 'http://example.com',
        enabled: true,
      };
      MockAppVersion.reset();
    });

    it('Resolves with the result of the manUp run', async () => {
      const mockPlatform = {
        ready: () => Promise.resolve(),
        is: (platform: string) => platform === 'ios',
      };

      json.minimum = '2.0.0';
      json.latest = '2.5.0';

      MockAppVersion.version = '2.4.0';

      let manup = new ManUpService(
        config,
        <any>mockHttp,
        <any>mockAlert,
        <any>mockPlatform,
        null,
        <any>MockAppVersion,
        null,
        null
      );

      let result = await manup.validate();
      expect(result).toEqual(AlertType.OPTIONAL);

      MockAppVersion.version = '1.0.0';
      result = await manup.validate();
      expect(result).toEqual(AlertType.MANDATORY);

      MockAppVersion.version = '2.6.0';
      result = await manup.validate();
      expect(result).toEqual(AlertType.NOP);

      json.enabled = false;
      result = await manup.validate();
      expect(result).toEqual(AlertType.MAINTENANCE);
    });

    it('should call presentAlert with the platform data', (done) => {
      const mockPlatform = {
        ready: () => Promise.resolve(),
        is: (platform: string) => platform === 'ios',
      };

      let manup = new ManUpService(
        config,
        <any>mockHttp,
        <any>mockAlert,
        <any>mockPlatform,
        null,
        <any>MockAppVersion,
        null,
        null
      );
      spyOn(manup, 'presentAlert');

      manup.validate();
      setTimeout(() => {
        expect(manup.presentAlert).toHaveBeenCalledWith(AlertType.MANDATORY, {
          minimum: '2.4.5',
          latest: '2.4.5',
          enabled: true,
          url: 'http://example.com',
        });
        done();
      }, 1000);
    });

    it('Should silently resolve if the platform was not found in manup config', async () => {
      const mockPlatform = {
        ready: () => Promise.resolve(),
        is: (platform: string) => platform === 'browser',
      };

      let manup = new ManUpService(
        config,
        <any>mockHttp,
        <any>mockAlert,
        <any>mockPlatform,
        null,
        <any>MockAppVersion,
        null,
        null
      );
      spyOn(manup, 'presentAlert');

      try {
        await manup.validate();
      } catch (e) {
        expect(e).toBeUndefined();
      }
    });

    it('Promise resolves once optional alert resolves', async () => {
      const mockPlatform = {
        ready: () => Promise.resolve(),
        is: (platform: string) => platform === 'ios',
      };

      json.minimum = '2.0.0';
      json.latest = '2.5.0';

      MockAppVersion.version = '2.4.0';

      let manup = new ManUpService(
        config,
        <any>mockHttp,
        <any>mockAlert,
        <any>mockPlatform,
        null,
        <any>MockAppVersion,
        null,
        null
      );
      spyOn(manup, 'presentAlert');

      await manup.validate();
      expect(manup.presentAlert).toHaveBeenCalledWith(AlertType.OPTIONAL, {
        minimum: '2.0.0',
        latest: '2.5.0',
        enabled: true,
        url: 'http://example.com',
      });
    });
  });

  describe('evaluate', function () {
    it('Should return maintenance mode if json says disabled', function (done) {
      let json = {
        minimum: '2.3.4',
        latest: '2.3.4',
        url: 'http://example.com',
        enabled: false,
      };

      let manup = new ManUpService(null, null, null, null, null, <any>MockAppVersion, null, null);

      manup.evaluate(json).then(function (alert) {
        expect(alert).toEqual(AlertType.MAINTENANCE);
        done();
      });
    });
    it('Should return mandatory update if app version less than minimum', function (done) {
      let json = {
        minimum: '4.3.4',
        latest: '6.3.4',
        url: 'http://example.com',
        enabled: true,
      };

      let manup = new ManUpService(null, null, null, null, null, <any>MockAppVersion, null, null);

      manup.evaluate(json).then(function (alert) {
        expect(alert).toEqual(AlertType.MANDATORY);
        done();
      });
    });
    it('Should return optional update if app version less than latest', function (done) {
      let json = {
        minimum: '2.3.4',
        latest: '6.3.4',
        url: 'http://example.com',
        enabled: true,
      };

      let manup = new ManUpService(null, null, null, null, null, <any>MockAppVersion, null, null);

      manup.evaluate(json).then(function (alert) {
        expect(alert).toEqual(AlertType.OPTIONAL);
        done();
      });
    });
    it('Should return nop if app version latest', function (done) {
      let json = {
        minimum: '2.3.4',
        latest: '2.3.4',
        url: 'http://example.com',
        enabled: true,
      };

      let manup = new ManUpService(null, null, null, null, null, <any>MockAppVersion, null, null);

      manup.evaluate(json).then(function (alert) {
        expect(alert).toEqual(AlertType.NOP);
        done();
      });
    });
  });

  describe('metadata', function () {
    let config: ManUpConfig = {
      url: 'test.example.com',
    };

    describe('Http route, no storage configured', () => {
      let mockHttp = {
        get: function (url: string): Observable<Object> {
          return of({
            ios: {
              minimum: '1.0.0',
              latest: '2.4.5',
              enabled: true,
              url: 'http://http.example.com',
            },
          });
        },
      };
      it('Should make an http request', function (done) {
        spyOn(mockHttp, 'get').and.callThrough();
        let manup = new ManUpService(config, <any>mockHttp, null, null, null, null, null, null);
        manup.metadata().then((data) => {
          expect(mockHttp.get).toHaveBeenCalled();
          done();
        });
      });
      it('Should return json', function (done) {
        let manup = new ManUpService(config, <any>mockHttp, null, null, null, null, null, null);
        manup.metadata().then((data) => {
          expect(data.ios).toBeDefined();
          expect(data.ios.url).toBe('http://http.example.com');
          done();
        });
      });

      it('Should throw an exception if http request fails', (done) => {
        let mockHttpErr = {
          get: function (url: string): Observable<Object> {
            return throwError(new Error('no good son'));
          },
        };
        let manup = new ManUpService(config, <any>mockHttpErr, null, null, null, null, null, null);
        manup.metadata().then(
          (data) => {
            expect(true).toBe(null);
            done();
          },
          (err) => {
            expect(err).toBeDefined();
            done();
          }
        );
      });
      it('Should throw an exception if http returns null as it does from time to time', (done) => {
        let mockHttpErr = {
          get: function (url: string): Observable<Object> {
            return of(null);
          },
        };
        let manup = new ManUpService(config, <any>mockHttpErr, null, null, null, null, null, null);
        manup.metadata().then(
          (data) => {
            expect(true).toBe(null);
            done();
          },
          (err) => {
            expect(err).toBeDefined();
            done();
          }
        );
      });
    });

    describe('Http route, with storage', () => {
      let mockHttp = {
        get: function (url: string): Observable<Object> {
          return of({
            ios: {
              minimum: '1.0.0',
              latest: '2.4.5',
              enabled: true,
              url: 'http://http.example.com',
            },
          });
        },
      };
      let mockStorage = {
        set(key: string, value: string) {
          return Promise.resolve();
        },
      };
      let response: any;
      let manup: any;

      beforeAll((done) => {
        manup = new ManUpService(
          config,
          <any>mockHttp,
          null,
          null,
          null,
          null,
          null,
          <any>mockStorage
        );
        spyOn(mockHttp, 'get').and.callThrough();
        spyOn(manup, 'saveMetadata').and.callThrough();
        manup.metadata().then((data: any) => {
          response = data;
          done();
        });
      });

      it('Should make an http request', () => {
        expect(mockHttp.get).toHaveBeenCalled();
      });
      it('Should store the result to storage', () => {
        expect(manup.saveMetadata).toHaveBeenCalled();
      });
      it('Should return json', () => {
        expect(response.ios).toBeDefined();
        expect(response.ios.url).toBe('http://http.example.com');
      });
    });

    describe('Fallback to storage', () => {
      let mockHttp: any;
      let mockStorage: any;

      beforeEach(() => {
        mockHttp = {
          get: function (url: string): Observable<Object> {
            return throwError(new Error('HTTP Failed'));
          },
        };
        mockStorage = {
          get(key: string) {
            return Promise.resolve(
              JSON.stringify({
                ios: {
                  minimum: '1.0.0',
                  latest: '2.4.5',
                  enabled: true,
                  url: 'http://storage.example.com',
                },
              })
            );
          },
          set(key: string, value: string) {
            return Promise.resolve();
          },
        };
        spyOn(mockHttp, 'get').and.callThrough();
        spyOn(mockStorage, 'get').and.callThrough();
        spyOn(mockStorage, 'set').and.callThrough();
      });

      it('Should make an http request', function (done) {
        let manup = new ManUpService(
          config,
          <any>mockHttp,
          null,
          null,
          null,
          null,
          null,
          <any>mockStorage
        );
        manup.metadata().then((data) => {
          expect(mockHttp.get).toHaveBeenCalled();
          done();
        });
      });
      it('Should fallback to storage', function (done) {
        let manup = new ManUpService(
          config,
          <any>mockHttp,
          null,
          null,
          null,
          null,
          null,
          <any>mockStorage
        );
        manup.metadata().then((data) => {
          expect(mockStorage.get).toHaveBeenCalled();
          done();
        });
      });
      it('Should return json', function (done) {
        let manup = new ManUpService(
          config,
          <any>mockHttp,
          null,
          null,
          null,
          null,
          null,
          <any>mockStorage
        );
        manup.metadata().then((data) => {
          expect(data.ios).toBeDefined();
          expect(data.ios.url).toBe('http://storage.example.com');
          done();
        });
      });
    });
  });

  describe('metadataFromStorage', function () {
    it('Should return data from storage, if it exists', (done) => {
      let metadata = {
        ios: { minimum: '1.0.0', latest: '2.0.0', enabled: true, url: 'test.example.com' },
      };
      let mockStorage = {
        get(key: string) {
          return Promise.resolve(JSON.stringify(metadata));
        },
      };
      spyOn(mockStorage, 'get').and.callThrough();
      let manup = new ManUpService(null, null, null, null, null, null, null, <any>mockStorage);
      manup.metadataFromStorage().then((data) => {
        expect(mockStorage.get).toHaveBeenCalledWith('com.nextfaze.ionic-manup.manup');
        expect(data).toEqual(metadata);
        done();
      });
    });

    it('Should error if data is not stored ', function (done) {
      let mockStorage = {
        get(key: string) {
          return Promise.reject(new Error('not found'));
        },
      };
      spyOn(mockStorage, 'get').and.callThrough();
      let manup = new ManUpService(null, null, null, null, null, null, null, <any>mockStorage);
      manup.metadataFromStorage().then(
        (data) => {
          expect(true).toBe(false);
        },
        (error) => {
          expect(error).toBeDefined();
          done();
        }
      );
    });
    it('Should throw an exception if storage not configured', (done) => {
      let manup = new ManUpService(null, null, null, null, null, null, null, null);
      expect(() => {
        manup.metadataFromStorage();
      }).toThrowError();
      done();
    });
  });

  describe('saveMetaData', function () {
    let mockStorage = {
      set(key: string, value: string) {
        return Promise.resolve();
      },
    };

    it('Should save the item if storage configured', (done) => {
      spyOn(mockStorage, 'set').and.callThrough();
      let manup = new ManUpService(null, null, null, null, null, null, null, <any>mockStorage);
      let metadata = {
        ios: { minimum: '1.0.0', latest: '2.0.0', enabled: true, url: 'test.example.com' },
      };
      manup.saveMetadata(metadata).then(() => {
        expect(mockStorage.set).toHaveBeenCalledWith(
          'com.nextfaze.ionic-manup.manup',
          JSON.stringify(metadata)
        );
        done();
      });
    });

    it('Should throw an exception if storage not configured', (done) => {
      let metadata = {
        ios: { minimum: '1.0.0', latest: '2.0.0', enabled: true, url: 'test.example.com' },
      };
      let manup = new ManUpService(null, null, null, null, null, null, null, null);
      expect(() => {
        manup.saveMetadata(metadata);
      }).toThrowError();
      done();
    });
  });

  describe('getPlatformData', function () {
    let json = {
      ios: {
        minimum: '1.0.0',
        latest: '2.4.5',
        enabled: true,
        url: 'http://example.com',
      },
      android: {
        minimum: '4.0.1',
        latest: '6.2.1',
        enabled: true,
        url: 'http://example.com',
      },
      windows: {
        minimum: '1.0.0',
        latest: '1.0.1',
        enabled: false,
        url: 'http://example.com',
      },
    };

    it('should return IOS metadata if platform is ios', function () {
      let mockPlatform = {
        is: function (v: String) {
          return v === 'ios';
        },
      };
      let manup = new ManUpService(null, null, null, <any>mockPlatform, null, null, null, null);

      let result = manup.getPlatformData(json);
      expect(result).toEqual(json.ios);
    });

    it('should return android metadata if platform is android', function () {
      let mockPlatform = {
        is: function (v: String) {
          return v === 'android';
        },
      };
      let manup = new ManUpService(null, null, null, <any>mockPlatform, null, null, null, null);

      let result = manup.getPlatformData(json);
      expect(result).toEqual(json.android);
    });

    it('should return windows metadata if platform is desktop', function () {
      let mockPlatform = {
        is: function (v: String) {
          return v === 'desktop';
        },
      };
      let manup = new ManUpService(null, null, null, <any>mockPlatform, null, null, null, null);

      let result = manup.getPlatformData(json);
      expect(result).toEqual(json.windows);
    });

    it('should throw and error if the platform is unsupported', function () {
      let mockPlatform = {
        is: function (v: String) {
          return false;
        },
      };
      let manup = new ManUpService(null, null, null, <any>mockPlatform, null, null, null, null);

      expect(() => {
        manup.getPlatformData(json);
      }).toThrow();
    });

    it('should throw and error invalid metadata is passed in', function () {
      let mockPlatform = {
        is: function (v: String) {
          return false;
        },
      };
      let manup = new ManUpService(null, null, null, <any>mockPlatform, null, null, null, null);

      expect(() => {
        manup.getPlatformData(null);
      }).toThrow();
    });
  });

  describe('presentMaintenanceMode', () => {
    const createNewMockAlert = () => {
      const mockAlertInstance = {
        present: jasmine.createSpy('present').and.returnValue(Promise.resolve()),
      };
      const mockAlert: any = {
        create: jasmine.createSpy('create').and.returnValue(Promise.resolve(mockAlertInstance)),
      };
      return { mockAlert, mockAlertInstance };
    };

    it('supports custom messages from the platform config', async () => {
      const { mockAlert, mockAlertInstance } = createNewMockAlert();
      const service = new ManUpService(
        null,
        null,
        mockAlert,
        null,
        null,
        <any>{
          getAppName: () => Promise.resolve('MyApp'),
        },
        null,
        null
      );

      await service.presentMaintenanceMode({
        enabled: true,
        latest: '0',
        minimum: '0',
        url: '',
        alerts: {
          maintenance: {
            title: 'App disabled',
            text: 'We shut it down',
          },
        },
      });
      expect(mockAlert.create).toHaveBeenCalledWith({
        backdropDismiss: false,
        header: 'App disabled',
        subHeader: 'We shut it down',
        cssClass: 'app-update-alert',
      });
      expect(mockAlertInstance.present).toHaveBeenCalled();
    });

    it('falls back to translate if it exists', async () => {
      const { mockAlert, mockAlertInstance } = createNewMockAlert();
      const service = new ManUpService(
        null,
        null,
        mockAlert,
        null,
        null,
        <any>{
          getAppName: () => Promise.resolve('MyApp'),
        },
        {
          instant: (msg: string) => `translated:${msg}`,
        },
        null
      );

      await service.presentMaintenanceMode({
        enabled: true,
        latest: '0',
        minimum: '0',
        url: '',
      });
      expect(mockAlert.create).toHaveBeenCalledWith({
        backdropDismiss: false,
        header: 'translated:manup.maintenance.title',
        subHeader: 'translated:manup.maintenance.text',
        cssClass: 'app-update-alert',
      });
      expect(mockAlertInstance.present).toHaveBeenCalled();
    });

    it('falls back to a hard-coded string as an absolute last resort', async () => {
      const { mockAlert, mockAlertInstance } = createNewMockAlert();
      const service = new ManUpService(
        null,
        null,
        mockAlert,
        null,
        null,
        <any>{
          getAppName: () => Promise.resolve('MyApp'),
        },
        null,
        null
      );

      await service.presentMaintenanceMode({
        enabled: true,
        latest: '0',
        minimum: '0',
        url: '',
      });
      expect(mockAlert.create).toHaveBeenCalledWith({
        backdropDismiss: false,
        header: 'MyApp Unavailable',
        subHeader: 'MyApp is currently unavailable. Please check back later.',
        cssClass: 'app-update-alert',
      });
      expect(mockAlertInstance.present).toHaveBeenCalled();
    });
  });

  describe('presentMandatoryUpdate', () => {
    const createNewMockAlert = () => {
      const mockAlertInstance = {
        present: jasmine.createSpy('present').and.returnValue(Promise.resolve()),
      };
      const mockAlert: any = {
        create: jasmine.createSpy('create').and.returnValue(Promise.resolve(mockAlertInstance)),
      };
      return { mockAlert, mockAlertInstance };
    };

    it('supports custom messages from the platform config', async () => {
      const { mockAlert, mockAlertInstance } = createNewMockAlert();
      const service = new ManUpService(
        null,
        null,
        mockAlert,
        null,
        null,
        <any>{
          getAppName: () => Promise.resolve('MyApp'),
        },
        null,
        null
      );

      await service.presentMandatoryUpdate({
        enabled: true,
        latest: '0',
        minimum: '0',
        url: '',
        alerts: {
          mandatory: {
            title: 'Pls update',
            text: 'You have to',
          },
        },
      });
      expect(mockAlert.create).toHaveBeenCalledWith({
        backdropDismiss: false,
        header: 'Pls update',
        subHeader: 'You have to',
        cssClass: 'app-update-alert',
        buttons: [jasmine.anything()],
      });
      expect(mockAlertInstance.present).toHaveBeenCalled();
    });

    it('falls back to translate if it exists', async () => {
      const { mockAlert, mockAlertInstance } = createNewMockAlert();
      const service = new ManUpService(
        null,
        null,
        mockAlert,
        null,
        null,
        <any>{
          getAppName: () => Promise.resolve('MyApp'),
        },
        {
          instant: (msg: string) => `translated:${msg}`,
        },
        null
      );

      await service.presentMandatoryUpdate({
        enabled: true,
        latest: '0',
        minimum: '0',
        url: '',
      });
      expect(mockAlert.create).toHaveBeenCalledWith({
        backdropDismiss: false,
        header: 'translated:manup.mandatory.title',
        subHeader: 'translated:manup.mandatory.text',
        cssClass: 'app-update-alert',
        buttons: [jasmine.anything()],
      });
      expect(mockAlertInstance.present).toHaveBeenCalled();
    });

    it('falls back to a hard-coded string as an absolute last resort', async () => {
      const { mockAlert, mockAlertInstance } = createNewMockAlert();
      const service = new ManUpService(
        null,
        null,
        mockAlert,
        null,
        null,
        <any>{
          getAppName: () => Promise.resolve('MyApp'),
        },
        null,
        null
      );

      await service.presentMandatoryUpdate({
        enabled: true,
        latest: '0',
        minimum: '0',
        url: '',
      });
      expect(mockAlert.create).toHaveBeenCalledWith({
        backdropDismiss: false,
        header: 'Update Required',
        subHeader: 'An update to MyApp is required to continue.',
        cssClass: 'app-update-alert',
        buttons: [jasmine.anything()],
      });
      expect(mockAlertInstance.present).toHaveBeenCalled();
    });
  });

  describe('presentOptionalUpdate', () => {
    const createNewMockAlert = () => {
      const mockAlertInstance = {
        present: jasmine.createSpy('present').and.returnValue(Promise.resolve()),
      };
      const mockAlert: any = {
        create: jasmine.createSpy('create').and.returnValue(Promise.resolve(mockAlertInstance)),
      };
      return { mockAlert, mockAlertInstance };
    };

    it('supports custom messages from the platform config', async () => {
      const { mockAlert, mockAlertInstance } = createNewMockAlert();
      const service = new ManUpService(
        null,
        null,
        mockAlert,
        null,
        null,
        <any>{
          getAppName: () => Promise.resolve('MyApp'),
        },
        null,
        null
      );

      await service.presentOptionalUpdate({
        enabled: true,
        latest: '0',
        minimum: '0',
        url: '',
        alerts: {
          optional: {
            title: 'Something new',
            text: 'Want it?',
          },
        },
      });
      expect(mockAlert.create).toHaveBeenCalledWith({
        backdropDismiss: false,
        header: 'Something new',
        subHeader: 'Want it?',
        cssClass: 'app-update-alert',
        buttons: [jasmine.anything(), jasmine.anything()],
      });
      expect(mockAlertInstance.present).toHaveBeenCalled();
    });

    it('falls back to translate if it exists', async () => {
      const { mockAlert, mockAlertInstance } = createNewMockAlert();
      const service = new ManUpService(
        null,
        null,
        mockAlert,
        null,
        null,
        <any>{
          getAppName: () => Promise.resolve('MyApp'),
        },
        {
          instant: (msg: string) => `translated:${msg}`,
        },
        null
      );

      await service.presentOptionalUpdate({
        enabled: true,
        latest: '0',
        minimum: '0',
        url: '',
      });
      expect(mockAlert.create).toHaveBeenCalledWith({
        backdropDismiss: false,
        header: 'translated:manup.optional.title',
        subHeader: 'translated:manup.optional.text',
        cssClass: 'app-update-alert',
        buttons: [jasmine.anything(), jasmine.anything()],
      });
      expect(mockAlertInstance.present).toHaveBeenCalled();
    });

    it('falls back to a hard-coded string as an absolute last resort', async () => {
      const { mockAlert, mockAlertInstance } = createNewMockAlert();
      const service = new ManUpService(
        null,
        null,
        mockAlert,
        null,
        null,
        <any>{
          getAppName: () => Promise.resolve('MyApp'),
        },
        null,
        null
      );

      await service.presentOptionalUpdate({
        enabled: true,
        latest: '0',
        minimum: '0',
        url: '',
      });
      expect(mockAlert.create).toHaveBeenCalledWith({
        backdropDismiss: false,
        header: 'Update Available',
        subHeader: 'An update to MyApp is available. Would you like to update?',
        cssClass: 'app-update-alert',
        buttons: [jasmine.anything(), jasmine.anything()],
      });
      expect(mockAlertInstance.present).toHaveBeenCalled();
    });
  });
});
