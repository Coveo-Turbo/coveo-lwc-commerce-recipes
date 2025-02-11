/* eslint-disable no-undef */
import {
  getBueno,
  registerComponentForInit,
  initializeWithHeadless,
  getHeadlessBundle,
} from 'c/commerceHeadlessLoader';
import {LightningElement, api} from 'lwc';

/** @typedef {import("coveo").Product} Product */
/** @typedef {import("coveo").HighlightKeyword} HighlightKeyword */

/**
 * The `CommerceProductHighlightedTextField` component displays a given product field value and supports text highlighting for the following fields: `ec_name`, `ec_description`, `printable URI`, `first sentences` and `summary`.
 * Make sure the field specified in this component is also included in the field array for the relevant template. See the this example: [Quantic usage](https://docs.coveo.com/en/quantic/latest/usage/#javascript).
 * @category Result Template
 * @example
 * <c-commerce-product-highlighted-text-field engine-id={engineId} product={product} field="title"></c-commerce-product-highlighted-text-field>
 */
export default class CommerceProductHighlightedTextField extends LightningElement {
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
  /**
   * (Optional) The label to display.
   * @api
   * @type {string}
   * @defaultValue `undefined`
   */
  @api label;
  /**
   * The field whose value is displayed by the component.
   * @api
   * @type {string}
   */
  @api field;

  /** @type {string} */
  error;
  /** @type {boolean} */
  isInitialized = false;
  /** @type {boolean} */
  validated = false;
  /** @type {CoveoHeadlessCommerce} */
  headless;

  connectedCallback() {
    this.validateProps();
    registerComponentForInit(this, this.engineId);
  }

  renderedCallback() {
    initializeWithHeadless(this, this.engineId, this.initialize);
    if (this.isValid && this.isInitialized) {
      this.updatDisplayOfResultTextValue();
    }
  }

  initialize = () => {
    this.headless = getHeadlessBundle(this.engineId);
    this.isInitialized = true;
  };

  setError() {
    this.error = `${this.template.host.localName} Error`;
  }

  validateProps() {
    getBueno(this).then(() => {
      if (!this.product || !this.field || !Bueno.isString(this.field)) {
        console.error(
          `The ${this.template.host.localName} requires a result and a field to be specified.`
        );
        this.setError();
      }
      if (this.label && !Bueno.isString(this.label)) {
        console.error(`The "${this.label}" label is not a valid string.`);
        this.setError();
      }
      this.validated = true;
    });
  }

  updatDisplayOfResultTextValue() {
    const fieldValue = this.headless.ProductTemplatesHelpers.getProductProperty(
      this.product,
      this.field
    );
    /** @type {HighlightKeyword[]} */
    // @ts-ignore
    const highlights = this.headless.ProductTemplatesHelpers.getProductProperty(
      this.product,
      `${this.field}Highlights`
    );

    if (highlights && this.headless?.HighlightUtils?.highlightString) {
      const openingDelimiter = '<b class="highlighted-field__highlight">';
      const closingDelimiter = '</b>';
      const highlightedValue = this.headless.HighlightUtils.highlightString({
        // @ts-ignore
        content: fieldValue,
        openingDelimiter,
        closingDelimiter,
        highlights,
      });
      // eslint-disable-next-line @lwc/lwc/no-inner-html
      this.resultTextValueElement.innerHTML = highlightedValue;
    } else {
      // @ts-ignore
      // eslint-disable-next-line @lwc/lwc/no-inner-html
      this.resultTextValueElement.innerHTML = fieldValue;
    }
  }

  get resultTextValueElement() {
    return this.template.querySelector('.result-text__value');
  }

  /**
   * Whether the field value can be displayed.
   * @returns {boolean}
   */
  get isValid() {
    return this.validated && !this.error;
  }
}
