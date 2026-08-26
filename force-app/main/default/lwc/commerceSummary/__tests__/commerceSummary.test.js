/* eslint-disable no-import-assign */
import { createElement } from "lwc";
import CommerceSummary from "c/commerceSummary";
import * as mockHeadlessLoader from "c/commerceHeadlessLoader";

jest.mock("c/commerceHeadlessLoader");
jest.mock(
  "@salesforce/label/c.commerce_NoResults",
  () => ({ default: "No Results" }),
  { virtual: true }
);
jest.mock(
  "@salesforce/label/c.commerce_NoResultsFor",
  () => ({ default: "No Results for {{0}}" }),
  { virtual: true }
);
jest.mock(
  "@salesforce/label/c.commerce_ShowingResultsOf",
  () => ({ default: "Result {{0}} of {{1}}" }),
  { virtual: true }
);
jest.mock(
  "@salesforce/label/c.commerce_ShowingResultsOf_plural",
  () => ({ default: "Results {{0}} of {{1}}" }),
  { virtual: true }
);
jest.mock(
  "@salesforce/label/c.commerce_ShowingResultsOf_zero",
  () => ({ default: "No results" }),
  { virtual: true }
);
jest.mock(
  "@salesforce/label/c.commerce_ShowingResultsOfWithQuery",
  () => ({ default: "Result {{0}} of {{1}} for {{2}}" }),
  { virtual: true }
);
jest.mock(
  "@salesforce/label/c.commerce_ShowingResultsOfWithQuery_plural",
  () => ({ default: "Results {{0}} of {{1}} for {{2}}" }),
  { virtual: true }
);
jest.mock(
  "@salesforce/label/c.commerce_ShowingResultsOfWithQuery_zero",
  () => ({ default: "No results for {{2}}" }),
  { virtual: true }
);

const exampleEngine = { id: "dummy-engine" };
const buildSearch = jest.fn();
let isInitialized = false;
let mockSummaryState;

function prepareHeadlessState() {
  const summary = {
    subscribe: jest.fn((callback) => {
      callback();
      return jest.fn();
    }),
    get state() {
      return mockSummaryState;
    }
  };
  const search = { summary: jest.fn(() => summary) };
  buildSearch.mockReturnValue(search);

  mockHeadlessLoader.getHeadlessBundle = jest.fn(() => ({ buildSearch }));
  mockHeadlessLoader.getHeadlessBindings = jest.fn(() => ({
    interfaceElement: { type: "search" }
  }));
  mockHeadlessLoader.initializeWithHeadless = (element, _, initialize) => {
    if (element instanceof CommerceSummary && !isInitialized) {
      isInitialized = true;
      initialize(exampleEngine);
    }
  };
}

function createTestComponent() {
  prepareHeadlessState();
  const element = createElement("c-commerce-summary", {
    is: CommerceSummary
  });
  element.engineId = exampleEngine.id;
  element.enableResults = true;
  document.body.appendChild(element);
  return element;
}

function flushPromises() {
  // eslint-disable-next-line @lwc/lwc/no-async-operation
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe("c-commerce-summary", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    jest.clearAllMocks();
    isInitialized = false;
  });

  it("renders the zero-count label when Spotlight results contain no products", async () => {
    mockSummaryState = {
      hasProducts: true,
      firstProduct: 0,
      lastProduct: 0,
      totalNumberOfProducts: 0,
      query: ""
    };

    const element = createTestComponent();
    await flushPromises();

    expect(buildSearch).toHaveBeenCalledWith(exampleEngine, {
      enableResults: true
    });
    expect(
      element.shadowRoot.querySelector("lightning-formatted-rich-text").value
    ).toBe("No results");
  });

  it("renders the queried zero-count label without throwing", async () => {
    mockSummaryState = {
      hasProducts: true,
      firstProduct: 0,
      lastProduct: 0,
      totalNumberOfProducts: 0,
      query: "shirts & shoes"
    };

    const element = createTestComponent();
    await flushPromises();

    expect(
      element.shadowRoot.querySelector("lightning-formatted-rich-text").value
    ).toBe('No results for <b class="summary__query">shirts &amp; shoes</b>');
  });
});
