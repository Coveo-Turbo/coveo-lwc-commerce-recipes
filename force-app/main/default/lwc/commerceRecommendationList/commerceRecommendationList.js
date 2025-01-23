// @ts-nocheck
import invalidPositiveIntegerProperty from '@salesforce/label/c.commerce_InvalidPositiveIntegerProperty';
import loadingRecommendations from '@salesforce/label/c.commerce_LoadingRecommendations';
import slide from '@salesforce/label/c.commerce_Slide';
import topDocumentsForYou from '@salesforce/label/c.commerce_TopDocumentsForYou';
import xOfY from '@salesforce/label/c.commerce_XOfY';
import {
  registerComponentForInit,
  initializeWithHeadless,
  getHeadlessBundle,
  getHeadlessBindings
} from 'c/commerceHeadlessLoader';
import {I18nUtils, AriaLiveRegion} from 'c/commerceUtils';
import {LightningElement, api, track} from 'lwc';
// @ts-ignore
import carouselLayout from './templates/carousel.html';
// @ts-ignore
import defaultRecommendationTemplate from './templates/defaultRecommendation.html';
// @ts-ignore
import gridLayout from './templates/grid.html';
// @ts-ignore
import initializationErrorTemplate from './templates/initializationError.html';
// @ts-ignore
import loadingTemplate from './templates/loading.html';

/** @typedef {import("coveo").Product} Product */
/** @typedef {import("coveo").Recommendations} Recommendations */
/** @typedef {import("coveo").RecommendationsState} RecommendationsState */
/** @typedef {import("coveo").CommerceEngine} CommerceEngine */
/** @typedef {import("coveo").ProductTemplatesManager} ProductTemplatesManager  */

/**
 * The `CommerceRecommendationList` component displays recommendations by applying one or more result templates in different layouts.
 * @fires CustomEvent#commerce__registerrecommendationtemplates
 * @category Recommendation
 * @example
 * <c-commerce-recommendation-list engine-id={engineId} slot-id={slotId} fields-to-include="objecttype,filetype" number-of-recommendations="3" recommendations-per-row="10" heading-level="1"></c-commerce-recommendation-list>
 */
export default class CommerceRecommendationList extends LightningElement {
  labels = {
    xOfY,
    topDocumentsForYou,
    slide,
    invalidPositiveIntegerProperty,
    loadingRecommendations,
  };

  /**
   * The ID of the engine instance the component registers to.
   * @api
   * @type {string}
   */
  @api engineId;
  /**
   * The identifier used by the Commerce API to retrieve the desired recommendation list for the component.
   * You can configure recommendation lists and get their respective slot IDs through the Coveo Merchandising Hub (CMH).
   * You can include multiple `c-commerce-recommendation-list` components with different slot IDs in the same page to display several recommendation lists.
   * @api
   * @type {string}
   * @default {'recommendation'}
   */
  @api slotId = 'recommendation';
  /**
   * (optional) The unique identifier of the product to use for seeded recommendations.
   * @api
   * @type {string}
   * @defaultValue `undefined`
   */
  @api productId;
  /**
   * The total number of recommendations to fetch.
   * @api
   * @type {number}
   * @default {10}
   */
  @api numberOfRecommendations = 10;
  /**
   * A list of fields to include in the query results, separated by commas.
   * @api
   * @type {string}
   * @defaultValue `'date,author,source,language,filetype,parents,sfknowledgearticleid,sfid,sfkbid,sfkavid'`
   */
  @api fieldsToInclude =
    'date,author,source,language,filetype,parents,sfknowledgearticleid,sfid,sfkbid,sfkavid';
  /**
   * The label of the component. This label is displayed in the component header.
   * @api
   * @type {string}
   * @defaultValue `'Top documents for you'`
   */
  @api label = this.labels.topDocumentsForYou;
  /**
   * The Heading level to use for the heading label, accepted values are integers from 1 to 6.
   * @api
   * @type {number}
   * @default {3}
   */
  @api headingLevel = 3;
  /**
   * The variant of the component. Accepted variants are `grid` and `carousel`.
   * @api
   * @type {'grid' | 'carousel'}
   */
  @api variant = 'grid';
  /**
   * The number of recommendations to display, per page/row.
   * Each recommendation in the row will be displayed as
   * 1/recommendationsPerRow of the container width.
   * @api
   * @type {number}
   * @default {3}
   */
  @api
  get productsPerPage() {
    return this._productsPerPage;
  }
  set productsPerPage(value) {
    if (Number.isInteger(Number(value)) && Number(value) > 0) {
      this._productsPerPage = Number(value);
    } else {
      this.setInitializationError();
      console.error(
        I18nUtils.format(
          this.labels.invalidPositiveIntegerProperty,
          'productsPerPage'
        )
      );
    }
  }

  /** @type {RecommendationsState} */
  @track state;
  /** @type {Recommendations} */
  recommendationList;
  /** @type {boolean} */
  showPlaceholder = false;
  /** @type {Function} */
  unsubscribe;
  /** @type {ProductTemplatesManager} */
  productTemplatesManager;
  /** @type {CoveoHeadlessCommerce} */
  headless;
  /** @type {bindings} */
  bindings;
  /** @type {boolean} */
  hasInitializationError = false;
  /** @type {import('c/commerceUtils').AriaLiveUtils} */
  loadingAriaLiveMessage;

  /** @type {number} */
  _productsPerPage = 3;

  connectedCallback() {
    registerComponentForInit(this, this.engineId);
    this.setRecommendationWidth();
  }

  renderedCallback() {
    initializeWithHeadless(this, this.engineId, this.initialize);
  }

  /**
   * @param {CommerceEngine} engine
   */
  initialize = (engine) => {
    this.loadingAriaLiveMessage = AriaLiveRegion('loading recommendations',this);
    this.headless = getHeadlessBundle(this.engineId);
    this.bindings = getHeadlessBindings(this.engineId);

    this.recommendationList = this.headless.buildRecommendations(engine, { 
      options: {
        slotId: this.slotId,
        productId: this.productId
      }
    });
    this.unsubscribe = this.recommendationList.subscribe(() =>
      this.updateState()
    );

    this.productTemplatesManager = this.headless.buildProductTemplatesManager();
    this.registerTemplates();

    this.recommendationList.refresh();
  };

  registerTemplates() {
    this.productTemplatesManager.registerTemplates({
      content: defaultRecommendationTemplate,
      conditions: [],
    });
    this.dispatchEvent(
      new CustomEvent('commerce__registerrecommendationtemplates', {
        bubbles: true,
        detail: this.productTemplatesManager,
      })
    );
  }

  disconnectedCallback() {
    this.unsubscribe?.();
  }

  updateState() {
    // console.log('update state', JSON.stringify(this.recommendationList.state));
    this.state = this.recommendationList?.state;
    this.showPlaceholder =
      this.recommendationList?.state?.isLoading &&
      !this.recommendationList?.state?.products?.length &&
      !this.recommendationList?.state?.error;
    if (this.showPlaceholder) {
      this.loadingAriaLiveMessage.dispatchMessage(
        this.labels.loadingRecommendations
      );
    }
  }

  setRecommendationWidth() {
    const styles = this.template.host?.style;
    styles.setProperty(
      '--recommendationItemWidth',
      `${100 / this._productsPerPage}%`
    );
  }

  get placeholders() {
    const numberOfPlaceHolders =
      this.variant === 'carousel'
        ? this._productsPerPage
        : this.numberOfRecommendations;
    return Array.from({length: numberOfPlaceHolders}, (_item, index) => ({
      index,
    }));
  }

  get recommendations() {
    return (
      this.state?.products.map(this.prepareRecommendation.bind(this)) ||
      []
    );
  }

  prepareRecommendation(rec, index, recs) {
    if (this.variant === 'grid') {
      return rec;
    }
    return {
      ...rec,
      interactiveRec: this.recommendationList.interactiveProduct,
      class: this.generateCSSClassForCarouselRecommendation(index),
      label: I18nUtils.format(this.labels.xOfY, index + 1, recs.length),
    };
  }

  generateCSSClassForCarouselRecommendation(index) {
    let recCSSClass = 'recommendation-item__container slds-var-p-top_x-small ';

    if (this._productsPerPage === 1) {
      return recCSSClass;
    }

    const recIsFirstInThePage = index % this._productsPerPage === 0;
    const recIsLastInThePage =
      index % this._productsPerPage === this._productsPerPage - 1;

    if (recIsFirstInThePage) {
      recCSSClass = recCSSClass + 'slds-var-p-right_x-small';
    } else if (recIsLastInThePage) {
      recCSSClass = recCSSClass + 'slds-var-p-left_x-small';
    } else {
      recCSSClass = recCSSClass + 'slds-var-p-horizontal_xx-small';
    }

    return recCSSClass;
  }

  get fields() {
    return this.fieldsToInclude
      .split(',')
      .map((field) => field.trim())
      .filter((field) => field.length > 0);
  }

  /**
   * Sets the component in the initialization error state.
   */
  setInitializationError() {
    this.hasInitializationError = true;
  }

  render() {
    if (this.hasInitializationError) {
      return initializationErrorTemplate;
    }
    if (this.showPlaceholder) {
      return loadingTemplate;
    }
    if (this.variant === 'carousel') {
      return carouselLayout;
    }
    return gridLayout;
  }
}
