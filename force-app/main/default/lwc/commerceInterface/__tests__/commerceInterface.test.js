import CommerceInterface from 'c/commerceInterface';

describe('c-commerce-interface', () => {
    let addEventListenerSpy;

    beforeEach(() => {
        addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    });

    afterEach(() => {
        addEventListenerSpy.mockRestore();
        window.location.hash = '';
    });

    it('should initialize the URL manager when state in URL is enabled', () => {
        const subscribe = jest.fn();
        const urlManager = {
            state: {
                fragment: 'q=box'
            },
            subscribe
        };
        const urlManagerFactory = jest.fn(() => urlManager);
        const element = {
            disableStateInUrl: false,
            fragment: 'q=box',
            onHashChange: jest.fn(),
            searchOrListing: {
                urlManager: urlManagerFactory
            }
        };

        CommerceInterface.prototype.initUrlManager.call(element);

        expect(urlManagerFactory).toHaveBeenCalledWith({
            initialState: {fragment: 'q=box'}
        });
        expect(subscribe).toHaveBeenCalledTimes(1);
        expect(addEventListenerSpy).toHaveBeenCalledWith(
            'hashchange',
            element.onHashChange
        );
    });

    it('should not initialize the URL manager when state in URL is disabled', () => {
        const urlManagerFactory = jest.fn();
        const element = {
            disableStateInUrl: true,
            fragment: 'q=box',
            onHashChange: jest.fn(),
            searchOrListing: {
                urlManager: urlManagerFactory
            }
        };

        CommerceInterface.prototype.initUrlManager.call(element);

        expect(urlManagerFactory).not.toHaveBeenCalled();
        expect(addEventListenerSpy).not.toHaveBeenCalled();
    });
});
