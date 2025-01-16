export const throttle = {
  mounted(el, binding) {
    let timeoutId;
    const delay = parseInt(binding.value) || 2000;
    // 获取指令参数，如果没有，则默认为 2000ms
    el.addEventListener('click', () => {
      if (!el.disabled) {
        el.disabled = true;
        clearTimeout(timeoutId); // 清除之前的定时器
        timeoutId = setTimeout(() => {
          el.disabled = false;
        }, delay);
      }
    });
  },
};
