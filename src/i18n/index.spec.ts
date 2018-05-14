import * as lang from '.';

describe('Language files', () => {
  expect(lang.i18n).toBeDefined();
  expect(lang.i18n.length).toEqual(3);
});
