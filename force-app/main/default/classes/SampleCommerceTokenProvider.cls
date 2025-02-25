/**
 * Return a static sample configuration with pre-configured value for the sample organization.
 */
global with sharing class SampleCommerceTokenProvider implements ICommerceTokenProvider {
  /**
   * @see `ICommerceTokenProvider.getHeadlessConfiguration`.
   */
  public static String getHeadlessConfiguration() {
    Map<String, Object> headlessConfiguration = new Map<String, Object>();
    headlessConfiguration.put('organizationId', 'searchuisamples');
    headlessConfiguration.put(
      'accessToken',
      'xx564559b1-0045-48e1-953c-3addd1ee4457'
    );

    // Create cart items list
    List<Map<String, Object>> cartItems = new List<Map<String, Object>>();

    cartItems.add(new Map<String, Object>{
        'productId' => 'SP01057_00001',
        'quantity' => 1,
        'name' => 'Kayaker Canoe',
        'price' => 800
    });

    cartItems.add(new Map<String, Object>{
        'productId' => 'SP00081_00001',
        'quantity' => 1,
        'name' => 'Bamboo Canoe Paddle',
        'price' => 120
    });

    cartItems.add(new Map<String, Object>{
        'productId' => 'SP04236_00005',
        'quantity' => 1,
        'name' => 'Eco-Brave Rashguard',
        'price' => 33
    });

    cartItems.add(new Map<String, Object>{
        'productId' => 'SP04236_00005',
        'quantity' => 1,
        'name' => 'Eco-Brave Rashguard',
        'price' => 33
    });

    // Create cart map and add items
    Map<String, Object> cart = new Map<String, Object>{
        'items' => cartItems
    };

    // Add cart to headless configuration
    headlessConfiguration.put('cart', cart);

    return JSON.serialize(headlessConfiguration);
  }
}
