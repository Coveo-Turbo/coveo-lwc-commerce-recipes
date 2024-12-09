import LOCALE from '@salesforce/i18n/locale';
import inclusionFilter from '@salesforce/label/c.commerce_InclusionFilter';
import inclusionFilter_plural from '@salesforce/label/c.commerce_InclusionFilter_plural';
import inclusionFilter_zero from '@salesforce/label/c.commerce_InclusionFilter_zero';
import {I18nUtils} from 'c/commerceUtils';
import {LightningElement, api} from 'lwc';

/**
 * @typedef FacetValueBase
 * @property {string} value
 * @property {number} numberOfResults
 */

/**
 * The `CommerceFacetValue` component is used by a facet component to display a formatted facet value and the number of results with that value.
 * @fires CustomEvent#commerce__selectvalue
 * @category Commerce
 * @example
 * <c-commerce-facet-value oncommerce__selectvalue={onSelect} item={result} is-checked={result.checked} formatting-function={formattingFunction}></c-commerce-facet-value>
 */
export default class CommerceFacetValue extends LightningElement {
  /**
   * The [facet value](https://docs.coveo.com/en/headless/latest/reference/search/controllers/facet/#facetvalue) to display.
   * @api
   * @type {FacetValueBase}
   */
  @api item;
  /**
   * Whether the checkbox is checked.
   * @api
   * @type {boolean}
   * @defaultValue false
   */
  @api isChecked = false;
  /**
   * A function used to format the displayed value.
   * @api
   * @type {Function}
   * @defaultValue `undefined`
   */
  @api formattingFunction;

  /**
   * Whether the facet value belongs to a range facet.
   * @api
   * @type {boolean}
   * @defaultValue `false`
   */
  @api isRangeFacet;
  /**
   * A function used to set focus to the value.
   * @api
   * @type {VoidFunction}
   * @defaultValue `undefined`
   */
  @api setFocus() {
    const focusTarget = this.template.querySelector('.facet__value-container');
    if (focusTarget) {
      // @ts-ignore
      focusTarget.focus();
    }
  }

  labels = {
    inclusionFilter,
    inclusionFilter_plural,
    inclusionFilter_zero,
  };

  get formattedFacetValue() {
    if (this.formattingFunction instanceof Function) {
      return this.formattingFunction(this.item);
    }
    return this.item.value;
  }

  get numberOfResults() {
    return new Intl.NumberFormat(LOCALE).format(this.item.numberOfResults);
  }

  get isStandardFacet() {
    return !this.isRangeFacet;
  }

  get ariaLabelValue() {
    const labelName = I18nUtils.getLabelNameWithCount(
      'inclusionFilter',
      this.numberOfResults
    );
    return I18nUtils.format(
      this.labels[labelName],
      this.formattedFacetValue,
      this.numberOfResults
    );
  }

  /**
   * @param {InputEvent} evt
   */
  onSelect(evt) {
    evt.preventDefault();
    this.dispatchEvent(
      new CustomEvent('commerce__selectvalue', {
        detail: {
          value: this.formattedFacetValue,
        },
      })
    );
  }

  /**
   * @param {KeyboardEvent} evt
   */
  onKeyDown(evt) {
    if (evt.code === 'Enter' || evt.code === 'Space') {
      evt.preventDefault();
      this.dispatchEvent(
        new CustomEvent('commerce__selectvalue', {
          detail: {
            value: this.formattedFacetValue,
          },
        })
      );
    }
  }
}
