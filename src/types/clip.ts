// 滤镜类型
export type FilterType =
  | 'grayscale'
  | 'sepia'
  | 'invert'
  | 'brightness'
  | 'blur';

// 轨道片段类型
export type TrackClipType = 'video' | 'audio' | 'text' | 'sticker' | 'filter';

// 轨道片段基础接口
export interface BaseTrackClip {
  id: string;
  type: TrackClipType;
  startTime: number;
  duration: number;
  originalDuration: number;
}

// 视频片段
export interface VideoTrackClip extends BaseTrackClip {
  type: 'video';
  url: string;
  thumbnail: Array<{ timestamp: number; url: string }>;
}

// 音频片段
export interface AudioTrackClip extends BaseTrackClip {
  type: 'audio';
  url: string;
  waveform: number[];
}

// 文字片段
export interface TextTrackClip extends BaseTrackClip {
  type: 'text';
  text: string;
  style: {
    fontSize: number;
    color: string;
    backgroundColor?: string;
  };
}

// 贴图片段
export interface StickerTrackClip extends BaseTrackClip {
  type: 'sticker';
  url: string;
  width: number;
  height: number;
  rotation: number;
}

// 滤镜片段
export interface FilterTrackClip extends BaseTrackClip {
  type: 'filter';
  filterType: FilterType;
  intensity: number;
}

// 轨道片段联合类型
export type TrackClip =
  | VideoTrackClip
  | AudioTrackClip
  | TextTrackClip
  | StickerTrackClip
  | FilterTrackClip;

// 轨道
export interface Track {
  id: string;
  clips: TrackClip[];
}
