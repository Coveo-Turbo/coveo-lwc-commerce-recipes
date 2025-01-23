import {LightningElement, api} from 'lwc';
// @ts-ignore
import defaultTemplate from './commerceProduct.html';

/** @typedef {import("coveo").Product} Product */
/** @typedef {import("coveo").ProductTemplatesManager} ProductTemplatesManager */
/** @typedef {import("coveo").InteractiveProduct} InteractiveProduct */
// /** @typedef {import("coveo").FoldedProductList} FoldedCollection */
// /** @typedef {import("coveo").FoldedResultList} FoldedResultList */


export default class CommerceProduct extends LightningElement {
  /**
   * The ID of the engine instance the component registers to.
   * @api
   * @type {string}
   */
  @api engineId;
  /**
   * The [product item](https://docs.coveo.com/en/headless/latest/reference/commerce/controllers/product-listing/#product).
   * @api
   * @type {Product}
   */
  @api product;
  /**
   * The interactive product controller
   * @api
   * @type {InteractiveProduct}
   */
  @api interactiveProduct;
  /**
   * The template manager from which to get registered custom templates.
   * @api
   * @type {ProductTemplatesManager}
   */
  @api productTemplatesManager;
  // /**
  //  * The folded result list controller responsible for executing the actions of the folded collection.
  //  * @api
  //  * @type {FoldedResultList}
  //  */
  // @api foldedResultListController;
  // /**
  //  * The folded collection containing the result and its children.
  //  * @api
  //  * @type {FoldedCollection}
  //  */
  // @api collection;
  /**
   * The id of the template that should be used to display the result.
   * @api
   * @type {string}
   */
  @api templateId;

  /** @type {boolean} */
  isHovered = false;

  connectedCallback() {}
  disconnectedCallback() {}

  render() {
    const product = {
      ...this.product,
      additionalFields: {...this.product.additionalFields, quantic__templateId: this.templateId},
    };
    const template = this?.productTemplatesManager?.selectTemplate(product);
    if (template) {
      return template;
    }
    return defaultTemplate;
  }

  handleClick() {
    // @ts-ignore
    console.log('Product clicked', this.product, this.linkContainer);
    this.linkContainer?.click();
  }

  get productThumbnail() {
    return this.product?.ec_thumbnails?.[0];
  }

  get interactiveProductController() {
    return this.interactiveProduct;
  }

  get linkContainer() {
    return this.template.querySelector('.link-container > c-commerce-product-link a');
  }

}