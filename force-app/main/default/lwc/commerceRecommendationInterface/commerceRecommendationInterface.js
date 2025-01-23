/* eslint-disable no-undef */
// @ts-ignore
import getHeadlessConfiguration from '@salesforce/apex/CommerceController.getHeadlessConfiguration';
// @ts-ignore
// import LOCALE from '@salesforce/i18n/locale';
import {
  getHeadlessBindings,
  loadDependencies,
  setEngineOptions,
  HeadlessBundleNames,
  destroyEngine,
  setInitializedCallback,
} from 'c/commerceHeadlessLoader';
import {LightningElement, api} from 'lwc';

/** @typedef {import("coveo").CommerceEngine} CommerceEngine */
/** @typedef {import("coveo").CommerceEngineOptions} CommerceEngineOptions */

/**
* The `CommerceRecommendationInterface` component handles the headless commerce engine configuration.
* A single instance should be used for each instance of the Coveo Headless commerce engine.
* @fires CustomEvent#commerceInterfaceinitialized
* @category Commerce
* @example
* <c-commerce-recommendation-interface engine-id={engineId}></c-commerce-recommendation-interface>
*/
export default class CommerceRecommendationInterface extends LightningElement {
  /**
   * The ID of the engine instance the component registers to.
   * @api
   * @type {string}
   */
  @api engineId;
  /**
   * The ID of your Coveo-powered ecommerce site or application.
   * @api
   * @type {string}
   */
  @api trackingId;

  /**
   * The commerce url to add in context for your Coveo-powered ecommerce site or application.
   * @api
   * @type {string}
   */
  @api commerceUrl;

  /**
   * The language to add in context for your Coveo-powered ecommerce site or application.
   * @api
   * @type {string}
   */
  @api language = 'en';

  /**
   * The country to add in context for your Coveo-powered ecommerce site or application.
   * @api
   * @type {string}
   */
  @api country = 'US';

  /**
   * The currency to add in context for your Coveo-powered ecommerce site or application.
   * @api
   * @type {string}
   */
  @api currency = 'USD';

  /** @type {CommerceEngineOptions} */
  engineOptions;
  /** @type {boolean} */
  initialized;
  /** @type {boolean} */
  hasRendered = false;
  /** @type {boolean} */
  ariaLiveEventsBound = false;

  disconnectedCallback() {
    destroyEngine(this.engineId);
  }

  connectedCallback() {
    loadDependencies(this, HeadlessBundleNames.commerce)
      .then(() => {
        if (!getHeadlessBindings(this.engineId)?.engine) {
          getHeadlessConfiguration()
            .then((data) => {
              if (data) {
                const {organizationId, accessToken, ...rest} = JSON.parse(data);
                this.engineOptions = {
                  configuration: {
                    organizationId,
                    accessToken,
                    analytics: {
                      trackingId: this.trackingId
                    },
                    context: {
                      language: this.language,
                      country: this.country,
                      currency: this.currency,
                      view: {
                        url: this.commerceUrl
                      }
                    },
                    ...rest,
                  },
                };
                setEngineOptions(
                  this.engineOptions,
                  CoveoHeadlessCommerce.buildCommerceEngine,
                  this.engineId,
                  this,
                  CoveoHeadlessCommerce
                );
                setInitializedCallback(this.initialize, this.engineId);
              }
            })
            .catch((error) => {
              console.error(
                'Error loading Headless endpoint configuration',
                error
              );
            });
        } else {
          setInitializedCallback(this.initialize, this.engineId);
        }
      })
      .catch((error) => {
        console.error('Error loading Headless dependencies', error);
      });
  }

  renderedCallback() {
    // if (!this.hasRendered && this.querySelector('c-quantic-aria-live')) {
    //   this.bindAriaLiveEvents();
    // }
    this.hasRendered = true;
  }

  initialize = (engine) => {
    if (this.initialized) {
      return;
    }
    
    this.initContext(engine);
    // const actions = {
    //   ...CoveoHeadlessCommerce.loadRecommendationsActions(engine),
    // };
    // engine.dispatch(actions.fetchRecommendations(engine));
    
    this.dispatchEvent(
      new CustomEvent(`commerceInterfaceinitialized`, {
        detail: {
          engineId: this.engineId
        },
        bubbles: true,
        composed: true,
      })
    );
    this.initialized = true;
  };

  initContext(engine) {
    this.context = CoveoHeadlessCommerce.buildContext(engine);
  }
}