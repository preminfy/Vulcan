Package.describe({
  name: 'vulcan:voting',
  summary: 'Vulcan scoring package.',
  version: '1.13.5',
  git: 'https://github.com/VulcanJS/Vulcan.git',
});

Package.onUse(function (api) {
  api.versionsFrom('1.6.1');

  api.use(
    ['fourseven:scss@4.10.0', 'vulcan:core@=1.13.5', 'vulcan:i18n@=1.13.5'],
    ['client', 'server'],
  );

  api.mainModule('lib/server/main.js', 'server');
  api.mainModule('lib/client/main.js', 'client');
});
