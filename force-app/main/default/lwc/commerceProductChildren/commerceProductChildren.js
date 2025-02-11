import { filterProtocol } from 'c/commerceUtils';
import {LightningElement, api, track} from 'lwc';

import availableIn from '@salesforce/label/c.commerce_AvailableIn';
import colon from '@salesforce/label/c.commerce_Colon';

/** @typedef {import("coveo").Product} Product */
/** @typedef {import("coveo").ChildProduct} ChildProduct */
/** @typedef {import("coveo").ProductTemplatesManager} ProductTemplatesManager */
/** @typedef {import("coveo").ProductTemplatesHelpers} ProductTemplatesHelpers */
/** @typedef {import("coveo").InteractiveProduct} InteractiveProduct */

/**
 * The `CommerceProductChildren` component renders the product children.
 * @fires CustomEvent#commerce__selectchildproduct
 */
export default class CommerceProductChildren extends LightningElement {
  labels = {
    availableIn,
    colon
  }
  /**
   * The ID of the engine instance the component registers to.
   * @api
   * @type {string}
   */
  @api engineId;
  /**
   * The field whose value is displayed by the component.
   * @api
   * @type {string}
   */
  @api field = 'ec_thumbnails';
  /**
   * A fallback image URL to use when the specified `field` is not defined on a given child product, or when its value is invalid.
   * @api
   * @type {string}
   */
  @api fallback = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50"%3E%3Crect width="50" height="50" fill="none" stroke="gray"%3E%3C/rect%3E%3C/svg%3E';
  /**
   * The template manager from which to get registered custom templates.
   * @api
   * @type {ProductTemplatesManager}
   */
  @api productTemplatesManager;
  /**
   * The [product item](https://docs.coveo.com/en/headless/latest/reference/commerce/controllers/product-listing/#product).
   * @api
   * @type {Product}
   */
  @api product;
  /**
   * The id of the template that should be used to display the result.
   * @api
   * @type {string}
   */
  @api templateId;

  @api nbOfChildrenToDisplay = 6;

  @track activeChildId;

  connectedCallback() {
    this.activeChildId = this.product.permanentid;
  }


  get children() {
    return (
      this.product.children.map((child, i) => ({
        ...child,
        imageUrl: this.getImageUrl(child),
        productName: child.ec_name || undefined,
        cssClass: this.getCssClass(child),
        isLastChild: i === this.nbOfChildrenToDisplay - 1,
        remainingChildren: this.product.children.length - (this.nbOfChildrenToDisplay - 1)
        // interactiveProductProps: ProductUtils.interactiveProductProps(this.controller, product),
      })) || []
    );
  }

  get hasChildren() {
    return this.product.children.length > 0;
  }

  get childrenLabel() {
    return this.labels.availableIn + this.labels.colon;
  }

  /**
  * @param {ChildProduct} child
  */
  getImageUrl(child){
    // eslint-disable-next-line no-undef
    const value = child?.[this.field];

    if (typeof value === 'string') {
      return filterProtocol(value);
    }

    if (Array.isArray(value) && typeof value[0] === 'string') {
      return filterProtocol(value[0]);
    }

    return filterProtocol(this.fallback);
  }

  get cssChildrenGrid(){
    return 'slds-size_1-of-' + this.nbOfChildrenToDisplay;
  }
  getCssClass(child){
    return `slds-button slds-p-around_none product-child ${this.activeChildId === child.permanentid ? 'slds-button_outline-brand active' : ''}`;
  }

  /**
   * Sends the "commerce__selectchildproduct" event.
   * @param {{child: ChildProduct}} selectedChild
   */
  sendSelectChildProductEvent(selectedChild) {
    const selectChildProductEvent = new CustomEvent('commerce__selectchildproduct', {
      detail: {
        selectedChild,
      },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(selectChildProductEvent);
  }

  /**
  * @param {string} childId
  */
  onSelectChild(childId) {
    this.activeChildId = childId;
    const child = this.product.children.find((c) => c.permanentid === childId);
    this.sendSelectChildProductEvent({
      child
    });
  }

  /**
   * @param {KeyboardEvent} event
   */
  onKeyPress(event) {
    if (event.key === 'Enter') {
      // @ts-ignore
      const childId = event.target.dataset.childId;
      this.onSelectChild(childId);
    }
  }

  onMouseEnter(event) {
    // @ts-ignore
    const childId = event.target.dataset.childId;
    this.onSelectChild(childId);
  }

  onTouchStart(event) {
    event.stopPropagation();
    event.prevnentDefault();
    // @ts-ignore
    const childId = event.target.dataset.childId;
    this.onSelectChild(childId);
  }
}