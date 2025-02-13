import {LightningElement, api} from 'lwc';

/** @typedef {import("coveo").SortCriterion} SortCriterion */

/**
 * The `CommerceSortOption` component defines a sort option for a `c-commerce-sort` component.
 * It must therefore be defined within a `c-commerce-sort` component.
 *
 * A sort option is a criterion that the end user can select to sort the query results.
 * @example
 * <c-commerce-sort-option></c-commerce-sort-option>
 */
export default class CommerceSortOption extends LightningElement {
  /**
   * The label of the sort option.
   * @api
   * @type {string}
   */
  @api label;
  /**
   * The value of the sort option.
   * @api
   * @type {string}
   */
  @api value;
  /**
   * The criterion to use when sorting query results.
   * @api
   * @type {SortCriterion}
   */
  @api criterion;
}
