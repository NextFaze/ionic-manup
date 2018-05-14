import * as lang from '.';

describe('Language files', () => {
  it('Should contain all languages', () => {
    expect(lang.i18n).toBeDefined();
    expect(lang.i18n.en).toBeDefined();
    expect(lang.i18n.it).toBeDefined();
    expect(lang.i18n.es).toBeDefined();
  });
});
