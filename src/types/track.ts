/**
 * 轨道和媒体相关的类型定义
 */

/**
 * 媒体类型枚举
 * 定义了支持的媒体类型：视频、音频、图片、文字和滤镜
 */
export type MediaType = "video" | "audio" | "image" | "text" | "filter";

/**
 * 滤镜类型枚举
 * 定义了支持的滤镜效果类型
 */
export type FilterType =
  | "grayscale"
  | "invert"
  | "brightness"
  | "sepia"
  | "blur";

/**
 * 轨道片段接口
 * 定义了轨道上单个媒体片段的属性
 *
 * @interface TrackClip
 * @property {string} [id] - 片段唯一标识符
 * @property {MediaType} type - 媒体类型
 * @property {boolean} [isAnimateImg] - 是否为动态图片
 * @property {string} name - 片段名称
 * @property {string} [content] - 文字内容（用于文字类型）
 * @property {Array<{url: string, timestamp: number}> | Blob} [thumbnail] - 缩略图数据
 * @property {number[]} [volumeData] - 音频波形数据
 * @property {TextConfig} [textConfig] - 文字配置（用于文字类型）
 * @property {number} [size] - 文件大小（字节）
 * @property {string} [path] - 文件路径
 * @property {number} [x] - X坐标位置
 * @property {number} [y] - Y坐标位置
 * @property {number} [w] - 宽度
 * @property {number} [h] - 高度
 * @property {number} [angle] - 旋转角度
 * @property {number} [opacity] - 不透明度
 * @property {number} [volume] - 音量
 * @property {number} startTime - 开始时间
 * @property {number} duration - 持续时间
 * @property {number} [maxDuration] - 最大可用时长
 * @property {boolean} [selected] - 是否被选中
 * @property {number} endTime - 结束时间
 * @property {number} [sourceStartTime] - 原始素材开始时间
 * @property {number} [sourceEndTime] - 原始素材结束时间
 * @property {number} [originalDuration] - 原始素材时长
 * @property {number} [zIndex] - 层级顺序
 * @property {FilterType} [filterType] - 滤镜类型
 * @property {number} [intensity] - 滤镜强度（0-1）
 */
export interface TrackClip {
  id?: string;
  type: MediaType;
  isAnimateImg?: boolean;
  name: string;
  content?: string;
  thumbnail?: { url: string; timestamp: number }[] | Blob;
  volumeData?: number[];
  textConfig?: TextConfig;
  size?: number;
  path?: string;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  angle?: number;
  opacity?: number;
  volume?: number;
  startTime: number;
  duration: number;
  maxDuration?: number;
  selected?: boolean;
  endTime: number;
  sourceStartTime?: number;
  sourceEndTime?: number;
  originalDuration?: number;
  zIndex?: number;
  filterType?: FilterType;
  intensity?: number;
}

/**
 * 滤镜片段接口
 * 定义了滤镜片段的特有属性
 */
export interface FilterTrackClip extends TrackClip {
  type: "filter";
  filterType: FilterType;
  intensity: number;
}

/**
 * 轨道接口
 * 定义了单个轨道的属性
 *
 * @interface Track
 * @property {string} id - 轨道唯一标识符
 * @property {TrackClip[]} clips - 轨道包含的媒体片段数组
 */
export interface Track {
  id: string;
  clips: TrackClip[];
}

/**
 * 渐变配置接口
 * 定义了文字渐变效果的属性
 *
 * @interface Gradient
 * @property {number} percent - 渐变位置百分比
 * @property {string[]} gradientColor - 渐变颜色数组
 * @property {number[]} gradientPosition - 渐变位置数组
 */
export interface Gradient {
  percent: number;
  gradientColor: string[];
  gradientPosition: number[];
}

/**
 * 文字配置接口
 * 定义了文字媒体的样式属性
 *
 * @interface TextConfig
 * @property {string} content - 文字内容
 * @property {number} fontSize - 字体大小
 * @property {string} fontFamily - 字体族
 * @property {"normal" | "italic" | "oblique"} fontStyle - 字体样式
 * @property {"none" | "underline" | "line-through" | "overline"} textDecoration - 文本装饰
 * @property {number} fontWeight - 字体粗细
 * @property {boolean} bold - 是否加粗
 * @property {boolean} italic - 是否斜体
 * @property {string} color - 文字颜色
 * @property {{angle: number, gradientList: Gradient[]}} [gradient] - 渐变配置
 * @property {string} bgColor - 背景颜色
 * @property {number} opacity - 不透明度
 * @property {number} x - X坐标位置
 * @property {number} y - Y坐标位置
 * @property {number} width - 宽度
 * @property {number} height - 高度
 * @property {number} lineSpacing - 行间距
 * @property {number} letterSpacing - 字间距
 * @property {"left" | "center" | "right"} align - 文本对齐方式
 * @property {string} backgroundColor - 背景颜色
 * @property {number} backgroundOpacity - 背景不透明度
 * @property {string} borderColor - 边框颜色
 * @property {number} borderWidth - 边框宽度
 * @property {number} borderRadius - 边框圆角
 * @property {number} padding - 内边距
 * @property {number} margin - 外边距
 * @property {boolean} showShadow - 是否显示阴影
 * @property {string} shadowColor - 阴影颜色
 * @property {number} shadowBlur - 阴影模糊度
 * @property {number} shadowOffsetX - 阴影X偏移
 * @property {number} shadowOffsetY - 阴影Y偏移
 * @property {number} shadowOpacity - 阴影不透明度
 * @property {boolean} showStroke - 是否显示描边
 * @property {string} strokeColor - 描边颜色
 * @property {number} strokeWidth - 描边宽度
 * @property {number} strokeOpacity - 描边不透明度
 * @property {number[]} strokeDasharray - 描边虚线配置
 * @property {number} strokeDashoffset - 描边虚线偏移
 */
export interface TextConfig {
  content: string;
  fontSize: number;
  fontFamily: string;
  fontStyle: "normal" | "italic" | "oblique";
  textDecoration: "none" | "underline" | "line-through" | "overline";
  fontWeight: number;
  bold: boolean;
  italic: boolean;
  color: string;
  gradient?: {
    angle: number;
    gradientList: Gradient[];
  };
  bgColor: string;
  opacity: number;
  x: number;
  y: number;
  width: number;
  height: number;
  lineSpacing: number;
  letterSpacing: number;
  align: "left" | "center" | "right";
  backgroundColor: string;
  backgroundOpacity: number;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  padding: number;
  margin: number;
  showShadow: boolean;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  shadowOpacity: number;
  showStroke: boolean;
  strokeColor: string;
  strokeWidth: number;
  strokeOpacity: number;
  strokeDasharray: number[];
  strokeDashoffset: number;
}
