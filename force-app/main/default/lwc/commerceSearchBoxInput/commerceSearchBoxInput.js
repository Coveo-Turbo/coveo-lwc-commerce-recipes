import clear from '@salesforce/label/c.commerce_Clear';
import search from '@salesforce/label/c.commerce_Search';
import searchFieldWithSuggestions from '@salesforce/label/c.commerce_SearchFieldWithSuggestions';
import {keys} from 'c/commerceUtils';
import {LightningElement, api} from 'lwc';
// @ts-ignore
import defaultSearchBoxInput from './templates/defaultSearchBoxInput.html';
// @ts-ignore
import expandableSearchBoxInput from './templates/expandableSearchBoxInput.html';

/** @typedef {import("c/commerceSearchBoxSuggestionsList").default} commerceSearchBoxSuggestionsList */
/** @typedef {import("coveo").Product} Product */
/** @typedef {import("coveo").InstantProducts} InstantProducts */
/** @typedef {import("coveo").ProductTemplatesManager} ProductTemplatesManager  */


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
*/

/**
 * The `CommerceSearchBoxInput` component renders the searchBox input.
 * @fires CustomEvent#commerce__inputvaluechange
 * @fires CustomEvent#commerce__submitsearch
 * @fires CustomEvent#commerce__showsuggestions
 * @fires CustomEvent#commerce__selectsuggestion
 * @category Internal
 * @example
 * <c-commerce-search-box-input
 *  textarea={textarea}
    without-submit-button
    placeholder="Placeholder"
    suggestions={suggestions}>
 * </c-commerce-search-box-input>
 */
export default class CommerceSearchBoxInput extends LightningElement {
  labels = {
    search,
    clear,
    searchFieldWithSuggestions,
  };
  /**
   * Indicates whether or not to display a submit button.
   * @api
   * @type {boolean}
   * @defaultValue 'false'
   */
  @api withoutSubmitButton = false;
  /**
   * Indicates whether to render the search box using a [textarea](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/textarea) element.
   * The resulting component will expand to support multi-line queries.
   * @api
   * @type {boolean}
   * @defaultValue false
   */
  @api textarea = false;
  /**
   * The placeholder text to display in the search box input area.
   * @api
   * @type {string}
   * @defaultValue 'Search...'
   */
  @api placeholder = this.labels.search;
  /**
   * The query suggestions to display.
   * @api
   * @type {Suggestion[]}
   */
  @api suggestions = [];
  /**
   * The value of the input.
   * @api
   * @type {String}
   */
  @api inputValue;
  /**
   * The list containing the recent query suggestions.
   * @api
   * @type {String[]}
   */
  @api recentQueries;
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
   * The maximum number of suggestions to display.
   * @api
   * @type {number}
   * @defaultValue 7
   */
  @api maxNumberOfSuggestions = 7;

  /** @type {boolean} */
  ignoreNextEnterKeyPress = false;
  /** @type {string} */
  ariaActiveDescendant;
  /** @type {boolean} */
  inputIsFocused = false;
  /** @type {string} */
  _inputValue = '';

  connectedCallback() {
    this.addEventListener(
      'commerce__suggestionlistrender',
      this.handleSuggestionListEvent
    );
  }

  disconnectedCallback() {
    this.removeEventListener(
      'commerce__suggestionlistrender',
      this.handleSuggestionListEvent
    );
  }

  renderedCallback() {
    if (this._inputValue !== this.inputValue) {
      this._inputValue = this.inputValue;
      this.setDisplayedInputValue(this.inputValue);
    }
  }

  setDisplayedInputValue(value) {
    this.input.value = value;
  }

  /**
   * @returns {commerceSearchBoxSuggestionsList}
   */
  get suggestionListElement() {
    // @ts-ignore
    return this.template.querySelector('c-commerce-search-box-suggestions-list');
  }

  /**
   * @returns {HTMLInputElement|HTMLTextAreaElement}
   */
  get input() {
    return this.textarea
      ? this.template.querySelector('textarea')
      : this.template.querySelector('input');
  }

  /**
   * Sends the "commerce__inputValueChange" event.
   * @param {string} value
   */
  sendInputValueChangeEvent(value) {
    const inputValueChangeEvent = new CustomEvent('commerce__inputvaluechange', {
      detail: {
        value,
      },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(inputValueChangeEvent);
  }

  /**
   * Sends the "commerce__submitSearch" event.
   */
  sendSubmitSearchEvent() {
    if (this._inputValue !== this.input.value) {
      this.sendInputValueChangeEvent(this.input.value);
    }

    this.dispatchEvent(
      new CustomEvent('commerce__submitsearch', {
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Sends the "commerce__showSuggestions" event.
   */
  sendShowSuggestionsEvent() {
    this.dispatchEvent(
      new CustomEvent('commerce__showsuggestions', {
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Sends the "commerce__selectSuggestion" event.
   * @param {{value: string, isRecentQuery: boolean, isClearRecentQueryButton: boolean}} selectedSuggestion
   */
  sendSelectSuggestionEvent(selectedSuggestion) {
    const selectSuggestionEvent = new CustomEvent('commerce__selectsuggestion', {
      detail: {
        selectedSuggestion,
      },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(selectSuggestionEvent);
  }

  handleEnter(event) {
    const isLineBreak = this.textarea && event.shiftKey;
    if (!(this.ignoreNextEnterKeyPress || isLineBreak)) {
      const selectedSuggestion = this.suggestionListElement?.getCurrentSelectedValue();
      if (selectedSuggestion) {
        const {isProductSuggestion = false, isSeeAllProductsButton, productSelectionIndex = -1} = selectedSuggestion;
        
        if (!isSeeAllProductsButton && isProductSuggestion && productSelectionIndex >= 0) {
          this.suggestionListElement?.selectProduct(productSelectionIndex);
        } else {
          this.sendSelectSuggestionEvent(selectedSuggestion);
        }
      } else {
        this.sendSubmitSearchEvent();
      }
      this.input.blur();
    }
  }

  handleValueChange() {
    this.sendInputValueChangeEvent(this.input.value);
  }

  onSubmit(event) {
    event.stopPropagation();
    this.sendSubmitSearchEvent();
    this.input.blur();
  }

  /**
   * @param {KeyboardEvent} event
   */
  onKeyDown(event) {
    // eslint-disable-next-line default-case
    switch (event.key) {
      case keys.ESC:
        event.preventDefault();
        this.input.removeAttribute('aria-activedescendant');
        this.input.blur();
        break;

      case keys.ENTER:
        this.handleEnter(event);
        break;

      case keys.ARROWUP: {
        event.preventDefault();
        const {id, value} = this.suggestionListElement.selectionUp();
        if (value) {
          this.setDisplayedInputValue(value);
        }
        this.ariaActiveDescendant = id;
        this.input.setAttribute(
          'aria-activedescendant',
          this.ariaActiveDescendant
        );
        break;
      }

      case keys.ARROWDOWN: {
        event.preventDefault();
        const {id, value} = this.suggestionListElement.selectionDown();
        if (value) {
          this.setDisplayedInputValue(value);
        }
        this.ariaActiveDescendant = id;
        this.input.setAttribute(
          'aria-activedescendant',
          this.ariaActiveDescendant
        );
        break;
      }

      case keys.ARROWRIGHT: {
        this.handleArrowKey(event, 'Right');
        break;
      }

      case keys.ARROWLEFT: {
        this.handleArrowKey(event, 'Left');
        break;
      }
    }
    this.ignoreNextEnterKeyPress = false;
  }

  onFocus() {
    this.inputIsFocused = true;
    this.sendShowSuggestionsEvent();
    this.adjustTextAreaHeight();
  }

  onBlur() {
    this.inputIsFocused = false;
    this.input.removeAttribute('aria-activedescendant');
    this.collapseTextArea();
  }

  onTextAreaInput() {
    this.sendInputValueChangeEvent(this.input.value);
    this.adjustTextAreaHeight();
  }

  handleArrowKey(event, direction) {
    event.preventDefault();
    const {id, value} = direction === 'Right' ? this.suggestionListElement.selectionRight(): this.suggestionListElement.selectionLeft();
    if (value) {
      this.setDisplayedInputValue(value);
    }
    this.ariaActiveDescendant = id;
    this.input.setAttribute(
      'aria-activedescendant',
      this.ariaActiveDescendant
    );
  }

  
  handleSelection(event) {
    this.sendSelectSuggestionEvent(event.detail.selection);
    this.inputIsFocused = false;
    this.input.blur();
  }

  adjustTextAreaHeight() {
    if (!this.textarea) {
      return;
    }
    this.input.style.height = '';
    this.input.style.whiteSpace = 'pre-wrap';
    this.input.style.height = this.input.scrollHeight + 'px';
    this.input.style.overflow = 'auto';
  }

  collapseTextArea() {
    if (!this.textarea) {
      return;
    }
    this.input.style.height = '';
    this.input.scrollTop = 0;
    this.input.style.whiteSpace = 'nowrap';
    this.input.style.overflow = 'hidden';
  }

  clearInput() {
    this.sendInputValueChangeEvent('');
    this.setDisplayedInputValue('');
    this.input.removeAttribute('aria-activedescendant');
    this.collapseTextArea();
    this.input.focus();
  }

  /**
   * Prevents the blur event from being triggered when clearing the input.
   * This allows us to clear the input value before collapsing the input.
   * @param {event} event
   * @returns {void}
   */
  preventBlur(event) {
    event.preventDefault();
  }

  handleSuggestionListEvent = (event) => {
    event.stopPropagation();
    const id = event.detail;
    this.input.setAttribute('aria-controls', id);
  };

  get searchBoxContainerClass() {
    return `slds-combobox__form-element slds-input-has-icon slds-grid ${
      this.withoutSubmitButton
        ? 'slds-input-has-icon_left-right'
        : 'slds-input-has-icon_right slds-input-has-fixed-addon'
    }`;
  }

  get searchBoxInputClass() {
    return `slds-input searchbox__input ${
      this.withoutSubmitButton ? '' : 'searchbox__input-with-button'
    }`;
  }

  get isQueryEmpty() {
    return !this.input?.value && !this.inputValue;
  }

  /**
   * @returns {HTMLElement}
   */
  get combobox() {
    return this.template.querySelector('.slds-combobox');
  }

  get shouldDisplaySuggestions() {
    return (
      this.inputIsFocused &&
      (this.suggestions?.length || this.recentQueries?.length)
    );
  }

  render() {
    return this?.textarea ? expandableSearchBoxInput : defaultSearchBoxInput;
  }
}
