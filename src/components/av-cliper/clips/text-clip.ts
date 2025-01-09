import { useTrackStoreWithOut } from "@/store/modules/track";
import { TextConfig } from "@/types/track";
import { IClip } from "@webav/av-cliper";
export class TextClip implements IClip {
  #cvsEl;
  #ctx;
  #callback: (width: number, height: number) => void;

  ready;

  #textConfig: TextConfig;

  get textConfig() {
    return this.#textConfig;
  }

  set textConfig(config) {
    this.#textConfig = config;
  }

  #meta: {
    width: number;
    height: number;
    duration: number;
  } = {
    width: 0,
    height: 0,
    duration: Infinity,
  };

  get meta() {
    return this.#meta;
  }

  set meta(meta) {
    this.#meta = meta;
  }

  constructor(
    textConfig: TextConfig,
    callback: (width: number, height: number) => void
  ) {
    this.#cvsEl = document.createElement("canvas");
    this.#textConfig = textConfig;
    this.#callback = callback;

    this.#ctx = this.#cvsEl.getContext("2d")!;
    const contentList = this.#textConfig.content.split("\n");
    const { xPadding, yPadding } = this.#calcPadding();
    this.#cvsEl.width = this.#getLineWidth(contentList) + xPadding * 2;
    this.#cvsEl.height = this.#getLineHeight(contentList) + yPadding * 2;
    this.ready = Promise.resolve({
      width: this.#cvsEl.width,
      height: this.#cvsEl.height,
      // 单位 微秒
      duration: Infinity,
    });
    this.#ctx.font = `${this.#textConfig.fontSize}px ${
      this.#textConfig.fontFamily
    }`;
  }

  async tick(time: number): Promise<{
    video?: VideoFrame;
    state: "success" | "done";
  }> {
    // 根据字体大小、行高、字间距、边框宽度、阴影宽度计算整体宽高
    const contentList = this.#textConfig.content.split("\n");
    const { xPadding, yPadding } = this.#calcPadding();
    const maxLineWidth = this.#getLineWidth(contentList);
    const maxLineHeight = this.#getLineHeight(contentList);
    this.#cvsEl.width = maxLineWidth + xPadding * 2;
    this.#cvsEl.height = maxLineHeight + yPadding * 2;
    this.#meta.width = this.#cvsEl.width;
    this.#meta.height = this.#cvsEl.height;
    this.#callback(maxLineWidth + xPadding * 2, maxLineHeight + yPadding * 2);
    this.#ctx.clearRect(0, 0, this.#cvsEl.width, this.#cvsEl.height);
    this.#ctx.fillStyle = this.#textConfig.color;
    this.#ctx.font = `${this.#textConfig.bold ? "bold" : ""} ${
      this.#textConfig.italic ? "italic" : ""
    } ${this.#textConfig.fontSize}px ${this.#textConfig.fontFamily}`;

    this.#ctx.textBaseline = "hanging";
    if (this.#textConfig.showShadow) {
      this.#ctx.shadowColor = this.#textConfig.shadowColor;
      this.#ctx.shadowBlur = this.#textConfig.shadowBlur;
      this.#ctx.shadowOffsetX = this.#textConfig.shadowOffsetX;
      this.#ctx.shadowOffsetY = this.#textConfig.shadowOffsetY;
    }
    let x = 0;
    let y = 0;

    for (let i = 0; i < contentList.length; i++) {
      // 根据对齐模式设置横向起始位置
      let lineWidth = this.#textConfig.fontSize * contentList[i].length + this.#textConfig.letterSpacing * (contentList[i].length - 1);
      switch (this.#textConfig.align) {
        case "left":
          x = 0;
          break;
        case "center":
          x = (this.#cvsEl.width - lineWidth) / 2;
          break;
        case "right":
          x = this.#cvsEl.width - lineWidth;
          break;
      }

      for (let j = 0; j < contentList[i].length; j++) {
        if (this.#textConfig.showStroke) {
          this.#ctx.lineJoin = "round";
          this.#ctx.strokeStyle = this.#textConfig.strokeColor;
          this.#ctx.lineWidth = this.#textConfig.strokeWidth;
          this.#ctx.strokeText(
            contentList[i][j],
            x +
              j * this.#textConfig.fontSize +
              this.#textConfig.letterSpacing * j,
            i * this.#textConfig.fontSize + this.#textConfig.lineSpacing * i + y
          );
        }
        this.#ctx.fillText(
          contentList[i][j],
          j * this.#textConfig.fontSize +
            this.#textConfig.letterSpacing * j +
            x,
          i * this.#textConfig.fontSize + this.#textConfig.lineSpacing * i + y
        );
      }
    }

    return {
      state: "success",
      video: new VideoFrame(this.#cvsEl, {
        timestamp: time,
      }),
    };
  }

  #calcPadding() {
    // 根据边框宽度、阴影宽度计算整padding
    let xPadding = 0;
    let yPadding = 0;
    const textConfig = this.#textConfig;
    xPadding = Math.max(
      textConfig.showStroke ? textConfig.strokeWidth : 0,
      textConfig.showShadow
        ? Math.max(textConfig.shadowBlur, textConfig.shadowOffsetX)
        : 0
    );
    yPadding = Math.max(
      textConfig.showStroke ? textConfig.strokeWidth : 0,
      textConfig.showShadow
        ? Math.max(textConfig.shadowBlur, textConfig.shadowOffsetY)
        : 0
    );
    return {
      xPadding,
      yPadding,
    };
  }

  #getLineWidth(contentList: string[]) {
    return Math.max(
      ...contentList.map((line) => {
        return (
          this.#textConfig.fontSize * line.length +
          this.#textConfig.letterSpacing * (line.length - 1)
        );
      })
    );
  }

  #getLineHeight(contentList: string[]) {
    return (
      this.#textConfig.fontSize * contentList.length +
      this.#textConfig.lineSpacing * (contentList.length - 1)
    );
  }

  async generateImage() {
    const {video} = await this.tick(0);
    const offscreenCanvas = new OffscreenCanvas(video.codedWidth, video.codedHeight);
    const ctx = offscreenCanvas.getContext("2d");
    ctx.drawImage(video, 0, 0, video.codedWidth, video.codedHeight);
    const blob = await offscreenCanvas.convertToBlob();
    // 下载图片
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "text.png";
    a.click();
  }

  async clone() {
    return new TextClip(this.#textConfig, this.#callback) as this;
  }

  destroy() {
    this.#cvsEl.remove();
  }
}
