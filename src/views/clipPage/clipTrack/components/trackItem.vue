<template>
    <div class="w-full h-full p-1 flex flex-col justify-center items-center pointer-events-none select-none">
        <!-- 视频 clip -->
        <template v-if="clip.type === 'video'">
            <div class="flex flex-nowrap gap-0.5 items-center overflow-hidden px-1 h-full">
                <template v-if="displayThumbnails.length > 0" v-loading="displayThumbnails.length === 0">
                    <img v-for="item in displayThumbnails" :key="item.timestamp" :src="item.url"
                        class="h-[90%] shrink-0 grow-0 object-cover rounded" :style="{ width: `${70}px` }" />
                </template>
            </div>
        </template>
        <!-- 图片 clip -->
        <template v-if="clip.type === 'image'">
            <div class="flex flex-nowrap gap-0.5 items-center overflow-hidden px-1 h-full">
                <template v-if="displayThumbnails.length > 0" v-loading="displayThumbnails.length === 0">
                    <img v-for="item in displayThumbnails" :key="item.timestamp" :src="item.url"
                        class="h-[90%] shrink-0 grow-0 object-cover rounded" :style="{ width: `${70}px` }" />
                </template>
            </div>
        </template>
        <!-- 音频 clip -->
        <template v-else-if="clip.type === 'audio'">
            <div class="w-full h-full flex flex-col relative rounded">
                <!-- 波形图 -->
                <div class="absolute inset-0">
                    <canvas ref="waveformCanvas" class="w-full h-full"></canvas>
                </div>
                <!-- 名称 -->
                <div v-if="hovered"
                    class="absolute inset-0 w-auto h-full flex items-center bg-[#ffffff] bg-opacity-10 text-[#000000]">
                    <span class="text-base inline-block  truncate px-5 z-10">{{ clip.name }}</span>
                </div>
            </div>
        </template>
        <!-- 文字 clip -->
        <template v-else-if="clip.type === 'text'">
            <div class="mt-1 text-bigger pl-4 text-white whitespace-nowrap overflow-hidden text-ellipsis w-full">
                {{ clip.textConfig.content }}
            </div>
        </template>
        <!-- 贴图 clip -->
        <template v-else-if="clip.type === 'sticker'">
            <div class="mt-1 text-xs text-white whitespace-nowrap overflow-hidden text-ellipsis w-full">
                {{ clip.name }}
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, nextTick } from 'vue'

const props = defineProps({
    clip: {
        type: Object,
        required: true
    },
    zoom: {
        type: Number,
        default: 1
    },
    frameLength: {
        type: Number,
        default: 20
    },
    hovered: {
        type: Boolean,
        default: false
    }
})

// 每个缩略图宽度对应的时长(秒)
const THUMBNAIL_WIDTH_DURATION = computed(() => 70 / props.frameLength)

const displayThumbnails = ref([])
const waveformCanvas = ref<HTMLCanvasElement | null>(null)

// 计算缩略图的函数
const updateDisplayThumbnails = () => {
    if (!props.clip.thumbnail) {
        displayThumbnails.value = []
        return
    }

    const duration = Number(props.clip.duration)
    // 计算需要展示的缩略图数量
    const thumbnailCount = Math.ceil(duration / THUMBNAIL_WIDTH_DURATION.value)

    const result = []

    if (props.clip.type === 'image' && props.clip.thumbnail.length > 0) {
        // 对于图片类型,重复使用timestamp为0的缩略图
        const thumbnail = props.clip.thumbnail[0]
        for (let i = 0; i < thumbnailCount; i++) {
            result.push(thumbnail)
        }
    } else if (props.clip.type === 'video' && props.clip.thumbnail.length > 0) {
        // 视频类型保持原有逻辑
        const availableThumbnails = props.clip.thumbnail
        let lastThumbnail = availableThumbnails[0]

        for (let i = 0; i < thumbnailCount; i++) {
            const targetTime = (i * THUMBNAIL_WIDTH_DURATION.value)
            const closestThumbnail = availableThumbnails.find(item => item.timestamp / 1e6 >= targetTime)
                || lastThumbnail
                || availableThumbnails[availableThumbnails.length - 1]

            if (closestThumbnail) {
                result.push(closestThumbnail)
                lastThumbnail = closestThumbnail
            }
        }
    }

    displayThumbnails.value = result
}

// 绘制波形
const drawWaveform = () => {
    if (!waveformCanvas.value || !props.clip.volumeData) return

    const canvas = waveformCanvas.value
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 设置canvas尺寸为实际显示尺寸
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const data = props.clip.volumeData.slice(props.clip.sourceStartTime / props.clip.originalDuration * props.clip.volumeData.length, (props.clip.originalDuration - props.clip.sourceEndTime) / props.clip.originalDuration * props.clip.volumeData.length)
    const barWidth = 2 // 柱子宽度
    const gap = 2 // 间隔
    const barCount = Math.floor(canvas.width / (barWidth + gap)) // 计算可以显示的柱子数量
    const maxHeight = canvas.height * 0.8 // 最大高度为canvas高度的80%

    // 根据clip时长和数据点数量计算采样间隔
    const samplingInterval = data.length / barCount

    // 设置颜色
    ctx.fillStyle = '#ffffff80'

    // 绘制柱状图
    for (let i = 0; i < barCount; i++) {
        // 计算当前柱子对应的数据索引
        const dataIndex = Math.floor(i * samplingInterval)

        // 获取音量值
        const value = data[dataIndex] || 0

        // 计算柱子高度
        const height = value * maxHeight

        // 计算绘制位置
        const x = i * (barWidth + gap)
        const y = (canvas.height - height) / 2

        // 绘制柱子
        ctx.fillRect(x, y, barWidth, height)
    }
}

// 监听所有可能影响显示的属性
watch([
    () => props.frameLength,
    () => props.zoom,
    () => props.clip.duration,
    () => props.clip.sourceStartTime,
    () => props.clip.sourceEndTime,
    () => props.clip.thumbnail
], () => {
    if (!props.clip) return
    if ((props.clip.type === 'video' || props.clip.type === 'image')) {
        nextTick(() => {
            updateDisplayThumbnails()
        })
    }
}, { deep: true, immediate: true })

// 单独监听 thumbnail 的变化
watch(() => props.clip.thumbnail, () => {
    if (!props.clip) return
    if ((props.clip.type === 'video' || props.clip.type === 'image')) {
        nextTick(() => {
            updateDisplayThumbnails()
        })
    }
}, { deep: true, immediate: true })

// 监听窗口大小变化
onMounted(() => {
    if (props.clip.type === 'audio') {
        const resizeObserver = new ResizeObserver(() => {
            drawWaveform()
        })
        if (waveformCanvas.value) {
            resizeObserver.observe(waveformCanvas.value)
        }
    }
})
</script>

<style scoped>
canvas {
    image-rendering: pixelated;
}
</style>
