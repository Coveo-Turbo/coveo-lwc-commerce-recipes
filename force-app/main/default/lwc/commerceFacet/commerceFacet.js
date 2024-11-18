import clearFilter from '@salesforce/label/c.commerce_ClearFilter';
import clearFilterFacet from '@salesforce/label/c.commerce_ClearFilterFacet';
import clearFilter_plural from '@salesforce/label/c.commerce_ClearFilter_plural';
import collapseFacet from '@salesforce/label/c.commerce_CollapseFacet';
import expandFacet from '@salesforce/label/c.commerce_ExpandFacet';
import moreMatchesFor from '@salesforce/label/c.commerce_MoreMatchesFor';
import noMatchesFor from '@salesforce/label/c.commerce_NoMatchesFor';
import search from '@salesforce/label/c.commerce_Search';
import showLess from '@salesforce/label/c.commerce_ShowLess';
import showLessFacetValues from '@salesforce/label/c.commerce_ShowLessFacetValues';
import showMore from '@salesforce/label/c.commerce_ShowMore';
import showMoreFacetValues from '@salesforce/label/c.commerce_ShowMoreFacetValues';
import {
  registerComponentForInit,
  initializeWithHeadless,
  registerToStore,
  getHeadlessBundle,
} from 'c/commerceHeadlessLoader';
import {
  I18nUtils,
  regexEncode,
  Store
} from 'c/commerceUtils';
import {LightningElement, track, api} from 'lwc';

/** @typedef {import("coveo").RegularFacetState} RegularFacetState */
/** @typedef {import("coveo").RegularFacet} RegularFacet */
/** @typedef {import("coveo").RegularFacetValue} RegularFacetValue */
/** @typedef {import("coveo").Summary} Summary */
/** @typedef {import("coveo").CommerceEngine} CommerceEngine */
/** @typedef {import('../commerceUtils/facetDependenciesUtils').DependsOn} DependsOn */
/**
 * @typedef FocusTarget
 * @type {object}
 * @property {'facetValue' | 'facetHeader'} type
 * @property {string} [value]
 * @property {number} [index]
 */
/**
 * @typedef CaptionProvider
 * @type {object}
 * @property {Record<string, string>} captions
 */

/**
 * A facet is a list of values for a certain field occurring in the results, ordered using a configurable criterion (e.g., number of occurrences).
 * A `CommerceFacet` displays a facet of the results for the current query.
 * Custom captions can be provided by adding caption provider components to the `captions` named slot.
 * See [Create a custom caption provider component for Quantic facets](https://docs.coveo.com/en/quantic/latest/usage/create-custom-caption-provider-component/).
 * @category Commerce
 * @example
 * <c-commerce-facet engine-id={engineId} field="filetype" facet={facetController} summary={summaryController} no-search is-collapsed></c-commerce-facet>
 *
 * @example
 * <c-commerce-facet engine-id={engineId} field="filetype">
 *   <c-commerce-facet-caption slot="captions" value="text" caption="Plain text"></c-commerce-facet-caption>
 *   <c-commerce-facet-caption slot="captions" value="html" caption="Web page"></c-commerce-facet-caption>
 * </c-commerce-facet>
 */
export default class QuanticFacet extends LightningElement {
  /**
   * The ID of the engine instance the component registers to.
   * @api
   * @type {string}
   */
  @api engineId;
  /**
   * The facet controller instance.
   * @api
   * @type {RegularFacet}
   */
  @api facet;
  /**
   * The facet controller instance.
   * @api
   * @type {Summary}
   */
  @api summary;
  /**
   * The field whose values you want to display in the facet.
   * @api
   * @type {string}
   */
  @api field;
  /**
   * Specifies whether the facet is collapsed.
   * @api
   * @type {boolean}
   */
  @api isCollapsed = false;
  /**
   * Whether this facet should not contain a search box.
   * @api
   * @type {boolean}
   * @defaultValue `false`
   */
  @api noSearch = false;

  /** @type {RegularFacetState} */
  @track state;

  /** @type {Function} */
  unsubscribe;
  /** @type {Function} */
  unsubscribeSearchStatus;
  /** @type {HTMLInputElement} */
  input;
  /** @type {CoveoHeadlessCommerce} */
  headless;
  /** @type {FocusTarget} */
  focusTarget;
  /** @type {boolean} */
  focusShouldBeInFacet = false;
  /** @type {boolean} */
  hasInitializationError = false;

  labels = {
    showMore,
    showLess,
    showMoreFacetValues,
    showLessFacetValues,
    clearFilter,
    clearFilter_plural,
    clearFilterFacet,
    search,
    moreMatchesFor,
    noMatchesFor,
    collapseFacet,
    expandFacet,
  };

  /** @type {object} */
  customCaptions = {};

  /** @type {Function} */
  remoteGetValueCaption;

  connectedCallback() {
    registerComponentForInit(this, this.engineId);
    this.remoteGetValueCaption = this.getValueCaption.bind(this);
  }

  renderedCallback() {
    initializeWithHeadless(this, this.engineId, this.initialize);
    this.input = this.template.querySelector('.facet__searchbox-input');
    if (this.focusShouldBeInFacet && !this.facet?.state?.isLoading) {
      this.setFocusOnTarget();
      this.focusTarget = null;
    }
  }

  initialize = () => {
    this.headless = getHeadlessBundle(this.engineId);

    this.customCaptions = this.loadCustomCaptions();
    this.unsubscribe = this.facet.subscribe(() => this.updateState());
    registerToStore(this.engineId, Store.facetTypes.FACETS, {
      label: this.displayName,
      facetId: this.facet.state.facetId,
      format: this.remoteGetValueCaption,
      element: this.template.host,
    });
  };

  disconnectedCallback() {
    this.unsubscribe?.();
    this.unsubscribeSearchStatus?.();
  }

  updateState() {
    this.state = this.facet?.state;

    const renderFacetEvent = new CustomEvent('commerce__renderfacet', {
      detail: {
        id: this.facet?.state.facetId ?? this.field,
        shouldRenderFacet: this.hasValues,
      },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(renderFacetEvent);
  }

  get values() {
    return (
      this.state?.values
        .filter((value) => value.numberOfResults || value.state === 'selected')
        .map((v) => ({
          ...v,
          checked: v.state === 'selected',
          highlightedResult: this.getValueCaption(v),
        })) || []
    );
  }

  get query() {
    return this.input?.value;
  }

  get canShowMoreSearchResults() {
    return this.facet?.state.facetSearch.moreValuesAvailable;
  }

  get canShowMore() {
    if (!this.facet) {
      return false;
    }
    return this.state.canShowMoreValues;
  }

  get canShowLess() {
    if (!this.facet) {
      return false;
    }
    return this.state.canShowLessValues;
  }

  get hasValues() {
    return this.values.length !== 0;
  }

  get hasActiveValues() {
    return this.state.hasActiveValues;
  }

  get hasSearchResults() {
    return this.getSearchValues().length > 0;
  }

  get facetSearchResults() {
    return this.getSearchValues().map((result) => ({
      value: result.rawValue,
      state: 'idle',
      numberOfResults: result.count,
      checked: false,
      highlightedResult: this.highlightResult(
        result.displayValue,
        this.input?.value
      ),
    }));
  }

  get isSearchComplete() {
    return !this.facet.state.isLoading;
  }

  get displayName() {
    return this.state?.displayName || 'no-label';
  }

  get showMoreFacetValuesLabel() {
    return I18nUtils.format(this.labels.showMoreFacetValues, this.displayName);
  }

  get showLessFacetValuesLabel() {
    return I18nUtils.format(this.labels.showLessFacetValues, this.displayName);
  }

  get moreMatchesForLabel() {
    return I18nUtils.format(this.labels.moreMatchesFor, this.query);
  }

  get noMatchesForLabel() {
    return I18nUtils.format(this.labels.noMatchesFor, this.query);
  }

  get actionButtonIcon() {
    return this.isCollapsed ? 'utility:add' : 'utility:dash';
  }

  get actionButtonCssClasses() {
    return this.isCollapsed ? 'facet__expand' : 'facet__collapse';
  }

  get actionButtonLabel() {
    const label = this.isCollapsed
      ? this.labels.expandFacet
      : this.labels.collapseFacet;
    return I18nUtils.format(label, this.displayName);
  }

  get isFacetSearchActive() {
    return !this.noSearch && !!this.input?.value?.length;
  }

  get numberOfSelectedValues() {
    return this.state.values.filter(({state}) => state === 'selected').length;
  }

  get clearFilterLabel() {
    if (this.hasActiveValues) {
      const labelName = I18nUtils.getLabelNameWithCount(
        'clearFilter',
        this.numberOfSelectedValues
      );
      return `${I18nUtils.format(
        this.labels[labelName],
        this.numberOfSelectedValues
      )}`;
    }
    return '';
  }

  get clearFilterAriaLabelValue() {
    if (this.hasActiveValues) {
      return `${I18nUtils.format(this.labels.clearFilterFacet, this.field)}`;
    }
    return '';
  }

  get displaySearch() {
    return !this.noSearch && this.state?.canShowMoreValues;
  }

  /**
   * @returns {Array<CaptionProvider>}
   */
  get captionProviders() {
    // @ts-ignore
    return Array.from(this.querySelectorAll('*[slot="captions"]')).filter(
      // @ts-ignore
      (component) => component.captions
    );
  }

  onSelectClickHandler(value) {
    this.facet.toggleSelect(value);
  }

  getSearchValues() {
    return this.facet?.state?.facetSearch?.values ?? [];
  }

  getItemFromValue(value) {
    return (
      this.isFacetSearchActive ? this.facetSearchResults : this.values
    ).find((item) => this.getValueCaption(item) === value);
  }

  getValueCaption(item) {
    return this.customCaptions[item.value] || item.value;
  }

  loadCustomCaptions() {
    // The list is reversed so the caption comes from the first provider matching the value.
    return this.captionProviders
      .reverse()
      .reduce((res, provider) => ({...res, ...provider.captions}), {});
  }

  /**
   * @param {CustomEvent<{value: string}>} evt
   */
  onSelectValue(evt) {
    const item = this.getItemFromValue(evt.detail.value);

    if (item && this.isFacetSearchActive) {
      const specificSearchResult = {
        displayValue: item.value,
        rawValue: item.value,
        count: item.numberOfResults,
      };
      this.facet.facetSearch.select(specificSearchResult);      
    } else {
      this.onSelectClickHandler(item);
    }
    this.clearInput();
    this.focusShouldBeInFacet = true;
    this.focusTarget = {
      type: 'facetValue',
      value: item.value,
    };
  }

  showMore() {
    this.facet.showMoreValues();
    this.focusShouldBeInFacet = true;
    this.focusTarget = {
      type: 'facetValue',
      index: 0,
    };
  }

  showLess() {
    this.facet.showLessValues();
    this.focusShouldBeInFacet = true;
    this.focusTarget = {
      type: 'facetValue',
      index: 0,
    };
  }

  clearSelections() {
    this.facet.deselectAll();
    this.clearInput();
    this.focusShouldBeInFacet = true;
    this.focusTarget = {
      type: 'facetHeader',
    };
  }

  toggleFacetVisibility() {
    if (this.isCollapsed) {
      this.clearInput();
    }
    this._isCollapsed = !this.isCollapsed;
  }

  preventDefault(evt) {
    evt.preventDefault();
  }

  handleKeyUp() {
    if (this.isSearchComplete) {
      this.facet.facetSearch.updateText(this.input?.value);
      this.facet.facetSearch.search();
    }
  }

  clearInput() {
    if (this.input) {
      this.input.value = '';
    }
    this.facet.facetSearch.updateText('');
  }

  highlightResult(result, query) {
    if (!query || query.trim() === '') {
      return result;
    }
    const regex = new RegExp(`(${regexEncode(query)})`, 'i');
    return result.replace(
      regex,
      '<b class="facet__search-result_highlight">$1</b>'
    );
  }

  /**
   * Sets the focus on the target element.
   */
  setFocusOnTarget() {
    this.focusShouldBeInFacet = false;
    if (!this.focusTarget) {
      return;
    }
    if (this.focusTarget.type === 'facetHeader') {
      this.setFocusOnHeader();
    } else if (this.focusTarget.type === 'facetValue') {
      if (this.focusTarget.value) {
        const facetValueIndex = this.values.findIndex(
          (item) => item.value === this.focusTarget.value
        );
        this.focusTarget.index = facetValueIndex >= 0 ? facetValueIndex : 0;
      }
      this.setFocusOnFacetValue();
    }
  }

  /**
   * Sets the focus on the target facet value.
   */
  setFocusOnFacetValue() {
    const facetValues = this.template.querySelectorAll('c-commerce-facet-value');
    const focusTarget = facetValues[this.focusTarget.index];
    if (focusTarget) {
      // @ts-ignore
      focusTarget.setFocus();
    }
  }

  /**
   * Sets the focus on the facet header.
   */
  setFocusOnHeader() {
    const focusTarget = this.template.querySelector('c-commerce-card-container');
    if (focusTarget) {
      // @ts-ignore
      focusTarget.setFocusOnHeader();
    }
  }

  /**
   * Sets the component in the initialization error state.
   */
  setInitializationError() {
    this.hasInitializationError = true;
  }
}
