<!--
 * 滤镜库组件
 * 提供各种视频滤镜效果，支持拖拽添加到轨道
-->
<template>
  <div class="p-4">
    <div class="grid grid-cols-2 gap-4">
      <div
        v-for="filter in filterList"
        :key="filter.type"
        class="relative group cursor-pointer bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg p-4 flex flex-col items-center"
        @click="handleAddFilter(filter)"
        draggable="true"
        @dragstart="handleDragStart($event, filter)"
      >
        <div class="preview-box h-8 mb-2">
          <img
            :src="previewImage"
            class="h-full object-contain"
            :style="getFilterStyle(filter.type)"
          />
        </div>
        <div class="text-[#666] text-sm">{{ filter.name }}</div>
        <!-- 悬停时显示的添加按钮 -->
        <div
          class="absolute inset-0 bg-purple-500/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg"
        >
          <el-icon class="text-white text-2xl">
            <Plus />
          </el-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { v4 } from 'uuid';
import { useTrackStore } from '@/store/modules/track';
import type { FilterType, FilterTrackClip, TrackClip } from '@/types/track';
import { Plus } from '@element-plus/icons-vue';

const trackStore = useTrackStore();
// 预览图片
const previewImage = '/preview.jpg';

const addClip = inject('addClip') as
  | ((clip: TrackClip, createNewTrack?: boolean) => void)
  | undefined;

// 滤镜列表
const filterList = [
  { type: 'grayscale' as FilterType, name: '黑白' },
  { type: 'sepia' as FilterType, name: '复古' },
  { type: 'invert' as FilterType, name: '反色' },
  { type: 'brightness' as FilterType, name: '明亮' },
  { type: 'blur' as FilterType, name: '模糊' },
];

// 获取滤镜样式
const getFilterStyle = (type: FilterType) => {
  switch (type) {
    case 'grayscale':
      return { filter: 'grayscale(100%)' };
    case 'sepia':
      return { filter: 'sepia(100%)' };
    case 'invert':
      return { filter: 'invert(100%)' };
    case 'brightness':
      return { filter: 'brightness(150%)' };
    case 'blur':
      return { filter: 'blur(2px)' };
    default:
      return {};
  }
};

// 处理拖拽开始
const handleDragStart = (
  event: DragEvent,
  filter: { type: FilterType; name: string }
) => {
  if (!event.dataTransfer) return;

  // 创建新的滤镜片段
  const newClip: FilterTrackClip = {
    id: v4(),
    type: 'filter',
    filterType: filter.type,
    name: filter.name,
    intensity: 100,
    duration: 5,
    startTime: 0,
    endTime: 5,
    originalDuration: 5,
  };

  // 设置拖拽数据
  event.dataTransfer.setData('application/json', JSON.stringify(newClip));
  trackStore.setDragData(newClip);
  event.dataTransfer.effectAllowed = 'copy';
};

// 处理添加滤镜
const handleAddFilter = (filter: { type: FilterType; name: string }) => {
  // 创建新的滤镜片段
  const newClip: FilterTrackClip = {
    id: v4(),
    type: 'filter',
    filterType: filter.type,
    name: filter.name,
    intensity: 100,
    duration: 5,
    startTime: 0,
    endTime: 5,
    originalDuration: 5,
  };

  addClip?.(newClip, true);
};
</script>

<style scoped>
.preview-box {
  overflow: hidden;
}

.preview-box img {
  transition: filter 0.3s ease;
}
</style>
