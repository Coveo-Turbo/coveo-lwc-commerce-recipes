import nMore from '@salesforce/label/c.commerce_NMore';
import {
  getBueno
} from 'c/commerceHeadlessLoader';
import {I18nUtils} from 'c/commerceUtils';
import {LightningElement, api} from 'lwc';

/** @typedef {import("coveo").Product} Product */

/**
 * The `CommerceProductMultiValueText` component displays a given result multi-value field value.
 * Make sure the field specified in this component is also included in the field array for the relevant template. See the this example: [Quantic usage](https://docs.coveo.com/en/quantic/latest/usage/#javascript).
 * @category Product Template
 * @example
 * <template if:true={product.additionalFields.language}>
 *   <c-commerce-product-multi-value-text product={product} label="Languages" field="language" max-values-to-display="4"></c-commerce-product-multi-value-text>
 * </template>
 */
export default class CommerceProductMultiValueText extends LightningElement {
  /**
   * The [product item](https://docs.coveo.com/en/headless/latest/reference/commerce/controllers/product-listing/#product).
   * @api
   * @type {Product}
   */
  @api product;
  /**
   * The multi-value field whose values you want to display.
   * @api
   * @type {string}
   */
  @api field;
  /**
   * (Optional) The label to display.
   * @api
   * @type {string}
   * @defaultValue `undefined`
   */
  @api label;
  /**
   * The delimiter used to separate values when the field isn’t indexed as a multi value field.
   * @api
   * @type {string}
   * @defaultValue `undefined`
   */
  @api delimiter;
  /**
   * The maximum number of field values to display. If there are _n_ more values than the specified maximum, the last displayed value will be "_n more..._".
   * @api
   * @type {number}
   * @defaultValue `3`
   */
  @api maxValuesToDisplay = 3;

  /** @type {string} */
  error;
  /** @type {string} */
  joinSeparator = ', ';
  /** @type {boolean} */
  validated = false;

  labels = {
    nMore,
  };

  connectedCallback() {
    this.validateProps();
  }

  validateProps() {
    getBueno(this).then(() => {
      // eslint-disable-next-line no-undef
      if (!this.product || !this.field || !Bueno.isString(this.field)) {
        console.error(
          `The ${this.template.host.localName} requires a result and a multi-value field to be specified.`
        );
        this.setError();
      }
      // eslint-disable-next-line no-undef
      if (this.label && !Bueno.isString(this.label)) {
        console.error(`The "${this.label}" label is not a valid string.`);
        this.setError();
      }
      if (!this.fieldValue) {
        console.error(
          `Could not parse value from field "${this.field}" as a string array.`
        );
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
   * @returns {string[]}
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

    if (!value) {
      return undefined;
    }
    if (Array.isArray(value)) {
      return value.map((v) => `${v}`.trim());
    }
    // eslint-disable-next-line no-undef
    if (!Bueno?.isString(value)) {
      return undefined;
    }
    if (value.trim() === '') {
      return undefined;
    }

    return this.delimiter
      ? value.split(this.delimiter).map((v) => v.trim())
      : [value];
  }

  /**
   * The value to display.
   * @returns {string | undefined}
   */
  get valueToDisplay() {
    const value = this.fieldValue;
    if (value.length <= this.maxValuesToDisplay) {
      return value.join(this.joinSeparator);
    }
    const truncatedArray = value.slice(0, this.maxValuesToDisplay);
    truncatedArray.push(
      I18nUtils.format(
        this.labels.nMore,
        value.length - this.maxValuesToDisplay
      )
    );
    return truncatedArray.join(this.joinSeparator);
  }
}
