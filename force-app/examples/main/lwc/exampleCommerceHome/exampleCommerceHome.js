import { LightningElement, api } from 'lwc';
// @ts-ignore
import customersOftenBuyTemplate from './recommendationTemplates/customersOftenBuyTemplate.html';
// @ts-ignore
import mightBeInterestedInTemplate from './recommendationTemplates/mightBeInterestedInTemplate.html';
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

  handleCustomersOftenBuyTemplateRegistration(event) {
    event.stopPropagation();

    const productTemplatesManager = event.detail;

    productTemplatesManager.registerTemplates(
      {
        content: customersOftenBuyTemplate,
        conditions: [],
        priority: 1
      }
    );
  }

  handleMightBeInterestedInTemplateRegistration(event) {
    event.stopPropagation();

    const productTemplatesManager = event.detail;

    productTemplatesManager.registerTemplates(
      {
        content: mightBeInterestedInTemplate,
        conditions: [],
        priority: 1
      }
    );
  }
}