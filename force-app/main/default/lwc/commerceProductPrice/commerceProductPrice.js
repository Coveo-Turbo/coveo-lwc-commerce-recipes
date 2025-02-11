// @ts-nocheck
import { getHeadlessBindings, getHeadlessBundle, initializeWithHeadless, registerComponentForInit } from 'c/commerceHeadlessLoader';
import { defaultCurrencyFormatter, parseValue } from 'c/commerceUtils';
import {LightningElement, api, track} from 'lwc';

/** @typedef {import("coveo").Product} Product */
/** @typedef {import("coveo").Context} ProductContext */
/** @typedef {import("coveo").ContextState} ProductContextState */
/** @typedef {import("coveo").ProductTemplatesHelpers} ProductTemplatesHelpers */
/** @typedef {import("coveo").InteractiveProduct} InteractiveProduct */

export default class CommerceProductPrice extends LightningElement {
  
  /**
   * The ID of the engine instance the component registers to.
   * @api
   * @type {string}
   */
  @api engineId;
  /**
   * The [product item](https://docs.coveo.com/en/headless/latest/reference/commerce/controllers/product-listing/#product).
   * @api
   * @type {Product}
   */
  @api product;

  /** @type {ProductContextState} */
  @track state = {};
  /** @type {string} */
  error = false;
  /** @type {boolean} */
  isInitialized = false;
  /** @type {boolean} */
  validated = false;
  /** @type {CoveoHeadlessCommerce} */
  headless;
  /** @type {bindings} */
  bindings;
  /** @type {ProductContext} */
  context;
  /** @type {Function} */
  unsubscribe;


  connectedCallback() {
    this.validateProps();
    registerComponentForInit(this, this.engineId);
  }

  renderedCallback() {
    initializeWithHeadless(this, this.engineId, this.initialize);
  }

  disconnectedCallback() {
    this.unsubscribe?.();
  }

  /**
  * @param {CommerceEngine} engine
  */
  initialize = (engine) => {
    this.headless = getHeadlessBundle(this.engineId);
    this.bindings = getHeadlessBindings(this.engineId);

    this.context = this.headless.buildContext(engine);
    this.unsubscribe = this.context.subscribe(() => this.updateState());
    // this.bindings.i18n.languages
    this.isInitialized = true;
  };

  updateState() {
    this.state = this.context?.state || {};
  }

  setError() {
    this.error = `${this.template.host.localName} Error`;
  }

  validateProps() {
    if (!this.product) {
      console.error(
        `The ${this.template.host.localName} requires the product attribute to be set.`
      );
      this.setError();
    }
    this.validated = true;
  }

  /**
   * Whether the field value can be displayed.
   * @returns {boolean}
   */
  get isValid() {
    return this.validated && !this.error;
  }

  get shouldDisplayPrice() {
    return !this.error && this.product && this.product.ec_price;
  }

  get hasPromotionalPrice() {
    return (
      this.product.ec_promo_price !== null &&
      this.product.ec_price !== null &&
      this.product.ec_promo_price < this.product.ec_price
    );
  }

  get mainPrice() {
    return this.getFormattedValue(
      this.hasPromotionalPrice ? 'ec_promo_price' : 'ec_price'
    );
  }

  get cssMainPrice() {
    return `slds-size_1-of-1 slds-text-align_left slds-truncate product-price ${this.hasPromotionalPrice && 'slds-text-color_error'}`;
  }

  get originalPrice() {
    return this.hasPromotionalPrice
    ? this.getFormattedValue('ec_price')
    : null;
  }

  get cssOriginalPrice() {
    return `slds-size_1-of-1 slds-text-heading_small slds-text-align_left product-price product-price-original ${(!this.originalPrice && 'slds-hidden')}`;
  }

  /**
  * @param {number} value
  * returns {string}
  */
  formatValue(value) {
    try {
      const {currency} = this.state;
      if (!currency) {
        return value.toString();
      }
      const formatter = defaultCurrencyFormatter(currency);
      // return formatter(value, this.bindings.i18n.languages);
      return formatter(value, ['en']);
    } catch (error) {
      this.error = error;
      return value.toString();
    }
  }

  /**
  * @param {string} field
  */
  parse(field) {
    try {
      return parseValue(this.product, field);
    } catch (error) {
      this.error = error;
      return null;
    }
  }

  /**
  * @param {string} field
  * @returns {string}
  */
  getFormattedValue(field) {
    const value = this.parse(field);
    if (value !== null) {
      return this.formatValue(value);
    }
    return value;
  }

}
