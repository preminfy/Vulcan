Package.describe({
  name: 'vulcan:core',
  summary: 'Vulcan core package',
  version: '1.13.5',
  git: 'https://github.com/VulcanJS/Vulcan.git',
});

Package.onUse(function (api) {
  api.versionsFrom('1.6.1');

  api.use([
    'vulcan:lib@=1.13.5',
    'vulcan:i18n@=1.13.5',
    'vulcan:users@=1.13.5',
    'vulcan:debug@=1.13.5',
  ]);

  api.imply(['vulcan:lib@=1.13.5']);

  api.mainModule('lib/server/main.js', 'server');
  api.mainModule('lib/client/main.js', 'client');
});

Package.onTest(function (api) {
  api.use(['ecmascript', 'meteortesting:mocha', 'vulcan:core', 'vulcan:test', 'vulcan:users']);
  api.mainModule('./test/server/index.js', ['server']);
  api.mainModule('./test/client/index.js', ['client']);
});
