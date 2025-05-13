import clear from '@salesforce/label/c.commerce_Clear';
import querySuggestionAriaLabel from '@salesforce/label/c.commerce_QuerySuggestionAriaLabel';
import recentQueries from '@salesforce/label/c.commerce_RecentQueries';
import recentQueryAriaLabel from '@salesforce/label/c.commerce_RecentQueryAriaLabel';
import suggestionFound from '@salesforce/label/c.commerce_SuggestionFound';
import suggestionFound_plural from '@salesforce/label/c.commerce_SuggestionFound_Plural';
import suggestionsNotFound from '@salesforce/label/c.commerce_SuggestionNotFound';
import {AriaLiveRegion, I18nUtils, keys, RecentQueryUtils} from 'c/commerceUtils';
import {LightningElement, api} from 'lwc';

const optionCSSClass =
  'slds-media slds-listbox__option slds-listbox__option_plain slds-media_small slds-grid option';

/** @typedef {import("coveo").Product} Product */
/** @typedef {import("coveo").InstantProducts} InstantProducts */
/** @typedef {import("coveo").ProductTemplatesManager} ProductTemplatesManager  */
/** @typedef {import("c/commerceProduct").default} commerceProduct */
/**
 * @typedef Suggestion
 * @property {number} key
 * @property {string} value
 * @property {string} rawValue
 */

/**
* @typedef ProductBindings
* @property {InstantProducts} instantProductsController
* @property {ProductTemplatesManager} productTemplatesManager
* @property {string} engineId
* @property {Product[]} products
*/

/**
 * The `CommerceSearchBoxSuggestionsList` is used internally by search box components to display the query suggestions in an omnibox.
 * @fires CustomEvent#commerce__selection
 * @fires CustomEvent#commerce__clearrecentqueries
 * @fires CustomEvent#commerce__suggestedquerychange
 * @category Commerce
 * @example
 * <c-commerce-search-box-suggestions-list suggestions={suggestions} oncommerce__selection={handleSuggestionSelection}></c-commmerce-search-box-suggestions-list>
 */
export default class CommerceSearchBoxSuggestionsList extends LightningElement {
  /**
   * The query suggestions to display.
   * @api
   * @type {Suggestion[]}
   */
  @api suggestions = [];
  /**
   * The list containing the recent query suggestions.
   * @api
   * @type {String[]}
   */
  @api recentQueries = [];
  /**
   * The list containing the product suggestions.
   * @api
   * @type {Product[]}
   */
  @api productSuggestions = [];
  /**
   * The list containing the product suggestions.
   * @api
   * @type {ProductBindings}
   */
  @api productBindings;
  /**
   * The current search query value.
   * @api
   * @type {string}
   */
  @api query;
  /**
   * The maximum number of suggestions to display.
   * @api
   * @type {number}
   * @defaultValue 7
   */
  @api maxNumberOfSuggestions = 7;
  /**
   * The maximum number of product suggestions to display.
   * @api
   * @type {number}
   * @defaultValue 5
   */
  @api maxNumberOfProductSuggestions = 5;

  labels = {
    clear,
    recentQueries,
    suggestionFound,
    suggestionFound_plural,
    suggestionsNotFound,
    recentQueryAriaLabel,
    querySuggestionAriaLabel,
    seeAllProducts: 'See all products',
  };

  /** @type {import('c/commerceUtils').AriaLiveUtils} */
  suggestionsAriaLiveMessage;

  /**
   * Move highlighted selection up.
   */
  @api
  selectionUp() {
    if (this.rightSideSelectionActivated) {
      this.productSelectionIndex--;
      if (this.productSelectionIndex < 0) {
        this.productSelectionIndex = this.productOptions.length - 1;
      }
    } else {
      this.productSelectionIndex = -1;
      this.selectionIndex--;
      if (this.selectionIndex < 0) {
        this.selectionIndex = this.allOptions.length - 1;
      }
    }
    
    return {
      id: this.allOptionsHTMLElements[this.selectionIndex].getAttribute('id'),
      value: this.allOptions[this.selectionIndex].rawValue,
    };
  }

  /**
   * Move highlighted selection down.
   */
  @api
  selectionDown() {

    if (this.rightSideSelectionActivated) {
      this.productSelectionIndex++;
      if (this.productSelectionIndex >= this.productOptions.length) {
        this.productSelectionIndex = 0;
      }
    } else {
      this.productSelectionIndex = -1;
      this.selectionIndex++;
      if (this.selectionIndex >= this.allOptions.length) {
        this.selectionIndex = 0;
      }
    }
    
    return {
      id: this.allOptionsHTMLElements[this.selectionIndex].getAttribute('id'),
      value: this.allOptions[this.selectionIndex].rawValue,
    };
  }

  @api
  selectionRight() {
    if(this.selectionIndex === -1)  {
      return {};
    }

    this.rightSideSelectionActivated = true;
    if (this.productSelectionIndex < 0) {
      this.productSelectionIndex = 0;
    }
    return {
      id: this.allOptionsHTMLElements[this.selectionIndex].getAttribute('id'),
      value: this.allOptions[this.selectionIndex].rawValue,
    };
  }

  @api
  selectionLeft() {
    if(this.selectionIndex === -1)  {
      return {};
    }

    this.rightSideSelectionActivated = false;
    
    return {
      id: this.allOptionsHTMLElements[this.selectionIndex].getAttribute('id'),
      value: this.allOptions[this.selectionIndex].rawValue,
    };
  }

  /**
   * Select and trigger the click on the given index product. 
   * @returns {Object}
   */
  @api
  selectProduct(index) {
    this.getProductElement(index)?.click();
  }

  /**
   * Return the currently selected suggestion.
   * @returns {Object}
   */
  @api
  getCurrentSelectedValue() {
    if (this.rightSideSelectionActivated && this.productOptions?.[this.productSelectionIndex]) {
      const {isSeeAllProductsButton} = this.productOptions[this.productSelectionIndex];
      return {
        productSelectionIndex: this.productSelectionIndex,
        isProductSuggestion: true,
        isSeeAllProductsButton
      };
    } else if (this.allOptions?.[this.selectionIndex]) {
      const {rawValue, isClearRecentQueryButton, isRecentQuery} =
        this.allOptions[this.selectionIndex];
      return {
        value: rawValue,
        isClearRecentQueryButton,
        isRecentQuery,
      };
    }
    return null; 
  }
  
  /** @type {number} */
  selectionIndex = -1;
  /** @type {number} */
  productSelectionIndex = -1;
  /** @type {boolean} */
  initialRender = true;
  /** @type {string} */
  previousQuery = '';
  /** @type {string} */
  previousSuggestedQuery = '';
  /** @type {boolean} */
  rightSideSelectionActivated = false;

  connectedCallback() {
  }

  disconnectedCallback() {
  }

  renderedCallback() {

    if (this.allOptions?.length) {
      const suggestedQuery = this.allOptions?.[this.selectionIndex] || this.allOptions?.[this.shouldDisplayRecentQueries ? 1 : 0]
      if (suggestedQuery?.rawValue && this.previousSuggestedQuery !== suggestedQuery?.rawValue) {
        this.previousSuggestedQuery = suggestedQuery.rawValue;
        this.sendSuggestedQueryChange(suggestedQuery);
      }
    }

    if (this.initialRender) {
      this.suggestionsAriaLiveMessage = AriaLiveRegion(
        'suggestions',
        this,
        true
      );
      this.sendSuggestionListIdToInput();
      this.initialRender = false;
    }
    this.announceNewSuggestionsWithAriaLive();
    if (this.previousQuery !== this.query) {
      this.previousQuery = this.query;
      this.selectionIndex = -1;
    }
  }

  announceNewSuggestionsWithAriaLive() {
    if (this.allOptions?.length) {
      const suggestionsCount = this.shouldDisplayRecentQueries
        ? this.allOptions.length - 1
        : this.allOptions.length;

      const labelName = I18nUtils.getLabelNameWithCount(
        'suggestionFound',
        suggestionsCount
      );

      this.suggestionsAriaLiveMessage.dispatchMessage(
        I18nUtils.format(this.labels[labelName], suggestionsCount)
      );
    } else {
      this.suggestionsAriaLiveMessage.dispatchMessage(
        this.labels.suggestionsNotFound
      );
    }
  }

  sendSuggestionListIdToInput() {
    const listboxId = this.template.querySelector('ul').getAttribute('id');
    const suggestionListEvent = new CustomEvent(
      'commerce__suggestionlistrender',
      {
        detail: listboxId,
        bubbles: true,
        composed: true,
      }
    );
    this.dispatchEvent(suggestionListEvent);
  }

  sendSuggestedQueryChange(suggestedQuery) {
    const suggestedQueryChangeEvent = new CustomEvent('commerce__suggestedquerychange', {
      detail: suggestedQuery,
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(suggestedQueryChangeEvent);
  }

  /**
   * Returns all the options to be displayed inside the suggestion list, recent queries and query suggestions.
   * @returns {Array<Object>}
   */
  get allOptions() {
    const options = [
      ...this.getRecentQueriesThatStartWithCurrentQuery(),
      ...this.getQuerySuggestionsNotInRecentQueries(),
    ]
      ?.map(this.buildSuggestionListOption)
      .slice(0, this.maxNumberOfSuggestions);

    if (this.shouldDisplayRecentQueries) {
      const clearRecentQueriesOption = {
        key: 0,
        id: 'selection-0',
        isSelected: this.selectionIndex === 0,
        isClearRecentQueryButton: true,
        onClick: (event) => {
          this.handleSelection(event, 0);
        },
      };
      options.unshift(clearRecentQueriesOption);
    }
    return options;
  }

  get productOptions() {
    const options = this.productSuggestions
      ?.map(this.buildProductSuggestionListOption)
      .slice(0, this.maxNumberOfProductSuggestions);

    if (options.length) {
      const showAllProductsOption = {
        product: {},
        key: `product-selection-${options.length}`,
        id: 'product-selection-show-all',
        isSelected: this.productSelectionIndex === options.length,
        isSeeAllProductsButton: true,
        interactiveProduct: null,
        productTemplatesManager: null,
        engineId: null,
        containerCSSClass: null,
        onClick: (event) => {
          this.handleSelection(event, options.length-1);
        }
      }
      options.push(showAllProductsOption);
    }
    
    return options;
  }

  get allOptionsHTMLElements() {
    return this.template.querySelectorAll('.slds-listbox__item.suggestions-option');
  }

  /**
   * Augments a suggestion with the necessary information needed to display the suggestion as an option in the suggestion list
   */
  buildSuggestionListOption = (suggestion, index) => {
    const optionIndex = this.shouldDisplayRecentQueries ? index + 1 : index;
    const optionIsSelected = this.selectionIndex === optionIndex;

    return {
      ...suggestion,
      id: `selection-${optionIndex}`,
      key: `selection-${optionIndex}`,
      isSelected: optionIsSelected,
      containerCSSClass: `${optionCSSClass} ${
        optionIsSelected ? 'slds-has-focus' : ''
      }`,
      icon: suggestion.isRecentQuery ? 'utility:clock' : 'utility:search',
      iconTitle: suggestion.isRecentQuery
        ? this.labels.recentQueryAriaLabel
        : this.labels.querySuggestionAriaLabel,
      onClick: (event) => {
        this.handleSelection(event, optionIndex);
      }
    };
  };

  /**
  * Augments a product suggestion with the necessary information needed to display the product as an option in the product suggestion list
  */
  buildProductSuggestionListOption = (product, index) => {

    const optionIsSelected = this.productSelectionIndex === index;
    const {engineId, productTemplatesManager} = this.productBindings;
    const interactiveProduct = this.productBindings?.instantProductsController?.interactiveProduct;
    
    return {
      product,
      id: `product-selection-${index}`,
      key: `product-selection-${index}`,
      isSelected: optionIsSelected,
      isSeeAllProductsButton: false,
      interactiveProduct,
      productTemplatesManager,
      engineId,
      containerCSSClass: `${optionCSSClass} ${
        optionIsSelected && this.rightSideSelectionActivated ? 'slds-has-focus' : ''
      }`,
      onClick: (event) => {
        this.handleProductSelection(event, index);
      }
    }
  }

  /**
   * Returns the query suggestions that are not already in the recent queries list.
   */
  getQuerySuggestionsNotInRecentQueries() {
    return (
      this.suggestions?.filter(
        (suggestion) =>
          !this.getRecentQueriesThatStartWithCurrentQuery().some(
            (recentQuery) => recentQuery.rawValue === suggestion.rawValue
          )
      ) || []
    );
  }

  /**
   * @returns {commerceProduct}
   */
  getProductElement(index) {
    // @ts-ignore
    return this.template.querySelector(`[id^='product-selection-${index}'] c-commerce-product`);
  }

  handleProductSelection = (event, index) => {
    event.preventDefault();
    const productElement = this.getProductElement(index);
    productElement?.click();
  }

  handleSelection = (event, index) => {
    event.preventDefault();

    const {rawValue, isClearRecentQueryButton, isRecentQuery} = this.allOptions[index];
    const {isSeeAllProductsButton} = this.productOptions?.[index] || {};
    const selection = {
      value: rawValue,
      isClearRecentQueryButton: isClearRecentQueryButton,
      isSeeAllProductsButton: isSeeAllProductsButton,
      isRecentQuery: isRecentQuery
    };
    const suggestionSelectedEvent = new CustomEvent('commerce__selection', {
      detail: {selection},
    });
    this.dispatchEvent(suggestionSelectedEvent);
  };

  /**
   * Returns the recent queries that start with the query currently typed by the end user.
   */
  getRecentQueriesThatStartWithCurrentQuery() {
    return (
      this.recentQueries
        ?.filter(
          (recentQuery) =>
            recentQuery !== this.query &&
            recentQuery.toLowerCase().startsWith(this.query?.toLowerCase())
        )
        .map((recentQuery) => ({
          value: RecentQueryUtils.formatRecentQuery(recentQuery, this.query),
          rawValue: recentQuery,
          isRecentQuery: true,
        })) || []
    );
  }

  get shouldDisplayRecentQueries() {
    return !!this.getRecentQueriesThatStartWithCurrentQuery?.().length;
  }

  get clearRecentQueriesOptionCSSClass() {
    return `${optionCSSClass} ${
      this.selectionIndex === 0 ? 'slds-has-focus' : ''
    } recent-searches__label`;
  }

  get seeAllProductsOptionCSSClass() {
    return `${optionCSSClass} ${
      this.productSelectionIndex === this.productOptions.length - 1 ? 'slds-has-focus' : ''
    } see-all-products__label`;
  }

  get listboxCssClass() {
    // return `slds-dropdown slds-dropdown_length-10 slds-dropdown_fluid commerce-suggestions-list ${
    //   this.allOptions?.length ? '' : 'slds-hidden'
    // }`;
    return `slds-dropdown slds-dropdown_fluid commerce-suggestions-list ${
      this.allOptions?.length ? '' : 'slds-hidden'
    }`;
  }

  get querySuggestionsCssClass() {
    return `slds-col slds-size_1-of-1`;
  }
}
