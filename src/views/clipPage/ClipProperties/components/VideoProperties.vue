<!--
 * 视频属性设置组件
 * 用于设置视频的位置、旋转、音量、透明度等属性
-->
<template>
  <div class="mb-6">
    <div class="text-base font-medium text-white mb-4">视频属性</div>
    <div class="grid grid-cols-2 gap-3 mb-4">
      <div>
        <div class="text-base text-[#999] mb-1">X 坐标</div>
        <el-input-number
          class="w-30"
          v-model="clip.x"
          size="small"
          placeholder="X"
          :precision="0"
          @change="(val) => handleDefaultZero(val, 'x')"
        />
      </div>
      <div>
        <div class="text-base text-[#999] mb-1">Y 坐标</div>
        <el-input-number
          class="w-30"
          v-model="clip.y"
          size="small"
          placeholder="Y"
          :precision="0"
          @change="(val) => handleDefaultZero(val, 'y')"
        />
      </div>
    </div>
    <!-- 旋转角度 -->
    <div class="mb-4">
      <div class="text-base text-[#999] mb-2">旋转角度</div>
      <div class="flex items-center gap-4">
        <div class="w-full">
          <el-input-number
            class="w-full"
            v-model="displayInputAngle"
            :min="0"
            :max="360"
            :step="1"
            size="small"
            controls-position="right"
            @change="handleAngleInput"
          />
        </div>
        <div
          class="relative flex items-center justify-center"
          @mousedown="startRotate"
          @mousemove="handleRotate"
          @mouseup="stopRotate"
          @mouseleave="stopRotate"
        >
          <div class="w-8 h-8 rounded-full border border-[#af24ff] relative">
            <!-- 旋转指针 -->
            <div
              class="absolute w-[1px] h-[13px] bg-[#af24ff]"
              :style="{
                transform: `rotate(${displayAngle}deg)`,
                left: 'calc(50% - 0.5px)',
                top: '50%',
                transformOrigin: 'top',
              }"
            >
              <div
                class="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#af24ff]"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
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
    <div class="flex items-center gap-3 mb-3">
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
    <div class="flex items-center gap-3">
      <div class="flex-1">
        <div class="text-base text-[#999] mb-1">不透明度</div>
        <div class="flex items-center gap-3">
          <el-slider v-model="clip.opacity" :min="0" :max="100" :step="1" />
          <div class="w-12 text-right">{{ Math.round(clip.opacity) }}%</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { TrackClip } from '@/types/track';
import { Icon } from '@iconify/vue';

const props = defineProps<{
  clip: TrackClip;
}>();

const emit = defineEmits(['update']);

const isDragging = ref(false);

// 弧度转角度
const toDegree = (radian: number) => {
  let degree = radian * (180 / Math.PI);
  degree = degree % 360;
  if (degree < 0) degree += 360;
  return Math.round(degree);
};

// 角度转弧度
const toRadian = (degree: number) => {
  return degree * (Math.PI / 180);
};

// 显示角度
const displayAngle = computed(() => {
  if (props.clip?.angle === undefined) return 0;
  let angle = toDegree(props.clip.angle);
  angle = (angle + 180) % 360;
  return angle;
});

// 输入框显示的角度
const displayInputAngle = computed({
  get: () => {
    if (props.clip?.angle === undefined) return 0;
    return toDegree(props.clip.angle);
  },
  set: (val) => {
    if (!props.clip) return;
    props.clip.angle = toRadian(val);
  },
});

// 处理角度输入
const handleAngleInput = (val: number | null) => {
  if (!props.clip) return;
  if (val === null || isNaN(val)) {
    props.clip.angle = 0;
    return;
  }
  let degree = val % 360;
  if (degree < 0) degree += 360;
  props.clip.angle = toRadian(degree);
};

// 开始旋转
const startRotate = (e: MouseEvent) => {
  isDragging.value = true;
};

// 处理旋转
const handleRotate = (e: MouseEvent) => {
  if (!isDragging.value || !props.clip) return;

  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  let angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
  angle = angle + Math.PI / 2;
  if (angle < 0) angle += Math.PI * 2;

  props.clip.angle = angle;
  emit('update', props.clip);
};

// 停止旋转
const stopRotate = () => {
  isDragging.value = false;
};

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
