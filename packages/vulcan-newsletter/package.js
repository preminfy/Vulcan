Package.describe({
  name: 'vulcan:newsletter',
  summary: 'Vulcan email newsletter package',
  version: '1.13.5',
  git: 'https://github.com/VulcanJS/Vulcan.git',
});

Package.onUse(function (api) {
  api.versionsFrom('1.6.1');

  api.use(['vulcan:core@=1.13.5', 'vulcan:email@=1.13.5']);

  api.mainModule('lib/server/main.js', 'server');
  api.mainModule('lib/client/main.js', 'client');
});
