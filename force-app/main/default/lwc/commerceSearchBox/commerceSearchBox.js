import {
  registerComponentForInit,
  initializeWithHeadless,
  getHeadlessBundle,
} from 'c/commerceHeadlessLoader';
import {getItemFromLocalStorage, setItemInLocalStorage} from 'c/commerceUtils';
import {LightningElement, api, track} from 'lwc';
// @ts-ignore
import errorTemplate from './templates/errorTemplate.html';
// @ts-ignore
import searchBox from './templates/searchBox.html';
// @ts-ignore
import productSuggestionTemplate from './templates/productSuggestionTemplate.html';

/** @typedef {import("coveo").CommerceEngine} CommerceEngine */
/** @typedef {import("coveo").SearchBoxState} SearchBoxState */
/** @typedef {import("coveo").SearchBox} SearchBox */
/** @typedef {import("coveo").SearchBoxOptions} SearchBoxOptions */
/** @typedef {import("coveo").RecentQueriesList} RecentQueriesList */
/** @typedef {import("coveo").Product} Product */
/** @typedef {import("coveo").InstantProducts} InstantProducts */
/** @typedef {import("coveo").ProductTemplatesManager} ProductTemplatesManager  */
/** @typedef {import('c/commerceSearchBoxSuggestionsList').default} commerceSearchBoxSuggestionsList */
/** @typedef {import("c/commerceSearchBoxInput").default} commerceSearchBoxInput */
/**
* @typedef ProductBindings
* @property {InstantProducts} instantProductsController
* @property {ProductTemplatesManager} productTemplatesManager
* @property {string} engineId
*/

/**
 * The `CommerceSearchBox` component creates a search box with built-in support for query suggestions.
 * @category Commerce
 * @example
 * <c-commerce-search-box engine-id={engineId} placeholder="Enter a query..." without-submit-button number-of-suggestions="8"></c-commerce-search-box>
 */
export default class CommerceSearchBox extends LightningElement {
  /**
   * The ID of the engine instance the component registers to.
   * @api
   * @type {string}
   */
  @api engineId;
  /**
   * The placeholder text to display in the search box input area.
   * @api
   * @type {string}
   */
  @api placeholder = null;
  /**
   * Whether not to render a submit button.
   * @api
   * @type {boolean}
   * @defaultValue 'false'
   */
  @api withoutSubmitButton = false;
  /**
   * The maximum number of suggestions and recent search queries to display.
   * @api
   * @type {number}
   * @defaultValue 7
   */
  @api numberOfSuggestions = 7;
  /**
   * Whether to render the search box using a [textarea](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/textarea) element.
   * The resulting component will expand to support multi-line queries.
   * @api
   * @type {boolean}
   * @defaultValue false
   */
  @api textarea = false;
  /**
   * Whether to disable rendering the recent queries as suggestions.
   * @api
   * @type {boolean}
   * @defaultValue false
   */
  @api disableRecentQueries = false;
  /**
   * Whether to disable rendering the product suggestions as suggestions.
   * @api
   * @type {boolean}
   * @defaultValue false
   */
  @api disableProductSuggestions = false;
  /**
   * Whether to keep all active query filters when the end user submits a new query from the search box.
   * @api
   * @type {boolean}
   * @defaultValue false
   */
  @api keepFiltersOnSearch = false;

  /** @type {SearchBoxState} */
  @track state;

  /** @type {SearchBox} */
  searchBox;
  /** @type {InstantProducts} */
  instantProducts;
  /** @type {Function} */
  unsubscribe;
  /** @type {Function} */
  unsubscribeInstantProducts;
  /** @type {CoveoHeadlessCommerce} */
  headless;
  /** @type {Array} */
  suggestions = [];
  /** @type {boolean} */
  hasInitializationError = false;
  /** @type {RecentQueriesList} */
  recentQueriesList;
  /** @type {String[]} */
  recentQueries;
  /** @type {Product[]} */
  productSuggestions = [];
  /** @type {ProductBindings} */
  productBindings;


  /**
   * @param {CommerceEngine} engine
   */
  initialize = (engine) => {
    this.engine = engine;
    this.headless = getHeadlessBundle(this.engineId);
    this.searchBox = this.headless.buildSearchBox(engine, {
      options: {
        //numberOfSuggestions: Number(this.numberOfSuggestions),
        highlightOptions: {
          notMatchDelimiters: {
            open: '<b>',
            close: '</b>',
          },
        },
        clearFilters: !this.keepFiltersOnSearch
      }
    });

    this.actions = {
      ...this.headless.loadQuerySuggestActions(engine),
    };

    if (!this.disableRecentQueries && this.headless.buildRecentQueriesList) {
      this.localStorageKey = `${this.engineId}_commerce-recent-queries`;
      this.recentQueriesList = this.headless.buildRecentQueriesList(engine, {
        initialState: {
          queries: getItemFromLocalStorage(this.localStorageKey) ?? [],
        },
        options: {
          maxLength: 100,
        },
      });
      this.unsubscribeRecentQueriesList = this.recentQueriesList.subscribe(() =>
        this.updateRecentQueriesListState()
      );
    }

    if (!this.disableProductSuggestions && this.headless.buildInstantProducts) {

      this.instantProducts = this.headless.buildInstantProducts(engine, {
        options: {},
      });

      this.productTemplatesManager = this.headless.buildProductTemplatesManager();
      this.registerTemplates();

      this.productBindings = {
        instantProductsController: this.instantProducts,
        productTemplatesManager: this.productTemplatesManager,
        engineId: this.engineId
      };

      this.unsubscribeInstantProducts = this.instantProducts.subscribe(() =>
        this.updateInstantProductsState()
      );
    }

    this.unsubscribe = this.searchBox.subscribe(() => this.updateState());
    
  };

  registerTemplates() {
    this.productTemplatesManager.registerTemplates({
      content: productSuggestionTemplate,
      conditions: [],
    });
    this.dispatchEvent(
      new CustomEvent('commerce__registerproductsuggestiontemplates', {
        bubbles: true,
        detail: this.productTemplatesManager,
      })
    );
  }

  connectedCallback() {
    registerComponentForInit(this, this.engineId);
    this.addEventListener(
      'commerce__inputvaluechange',
      this.handleInputValueChange
    );
    this.addEventListener('commerce__submitsearch', this.handleSubmit);
    this.addEventListener('commerce__showsuggestions', this.showSuggestion);
    this.addEventListener('commerce__selectsuggestion', this.selectSuggestion);
    this.addEventListener('commerce__suggestedquerychange', this.suggestedQueryChange);
  }

  renderedCallback() {
    initializeWithHeadless(this, this.engineId, this.initialize);
  }

  disconnectedCallback() {
    this.unsubscribe?.();
    this.unsubscribeInstantProducts?.();
    this.unsubscribeRecentQueriesList?.();
    this.removeEventListener(
      'commerce__inputvaluechange',
      this.handleInputValueChange
    );
    this.removeEventListener('commerce__submitsearch', this.handleSubmit);
    this.removeEventListener('commerce__showsuggestions', this.showSuggestion);
    this.removeEventListener('commerce__selectsuggestion',this.selectSuggestion);
    this.removeEventListener('commerce__suggestedquerychange', this.suggestedQueryChange);
  }

  get searchBoxValue() {
    return this.searchBox?.state.value || '';
  }

  updateState() {
    this.state = this.searchBox?.state;
    this.suggestions =
      this.state?.suggestions?.map((suggestion, index) => ({
        key: index,
        rawValue: suggestion.rawValue,
        value: suggestion.highlightedValue,
      })) ?? [];
  }

  updateInstantProductsState() {
    const state = this.instantProducts.state;
    if (!state.isLoading) {
      if (state.products.length) {
        this.productSuggestions = state.products;
      }
    }
  }

  updateRecentQueriesListState() {
    if (this.recentQueriesList.state?.queries) {
      this.recentQueries = this.recentQueriesList.state.queries;
      setItemInLocalStorage(
        this.localStorageKey,
        this.recentQueriesList.state.queries
      );
    }
  }

  /**
   * Updates the input value.
   */
  handleInputValueChange = (event) => {
    event.stopPropagation();
    const newValue = event.detail.value;
    if (this.searchBox?.state?.value !== newValue) {
      this.searchBox.updateText(newValue);
    }
  };

  /**
   * Submits a search.
   * @returns {void}
   */
  handleSubmit = (event) => {
    event.stopPropagation();
    this.searchBox?.submit();
  };

  /**
   * Shows the suggestions.
   * @returns {void}
   */
  showSuggestion = (event) => {
    event.stopPropagation();
    this.searchBox?.showSuggestions();
  };

  suggestedQueryChange = (event) => {
    event.stopPropagation();
    const {rawValue} = event.detail;
    this.instantProducts.updateQuery(rawValue);
  }

  /**
   * Handles the selection of a suggestion or a recent query.
   */
  selectSuggestion = (event) => {
    event.stopPropagation();
    const {value, isRecentQuery, isClearRecentQueryButton, isSeeAllProductsButton} = event.detail.selectedSuggestion;
    
    if (isSeeAllProductsButton) {
      this.searchBox?.selectSuggestion(this.instantProducts.state.query);
    } else if (isClearRecentQueryButton) {
      this.recentQueriesList.clear();
    } else if (isRecentQuery) {
      this.recentQueriesList.executeRecentQuery(
        this.recentQueries.indexOf(value)
      );
      this.engine.dispatch(
        this.actions.clearQuerySuggest({
          id: this.state.searchBoxId,
        })
      );
    } else {
      this.searchBox?.selectSuggestion(value);
    }
  };

  /**
   * @return {commerceSearchBoxInput}
   */
  get commerceSearchBoxInput() {
    // @ts-ignore
    return this.template.querySelector('c-commerce-search-box-input');
  }

  /**
   * Sets the component in the initialization error state.
   */
  setInitializationError() {
    this.hasInitializationError = true;
  }

  render() {
    return this.hasInitializationError ? errorTemplate : searchBox;
  }
}
