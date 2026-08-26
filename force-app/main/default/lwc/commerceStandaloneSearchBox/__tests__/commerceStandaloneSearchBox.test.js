/* eslint-disable no-import-assign */
jest.mock("c/commerceSearchBoxStyle", () => () => "", { virtual: true });

import CommerceStandaloneSearchBox from "c/commerceStandaloneSearchBox";
// @ts-ignore
import { createElement } from "lwc";
import * as mockHeadlessLoader from "c/commerceHeadlessLoader";
import { CurrentPageReference } from "lightning/navigation";
import getHeadlessConfiguration from "@salesforce/apex/CommerceController.getHeadlessConfiguration";

const nonStandaloneURL = "https://www.example.com/global-search/%40uri";
const defaultHeadlessConfiguration = JSON.stringify({
  organization: "testOrgId",
  accessToken: "testAccessToken"
});

jest.mock("c/commerceHeadlessLoader");

jest.mock(
  "@salesforce/apex/CommerceController.getHeadlessConfiguration",
  () => ({
    default: jest.fn()
  }),
  { virtual: true }
);

mockHeadlessLoader.loadDependencies = () =>
  new Promise((resolve) => {
    resolve();
  });

let isInitialized = false;
let currentSubscribeCallback = null;
const originalLocation = window.location;

const mockUnsubscribe = jest.fn();
const mockUpdateQuery = jest.fn(() => ({ type: "updateQuery" }));

const exampleEngine = {
  id: "engineId",
  dispatch: jest.fn()
};

const mockStandaloneSearchBox = {
  state: {},
  subscribe: jest.fn((callback) => {
    currentSubscribeCallback = callback;
    callback();
    return mockUnsubscribe;
  }),
  afterRedirection: jest.fn(() => {
    mockStandaloneSearchBox.state.redirectTo = null;
  }),
  selectSuggestion: jest.fn(),
  showSuggestions: jest.fn(),
  submit: jest.fn(),
  updateText: jest.fn()
};

const functionsMocks = {
  buildStandaloneSearchBox: jest.fn(() => mockStandaloneSearchBox),
  loadQueryActions: jest.fn(() => ({ updateQuery: mockUpdateQuery })),
  loadQuerySuggestActions: jest.fn(() => ({}))
};

const defaultOptions = {
  engineId: exampleEngine.id,
  placeholder: null,
  withoutSubmitButton: false,
  numberOfSuggestions: 7,
  textarea: false,
  disableRecentQueries: false,
  keepFiltersOnSearch: false,
  redirectUrl: "/global-search/%40uri"
};

function createTestComponent(options = defaultOptions) {
  prepareHeadlessState();
  const element = createElement("c-commerce-standalone-search-box", {
    is: CommerceStandaloneSearchBox
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
      loadQueryActions: functionsMocks.loadQueryActions,
      loadQuerySuggestActions: functionsMocks.loadQuerySuggestActions
    };
  };
  mockHeadlessLoader.getHeadlessBindings = () => ({ engine: exampleEngine });
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
  jest.useRealTimers();
  // The jsdom instance is shared across test cases in a single file so reset the DOM
  while (document.body.firstChild) {
    document.body.removeChild(document.body.firstChild);
  }
  jest.clearAllMocks();
  isInitialized = false;
  currentSubscribeCallback = null;
  mockStandaloneSearchBox.state = {};
  window.localStorage.clear();
}

describe("c-commerce-standalone-search-box", () => {
  beforeEach(() => {
    getHeadlessConfiguration.mockResolvedValue(defaultHeadlessConfiguration);
    mockSuccessfulHeadlessInitialization();
    delete window.location;
    window.location = {
      href: "https://www.example.com/",
      replace: jest.fn()
    };
  });

  afterEach(() => {
    cleanup();
    window.location = originalLocation;
  });

  describe("controller initialization", () => {
    it("should subscribe to the headless state changes", async () => {
      createTestComponent();
      await flushPromises();

      expect(mockStandaloneSearchBox.subscribe).toHaveBeenCalledTimes(1);
    });

    describe("when the current page reference changes", () => {
      it("should properly pass the keepFiltersOnSearch property to the commerceSearchBox", async () => {
        window.location.href = nonStandaloneURL;
        const element = createTestComponent({
          ...defaultOptions,
          keepFiltersOnSearch: false,
          disableProductSuggestions: true
        });
        // eslint-disable-next-line @lwc/lwc/no-unexpected-wire-adapter-usages
        CurrentPageReference.emit({ url: nonStandaloneURL });
        await flushPromises();

        const searchBox = element.shadowRoot.querySelector(
          "c-commerce-search-box"
        );

        expect(searchBox).not.toBeNull();
        expect(searchBox.keepFiltersOnSearch).toEqual(false);
        expect(searchBox.disableProductSuggestions).toEqual(true);
      });
    });

    describe("when keepFiltersOnSearch is false (default)", () => {
      it("should properly initialize the controller with clear filters enabled", async () => {
        createTestComponent();
        await flushPromises();

        expect(functionsMocks.buildStandaloneSearchBox).toHaveBeenCalledTimes(
          1
        );
        expect(functionsMocks.buildStandaloneSearchBox).toHaveBeenCalledWith(
          exampleEngine,
          expect.objectContaining({
            options: expect.objectContaining({ clearFilters: true })
          })
        );
      });
    });

    describe("when keepFiltersOnSearch is true", () => {
      it("should properly initialize the controller with clear filters disabled", async () => {
        createTestComponent({
          ...defaultOptions,
          keepFiltersOnSearch: true
        });
        await flushPromises();

        expect(functionsMocks.buildStandaloneSearchBox).toHaveBeenCalledTimes(
          1
        );
        expect(functionsMocks.buildStandaloneSearchBox).toHaveBeenCalledWith(
          exampleEngine,
          expect.objectContaining({
            options: expect.objectContaining({ clearFilters: false })
          })
        );
      });
    });
  });

  describe("redirect handling", () => {
    it("should navigate directly to a redirect trigger target", async () => {
      const redirectTarget = "https://www.example.com/products/screens";
      const element = createTestComponent();
      await flushPromises();
      mockStandaloneSearchBox.state = {
        redirectTo: null,
        suggestions: [],
        value: "Screens"
      };

      element.dispatchEvent(
        new CustomEvent("commerce__submitsearch", {
          bubbles: true,
          composed: true
        })
      );
      mockStandaloneSearchBox.state.redirectTo = redirectTarget;
      currentSubscribeCallback();

      expect(mockStandaloneSearchBox.submit).toHaveBeenCalledTimes(1);
      expect(mockStandaloneSearchBox.afterRedirection).toHaveBeenCalledTimes(1);
      expect(window.location.replace).toHaveBeenCalledWith(redirectTarget);
      expect(
        window.localStorage.getItem("coveo-standalone-search-box")
      ).toBeNull();
      expect(exampleEngine.dispatch).not.toHaveBeenCalled();
    });

    it("should hand the query to the search page for the fallback redirect", async () => {
      const element = createTestComponent();
      await flushPromises();
      const fallbackRedirect =
        functionsMocks.buildStandaloneSearchBox.mock.calls[0][1].options
          .redirectionUrl;
      mockStandaloneSearchBox.state = {
        redirectTo: null,
        suggestions: [],
        value: "blue screens"
      };

      element.dispatchEvent(
        new CustomEvent("commerce__submitsearch", {
          bubbles: true,
          composed: true
        })
      );
      mockStandaloneSearchBox.state.value = "a later query";
      element.dispatchEvent(
        new CustomEvent("commerce__submitsearch", {
          bubbles: true,
          composed: true
        })
      );
      mockStandaloneSearchBox.state.redirectTo = fallbackRedirect;
      currentSubscribeCallback();

      expect(mockStandaloneSearchBox.submit).toHaveBeenCalledTimes(1);
      expect(mockStandaloneSearchBox.afterRedirection).toHaveBeenCalledTimes(1);
      expect(window.location.replace).not.toHaveBeenCalled();
      expect(
        JSON.parse(window.localStorage.getItem("coveo-standalone-search-box"))
      ).toEqual({ value: "blue screens" });
      expect(exampleEngine.dispatch).toHaveBeenCalledTimes(1);
      expect(mockUpdateQuery).toHaveBeenCalledWith({ query: "" });
    });

    it("should fall back to the submitted query when redirect lookup times out", async () => {
      const element = createTestComponent();
      await flushPromises();
      mockStandaloneSearchBox.state = {
        redirectTo: null,
        suggestions: [],
        value: "Screens"
      };
      jest.useFakeTimers();

      element.dispatchEvent(
        new CustomEvent("commerce__submitsearch", {
          bubbles: true,
          composed: true
        })
      );
      jest.runOnlyPendingTimers();

      expect(mockStandaloneSearchBox.afterRedirection).toHaveBeenCalledTimes(1);
      expect(
        JSON.parse(window.localStorage.getItem("coveo-standalone-search-box"))
      ).toEqual({ value: "Screens" });

      mockStandaloneSearchBox.state.value = "a later query";
      element.dispatchEvent(
        new CustomEvent("commerce__submitsearch", {
          bubbles: true,
          composed: true
        })
      );
      mockStandaloneSearchBox.state.redirectTo =
        "https://www.example.com/products/screens";
      currentSubscribeCallback();

      expect(mockStandaloneSearchBox.submit).toHaveBeenCalledTimes(1);
      expect(window.location.replace).not.toHaveBeenCalled();
      jest.useRealTimers();
    });

    it("should process redirects from selected query suggestions", async () => {
      const redirectTarget = "https://www.example.com/products/screens";
      const element = createTestComponent();
      await flushPromises();
      mockStandaloneSearchBox.state = {
        redirectTo: null,
        suggestions: [],
        value: ""
      };

      element.dispatchEvent(
        new CustomEvent("commerce__selectsuggestion", {
          detail: {
            selectedSuggestion: { value: "Screens" }
          },
          bubbles: true,
          composed: true
        })
      );
      mockStandaloneSearchBox.state.redirectTo = redirectTarget;
      currentSubscribeCallback();

      expect(mockStandaloneSearchBox.selectSuggestion).toHaveBeenCalledWith(
        "Screens"
      );
      expect(window.location.replace).toHaveBeenCalledWith(redirectTarget);
    });

    it("should ignore redirect state when no submission is pending", async () => {
      const redirectTarget = "https://www.example.com/products/screens";
      mockStandaloneSearchBox.state = {
        redirectTo: redirectTarget,
        suggestions: [],
        value: "Screens"
      };

      createTestComponent();
      await flushPromises();
      currentSubscribeCallback();

      expect(mockStandaloneSearchBox.afterRedirection).not.toHaveBeenCalled();
      expect(window.location.replace).not.toHaveBeenCalled();
    });

    it("should not submit or redirect an empty query", async () => {
      const element = createTestComponent();
      await flushPromises();
      mockStandaloneSearchBox.state = {
        redirectTo: null,
        suggestions: [],
        value: "   "
      };

      element.dispatchEvent(
        new CustomEvent("commerce__submitsearch", {
          bubbles: true,
          composed: true
        })
      );

      expect(mockStandaloneSearchBox.submit).not.toHaveBeenCalled();
      expect(mockStandaloneSearchBox.afterRedirection).not.toHaveBeenCalled();
      expect(window.location.replace).not.toHaveBeenCalled();
    });
  });

  describe("when product suggestions are disabled", () => {
    it("should ignore suggested query change events without throwing", async () => {
      const element = createTestComponent({
        ...defaultOptions,
        disableProductSuggestions: true
      });
      await flushPromises();

      expect(() =>
        element.dispatchEvent(
          new CustomEvent("commerce__suggestedquerychange", {
            detail: { rawValue: "example search" },
            bubbles: true,
            composed: true
          })
        )
      ).not.toThrow();
    });
  });
});
