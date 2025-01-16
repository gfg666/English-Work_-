import { isClient } from '@vueuse/core';
import { camelize } from '@vue/shared';

import type { CSSProperties } from 'vue';

export const hasClass = (el: Element, cls: string): boolean => {
  if (!el || !cls) return false;
  if (cls.includes(' ')) throw new Error('className should not contain space.');
  return el.classList.contains(cls);
};

export const getStyle = (
  element: HTMLElement,
  styleName: keyof CSSProperties
): string => {
  if (!isClient || !element || !styleName) return '';

  let key = camelize(styleName);
  if (key === 'float') key = 'cssFloat';
  try {
    const style = (element.style as any)[key];
    if (style) return style;
    const computed: any = document.defaultView?.getComputedStyle(element, '');
    return computed ? computed[key] : '';
  } catch {
    return (element.style as any)[key];
  }
};

// 获取当前rem值
export const getRemSize = () => {
  // 获取根元素（<html>）
  const html = document.documentElement;
  // 获取根元素的计算样式
  const style = window.getComputedStyle(html);
  // 获取font-size值
  const fontSize = parseFloat(style.fontSize);
  return fontSize;
};
