import {shouldRedirectToSearchPage} from '../redirectUtils';

describe('shouldRedirectToSearchPage', () => {
  it('returns false when redirectTo is missing', () => {
    expect(
      shouldRedirectToSearchPage({
        hasPendingRedirect: true,
        redirectTo: null,
        value: 'laptop',
      })
    ).toBe(false);
  });

  it('returns false when redirect is not pending', () => {
    expect(
      shouldRedirectToSearchPage({
        hasPendingRedirect: false,
        redirectTo: '/global-search/%40uri',
        value: 'laptop',
      })
    ).toBe(false);
  });

  it('returns false when query is empty or whitespace even when redirect is pending', () => {
    expect(
      shouldRedirectToSearchPage({
        hasPendingRedirect: true,
        redirectTo: '/global-search/%40uri',
        value: '',
      })
    ).toBe(false);
    expect(
      shouldRedirectToSearchPage({
        hasPendingRedirect: true,
        redirectTo: '/global-search/%40uri',
        value: '   ',
      })
    ).toBe(false);
  });

  it('returns true when redirect is pending and query is non-empty', () => {
    expect(
      shouldRedirectToSearchPage({
        hasPendingRedirect: true,
        redirectTo: '/global-search/%40uri',
        value: 'laptop',
      })
    ).toBe(true);
  });
});
