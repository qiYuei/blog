import { defineConfig } from "vitepress";
import path from "node:path";
import { SearchPlugin } from "vitepress-plugin-search";
import { getSideBar } from "./plugins/resolveSidebar";

// https://vitepress.dev/reference/site-config

import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
export default defineConfig({
  outDir: path.resolve(__dirname, "../dist"),
  title: "aymoc写博客的地方",
  description: "博客",
  vite: {
    ssr: {
      noExternal: ["element-plus"],
    },
    plugins: [
      AutoImport({
        resolvers: [ElementPlusResolver()],
      }),
      Components({
        // allow auto load markdown components under `./src/components/`
        extensions: ["vue", "md"],
        // allow auto import and register components used in markdown
        include: [/\.vue$/, /\.vue\?vue/, /\.md$/],
        resolvers: [ElementPlusResolver()],
      }),
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

    // [
    //   {
    //     text: "Examples",
    //     items: [
    //       { text: "Markdown Examples", link: "/markdown-examples" },
    //       { text: "Runtime API Examples", link: "/api-examples" },
    //     ],
    //   },
    // ]
    sidebar: getSideBar(),

    socialLinks: [
      { icon: "github", link: "https://github.com/vuejs/vitepress" },
    ],
    outline: [1, 4],
  },
});
