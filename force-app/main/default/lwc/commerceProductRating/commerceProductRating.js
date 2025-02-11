import {getBueno} from 'c/commerceHeadlessLoader';
import { computeNumberOfStars } from 'c/commerceUtils';
import {LightningElement, api, track} from 'lwc';

/** @typedef {import("coveo").Product} Product */

/**
 * The `CommerceProductRating` component displays a given result field value.
 * Make sure the field specified in this component is also included in the field array for the relevant template. See the this example: [Quantic usage](https://docs.coveo.com/en/quantic/latest/usage/#javascript).
 * @category Result Template
 * @example
 * <template if:true={product.ec_rating}>
 *   <c-quantic-result-rating product={product}></c-quantic-result-rating>
 * </template>
 */
export default class CommerceProductRating extends LightningElement {
  /**
   * The [product item](https://docs.coveo.com/en/headless/latest/reference/commerce/controllers/product-listing/#product) to use.
   * @api
   * @type {Product}
   */
  @api product;
  /**
   * (Optional) The field whose value you want to display next to the rating. This field can be used to display the number of reviews or the numerical value of the rating, for example.
   * @api
   * @type {string}
   * @defaultValue `undefined`
   */
  @api ratingDetailsField;
  /**
   * The field whose values you want to display.
   * @api
   * @type {string}
   */
  @api field = 'ec_rating';
  /**
   * The maximum number of field values to display. This value is also used as the number of icons to be displayed.
   * @api
   * @type {number}
   * @defaultValue `5`
   */
  @api maxIconsToDisplay = 5;

  /** @type {number|null} */
  @track numberOfStars;
  /** @type {string|number|null} */
  @track ratingDetails;

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
      if (this.ratingDetailsField && !Bueno.isString(this.ratingDetailsField)) {
        console.error(`The "${this.ratingDetailsField}" label is not a valid string.`);
        this.setError();
      }
      this.validated = true;
    });
  }

  renderedCallback() {
    if (this.isValid) {
      this.updateNumberOfStars();
      this.updateRatingDetailsValue();
    }
  }

  setError() {
    this.error = `${this.template.host.localName} Error`;
  }

  updateNumberOfStars() {
    // eslint-disable-next-line no-undef
    const value = CoveoHeadlessCommerce.ProductTemplatesHelpers.getProductProperty(
      this.product,
      this.field
    );
    try {
      this.numberOfStars = computeNumberOfStars(value, this.field);
    } catch (error) {
      console.error(error.message);
      this.setError();
      this.numberOfStars = null;
    }
  }

  updateRatingDetailsValue() {
    if (this.ratingDetailsField === undefined) {
      this.ratingDetails = null;
      return;
    }
    // eslint-disable-next-line no-undef
    const value = CoveoHeadlessCommerce.ProductTemplatesHelpers.getProductProperty(
      this.product,
      this.ratingDetailsField
    );

    if (value === null) {
      this.ratingDetails = null;
      return;
    }

    if (typeof value === 'string' || typeof value === 'number') {
      this.ratingDetails = value;
    } else {
      this.ratingDetails = null;
    }
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

  
  get emptyIconsToDisplay() {
    return Array.from({ length: this.maxIconsToDisplay }).map((_, index) => ({
      key: `inactive-icon-${index}`,
      index,
    }));
  }

  get activeIconsToDisplay() {
    return Array.from({ length: this.maxIconsToDisplay }).map((_, index) => ({
      key: `active-icon-${index}`,
      index,
    }));
  }

  get activeStarsStyle() {
    return `width: ${(this.numberOfStars / this.maxIconsToDisplay * 100).toString()}%`;
  }
}
