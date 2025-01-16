<!--
 * 滤镜属性设置组件
 * 用于显示和设置滤镜的名称和强度
-->
<template>
  <div class="text-white">
    <template v-if="clip">
      <div class="mb-6">
        <div class="text-base font-medium text-white mb-4">滤镜属性</div>
        <!-- 滤镜名称 -->
        <div class="mb-4">
          <div class="text-base text-[#999] mb-1">名称</div>
          <div class="text-base text-white">
            {{ getFilterName(clip.filterType) }}
          </div>
        </div>
        <!-- 滤镜强度 -->
        <div class="mb-4">
          <div class="text-base text-[#999] mb-1">强度</div>
          <el-slider
            v-model="clip.intensity"
            :min="0"
            :max="100"
            :step="1"
            @change="handleIntensityChange"
            class="filter-slider"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { FilterTrackClip, FilterType } from '@/types/track';
import { ref, watch } from 'vue';

const props = defineProps<{
  clip: FilterTrackClip;
}>();

const emit = defineEmits(['update']);

// 处理强度变化
const handleIntensityChange = (value: number) => {
  props.clip.intensity = value;
};

// 获取滤镜名称
const getFilterName = (filterType?: FilterType) => {
  if (!filterType) return '未知滤镜';
  const filterNames: Record<FilterType, string> = {
    grayscale: '灰度',
    invert: '反色',
    brightness: '亮度',
    sepia: '复古',
    blur: '模糊',
  };
  return filterNames[filterType];
};
</script>

<style scoped>
.filter-slider {
  width: 100%;
}

:deep(.el-slider__runway) {
  background-color: #2a2a2a;
}

:deep(.el-slider__bar) {
  background-color: theme('colors.purple.500');
}

:deep(.el-slider__button) {
  border-color: theme('colors.purple.500');
}

:deep(.el-slider__button:hover) {
  transform: scale(1.2);
}
</style>
