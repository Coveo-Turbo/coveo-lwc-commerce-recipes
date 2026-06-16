/* eslint-disable no-import-assign */
import { createElement } from 'lwc';
import CommerceProductList from 'c/commerceProductList';
import * as mockHeadlessLoader from 'c/commerceHeadlessLoader';

jest.mock('c/commerceHeadlessLoader');
jest.mock(
    '@salesforce/label/c.commerce_LoadingResults',
    () => ({ default: 'Loading Results' }),
    { virtual: true }
);
jest.mock('c/commerceUtils', () => ({
    AriaLiveRegion: jest.fn(() => ({ dispatchMessage: jest.fn() })),
}));
const exampleEngine = { id: 'dummy-engine' };
let isInitialized = false;

const mockInteractiveProduct = jest.fn();
const mockInteractiveSpotlightContent = jest.fn();

let mockControllerState = {};
let mockSummaryState = {};

function buildMockController() {
    const summary = {
        subscribe: jest.fn((cb) => { cb(); return jest.fn(); }),
        get state() { return mockSummaryState; },
    };
    return {
        subscribe: jest.fn((cb) => { cb(); return jest.fn(); }),
        get state() { return mockControllerState; },
        summary: jest.fn(() => summary),
        interactiveProduct: mockInteractiveProduct,
        interactiveSpotlightContent: mockInteractiveSpotlightContent,
        promoteChildToParent: jest.fn(),
    };
}

function prepareHeadlessState() {
    const mockController = buildMockController();
    const pendingPromise = new Promise(() => {});
    // @ts-ignore
    mockHeadlessLoader.getHeadlessEnginePromise = jest.fn(() => pendingPromise);
    // @ts-ignore
    mockHeadlessLoader.getBueno = jest.fn(() => pendingPromise);
    // @ts-ignore
    mockHeadlessLoader.getHeadlessBundle = () => ({
        buildProductListing: jest.fn(() => mockController),
        buildSearch: jest.fn(() => mockController),
        buildProductTemplatesManager: jest.fn(() => ({ selectTemplate: jest.fn(() => null) })),
    });
    // @ts-ignore
    mockHeadlessLoader.getHeadlessBindings = () => ({
        interfaceElement: { type: 'product-listing' },
    });
}

function mockSuccessfulHeadlessInitialization() {
    // @ts-ignore
    mockHeadlessLoader.initializeWithHeadless = (element, _, initialize) => {
        if (element instanceof CommerceProductList && !isInitialized) {
            isInitialized = true;
            initialize(exampleEngine);
        }
    };
}

function createTestComponent(options = {}) {
    prepareHeadlessState();
    const element = createElement('c-commerce-product-list', {
        is: CommerceProductList,
    });
    element.engineId = exampleEngine.id;
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
    isInitialized = false;
    mockControllerState = {};
    mockSummaryState = {};
}

describe('c-commerce-product-list', () => {
    beforeAll(() => {
        mockSuccessfulHeadlessInitialization();
    });

    afterEach(() => {
        cleanup();
    });

    describe('products getter with enableResults=false (default)', () => {
        it('uses state.products and renders c-commerce-product for each item', async () => {
            mockControllerState = {
                responseId: 'resp-1',
                products: [
                    { permanentid: 'prod-1', resultType: 'product', additionalFields: {}, children: [] },
                    { permanentid: 'prod-2', resultType: 'product', additionalFields: {}, children: [] },
                ],
            };
            mockSummaryState = { isLoading: false, hasError: false, firstRequestExecuted: true, hasProducts: true };

            const element = createTestComponent({ enableResults: false });
            await flushPromises();

            const productComponents = element.shadowRoot.querySelectorAll('c-commerce-product');
            const spotlightComponents = element.shadowRoot.querySelectorAll('c-commerce-spotlight-content');

            expect(productComponents.length).toBe(2);
            expect(spotlightComponents.length).toBe(0);
        });

        it('always sets isResult=false even when resultType is "spotlight"', async () => {
            mockControllerState = {
                responseId: 'resp-2',
                products: [
                    { permanentid: 'prod-1', resultType: 'spotlight', additionalFields: {}, children: [] },
                ],
            };
            mockSummaryState = { isLoading: false, hasError: false, firstRequestExecuted: true, hasProducts: true };

            const element = createTestComponent({ enableResults: false });
            await flushPromises();

            const productComponents = element.shadowRoot.querySelectorAll('c-commerce-product');
            const spotlightComponents = element.shadowRoot.querySelectorAll('c-commerce-spotlight-content');

            expect(productComponents.length).toBe(1);
            expect(spotlightComponents.length).toBe(0);
        });

        it('returns an empty array when state.products is undefined', async () => {
            mockControllerState = { responseId: 'resp-3' };
            mockSummaryState = {};

            const element = createTestComponent({ enableResults: false });
            await flushPromises();

            const productComponents = element.shadowRoot.querySelectorAll('c-commerce-product');
            expect(productComponents.length).toBe(0);
        });
    });

    describe('products getter with enableResults=true', () => {
        it('uses state.results instead of state.products', async () => {
            mockControllerState = {
                responseId: 'resp-4',
                products: [{ permanentid: 'should-be-ignored', resultType: 'product', additionalFields: {}, children: [] }],
                results: [
                    { permanentid: 'res-1', resultType: 'product', additionalFields: {}, children: [] },
                    { permanentid: 'res-2', resultType: 'product', additionalFields: {}, children: [] },
                ],
            };
            mockSummaryState = { isLoading: false, hasError: false, firstRequestExecuted: true, hasProducts: true };

            const element = createTestComponent({ enableResults: true });
            await flushPromises();

            const productComponents = element.shadowRoot.querySelectorAll('c-commerce-product');
            expect(productComponents.length).toBe(2);
        });

        it('renders c-commerce-spotlight-content for items with resultType="spotlight"', async () => {
            mockControllerState = {
                responseId: 'resp-5',
                results: [
                    { permanentid: 'res-1', resultType: 'spotlight', additionalFields: {}, children: [] },
                    { permanentid: 'res-2', resultType: 'product', additionalFields: {}, children: [] },
                ],
            };
            mockSummaryState = { isLoading: false, hasError: false, firstRequestExecuted: true, hasProducts: true };

            const element = createTestComponent({ enableResults: true });
            await flushPromises();

            const spotlightComponents = element.shadowRoot.querySelectorAll('c-commerce-spotlight-content');
            const productComponents = element.shadowRoot.querySelectorAll('c-commerce-product');

            expect(spotlightComponents.length).toBe(1);
            expect(productComponents.length).toBe(1);
        });

        it('renders only c-commerce-product when no results have resultType="spotlight"', async () => {
            mockControllerState = {
                responseId: 'resp-6',
                results: [
                    { permanentid: 'res-1', resultType: 'product', additionalFields: {}, children: [] },
                    { permanentid: 'res-2', resultType: 'product', additionalFields: {}, children: [] },
                ],
            };
            mockSummaryState = { isLoading: false, hasError: false, firstRequestExecuted: true, hasProducts: true };

            const element = createTestComponent({ enableResults: true });
            await flushPromises();

            const spotlightComponents = element.shadowRoot.querySelectorAll('c-commerce-spotlight-content');
            const productComponents = element.shadowRoot.querySelectorAll('c-commerce-product');

            expect(spotlightComponents.length).toBe(0);
            expect(productComponents.length).toBe(2);
        });

        it('returns an empty array when state.results is undefined', async () => {
            mockControllerState = { responseId: 'resp-7' };
            mockSummaryState = {};

            const element = createTestComponent({ enableResults: true });
            await flushPromises();

            const productComponents = element.shadowRoot.querySelectorAll('c-commerce-product');
            expect(productComponents.length).toBe(0);
        });
    });

    describe('interactive props wiring', () => {
        it('sets interactiveProduct from the controller on each product item', async () => {
            mockControllerState = {
                responseId: 'resp-8',
                products: [{ permanentid: 'prod-1', resultType: 'product', additionalFields: {}, children: [] }],
            };
            mockSummaryState = { isLoading: false, hasError: false, firstRequestExecuted: true, hasProducts: true };

            const element = createTestComponent({ enableResults: false });
            await flushPromises();

            const productComponent = element.shadowRoot.querySelector('c-commerce-product');
            expect(productComponent).toBeTruthy();
            expect(productComponent.interactiveProduct).toBe(mockInteractiveProduct);
        });

        it('sets interactiveSpotlightContent from the controller on each spotlight item', async () => {
            mockControllerState = {
                responseId: 'resp-9',
                results: [{ permanentid: 'res-1', resultType: 'spotlight', additionalFields: {}, children: [] }],
            };
            mockSummaryState = { isLoading: false, hasError: false, firstRequestExecuted: true, hasProducts: true };

            const element = createTestComponent({ enableResults: true });
            await flushPromises();

            const spotlightComponent = element.shadowRoot.querySelector('c-commerce-spotlight-content');
            expect(spotlightComponent).toBeTruthy();
            expect(spotlightComponent.interactiveSpotlightContent).toBe(mockInteractiveSpotlightContent);
        });
    });
});