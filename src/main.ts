/**
 * 项目入口文件
 * 配置Vue应用的全局设置，包括路由、状态管理、UI组件库等
 */

import { createApp } from "vue";
import router from "./router";
import { setupStore } from "@/store";
import ElementPlus from "element-plus";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import zhCn from "element-plus/es/locale/lang/zh-cn";

// ElementPlus 样式导入
import "element-plus/dist/index.css";
import "element-plus/theme-chalk/dark/css-vars.css";

// 全局样式导入
import "./styles/main.scss";
import "./styles/rem.js"; // 自适应rem配置

import App from "./App.vue";

// 全局指令注册
import { throttle } from "@/utils/directive";
import "animate.css";

// 创建Vue应用实例
const Vue = createApp(App);

// 配置Vuex状态管理
setupStore(Vue);

// 注册全局节流指令
Vue.directive("throttle", throttle);

// 注册路由
Vue.use(router);

// 配置ElementPlus，设置中文语言包
Vue.use(ElementPlus, { locale: zhCn });

// 挂载应用
Vue.mount("#app");

// 注册所有ElementPlus图标组件
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  Vue.component(key, component);
}
