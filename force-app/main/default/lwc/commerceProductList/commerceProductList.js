// @ts-nocheck
import loadingResults from '@salesforce/label/c.commerce_LoadingResults';
import {
  registerComponentForInit,
  initializeWithHeadless,
  getHeadlessBundle,
  getHeadlessBindings
} from 'c/commerceHeadlessLoader';
import { AriaLiveRegion } from 'c/commerceUtils';
import { LightningElement, api, track } from 'lwc';

/** @typedef {import("coveo").CommerceEngine} CommerceEngine */
/** @typedef {import("coveo").Product} Product */
/** @typedef {import("coveo").ProductListing} ProductListing */
/** @typedef {import("coveo").ProductListingState} ProductListingState */
/** @typedef {import("coveo").ProductListingSummaryState} ProductListingSummaryState */
/** @typedef {import("coveo").ProductTemplatesManager} ProductTemplatesManager  */
/** @typedef {import("coveo").Search} Search */
/** @typedef {import("coveo").SearchState} SearchState */
/** @typedef {import("coveo").SearchSummaryState} SearchSummaryState */
/** @typedef {import("coveo").Summary} Summary */


export default class CommerceProductList extends LightningElement {
  /**
  * The ID of the engine instance the component registers to.
  * @api
  * @type {string}
  */
  @api engineId;

  /**
  * The desired number of placeholders to display while the product list is loading.
  * @api
  * @type {number}
  */
  @api numberOfPlaceholders = 24;
  /**
  * Number of columns to display.
  * Default:  4 columns
  * @api
  * @type {number}
  */
  @api numberOfColumns = 4;

  /** @type {ProductListingState | SearchState}*/
  @track state;

  /** @type {ProductListingSummaryState | SearchSummaryState} */
  @track summaryState;

  /** @type {ProductListing} */
  productListing;
  /** @type {Search} */
  search;
  /** @type {Summary<ProductListingSummaryState | SearchSummaryState>} */
  summary;
  /** @type {boolean} */
  showPlaceholder = true;
  /** @type {Function} */
  unsubscribeProductListing;
  /** @type {Function} */
  unsubscribeSearch;
  /** @type {Function} */
  unsubscribeSummary;
  /** @type {ProductTemplatesManager} */
  productTemplatesManager;
  /** @type {CoveoHeadlessCommerce} */
  headless;
  /** @type {bindings} */
  bindings;
  /** @type {import('c/commerceUtils').AriaLiveUtils} */
  loadingAriaLiveMessage;
  /** @type {boolean} */
  hasInitializationError = false;

  labels = {
    loadingResults,
  };

  connectedCallback() {
    registerComponentForInit(this, this.engineId);
  }

  renderedCallback() {
    initializeWithHeadless(this, this.engineId, this.initialize);
  }

  /**
   * @param {CommerceEngine} engine
   */
  initialize = (engine) => {
    this.loadingAriaLiveMessage = AriaLiveRegion('loading', this);
    this.headless = getHeadlessBundle(this.engineId);
    this.bindings = getHeadlessBindings(this.engineId);


    if (this.bindings?.interfaceElement?.type === 'product-listing') {
      this.productListing = this.headless.buildProductListing(engine);
      this.summary = this.productListing.summary();
      this.unsubscribeProductListing = this.productListing.subscribe(() => this.updateState());
    } else {
      this.search = this.headless.buildSearch(engine);
      this.summary = this.search.summary();
      this.unsubscribeSearch = this.search.subscribe(() => this.updateState());
    }

    this.unsubscribeSummary = this.summary.subscribe(() => this.updateState());

    console.log('bindings', this.bindings);

    this.productTemplatesManager = this.headless.buildProductTemplatesManager(engine);
    this.registerTemplates();

  };

  registerTemplates() {
    this.dispatchEvent(
      new CustomEvent('registerproducttemplates', {
        bubbles: true,
        detail: this.productTemplatesManager,
      })
    );
  }

  disconnectedCallback() {
    this.unsubscribeProductListing?.();
    this.unsubscribeSearch?.();
  }

  updateState() {
    this.state = this.bindings?.interfaceElement?.type === 'product-listing'
      ? this.productListing?.state
      : this.search?.state;

    this.summaryState = this.summary?.state;
    this.showPlaceholder =
      this.summaryState?.isLoading &&
      !this.summaryState?.hasError &&
      !this.summaryState?.firstRequestExecuted &&
      this.summaryState?.hasProducts;

    if (this.showPlaceholder) {
      this.loadingAriaLiveMessage.dispatchMessage(this.labels.loadingResults);
    }
    console.log('updateState', this.state, this.summary);
  }

  get hasProducts() {
    return this.summaryState?.hasProducts;
  }

  get columnClass() {
    const columnSizeClass = `-size_1-of-${this.numberOfColumns}`;
    return `slds-col slds-var-m-bottom_medium slds${columnSizeClass}`;
  }

  get rows() {
    return Array.from({ length: (this.numberOfPlaceholders / this.numberOfColumns) }, (_, i) => i + 1);
  }

  get columns() {
    return Array.from({ length: this.numberOfColumns }, (_, i) => i + 1);
  }

  get products() {
    // We need to add a unique key to each result to make sure to re-render the LWC when the results change.
    // If the unique key is only the result uniqueId, the LWC will not re-render when the results change AND the same result is still in the results.
    const responseId = this?.state?.responseId || Math.random();
    return (
      this.state?.products?.map((product) => ({
        ...product,
        keyProductList: `${responseId}_${product.uniqueId}`,
      })) || []
    );
  }
  /**
   * Sets the component in the initialization error state.
   */
  setInitializationError() {
    this.hasInitializationError = true;
  }
}