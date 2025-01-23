import {LightningElement, api} from 'lwc';

/**
 * The `CommerceHeading` component offers the ability to display a label with a customizable heading level.
 * @category Utility
 * @example
 * <c-commerce-heading label="My label" level="1"></c-commerce-heading>
 */
export default class CommerceHeading extends LightningElement {
  /**
   * The label dsiplayed inside the heading.
   * @api
   * @type {string}
   */
  @api label;
  /**
   * The level to use for the heading label, accepted values are integers from 1 to 6.
   * A value outside of the range of 1 to 6 will render a div instead of a heading.
   * @type {number}
   */
  @api level;

  renderedCallback() {
    const heading = this.template.querySelector('[data-section="label"]');
    // @ts-ignore
    const level = parseInt(this.level, 10);
    const headingTag = level > 0 && level <= 6 ? `h${level}` : 'div';
    const tag = document.createElement(headingTag);
    const classMap = {
      1: 'dxp-text-heading-xlarge',
      2: 'dxp-text-heading-large',
      3: 'dxp-text-heading-medium',
      4: 'dxp-text-heading-small',
      5: 'dxp-text-heading-xsmall',
      6: 'dxp-text-heading-xxsmall'
    };
    if (classMap[level]) {
      tag.classList.add(classMap[level]);
    }
    if (this.label) {
      tag.innerText = this.label;
    }
    heading.appendChild(tag);
  }
}
