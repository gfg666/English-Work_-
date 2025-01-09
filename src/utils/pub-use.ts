/**
 * 公共工具函数模块
 * 包含项目中常用的工具函数，如资源路径获取、ID生成、尺寸计算等
 */

import { TextClip } from "@/components/av-cliper/clips/text-clip";
import { TextConfig } from "@/types/track";

/**
 * 获取图片静态资源的完整URL
 * @param url - 图片资源的相对路径
 * @returns 图片资源的完整URL
 */
export const getAssetsFile = (url: string) => {
  return new URL(`../assets/image/${url}`, import.meta.url).href;
};

/**
 * 获取字体文件的完整URL
 * @param url - 字体文件的相对路径
 * @returns 字体文件的完整URL
 */
export const getFontsFile = (url: string) => {
  return new URL(`../assets/fonts/${url}`, import.meta.url).href;
};

/**
 * 判断值是否有效（非空、非NaN、非undefined）
 * @param v - 需要判断的值
 * @returns 布尔值，表示值是否有效
 */
export function isDef(v: any): boolean {
  return v !== undefined && v !== null && !Number.isNaN(v);
}

/**
 * 生成唯一标识符
 * 用于为组件生成唯一的ID，格式为：prefix-xxxxx-xxx-xxxx
 * @param prefix - ID前缀，默认为't'
 * @returns 生成的唯一ID字符串
 */
export function getId(prefix = "t"): string {
  return `${prefix ? `${prefix}-` : ""}${getRandom(5)}${getRandom(
    3
  )}-${getRandom(4)}`;
}

/**
 * 生成指定长度的16进制随机字符串
 * @param len - 需要生成的字符串长度
 * @returns 生成的随机字符串
 * @private
 */
function getRandom(len: number): string {
  return Math.floor((1 + Math.random()) * 16 ** len)
    .toString(16)
    .substring(1);
}

/**
 * 计算图像旋转后的尺寸
 * @param width - 原始宽度
 * @param height - 原始高度
 * @param angleInDegrees - 旋转角度（度）
 * @returns 包含旋转后宽高的对象
 */
export function calcRotatedSize(
  width: number,
  height: number,
  angleInDegrees: number
): { width: number; height: number } {
  const angleInRadians = (angleInDegrees * Math.PI) / 180;
  const sourceWidth = width;
  const sourceHeight = height;

  // 计算旋转后的宽度
  const rotatedWidth =
    Math.abs(sourceWidth * Math.cos(angleInRadians)) +
    Math.abs(sourceHeight * Math.sin(angleInRadians));

  // 计算旋转后的高度
  const rotatedHeight =
    Math.abs(sourceWidth * Math.sin(angleInRadians)) +
    Math.abs(sourceHeight * Math.cos(angleInRadians));

  return { width: rotatedWidth, height: rotatedHeight };
}

/**
 * 根据文字配置生成文字图片
 * @param textConfig - 文字配置对象
 * @returns Promise<void>
 */
export async function generateTextImage(textConfig: TextConfig) {
  const clip = new TextClip(textConfig, () => {});
  await clip.generateImage();
}
