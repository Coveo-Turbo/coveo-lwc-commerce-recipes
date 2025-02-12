import { LightningElement, track, api } from 'lwc';
// @ts-ignore
import cartRecTemplate from './recommendationTemplates/cartRecTemplate.html';

export default class ExampleCommerceCart extends LightningElement {

    /** @type {string} */
    @api engineId = 'example-commerce-engine';
    /** @type {string} */
    @api trackingId = 'sports-ui-samples';
    /** @type {string} */
    @api language = 'en';
    /** @type {string} */
    @api country = 'US';
    /** @type {string} */
    @api currency = 'USD';
    /** @type {string} */
    @api commerceUrl = 'https://sports.barca.group/cart';

    @track cartItems = [
        {
            id: "SP01057_00001",
            name: "Kayaker Canoe",
            image: "https://images.barca.group/Sports/mj/Canoes%20and%20Kayaks/Canoes/Inflatable/44_White/26a85b443467_bottom_left.webp",
            price: 800.00,
            quantity: 1,
            details: "This White inflatable canoe is perfect for fun on the water.",
            estimatedShipDate: 'June 6th'
        },
        {
            id: "SP00081_00001",
            name: "Bamboo Canoe Paddle",
            image: "https://images.barca.group/Sports/mj/Paddle%20Sports/Parts%20%26%20Accessories/Paddles/11_Canoe_Paddle_Bamboo/716ff605a3a4_bottom_left.webp",
            price: 120.00,
            quantity: 1,
            details: "This canoe paddle is made of bamboo and is perfect for novice paddlers."
        },
        {
            id: "SP04236_00005",
            name: 'Eco-Brave Rashguard',
            image: "https://images.barca.group/Sports/mj/Clothing/Rashguard/28_Women_Green_Long_Sleeve_Neoprene/6fae1876a0b0_bottom_left.webp",
            price: 33.00,
            quantity: 2,
            // details: "This Women's Green Neoprene Long Sleeve rashguard is perfect for keeping you comfortable and protected from the sun during your next outdoor activity. The neoprene fabric is highly resistant to Sunburn, Sweat, and Weathering, so you can rest assured that you'll stay cool and dry all day long."
        }
    ];

    // subtotal = 1019.98;
    // salesTax = 102.00;
    couponCode = '';

    get grandTotal() {
        return this.subtotal + this.salesTax;
    }

    get grandTotalToDisplay() {
        return parseFloat(this.grandTotal).toFixed(2);
    }

    get subtotal() {
      return this.cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    }

    get subtotalToDisplay() {
      return parseFloat(this.subtotal).toFixed(2);
    }

    get salesTax() {
        return this.subtotal * 0.15;
    }

    get salesTaxToDisplay() {
        return parseFloat(this.salesTax).toFixed(2);
    }

    get augmentedCartItems() {
        return this.cartItems.map(item => {
            return { 
              ...item, 
              price: item.price,
              total:  item.price * item.quantity,
              totalToDisplay: parseFloat(item.price * item.quantity).toFixed(2)
            }
        });
    }

    handleQuantityChange(event) {
      const itemId = event.target.dataset.id;
      const action = event.target.dataset.action;
      this.cartItems = this.cartItems.map(item => {
          if (String(item.id) === itemId) {
              if (action === 'increase') {
                  return { ...item, quantity: item.quantity + 1 };
              } else if (action === 'decrease' && item.quantity > 1) {
                  return { ...item, quantity: item.quantity - 1 };
              }
          }
          return item;
      });
    }

    handleRemove(event) {
      const itemId = event.target.dataset.id;
      this.cartItems = this.cartItems.filter(item => item.id !== itemId);
    }

    handleRecommendationTemplateRegistration(event) {
      console.log('handleRecommendationTemplateRegistration', event);
      event.stopPropagation();

      const productTemplatesManager = event.detail;

      productTemplatesManager.registerTemplates(
        {
          content: cartRecTemplate,
          conditions: [],
          priority: 1
        }
      );
    }
}
