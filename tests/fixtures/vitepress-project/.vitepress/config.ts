export default {
  title: "My VitePress Site",
  description: "A VitePress site",
  themeConfig: {
    sidebar: [
      { text: "Guide", items: [
        { text: "Getting Started", link: "/guide/getting-started" },
        { text: "Configuration", link: "/guide/configuration" },
      ]},
      { text: "API", items: [
        { text: "Reference", link: "/api/reference" },
      ]},
    ],
  },
};
