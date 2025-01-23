import { LightningElement, api } from 'lwc';

export default class ExampleCommerceHome extends LightningElement {
  /** @type {string} */
  @api engineId = 'example-commerce-recommendation-engine';
  /** @type {string} */
  @api trackingId = 'sports-ui-samples';
  /** @type {string} */
  @api language = 'en';
  /** @type {string} */
  @api country = 'US';
  /** @type {string} */
  @api currency = 'USD';
  /** @type {string} */
  @api commerceUrl = 'https://sports.barca.group';

}