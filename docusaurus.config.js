/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  title: 'Momentum Documentation',
  url: 'https://docs.warp.kokodev.cc',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  organizationName: 'TurboWarp',
  projectName: 'docs',
  trailingSlash: false,
  themeConfig: {
    navbar: {
      title: 'Momentum Documentation',
      items: [
        {
          href: '/packager/',
          label: 'Packager',
          position: 'left'
        },
        {
          href: '/development/',
          label: 'Development',
          position: 'left'
        },
        {
          href: 'https://warp.kokodev.cc',
          label: 'Momentum',
          position: 'right'
        },
        {
          href: 'https://github.com/Momentum-Scratch',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    algolia: {
      // This is all supposed to be public
      appId: 'HORQ9E5CCA',
      apiKey: 'c3873ce4208edb896a31bb3e7c2cbdad',
      indexName: 'turbowarp'
    },
    colorMode: {
      respectPrefersColorScheme: true,
    },
    prism: {
      theme: require('./code-themes/light'),
      darkTheme: require('./code-themes/dark'),
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          routeBasePath: '/',
          breadcrumbs: false,
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
};
