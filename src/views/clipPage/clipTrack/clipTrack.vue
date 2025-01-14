<!--
  * 视频轨道编辑组件
  * 实现了视频片段的编辑、排列、缩放等功能
  * 包含时间轴、轨道列表等核心编辑功能
-->
<template>
    <!-- 主容器：设置基础样式和禁用文本选择 -->
    <div class="w-full h-full bg-[#201f20] relative overflow-hidden select-none">
        <!-- 工具栏区域：包含各种编辑操作按钮 -->
        <div class="flex justify-between items-center px-4 py-2">
            <!-- 左侧工具按钮组 -->
            <div class="flex items-center gap-4">
                <!-- 重置轨道按钮：清空所有轨道内容 -->
                <el-popconfirm id="reset-button" title="确定要重置轨道吗？" confirm-button-text="确定" cancel-button-text="取消"
                    @confirm="handleReset">
                    <template #reference>
                        <button class="text-white hover:text-purple-500 transition-colors">
                            <Icon icon="mdi:restore" width="20" />
                        </button>
                    </template>
                </el-popconfirm>

                <!-- 撤销按钮：撤销上一步操作 -->
                <el-tooltip content="撤销" placement="top">
                    <button id="undo-button" class="text-white hover:text-purple-500 transition-colors"
                        :class="{ 'opacity-50 cursor-not-allowed': !canUndo }" @click="handleUndo">
                        <Icon icon="mdi:undo" width="20" />
                    </button>
                </el-tooltip>

                <!-- 恢复按钮：重做上一步被撤销的操作 -->
                <el-tooltip content="恢复" placement="top">
                    <button id="redo-button" class="text-white hover:text-purple-500 transition-colors"
                        :class="{ 'opacity-50 cursor-not-allowed': !canRedo }" @click="handleRedo">
                        <Icon icon="mdi:redo" width="20" />
                    </button>
                </el-tooltip>

                <!-- 分割按钮：将选中的视频片段分割成两部分 -->
                <el-tooltip content="分割" placement="top">
                    <button id="split-button" class="text-white hover:text-purple-500 transition-colors"
                        :class="{ 'opacity-50 cursor-not-allowed': !canSplit }" @click="handleSplit">
                        <Icon icon="material-symbols-light:split-scene-outline" width="20" />
                    </button>
                </el-tooltip>

                <!-- 删除按钮：删除选中的视频片段 -->
                <el-tooltip content="删除" placement="top">
                    <button id="delete-button" class="text-white hover:text-purple-500 transition-colors"
                        @click="handleDelete">
                        <Icon icon="mdi:delete" width="20" />
                    </button>
                </el-tooltip>
            </div>

            <!-- 右侧缩放控制区域 -->
            <div class="flex items-center gap-2">
                <!-- 缩小按钮：减小时间轴刻度 -->
                <el-tooltip content="缩小" placement="top">
                    <button id="zoom-out-button" class="text-white hover:text-purple-500 transition-colors p-1 rounded"
                        :class="{ 'opacity-50 cursor-not-allowed': trackZoom <= 0.3 }" @click="zoomOut">
                        <Icon icon="mdi:minus" width="20" />
                    </button>
                </el-tooltip>

                <span class="text-white min-w-[50px] text-center">{{ Math.round(trackZoom * 100) }}%</span>

                <el-tooltip content="放大" placement="top">
                    <button id="zoom-in-button" class="text-white hover:text-purple-500 transition-colors p-1 rounded"
                        :class="{ 'opacity-50 cursor-not-allowed': trackZoom >= 5 }" @click="zoomIn">
                        <Icon icon="mdi:plus" width="20" />
                    </button>
                </el-tooltip>
                <!-- 导出 -->
                <el-button id="export-button" class="text-white" type="primary" size="small" @click="handleExport">
                    <div class="flex items-center gap-2">
                        <Icon icon="mdi:export" width="20" />
                        导出
                    </div>
                </el-button>
            </div>
        </div>
        <!-- 轨道区域 -->
        <div class="h-[calc(100%-36px)] relative overflow-x-scroll" ref="trackContainer">
            <!-- 时间标尺容器 -->
            <TimelineRuler :duration="timelineDuration" :zoom="trackZoom" :current-time="currentTime"
                :total-width="totalWidth" @scroll="handleRulerScroll" @timeUpdate="handleTimeUpdate" />
            <!-- 内容容器 -->
            <div class="relative h-[calc(100%-36px)] overflow-x-hidden overflow-y-auto"
                :style="{ width: totalWidth + 'px' }" @dragover.prevent="handleDragOver"
                @dragleave.prevent="handleDragLeave" @drop.prevent="handleDrop">
                <!-- 无轨道时的提示 -->
                <div v-if="!tracks.length"
                    class="absolute w-[10%] left-0 top-0 inset-0 flex flex-col items-center justify-center">
                    <div class="text-[#666] text-lg mb-4">拖拽素材到此处</div>
                    <div class="w-[200px] h-[40px] bg-purple-500/20 border-2 border-dashed border-purple-500 rounded">
                    </div>
                </div>

                <TracksList ref="tracksListRef" :tracks="tracks" :hoveredTrack="hoveredTrack" :dragPreview="dragPreview"
                    :dragPreviewPosition="dragPreviewPosition" :dragPreviewWidth="dragPreviewWidth" :zoom="trackZoom"
                    :frameLength="BASE_TICK_SPACING * trackZoom * 10" @start-resize="startResize"
                    @track-drag-enter="handleTrackDragEnter" @track-drag-leave="handleTrackDragLeave"
                    @clip-mouse-down="handleClipMouseDown" @clip-hover="handleClipHover" @delete-clip="handleDeleteClip"
                    @background-click="handleBackgroundClick" @save-history-state="saveHistoryState" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted, computed, watch } from 'vue';
import { Track, TrackClip } from '@/types/track';
import TimelineRuler from './components/timelineRuler.vue'
import TracksList from './components/tracksList.vue'
import { v4 } from 'uuid';
import { useTrackStore } from '@/store/modules/track';
import { getKeyframes, getVolume } from '@/components/js/webcodecs';
import { Icon } from '@iconify/vue'
import { useRoute } from 'vue-router'
import { cloneDeep } from 'lodash'
import { ElMessage } from 'element-plus'

const props = defineProps<{
    tracks: Track[],
    maxTracksNum: number,
    currentTime: number,
    timelineDuration: number
}>()
const emit = defineEmits<{
    (e: 'resetTrack'): void
    (e: 'timeUpdate', time: number): void
    (e: 'refreshPlayer'): void
    (e: 'add-clip', clip: TrackClip): void
    (e: 'activeClip', clip: TrackClip | null): void
    (e: 'delete-empty-track'): void
    (e: 'handleExport'): void
    (e: 'update:tracks', tracks: Track[]): void
}>()

// 时间轴相关
const frameLength = computed(() => BASE_TICK_SPACING * trackZoom.value * 10) // 每秒占据的像素
const ZOOM_STORAGE_KEY = 'track-zoom-value'

// 从 localStorage 获取缩放值，如果没有则使用默认值 1
const trackZoom = ref(parseFloat(localStorage.getItem(ZOOM_STORAGE_KEY) || '1'))

const BASE_TICK_SPACING = 3 // 基础刻度间距(px)
const SCROLL_THRESHOLD = 150 // 滚动触发距离（像素）

// 缩放相关方法
const zoomIn = () => {
    if (trackZoom.value < 5) {
        if (trackZoom.value < 1) {
            // 当缩放比例小于1时，每次增加0.1
            trackZoom.value = Math.min(5, Math.round((trackZoom.value + 0.1) * 10) / 10)
        } else {
            // 当缩放比例大于等于1时，每次增加1
            trackZoom.value = Math.min(5, Math.floor(trackZoom.value + 1))
        }
        // 保存到 localStorage
        localStorage.setItem(ZOOM_STORAGE_KEY, trackZoom.value.toString())
    }
}

const zoomOut = () => {
    if (trackZoom.value > 0.3) {
        if (trackZoom.value <= 1) {
            // 当缩放比例小于等于1时，每次减少0.1
            trackZoom.value = Math.max(0.3, Math.round((trackZoom.value - 0.1) * 10) / 10)
        } else {
            // 当缩放比例大于1时，每次减少1
            trackZoom.value = Math.max(1, Math.floor(trackZoom.value - 1))
        }
        // 保存到 localStorage
        localStorage.setItem(ZOOM_STORAGE_KEY, trackZoom.value.toString())
    }
}

const totalWidth = computed(() => props.timelineDuration * frameLength.value)
// 拖拽相关状态
const tracksListRef = ref(null)
const hoveredTrack = ref(-1)
const dragPreview = ref(false)
const dragPreviewPosition = ref(0)
const dragPreviewWidth = ref(0)
const scrollDirection = ref<'left' | 'right' | 'up' | 'down' | null>(null)
const lastMouseX = ref(0)
const lastMouseY = ref(0)
const animationFrameId = ref<number | null>(null)
const maxScrollSpeed = ref(15) // 最大滚动速度（像素/帧）

// 添加新的响应式状态
const originalClipsPosition = ref<any>(null) // 存储原始位置
const affectedClips = ref<any[]>([]) // 受影响的片段
const isReplaceMode = ref(false)  // 是否处于替换模式
const snapPosition = ref<number | null>(null)  // 吸附位置
const targetClip = ref<any>(null)  // 当前hover的目标片段

// 修改 handleDragOver 函数
const trackStore = useTrackStore()

const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const relativeX = e.clientX - rect.left

    // 获取当前鼠标下的元素
    const target = e.target as HTMLElement
    const trackElement = target.closest('[data-track]')
    const trackId = trackElement?.getAttribute('data-track')

    // 从 store 中获取拖拽数据
    const mediaData = trackStore.getDragData
    if (!mediaData) return

    const currentTime = relativeX / frameLength.value

    try {
        if (trackId) {
            // 在轨道上
            const currentTrack = props.tracks.find(t => t.id === trackId)
            if (currentTrack) {
                const trackIndex = props.tracks.indexOf(currentTrack)

                // 检查是否在某个 clip 范围内
                const overlappingClip = currentTrack.clips.find(clip =>
                    currentTime >= clip.startTime && currentTime <= clip.endTime
                )

                if (overlappingClip) {
                    // 在 clip 上方，显示替换预览
                    isReplaceMode.value = true
                    targetClip.value = overlappingClip
                    dragPreviewPosition.value = overlappingClip.startTime * frameLength.value
                    hoveredTrack.value = trackIndex
                } else {
                    // 在轨道上但不在 clip 范围内
                    targetClip.value = null
                    dragPreviewPosition.value = currentTime * frameLength.value
                    hoveredTrack.value = trackIndex
                }
            }
        } else {
            targetClip.value = null
            dragPreviewPosition.value = currentTime * frameLength.value
            hoveredTrack.value = -1
        }
    } catch (err) {
        console.error('DragOver error:', err)
    }
}

const handleDragLeave = (e: DragEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        resetClipsPosition()
        dragPreview.value = false
        hoveredTrack.value = -1
    }
}

// 恢复原始位置的方法
const resetClipsPosition = () => {
    if (originalClipsPosition.value && hoveredTrack.value >= 0) {
        const currentTrack = props.tracks[hoveredTrack.value]
        currentTrack.clips.forEach(clip => {
            const original = originalClipsPosition.value.find(o => o.id === clip.id)
            if (original) {
                clip.startTime = original.startTime
            }
        })
        originalClipsPosition.value = null
        affectedClips.value = []
    }
}

// 修改 handleDrop 函数
const handleDrop = async (e: DragEvent) => {
    console.log('handleDrop')
    e.preventDefault()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const relativeX = e.clientX - rect.left
    const currentTime = relativeX / frameLength.value

    // 从 store 中获取拖拽数据
    const mediaData = trackStore.getDragData
    if (!mediaData) return
    const newClip = {
        ...mediaData,
        id: v4(),
        rect: null,
        opacity: 100,
        volume: 100,
        startTime: isReplaceMode.value && targetClip.value
            ? Number(targetClip.value.startTime)
            : currentTime,
        duration: Number((mediaData.duration || 5 * 1e6) / 1e6),
        selected: false,
        sourceStartTime: 0,
        sourceEndTime: 0,
        originalDuration: Number((mediaData.duration || 5 * 1e6) / 1e6)
    }

    // 确保 endTime 是 number
    newClip.endTime = newClip.startTime + newClip.duration

    // 根据媒体类型获取不同的数据
    if (newClip.type === 'video' || newClip.type === 'image') {
        const res = await getKeyframes(newClip)
        if (res.type === 'video') {
            newClip.thumbnail = res.data
        } else if (res.type === 'image') {
            newClip.thumbnail = [{ timestamp: 0, url: URL.createObjectURL(res.data as Blob) }]
        }
    } else if (newClip.type === 'audio') {
        const res = await getVolume(newClip)
        if (res.type === 'audio') {
            newClip.volumeData = res.data
        }
    } else if (newClip.type === 'text') {
        newClip.textConfig = {
            content: 'Hello, World!',
            fontSize: 24,
            fontFamily: 'Arial',
            color: '#000000',
            x: 10,
            y: 10,
            width: 100,
            height: 100,
        }
    }

    if (hoveredTrack.value >= 0) {
        // 添加到现有轨道
        const currentTrack = props.tracks[hoveredTrack.value]
        currentTrack.clips.push(newClip)
        currentTrack.clips.sort((a, b) => a.startTime - b.startTime)
    } else if (props.tracks.length < props.maxTracksNum) {
        console.log('create new track')
        // 如果没有选中轨道且轨道数量未达到上限，创建新轨道
        props.tracks.push({
            id: v4(),
            clips: [newClip]
        })
    } else {
        // 轨道数量已达上限
        ElMessage.warning('轨道数量已达到最大限制(' + props.maxTracksNum + ')')
        return
    }

    shiftFollowingClips(props.tracks[hoveredTrack.value], newClip)
    emit('add-clip', newClip)
    // 重置状态
    resetDropState()
    saveHistoryState()
    // 清除 store 中的数据
    trackStore.clearDragData()
}

// 添加移动后续clips的函数
const shiftFollowingClips = (track: any, newClip: any) => {
    if (!track || track?.clips.length === 0) return
    const previousClip = track.clips.filter(clip => clip.endTime > newClip.startTime && clip.startTime < newClip.startTime)
    if (previousClip.length !== 0 && dragType.value === 'other') {
        newClip.startTime = previousClip[0].endTime
        newClip.endTime = newClip.startTime + newClip.duration
    } else if (previousClip.length !== 0 && dragType.value === 'same') {
        if (props.tracks.length < props.maxTracksNum) {
            const newTrack = {
                id: v4(),
                clips: [newClip]
            }
            const currentTrackIndex = props.tracks.findIndex(t => t.id === track.id)
            props.tracks.splice(currentTrackIndex + 1, 0, newTrack)
            track.clips = track.clips.filter(clip => clip.id !== newClip.id)
        } else {
            newClip.startTime = previousClip[0].endTime
            newClip.endTime = newClip.startTime + newClip.duration
            return ElMessage.warning(`轨道数量已达到最大限制(${props.maxTracksNum})`)
        }
    }
    const followingClips = track.clips
        .filter(clip => clip.id !== newClip.id && clip.startTime >= newClip.startTime)
        .sort((a, b) => a.startTime - b.startTime)
    if (followingClips.length !== 0 && followingClips[0].startTime < newClip.endTime) {
        let currentEndTime = newClip.endTime
        followingClips.forEach(clip => {
            const duration = clip.endTime - clip.startTime
            clip.startTime = currentEndTime
            clip.endTime = clip.startTime + duration
            currentEndTime = clip.endTime
        })
    }
}

const activeClip = (clip: TrackClip) => {
    tracksListRef.value?.activeClip(clip)
    selectedClip.value = clip
}

const resetDropState = () => {
    isReplaceMode.value = false
    snapPosition.value = null
    targetClip.value = null
    dragPreview.value = false
    hoveredTrack.value = -1
    dragPreviewPosition.value = 0
}

const handleTrackDragEnter = (index: number) => {
    hoveredTrack.value = index
}

const handleTrackDragLeave = (index: number) => {
    if (hoveredTrack.value === index) {
        hoveredTrack.value = -1
    }
}

// 添加新的状态
const selectedClip = ref<any>(null)
const isResizing = ref(false)
const resizeType = ref<'left' | 'right' | null>(null)
const initialMouseX = ref(0)
const initialStartTime = ref(0)
const initialEndTime = ref(0)

// 处理片段悬停
const handleClipHover = (clip: TrackClip) => {
    if (!selectedClip.value) {
        selectedClip.value = clip
    }
}

// 开始调整大小
const startResize = (event: MouseEvent, clip: any, type: 'left' | 'right') => {
    event.stopPropagation()

    isResizing.value = true
    resizeType.value = type
    selectedClip.value = clip
    initialMouseX.value = event.clientX
    initialStartTime.value = Number(clip.startTime)
    initialEndTime.value = Number(clip.endTime)

    // 如果clip没有originalDuration，则使用当前duration作为originalDuration
    if (!clip.originalDuration) {
        clip.originalDuration = clip.duration
    }

    document.addEventListener('mousemove', handleResize)
    document.addEventListener('mouseup', stopResize)
}

// 添加最小宽度计算
const MIN_CLIP_WIDTH = 30 // 最小像素宽度
const minClipDuration = computed(() => MIN_CLIP_WIDTH / frameLength.value) // 根据缩放计算最小持续时间

// 处理调整大小
const handleResize = (event: MouseEvent) => {
    if (!isResizing.value || !selectedClip.value) return

    event.preventDefault()
    event.stopPropagation()

    const rect = trackContainer.value.getBoundingClientRect()
    const relativeX = event.clientX - rect.left + trackContainer.value.scrollLeft
    const currentTime = relativeX / frameLength.value

    if (selectedClip.value.type === 'video' || selectedClip.value.type === 'audio') {
        // 视频和音频类型的调整逻辑
        const originalDuration = Number(selectedClip.value.originalDuration)

        if (resizeType.value === 'left') {
            const endTime = Number(selectedClip.value.endTime)
            const sourceEndTime = Number(selectedClip.value.sourceEndTime)

            // 确保不超过最小宽度且不小于0
            const maxStartTime = endTime - minClipDuration.value
            const newStartTime = Math.min(Math.max(0, currentTime), maxStartTime)
            const newDuration = endTime - newStartTime

            // 根据duration比例计算sourceStartTime
            const durationRatio = newDuration / originalDuration
            const newSourceStartTime = originalDuration - (sourceEndTime + newDuration)

            if (newSourceStartTime >= 0 && newSourceStartTime + sourceEndTime <= originalDuration) {
                selectedClip.value.startTime = newStartTime
                selectedClip.value.duration = newDuration
                selectedClip.value.sourceStartTime = newSourceStartTime
            }
        } else if (resizeType.value === 'right') {
            const startTime = Number(selectedClip.value.startTime)
            const sourceStartTime = Number(selectedClip.value.sourceStartTime)

            // 确保不小于最小宽度
            const minEndTime = startTime + minClipDuration.value
            const maxEndTime = startTime + (originalDuration - sourceStartTime)
            const newEndTime = Math.min(Math.max(minEndTime, currentTime), maxEndTime)
            const newDuration = newEndTime - startTime

            // 根据duration比例计算sourceEndTime
            const newSourceEndTime = originalDuration - (sourceStartTime + newDuration)

            if (newSourceEndTime >= 0 && sourceStartTime + newDuration <= originalDuration) {
                selectedClip.value.endTime = newEndTime
                selectedClip.value.duration = newDuration
                selectedClip.value.sourceEndTime = newSourceEndTime
            }
        }
    } else {
        // 图片和其他类型的调整逻辑
        if (resizeType.value === 'left') {
            const endTime = Number(selectedClip.value.endTime)

            // 只确保不超过最小宽度且不小于0
            const maxStartTime = endTime - minClipDuration.value
            const newStartTime = Math.min(Math.max(0, currentTime), maxStartTime)
            const newDuration = endTime - newStartTime

            selectedClip.value.startTime = newStartTime
            selectedClip.value.duration = newDuration
        } else if (resizeType.value === 'right') {
            const startTime = Number(selectedClip.value.startTime)

            // 只确保不小于最小宽度
            const minEndTime = startTime + minClipDuration.value
            const newEndTime = Math.max(minEndTime, currentTime)
            const newDuration = newEndTime - startTime

            selectedClip.value.endTime = newEndTime
            selectedClip.value.duration = newDuration
        }
    }
}

// 停止调整大小
const stopResize = () => {
    if (isResizing.value && selectedClip.value) {
        // 确保最终状态的一致性，并确保所有值都是 number 类型
        const startTime = Number(selectedClip.value.startTime)
        const duration = Number(selectedClip.value.duration)
        selectedClip.value.endTime = startTime + duration
        selectedClip.value.startTime = startTime
        selectedClip.value.duration = duration
        selectedClip.value.sourceStartTime = Number(selectedClip.value.sourceStartTime)
        selectedClip.value.sourceEndTime = Number(selectedClip.value.sourceEndTime)
        selectedClip.value.originalDuration = Number(selectedClip.value.originalDuration)
        // 发布更新
        trackStore.publishClipUpdate(selectedClip.value, 'resize')
    }

    isResizing.value = false
    resizeType.value = null
    saveHistoryState()
    document.removeEventListener('mousemove', handleResize)
    document.removeEventListener('mouseup', stopResize)
}

// 添加新的状态用于跟踪鼠标按下位置
const mouseDownPosition = ref({ x: 0, y: 0 })
const DRAG_THRESHOLD = 5 // 拖动阈值，像素单位

const originTrackId = ref<string>('') // 修改为string类型
// 处理片段点击
const handleClipMouseDown = (clip: any, trackId: string, event: MouseEvent) => {
    if (isResizing.value) return
    event.preventDefault()
    event.stopPropagation()

    selectedClip.value = clip
    // 计算点击位置对应的时间
    const rect = trackContainer.value.getBoundingClientRect()
    const relativeX = event.clientX - rect.left + trackContainer.value.scrollLeft
    const clickTime = relativeX / frameLength.value

    // 记录初始点击位置
    mouseDownPosition.value = { x: event.clientX, y: event.clientY }
    originTrackId.value = trackId

    // 添加鼠标移动监听
    const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = Math.abs(moveEvent.clientX - mouseDownPosition.value.x)
        const deltaY = Math.abs(moveEvent.clientY - mouseDownPosition.value.y)

        // 如果移动距离超过阈值，则开始拖动
        if (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
            startDrag(clip, event)
        }
    }

    const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)

        console.log('handleClipMouseDown', clip)
        emit('activeClip', clip)
        // 如果没有移动超过阈值，则视为点击，更新播放头位置
        emit('timeUpdate', clickTime)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
}

// 拖动相关状态
const isDragging = ref(false)
const dragType = ref<'same' | 'other' | null>(null)
const draggedClip = ref<any>(null)
const mouseOffsetInClip = ref(0)  // 记录鼠标在clip内的相对位置

// 添加吸附相关的常量
const SNAP_THRESHOLD = 15 // 吸附阈值(像素)

// 添加吸附状态
const isSnapped = ref(false)
const snappedPosition = ref<number | null>(null)

// 开始拖动
const startDrag = (clip: any, event: MouseEvent) => {
    if (!trackContainer.value) return

    isDragging.value = true
    draggedClip.value = clip
    selectedClip.value = clip
    clip.selected = true

    const containerRect = trackContainer.value.getBoundingClientRect()
    const clipStartPixel = Number(clip.startTime) * frameLength.value + containerRect.left - trackContainer.value.scrollLeft
    mouseOffsetInClip.value = event.clientX - clipStartPixel
    lastMouseX.value = event.clientX

    // 添加事件监听
    window.addEventListener('mousemove', handleDrag, { capture: true, passive: false })
    window.addEventListener('mouseup', stopDrag, { capture: true })

    // 开始自动滚动
    handleAutoScroll()
}

// 处理自动滚动
const handleAutoScroll = () => {
    if (!isDragging.value || !draggedClip.value || !trackContainer.value) return

    const containerRect = trackContainer.value.getBoundingClientRect()
    let scrollSpeed = 0
    let didScroll = false

    if (scrollDirection.value === 'right') {
        // 计算鼠标距离右边缘的距离
        const distanceToEdge = containerRect.right - lastMouseX.value
        // 根据距离计算速度比例 (0-1)
        const speedRatio = 1 - (distanceToEdge / SCROLL_THRESHOLD)
        // 应用渐进速度
        scrollSpeed = Math.max(1, Math.round(maxScrollSpeed.value * speedRatio))
        trackContainer.value.scrollLeft += scrollSpeed
        didScroll = true
    } else if (scrollDirection.value === 'left') {
        // 计算鼠标距离左边缘的距离
        const distanceToEdge = lastMouseX.value - containerRect.left
        // 根据距离计算速度比例 (0-1)
        const speedRatio = 1 - (distanceToEdge / SCROLL_THRESHOLD)
        // 应用渐进速度
        scrollSpeed = Math.max(1, Math.round(maxScrollSpeed.value * speedRatio))
        trackContainer.value.scrollLeft -= scrollSpeed
        didScroll = true
    } else if (scrollDirection.value === 'up') {
        // 计算鼠标距离上边缘的距离
        const distanceToEdge = lastMouseY.value - containerRect.top
        // 根据距离计算速度比例 (0-1)
        const speedRatio = 1 - (distanceToEdge / SCROLL_THRESHOLD)
        // 应用渐进速度
        scrollSpeed = Math.max(1, Math.round(maxScrollSpeed.value * speedRatio))
        trackContainer.value.scrollTop -= scrollSpeed
        didScroll = true
    } else if (scrollDirection.value === 'down') {
        // 计算鼠标距离下边缘的距离
        const distanceToEdge = containerRect.bottom - lastMouseY.value
        // 根据距离计算速度比例 (0-1)
        const speedRatio = 1 - (distanceToEdge / SCROLL_THRESHOLD)
        // 应用渐进速度
        scrollSpeed = Math.max(1, Math.round(maxScrollSpeed.value * speedRatio))
        trackContainer.value.scrollTop += scrollSpeed
        didScroll = true
    }

    // 如果发生了滚动，更新 clip 位置
    if (didScroll) {
        // 计算新的clip起始位置（基于鼠标位置和偏移量）
        const mouseXInContainer = lastMouseX.value - containerRect.left + trackContainer.value.scrollLeft
        const newStartPixel = mouseXInContainer - mouseOffsetInClip.value
        const newStartTime = Math.max(0, newStartPixel / frameLength.value)
        const duration = Number(draggedClip.value.duration)

        // 更新clip位置
        draggedClip.value.startTime = newStartTime
        draggedClip.value.endTime = newStartTime + duration
    }

    if (scrollDirection.value) {
        // 继续动画循环
        const id = requestAnimationFrame(handleAutoScroll)
        animationFrameId.value = id
    }
}

// 修改处理拖动函数
const handleDrag = (event: MouseEvent) => {
    if (!isDragging.value || !draggedClip.value || !trackContainer.value) return

    event.preventDefault()
    event.stopPropagation()

    // 更新最后的鼠标位置
    lastMouseX.value = event.clientX
    lastMouseY.value = event.clientY

    // 获取当前鼠标所在位置的el
    const el = document.elementFromPoint(event.clientX, event.clientY)
    const clipId = el?.getAttribute('data-clip')
    let currentTrackId = null
    if (clipId) {
        currentTrackId = el?.parentElement?.getAttribute('data-track')
    } else {
        currentTrackId = el?.getAttribute('data-track')
    }

    const containerRect = trackContainer.value.getBoundingClientRect()
    const mouseXInContainer = event.clientX - containerRect.left + trackContainer.value.scrollLeft
    const currentPixel = mouseXInContainer - mouseOffsetInClip.value
    const duration = Number(draggedClip.value.duration)

    // 获取当前轨道
    const currentTrack = currentTrackId ? props.tracks.find(t => t.id === currentTrackId) : null
    if (currentTrack) {
        // 获取当前轨道上的其他clips并按时间排序
        const otherClips = currentTrack.clips
            .filter(c => c.id !== draggedClip.value.id)
            .sort((a, b) => Number(a.startTime) - Number(b.startTime))

        // 如果已经吸附，检查是否应该脱离吸附
        if (isSnapped.value && snappedPosition.value !== null) {
            const distanceFromSnapped = Math.abs(currentPixel - snappedPosition.value)
            // 只有当移动距离超过阈值一半时才脱离吸附
            if (distanceFromSnapped > SNAP_THRESHOLD / 2) {
                isSnapped.value = false
                snappedPosition.value = null
            } else {
                // 保持在吸附位置
                const snapTime = snappedPosition.value / frameLength.value
                draggedClip.value.startTime = snapTime
                draggedClip.value.endTime = snapTime + duration
                return
            }
        }

        // 如果没有吸附,寻找新的吸附点
        for (const clip of otherClips) {
            const clipStartPixel = Number(clip.startTime) * frameLength.value
            const clipEndPixel = Number(clip.endTime) * frameLength.value

            // 检查开始位置是否需要吸附到其他片段的结束位置
            const diffStart = Math.abs(currentPixel - clipEndPixel)
            if (diffStart <= SNAP_THRESHOLD) {
                isSnapped.value = true
                snappedPosition.value = clipEndPixel
                draggedClip.value.startTime = clipEndPixel / frameLength.value
                draggedClip.value.endTime = (clipEndPixel / frameLength.value) + duration
                return
            }

            // 检查结束位置是否需要吸附到其他片段的开始位置
            const diffEnd = Math.abs((currentPixel + duration * frameLength.value) - clipStartPixel)
            if (diffEnd <= SNAP_THRESHOLD) {
                isSnapped.value = true
                snappedPosition.value = clipStartPixel - (duration * frameLength.value)
                draggedClip.value.startTime = (clipStartPixel / frameLength.value) - duration
                draggedClip.value.endTime = clipStartPixel / frameLength.value
                return
            }
        }
    }

    // 如果没有吸附,正常移动
    draggedClip.value.startTime = Math.max(0, currentPixel / frameLength.value)
    draggedClip.value.endTime = Math.max(duration, currentPixel / frameLength.value + duration)

    // 如果拖动到其他轨道
    if (currentTrackId && currentTrackId !== originTrackId.value) {
        const targetTrackIndex = props.tracks.findIndex(t => t.id === currentTrackId)
        if (targetTrackIndex !== -1) {
            // 从原轨道移除
            const originalTrack = props.tracks.find(t => t.id === originTrackId.value)
            if (originalTrack) {
                const clipIndex = originalTrack.clips.findIndex(c => c.id === draggedClip.value.id)
                if (clipIndex !== -1) {
                    originalTrack.clips.splice(clipIndex, 1)
                    // 添加到新轨道
                    props.tracks[targetTrackIndex].clips.push(draggedClip.value)
                    props.tracks[targetTrackIndex].clips.sort((a, b) => Number(a.startTime) - Number(b.startTime))
                    // 更新原始轨道ID
                    originTrackId.value = currentTrackId
                }
            }
        }
        dragType.value = 'other'
    } else {
        dragType.value = 'same'
    }

    // 检查是否需要自动滚动
    if (event.clientX > containerRect.right - SCROLL_THRESHOLD) {
        if (scrollDirection.value !== 'right') {
            scrollDirection.value = 'right'
            handleAutoScroll()
        }
    } else if (event.clientX < containerRect.left + SCROLL_THRESHOLD) {
        if (scrollDirection.value !== 'left') {
            scrollDirection.value = 'left'
            handleAutoScroll()
        }
    } else if (event.clientY < containerRect.top + SCROLL_THRESHOLD) {
        if (scrollDirection.value !== 'up') {
            scrollDirection.value = 'up'
            handleAutoScroll()
        }
    } else if (event.clientY > containerRect.bottom - SCROLL_THRESHOLD) {
        if (scrollDirection.value !== 'down') {
            scrollDirection.value = 'down'
            handleAutoScroll()
        }
    } else {
        if (scrollDirection.value !== null) {
            scrollDirection.value = null
        }
    }
}

// 修改 stopDrag 函数，重置吸附状态
const stopDrag = (event?: MouseEvent) => {
    if (!isDragging.value || !draggedClip.value) return

    if (event) {
        event.preventDefault()
        event.stopPropagation()
    }

    // 重置吸附状态
    isSnapped.value = false
    snappedPosition.value = null

    // 停止自动滚动
    if (animationFrameId.value !== null) {
        cancelAnimationFrame(animationFrameId.value)
        animationFrameId.value = null
    }

    // 保持选中状态
    draggedClip.value.selected = true
    selectedClip.value = draggedClip.value
    const track = props.tracks.find(t => t.id === originTrackId.value)
    shiftFollowingClips(track, draggedClip.value)
    trackStore.publishClipUpdate(draggedClip.value)

    // 清理状态
    isDragging.value = false
    scrollDirection.value = null
    draggedClip.value = null
    originTrackId.value = ''
    mouseOffsetInClip.value = 0
    saveHistoryState()

    // 移除事件监听
    window.removeEventListener('mousemove', handleDrag, { capture: true })
    window.removeEventListener('mouseup', stopDrag, { capture: true })
}

// 在组件卸载时清理
onUnmounted(() => {
    if (animationFrameId.value !== null) {
        cancelAnimationFrame(animationFrameId.value)
    }
    window.removeEventListener('mousemove', handleDrag, { capture: true })
    window.removeEventListener('mouseup', stopDrag, { capture: true })
})

const handleTimeUpdate = (time: number) => {
    // 触发播放时间更新事件
    emit('timeUpdate', time)
}

const handleDeleteClip = (clip: any, trackIndex: number) => {
    const track = props.tracks[trackIndex]
    const clipIndex = track.clips.findIndex(c => c.id === clip.id)
    if (clipIndex !== -1) {
        track.clips.splice(clipIndex, 1)
        trackStore.publishClipUpdate(clip, 'delete')
        // 如果轨道为空，可以选择是否删除轨道
        if (track.clips.length === 0) {
            props.tracks.splice(trackIndex, 1)
        }
    }
}

// 添加轨道容器的引用
const trackContainer = ref<HTMLElement | null>(null)

// 处理时间标尺滚动
const handleRulerScroll = (delta: number) => {
    console.log('handleRulerScroll', delta)
    if (trackContainer.value) {
        const maxScroll = trackContainer.value.scrollWidth - trackContainer.value.clientWidth
        const newScrollLeft = Math.max(0, Math.min(
            trackContainer.value.scrollLeft + delta,
            maxScroll
        ))
        trackContainer.value.scrollLeft = newScrollLeft
    }
}

const route = useRoute()
const projectId = Number(route.params.id)

const canUndo = computed(() => trackStore.canUndo)
const canRedo = ref(false)

watch(() => props.tracks, async () => {
    canRedo.value = await trackStore.getCanRedo(projectId)
})


const handleUndo = async () => {
    if (!canUndo.value) return
    const previousTracks = await trackStore.undo(projectId)
    if (previousTracks) {
        emit('update:tracks', previousTracks)
        emit('refreshPlayer')
    }
}

const handleRedo = async () => {
    if (!canRedo.value) return
    const nextTracks = await trackStore.redo(projectId)
    if (nextTracks) {
        emit('update:tracks', nextTracks)
        emit('refreshPlayer')
    }
}

const handleReset = async () => {
    emit('update:tracks', [])
    await trackStore.clearHistory(projectId)
    emit('refreshPlayer')
}

// 保存历史记录
const saveHistoryState = async () => {
    if (trackStore.saveHistoryState) {
        deleteEmptyTrack()
        await trackStore.saveHistoryState(projectId, JSON.parse(JSON.stringify(props.tracks)))
    }
}

// 删除没有clip的轨道
const deleteEmptyTrack = () => {
    emit('delete-empty-track')
}

// 添加分割相关的状态
const canSplit = ref(false)
const handleBackgroundClick = () => {
    canSplit.value = false
    emit('activeClip', null)
}

// 监听选中片段变化
watch([() => selectedClip.value, () => props.currentTime], () => {
    // 如果没有选中片段,则不能分割
    if (!selectedClip.value) {
        canSplit.value = false
        return
    }

    // 检查是否是可分割的类型
    const validTypes = ['video', 'audio', 'image']
    const isValidType = validTypes.includes(selectedClip.value.type)

    // 检查当前时间是否在片段范围内
    const isInRange = props.currentTime > Number(selectedClip.value.startTime)
        && props.currentTime < Number(selectedClip.value.endTime)

    canSplit.value = isValidType && isInRange
})

// 处理分割
const handleSplit = async () => {
    const nextClip = cloneDeep(selectedClip.value)
    nextClip.id = v4()
    nextClip.startTime = props.currentTime
    nextClip.endTime = Number(nextClip.endTime)

    // 根据类型处理不同的时间属性
    if (nextClip.type === 'text') {
        // 文本类型不需要处理 sourceStartTime 和 sourceEndTime
        nextClip.duration = Number(selectedClip.value.duration) - (props.currentTime - Number(selectedClip.value.startTime))
        selectedClip.value.endTime = props.currentTime
        selectedClip.value.duration = props.currentTime - Number(selectedClip.value.startTime)
    } else {
        // 视频和音频类型需要处理 sourceStartTime 和 sourceEndTime
        nextClip.sourceStartTime = props.currentTime - Number(selectedClip.value.startTime) + Number(nextClip.sourceStartTime)
        nextClip.duration = Number(selectedClip.value.duration) - nextClip.startTime + selectedClip.value.startTime
        selectedClip.value.endTime = props.currentTime
        selectedClip.value.duration = props.currentTime - Number(selectedClip.value.startTime)
        selectedClip.value.sourceEndTime = Number(selectedClip.value.sourceEndTime) - (props.currentTime - Number(selectedClip.value.startTime))
    }

    console.log(nextClip)
    getClipTrack(selectedClip.value).clips.push(nextClip)
    trackStore.publishClipUpdate(selectedClip.value)
    emit('add-clip', nextClip)
    saveHistoryState()
}

// 获取clip所在轨道
const getClipTrack = (clip: TrackClip) => {
    return props.tracks.find(track => track.clips.some(c => c.id === clip.id))
}

// 删除选中clip
const handleDelete = () => {
    const clip = selectedClip.value
    if (!clip) return
    trackStore.publishClipUpdate(clip, 'delete')
    props.tracks.find(track => track.clips.some(c => c.id === clip.id))?.clips.splice(props.tracks.find(track => track.clips.some(c => c.id === clip.id))?.clips.findIndex(c => c.id === clip.id), 1)
    saveHistoryState()
}

// 导出
const handleExport = () => {
    emit('handleExport')
}

defineExpose({
    activeClip
})
</script>
