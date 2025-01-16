export type MediaType = 'video' | 'audio' | 'image' | 'text' | 'sticker';

export interface Media {
  id?: string;
  name: string;
  size?: number;
  type: MediaType;
  path?: string;
  duration?: number;
  createTime?: number;
  updateTime?: number;
  content?: string;
  thumbnail?: string | string[];
  rect?: {
    x: number;
    y: number;
    w: number;
    h: number;
    angle: number;
  };
  startTime?: number;
  endTime?: number;
  maxDuration?: number;
  selected?: boolean;
}
