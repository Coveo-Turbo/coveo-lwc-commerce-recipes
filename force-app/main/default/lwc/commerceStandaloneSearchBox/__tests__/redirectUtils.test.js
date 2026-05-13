import {shouldRedirectToSearchPage} from '../redirectUtils';

describe('shouldRedirectToSearchPage', () => {
  it('returns false when redirectTo is missing', () => {
    expect(shouldRedirectToSearchPage({redirectTo: null, value: 'laptop'})).toBe(
      false
    );
  });

  it('returns false when query is empty or whitespace', () => {
    expect(
      shouldRedirectToSearchPage({
        redirectTo: '/global-search/%40uri',
        value: '',
      })
    ).toBe(false);
    expect(
      shouldRedirectToSearchPage({
        redirectTo: '/global-search/%40uri',
        value: '   ',
      })
    ).toBe(false);
  });

  it('returns true when redirect target and non-empty query are present', () => {
    expect(
      shouldRedirectToSearchPage({
        redirectTo: '/global-search/%40uri',
        value: 'laptop',
      })
    ).toBe(true);
  });
});
