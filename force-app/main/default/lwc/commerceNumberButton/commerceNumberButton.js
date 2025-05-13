import {LightningElement, api} from 'lwc';

/**
 * The `CommerceNumberButton` component is used internally to display a button in a set of buttons with numeric labels.
 * @fires CustomEvent#commerce__select
 * @category Utility
 * @example
 * <c-commerce-number-button number="1" selected commerce__select={select}></c-commerce-number-button>
 */
export default class CommerceNumberButton extends LightningElement {
  /**
   * The number to display as button label.
   * @api
   * @type {number}
   */
  @api number;
  /**
   * The selected number in the set of buttons.
   * @api
   * @type {boolean}
   */
  @api selected;
  /**
   * The value for aria-label.
   * @api
   * @type {string}
   */
  @api ariaLabelValue;

  get isPressed() {
    return `${this.selected}`;
  }

  get buttonClasses() {
    const classes = ['slds-button', 'slds-m-left_xx-small'];
    classes.push(
      this.selected ? 'slds-button_brand' : 'slds-button_outline-brand'
    );
    return classes.join(' ');
  }

  select() {
    this.dispatchEvent(
      new CustomEvent('commerce__select', {detail: this.number})
    );
  }
}
