// @ts-nocheck
import {
  registerComponentForInit,
  initializeWithHeadless,
  getHeadlessBundle,
  getHeadlessBindings
} from 'c/commerceHeadlessLoader';
import { LightningElement, api, track } from 'lwc';

/** @typedef {import("coveo").CommerceEngine} CommerceEngine */
/** @typedef {import("coveo").FacetGenerator} FacetGenerator */
/** @typedef {import("coveo").FacetGeneratorState} FacetGeneratorState */
/** @typedef {import("coveo").CategoryFacet} CategoryFacet */
/** @typedef {import("coveo").RegularFacet} RegularFacet */
/** @typedef {import("coveo").DateFacet} DateFacet */
/** @typedef {import("coveo").NumericFacet} NumericFacet */
/** @typedef {import("coveo").ProductListingSummaryState} ProductListingSummaryState */
/** @typedef {import("coveo").SearchSummaryState} SearchSummaryState */
/** @typedef {import("coveo").Summary} Summary */

export default class CommerceFacets extends LightningElement {
  /**
  * The ID of the engine instance the component registers to.
  * @api
  * @type {string}
  */
  @api engineId;
  /**
  * The maximum number of facets to expand.
  * Remaining facets are automatically collapsed.
  * @api
  * @type {number}
  */
  @api collapseFacetsAfter = 4;


  /** @type {ProductListingSummaryState | SearchSummaryState} */
  @track summaryState;
  /** @type {FacetGeneratorState} */
  @track facetGeneratorState;

  /** @type {FacetGenerator} */
  facetGenerator;
  /** @type {Summary<ProductListingSummaryState | SearchSummaryState>} */
  summary;
  /** @type {boolean} */
  showPlaceholder = true;
  /** @type {Function} */
  unsubscribeFacetGenerator;
  /** @type {Function} */
  unsubscribeSummary;
  /** @type {CoveoHeadlessCommerce} */
  headless;
  /** @type {bindings} */
  bindings;
  /** @type {boolean} */
  hasInitializationError = false;

  connectedCallback() {
    registerComponentForInit(this, this.engineId);
  }

  renderedCallback() {
    initializeWithHeadless(this, this.engineId, this.initialize);
  }

  disconnectedCallback() {
    this.unsubscribeFacetGenerator?.();
    this.unsubscribeSummary?.();
  }

  /**
   * @param {CommerceEngine} engine
   */
  initialize = (engine) => {
    this.headless = getHeadlessBundle(this.engineId);
    this.bindings = getHeadlessBindings(this.engineId);

    const controller = this.controllerBuilder(engine);
    this.facetGenerator = controller.facetGenerator();
    this.summary = controller.summary();

    this.unsubscribeFacetGenerator = this.facetGenerator.subscribe(() => this.updateState());
    this.unsubscribeSummary = this.summary.subscribe(() => this.updateState());

    console.log('Facet Generator:', this.facetGenerator.facets.length);
  }

  updateState() {
    this.summaryState = this.summary?.state;
    this.facetGeneratorState = this.facetGenerator?.state;
    this.showPlaceholder =
      this.summaryState?.isLoading &&
      !this.summaryState?.hasError &&
      !this.summaryState?.firstRequestExecuted &&
      this.summaryState?.hasProducts;
  }

  get isProductListing() {
    return this.bindings?.interfaceElement?.type === 'product-listing';
  }

  get controllerBuilder() {
    return this.isProductListing ? this.headless.buildProductListing : this.headless.buildSearch;
  }

  shouldCollapseFacet(index) {
    if (this.collapseFacetsAfter === -1) {
      return false;
    }
    return this.collapseFacetsAfter
      ? index + 1 > this.collapseFacetsAfter
      : true;
  }

  get facetPlaceholders(){
    return Array.from({ length: this.collapseFacetsAfter }, (_, i) => i);
  }

  get facets() { 
    if (!this.facetGeneratorState?.length) {
      return [];
    }
    return (
      this.facetGenerator?.facets?.map((facet, index) => ({
        field: facet.state.field,
        key: facet.state.facetId,
        props:{
          engineId: this.engineId,
          facet,
          field: facet.state.field,
          summary: this.summary,
          isCollapsed: this.shouldCollapseFacet(index)
        },
        isRegularFacet: this.isRegularFacet(facet),
        isNumericFacet: this.isNumericFacet(facet),
        isDateFacet: this.isDateFacet(facet),
        isHierarchicalFacet: this.isHierarchicalFacet(facet),
      })) || []
    );
  }

  isRegularFacet(facet) {
    return facet.state.type === 'regular';
  }

  isNumericFacet(facet) {
    return facet.state.type === 'numericalRange';
  }

  isDateFacet(facet) {
    return facet.state.type === 'dateRange';
  }

  isHierarchicalFacet(facet) {
    return facet.state.type === 'hierarchical';
  }
}