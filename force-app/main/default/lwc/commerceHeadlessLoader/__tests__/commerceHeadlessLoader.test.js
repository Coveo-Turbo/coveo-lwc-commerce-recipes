/* eslint-disable no-unused-vars */
// @ts-nocheck
import {Deferred} from '../../commerceUtils/commerceUtils';
import {
  setInitializedCallback,
  setEngineOptions,
  registerComponentForInit,
  setComponentInitialized,
  getHeadlessEnginePromise,
  initializeWithHeadless,
  destroyEngine,
  registerToStore,
  getFromStore,
  registerSortOptionsToStore,
  getAllSortOptionsFromStore,
} from '../commerceHeadlessLoader';

jest.mock('lightning/alert');

describe('c-commerce-headless-loader', () => {
    afterEach(() => {
        // The jsdom instance is shared across test cases in a single file so reset the DOM
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });
});