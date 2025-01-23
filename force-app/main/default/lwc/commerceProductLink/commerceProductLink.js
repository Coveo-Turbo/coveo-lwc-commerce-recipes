// @ts-nocheck
import navigateToRecord from '@salesforce/label/c.commerce_NavigateToRecord';
import opensInBrowserTab from '@salesforce/label/c.commerce_OpensInBrowserTab';
import {
  getHeadlessBundle,
  getHeadlessEnginePromise,
} from 'c/commerceHeadlessLoader';
import {ProductUtils} from 'c/commerceUtils';
import {NavigationMixin} from 'lightning/navigation';
import {LightningElement, api} from 'lwc';

/**
 * Some document types cannot be opened directly in Salesforce, but we need to open their parent record, as is the case for the Case Comment document type.
 */
const documentTypesRequiringParentRecord = ['CaseComment'];

/** @typedef {import("coveo").Product} Product */
/** @typedef {import("coveo").InteractiveProduct} InteractiveProduct */
/** @typedef {import("coveo").CommerceEngine} CommerceEngine */

/**
 * The `CommerceProductLink` component creates a clickable link from a product that points to the original item.
 * If the product is a Salesforce record it will open the link in a new salesforce console subtab.
 * Otherwise, it will open the link in the browser tab.
 * @category Product Template
 * @example
 * <c-commerce-product-link engine-id={engineId} product={product} target="_blank"></c-commerce-product-link>
 */
export default class CommerceProductLink extends NavigationMixin(
  LightningElement
) {
  static renderMode = "light"; // This is a light DOM component
  /**
   * The ID of the engine instance the component registers to.
   * @api
   * @type {string}
   */
  @api engineId;
  /**
   * The [product item](https://docs.coveo.com/en/headless/latest/reference/search/controllers/result-list/#result).
   * @api
   * @type {Product}
   */
  @api product;
  /**
   * @api
   * @type {InteractiveProduct}
   */
  @api interactiveProduct;
  /**
   * Where to display the linked URL, as the name for a browsing context (a tab, window, or <iframe>).
   * The following keywords have special meanings for where to load the URL:
   *   - `_self`: the current browsing context. (Default)
   *   - `_blank`: usually a new tab, but users can configure their browsers to open a new window instead.
   *   - `_parent`: the parent of the current browsing context. If there’s no parent, this behaves as `_self`.
   *   - `_top`: the topmost browsing context (the "highest" context that’s an ancestor of the current one). If there are no ancestors, this behaves as `_self`.
   * @api
   * @type {string}
   * @defaultValue `'_self'`
   */
  @api target = '_self';
  /**
   * A function used to set focus to the link.
   * @api
   * @type {VoidFunction}
   */
  @api setFocus() {
    const focusTarget = this.hostElement.querySelector('a');
    if (focusTarget) {
      // @ts-ignore
      focusTarget.focus();
    }
  }
  /**
   * Indicates the result field to display as the link text.
   * @api
   * @type {string}
   * @defaultValue `'ec_name'`
   */
  @api displayedField = 'ec_name';

  /** @type {CommerceEngine} */
  engine;
  /** @type {CoveoHeadlessCommerce} */
  headless;
  /** @type {string} */
  salesforceRecordUrl;

  labels = {
    navigateToRecord,
    opensInBrowserTab,
  };

  connectedCallback() {
    getHeadlessEnginePromise(this.engineId)
      .then((engine) => {
        this.initialize(engine);
      })
      .catch((error) => {
        console.error(error.message);
      });

    if (this.isSalesforceLink) {
      this[NavigationMixin.GenerateUrl]({
        type: 'standard__recordPage',
        attributes: {
          recordId: this.recordIdAttribute,
          actionName: 'view',
        },
      }).then((url) => {
        this.salesforceRecordUrl = url;
      });
    }
  }

  /**
   * @param {CommerceEngine} engine
   */
  initialize = (engine) => {
    this.headless = getHeadlessBundle(this.engineId);
    this.engine = engine;
    ProductUtils.bindClickEventsOnProduct(
      // Destructuring transforms the Proxy object created by Salesforce to a normal object so no unexpected behaviour will occur with the Headless library.
      {...this.product, additionalFields: {...this.product.additionalFields}},
      this.hostElement,
      this.interactiveProduct
    );
  };

  handleClick(event) {
    if (this.isSalesforceLink) {
      event.preventDefault();
      this.navigateToSalesforceRecord(event);
    }
  }

  navigateToSalesforceRecord(event) {
    event.stopPropagation();
    const targetPageRef = {
      type: 'standard__recordPage',
      attributes: {
        recordId: this.recordIdAttribute,
        actionName: 'view',
      },
    };
    this[NavigationMixin.Navigate](targetPageRef);
  }

  get recordIdAttribute() {
    // Knowledge article uses the knowledge article version id to navigate.
    if (this.product?.additionalFields?.sfkbid && this.product?.additionalFields?.sfkavid) {
      return this.product.additionalFields.sfkavid;
    }
    if (this.shouldOpenParentRecord) {
      return this.product?.additionalFields?.sfparentid;
    }
    return this.product.additionalFields.sfid;
  }

  get shouldOpenParentRecord() {
    return (
      documentTypesRequiringParentRecord.includes(
        // @ts-ignore
        this.product?.additionalFields?.documenttype
      ) && this.product?.additionalFields?.sfparentid
    );
  }

  /**
   * Checks if the Result type is Salesforce.
   */
  get isSalesforceLink() {
    return !!this.product?.additionalFields?.sfid;
  }

  /**
   * Returns the result field to display as the link title.
   */
  get fieldToDisplay() {
    return this.product[this.displayedField] ||
      this.product.additionalFields?.[this.displayedField]
      ? this.displayedField
      : 'clickUri';
  }

  /**
   * Returns the target for the link.
   */
  get targetTab() {
    if (this.isSalesforceLink) {
      return '_blank';
    }
    return this.target;
  }

  /**
   * Returns the aria label value for the link.
   */
  get ariaLabelValue() {
    if (this.isSalesforceLink) {
      return this.labels.navigateToRecord;
    }
    return this.labels.opensInBrowserTab;
  }

  get hrefValue() {
    if (this.isSalesforceLink) {
      return this.salesforceRecordUrl;
    }
    return this.product.clickUri;
  }
}
