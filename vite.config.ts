import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import { resolve } from "path";
import { createHtmlPlugin } from "vite-plugin-html";
import Inspector from "unplugin-vue-inspector/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // vueDevTools(),
    vue(),
    AutoImport({
      imports: ["vue", "vue-router"], //自动引入vue的ref、toRefs、onmounted等，无需在页面中再次引入
      dts: "src/auto-import.d.ts", // 生成在src路径下名为auto-import.d.ts的声明文件
    }),
    Inspector(),
    createHtmlPlugin(),
  ],
  resolve: {
    alias: [
      {
        find: "@",
        replacement: resolve(__dirname, "src"),
      },
    ],
  },
  base: "./yifang-clip/", // 打包路径
  server: {
    host: "localhost",
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
    port: 8085,
  },
});
