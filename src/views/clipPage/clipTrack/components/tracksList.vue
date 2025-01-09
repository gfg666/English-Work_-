<template>
    <div class="w-full h-full bg-[#252525] tracks-list select-none" @dragenter.prevent="handleDragEnter"
        @dragover.prevent="handleDragOver" @dragleave.prevent="handleDragLeave" @mousedown="handleBackgroundClick"
        @keydown="handleKeyDown" tabindex="0">
        <div v-for="(track, index) in tracks" :key="track.id" class="relative h-15 my-3 bg-[#252525]"
            :data-track="track.id" @dragenter.prevent="handleTrackDragEnter(index)"
            @dragleave.prevent="handleTrackDragLeave(index)">
            <div v-for="clip in track.clips" :key="clip.id"
                class="absolute top-0 h-full flex items-center bg-[#444] rounded-xl cursor-pointer select-none min-w-[30px]"
                :class="{
                    'ring-2 ring-[#b534cf]': clip.selected || (hoveredClip && hoveredClip.id === clip.id) || (selectedClip && selectedClip.id === clip.id),
                    'bg-[#631975]': clip.type === 'video',
                    'bg-[#6ab7ff]': clip.type === 'audio',
                    'bg-[#722ed133]': clip.type === 'image',
                    'bg-[#a85201]': clip.type === 'text',
                    'bg-[#eb2f9633]': clip.type === 'sticker'
                }" :style="{
                    left: `${clip.startTime * frameLength}px`,
                    width: `${clip.duration * frameLength}px`
                }" :data-clip="clip.id" @mousedown.stop="handleClipClick($event, clip, track.id)"
                @mouseover="handleClipHover(clip)" @mouseleave="handleClipLeave(clip)">
                <track-item :clip="clip" :zoom="zoom" :frameLength="frameLength"
                    :hovered="clip.selected || (hoveredClip && hoveredClip.id === clip.id) || (selectedClip && selectedClip.id === clip.id)" />
                <!-- 调整把手 -->
                <div v-if="clip.selected || (hoveredClip && hoveredClip.id === clip.id) || (selectedClip && selectedClip.id === clip.id)"
                    class="absolute left-[1.25px] top-[0.285px] bottom-0 flex items-center justify-center w-3 h-[98%] bg-[#d4d4d4] rounded-l-[0.75rem] cursor-w-resize hover:bg-[#a0a0a0] z-10"
                    @mousedown.stop="startResize($event, clip, 'left')">
                    <div class="w-1 h-[80%] bg-[#646464]">
                    </div>
                </div>
                <div v-if="clip.selected || (hoveredClip && hoveredClip.id === clip.id) || (selectedClip && selectedClip.id === clip.id)"
                    class="absolute right-[1.25px] top-[0.285px] bottom-0 flex items-center justify-center w-3 h-[98%] bg-[#d4d4d4] rounded-r-[0.75rem] cursor-w-resize hover:bg-[#a0a0a0] z-10"
                    @mousedown.stop="startResize($event, clip, 'right')">
                    <div class="w-1 h-[80%] bg-[#646464]">
                    </div>
                </div>
            </div>
            <!-- 拖拽预览部分保持不变 -->
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, inject } from 'vue'
import TrackItem from './trackItem.vue'
import type { Track, TrackClip } from '@/types/track'
import { v4 } from 'uuid'
const props = defineProps({
    tracks: {
        type: Array<Track>,
        required: true
    },
    hoveredTrack: {
        type: Number,
        default: -1
    },
    dragPreview: {
        type: Boolean,
        default: false
    },
    dragPreviewPosition: {
        type: Number,
        default: 0
    },
    dragPreviewWidth: {
        type: Number,
        default: 0
    },
    zoom: {
        type: Number,
        default: 1
    },
    frameLength: {
        type: Number,
        default: 20
    },
    isReplaceMode: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits([
    'track-drag-enter',
    'track-drag-leave',
    'clip-mouse-down',
    'background-click',
    'save-history-state',
    'clip-hover',
    'start-resize',
    'drop',
    'delete-clip',
])

const hoveredClip = ref<TrackClip>(null)
const selectedClip = ref<TrackClip>(null)

const clearAllClipSelections = () => {
    props.tracks.forEach(track => {
        track.clips.forEach(clip => {
            clip.selected = false
        })
    })
    selectedClip.value = null
}

const handleDragEnter = (e: DragEvent) => {
    e.preventDefault()
}

const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const relativeX = e.clientX - rect.left
    const relativeY = e.clientY - rect.top

    // 计算当前hover的轨道索引
    const trackHeight = rect.height / props.tracks.length
    const trackIndex = Math.floor(relativeY / trackHeight)

    if (trackIndex >= 0 && trackIndex < props.tracks.length) {
        emit('track-drag-enter', trackIndex)
    }
}

const handleDragLeave = (e: DragEvent) => {
    e.preventDefault()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        emit('track-drag-leave', props.hoveredTrack)
    }
}

const handleTrackDragEnter = (index: number) => {
    emit('track-drag-enter', index)
}

const handleTrackDragLeave = (index: number) => {
    emit('track-drag-leave', index)
}

const handleClipClick = (event: MouseEvent, clip: any, trackId: string) => {
    event.stopPropagation()
    event.preventDefault()

    // 清除其他 clip 的选中状态，保留当前 clip 的选中状态
    props.tracks.forEach(track => {
        track.clips.forEach(c => {
            if (c !== clip) {
                c.selected = false
            }
        })
    })

    // 设置选中状态
    clip.selected = true
    selectedClip.value = clip
    hoveredClip.value = null

    // 检查是否点击到调整大小的把手
    const target = event.target as HTMLElement
    if (!target.classList.contains('resize-handle') && !target.closest('.resize-handle')) {
        // 触发父组件事件，传递事件对象
        emit('clip-mouse-down', clip, trackId, event)
    }
}

const activeClip = (clip: TrackClip | null) => {
    clearAllClipSelections()
    if (!clip) return
    clip.selected = true
    selectedClip.value = clip
}

const handleClipHover = (clip: any) => {
    if (!selectedClip.value) {
        hoveredClip.value = clip.id
        clip.selected = true
    }
    emit('clip-hover', clip)
}

const startResize = (event: MouseEvent, clip: any, direction: 'left' | 'right') => {
    emit('start-resize', event, clip, direction)
}

const handleClipLeave = (clip: any) => {
    if (hoveredClip.value === clip.id && !selectedClip.value) {
        hoveredClip.value = null
        clip.selected = false
    }
}

const handleBackgroundClick = (event: MouseEvent) => {
    // 如果点击的是背景，则清除所有选中状态
    clearAllClipSelections()
    emit('background-click')
    hoveredClip.value = null
}

const handleKeyDown = (event: KeyboardEvent) => {
    // 检查当前焦点是否在输入框、文本框等元素内
    const activeElement = document.activeElement
    const isInput = activeElement?.tagName === 'INPUT' ||
        activeElement?.tagName === 'TEXTAREA' ||
        activeElement?.getAttribute('contenteditable') === 'true' ||
        activeElement?.classList.contains('el-input__inner') ||
        activeElement?.classList.contains('el-textarea__inner')

    if (isInput) {
        return // 如果焦点在输入框内，不处理删除操作
    }

    if (event.key === 'Delete' || event.key === 'Backspace') {
        // 找到所有选中的clips
        props.tracks.forEach((track, trackIndex) => {
            const selectedClips = track.clips.filter(clip => clip.selected || clip === selectedClip.value)
            selectedClips.forEach(clip => {
                emit('delete-clip', clip, trackIndex)
            })
        })
        saveHistoryState()
    }
}

const saveHistoryState = () => {
    emit('save-history-state')
}

onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
    // 给组件添加焦点
    const container = document.querySelector('.tracks-list') as HTMLElement
    if (container) {
        container.focus()
    }
})

onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
})

defineExpose({
    activeClip
})
</script>

<style scoped>
.tracks-list {
    outline: none;
    /* 移除 tabindex 带来的焦点轮廓 */
}
</style>
