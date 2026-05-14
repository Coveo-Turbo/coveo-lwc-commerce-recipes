export const shouldRedirectToSearchPage = ({
  hasPendingRedirect,
  redirectTo,
  value,
}) => Boolean(hasPendingRedirect && redirectTo && value?.trim());
