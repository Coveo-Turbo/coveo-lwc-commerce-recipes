import carousel from '@salesforce/label/c.commerce_Carousel';
import goToPage from '@salesforce/label/c.commerce_GoToPage';
import invalidPositiveIntegerProperty from '@salesforce/label/c.commerce_InvalidPositiveIntegerProperty';
import nextPage from '@salesforce/label/c.commerce_NextPage';
import previousPage from '@salesforce/label/c.commerce_PreviousPage';
import {I18nUtils} from 'c/commerceUtils';
import {LightningElement, api} from 'lwc';

/**
 * The `CommerceCarousel` component displays the content within a carousel. This component also displays navigation buttons that allow end users to navigate between the different pages of the carousel.
 * @category Utility
 * @example
 * <c-commerce-carousel number-of-pages="2" number-of-items-per-page="1">
 *   <div slot="carousel-item">Item One</div>
 *   <div slot="carousel-item">Item Two</div>
 * </c-commerce-carousel>
 */
export default class CommerceCarousel extends LightningElement {
  labels = {
    invalidPositiveIntegerProperty,
    nextPage,
    previousPage,
    goToPage,
    carousel,
  };

  /**
   * The label of the carousel.
   * @api
   * @type {string}
   */
  @api label;
  /**
   * The number of items to display per page.
   * @api
   * @type {number}
   */
  @api
  get itemsPerPage() {
    return this._itemsPerPage;
  }
  set itemsPerPage(value) {

    console.log('itemsPerPage', value);
    if (Number.isInteger(Number(value)) && Number(value) > 0) {
      this._itemsPerPage = Number(value);
    } else {
      this.setInitializationError(
        I18nUtils.format(
          this.labels.invalidPositiveIntegerProperty,
          'numberOfItemsPerPage'
        )
      );
    }
  }
  /**
   * The index of the current page.
   * @api
   * @type {number}
   */
  @api
  get currentPage() {
    return this._currentPage;
  }
  set currentPage(value) {
    this._currentPage = value;
  }

  /** @type {number} */
  _currentPage = 0;
  /** @type {number} */
  _itemsPerPage = 0;
  /** @type {number} */
  numberOfPages = 0;
  /** @type {string} */
  errorMessage = '';

  renderedCallback() {
    this.hideNonVisibleSlides();
  }

  hideNonVisibleSlides() {
    this.numberOfPages = Math.ceil(
      this.carouselItems?.length / this._itemsPerPage
    );
    this.carouselItems?.forEach((item, index) => {
      const isDisplayedInCurrentPage =
        Math.floor(index / this._itemsPerPage) === this._currentPage;
      if (!isDisplayedInCurrentPage) {
        item.style.display = 'none';
      } else {
        item.style.display = '';
      }
    });
  }

  handlePrevious() {
    this._currentPage = this._currentPage - 1;
  }

  handleNext() {
    this._currentPage = this._currentPage + 1;
  }

  /**
   * Sets the component in the initialization error state.
   */
  setInitializationError(message) {
    console.error(message);
    this.errorMessage = message;
  }

  /**
   * @returns {Array}
   */
  get carouselItems() {
    /** @type {HTMLSlotElement} */
    const slot = this.template.querySelector('slot[name="carousel-item"]');
    return slot?.assignedNodes() || [];
  }

  get previousButtonIsDisabled() {
    return this._currentPage <= 0;
  }

  get nextButtonIsDisabled() {
    return this._currentPage >= this.numberOfPages - 1;
  }

  get carouselIndicators() {
    const indicatorCSSClass =
      'carousel__indicator slds-var-m-horizontal_xx-small';
    return Array.from({length: this.numberOfPages}, (_item, index) => {
      const isCurrent = index === this._currentPage;
      return {
        index,
        handleClick: () => {
          this._currentPage = index;
        },
        title: I18nUtils.format(this.labels.goToPage, index + 1),
        current: isCurrent,
        class: isCurrent
          ? indicatorCSSClass + ' carousel__indicator--active'
          : indicatorCSSClass,
      };
    });
  }
}
