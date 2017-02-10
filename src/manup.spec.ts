import { AlertType, ManUpService } from './manup.service';

class MockAppVersion {
    public static getVersionNumber() {
        return Promise.resolve("2.3.4");
    }
}

describe('Manup Spec', function() {

    it('The world is sane', function() {
        expect(2+2).toEqual(4);
    })

    describe('evaluate', function() {
        it('Should return maintenance mode if json says disabled', function(done) {
            let json = {
                minimum: "2.3.4",
                latest: "2.3.4",
                link: "http://example.com",
                enabled: false
            };

            let manup = new ManUpService(null, null, null, null);
            manup.AppVersion = MockAppVersion;

            manup.evaluate(json).then(function(alert) {
                expect(alert).toEqual(AlertType.MAINTENANCE);
                done();
            });
        });
        it('Should return mandatory update if app version less than minimum', function(done) {
            let json = {
                minimum: "4.3.4",
                latest: "6.3.4",
                link: "http://example.com",
                enabled: true 
            };

            let manup = new ManUpService(null, null, null, null);
            manup.AppVersion = MockAppVersion;

            manup.evaluate(json).then(function(alert) {
                expect(alert).toEqual(AlertType.MANDATORY);
                done();
            });
        });
        it('Should return optional update if app version less than latest', function(done) {
            let json = {
                minimum: "2.3.4",
                latest: "6.3.4",
                link: "http://example.com",
                enabled: true 
            };

            let manup = new ManUpService(null, null, null, null);
            manup.AppVersion = MockAppVersion;

            manup.evaluate(json).then(function(alert) {
                expect(alert).toEqual(AlertType.OPTIONAL);
                done();
            });
        });
        it('Should return nop if app version latest', function(done) {
            let json = {
                minimum: "2.3.4",
                latest: "2.3.4",
                link: "http://example.com",
                enabled: true 
            };

            let manup = new ManUpService(null, null, null, null);
            manup.AppVersion = MockAppVersion;

            manup.evaluate(json).then(function(alert) {
                expect(alert).toEqual(AlertType.NOP);
                done();
            });
        });
    });

    describe('getPlatformData', function() {
        let json = {
            ios: {
                minimum: "1.0.0",
                latest: "2.4.5",
                enabled: true,
                link: "http://example.com" 
            },
            android: {
                minimum: "4.0.1",
                latest: "6.2.1",
                enabled: true,
                link: "http://example.com" 
            },
            windows: {
                minimum: "1.0.0",
                latest: "1.0.1",
                enabled: false,
                link: "http://example.com" 
            },
        }

        it('should return IOS metadata if platform is ios', function() {
            let mockPlatform = {
                is: function(v: String) {
                    return v === 'ios'
                }
            };
            let manup = new ManUpService(null, null, <any> mockPlatform, null);

            let result = manup.getPlatformData(json);
            expect(result).toEqual(json.ios);
        })

        it('should return android metadata if platform is android', function() {
            let mockPlatform = {
                is: function(v: String) {
                    return v === 'android'
                }
            };
            let manup = new ManUpService(null, null, <any> mockPlatform, null);

            let result = manup.getPlatformData(json);
            expect(result).toEqual(json.android);
        })

        it('should return windows metadata if platform is windows', function() {
            let mockPlatform = {
                is: function(v: String) {
                    return v === 'windows'
                }
            };
            let manup = new ManUpService(null, null, <any> mockPlatform, null);

            let result = manup.getPlatformData(json);
            expect(result).toEqual(json.windows);
        })

        it('should throw and error if the platform is unsupported', function() {
            let mockPlatform = {
                is: function(v: String) {
                    return false;
                }
            };
            let manup = new ManUpService(null, null, <any> mockPlatform, null);

            expect( () => {manup.getPlatformData(json)}).toThrow();
        })

    })

})
