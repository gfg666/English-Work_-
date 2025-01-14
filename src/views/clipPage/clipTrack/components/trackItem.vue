<!--
 * 轨道项目组件
 * 负责显示轨道中的各种媒体项目（视频、音频、图片、文字等）
 * 支持缩略图、波形图等不同类型的预览
-->
<template>
    <div class="w-full h-full p-1 flex flex-col justify-center items-center pointer-events-none select-none">
        <!-- 视频片段 -->
        <template v-if="clip.type === 'video'">
            <div class="flex flex-nowrap gap-0.5 items-center overflow-hidden px-1 h-full">
                <template v-if="displayThumbnails.length > 0" v-loading="displayThumbnails.length === 0">
                    <img v-for="item in displayThumbnails" :key="item.timestamp" :src="item.url"
                        class="h-[90%] shrink-0 grow-0 object-cover rounded" :style="{ width: `${70}px` }" />
                </template>
            </div>
        </template>

        <!-- 图片片段 -->
        <template v-if="clip.type === 'image'">
            <div class="flex flex-nowrap gap-0.5 items-center overflow-hidden px-1 h-full">
                <template v-if="displayThumbnails.length > 0" v-loading="displayThumbnails.length === 0">
                    <img v-for="item in displayThumbnails" :key="item.timestamp" :src="item.url"
                        class="h-[90%] shrink-0 grow-0 object-cover rounded" :style="{ width: `${70}px` }" />
                </template>
            </div>
        </template>

        <!-- 音频片段 -->
        <template v-else-if="clip.type === 'audio'">
            <div class="w-full h-full flex flex-col relative rounded">
                <!-- 波形图 -->
                <div class="absolute inset-0">
                    <canvas ref="waveformCanvas" class="w-full h-full"></canvas>
                </div>
                <!-- 名称 -->
                <div v-if="hovered"
                    class="absolute inset-0 w-auto h-full flex items-center bg-[#ffffff] bg-opacity-10 text-[#000000]">
                    <span class="text-base inline-block truncate px-5 z-10">{{ clip.name }}</span>
                </div>
            </div>
        </template>

        <!-- 文字片段 -->
        <template v-else-if="clip.type === 'text'">
            <!-- 类型标识图标 -->
            <div
                class="flex items-center text-bigger text-white whitespace-nowrap overflow-hidden text-ellipsis w-full">
                <Icon icon="material-symbols-light:text-fields" class="w-6 h-6 absolute left-1 text-white">
                </Icon>
                <div class="pl-6.5">
                    {{ clip.textConfig.content }}
                </div>
            </div>
        </template>

        <!-- 滤镜片段 -->
        <template v-else-if="clip.type === 'filter'">
            <div
                class="flex items-center text-bigger text-white whitespace-nowrap overflow-hidden text-ellipsis w-full">
                <Icon icon="material-symbols-light:magnify-fullscreen-outline-rounded"
                    class="w-6 h-6 absolute left-1 text-white">
                </Icon>
                <div class="pl-6.5">
                    <span>{{ getFilterName(clip.filterType) }}</span>
                    <span v-if="clip.intensity !== undefined">
                        {{ Math.round(clip.intensity) }}%
                    </span>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, nextTick } from 'vue'
import type { TrackClip, FilterType } from '@/types/track'
import { Icon } from '@iconify/vue';

interface Thumbnail {
    timestamp: number
    url: string
}

// Props
const props = defineProps({
    clip: {
        type: Object as () => TrackClip,
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

// 计算属性
const THUMBNAIL_WIDTH_DURATION = computed(() => 70 / props.frameLength)

// 状态变量
const displayThumbnails = ref<Thumbnail[]>([])
const waveformCanvas = ref<HTMLCanvasElement | null>(null)

// 缩略图相关方法
const updateDisplayThumbnails = () => {
    try {
        if (!props.clip.thumbnail || !Array.isArray(props.clip.thumbnail)) {
            displayThumbnails.value = []
            return
        }

        const duration = Number(props.clip.duration)
        if (isNaN(duration) || duration <= 0) {
            console.warn('Invalid clip duration:', duration)
            return
        }

        const thumbnailCount = Math.ceil(duration / THUMBNAIL_WIDTH_DURATION.value)
        const result: Thumbnail[] = []

        if (props.clip.type === 'image' && props.clip.thumbnail.length > 0) {
            // 图片类型：重复使用第一帧
            const thumbnail = props.clip.thumbnail[0] as Thumbnail
            for (let i = 0; i < thumbnailCount; i++) {
                result.push(thumbnail)
            }
        } else if (props.clip.type === 'video' && props.clip.thumbnail.length > 0) {
            // 视频类型：按时间分布选择合适的缩略图
            const availableThumbnails = props.clip.thumbnail as Thumbnail[]
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
    } catch (error) {
        console.error('Error updating thumbnails:', error)
        displayThumbnails.value = []
    }
}

// 波形图相关方法
const drawWaveform = () => {
    try {
        if (!waveformCanvas.value || !props.clip.volumeData) return

        const canvas = waveformCanvas.value
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // 设置canvas尺寸
        const rect = canvas.getBoundingClientRect()
        canvas.width = rect.width * window.devicePixelRatio
        canvas.height = rect.height * window.devicePixelRatio

        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // 准备波形数据
        if (!props.clip.originalDuration) {
            console.warn('Missing originalDuration for audio clip')
            return
        }

        const data = props.clip.volumeData.slice(
            props.clip.sourceStartTime / props.clip.originalDuration * props.clip.volumeData.length,
            (props.clip.originalDuration - props.clip.sourceEndTime) / props.clip.originalDuration * props.clip.volumeData.length
        )

        if (!data.length) {
            console.warn('No volume data available')
            return
        }

        // 设置绘制参数
        const barWidth = 2
        const gap = 2
        const barCount = Math.floor(canvas.width / (barWidth + gap))
        const maxHeight = canvas.height * 0.8
        const samplingInterval = data.length / barCount

        // 设置样式
        ctx.fillStyle = '#ffffff80'

        // 绘制波形
        for (let i = 0; i < barCount; i++) {
            const dataIndex = Math.floor(i * samplingInterval)
            const value = data[dataIndex] || 0
            const height = value * maxHeight
            const x = i * (barWidth + gap)
            const y = (canvas.height - height) / 2

            ctx.fillRect(x, y, barWidth, height)
        }
    } catch (error) {
        console.error('Error drawing waveform:', error)
    }
}

// 滤镜相关方法
const getFilterName = (filterType?: FilterType) => {
    if (!filterType) return '未知滤镜'
    const filterNames: Record<FilterType, string> = {
        grayscale: '灰度',
        invert: '反色',
        brightness: '亮度',
        sepia: '复古',
        blur: '模糊'
    }
    return filterNames[filterType]
}

// 监听器
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

watch(() => props.clip.thumbnail, () => {
    if (!props.clip) return
    if ((props.clip.type === 'video' || props.clip.type === 'image')) {
        nextTick(() => {
            updateDisplayThumbnails()
        })
    }
}, { deep: true, immediate: true })

// 生命周期钩子
onMounted(() => {
    if (props.clip.type === 'audio') {
        const resizeObserver = new ResizeObserver(() => {
            drawWaveform()
        })
        if (waveformCanvas.value) {
            resizeObserver.observe(waveformCanvas.value)
            // 初始绘制
            drawWaveform()
        }
    }
})
</script>

<style scoped>
canvas {
    image-rendering: pixelated;
}
</style>
