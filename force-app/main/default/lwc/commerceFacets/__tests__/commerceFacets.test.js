import CommerceFacets from 'c/commerceFacets';

jest.mock('c/commerceFacetStyles', () => () => '', {virtual: true});

const regularFacet = {
  state: {
    facetId: 'brand',
    field: 'ec_brand',
    type: 'regular',
  },
};

const summaryState = {
  isLoading: false,
  hasError: false,
  firstRequestExecuted: true,
  hasProducts: true,
};

function createComponentLike() {
  return {
    engineId: 'example-engine',
    facetGenerator: {
      state: {},
      facets: [regularFacet],
    },
    summary: {
      state: summaryState,
    },
    generatedFacets: [],
    summaryState: undefined,
    facetGeneratorState: undefined,
    showPlaceholder: true,
    shouldCollapseFacet: CommerceFacets.prototype.shouldCollapseFacet,
    isRegularFacet: CommerceFacets.prototype.isRegularFacet,
    isNumericFacet: CommerceFacets.prototype.isNumericFacet,
    isDateFacet: CommerceFacets.prototype.isDateFacet,
    isHierarchicalFacet: CommerceFacets.prototype.isHierarchicalFacet,
    collapseFacetsAfter: 4,
  };
}

describe('c-commerce-facets', () => {
  it('returns generated facets after state updates even when facet generator state is not an array', () => {
    const component = createComponentLike();

    CommerceFacets.prototype.updateState.call(component);
    const facets = Object.getOwnPropertyDescriptor(
      CommerceFacets.prototype,
      'facets'
    ).get.call(component);

    expect(component.generatedFacets).toEqual([regularFacet]);
    expect(component.showPlaceholder).toBe(false);
    expect(facets).toEqual([
      expect.objectContaining({
        key: regularFacet.state.facetId,
        field: regularFacet.state.field,
        isRegularFacet: true,
      }),
    ]);
  });
});
