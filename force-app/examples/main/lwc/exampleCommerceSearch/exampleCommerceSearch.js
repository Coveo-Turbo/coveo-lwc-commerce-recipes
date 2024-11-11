import { LightningElement, api } from 'lwc';

export default class ExampleCommerceSearch extends LightningElement {
  /** @type {string} */
  @api engineId = 'example-commerce-search';
  /** @type {string} */
  @api trackingId = 'sports-ui-samples';
  /** @type {boolean} */
  @api disableStateInUrl = false;
}