import {
  CommerceEngine
} from '@coveo/headless';
import {LightningElement} from 'lwc';
import * as BuenoTypes from './force-app/main/default/staticresources/coveobueno/definitions/index';
import {CoreEngine} from './force-app/main/default/staticresources/coveoheadless/definitions/app/engine';
import {ExternalEngineOptions} from './force-app/main/default/staticresources/coveoheadless/definitions/app/engine-configuration';
import * as HeadlessCommerceTypes from './force-app/main/default/staticresources/coveoheadless/definitions/commerce.index';

export * from './force-app/main/default/staticresources/coveoheadless/definitions/commerce.index';
export * from './force-app/main/default/staticresources/coveobueno/definitions/index';

interface Bindings {
  interfaceElement?: any;
  engine?: HeadlessCommerceTypes<CoreEngine>;
  store?: Record<String, unknown>;
}

declare global {
  const Bueno: typeof BuenoTypes;
  const CoveoHeadlessCommerce: typeof HeadlessCommerceTypes;

  interface Window {
    coveoHeadless: {
      [engineId: string]: {
        components: {
          element: LightningElement;
          initialized: boolean;
        }[];
        options: Deferred<ExternalEngineOptions>;
        bindings: Bindings;
        enginePromise: Promise;
        engineConstructor?: (options: ExternalEngineOptions) => unknown;
        initializedCallback?: Function;
        bundle: CoveoHeadlessCommerce;
      };
    };
  }
}

class Deferred<T> {
  promise: Promise<T>;
  isResolved: boolean;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
}
