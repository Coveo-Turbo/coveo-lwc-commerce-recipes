/* eslint-disable no-import-assign */
import CommerceSearchBox from 'c/commerceSearchBox';
import {createElement} from 'lwc';
import * as mockHeadlessLoader from 'c/commerceHeadlessLoader';

jest.mock('c/commerceHeadlessLoader');

jest.mock('c/commerceSearchBoxStyle', () => () => '', {virtual: true});

let isInitialized = false;

const exampleEngine = {id: 'dummy-engine'};

const functionsMocks = {
  buildSearchBox: jest.fn(() => ({
    state: {
      value: '',
      suggestions: [],
    },
    subscribe: functionsMocks.subscribe,
  })),
  loadQuerySuggestActions: jest.fn(() => ({})),
  buildInstantProducts: jest.fn(() => ({
    state: {isLoading: false, products: []},
    updateQuery: functionsMocks.updateQuery,
    subscribe: functionsMocks.instantProductsSubscribe,
  })),
  buildProductTemplatesManager: jest.fn(() => ({
    registerTemplates: jest.fn(),
  })),
  subscribe: jest.fn((cb) => {
    cb();
    return functionsMocks.unsubscribe;
  }),
  instantProductsSubscribe: jest.fn((cb) => {
    cb();
    return functionsMocks.unsubscribe;
  }),
  updateQuery: jest.fn(),
  unsubscribe: jest.fn(),
};

const defaultOptions = {
  engineId: exampleEngine.id,
  placeholder: null,
  withoutSubmitButton: false,
  numberOfSuggestions: 7,
  textarea: false,
  disableRecentQueries: false,
  keepFiltersOnSearch: false,
};

function prepareHeadlessState() {
  mockHeadlessLoader.getHeadlessBundle = () => ({
    buildSearchBox: functionsMocks.buildSearchBox,
    loadQuerySuggestActions: functionsMocks.loadQuerySuggestActions,
    buildInstantProducts: functionsMocks.buildInstantProducts,
    buildProductTemplatesManager: functionsMocks.buildProductTemplatesManager,
  });
}

function createTestComponent(options = defaultOptions) {
  prepareHeadlessState();
  const element = createElement('c-commerce-search-box', {
    is: CommerceSearchBox,
  });
  Object.entries(options).forEach(([key, value]) => {
    element[key] = value;
  });
  document.body.appendChild(element);
  return element;
}

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

function mockSuccessfulHeadlessInitialization() {
  mockHeadlessLoader.initializeWithHeadless = (element, _, initialize) => {
    if (element instanceof CommerceSearchBox && !isInitialized) {
      isInitialized = true;
      initialize(exampleEngine);
    }
  };
}

function cleanup() {
  while (document.body.firstChild) {
    document.body.removeChild(document.body.firstChild);
  }
  jest.clearAllMocks();
  isInitialized = false;
}

describe('c-commerce-search-box', () => {
  beforeAll(() => {
    mockSuccessfulHeadlessInitialization();
  });

  afterEach(() => {
    cleanup();
  });

  it('does not update instant product query when suggestions change', async () => {
    const element = createTestComponent({
      ...defaultOptions,
      disableProductSuggestions: false,
    });
    await flushPromises();
    element.dispatchEvent(
      new CustomEvent('commerce__suggestedquerychange', {
        detail: {rawValue: 'query'},
        bubbles: true,
        composed: true,
      })
    );
    await flushPromises();

    expect(functionsMocks.buildInstantProducts).toHaveBeenCalledTimes(1);
    expect(functionsMocks.updateQuery).not.toHaveBeenCalled();
  });
});
