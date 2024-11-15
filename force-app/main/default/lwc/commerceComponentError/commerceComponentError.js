import componentError from '@salesforce/label/c.commerce_ComponentError';
import LookAtDeveloperConsole from '@salesforce/label/c.commerce_LookAtDeveloperConsole';
import {I18nUtils} from 'c/commerceUtils';
import {LightningElement, api} from 'lwc';

/**
 * The `CommerceComponentError` is used by the other Commerce components to display component error messages.
 * @category Internal
 * @example
 * <c-commerce-component-error component-name={name}></c-commerce-component-error>
 */
export default class CommerceComponentError extends LightningElement {
  labels = {
    componentError,
    LookAtDeveloperConsole,
  };

  /**
   * The name of the component.
   * @api
   * @type {string}
   */
  @api componentName;
  /**
   * The error message to display.
   * @api
   * @type {string}
   * @defaultValue `'Look at the developer console for more information.'`
   */
  @api message = this.labels.LookAtDeveloperConsole;

  get errorTitle() {
    return `${I18nUtils.format(
      this.labels.componentError,
      this.componentName
    )}`;
  }

  get errorMessage() {
    return this.message;
  }
}
