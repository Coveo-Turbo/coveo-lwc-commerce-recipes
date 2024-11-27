import allCategories from '@salesforce/label/c.commerce_AllCategories';
import clear from '@salesforce/label/c.commerce_Clear';
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
  Store,
} from 'c/commerceUtils';
import {api, LightningElement, track} from 'lwc';

/** @typedef {import("coveo").CategoryFacet} CategoryFacet */
/** @typedef {import("coveo").CategoryFacetState} CategoryFacetState */
/** @typedef {import("coveo").CategoryFacetValue} CategoryFacetValue */
/** @typedef {import("coveo").Summary} Summary */
/** @typedef {import("coveo").CommerceEngine} CommerceEngine */
/** @typedef {import('../commerceUtils/facetDependenciesUtils').DependsOn} DependsOn */
/**
 * @typedef FocusTarget
 * @type {object}
 * @property {'facetValue' | 'facetHeader'} type
 */
/**
 * @typedef CaptionProvider
 * @type {object}
 * @property {Record<string, string>} captions
 */

/**
 * A facet is a list of values for a certain field occurring in the results, ordered using a configurable criterion (e.g., number of occurrences).
 * A `CommerceCategoryFacet` displays field values in a browsable, hierarchical fashion.
 * Custom captions can be provided by adding caption provider components to the `captions` named slot.
 * See [Create a custom caption provider component for Commerce facets](https://docs.coveo.com/en/quantic/latest/usage/create-custom-caption-provider-component/).
 * @category Search
 * @category Insight Panel
 * @example
 * <c-commerce-category-facet engine-id={engineId} facet-id="myfacet" field="geographicalhierarchy" label="Country" base-path="Africa,Togo,Lome" no-filter-by-base-path delimiting-character="/" number-of-values="5" is-collapsed></c-commerce-category-facet>
 *
 * @example
 * <c-commerce-category-facet engine-id={engineId} field="geographicalhierarchy">
 *   <c-commerce-facet-caption slot="captions" value="United States" caption="United States of America"></c-commerce-facet-caption>
 *   <c-commerce-facet-caption slot="captions" value="usa" caption="USA"></c-commerce-facet-caption>
 * </c-commerce-facet>
 */
export default class CommerceCategoryFacet extends LightningElement {
  /**
   * The ID of the engine instance the component registers to.
   * @api
   * @type {string}
   */
  @api engineId;
  /**
   * The facet controller instance.
   * @api
   * @type {CategoryFacet}
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
   * Whether this facet should contain a search box.
   * @api
   * @type {boolean}
   * @defaultValue `false`
   */
  @api withSearch = false;

  /**
   * Whether the facet is collapsed.
   * @api
   * @type {boolean}
   * @defaultValue `false`
   */
  @api get isCollapsed() {
    return this._isCollapsed;
  }
  set isCollapsed(collapsed) {
    this._isCollapsed = collapsed;
  }
  /** @type {boolean} */
  _isCollapsed = false;
  
  /** @type {CategoryFacetState} */
  @track state;
  /** @type {Function} */
  unsubscribe;
  /** @type {string} */
  collapseIconName = 'utility:dash';
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
    clear,
    showMore,
    showLess,
    showMoreFacetValues,
    showLessFacetValues,
    allCategories,
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
    this.remoteGetValueCaption = (item) => this.translateValue(item.value);
  }

  renderedCallback() {
    initializeWithHeadless(this, this.engineId, this.initialize);
    this.input = this.template.querySelector('.facet__searchbox-input');
    if (this.focusShouldBeInFacet && !this.facet?.state?.isLoading) {
      this.setFocusOnTarget();
      this.focusTarget = null;
    }
  }

  disconnectedCallback() {
    this.unsubscribe?.();
  }

  initialize = () => {
    this.headless = getHeadlessBundle(this.engineId);
    this.customCaptions = this.loadCustomCaptions();

    this.unsubscribe = this.facet.subscribe(() => this.updateState());
    registerToStore(this.engineId, Store.facetTypes.CATEGORYFACETS, {
      label: this.displayName,
      facetId: this.facet.state.facetId,
      format: this.remoteGetValueCaption,
      element: this.template.host,
    });
  };

  updateState() {
    this.state = this.facet?.state;
    const renderFacetEvent = new CustomEvent('commerce__renderfacet', {
      detail: {
        id: this.state.facetId ?? this.field,
        shouldRenderFacet: !!this.hasParentsOrValues,
      },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(renderFacetEvent);
  }

  get displayName() {
    return this.state?.displayName || 'no-label';
  }

  get values() {
    if (!this.state?.values?.length) {
      return [];
    }

    if (this.state?.selectedValueAncestry?.length > 0) {
      return this.state?.activeValue?.children ?? [];
    }

    return this.state?.values;
  }

  get nonActiveParents() {
    return this.state?.selectedValueAncestry?.slice(0, -1) ?? [];
  }

  get activeParent() {
    return this.state?.selectedValueAncestry?.slice(-1)[0];
  }

  get activeParentFormattedValue() {
    return this.activeParent
      ? this.remoteGetValueCaption(this.activeParent)
      : '';
  }

  get canShowMore() {
    return (
      this.facet && this.state?.canShowMoreValues && !this.isFacetSearchActive
    );
  }

  get canShowLess() {
    return this.facet && this.state?.canShowLessValues;
  }

  get hasParents() {
    return this.state?.selectedValueAncestry?.length;
  }

  get hasValues() {
    return this.state?.values?.length;
  }

  get hasSearchResults() {
    return this.getSearchValues().length > 0;
  }

  get canShowMoreSearchResults() {
    return this.state?.facetSearch.moreValuesAvailable;
  }

  get facetSearchResults() {
    return this.getSearchValues().map((result, index) => ({
      value: result.rawValue,
      index: index,
      numberOfResults: result.count,
      path: result.path,
      localizedPath: this.buildPath(
        result.path.map((path) => this.translateValue(path))
      ),
      highlightedResult: this.highlightResult(
        result.displayValue,
        this.input?.value
      ),
    }));
  }

  get query() {
    return this.input?.value;
  }

  get hasParentsOrValues() {
    return this.hasParents || this.hasValues;
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

  get isSearchComplete() {
    return !this.facet.state.isLoading;
  }

  get isFacetSearchActive() {
    return this.withSearch && !!this.input?.value?.length;
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

  getSearchValues() {
    return this.facet?.state?.facetSearch?.values ?? [];
  }

  translateValue(value) {
    return this.customCaptions[value] || value;
  }

  loadCustomCaptions() {
    // The list is reversed so the caption comes from the first provider matching the value.
    return this.captionProviders
      .reverse()
      .reduce(
        (captions, provider) => ({...captions, ...provider.captions}),
        {}
      );
  }

  /**
   * @param {CustomEvent<{value: string}>} evt
   */
  onSelectValue(evt) {
    const item = this.getItemFromValue(evt.detail.value);

    if (item && this.isFacetSearchActive) {
      this.facet.facetSearch.select({
        displayValue: item.value,
        rawValue: item.value,
        count: item.numberOfResults,
        path: item.path,
      });
    } else {
      // @ts-ignore
      this.facet.toggleSelect(item);
    }
    this.clearInput();
    this.keepFocusInFacet('facetValue');
  }

  getItemFromValue(value) {
    const facetValues = [...this.values, ...this.nonActiveParents];
    return (
      (this.isFacetSearchActive ? this.facetSearchResults : facetValues)
        // @ts-ignore
        .find((item) => this.remoteGetValueCaption(item) === value)
    );
  }

  preventDefault(evt) {
    evt.preventDefault();
  }

  showMore() {
    this.facet.showMoreValues();
    this.keepFocusInFacet('facetValue');
  }

  showLess() {
    this.facet.showLessValues();
    this.keepFocusInFacet('facetValue');
  }

  reset() {
    this.facet.deselectAll();
    this.keepFocusInFacet('facetHeader');
  }

  /**
   * @param {KeyboardEvent} evt
   */
  onKeyDownReset(evt) {
    if (evt.code === 'Enter' || evt.code === 'Space') {
      evt.preventDefault();
      this.facet.deselectAll();
      this.keepFocusInFacet('facetHeader');
    }
  }

  toggleFacetVisibility() {
    if (this.isCollapsed) {
      this.clearInput();
    }
    this._isCollapsed = !this.isCollapsed;
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
    return result.replace(regex, '<b>$1</b>');
  }

  /**
   * @param {string[]} path
   */
  buildPath(path) {
    if (!path.length) {
      return this.labels.allCategories;
    }
    if (path.length > 2) {
      path = path.slice(0, 1).concat('...', ...path.slice(-1));
    }
    return path.join('/');
  }

  /**
   * @param {"facetValue" | "facetHeader"} type
   */
  keepFocusInFacet(type) {
    this.focusShouldBeInFacet = true;
    this.focusTarget = {
      type,
    };
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
      if (this.values.length) {
        this.setFocusOnFirstFacetValue();
      } else {
        this.setFocusOnLastNonActiveParent();
      }
    }
  }

  /**
   * Sets the focus on the first facet value.
   */
  setFocusOnFirstFacetValue() {
    const focusTarget = this.template.querySelector(
      '.facet__value > c-commerce-category-facet-value'
    );
    if (focusTarget) {
      // @ts-ignore
      focusTarget.setFocus();
    }
  }

  /**
   * Sets the focus on the last non-active parent.
   */
  setFocusOnLastNonActiveParent() {
    const nonActiveParents = this.template.querySelectorAll(
      '.facet__non-active-parent > c-commerce-category-facet-value'
    );
    const lastNonActiveParent = nonActiveParents[nonActiveParents.length - 1];
    if (lastNonActiveParent) {
      // @ts-ignore
      lastNonActiveParent.setFocus();
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
