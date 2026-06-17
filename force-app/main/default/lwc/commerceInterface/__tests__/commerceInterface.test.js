import CommerceInterface from "c/commerceInterface";
import { destroyEngine } from "c/commerceHeadlessLoader";

jest.mock("c/commerceHeadlessLoader", () => ({
  getHeadlessBindings: jest.fn(),
  loadDependencies: jest.fn(() => Promise.resolve()),
  setEngineOptions: jest.fn(),
  HeadlessBundleNames: {
    commerce: "commerce"
  },
  destroyEngine: jest.fn(),
  setInitializedCallback: jest.fn()
}));

describe("c-commerce-interface", () => {
  let addEventListenerSpy;
  let removeEventListenerSpy;

  beforeEach(() => {
    addEventListenerSpy = jest.spyOn(window, "addEventListener");
    removeEventListenerSpy = jest.spyOn(window, "removeEventListener");
  });

  afterEach(() => {
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
    jest.clearAllMocks();
    window.location.hash = "";
  });

  it("should initialize the URL manager when state in URL is enabled", () => {
    const subscribe = jest.fn();
    const urlManager = {
      state: {
        fragment: "q=box"
      },
      subscribe
    };
    const urlManagerFactory = jest.fn(() => urlManager);
    const element = {
      disableStateInUrl: false,
      fragment: "q=box",
      onHashChange: jest.fn(),
      searchOrListing: {
        urlManager: urlManagerFactory
      }
    };

    CommerceInterface.prototype.initUrlManager.call(element);

    expect(urlManagerFactory).toHaveBeenCalledWith({
      initialState: { fragment: "q=box" }
    });
    expect(subscribe).toHaveBeenCalledTimes(1);
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "hashchange",
      element.onHashChange
    );
  });

  it("should replace an existing URL manager subscription before reinitializing", () => {
    const previousUnsubscribe = jest.fn();
    const subscribe = jest.fn();
    const urlManager = {
      state: {
        fragment: "q=box"
      },
      subscribe
    };
    const urlManagerFactory = jest.fn(() => urlManager);
    const element = {
      disableStateInUrl: false,
      fragment: "q=box",
      onHashChange: jest.fn(),
      unsubscribeUrlManager: previousUnsubscribe,
      searchOrListing: {
        urlManager: urlManagerFactory
      }
    };

    CommerceInterface.prototype.initUrlManager.call(element);

    expect(previousUnsubscribe).toHaveBeenCalledTimes(1);
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "hashchange",
      element.onHashChange
    );
    expect(urlManagerFactory).toHaveBeenCalledWith({
      initialState: { fragment: "q=box" }
    });
  });

  it("should not initialize the URL manager when state in URL is disabled", () => {
    const urlManagerFactory = jest.fn();
    const element = {
      disableStateInUrl: true,
      fragment: "q=box",
      onHashChange: jest.fn(),
      searchOrListing: {
        urlManager: urlManagerFactory
      }
    };

    CommerceInterface.prototype.initUrlManager.call(element);

    expect(urlManagerFactory).not.toHaveBeenCalled();
    expect(addEventListenerSpy).not.toHaveBeenCalled();
  });

  it("should execute the first search without redirect data on refreshed search pages", () => {
    const executeFirstSearch = jest.fn();
    const element = {
      type: "search",
      skipFirstSearch: false,
      searchOrListing: {
        executeFirstSearch
      }
    };

    CommerceInterface.prototype.executeInitialRequest.call(element, {
      dispatch: jest.fn()
    });

    expect(executeFirstSearch).toHaveBeenCalledTimes(1);
  });

  it("should tear down URL synchronization when disconnected", () => {
    const unsubscribeUrlManager = jest.fn();
    const element = {
      engineId: "search-interface",
      onHashChange: jest.fn(),
      unsubscribeUrlManager
    };

    CommerceInterface.prototype.disconnectedCallback.call(element);

    expect(unsubscribeUrlManager).toHaveBeenCalledTimes(1);
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "hashchange",
      element.onHashChange
    );
    expect(destroyEngine).toHaveBeenCalledWith("search-interface");
  });
});
