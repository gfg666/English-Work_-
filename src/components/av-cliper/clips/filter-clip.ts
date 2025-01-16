import { IClip } from '@webav/av-cliper';
export class FilterClip implements IClip {
  ready;

  #meta: {
    width: number;
    height: number;
    duration: number;
  } = {
    width: 0,
    height: 0,
    duration: 0,
  };

  get meta() {
    return this.#meta;
  }

  set meta(meta) {
    this.#meta = meta;
  }

  constructor(duration: number) {
    this.ready = Promise.resolve({
      width: 0,
      height: 0,
      // 单位 微秒
      duration: duration,
    });
  }

  async tick(time: number): Promise<{
    video?: VideoFrame;
    state: 'success' | 'done';
  }> {
    return {
      state: 'success',
    };
  }

  async clone() {
    return new FilterClip(this.#meta.duration) as this;
  }

  destroy() {}
}
