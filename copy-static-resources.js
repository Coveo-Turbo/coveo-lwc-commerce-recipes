const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');
const {promisify} = require('util');
const ncp = promisify(require('ncp'));
const mkdir = promisify(fs.mkdir);
const access = promisify(fs.access);

const copy = async (source, dest) => {
  try {
    return await ncp(source, dest);
  } catch (e) {
    throw new Error(
      `Failed to copy: ${source}\nDoes the resource exist?\n${e.message}`
    );
  }
};

const resolveLibraryPath = (packageName, relativePath) =>
  path.resolve(path.dirname(require.resolve(packageName)), relativePath);

const pathExists = async (source) => {
  try {
    await access(source);
    return true;
  } catch (e) {
    if (e.code === 'ENOENT' || e.code === 'ENOTDIR') {
      return false;
    }
    throw e;
  }
};

const buildBuenoBrowserBundle = async (source, dest) => {
  try {
    await esbuild.build({
      entryPoints: [source],
      outfile: dest,
      bundle: true,
      platform: 'browser',
      format: 'iife',
      globalName: 'Bueno',
      legalComments: 'inline',
      tsconfigRaw: {
        compilerOptions: {},
      },
      define: {
        'process.env.NODE_ENV': JSON.stringify('production'),
      },
    });
  } catch (e) {
    throw new Error(
      `Failed to build Bueno browser bundle from: ${source}\n${e.message}`
    );
  }
};

const main = async () => {
  console.info('Begin copy static resources');
  await copyHeadless();
  await copyBueno();
};

const copyHeadless = async () => {
  console.info('Begin copy Headless.');

  await mkdir(
    './force-app/main/default/staticresources/coveoheadlesscommerce/commerce',
    {recursive: true}
  );
  await mkdir(
    './force-app/main/default/staticresources/coveoheadlesscommerce/definitions/',
    {recursive: true}
  );

  //TODO: Remove this once the commerce bundle is available in the quantic folder
  await copy(
    './node_modules/@coveo/headless/dist/quantic/commerce/headless.js',
    './force-app/main/default/staticresources/coveoheadlesscommerce/commerce/headless.js'
  );
  await copy(
    './node_modules/@coveo/headless/dist/definitions',
    './force-app/main/default/staticresources/coveoheadlesscommerce/definitions'
  );

  console.info('Headless copied.');
};

const copyBueno = async () => {
  console.info('Begin copy Bueno.');
  const browserBundleSource = resolveLibraryPath('@coveo/bueno', '../cdn/bueno.js');
  const esmBundleSource = resolveLibraryPath('@coveo/bueno', './bueno.esm.js');
  const browserBundleDestination =
    './force-app/main/default/staticresources/coveobuenocommerce/browser/bueno.js';

  await mkdir(
    './force-app/main/default/staticresources/coveobuenocommerce/browser',
    {
      recursive: true,
    }
  );
  await mkdir(
    './force-app/main/default/staticresources/coveobuenocommerce/definitions',
    {
      recursive: true,
    }
  );

  if (await pathExists(browserBundleSource)) {
    await copy(browserBundleSource, browserBundleDestination);
  } else {
    await buildBuenoBrowserBundle(esmBundleSource, browserBundleDestination);
  }

  await copy(
    './node_modules/@coveo/bueno/dist/definitions',
    './force-app/main/default/staticresources/coveobuenocommerce/definitions'
  );

  console.info('Bueno copied.');
};

main()
  .then(() => {
    console.info('Copy done!');
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
