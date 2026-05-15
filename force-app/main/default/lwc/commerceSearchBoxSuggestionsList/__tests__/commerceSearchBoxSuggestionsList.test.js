import {createElement} from 'lwc';
import CommerceSearchBoxSuggestionsList from 'c/commerceSearchBoxSuggestionsList';

const defaultOptions = {
  suggestions: [
    {key: 1, value: 'wind', rawValue: 'wind'},
    {key: 2, value: 'winter long', rawValue: 'winter long'},
  ],
  recentQueries: [],
  productSuggestions: [],
  productBindings: undefined,
  query: 'wi',
};

function createTestComponent(options = defaultOptions) {
  const element = createElement('c-commerce-search-box-suggestions-list', {
    is: CommerceSearchBoxSuggestionsList,
  });

  for (const [key, value] of Object.entries(options)) {
    element[key] = value;
  }

  document.body.appendChild(element);
  return element;
}

function flushPromises() {
  // eslint-disable-next-line @lwc/lwc/no-async-operation
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function cleanup() {
  while (document.body.firstChild) {
    document.body.removeChild(document.body.firstChild);
  }
  jest.clearAllMocks();
}

describe('c-commerce-search-box-suggestions-list', () => {
  afterEach(() => {
    cleanup();
  });

  it('uses the full width for query suggestions when there are no product suggestions', async () => {
    const element = createTestComponent();
    await flushPromises();

    const suggestionList = element.shadowRoot.querySelector(
      '[data-cy="suggestion-list"]'
    );
    const productSuggestionList = element.shadowRoot.querySelector(
      '[data-cy="product-suggestion-list"]'
    );

    expect(suggestionList).not.toBeNull();
    expect(suggestionList.parentElement.className).toContain('slds-size_1-of-1');
    expect(suggestionList.parentElement.className).not.toContain(
      'slds-medium-size_1-of-2'
    );
    expect(productSuggestionList).toBeNull();
  });

});
