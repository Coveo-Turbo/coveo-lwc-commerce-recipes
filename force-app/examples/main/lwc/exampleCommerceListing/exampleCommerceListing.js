import { LightningElement, api } from 'lwc';

export default class ExampleCommerceListing extends LightningElement {
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
  @api commerceUrl;
  /** @type {boolean} */
  @api disableStateInUrl = false;
}