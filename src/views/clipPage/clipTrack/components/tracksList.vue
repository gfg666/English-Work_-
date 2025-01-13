<!--
 * 轨道列表组件
 * 实现了多轨道的显示、选择、拖拽等功能
 * 支持轨道内元素的选择、删除和属性调整
-->
<template>
    <div class="w-full h-full bg-[#252525] tracks-list select-none" @dragenter.prevent="handleDragEnter"
        @dragover.prevent="handleDragOver" @dragleave.prevent="handleDragLeave" @mousedown="handleBackgroundClick"
        @keydown="handleKeyDown" tabindex="0">
        <!-- 轨道列表 -->
        <div v-for="(track, index) in tracks" :key="track.id" class="relative h-15 my-3 bg-[#252525]"
            :data-track="track.id" @dragenter.prevent="handleTrackDragEnter(index)"
            @dragleave.prevent="handleTrackDragLeave(index)">
            <!-- 轨道内的片段 -->
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
                <!-- 片段内容 -->
                <track-item :clip="clip" :zoom="zoom" :frameLength="frameLength"
                    :hovered="clip.selected || (hoveredClip && hoveredClip.id === clip.id) || (selectedClip && selectedClip.id === clip.id)" />

                <!-- 左侧调整把手 -->
                <div v-if="clip.selected || (hoveredClip && hoveredClip.id === clip.id) || (selectedClip && selectedClip.id === clip.id)"
                    class="absolute left-[1.25px] top-[0.285px] bottom-0 flex items-center justify-center w-3 h-[98%] bg-[#d4d4d4] rounded-l-[0.75rem] cursor-w-resize hover:bg-[#a0a0a0] z-10"
                    @mousedown.stop="startResize($event, clip, 'left')">
                    <div class="w-1 h-[80%] bg-[#646464]"></div>
                </div>

                <!-- 右侧调整把手 -->
                <div v-if="clip.selected || (hoveredClip && hoveredClip.id === clip.id) || (selectedClip && selectedClip.id === clip.id)"
                    class="absolute right-[1.25px] top-[0.285px] bottom-0 flex items-center justify-center w-3 h-[98%] bg-[#d4d4d4] rounded-r-[0.75rem] cursor-w-resize hover:bg-[#a0a0a0] z-10"
                    @mousedown.stop="startResize($event, clip, 'right')">
                    <div class="w-1 h-[80%] bg-[#646464]"></div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import TrackItem from './trackItem.vue'
import type { Track, TrackClip } from '@/types/track'

// Props & Emits
const props = defineProps({
    tracks: {
        type: Array as () => Track[],
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

const emit = defineEmits<{
    'track-drag-enter': [index: number]
    'track-drag-leave': [index: number]
    'clip-mouse-down': [clip: TrackClip, trackId: string, event: MouseEvent]
    'background-click': []
    'save-history-state': []
    'clip-hover': [clip: TrackClip]
    'start-resize': [event: MouseEvent, clip: TrackClip, direction: 'left' | 'right']
    'delete-clip': [clip: TrackClip, trackIndex: number]
}>()

// 状态变量
const hoveredClip = ref<TrackClip | undefined>(undefined)
const selectedClip = ref<TrackClip | undefined>(undefined)

// 选择管理相关方法
const clearAllClipSelections = () => {
    props.tracks.forEach(track => {
        track.clips.forEach(clip => {
            clip.selected = false
        })
    })
    selectedClip.value = undefined
}

const activeClip = (clip: TrackClip | undefined) => {
    clearAllClipSelections()
    if (!clip) return
    clip.selected = true
    selectedClip.value = clip
}

// 拖拽相关方法
const handleDragEnter = (e: DragEvent) => {
    e.preventDefault()
}

const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const relativeX = e.clientX - rect.left
    const relativeY = e.clientY - rect.top
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

// 片段交互相关方法
const handleClipClick = (event: MouseEvent, clip: TrackClip, trackId: string) => {
    event.stopPropagation()
    event.preventDefault()

    props.tracks.forEach(track => {
        track.clips.forEach(c => {
            if (c !== clip) {
                c.selected = false
            }
        })
    })

    clip.selected = true
    selectedClip.value = clip
    hoveredClip.value = undefined

    const target = event.target as HTMLElement
    if (!target.classList.contains('resize-handle') && !target.closest('.resize-handle')) {
        emit('clip-mouse-down', clip, trackId, event)
    }
}

const handleClipHover = (clip: TrackClip) => {
    if (!selectedClip.value) {
        hoveredClip.value = clip
        clip.selected = true
    }
    emit('clip-hover', clip)
}

const handleClipLeave = (clip: TrackClip) => {
    if (hoveredClip.value === clip && !selectedClip.value) {
        hoveredClip.value = undefined
        clip.selected = false
    }
}

const startResize = (event: MouseEvent, clip: TrackClip, direction: 'left' | 'right') => {
    emit('start-resize', event, clip, direction)
}

// 背景点击和键盘事件处理
const handleBackgroundClick = (event: MouseEvent) => {
    clearAllClipSelections()
    emit('background-click')
    hoveredClip.value = undefined
}

const handleKeyDown = (event: KeyboardEvent) => {
    const activeElement = document.activeElement
    const isInput = activeElement?.tagName === 'INPUT' ||
        activeElement?.tagName === 'TEXTAREA' ||
        activeElement?.getAttribute('contenteditable') === 'true' ||
        activeElement?.classList.contains('el-input__inner') ||
        activeElement?.classList.contains('el-textarea__inner')

    if (isInput) return

    if (event.key === 'Delete' || event.key === 'Backspace') {
        props.tracks.forEach((track, trackIndex) => {
            const selectedClips = track.clips.filter(clip => clip.selected || clip === selectedClip.value)
            selectedClips.forEach(clip => {
                emit('delete-clip', clip, trackIndex)
            })
        })
        saveHistoryState()
    }
}

// 历史记录相关
const saveHistoryState = () => {
    emit('save-history-state')
}

// 生命周期钩子
onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
    const container = document.querySelector('.tracks-list') as HTMLElement
    if (container) {
        container.focus()
    }
})

onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
})

// 导出方法
defineExpose({
    activeClip
})
</script>

<style scoped>
.tracks-list {
    outline: none;
}
</style>
