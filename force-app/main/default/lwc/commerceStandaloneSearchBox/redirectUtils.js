export const shouldRedirectToSearchPage = ({redirectTo, value}) =>
  Boolean(redirectTo && value?.trim());
