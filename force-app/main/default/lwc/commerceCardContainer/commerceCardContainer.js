import {LightningElement, api} from 'lwc';

/**
 * The `CommerceCardContainer` component is used internally as a styling container.
 * @category Utility
 * @fires CustomEvent#commerce__headerclick
 * @fires CustomEvent#commerce__headerkeydown
 * @example
 * <c-commerce-card-container title="Card Example"></c-commerce-card-container>
 */
export default class CommerceCardContainer extends LightningElement {
  /**
   * The title label to display in the card header.
   * @api
   * @type {string}
   */
  @api title;

  /**
   * Sets the focus on the card header.
   * @api
   * @type {VoidFunction}
   */
  @api setFocusOnHeader() {
    const focusTarget = this.template.querySelector('.card_focusable-header');
    if (focusTarget) {
      // @ts-ignore
      focusTarget.focus();
    }
  }

  handleHeaderClick(evt) {
    evt.preventDefault();
    const headerClickEvent = new CustomEvent('commerce__headerclick', {});
    this.dispatchEvent(headerClickEvent);
  }

  handleHeaderKeyDown(evt) {
    if (evt.code === 'Enter' || evt.code === 'Space') {
      evt.preventDefault();
      const headerKeyDownEvent = new CustomEvent('commerce__headerkeydown', {});
      this.dispatchEvent(headerKeyDownEvent);
    }
  }
}
