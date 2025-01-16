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
import {STANDALONE_SEARCH_BOX_STORAGE_KEY} from 'c/commerceUtils';
import {LightningElement, api} from 'lwc';

/** @typedef {import("coveo").CommerceEngine} CommerceEngine */
/** @typedef {import("coveo").CommerceEngineOptions} CommerceEngineOptions */
/** @typedef {import("coveo").UrlManager} UrlManager */
/** @typedef {import("coveo").Search} Search */
/** @typedef {import("coveo").ProductListing} ProductListing */

/**
* The `CommerceInterface` component handles the headless commerce engine configuration.
* A single instance should be used for each instance of the Coveo Headless commerce engine.
* @fires CustomEvent#commerceInterfaceinitialized
* @category Commerce
* @example
* <c-commerce-interface engine-id={engineId}></c-commerce-interface>
*/
export default class CommerceInterface extends LightningElement {
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
  /**
   * Whether the state should not be reflected in the URL parameters.
   * @api
   * @type {boolean}
   * @defaultValue false
   */
  @api disableStateInUrl = false;
  /**
   * The type of the interface.
   * - 'search': Indicates that the interface is used for Search.
   * - 'product-listing': Indicates that the interface is used for Product listing.
   * @api
   * @type {'search' | 'product-listing'}
   * @defaultValue 'search'
   */
  @api type = 'search';

  /** @type {CommerceEngineOptions} */
  engineOptions;
  /** @type {Search | ProductListing } */
  searchOrListing;
  /** @type {UrlManager} */
  urlManager;
  /** @type {Function} */
  unsubscribeUrlManager;
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
                this.input.setAttribute('is-initialized', 'true');
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
    
    this.initRequestStatus(engine);
    this.initContext(engine);
    // this.initLanguage();
    this.initUrlManager();
   
    // @ts-ignore
    if (this.type === 'search') {

      const redirectData = window.localStorage.getItem(
        STANDALONE_SEARCH_BOX_STORAGE_KEY
      );

      if (!redirectData) {
        // @ts-ignore
        this.searchOrListing.executeFirstSearch();
        return 
      }

      window.localStorage.removeItem(STANDALONE_SEARCH_BOX_STORAGE_KEY);
      const {value} = JSON.parse(redirectData);

      engine.dispatch(
        CoveoHeadlessCommerce.loadQueryActions(engine).updateQuery({query: value}));
      // @ts-ignore
      this.searchOrListing.executeFirstSearch();
    } else {
      // @ts-ignore
      this.searchOrListing.executeFirstRequest();
    }
    
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

  get fragment() {
    return window.location.hash.slice(1);
  }

  initRequestStatus(engine) {
    this.searchOrListing =
    // @ts-ignore
    this.type === 'product-listing'
      ? CoveoHeadlessCommerce.buildProductListing(engine)
      : CoveoHeadlessCommerce.buildSearch(engine);
  }

  initContext(engine) {
    this.context = CoveoHeadlessCommerce.buildContext(engine);
  }

  // initLanguage() {
  //   if (!this.language) {
  //     this.language = this.context.state.language;
  //   }
  // }


  initUrlManager() {
    if (!this.disableStateInUrl) {
      return;
    }

    this.urlManager = this.searchOrListing.urlManager({
      initialState: {fragment: this.fragment},
    });

    this.unsubscribeUrlManager = this.urlManager.subscribe(() =>
      this.updateHash()
    );
    window.addEventListener('hashchange', this.onHashChange);
  }

  updateHash() {
    window.history.pushState(
      null,
      document.title,
      `#${this.urlManager.state.fragment}`
    );
  }

  onHashChange = () => {
    this.urlManager.synchronize(this.fragment);
  };

  /**
   * @returns {HTMLInputElement}
   */
  get input() {
    return this.template.querySelector('input');
  }

}