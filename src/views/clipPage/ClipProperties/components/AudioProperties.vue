<!--
 * 音频属性设置组件
 * 用于设置音频的音量、去片头片尾等属性
-->
<template>
  <div class="mb-6">
    <div class="text-base font-medium text-white mb-4">音频属性</div>
    <div class="flex gap-3 mb-3">
      <div class="flex-1">
        <div class="text-base text-[#999] mb-1">去片头</div>
        <el-input-number
          class="w-30"
          v-model="clip.sourceStartTime"
          size="small"
          :min="0"
          :step="0.1"
          placeholder="去片头时间"
          @change="(val) => handleDefaultZero(val, 'sourceStartTime')"
        />
      </div>
      <div class="flex-1">
        <div class="text-base text-[#999] mb-1">去片尾</div>
        <el-input-number
          class="w-30"
          v-model="clip.sourceEndTime"
          size="small"
          :min="0"
          :step="0.1"
          placeholder="去片尾时间"
          @change="(val) => handleDefaultZero(val, 'sourceEndTime')"
        />
      </div>
    </div>
    <div class="flex items-center gap-3">
      <div class="flex-1">
        <div class="text-base text-[#999] mb-1">音量</div>
        <div class="flex items-center gap-3">
          <el-slider v-model="clip.volume" :min="0" :max="100" :step="1" />
          <Icon
            v-if="clip.volume === 100"
            icon="material-symbols:volume-up"
            @click="clip.volume = 0"
          />
          <Icon
            v-else-if="clip.volume !== 0"
            icon="material-symbols:volume-down"
            @click="clip.volume = 0"
          />
          <Icon
            v-else
            icon="material-symbols:volume-off"
            @click="clip.volume = 100"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TrackClip } from '@/types/track';
import { Icon } from '@iconify/vue';

const props = defineProps<{
  clip: TrackClip;
}>();

const emit = defineEmits(['update']);

// 处理默认值为0
const handleDefaultZero = (val: number | null, prop: string) => {
  if (!props.clip) return;
  if (val === null || isNaN(val)) {
    props.clip[prop] = 0;
  }
  emit('update', props.clip);
};
</script>

<style scoped>
:deep(.el-slider__runway) {
  background-color: #2a2a2a;
}

:deep(.el-slider__bar) {
  background-color: theme('colors.purple.500');
}

:deep(.el-slider__button) {
  border-color: theme('colors.purple.500');
}
</style>
