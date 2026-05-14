/* eslint-disable no-import-assign */
jest.mock('c/commerceSearchBoxStyle', () => () => '', {virtual: true});

import CommerceStandaloneSearchBox from 'c/commerceStandaloneSearchBox';
// @ts-ignore
import {createElement} from 'lwc';
import * as mockHeadlessLoader from 'c/commerceHeadlessLoader';
import {CurrentPageReference} from 'lightning/navigation';
import getHeadlessConfiguration from '@salesforce/apex/CommerceController.getHeadlessConfiguration';

const nonStandaloneURL = 'https://www.example.com/global-search/%40uri';
const defaultHeadlessConfiguration = JSON.stringify({
  organization: 'testOrgId',
  accessToken: 'testAccessToken',
});

jest.mock('c/commerceHeadlessLoader');

jest.mock(
  '@salesforce/apex/CommerceController.getHeadlessConfiguration',
  () => ({
    default: jest.fn(),
  }),
  {virtual: true}
);

mockHeadlessLoader.loadDependencies = () =>
  new Promise((resolve) => {
    resolve();
  });

let isInitialized = false;

const exampleEngine = {
  id: 'engineId',
};

const functionsMocks = {
  buildStandaloneSearchBox: jest.fn(() => ({
    state: {},
    subscribe: functionsMocks.subscribe,
  })),
  loadQuerySuggestActions: jest.fn(() => ({})),
  subscribe: jest.fn((cb) => {
    cb();
    return functionsMocks.unsubscribe;
  }),
  unsubscribe: jest.fn(() => {}),
};

const defaultOptions = {
  engineId: exampleEngine.id,
  placeholder: null,
  withoutSubmitButton: false,
  numberOfSuggestions: 7,
  textarea: false,
  disableRecentQueries: false,
  keepFiltersOnSearch: false,
  redirectUrl: '/global-search/%40uri',
};

function createTestComponent(options = defaultOptions) {
  prepareHeadlessState();
  const element = createElement('c-commerce-standalone-search-box', {
    is: CommerceStandaloneSearchBox,
  });
  for (const [key, value] of Object.entries(options)) {
    element[key] = value;
  }
  document.body.appendChild(element);
  return element;
}

function prepareHeadlessState() {
  // @ts-ignore
  mockHeadlessLoader.getHeadlessBundle = () => {
    return {
      buildStandaloneSearchBox: functionsMocks.buildStandaloneSearchBox,
      loadQuerySuggestActions: functionsMocks.loadQuerySuggestActions,
    };
  };
}

// Helper function to wait until the microtask queue is empty.
function flushPromises() {
  // eslint-disable-next-line @lwc/lwc/no-async-operation
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function mockSuccessfulHeadlessInitialization() {
  // @ts-ignore
  mockHeadlessLoader.initializeWithHeadless = (element, _, initialize) => {
    if (element instanceof CommerceStandaloneSearchBox && !isInitialized) {
      isInitialized = true;
      initialize(exampleEngine);
    }
  };
}

function cleanup() {
  // The jsdom instance is shared across test cases in a single file so reset the DOM
  while (document.body.firstChild) {
    document.body.removeChild(document.body.firstChild);
  }
  jest.clearAllMocks();
  isInitialized = false;
}

describe('c-commerce-standalone-search-box', () => {
  beforeEach(() => {
    getHeadlessConfiguration.mockResolvedValue(defaultHeadlessConfiguration);
    mockSuccessfulHeadlessInitialization();
  });

  afterEach(() => {
    cleanup();
  });

  describe('controller initialization', () => {
    it('should subscribe to the headless state changes', async () => {
      createTestComponent();
      await flushPromises();

      expect(functionsMocks.subscribe).toHaveBeenCalledTimes(1);
    });

    describe('when the current page reference changes', () => {
      beforeAll(() => {
        // This is needed to mock the window.location.href property to test the keepFiltersOnSearch property in the commerceSearchBox.
        // https://stackoverflow.com/questions/54021037/how-to-mock-window-location-href-with-jest-vuejs
        Object.defineProperty(window, 'location', {
          writable: true,
          value: {href: nonStandaloneURL},
        });
      });

      it('should properly pass the keepFiltersOnSearch property to the commerceSearchBox', async () => {
        const element = createTestComponent({
          ...defaultOptions,
          keepFiltersOnSearch: false,
          disableProductSuggestions: true,
        });
        // eslint-disable-next-line @lwc/lwc/no-unexpected-wire-adapter-usages
        CurrentPageReference.emit({url: nonStandaloneURL});
        await flushPromises();

        const searchBox = element.shadowRoot.querySelector(
          'c-commerce-search-box'
        );

        expect(searchBox).not.toBeNull();
        expect(searchBox.keepFiltersOnSearch).toEqual(false);
        expect(searchBox.disableProductSuggestions).toEqual(true);
      });
    });

    describe('when keepFiltersOnSearch is false (default)', () => {
      it('should properly initialize the controller with clear filters enabled', async () => {
        createTestComponent();
        await flushPromises();

        expect(functionsMocks.buildStandaloneSearchBox).toHaveBeenCalledTimes(
          1
        );
        expect(functionsMocks.buildStandaloneSearchBox).toHaveBeenCalledWith(
          exampleEngine,
          expect.objectContaining({
            options: expect.objectContaining({clearFilters: true}),
          })
        );
      });
    });

    describe('when keepFiltersOnSearch is true', () => {
      it('should properly initialize the controller with clear filters disabled', async () => {
        createTestComponent({
          ...defaultOptions,
          keepFiltersOnSearch: true,
        });
        await flushPromises();

        expect(functionsMocks.buildStandaloneSearchBox).toHaveBeenCalledTimes(
          1
        );
        expect(functionsMocks.buildStandaloneSearchBox).toHaveBeenCalledWith(
          exampleEngine,
          expect.objectContaining({
            options: expect.objectContaining({clearFilters: false}),
          })
        );
      });
    });
  });

  describe('when product suggestions are disabled', () => {
    it('should ignore suggested query change events without throwing', async () => {
      const element = createTestComponent({
        ...defaultOptions,
        disableProductSuggestions: true,
      });
      await flushPromises();

      expect(() =>
        element.dispatchEvent(
          new CustomEvent('commerce__suggestedquerychange', {
            detail: {rawValue: 'example search'},
            bubbles: true,
            composed: true,
          })
        )
      ).not.toThrow();
    });
  });
});
