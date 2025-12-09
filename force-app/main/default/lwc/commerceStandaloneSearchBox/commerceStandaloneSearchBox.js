import {
  registerComponentForInit,
  initializeWithHeadless,
  getHeadlessBindings,
  getHeadlessBundle,
} from 'c/commerceHeadlessLoader';
import {STANDALONE_SEARCH_BOX_STORAGE_KEY, getItemFromLocalStorage, setItemInLocalStorage} from 'c/commerceUtils';
import {CurrentPageReference, NavigationMixin} from 'lightning/navigation';
import {LightningElement, api, track, wire} from 'lwc';
// @ts-ignore
import errorTemplate from './templates/errorTemplate.html';
// @ts-ignore
import standaloneSearchBox from './templates/standaloneSearchBox.html';
// @ts-ignore
import productSuggestionTemplate from './templates/productSuggestionTemplate.html';

/** @typedef {import("coveo").CommerceEngine} CommerceEngine */
/** @typedef {import("coveo").StandaloneSearchBoxState} StandaloneSearchBoxState */
/** @typedef {import("coveo").StandaloneSearchBox} StandaloneSearchBox */
/** @typedef {import("coveo").RecentQueriesList} RecentQueriesList */
/** @typedef {import("coveo").Product} Product */
/** @typedef {import("coveo").InstantProducts} InstantProducts */
/** @typedef {import("coveo").ProductTemplatesManager} ProductTemplatesManager  */
/** @typedef {import("c/commerceSearchBoxSuggestionsList").default} commerceSearchBoxSuggestionsList */
/** @typedef {import("c/commerceSearchBoxInput").default} commerceSearchBoxInput */
/** @typedef {{key: number, value: string}} Suggestion */
/**
* @typedef ProductBindings
* @property {InstantProducts} instantProductsController
* @property {ProductTemplatesManager} productTemplatesManager
* @property {string} engineId
*/

/**
 * The `CommerceStandaloneSearchBox` component creates a search box with built-in support for query suggestions.
 * See [Use a Standalone Search Box](https://docs.coveo.com/en/quantic/latest/usage/ssb-usage/).
 * @category Commerce
 * @example
 * <c-commerce-standalone-search-box engine-id={engineId} placeholder="Enter a query..." without-submit-button number-of-suggestions="8" redirect-url="/my-search-page/%40uri" search-hub="myhub" pipeline="mypipeline"></c-commerce-standalone-search-box>
 */
export default class CommerceStandaloneSearchBox extends NavigationMixin(
  LightningElement
) {
  /**
   * The ID of the engine instance the component registers to.
   * @api
   * @type {string}
   */
  @api engineId;
  /**
  * The ID of your Coveo-powered ecommerce site or application.
  * @api
  * @type {string}
  */
  @api trackingId;
  /**
  * The commerce url to add in context for your Coveo-powered ecommerce site or application.
  * @api
  * @type {string}
  */
   @api commerceUrl;

   /**
    * The language to add in context for your Coveo-powered ecommerce site or application.
    * @api
    * @type {string}
    */
   @api language = 'en';

   /**
    * The country to add in context for your Coveo-powered ecommerce site or application.
    * @api
    * @type {string}
    */
   @api country = 'US';

   /**
    * The currency to add in context for your Coveo-powered ecommerce site or application.
    * @api
    * @type {string}
    */
   @api currency = 'USD';
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
   * The maximum number of suggestions to display.
   * @api
   * @type {number}
   * @defaultValue 5
   */
  @api numberOfSuggestions = 5;
  /**
   * Whether to keep all active query filters when the end user submits a new query from the standalone search box.
   * @api
   * @type {boolean}
   * @defaultValue false
   */
  @api keepFiltersOnSearch = false;
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
   * The url of the search page to redirect to when a query is made.
   * The target search page should contain a `QuanticSearchInterface` with the same engine ID as the one specified for this component.
   * @api
   * @type {string}
   * @defaultValue '/global-search/%40uri'
   */
  @api redirectUrl = '/global-search/%40uri';
  /**
   * Whether to render the search box using a [textarea](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/textarea) element.
   * The resulting component will expand to support multi-line queries.
   * @api
   * @type {boolean}
   * @defaultValue false
   */
  @api textarea = false;

  /** @type {boolean} */
  @track isStandalone = true;
  /** @type {StandaloneSearchBoxState} */
  @track state = {
    searchBoxId: '',
    redirectTo: null,
    suggestions: [],
    value: '',
    isLoading: false,
    isLoadingSuggestions: false,
  };

  /** @type {CoveoHeadlessCommerce} */
  headless;
  /** @type {StandaloneSearchBox} */
  standaloneSearchBox;
  /** @type {InstantProducts} */
  instantProducts;
  /** @type {Function} */
  unsubscribe;
  /** @type {Function} */
  unsubscribeInstantProducts;
  /** @type {boolean} */
  isInitialized = false;
  /** @type {Suggestion[]} */
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

  /** @type {string} */
  get standaloneEngineId() {
    return `${this.engineId}_standalone`;
  }

  connectedCallback() {
    registerComponentForInit(this, this.standaloneEngineId);

    this.addEventListener(
      'commerce__inputvaluechange',
      this.handleInputValueChange
    );
    this.addEventListener('commerce__submitsearch', this.handleSubmit);
    this.addEventListener('commerce__showsuggestions', this.showSuggestions);
    this.addEventListener('commerce__selectsuggestion', this.selectSuggestion);
    this.addEventListener('commerce__suggestedquerychange', this.suggestedQueryChange);
  }

  renderedCallback() {
    initializeWithHeadless(this, this.standaloneEngineId, this.initialize);
    if (
      !this.isInitialized &&
      !!this.standaloneSearchBox &&
      !!this.commerceSearchBoxInput
    ) {
      // The is-initialized attribute is set to true for E2E tests
      this.commerceSearchBoxInput.setAttribute('is-initialized', 'true');
      this.isInitialized = true;
    }
  }

  @wire(CurrentPageReference)
  handlePageChange() {
    this.isStandalone = !window.location.href.includes(this.redirectUrl);
    if (!this.isStandalone && this.standaloneEngine) {
      this.initialize(this.standaloneEngine);
    }
  }

  /**
   * @param {CommerceEngine} engine
   */
  initialize = (engine) => {
    this.headless = getHeadlessBundle(this.engineId);
    this.standaloneSearchBox = this.headless.buildStandaloneSearchBox(engine, {
      options: {
        numberOfSuggestions: Number(this.numberOfSuggestions),
        highlightOptions: {
          notMatchDelimiters: {
            open: '<b>',
            close: '</b>',
          },
        },
        clearFilters: !this.keepFiltersOnSearch,
        redirectionUrl: 'http://placeholder.com',
        overwrite: true
      },
    });
    this.actions = {
      ...this.headless.loadQuerySuggestActions(engine),
    };
    this.standaloneEngine = engine;

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
        engineId: this.standaloneEngineId
      };

      this.unsubscribeInstantProducts = this.instantProducts.subscribe(() =>
        this.updateInstantProductsState()
      );
    }


    this.unsubscribe = this.standaloneSearchBox.subscribe(() =>
      this.updateStandaloneState()
    );
  };

  disconnectedCallback() {
    this.unsubscribe?.();
    this.unsubscribeInstantProducts?.();
    this.unsubscribeRecentQueriesList?.();
    this.removeEventListener(
      'commerce__inputvaluechange',
      this.handleInputValueChange
    );
    this.removeEventListener('commerce__submitsearch', this.handleSubmit);
    this.removeEventListener('commerce__showsuggestions', this.showSuggestions);
    this.removeEventListener('commerce__selectsuggestion', this.selectSuggestion);
    this.removeEventListener('commerce__suggestedquerychange', this.suggestedQueryChange);
  }

  get searchBoxValue() {
    return this.standaloneSearchBox?.state.value || '';
  }

  updateStandaloneState() {
    this.state = this.standaloneSearchBox?.state;
    this.suggestions =
      this.state?.suggestions?.map((s, index) => ({
        key: index,
        rawValue: s.rawValue,
        value: s.highlightedValue,
      })) ?? [];

    // Check for redirect
    const {redirectTo, value} = this.standaloneSearchBox.state;
    if (!redirectTo) {
      return;
    }

    localStorage.setItem(
      STANDALONE_SEARCH_BOX_STORAGE_KEY,
      JSON.stringify({
        value,
      })
    );
    this.navigateToSearchPage();
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

  resetStandaloneSearchboxState() {
    const engine = getHeadlessBindings(this.standaloneEngineId)?.engine;
    if (!engine) {
      return;
    }
    const {updateQuery} = this.headless.loadQueryActions(engine);

    engine.dispatch(updateQuery({query: ''}));
  }

  navigateToSearchPage() {
    const value = this.standaloneSearchBox.state.value;
    this.resetStandaloneSearchboxState();
    this[NavigationMixin.Navigate](
      {
        type: 'standard__webPage',
        attributes: {
          url: `${this.redirectUrl}${
            value ? `#q=${encodeURIComponent(value)}` : ''
          }`,
        },
      },
      false
    );
  }

  /**
   * Updates the input value.
   */
  handleInputValueChange = (event) => {
    event.stopPropagation();
    const newValue = event.detail.value;
    if (this.standaloneSearchBox?.state?.value !== newValue) {
      this.standaloneSearchBox.updateText(newValue);
    }
  };

  /**
   * Submits a search.
   * @returns {void}
   */
  handleSubmit = (event) => {
    event.stopPropagation();
    this.standaloneSearchBox?.submit();
  };

  /**
   * Shows the suggestions.
   * @returns {void}
   */
  showSuggestions = (event) => {
    event.stopPropagation();
    this.standaloneSearchBox?.showSuggestions();
  };

  suggestedQueryChange = (event) => {
    event.stopPropagation();
    const {rawValue} = event.detail;
    this.instantProducts.updateQuery(rawValue);
  }

  /**
   * Handles the selection of a suggestion.
   */
  selectSuggestion = (event) => {
    event.stopPropagation();
  
    const {value, isClearRecentQueryButton, isSeeAllProductsButton} = event.detail.selectedSuggestion;

    if (isSeeAllProductsButton) {
      this.standaloneSearchBox?.selectSuggestion(this.instantProducts.state.query);
    } else if (isClearRecentQueryButton) {
      this.recentQueriesList.clear();
    } else {
      this.standaloneSearchBox?.selectSuggestion(value);
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
    return this.hasInitializationError ? errorTemplate : standaloneSearchBox;
  }
}
