import dayjs from 'dayjs';

/**
 * 转换时间至指定格式
 * @param date Date | string | number 需要转换的日期值
 * @param format string 转换对应的格式字符串 'YYYY-MM-DD HH:mm:ss'
 * @returns string
 */
export function formatDate(date: Date | string, format: string = 'YYYY-MM-DD HH:mm:ss') {
  if (!date || Number(date) === 0) return '';
  return dayjs(date).format(format);
}

/**
 * 将时间格式化为 "00:05" 形式
 * @param seconds 秒数
 * @returns 
 */
export function formatSeconds(seconds, format = 'mm:ss') {
  if (Number.isNaN(seconds)) {
    return ''
  } else {
    return dayjs(seconds * 1000).format(format) || '';
  }
}

/**
 * 转换静态资源路径
 * @param img string 需要转换的静态资源路径
 * @returns string
 */
export function getAssetsFile(img: string) {
  return new URL(`../assets/${img}`, import.meta.url).href
}

