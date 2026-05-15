import {createElement} from 'lwc';
import CommerceSearchBoxInput from 'c/commerceSearchBoxInput';

jest.mock('c/commerceSearchBoxStyle', () => () => '', {virtual: true});

const selectors = {
  input: '[data-cy="search-box-input"]',
  submitButton: '[data-cy="search-box-submit-button"]',
};

const flushPromises = () => Promise.resolve();

function createTestComponent() {
  const element = createElement('c-commerce-search-box-input', {
    is: CommerceSearchBoxInput,
  });
  document.body.appendChild(element);
  return element;
}

describe('c-commerce-search-box-input debounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('debounces input value change events', async () => {
    const element = createTestComponent();
    const handler = jest.fn();
    element.addEventListener('commerce__inputvaluechange', handler);
    await flushPromises();

    const input = element.shadowRoot.querySelector(selectors.input);
    input.value = 'c';
    input.dispatchEvent(new CustomEvent('input'));
    input.value = 'co';
    input.dispatchEvent(new CustomEvent('input'));

    expect(handler).not.toHaveBeenCalled();

    jest.advanceTimersByTime(299);
    expect(handler).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: {value: 'co'},
      })
    );
  });

  it('submits latest value immediately and clears pending debounce', async () => {
    const element = createTestComponent();
    const handler = jest.fn();
    element.addEventListener('commerce__inputvaluechange', handler);
    await flushPromises();

    const input = element.shadowRoot.querySelector(selectors.input);
    input.value = 'coveo';
    input.dispatchEvent(new CustomEvent('input'));

    const submitButton = element.shadowRoot.querySelector(selectors.submitButton);
    submitButton.click();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: {value: 'coveo'},
      })
    );

    jest.advanceTimersByTime(300);
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
