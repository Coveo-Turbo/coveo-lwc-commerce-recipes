import { LightningElement, api } from 'lwc';

export default class ExampleCommerceSearch extends LightningElement {
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
  @api commerceUrl = 'https://sports.barca.group/commerce-search';
  /** @type {boolean} */
  @api disableStateInUrl = false;
}