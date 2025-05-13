import invalidCustomSortConfig from '@salesforce/label/c.commerce_InvalidCustomSortConfiguration';
import newest from '@salesforce/label/c.commerce_Newest';
import oldest from '@salesforce/label/c.commerce_Oldest';
import relevancy from '@salesforce/label/c.commerce_Relevancy';
import sortBy from '@salesforce/label/c.commerce_SortBy';
import {
  registerComponentForInit,
  initializeWithHeadless,
  getHeadlessBundle,
  getHeadlessBindings,
  registerSortOptionsToStore,
} from 'c/commerceHeadlessLoader';
import {LightningElement, track, api} from 'lwc';

/** @typedef {import("coveo").Sort} Sort */
/** @typedef {import("coveo").SortState} SortState */
/** @typedef {import("coveo").ProductListing} ProductListing */
/** @typedef {import("coveo").ProductListingState} ProductListingState */
/** @typedef {import("coveo").Search} Search */
/** @typedef {import("coveo").SearchState} SearchState */
/** @typedef {import("coveo").CommerceEngine} CommerceEngine */
/** @typedef {import("coveo").SortCriterion} SortCriterion */
/**
 * @typedef SortOption
 * @property {string} label
 * @property {string} value
 * @property {SortCriterion} criterion
 * @example {label: 'Youtube views ascending', value: '@ytviewcount ascending', criterion: {by: 'field', field: '@ytviewcount', order: 'ascending'}
 */

const SORT_VARIANTS = {
  DEFAULT: 'default',
  WIDE: 'wide',
};
Object.freeze(SORT_VARIANTS);

/**
 * The `CommerceSort` component renders a dropdown that the end user can interact with to select the criterion to use when sorting query results.
 * @category Search
 * @category Insight Panel
 * @example
 * <c-commerce-sort engine-id={engineId}>
 *  <c-commerce-sort-option
      slot="sortOption"
      label={sortOptionLabel}
      value={sortOptionValue}
      criterion={sortOptionCriterion}
    ></c-commerce-sort-option></c-commerce-sort>
 */
export default class CommerceSort extends LightningElement {
  /**
   * The sort variant. Accepted variants include `default` and `wide`.
   * @api
   * @type {'default'|'wide'}
   */
  @api variant = 'default';
  /**
   * The ID of the engine instance the component registers to.
   * @api
   * @type {string}
   */
  @api engineId;

  /** @type {ProductListingState | SearchState}*/
  @track searchOrListingState;
  /** @type {SortState}*/
  @track sortState;

  /** @type {SortOption[]} */
  defaultSortOptions = [];
  /** @type {Sort} */
  sort;
  options;
  /** @type {ProductListing | Search} */
  listingOrSearch = null;
  /** @type {Function} */
  unsubscribe;
  /** @type {CoveoHeadlessCommerce} */
  headless;
  /** @type {Bindings} */
  bindings = {};
  /** @type {boolean} */
  hasInitializationError = false;

  /** @type {string} */
  errorMessage;

  schemas = {};

  labels = {
    relevancy,
    newest,
    oldest,
    invalidCustomSortConfig,
    sortBy,
  };

  connectedCallback() {
    if (!Object.values(SORT_VARIANTS).includes(this.variant)) {
      console.warn(
        `Unsupported variant: ${this.variant} specified in the QuanticSort component, using the default variant.`
      );
    }
    registerComponentForInit(this, this.engineId);
  }

  renderedCallback() {
    initializeWithHeadless(this, this.engineId, this.initialize);
  }

  /**
   * @param {CommerceEngine} engine
   */
  initialize = (engine) => {
    this.headless = getHeadlessBundle(this.engineId);
    this.bindings = getHeadlessBindings(this.engineId);

    this.listingOrSearch = this.controllerBuilder(engine);

    this.sort = this.listingOrSearch.sort();
    this.unsubscribe = this.listingOrSearch.subscribe(() => this.updateState());
    this.unsubscribeSort = this.sort.subscribe(() => this.updateState());
    
    registerSortOptionsToStore(this.engineId, this.sortOptions);
  };

  disconnectedCallback() {
    this.unsubscribe?.();
    this.unsubscribeSort?.();
  }

  updateState() {
    this.sortState = this.sort?.state;
    this.searchOrListingState = this.listingOrSearch?.state;
  }

  get hasResults() {
    return this.searchOrListingState?.products.length > 0 && this.sortState?.availableSorts.length > 1;
  }

  get isProductListing() {
    return this.bindings?.interfaceElement?.type === 'product-listing';
  }

  get controllerBuilder() {
    return this.isProductListing ? this.headless.buildProductListing : this.headless.buildSearch;
  }

  /**
   * @param {CustomEvent<{value: string}>} e
   */
  handleChange(e) {
    this.sort.sortBy(
      this.sortOptions.find((option) => option.value === e.detail.value).criterion
    );
  }

  /**
   * Sets the component in the initialization error state.
   */
  setInitializationError() {
    this.hasInitializationError = true;
  }

  get value() {
    return this.getLabel(this.sortState?.appliedSort);
  }

  get hasError() {
    return this.hasInitializationError || !!this.errorMessage;
  }

  get isVariantWide() {
    return this.variant === SORT_VARIANTS.WIDE;
  }

  /**
   * Returns an array of custom sort options passed via slots.
   * @returns {SortOption[]} The specified custom sort options.
   */
  get sortOptions() {
    return this.sortState?.availableSorts.map((sort, index) => ({
      key: index,
      label: this.getLabel(sort), 
      value: this.getLabel(sort), 
      criterion: sort})
    ) || [];
  }
  /**
  * @param {SortCriterion} sort
  */
  getLabel(sort) {
    if (sort.by === 'relevance') {
      return 'relevance';
    } 
    return sort.fields
      .map((sortByField) => {
        return sortByField.displayName || sortByField.name;
      })
      .join(' ');
    
  }
}
