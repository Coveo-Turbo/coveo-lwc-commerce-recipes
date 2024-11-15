import {
  InsightEngine,
  SearchEngine,
  RecommendationEngine,
  CommerceEngine,
} from '@coveo/headless';
import {LightningElement} from 'lwc';
import * as BuenoTypes from './force-app/main/default/staticresources/coveobueno/definitions/index';
import {CoreEngine} from './force-app/main/default/staticresources/coveoheadless/definitions/app/engine';
import {ExternalEngineOptions} from './force-app/main/default/staticresources/coveoheadless/definitions/app/engine-configuration';
import * as HeadlessCaseAssistTypes from './force-app/main/default/staticresources/coveoheadless/definitions/case-assist.index';
import * as HeadlessTypes from './force-app/main/default/staticresources/coveoheadless/definitions/index';
import * as HeadlessInsightTypes from './force-app/main/default/staticresources/coveoheadless/definitions/insight.index';
import * as HeadlessRecommendationTypes from './force-app/main/default/staticresources/coveoheadless/definitions/recommendation.index';
import * as HeadlessCommerceTypes from './force-app/main/default/staticresources/coveoheadless/definitions/commerce.index';

export * from './force-app/main/default/staticresources/coveoheadless/definitions/index';
export * from './force-app/main/default/staticresources/coveoheadless/definitions/case-assist.index';
export * from './force-app/main/default/staticresources/coveoheadless/definitions/insight.index';
export * from './force-app/main/default/staticresources/coveoheadless/definitions/recommendation.index';
export * from './force-app/main/default/staticresources/coveoheadless/definitions/commerce.index';
export * from './force-app/main/default/staticresources/coveobueno/definitions/index';

interface Bindings {
  interfaceElement?: any;
  engine?:
    | HeadlessTypes<CoreEngine>
    | HeadlessCaseAssistTypes<CoreEngine>
    | HeadlessInsightTypes<CoreEngine>
    | HeadlessRecommendationTypes<CoreEngine>
    | HeadlessCommerceTypes<CoreEngine>;
  store?: Record<String, unknown>;
}

declare global {
  const Bueno: typeof BuenoTypes;
  const CoveoHeadless: typeof HeadlessTypes;
  const CoveoHeadlessCaseAssist: typeof HeadlessCaseAssistTypes;
  const CoveoHeadlessInsight: typeof HeadlessInsightTypes;
  const CoveoHeadlessRecommendation: typeof HeadlessRecommendationTypes;
  const CoveoHeadlessCommerce: typeof HeadlessCommerceTypes;
  type AnyHeadless =
    | CoveoHeadless
    | CoveoHeadlessCaseAssist
    | CoveoHeadlessInsight
    | CoveoHeadlessRecommendation
    | CoveoHeadlessCommerce;

  type AnyEngine = SearchEngine | InsightEngine | RecommendationEngine | CommerceEngine;

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
        bundle: AnyHeadless;
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
