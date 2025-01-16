import { file, write } from 'opfs-tools';
import { OPFSFileWrap } from 'opfs-tools/dist/file';

/**
 * 将文件存储在OPFS中
 * @param file 文件对象
 * @param filePath 文件路径
 * @returns boolean 是否存储成功
 */
export async function saveFile(
  fileObject: File,
  filePath: string
): Promise<boolean> {
  return new Promise(async (resolve, reject) => {
    try {
      let file_bak = file(filePath);
      // Check for file existence and fetch/create if necessary
      let fileExist = await file_bak.exists();
      if (!fileExist) {
        // 将File转换为ReadableStream
        let stream = fileObject.stream();
        await write(filePath, stream);
        resolve(true);
      } else {
        resolve(false);
      }
    } catch (error) {
      console.error(error);
      reject(false);
    }
  });
}

/**
 * 获取OPFS中的文件
 * @param filePath 文件路径
 * @returns 文件对象
 */
export async function getFile(filePath: string): Promise<OPFSFileWrap> {
  return new Promise(async (resolve, reject) => {
    const fileObject = file(filePath);
    resolve(fileObject);
  });
}

/**
 * 删除OPFS中的文件
 * @param filePath 文件路径
 * @returns 删除结果
 */
export async function delFile(filePath: string): Promise<boolean> {
  return new Promise(async (resolve, reject) => {
    try {
      let fileObject = file(filePath);
      let fileExist = await fileObject.exists();
      if (fileExist) {
        await fileObject.remove();
        resolve(true);
      } else {
        resolve(false);
      }
    } catch (error) {
      console.error(error);
      reject(false);
    }
  });
}

/**
 * 获取OPFS对应文件路径
 * @param url 文件的网络地址
 * @returns 文件路径
 */
export async function getFileUrl(url: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      if (!url) reject(null);
      let fileObject = file(url);
      let fileExist = await fileObject.exists();
      if (fileExist) {
        const blob = await fileToBlob(fileObject);
        const blobUrl = URL.createObjectURL(blob);
        resolve(blobUrl);
      }
    } catch (error) {
      console.error(error);
    }
  });
}

export async function streamToBlob(readableStream) {
  const chunks = []; // 用于存储数据块的数组

  // 创建一个阅读器来读取流
  const reader = await readableStream.getReader();

  // pump 方法将递归调用，直到流的数据被完全读取
  const pump = async () => {
    const { done, value } = await reader.read();
    if (done) {
      // 流已经读取完毕，现在 chunks 数组包含所有的数据块
      return new Blob(chunks);
    }
    // 将读取到的数据块添加到数组中
    chunks.push(value);
    return pump(); // 继续读取下一个数据块
  };

  return pump();
}

// File转换为Blob
export async function fileToBlob(file) {
  const stream = await file.stream();
  const chunks = []; // 用于存储数据块的数组

  // 创建一个阅读器来读取流
  const reader = stream.getReader();

  // pump 方法将递归调用，直到流的数据被完全读取
  const pump = async () => {
    const { done, value } = await reader.read();
    if (done) {
      // 流已经读取完毕，现在 chunks 数组包含所有的数据块
      return new Blob(chunks);
    }
    // 将读取到的数据块添加到数组中
    chunks.push(value);
    return pump(); // 继续读取下一个数据块
  };

  return pump();
}

export async function createFileWriter(
  extName = 'mp4'
): Promise<FileSystemWritableFileStream> {
  const fileHandle = await window.showSaveFilePicker({
    suggestedName: `WebAV-export-${Date.now()}.${extName}`,
  });
  return fileHandle.createWritable();
}

// 将dataURL转换为buffer
export function dataURLToBuffer(fileDataURL: string) {
  const base64Data = fileDataURL.split(',')[1];
  const binaryString = window.atob(base64Data);
  const len = binaryString.length;
  const buffer = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    buffer[i] = binaryString.charCodeAt(i);
  }
  return buffer;
}
