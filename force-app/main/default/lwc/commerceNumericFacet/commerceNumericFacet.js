// @ts-nocheck
import LOCALE from '@salesforce/i18n/locale';
import apply from '@salesforce/label/c.commerce_Apply';
import clearFilter from '@salesforce/label/c.commerce_ClearFilter';
import clearFilterFacet from '@salesforce/label/c.commerce_ClearFilterFacet';
import clearFilter_plural from '@salesforce/label/c.commerce_ClearFilter_plural';
import collapseFacet from '@salesforce/label/c.commerce_CollapseFacet';
import expandFacet from '@salesforce/label/c.commerce_ExpandFacet';
import max from '@salesforce/label/c.commerce_Max';
import messageWhenRangeOverflow from '@salesforce/label/c.commerce_MessageWhenRangeOverflow';
import messageWhenRangeUnderflow from '@salesforce/label/c.commerce_MessageWhenRangeUnderflow';
import min from '@salesforce/label/c.commerce_Min';
import numberInputApply from '@salesforce/label/c.commerce_NumberInputApply';
import numberInputMaximum from '@salesforce/label/c.commerce_NumberInputMaximum';
import numberInputMinimum from '@salesforce/label/c.commerce_NumberInputMinimum';
import {
  registerComponentForInit,
  initializeWithHeadless,
  registerToStore,
  getHeadlessBundle,
} from 'c/commerceHeadlessLoader';
import {
  I18nUtils,
  shouldDisplayInputForFacetRange,
  Store,
} from 'c/commerceUtils';
import {LightningElement, track, api} from 'lwc';

/** @typedef {import("coveo").NumericFacetState} NumericFacetState */
/** @typedef {import("coveo").NumericFacet} NumericFacet */
/** @typedef {import("coveo").NumericFacetValue} NumericFacetValue */
/** @typedef {import("coveo").Summary} Summary */
/** @typedef {import("coveo").CommerceEngine} CommerceEngine */
/** @typedef {import("coveo").ProductListingSummaryState} ProductListingSummaryState */
/** @typedef {import("coveo").SearchSummaryState} SearchSummaryState */
/** @typedef {import("coveo").Context} Context */
/** @typedef {import("coveo").ContextState} ContextState */
/** @typedef {import('../commerceUtils/facetDependenciesUtils').DependsOn} DependsOn */
/**
 * @typedef FocusTarget
 * @type {object}
 * @property {'facetValue' | 'facetHeader' | 'applyButton'} type
 * @property {string} [value]
 * @property {number} [index]
 */

/**
 * The `CommerceNumericFacet` component displays facet values as numeric ranges.
 * @category Commerce
 * @example
 * <c-commerce-numeric-facet engine-id={engineId} facet-id="myfacet" field="ytlikecount" label="Youtube Likes" numberOfValues="5" sort-criteria="descending" range-algorithm="even" formatting-function={myFormattingFunction} is-collapsed></c-commerce-numeric-facet>
 */
export default class CommerceNumericFacet extends LightningElement {
  /**
   * The ID of the engine instance the component registers to.
   * @api
   * @type {string}
   */
  @api engineId;
  /**
   * The facet controller instance.
   * @api
   * @type {NumericFacet}
   */
  @api facet;
  /**
   * The facet controller instance.
   * @api
   * @type {Summary<ProductListingSummaryState | SearchSummaryState>}
   */
  @api summary;
  /**
   * The field whose values you want to display in the facet.
   * @api
   * @type {string}
   */
  @api field;
  /**
   * The function used to format the date facet value label.
   * The default result format is the following: `[start] - [end]`
   * @api
   * @type {Function}
   * @param {NumericFacetValue} item
   * @returns {string}
   */
  @api formattingFunction = (item) =>
    `${new Intl.NumberFormat(LOCALE).format(
      item.start
    )} - ${new Intl.NumberFormat(LOCALE).format(item.end)}`;
  
  /**
   * Whether this facet should contain an input allowing users to set custom ranges.
   * Depending on the field, the input can allow either decimal or integer values.
   *   - `integer`
   *   - `decimal`
   * @api
   * @type {'integer' | 'decimal'}
   */
  @api withInput;
  /*
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

  static attributes = [
    'facet',
    'field',
    'summary',
    'withInput'
  ];

  /** @type {NumericFacetState} */
  @track state;
  /** @type {ProductListingSummaryState | SearchSummaryState} */
  @track summaryState;

  /**  @type {Context} */
  context; 
  /** @type {Function} */
  unsubscribe;
  /** @type {Function} */
  unsubscribeFilter;
  /** @type {Function} */
  unsubscribeSummary;
  /** @type {CoveoHeadlessCommerce} */
  headless;
  /** @type {FocusTarget} */
  focusTarget;
  /** @type {boolean} */
  focusShouldBeInFacet = false;
  /** @type {boolean} */
  hasInitializationError = false;

  /** @type {string} */
  start;
  /** @type {string} */
  end;
  /** @type {string} */
  min;
  /** @type {string} */
  max;

  labels = {
    clearFilter,
    clearFilter_plural,
    clearFilterFacet,
    collapseFacet,
    expandFacet,
    min,
    max,
    numberInputMinimum,
    numberInputMaximum,
    apply,
    numberInputApply,
    messageWhenRangeOverflow,
    messageWhenRangeUnderflow,
  };

  connectedCallback() {
    registerComponentForInit(this, this.engineId);
  }

  renderedCallback() {
    initializeWithHeadless(this, this.engineId, this.initialize);
    if (this.focusShouldBeInFacet && !this.facet?.state?.isLoading) {
      this.setFocusOnTarget();
      this.focusTarget = null;
    }
  }

  /**
   * @param {CommerceEngine} engine
   */
  initialize = (engine) => {
    
    this.headless = getHeadlessBundle(this.engineId);
    this.context = this.headless.buildContext(engine);
    this.unsubscribe = this.facet.subscribe(() => this.updateState());
    this.unsubscribeSummary = this.summary.subscribe(() => this.updateState());
    
    registerToStore(this.engineId, Store.facetTypes.NUMERICFACETS, {
      label: this.displayName,
      facetId: this.facet.state.facetId,
      format: this.formattingFunction,
      element: this.template.host,
    });
  };


  disconnectedCallback() {
    this.unsubscribe?.();
    this.unsubscribeSummary?.();
  }

  updateState() {
    this.state = this.facet?.state;
    this.summaryState = this.summary?.state;

    this.start = this.state?.manualRange?.start?.toString();
    this.end = this.state?.manualRange?.end?.toString();

    const renderFacetEvent = new CustomEvent('commerce__renderfacet', {
      detail: {
        id: this.facet?.state.facetId ?? this.field,
        shouldRenderFacet: this.shouldRenderFacet,
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
    return (
      this.state?.values
        .filter((value) => value.numberOfResults || value.state === 'selected')
        .map((value) => {
          return {
            ...value,
            key: `${value.start}..${value.end}`,
            checked: value.state === 'selected',
          };
        }) || []
    );
  }

  get step() {
    return this.withInput === 'integer' ? '1' : 'any';
  }

  /** @returns {HTMLInputElement} */
  get inputMin() {
    return this.template.querySelector('.numeric__input-min');
  }

  /** @returns {HTMLInputElement} */
  get inputMax() {
    return this.template.querySelector('.numeric__input-max');
  }

  get hasActiveValues() {
    return this.state?.hasActiveValues || this.hasInputRange;
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

  get hasInputRange() {
    return !!this.state?.manualRange || this.summaryState?.isLoading;
  }

  get numberOfSelectedValues() {
    return this.hasInputRange
      ? 1
      : this.state.values.filter(({state}) => state === 'selected').length;
  }

  get showValues() {
    return (
      !this.summaryState.hasError &&
      !this.hasInputRange &&
      !!this.values.length
    );
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
    return `${I18nUtils.format(this.labels.clearFilterFacet, this.field)}`;
  }

  get shouldRenderInput() {
    return shouldDisplayInputForFacetRange({
      hasInputRange: this.hasInputRange,
      searchStatusState: {
        firstSearchExecuted: this.summaryState?.firstRequestExecuted || false,
        hasError: this.summaryState?.hasError || false,
        hasResults: this.summaryState?.hasProducts || false,
        isLoading: this.summaryState?.isLoading || false,
      },
      facetValues: this.state?.values,
      hasInput: true,
    });
  }

  get shouldRenderValues() {
    return !this.hasInputRange && !!this.values.length;
  }

  get shouldRenderFacet() {
    return this.shouldRenderInput || this.shouldRenderValues;
  }

  setValidityParameters() {
    this.inputMin.max = this.max || Number.MAX_VALUE.toString();
    this.inputMax.min = this.min || Number.MIN_VALUE.toString();
    this.inputMin.required = true;
    this.inputMax.required = true;
  }

  resetValidityParameters() {
    this.inputMin.max = Number.MAX_VALUE.toString();
    this.inputMax.min = Number.MIN_VALUE.toString();
    this.inputMin.required = false;
    this.inputMax.required = false;
  }

  /**
   * @param {CustomEvent<{value: string}>} evt
   */
  onSelectValue(evt) {
    const item = this.values.find(
      (value) => this.formattingFunction(value) === evt.detail.value
    );
    this.facet.toggleSelect(item);
    this.focusShouldBeInFacet = true;
    this.focusTarget = {
      type: 'facetValue',
      value: evt.detail.value,
    };
  }

  clearSelections() {
    this.facet?.deselectAll();
    if (this.withInput) {
      this.resetValidityParameters();

      this.allInputs.forEach((input) => {
        // @ts-ignore
        input.checkValidity();
        // @ts-ignore
        input.reportValidity();
      });
    }
    this.focusShouldBeInFacet = true;
    this.focusTarget = {
      type: 'facetHeader',
    };
  }

  toggleFacetVisibility() {
    this._isCollapsed = !this.isCollapsed;
  }

  preventDefault(evt) {
    evt.preventDefault();
  }

  /**
   * @param {Event} evt
   */
  onApply(evt) {
    evt.preventDefault();

    this.setValidityParameters();
    const allValid = this.allInputs.reduce(
      // @ts-ignore
      (validSoFar, inputCmp) => validSoFar && inputCmp.reportValidity(),
      true
    );
    this.resetValidityParameters();

    if (!allValid) {
      return;
    }

    // if (this.state.values.length > 0) {
    //   const engine = getHeadlessBindings(this.engineId).engine;
    //   engine.dispatch(
    //     this.headless
    //       .loadNumericFacetSetActions(engine)
    //       .deselectAllNumericFacetValues(this.facet.state.facetId)
    //   );
    // }

    this.facet.setRanges([
      {
        start: this.inputMin ? Number(this.inputMin.value) : undefined,
        end: this.inputMax ? Number(this.inputMax.value) : undefined,
        endInclusive: true,
        state: 'selected',
      }]);

    this.focusShouldBeInFacet = true;
    this.focusTarget = {
      type: 'applyButton',
    };
  }

  onChangeMin(evt) {
    this.min = evt.target.value;
  }

  onChangeMax(evt) {
    this.max = evt.target.value;
  }

  resetValidationErrors() {
    this.allInputs.forEach((input) => {
      // @ts-ignore
      input.setCustomValidity('');
      // @ts-ignore
      input.reportValidity();
    });
  }

  get allInputs() {
    return [...this.template.querySelectorAll('lightning-input')];
  }

  get numberInputMinimumLabel() {
    return I18nUtils.format(this.labels.numberInputMinimum, this.displayName);
  }

  get numberInputMaximumLabel() {
    return I18nUtils.format(this.labels.numberInputMaximum, this.displayName);
  }

  get numberInputApplyLabel() {
    return I18nUtils.format(this.labels.numberInputApply, this.displayName);
  }

  get customMessageOverflow() {
    return I18nUtils.format(this.labels.messageWhenRangeOverflow, this.max);
  }

  get customMessageUnderflow() {
    return I18nUtils.format(this.labels.messageWhenRangeUnderflow, this.min);
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
    } else if (this.focusTarget.type === 'applyButton') {
      this.setFocusOnApplyButton();
    } else if (this.focusTarget.type === 'facetValue') {
      if (this.focusTarget.value) {
        const facetValueIndex = this.values.findIndex(
          (value) => this.formattingFunction(value) === this.focusTarget.value
        );
        this.focusTarget.index = facetValueIndex >= 0 ? facetValueIndex : 0;
        this.setFocusOnFacetValue();
      }
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
   * Sets the focus on the apply button.
   */
  setFocusOnApplyButton() {
    const focusTarget = this.template.querySelector(
      '.facet__search-form lightning-button'
    );
    if (focusTarget) {
      // @ts-ignore
      focusTarget.focus();
    }
  }

  /**
   * Sets the component in the initialization error state.
   */
  setInitializationError() {
    this.hasInitializationError = true;
  }
}
