/* eslint-disable jest/no-conditional-expect */
/* eslint-disable no-import-assign */
import CommerceRedirectionTrigger from "c/commerceRedirectionTrigger";
// @ts-ignore
import { createElement } from "lwc";
import * as mockHeadlessLoader from "c/commerceHeadlessLoader";

jest.mock("c/commerceHeadlessLoader");

let isInitialized = false;
let currentSubscribeCallback = null;
const originalLocation = window.location;

const exampleEngine = {
  id: "exampleEngineId"
};

const mockUnsubscribe = jest.fn(() => {});

const mockRedirectionTrigger = {
  state: {},
  subscribe: jest.fn((callback) => {
    currentSubscribeCallback = callback;
    callback();
    return mockUnsubscribe;
  })
};

const functionsMocks = {
  buildRedirectionTrigger: jest.fn(() => mockRedirectionTrigger),
  unsubscribe: mockUnsubscribe
};

const defaultOptions = {
  engineId: exampleEngine.id
};

function createTestComponent(options = defaultOptions) {
  prepareHeadlessState();

  const element = createElement("c-commerce-redirection-trigger", {
    is: CommerceRedirectionTrigger
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
      buildRedirectionTrigger: functionsMocks.buildRedirectionTrigger
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
    if (element instanceof CommerceRedirectionTrigger && !isInitialized) {
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
  currentSubscribeCallback = null;
  mockRedirectionTrigger.state = {};
}

describe("c-commerce-redirection-trigger", () => {
  beforeEach(() => {
    mockSuccessfulHeadlessInitialization();

    // Stub browser window redirection mechanics safely
    delete window.location;
    window.location = { replace: jest.fn() };
  });

  afterEach(() => {
    cleanup();
    window.location = originalLocation;
  });

  describe("controller initialization", () => {
    it("should register the component for init and subscribe to state changes", async () => {
      createTestComponent();
      await flushPromises();

      expect(mockHeadlessLoader.registerComponentForInit).toHaveBeenCalledTimes(
        1
      );
      expect(functionsMocks.buildRedirectionTrigger).toHaveBeenCalledWith(
        exampleEngine
      );
      expect(mockRedirectionTrigger.subscribe).toHaveBeenCalledTimes(1);
    });
  });

  describe("when redirection state updates", () => {
    it("should not redirect if redirectTo property is absent", async () => {
      mockRedirectionTrigger.state = { redirectTo: undefined };

      createTestComponent();
      await flushPromises();

      // Fire subscriber updates manually to simulate context mutations
      if (currentSubscribeCallback) {
        currentSubscribeCallback();
      }

      expect(window.location.replace).not.toHaveBeenCalled();
    });

    it("should invoke window replacement if redirectTo is provided", async () => {
      const redirectUrl = "https://example.com/target-destination";
      mockRedirectionTrigger.state = { redirectTo: redirectUrl };

      createTestComponent();
      await flushPromises();

      if (currentSubscribeCallback) {
        currentSubscribeCallback();
      }

      expect(window.location.replace).toHaveBeenCalledWith(redirectUrl);
    });
  });

  describe("disconnection handling", () => {
    it("should cleanly unsubscribe when removed from DOM context", async () => {
      const element = createTestComponent();
      await flushPromises();

      document.body.removeChild(element);

      expect(functionsMocks.unsubscribe).toHaveBeenCalledTimes(1);
    });
  });
});
