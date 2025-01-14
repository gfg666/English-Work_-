<!--
 * 片段属性设置组件
 * 根据片段类型显示不同的属性设置界面
-->
<template>
    <div class="p-6 text-white">
        <template v-if="clip">
            <!-- 视频属性 -->
            <template v-if="clip.type === 'video'">
                <VideoProperties :clip="clip" @update="handleUpdate" />
            </template>

            <!-- 音频属性 -->
            <template v-if="clip.type === 'audio'">
                <AudioProperties :clip="clip" @update="handleUpdate" />
            </template>

            <!-- 图片属性 -->
            <template v-if="clip.type === 'image'">
                <ImageProperties :clip="clip" @update="handleUpdate" />
            </template>

            <!-- 文字属性 -->
            <template v-if="clip.type === 'text'">
                <TextProperties :clip="clip" @update="handleUpdate" />
            </template>

            <!-- 滤镜属性 -->
            <template v-if="clip.type === 'filter'">
                <FilterProperties :clip="clip as unknown as FilterTrackClip" @update="handleUpdate" />
            </template>
        </template>
        <div v-else class="text-center text-[#999] text-base">
            请选择一个片段
        </div>
    </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useTrackStore } from '@/store/modules/track'
import type { TrackClip, FilterTrackClip } from '@/types/track'
import VideoProperties from './components/VideoProperties.vue'
import AudioProperties from './components/AudioProperties.vue'
import ImageProperties from './components/ImageProperties.vue'
import TextProperties from './components/TextProperties.vue'
import FilterProperties from './components/FilterProperties.vue'

const props = defineProps<{
    clip: TrackClip
}>()

const emit = defineEmits(['update'])

const trackStore = useTrackStore()

// 处理更新
const handleUpdate = (updatedClip: TrackClip) => {
    emit('update', updatedClip)
}

// 监听属性变化
watch(() => props.clip, (newClip) => {
    if (!newClip) return
    trackStore.publishClipUpdate(newClip)
}, { deep: true })
</script>

<style lang="scss">
:deep(.el-input-number) {
    @apply w-full;
}

:deep(.el-input-number .el-input__wrapper) {
    @apply bg-[#1a1a1a] border-[#333] hover:border-[#666];
}

:deep(.el-textarea__inner) {
    @apply bg-[#1a1a1a] border-[#333] text-white hover:border-[#666];
}

:deep(.el-input__inner) {
    @apply bg-[#1a1a1a] border-[#333] text-white hover:border-[#666];
}

:deep(.el-select) {
    @apply w-full;
}

:deep(.el-select .el-input__wrapper) {
    @apply bg-[#1a1a1a] border-[#333] hover:border-[#666];
}

:deep(.el-slider) {
    @apply w-full;
}

:deep(.el-color-picker) {
    @apply w-full;
}

:deep(.el-color-picker .el-color-picker__trigger) {
    @apply w-full border-[#333] hover:border-[#666];
}

:deep(.el-button) {
    @apply bg-transparent border-[#333] text-white hover:bg-[#333] hover:border-[#666];
}

:deep(.el-input-number.is-controls-right .el-input-number__decrease),
:deep(.el-input-number.is-controls-right .el-input-number__increase) {
    @apply bg-transparent border-[#333] text-white hover:bg-[#333];
}

:deep(.el-switch) {
    --el-switch-on-color: #8b5cf6;
}

:deep(.el-collapse) {
    @apply border-none bg-transparent;
}

:deep(.el-collapse-item__header) {
    @apply bg-transparent border-none text-white;
}

:deep(.el-collapse-item__content) {
    @apply bg-transparent text-white p-0;
}

:deep(.el-collapse-item__arrow) {
    @apply text-white;
}

:deep(.el-dropdown-menu) {
    @apply bg-[#1a1a1a] border-[#333];
}

:deep(.el-dropdown-menu__item) {
    @apply text-white hover:bg-[#333] hover:text-white;
}

:deep(.el-dropdown-menu__item:not(.is-disabled):hover) {
    @apply bg-[#333] text-white;
}
</style>