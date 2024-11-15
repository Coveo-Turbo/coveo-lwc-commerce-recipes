const {promisify} = require('util');
const ncp = promisify(require('ncp'));
const mkdir = promisify(require('fs').mkdir);

const copy = async (source, dest) => {
  try {
    return await ncp(source, dest);
  } catch (e) {
    console.log(`Failed to copy: ${source}\nDoes the resource exist?`);
    process.exit(1);
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
    './force-app/main/default/staticresources/coveoheadless/commerce',
    {recursive: true}
  );
  await mkdir(
    './force-app/main/default/staticresources/coveoheadless/definitions/',
    {recursive: true}
  );

  //TODO: Remove this once the commerce bundle is available in the quantic folder
  await copy(
    './quantic/commerce/headless.js',
    './force-app/main/default/staticresources/coveoheadless/commerce/headless.js'
  );
  await copy(
    './node_modules/@coveo/headless/dist/definitions',
    './force-app/main/default/staticresources/coveoheadless/definitions'
  );

  console.info('Headless copied.');
};

const copyBueno = async () => {
  console.info('Begin copy Bueno.');

  await mkdir('./force-app/main/default/staticresources/coveobueno/browser', {
    recursive: true,
  });
  await mkdir(
    './force-app/main/default/staticresources/coveobueno/definitions',
    {
      recursive: true,
    }
  );
  await copy(
    './node_modules/@coveo/bueno/dist/browser/bueno.js',
    './force-app/main/default/staticresources/coveobueno/browser/bueno.js'
  );
  await copy(
    './node_modules/@coveo/bueno/dist/definitions',
    './force-app/main/default/staticresources/coveobueno/definitions'
  );

  console.info('Bueno copied.');
};

main().then(() => {
  console.info('Copy done!');
});
