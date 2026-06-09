// @ts-nocheck
import {
  getHeadlessBundle,
  initializeWithHeadless,
  registerComponentForInit
} from "c/commerceHeadlessLoader";
import { LightningElement, api } from "lwc";

/** @typedef {import("coveo").CommerceEngine} CommerceEngine */
/** @typedef {import("coveo").CoveoHeadlessCommerce} CoveoHeadlessCommerce */
/** @typedef {import("coveo").RedirectionTrigger} RedirectionTrigger */

/**
 * The `CommerceRedirectionTrigger` component will redirect to the URL provided
 * in the redirection trigger state, configured in the Coveo Administration Console.
 * @category Utility
 * @example
 * <c-commerce-redirection-trigger engine-id={engineId}></c-commerce-redirection-trigger>
 */
export default class CommerceRedirectionTrigger extends LightningElement {
  /**
   * The ID of the engine instance the component registers to.
   * @api
   * @type {string}
   */
  @api engineId;

  /** @type {CommerceEngine} */
  engine;
  /** @type {CoveoHeadlessCommerce} */
  headless;
  /** @type {RedirectionTrigger} */
  redirectionTrigger;
  /** @type {Function} */
  unsubscribeRedirectionTrigger;

  connectedCallback() {
    registerComponentForInit(this, this.engineId);
  }

  renderedCallback() {
    initializeWithHeadless(this, this.engineId, this.initialize);
  }

  disconnectedCallback() {
    this.unsubscribeRedirectionTrigger?.();
  }

  /**
   * @param {CommerceEngine} engine
   */
  initialize = (engine) => {
    this.engine = engine;
    this.headless = getHeadlessBundle(this.engineId);

    this.redirectionTrigger = this.headless.buildRedirectionTrigger(
      this.engine
    );

    this.unsubscribeRedirectionTrigger = this.redirectionTrigger.subscribe(() =>
      this.updateState()
    );
  };

  updateState() {
    const state = this.redirectionTrigger?.state;

    // Redirect to URL when provided in redirection trigger state.
    if (state?.redirectTo) {
      window.location.replace(state.redirectTo);
    }
  }
}
