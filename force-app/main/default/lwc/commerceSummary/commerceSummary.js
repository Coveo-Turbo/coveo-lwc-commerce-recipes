// @ts-nocheck
import LOCALE from '@salesforce/i18n/locale';
import noResults from '@salesforce/label/c.commerce_NoResults';
import noResultsFor from '@salesforce/label/c.commerce_NoResultsFor';
import showingResultsOf from '@salesforce/label/c.commerce_ShowingResultsOf';
import showingResultsOfWithQuery from '@salesforce/label/c.commerce_ShowingResultsOfWithQuery';
import showingResultsOfWithQuery_plural from '@salesforce/label/c.commerce_ShowingResultsOfWithQuery_plural';
import showingResultsOf_plural from '@salesforce/label/c.commerce_ShowingResultsOf_plural';
import {
  registerComponentForInit,
  initializeWithHeadless,
  getHeadlessBundle,
  getHeadlessBindings
} from 'c/commerceHeadlessLoader';
import {AriaLiveRegion, I18nUtils} from 'c/commerceUtils';
import {LightningElement, track, api} from 'lwc';

/** @typedef {import("coveo").CommerceEngine} SearchEngine */
/** @typedef {import("coveo").Summary} Summary */
/** @typedef {import("coveo").ProductListing} ProductListing */
/** @typedef {import("coveo").Search} Search */
/** @typedef {import("coveo").SearchSummaryState} SearchSummaryState */
/** @typedef {import("coveo").ProductListingSummaryState} ProductListingSummaryState */


/**
 * The `CommerceSummary` component displays information about the current range of results (e.g., "Results 1-10 of 123").
 * @example
 * <c-commerce-summary engine-id={engineId}></c-commerce-summary>
 */
export default class CommerceSummary extends LightningElement {
  /**
   * The ID of the engine instance the component registers to.
   * @api
   * @type {string}
   */
  @api engineId;

  // /** @type {ProductListingState | SearchState}*/
  // @track state;
  /** @type {ProductListingSummaryState | SearchSummaryState} */
  @track state;

  /** @type {ProductListing | Search} */
  listingOrSearch;
  /** @type {Summary<ProductListingSummaryState | SearchSummaryState>} */
  summary;
  /** @type {Function} */
  unsubscribe;
  /** @type {CoveoHeadlessCommerce} */
  headless;
  /** @type {Bindings} */
  bindings;
  /** @type {import('c/commerceUtils').AriaLiveUtils} */
  summaryAriaMessage;
  /** @type {boolean} */
  hasInitializationError = false;

  labels = {
    noResults,
    noResultsFor,
    showingResultsOf,
    showingResultsOf_plural,
    showingResultsOfWithQuery,
    showingResultsOfWithQuery_plural,
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

    this.summary = this.listingOrSearch.summary();
    this.summaryAriaMessage = AriaLiveRegion('summary', this);
    this.unsubscribe = this.summary.subscribe(() => this.updateState());
  };

  disconnectedCallback() {
    this.unsubscribe?.();
  }

  updateState() {
    this.state = this.summary?.state;

    // this.summaryState = this.summary?.state;
    // this.showPlaceholder =
    //   this.summaryState?.isLoading &&
    //   !this.summaryState?.hasError &&
    //   !this.summaryState?.firstRequestExecuted &&
    //   this.summaryState?.hasProducts;

    if (this.state?.hasProducts) {
      this.updateAriaMessage();
    }
  }

  updateAriaMessage() {
    const docElement = document.createElement('div');
    // eslint-disable-next-line @lwc/lwc/no-inner-html
    docElement.innerHTML = this.summaryLabel;
    this.summaryAriaMessage.dispatchMessage(docElement.innerText);
  }

  get isProductListing() {
    return this.bindings?.interfaceElement?.type === 'product-listing';
  }

  get controllerBuilder() {
    return this.isProductListing ? this.headless.buildProductListing : this.headless.buildSearch;
  }

  get hasProducts() {
    return this.state?.hasProducts;
  }

  get hasQuery() {
    return this.state?.query;
  }

  get query() {
    return this.hasQuery ? `${this.state.query}` : '';
  }

  get range() {
    return `${Intl.NumberFormat(LOCALE).format(
      this.state?.firstProduct
    )}-${Intl.NumberFormat(LOCALE).format(this.state?.lastProduct)}`;
  }

  get total() {
    return Intl.NumberFormat(LOCALE).format(this.state?.totalNumberOfProducts).toString();
  }

  get noResultsLabel() {
    return I18nUtils.format(
      this.hasQuery ? this.labels.noResultsFor : this.labels.noResults,
      I18nUtils.getTextBold(I18nUtils.escapeHTML(this.query))
    );
  }

  get summaryLabel() {
    const labelName = this.hasQuery
      ? I18nUtils.getLabelNameWithCount(
          'showingResultsOfWithQuery',
          this.state?.lastProduct
        )
      : I18nUtils.getLabelNameWithCount(
          'showingResultsOf',
          this.state?.lastProduct
        );
    return I18nUtils.format(
      this.labels[labelName],
      I18nUtils.getTextWithDecorator(
        this.range,
        '<b class="summary__range">',
        '</b>'
      ),
      I18nUtils.getTextWithDecorator(
        this.total,
        '<b class="summary__total">',
        '</b>'
      ),
      I18nUtils.getTextWithDecorator(
        I18nUtils.escapeHTML(this.query),
        '<b class="summary__query">',
        '</b>'
      )
    );
  }

  /**
   * Sets the component in the initialization error state.
   */
  setInitializationError() {
    this.hasInitializationError = true;
  }
}
