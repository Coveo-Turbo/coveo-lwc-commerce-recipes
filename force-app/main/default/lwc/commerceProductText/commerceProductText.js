import {getBueno} from 'c/commerceHeadlessLoader';
import {LightningElement, api} from 'lwc';

/** @typedef {import("coveo").Product} Product */

/**
 * The `CommerceProductText` component displays a given result field value.
 * Make sure the field specified in this component is also included in the field array for the relevant template. See the this example: [Quantic usage](https://docs.coveo.com/en/quantic/latest/usage/#javascript).
 * @category Result Template
 * @example
 * <template if:true={result.raw.source}>
 *   <c-quantic-result-text result={result} label="Source" field="source"></c-quantic-result-text>
 * </template>
 */
export default class CommerceProductText extends LightningElement {
  /**
   * The [product item](https://docs.coveo.com/en/headless/latest/reference/commerce/controllers/product-listing/#product) to use.
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
   * The field whose values you want to display.
   * @api
   * @type {string}
   */
  @api field;
  /**
   * The function used to format the displayed value.
   * @api
   * @type {Function}
   * @param {string} value
   * @returns {string}
   */
  @api formattingFunction;

  /** @type {string} */
  error;
  validated = false;

  connectedCallback() {
    getBueno(this).then(() => {
      // eslint-disable-next-line no-undef
      if (!this.product || !this.field || !Bueno.isString(this.field)) {
        console.error(
          `The ${this.template.host.localName} requires a result and a field to be specified.`
        );
        this.setError();
      }
      // eslint-disable-next-line no-undef
      if (this.label && !Bueno.isString(this.label)) {
        console.error(`The "${this.label}" label is not a valid string.`);
        this.setError();
      }
      this.validated = true;
    });
  }

  setError() {
    this.error = `${this.template.host.localName} Error`;
  }

  /**
   * Whether the field value can be displayed.
   * @returns {boolean}
   */
  get isValid() {
    return this.validated && !this.error;
  }

  /**
   * The value of the given result field.
   * @returns {string | undefined}
   */
  get fieldValue() {
    if (!this.field) {
      return undefined;
    }

    // eslint-disable-next-line no-undef
    const value = CoveoHeadlessCommerce.ProductTemplatesHelpers.getProductProperty(
      this.product,
      this.field
    );

    return value ? String(value) : undefined;
  }

  /**
   * The value to display.
   * @returns {string | undefined}
   */
  get valueToDisplay() {
    if (this.formattingFunction) {
      return this.formattingFunction(this.fieldValue);
    }
    return this.fieldValue;
  }
}
