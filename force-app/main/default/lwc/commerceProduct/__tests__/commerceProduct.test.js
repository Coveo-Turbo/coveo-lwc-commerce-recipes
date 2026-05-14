import { createElement } from 'lwc';
import CommerceProduct from 'c/commerceProduct';

jest.mock('c/commerceHeadlessLoader', () => ({
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
    HeadlessBundleNames: {},
}));

jest.mock('@salesforce/label/c.commerce_NavigateToRecord', () => ({ default: 'Navigate to Record' }), { virtual: true });
jest.mock('@salesforce/label/c.commerce_OpensInBrowserTab', () => ({ default: 'Opens in Browser Tab' }), { virtual: true });

const mockProduct = {
    permanentid: 'product-1',
    ec_name: 'Test Product',
    ec_thumbnails: ['https://example.com/image.jpg'],
    clickUri: 'https://example.com/product',
    children: [],
    additionalFields: {},
};

describe('c-commerce-product', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    it('renders without errors when product prop is set', async () => {
        const mockSelect = jest.fn();
        const mockInteractiveProduct = jest.fn().mockReturnValue({ select: mockSelect });

        const element = createElement('c-commerce-product', {
            is: CommerceProduct,
        });
        element.product = mockProduct;
        element.interactiveProduct = mockInteractiveProduct;
        document.body.appendChild(element);

        await Promise.resolve();

        expect(element).toBeTruthy();
    });

    it('calls interactiveProduct.select on right-click (contextmenu) on the product image', async () => {
        const mockSelect = jest.fn();
        const mockInteractiveProduct = jest.fn().mockReturnValue({ select: mockSelect });

        const element = createElement('c-commerce-product', {
            is: CommerceProduct,
        });
        element.product = mockProduct;
        element.interactiveProduct = mockInteractiveProduct;
        document.body.appendChild(element);

        await Promise.resolve();

        const img = element.shadowRoot.querySelector('img');
        expect(img).toBeTruthy();

        img.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));

        expect(mockInteractiveProduct).toHaveBeenCalledWith({
            options: {
                product: expect.objectContaining({ permanentid: 'product-1' }),
            },
        });
        expect(mockSelect).toHaveBeenCalledTimes(1);
    });

    it('does not throw when interactiveProduct is not set on right-click', async () => {
        const element = createElement('c-commerce-product', {
            is: CommerceProduct,
        });
        element.product = mockProduct;
        document.body.appendChild(element);

        await Promise.resolve();

        const img = element.shadowRoot.querySelector('img');
        expect(img).toBeTruthy();

        expect(() => {
            img.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
        }).not.toThrow();
    });
});