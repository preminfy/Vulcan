Package.describe({
  name: 'vulcan:i18n-fr-fr',
  summary: 'Vulcan i18n package (fr_FR)',
  version: '1.13.5',
  git: 'https://github.com/VulcanJS/Vulcan.git',
});

Package.onUse(function (api) {
  api.versionsFrom('1.6.1');

  api.use(['vulcan:core@=1.13.5']);

  api.addFiles(['lib/fr_FR.js'], ['client', 'server']);
});
