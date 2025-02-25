@isTest
private class SampleCommerceTokenProviderTest {
  static final String sampleHeadlessConfiguration = '{"accessToken":"xx564559b1-0045-48e1-953c-3addd1ee4457","organizationId":"searchuisamples"}';
  @IsTest
  static void shouldReturnStringifiedConfiguration() {
    Test.startTest();
    String jsonString = SampleCommerceTokenProvider.getHeadlessConfiguration();
    Map<String, Object> headlessConfiguration = (Map<String, Object>) JSON.deserializeUntyped(jsonString);
    System.assert(headlessConfiguration.containsKey('organizationId'),
        'organizationId required on headless configuration');
    System.assert(headlessConfiguration.containsKey('accessToken'),
        'accessToken required on headless configuration');
    Test.stopTest();
  }
}
