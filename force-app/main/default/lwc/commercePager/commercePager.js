// @ts-nocheck
import goToPage from '@salesforce/label/c.commerce_GoToPage';
import nextPage from '@salesforce/label/c.commerce_NextPage';
import previousPage from '@salesforce/label/c.commerce_PreviousPage';
import {
  registerComponentForInit,
  initializeWithHeadless,
  getHeadlessBundle,
  getHeadlessBindings
} from 'c/commerceHeadlessLoader';
import {I18nUtils} from 'c/commerceUtils';
import {LightningElement, api, track} from 'lwc';

/** @typedef {import("coveo").Pagination} Pagination */
/** @typedef {import("coveo").PaginationState} PaginationState */
/** @typedef {import("coveo").ProductListing} ProductListing */
/** @typedef {import("coveo").Search} Search */
/** @typedef {import("coveo").CommerceEngine} CommerceEngine */

/**
 * The `CommercePager` provides buttons that allow the end user to navigate through the different product pages.
 * @example
 * <c-commerce-pager engine-id={engineId} number-of-pages="4"></c-commerce-pager>
 */
export default class CommercePager extends LightningElement {
  /**
   * The ID of the engine instance the component registers to.
   * @api
   * @type {string}
   */
  @api engineId;
  /**
   * Specifies how many page buttons to display in the pager.
   * @api
   * @type {number}
   * @defaultValue 5
   */
  @api numberOfPages = 5;

  /** @type {number[]} */
  @track currentPages;
  /** @type {boolean}*/
  @track hasItems;

  /** @type {PaginationState}*/
  @track pagerState;
  /** @type {Pagination} */
  pager;
  /** @type {ProductListing | Search} */
  listingOrSearch;
  /** @type {Function} */
  unsubscribe;
  /** @type {number} */
  currentPage = 1;
  /** @type {CoveoHeadlessCommerce} */
  headless;
  /** @type {bindings} */
  bindings;
  /** @type {boolean} */
  hasInitializationError = false;

  labels = {
    nextPage,
    previousPage,
    goToPage,
  };

  connectedCallback() {
    registerComponentForInit(this, this.engineId);
  }

  renderedCallback() {
    initializeWithHeadless(this, this.engineId, this.initialize);
  }

  /**
   * @param {SearchEngine} engine
   */
  initialize = (engine) => {
    this.headless = getHeadlessBundle(this.engineId);
    this.bindings = getHeadlessBindings(this.engineId);

    this.listingOrSearch = this.controllerBuilder(engine);
    
    this.pager = this.listingOrSearch.pagination();
    this.unsubscribe = this.pager.subscribe(() => this.updateState());
  };

  disconnectedCallback() {
    this.unsubscribe?.();
  }

  updateState() {
    this.currentPages = Array.from({ length: this.numberOfPages }, (_, i) => i + 1);
    this.currentPage = this.pager.state.page + 1;
    this.hasItems = this.pager.state.totalPages > 1;
  }

  previous() {
    this.pager.previousPage();
  }

  next() {
    this.pager.nextPage();
  }

  get isProductListing() {
    return this.bindings?.interfaceElement?.type === 'product-listing';
  }

  get controllerBuilder() {
    return this.isProductListing ? this.headless.buildProductListing : this.headless.buildSearch;
  }

  /**
   * @param {CustomEvent<number>} event
   */
  goto(event) {
    this.pager.selectPage(event.detail);
  }

  get nextDisabled() {
    return this.pager.state.page + 1 >= this.pager.state.totalPages;
  }

  get previousDisabled() {
    return this.pager.state.page === 0;
  }

  get currentPagesObjects() {
    return this.currentPages.map((page) => ({
      number: page,
      selected: page === this.currentPage,
      ariaLabelValue: I18nUtils.format(this.labels.goToPage, page),
    }));
  }

  /**
   * Sets the component in the initialization error state.
   */
  setInitializationError() {
    this.hasInitializationError = true;
  }
}
