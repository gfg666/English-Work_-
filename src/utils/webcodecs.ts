/**
 * WebCodecs 工具函数模块
 * 提供音频处理相关的工具函数，包括PCM数据提取、音频生成和音量计算等功能
 */

/**
 * 默认音频配置
 * @constant
 * @type {Object}
 * @property {number} channelCount - 音频通道数，默认为2（立体声）
 * @property {number} sampleRate - 采样率，默认为48000Hz
 */
const DEFAULT_AUDIO_CONF = {
  channelCount: 2,
  sampleRate: 48000,
};

/**
 * 从AudioData对象中提取PCM数据
 * 将音频数据按通道分离并转换为Float32Array格式
 *
 * @param {AudioData} ad - 输入的AudioData对象
 * @returns {Float32Array[]} 返回包含各个通道PCM数据的数组
 */
export function extractPCM4AudioData(ad: AudioData): Float32Array[] {
  return Array(ad.numberOfChannels)
    .fill(0)
    .map((_, idx) => {
      const chanBufSize = ad.allocationSize({ planeIndex: idx });
      const chanBuf = new ArrayBuffer(chanBufSize);
      ad.copyTo(chanBuf, { planeIndex: idx });
      return new Float32Array(chanBuf);
    });
}

/**
 * 生成指定时长的空白音频数据
 * 用于在音频处理过程中填充空白或静音部分
 *
 * @param {number} ts - 时间戳（微秒）
 * @param {number} duration - 持续时间（微秒）
 * @param {number} sampleRate - 采样率（Hz）
 * @returns {AudioData} 返回生成的AudioData对象
 */
export function createAudioPlaceholder(
  ts: number,
  duration: number,
  sampleRate: number
): AudioData {
  // 根据持续时间和采样率计算需要的帧数
  const frameCnt = Math.floor((sampleRate * duration) / 1e6);

  // 创建新的AudioData对象
  return new AudioData({
    timestamp: ts,
    numberOfChannels: DEFAULT_AUDIO_CONF.channelCount,
    numberOfFrames: frameCnt,
    sampleRate: sampleRate,
    format: "f32-planar", // 使用32位浮点数平面格式
    data: new Float32Array(frameCnt * 2), // 创建静音数据（全0）
  });
}

/**
 * 计算音频数据的音量
 * 使用RMS（均方根）方法计算音频片段的音量
 *
 * @param {Float32Array} audioData - 输入的音频数据
 * @returns {number} 返回计算得到的音量值（0-1之间）
 */
export function calculateVolume(audioData: Float32Array): number {
  let sum = 0;

  // 计算所有样本的平方和
  for (let i = 0; i < audioData.length; i++) {
    sum += audioData[i] * audioData[i];
  }

  // 计算均方根值（RMS），这是音量的一种度量
  const rms = Math.sqrt(sum / audioData.length);

  // 可以使用20倍的对数来获取分贝值（dB），但这通常不是必要的
  // const volumeInDB = 20 * Math.log10(rms);

  // 返回RMS作为音量大小
  return rms;
}
