// db.ts
/**
 * 数据库配置模块
 * 使用Dexie作为IndexedDB的封装，实现本地数据持久化存储
 */

import { Track } from '@/types/track';
import Dexie, { type EntityTable } from 'dexie';

/**
 * 媒体资源接口定义
 * 用于存储视频、音频、图片等媒体文件的元数据
 *
 * @interface Media
 * @property {string} [id] - 媒体资源唯一标识符
 * @property {string} name - 媒体资源名称
 * @property {number} [size] - 媒体文件大小（字节）
 * @property {string} type - 媒体类型，可选值：'video'|'audio'|'image'|'text'|'sticker'
 * @property {boolean} [isAnimateImg] - 是否为动态图片
 * @property {string} [path] - 媒体文件路径
 * @property {number} [duration] - 媒体时长（毫秒）
 * @property {number} [createTime] - 创建时间戳
 * @property {number} [updateTime] - 更新时间戳
 */
interface Media {
  id?: string;
  name: string;
  size?: number;
  type: 'video' | 'audio' | 'image' | 'text' | 'sticker';
  isAnimateImg?: boolean;
  path?: string;
  duration?: number;
  createTime?: number;
  updateTime?: number;
}

/**
 * 项目接口定义
 * 用于存储剪辑项目的相关信息
 *
 * @interface Project
 * @property {string} [id] - 项目唯一标识符
 * @property {string} name - 项目名称
 * @property {number} [createTime] - 创建时间戳
 * @property {number} [updateTime] - 更新时间戳
 * @property {Track[]} tracks - 项目包含的轨道数组
 * @property {string} [thumbnail] - 项目缩略图
 */
interface Project {
  id?: string;
  name: string;
  createTime?: number;
  updateTime?: number;
  tracks: Track[];
  thumbnail?: string;
}

/**
 * 历史记录接口定义
 * 用于实现项目编辑的撤销/重做功能
 *
 * @interface History
 * @property {number} [id] - 历史记录唯一标识符
 * @property {number} projectId - 关联的项目ID
 * @property {Track[]} tracks - 当前历史节点的轨道状态
 * @property {number} index - 历史记录索引
 * @property {number} timestamp - 历史记录时间戳
 */
interface History {
  id?: number;
  projectId: number;
  tracks: Track[];
  index: number;
  timestamp: number;
}

/**
 * 数据库实例
 * 扩展Dexie类型，添加具体的表定义
 */
const db = new Dexie('ClipDatabase') as Dexie & {
  medias: EntityTable<Media, 'id'>; // 媒体资源表
  projects: EntityTable<Project, 'id'>; // 项目表
  history: EntityTable<History, 'id'>; // 历史记录表
};

/**
 * 数据库架构定义
 * 版本1：创建基础表结构
 */
db.version(1).stores({
  medias: '++id, name, size, path, createTime, updateTime', // primary key "id" (for the runtime!)
  projects: '++id, name, createTime, updateTime', // primary key "id" (for the runtime!)
  history: '++id, projectId, index, timestamp',
});

export type { Media, Project };
export { db };
