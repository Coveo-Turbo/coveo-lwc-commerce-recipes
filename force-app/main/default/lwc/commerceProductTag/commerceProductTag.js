import featured from '@salesforce/label/c.commerce_Featured';
import recommended from '@salesforce/label/c.commerce_Recommended';
import {LightningElement, api} from 'lwc';

/** @typedef {import("coveo").Product} Product */

/**
 * The `CommerceProductTag` component displays a tag to be used in product templates.
 * @category Product Template
 * @example
 * <c-commerce-product-tag variant="recommended"></c-commerce-product-tag>
 */
export default class CommerceProductTag extends LightningElement {
  /**
   * The tag variant.
   * @api
   * @type {'featured'|'recommended'}
   */
  @api variant;
  /**
   * The [product item](https://docs.coveo.com/en/headless/latest/reference/commerce/controllers/product-listing/#product).
   * @api
   * @type {Product}
   */
  @api product;

  variants = {
    recommended: {
      label: recommended,
      icon: 'utility:favorite',
      condition: (product) => product.isRecommendation,
    },
    featured: {
      label: featured,
      icon: 'utility:pinned',
      condition: (product) => product.isTopResult,
    },
  };

  /** @type {string} */
  error;

  connectedCallback() {
    let hasError = false;
    if (!this.variant) {
      console.error(
        `The ${this.template.host.localName} requires the variant attribute to be set.`
      );
      hasError = true;
    }
    if (!this.product) {
      console.error(
        `The ${this.template.host.localName} requires the product attribute to be set.`
      );
      hasError = true;
    }
    if (hasError) {
      this.error = `${this.template.host.localName} Error`;
    }
  }

  renderedCallback() {
    this.setTagClass();
  }

  setTagClass() {
    this.template.querySelector('.product-tag')?.classList.add(this.tagClass);
  }

  get label() {
    return this.variants[this.variant].label;
  }

  get icon() {
    return this.variants[this.variant].icon;
  }

  get tagClass() {
    return `${this.variant}-tag`;
  }

  get shouldDisplayBadge() {
    return !this.error && this.variants[this.variant].condition(this.product);
  }
}
