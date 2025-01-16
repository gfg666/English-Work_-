/**
 * 路由配置文件
 * 使用Vue Router管理应用的路由
 */

import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router';

/**
 * 路由配置数组
 * 定义应用的所有路由规则
 */
const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/projects', // 根路径重定向到项目列表页
  },
  {
    path: '/projects',
    component: () => import('@/views/projectList/index.vue'), // 项目列表页面
  },
  {
    path: '/clip/:id',
    component: () => import('@/views/clipPage/index.vue'), // 视频剪辑页面，使用动态路由参数id
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/exception/404.vue'), // 404页面，处理未匹配的路由
  },
];

/**
 * 创建路由实例
 * 使用hash模式的路由历史
 */
const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
