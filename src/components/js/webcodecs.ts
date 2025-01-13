import { MP4Clip, ImgClip, AudioClip } from "@webav/av-cliper";
import { calculateVolume } from "@/utils/webcodecs";
import { Media } from "@/db/db";
import { file } from "opfs-tools";

/**
 * 获取关键帧画面
 * @param val 素材结构
 */
export const getKeyframes = async (
  val: Media
): Promise<{
  type: string;
  data: { url: string; timestamp: number }[] | Blob;
}> => {
  return new Promise(async (resolve) => {
    if (val.type === "image") {
      const resp = await file(val.path);
      const clip = new ImgClip(await resp.stream());
      let readyRes = await clip.ready;
      if (readyRes) {
        const { video } = await clip.tick(0);
        if (video instanceof ImageBitmap) {
          // 获取图片的blob
          const canvas = new OffscreenCanvas(video.width, video.height);
          const ctx = canvas.getContext("2d");
          ctx.drawImage(video, 0, 0, video.width, video.height);
          const blob = await canvas.convertToBlob();
          resolve({ type: "image", data: blob });
        }
      }
    } else if (val.type === "video") {
      const resp = await file(val.path);
      const clip = new MP4Clip(resp);
      let readyRes = await clip.ready;
      if (readyRes) {
        let t = performance.now();
        clip.thumbnails().then((resThumb) => {
          let list: { url: string; timestamp: number }[] = [];
          resThumb.forEach((item) => {
            list.push({
              url: URL.createObjectURL(item.img),
              timestamp: item.ts,
            });
          });
          console.log("get video frame", (performance.now() - t) / 1000 + "s");
          resolve({ type: "video", data: list });
        });
      }
    }
  });
};

/**
 * 获取音量数据
 * @param val 素材结构
 */
export const getVolume = async (
  val: Media
): Promise<{ type: string; data: Array<number> }> => {
  return new Promise(async (resolve, reject) => {
    const resp = await file(val.path);
    const audioClip = new AudioClip(await resp.stream());
    await audioClip.ready;
    let at = performance.now();
    let audioDone = false;
    let time = 0; // 获取音频时间
    let volumeAverages = [];
    while (!audioDone) {
      const { audio, state } = await audioClip.tick(time);
      if (state === "done") {
        audioDone = true;
        continue;
      }
      time += 33333;
      if (audio.length === 0 || audio[0]?.length === 0) {
        volumeAverages.push(0);
        continue;
      } else {
        // 取F32Array的最大值
        const volume = calculateVolume(audio[0]);
        volumeAverages.push(volume);
      }
    }
    resolve({ type: "audio", data: volumeAverages });
  });
};
