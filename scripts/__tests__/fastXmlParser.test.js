const fs = require('fs');
const os = require('os');
const path = require('path');
const {createRequire} = require('module');

const pluginRequire = createRequire(
  require.resolve('@lwc/eslint-plugin-lwc/package.json')
);
const {XMLBuilder, XMLParser} = pluginRequire('fast-xml-parser');
const processor = require('@lwc/eslint-plugin-lwc/lib/processors/ssr');

describe('LWC metadata parser security override', () => {
  let directory;

  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lwc-xml-parser-'));
  });

  afterEach(() => {
    fs.rmSync(directory, {recursive: true, force: true});
  });

  it.each([
    ['lightning__ServerRenderable', true],
    ['lightning__ServerRenderableWithHydration', true],
    ['unrelated', false],
  ])('preserves SSR detection for %s', (capability, isSSR) => {
    fs.writeFileSync(
      path.join(directory, 'example.js-meta.xml'),
      `<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
        <capabilities><capability>${capability}</capability></capabilities>
      </LightningComponentBundle>`
    );
    const source = 'export default class Example {}';
    const result = processor.preprocess(
      source,
      path.join(directory, 'example.js')
    );
    expect(result).toHaveLength(isSSR ? 2 : 1);
    expect(result[0]).toBe(source);
    if (isSSR) {
      expect(result[1]).toEqual({
        text: source,
        filename: 'example.ssrjs',
      });
    }
  });

  it('prevents CDATA content from creating XML elements', () => {
    const options = {cdataPropName: '__cdata'};
    const value = ']]><injected>unsafe</injected><![CDATA[';
    const xml = new XMLBuilder(options).build({root: {__cdata: value}});
    const parsed = new XMLParser(options).parse(xml);
    expect(parsed.root.injected).toBeUndefined();
    expect(parsed.root.__cdata.join('')).toBe(value);
  });

  it('prevents comment content from creating XML elements', () => {
    const options = {commentPropName: '__comment'};
    const xml = new XMLBuilder(options).build({
      root: {__comment: '--><injected>unsafe</injected><!--'},
    });
    expect(new XMLParser().parse(xml)).toEqual({root: ''});
  });
});
