<template>
    <!-- 时间刻度容器 -->
    <div class="ticks-container h-10" ref="rulerContainer" :style="{ width: totalWidth + 'px' }"
        @mousedown="handleMouseDown">
        <div class="ticks h-full">
            <div v-for="tick in totalTicks" :key="tick" class="tick h-full"
                :style="{ left: (tick * tickSpacing) + 'px' }">
                <!-- 小刻度（每5个刻度显示） -->
                <div v-if="tick % 5 === 0" class="tick-mark"></div>
                <!-- 大刻度和时间标签（每50个刻度显示） -->
                <div v-if="tick % 50 === 0" class="tick-mark-long"></div>
                <span v-if="tick % 50 === 0" class="tick-label">
                    {{ formatTime(tick) }}
                </span>
            </div>
        </div>
    </div>
    <!-- 播放头指示器 -->
    <div class="playhead" :style="{ left: playheadPosition + 'px' }" @mousedown="startDragPlayhead">
        <div class="playhead-line"></div>
        <div class="playhead-triangle"></div>
    </div>
</template>

<script setup lang="ts">
// Props 定义
const props = defineProps({
    duration: { type: Number, required: true }, // 总时长(秒)
    zoom: { type: Number, default: 1 }, // 缩放比例
    currentTime: { type: Number, default: 0 }, // 当前播放时间
    totalWidth: { type: Number, default: 0 } // 总宽度
})

const emit = defineEmits(['timeUpdate', 'scroll'])

// DOM引用
const rulerContainer = ref<HTMLElement | null>(null)

// 基础配置
const BASE_TICK_SPACING = 3 // 基础刻度间距(px)
const SCROLL_THRESHOLD = 100 // 边缘滚动触发阈值（像素）
const SCROLL_SPEED = 15 // 滚动速度（像素/帧）

// 计算属性
const tickSpacing = computed(() => BASE_TICK_SPACING * props.zoom)
const totalTicks = computed(() => Math.ceil(props.duration * 10)) // 每秒10个刻度
const playheadPosition = computed(() => props.currentTime * BASE_TICK_SPACING * props.zoom * 10)

// 拖动状态管理
const isDragging = ref(false)
const lastMouseX = ref(0)
const scrollDirection = ref<'left' | 'right' | null>(null)
let scrollAnimationId: number | null = null
let lastClientX = ref(0) // 记录上一次的鼠标位置，用于判断移动方向

// 时间格式化
const formatTime = (tick: number) => {
    const seconds = Math.floor(tick / 10)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

// 点击时间刻度处理
const handleMouseDown = (event: MouseEvent) => {
    if (!rulerContainer.value) return
    const rect = rulerContainer.value.getBoundingClientRect()
    const relativeX = event.clientX - rect.left
    const clickTime = relativeX / (BASE_TICK_SPACING * props.zoom * 10)

    // 更新时间并开始拖动
    emit('timeUpdate', Math.max(0, Math.min(clickTime, props.duration)))
    startDragging(event)
}

// 开始拖动播放头
const startDragPlayhead = (e: MouseEvent) => {
    e.stopPropagation()
    if (!rulerContainer.value) return

    const rect = rulerContainer.value.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const time = Math.max(0, Math.min(mouseX / (BASE_TICK_SPACING * props.zoom * 10), props.duration))
    emit('timeUpdate', time)
    startDragging(e)
}

// 通用开始拖动逻辑
const startDragging = (e: MouseEvent) => {
    isDragging.value = true
    lastMouseX.value = e.clientX
    lastClientX.value = e.clientX
    document.addEventListener('mousemove', handleDragPlayhead)
    document.addEventListener('mouseup', stopDragPlayhead)
}

// 自动滚动处理
const handleAutoScroll = () => {
    if (!isDragging.value || !rulerContainer.value) return
    const parentContainer = rulerContainer.value.parentElement
    if (!parentContainer) return

    if (scrollDirection.value) {
        emit('scroll', scrollDirection.value === 'right' ? SCROLL_SPEED : -SCROLL_SPEED)

        const rect = rulerContainer.value.getBoundingClientRect()
        const mouseX = lastMouseX.value - rect.left
        const time = Math.max(0, Math.min(mouseX / (BASE_TICK_SPACING * props.zoom * 10), props.duration))
        emit('timeUpdate', time)

        scrollAnimationId = requestAnimationFrame(handleAutoScroll)
    }
}

// 拖动播放头处理
const handleDragPlayhead = (e: MouseEvent) => {
    if (!isDragging.value || !rulerContainer.value) return
    const rect = rulerContainer.value.getBoundingClientRect()
    const parentContainer = rulerContainer.value.parentElement
    if (!parentContainer) return

    const mouseX = e.clientX - rect.left
    const deltaX = e.clientX - lastClientX.value
    lastClientX.value = e.clientX

    // 检查是否需要边缘滚动
    if (deltaX !== 0) {
        const containerRect = parentContainer.getBoundingClientRect()
        // 只在实际移动方向上检查是否需要滚动
        if (deltaX > 0) { // 向右移动
            if (e.clientX > containerRect.right - SCROLL_THRESHOLD) {
                if (scrollDirection.value !== 'right') {
                    scrollDirection.value = 'right'
                    handleAutoScroll()
                }
            } else {
                scrollDirection.value = null
            }
        } else { // 向左移动
            if (e.clientX < containerRect.left + SCROLL_THRESHOLD) {
                if (scrollDirection.value !== 'left') {
                    scrollDirection.value = 'left'
                    handleAutoScroll()
                }
            } else {
                scrollDirection.value = null
            }
        }
    }

    // 更新播放头位置
    const time = Math.max(0, Math.min(mouseX / (BASE_TICK_SPACING * props.zoom * 10), props.duration))
    emit('timeUpdate', time)
    lastMouseX.value = e.clientX
}

// 停止拖动
const stopDragPlayhead = () => {
    isDragging.value = false
    scrollDirection.value = null
    document.removeEventListener('mousemove', handleDragPlayhead)
    document.removeEventListener('mouseup', stopDragPlayhead)
    if (scrollAnimationId !== null) {
        cancelAnimationFrame(scrollAnimationId)
        scrollAnimationId = null
    }
}

// 清理
onUnmounted(() => {
    if (scrollAnimationId !== null) {
        cancelAnimationFrame(scrollAnimationId)
    }
})
</script>

<style scoped>
.ticks-container {
    position: relative;
    user-select: none;
}

.ticks {
    position: relative;
    height: 100%;
    user-select: none;
}

.tick {
    position: absolute;
    height: 100%;
    pointer-events: none;
    user-select: none;
}

.tick-mark {
    width: 1px;
    height: 5px;
    background: #666;
    position: absolute;
    top: 25px;
}

.tick-mark-long {
    width: 1px;
    height: 10px;
    background: #999;
    position: absolute;
    top: 20px;
}

.tick-label {
    position: absolute;
    top: 4px;
    transform: translateX(-50%);
    color: #999;
    font-size: 11px;
    white-space: nowrap;
    user-select: none;
}

.playhead {
    position: absolute;
    top: 0;
    width: 0;
    height: 100%;
    cursor: ew-resize;
    z-index: 10;
}

.playhead-line {
    position: absolute;
    width: 2px;
    height: 100%;
    background: #fff;
    left: -1px;
}

.playhead-triangle {
    position: absolute;
    top: 0;
    left: -6px;
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 6px solid #fff;
}
</style>