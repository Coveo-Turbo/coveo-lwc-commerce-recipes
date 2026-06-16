import { createElement } from "lwc";
import CommerceSpotlightContent from "c/commerceSpotlightContent";

jest.mock("c/commerceHeadlessLoader", () => ({
  getHeadlessEnginePromise: jest.fn().mockResolvedValue({}),
  getHeadlessBundle: jest.fn().mockReturnValue({}),
  registerComponentForInit: jest.fn(),
  initializeWithHeadless: jest.fn(),
  getHeadlessBindings: jest.fn().mockReturnValue({}),
  getBueno: jest.fn().mockReturnValue(new Promise(() => {})),
  loadDependencies: jest.fn().mockResolvedValue({}),
  setInitializedCallback: jest.fn(),
  setEngineOptions: jest.fn(),
  setComponentInitialized: jest.fn(),
  destroyEngine: jest.fn(),
  registerToStore: jest.fn(),
  getFromStore: jest.fn(),
  registerSortOptionsToStore: jest.fn(),
  getAllSortOptionsFromStore: jest.fn(),
  getAllFacetsFromStore: jest.fn(),
  isHeadlessBundle: jest.fn(),
  HeadlessBundleNames: {}
}));

const mockResult = {
  clickUri: "https://example.com/spotlight-target",
  name: "Featured Spotlight Item",
  nameFontColor: "#FF5733",
  description: "This is a premium spotlight banner item.",
  descriptionFontColor: "#333333",
  desktopImage: "https://example.com/banner.jpg",
  altText: "A high-end spotlight banner showing off new arrival products"
};

describe("c-commerce-spotlight-content", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    jest.clearAllMocks();
  });

  it("renders without errors and correctly sets markup properties when result prop is provided", async () => {
    const element = createElement("c-commerce-spotlight-content", {
      is: CommerceSpotlightContent
    });
    element.result = mockResult;

    document.body.appendChild(element);
    await Promise.resolve();

    const linkElement = element.shadowRoot.querySelector(".content__link");
    const nameElement = element.shadowRoot.querySelector(".content__name");
    const descriptionElement = element.shadowRoot.querySelector(
      ".content__description"
    );
    const srElement = element.shadowRoot.querySelector(".content__sr");

    expect(linkElement).toBeTruthy();
    expect(linkElement.getAttribute("href")).toBe(mockResult.clickUri);
    expect(linkElement.style.backgroundImage).toBe(
      `url(${mockResult.desktopImage})`
    );

    expect(nameElement.textContent).toBe(mockResult.name);
    expect(nameElement.style.color).toBe("rgb(255, 87, 51)");

    expect(descriptionElement.textContent).toBe(mockResult.description);
    expect(descriptionElement.style.color).toBe("rgb(51, 51, 51)");

    expect(srElement.getAttribute("aria-label")).toBe(mockResult.altText);
  });

  it("falls back to default safe values when missing optional fields in result prop", async () => {
    const element = createElement("c-commerce-spotlight-content", {
      is: CommerceSpotlightContent
    });
    element.result = {
      clickUri: "https://example.com/fallback",
      desktopImage: "https://example.com/fallback.jpg"
    };

    document.body.appendChild(element);
    await Promise.resolve();

    const nameElement = element.shadowRoot.querySelector(".content__name");
    const descriptionElement = element.shadowRoot.querySelector(
      ".content__description"
    );

    expect(nameElement.textContent).toBe("");
    expect(nameElement.style.color).toBe("inherit");

    expect(descriptionElement.textContent).toBe("");
    expect(descriptionElement.style.color).toBe("inherit");

  it("calls interactiveSpotlightContent.select on click interaction", async () => {
    const mockSelect = jest.fn();
    const mockInteractiveSpotlightContent = jest
      .fn()
      .mockReturnValue({ select: mockSelect });

    const element = createElement("c-commerce-spotlight-content", {
      is: CommerceSpotlightContent
    });
    element.result = mockResult;
    element.interactiveSpotlightContent = mockInteractiveSpotlightContent;
    document.body.appendChild(element);
    await Promise.resolve();

    const linkElement = element.shadowRoot.querySelector(".content__link");
    expect(linkElement).toBeTruthy();

    linkElement.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true })
    );

    expect(mockInteractiveSpotlightContent).toHaveBeenCalledWith({
      options: {
        spotlightContent: expect.objectContaining({
          name: "Featured Spotlight Item",
          clickUri: "https://example.com/spotlight-target"
        })
      }
    });
    expect(mockSelect).toHaveBeenCalledTimes(1);
  });

  it("calls interactiveSpotlightContent.select on contextmenu (right-click) interaction", async () => {
    const mockSelect = jest.fn();
    const mockInteractiveSpotlightContent = jest
      .fn()
      .mockReturnValue({ select: mockSelect });

    const element = createElement("c-commerce-spotlight-content", {
      is: CommerceSpotlightContent
    });
    element.result = mockResult;
    element.interactiveSpotlightContent = mockInteractiveSpotlightContent;
    document.body.appendChild(element);
    await Promise.resolve();

    const linkElement = element.shadowRoot.querySelector(".content__link");
    expect(linkElement).toBeTruthy();

    linkElement.dispatchEvent(
      new MouseEvent("contextmenu", { bubbles: true, cancelable: true })
    );

    expect(mockInteractiveSpotlightContent).toHaveBeenCalledTimes(1);
    expect(mockSelect).toHaveBeenCalledTimes(1);
  });

  it("does not throw errors when interactiveSpotlightContent is not populated on link interaction", async () => {
    const element = createElement("c-commerce-spotlight-content", {
      is: CommerceSpotlightContent
    });
    element.result = mockResult;
    document.body.appendChild(element);
    await Promise.resolve();

    const linkElement = element.shadowRoot.querySelector(".content__link");
    expect(linkElement).toBeTruthy();

    expect(() => {
      linkElement.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true })
      );
    }).not.toThrow();
  });
});
