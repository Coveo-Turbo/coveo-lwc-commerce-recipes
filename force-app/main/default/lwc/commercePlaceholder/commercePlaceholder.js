import { LightningElement, api } from 'lwc';

/**
* The `CommercePlaceholder` component is used internally to display a loading placeholder for certain components.
* @category Utility
* @example
* <c-commerce-placeholder variant="card"></c-commerce-placeholder>
*/
export default class CommercePlaceholder extends LightningElement {
  /**
   * The type of placeholder to display.
   * @api
   * @type {'card'|'productList'}
   */
  @api variant;
  /**
   * Number of placeholders to display.
   * @api
   * @type {number}
   */
  @api numberOfPlaceholders;
  // @api numberOfColumns = 4;     // Default 4 columns

  // Track the list of placeholders dynamically
  // @track placeholders = [];

  get shouldDisplay() {
    return !!this.variant && !!this.numberOfPlaceholders;
  }

  // Computed class to set the column width based on the columns property
  // get columnClass() {
  //   const columnSizeClass = `-size_1-of-${this.numberOfColumns}`;
  //   return `slds-col slds-var-m-bottom_medium slds${columnSizeClass}`;
  // }

  // get rows() {
  //   return Array.from({ length: (this.numberOfPlaceholders / this.numberOfColumns) }, (_, i) => i + 1);
  // }

  // get columns() {
  //   return Array.from({ length: this.numberOfColumns }, (_, i) => i + 1);
  // }

  get placeholders() {
    return Array.from({ length: this.numberOfPlaceholders }, (_, i) => i + 1);
  }


  get isCardVariant() {
    return this.variant === 'card';
  }

  get isProductListVariant() {
    return this.variant === 'productList';
  }
}