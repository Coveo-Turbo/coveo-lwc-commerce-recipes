import {LightningElement, api} from 'lwc';
// @ts-ignore
import fullLayout from './templates/full.html';
// @ts-ignore
import compactLayout from './templates/compact.html';
// @ts-ignore
import miniLayout from './templates/mini.html';

/**
 * The `CommerceProductTemplate` component is used to construct product templates using predefined and formatted [slots](https://developer.salesforce.com/docs/component-library/documentation/en/lwc/lwc.create_components_slots).
 * @category Product Template
 * @example
 * <c-commerce-product-template>
 *   <div slot="visual"></div>
 *   <div slot="badges"></div>
 *   <div slot="name"></div>
 *   <div slot="metadata"></div>
 *   <div slot="emphasized"></div>
 *   <div slot="description"></div>
 *   <div slot="bottom-metadata"></div>
 *   <div slot="children"></div>
 * </c-commerce-product-template>
 */
export default class CommerceProductTemplate extends LightningElement {

  /**
   * Specifies whether the border of the result template should be hidden.
   * @api
   * @type {boolean}
   */
  @api hideBorder = false;

  /**
   * The variant of the component. Accepted variants are `full` and `compact`.
   * @api
   * @type {'full' | 'compact' | 'mini'}
   */
  @api variant = 'full';

  /** @type {boolean} */
  isHeaderEmpty = true;
  /** @type {boolean} */
  isBadgesSlotEmpty = true;

  handleHeaderSlotChange(event) {
    const slot = event.target;
    const slotHasContent = !!slot.assignedElements().length;
    if (slotHasContent) {
      this.isHeaderEmpty = false;
      if (slot.name === 'badges') {
        this.isBadgesSlotEmpty = false;
      }
    }
  }

  /** Returns the CSS class of the header of the result template */
  get headerCssClass() {
    return `slds-grid slds-wrap slds-col slds-grid_vertical-align-center slds-size_1-of-1 slds-text-align_left ${
      this.isHeaderEmpty ? '' : 'slds-m-bottom_x-small'
    }`;
  }

  /** Returns the CSS class  of the badges slot of the result template */
  get badgesSlotCssClass() {
    return `badge__container slds-col slds-order_1 slds-small-order_1 slds-medium-order_2 slds-large-order_2 slds-m-right_small ${
      this.isBadgesSlotEmpty ? '' : 'slds-m-vertical_xx-small'
    }`;
  }

  get templateClass() {
    return `lgc-bg slds-p-vertical_medium ${
      this.hideBorder || this.hasChildTemplates ? '' : 'slds-border_bottom'
    }`;
  }

  get hasChildTemplates() {
    return !!this.querySelector('*[slot="children"]');
  }

  render() {
    if (this.variant === 'mini') {
      return miniLayout;
    } else if (this.variant === 'full') {
      return fullLayout;
    } else if (this.variant === 'compact') {
      return compactLayout;
    } 
    // Fallback to full layout if variant is not recognized
    return fullLayout;
  }
}
