import { defineConfig } from "vitepress";
import path from "node:path";
import { SearchPlugin } from "vitepress-plugin-search";
// https://vitepress.dev/reference/site-config

export default defineConfig({
  outDir: path.resolve(__dirname, "../dist"),
  title: "aymoc写博客的地方",
  description: "博客",
  vite: {
    plugins: [
      SearchPlugin({
        previewLength: 62,
        tokenize: "full",
        buttonLabel: "文档搜索",
        placeholder: "请输入关键字...",
      }),
    ],
  },
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "Home", link: "/" },
      { text: "Examples", link: "/markdown-examples" },
    ],

    sidebar: [
      {
        text: "Examples",
        items: [
          { text: "Markdown Examples", link: "/markdown-examples" },
          { text: "Runtime API Examples", link: "/api-examples" },
        ],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/vuejs/vitepress" },
    ],
  },
});
