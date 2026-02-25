# AGENTS.md

## Purpose
- This repository packages a Salesforce LWC Commerce component library built on Coveo Headless Commerce.
- It contains reusable internal LWC bundles under `force-app/main/default/lwc` and example site composition under `force-app/examples/main`.
- It is intended for unlocked-package distribution and scratch-org development.

## Stack And Runtime
- Salesforce DX project (`sfdx-project.json`) with package directories:
  - `force-app/main` (default package source)
  - `force-app/examples` (sample Experience Cloud site + demo LWC)
- LWC + Apex on Salesforce platform.
- Node versions: `^20.9.0 || ^22.11.0` (from `package.json`).
- Key JS dependencies:
  - `@coveo/headless` `^3.11.0`
  - `@coveo/bueno` `1.0.5`

## High-Level Architecture
- Apex config endpoint:
  - `CommerceController.getHeadlessConfiguration()` returns serialized engine config JSON.
  - Default provider is `SampleCommerceTokenProvider` (demo values and demo cart context).
  - Interface contract is `ICommerceTokenProvider`.
- Headless bootstrap:
  - `c/commerceHeadlessLoader` loads static resources (`coveoheadlesscommerce`, `coveobuenocommerce`) and manages engine lifecycle.
  - Engine and component registry is stored in `window.coveoHeadless[engineId]`.
- Interface components:
  - `c/commerceInterface` initializes search or listing engines and triggers first request.
  - `c/commerceRecommendationInterface` initializes recommendation engines.
- Feature components (facets, product list, pager, sort, search boxes, recommendations) register with `registerComponentForInit` and initialize through `initializeWithHeadless`.
- Shared helpers live in `c/commerceUtils` (debounce, i18n formatting, local storage helpers, focus helpers, store, product helpers, etc.).

## Repository Map
- `force-app/main/default/lwc`
  - Core commerce bundles (38 bundles, most non-exposed/internal).
  - Internal shared style modules:
    - `commerceFacetStyles`
    - `commerceSearchBoxStyle`
  - Publicly exposed main bundle:
    - `commerceStandaloneSearchBox`
- `force-app/main/default/classes`
  - `CommerceController.cls`
  - `SampleCommerceTokenProvider.cls`
  - `ICommerceTokenProvider.cls`
  - + Apex tests
- `force-app/main/default/staticresources`
  - `coveoheadlesscommerce` (copied Headless bundle + definitions)
  - `coveobuenocommerce` (copied Bueno bundle + definitions)
- `force-app/examples/main/lwc`
  - Exposed sample pages/layout components (`exampleCommerceSearch`, `exampleCommerceListing`, `exampleCommerceHome`, `exampleCommerceCart`, `customThemeLayout`).
- `force-app/examples/main/digitalExperiences/site/Commerce_Examples1`
  - Experience Cloud metadata wiring sample pages/routes to example components.

## Core Event Contracts
- Search box ecosystem relies on custom events with `commerce__*` names:
  - `commerce__inputvaluechange`
  - `commerce__submitsearch`
  - `commerce__showsuggestions`
  - `commerce__selectsuggestion`
  - `commerce__selection`
  - `commerce__suggestedquerychange`
  - `commerce__suggestionlistrender`
- Template registration events:
  - `registerproducttemplates`
  - `commerce__registerproductsuggestiontemplates`
  - `commerce__registerrecommendationtemplates`

## Development Commands
- Install deps:
  - `npm install`
- Lint:
  - `npm run lint`
- Unit tests:
  - `npm run test:unit`
  - `npm run test:unit:watch`
  - `npm run test:unit:coverage`
- Static resource refresh (required after upgrading Headless/Bueno):
  - `npm run build:staticresources`
- Scratch org and deploy:
  - `npm run scratch:create`
  - `npm run deploy:main`
  - `npm run deploy:examples`
  - `npm run scratch:dev`

## Working Rules For Agents
- Preserve the engine lifecycle pattern:
  - `registerComponentForInit` in `connectedCallback`
  - `initializeWithHeadless` in `renderedCallback`
  - unsubscribe listeners in `disconnectedCallback`
- Keep `engineId` wiring consistent across interface + child components.
- Prefer `getHeadlessBundle(engineId)` over direct global access when bundle-specific behavior matters.
- Do not hand-edit copied static resource artifacts in `force-app/main/default/staticresources/...`; regenerate them with `npm run build:staticresources`.
- When changing labels used in UI text, update `force-app/main/default/labels/CustomLabels.labels-meta.xml`.
- Keep example components aligned with sample site metadata when altering public behavior (`force-app/examples/main/digitalExperiences/...`).

## Test And Quality Reality (Current Baseline)
- Unit tests are not green as-is.
- Running `npm run test:unit` currently surfaces:
  - Legacy `quantic*` imports and event names in several tests.
  - Placeholder generated tests with TODO assertions.
  - Environment/source API warning (`sourceApiVersion` mismatch reported by `sfdx-lwc-jest` in this workspace).
  - A few expectation mismatches and missing mocks around global Headless usage.
- If you touch a component, prioritize updating or replacing stale tests in that component’s `__tests__` folder.

## Safe Change Strategy
- For behavior changes in main bundles:
  - Update component JS/HTML/CSS.
  - Update or add Jest tests in corresponding `__tests__`.
  - Validate interactions with `commerceInterface`/`commerceRecommendationInterface`.
- For recommendation/search template behavior:
  - Check both base component templates and example template registration handlers.
- For token/auth changes:
  - Implement `ICommerceTokenProvider` and switch `CommerceController` to your provider.
  - Do not ship long-lived production credentials in Apex.

## Known Hotspots
- `commerceHeadlessLoader.js`: global registry/lifecycle and dependency loading; regressions here break many components.
- `commerceInterface.js`: first-request behavior, URL sync toggle, standalone search handoff.
- `commerceSearchBox*` + `commerceStandaloneSearchBox*`: multi-controller interactions and custom event choreography.
- `commerceUtils/commerceUtils.js`: broad shared utilities; changes can have wide impact.

