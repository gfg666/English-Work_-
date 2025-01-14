<!--
  * 视频播放器组件
  * 实现了视频播放、暂停、帧进、帧退、全屏等功能
  * 使用canvas进行视频渲染，支持实时预览编辑效果
-->
<template>
    <!-- 播放器容器：包含加载状态 -->
    <div ref="playerRef" class="player-container w-full h-full bg-[#1b1b1b] relative flex flex-col" v-loading="loading">
        <!-- 视频画面显示区域：居中显示视频内容 -->
        <div class="flex-1 flex items-center justify-center">
            <!-- 视频渲染画布：使用canvas进行视频帧渲染 -->
            <div ref="avCanvas" class="" :style="{ width: canvasSize.width + 'px', height: canvasSize.height + 'px' }">
            </div>
        </div>

        <!-- 播放器控制栏：包含播放控制和时间显示 -->
        <div class="control-bar w-full px-4 py-4 flex items-center gap-4">
            <!-- 时间显示区域 -->
            <div class="text-white text-base">
                {{ formatTime(currentTime) }}
            </div>

            <div class="text-white text-base">/</div>

            <div class="text-white text-base">
                {{ formatTime(playerDuration) }}
            </div>

            <!-- 播放控制按钮组：居中显示 -->
            <div class="flex w-full items-center justify-center gap-6">
                <!-- 上一帧按钮：逐帧后退 -->
                <button class="text-white hover:text-purple-500 transition-colors" @click="prevFrame">
                    <Icon :icon="'fa-step-backward'"></Icon>
                </button>

                <!-- 播放/暂停切换按钮 -->
                <button class="text-white hover:text-purple-500 transition-colors">
                    <Icon v-if="!isPlaying" :icon="'fa-play'" @click="handlePlay(true)"></Icon>
                    <Icon v-else :icon="'fa-pause'" @click="handlePlay(false)"></Icon>
                </button>

                <!-- 下一帧按钮：逐帧前进 -->
                <button class="text-white hover:text-purple-500 transition-colors" @click="nextFrame">
                    <Icon :icon="'fa-step-forward'"></Icon>
                </button>
            </div>

            <!-- 右侧功能按钮组 -->
            <div class="ml-auto flex items-center gap-4">
                <!-- 全屏切换按钮 -->
                <button class="text-white hover:text-purple-500 transition-colors" @click="toggleFullscreen">
                    <Icon :icon="isFullscreen ? 'fa-compress' : 'fa-expand'"></Icon>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { AVCanvas } from '@webav/av-canvas';
import { Log } from '@webav/internal-utils';
import { Track, TrackClip, FilterTrackClip } from '@/types/track';
import { getFile } from '@/utils/opfs-file';
import { MP4Clip, AudioClip, VisibleSprite, ImgClip } from '@webav/av-cliper';
import { useTrackStore } from '@/store/modules/track';
import { Icon } from '@iconify/vue';
import { createFileWriter } from '@/utils/opfs-file';
import { TextClip } from '@/components/av-cliper/clips/text-clip';
import { ElMessageBox, ElMessage } from 'element-plus';
import type { ElMessageBoxOptions } from 'element-plus';
import { nextTick } from 'vue';
import { FilterClip } from '@/components/av-cliper/clips/filter-clip';

// Props & Emits
const props = defineProps<{
    tracks: Track[],
    currentTime: number,
    playerDuration: number
}>()

const emit = defineEmits(['prevFrame', 'nextFrame', 'timeUpdate', 'captureImage', 'fullscreenChange', 'updateClipProps'])

// Store & Inject
const trackStore = useTrackStore()
const injectActiveClip = inject('activeClip') as ((id: string) => void) | undefined

// 状态变量
const loading = ref(true)
const isPlaying = ref(false)
const volume = ref(100)
const isMuted = ref(false)
const isFullscreen = ref(false)
const avCanvas = ref(null)
const playerRef = ref<HTMLElement | null>(null)
const initCount = ref(0)
let cvs = null

// 计算属性
const volumeIcon = computed(() => {
    if (isMuted.value || volume.value === 0) return 'fa-volume-mute'
    if (volume.value < 30) return 'fa:volume-off'
    if (volume.value < 70) return 'fa-volume-down'
    return 'fa-volume-up'
})

const canvasSize = computed(() => trackStore.getCanvasSize)
const initTotal = computed(() => {
    let total = 0
    props.tracks.forEach(track => {
        track.clips.forEach(clip => {
            total++
        })
    })
    return total
})

// 播放器核心方法
const handlePlay = (isPlay: boolean) => {
    if (isPlay) {
        cvs.play({ start: props.currentTime * 1e6 })
        isPlaying.value = true
    } else {
        cvs.pause()
        isPlaying.value = false
    }
}

const prevFrame = () => {
    if (isPlaying.value) {
        handlePlay(false)
    }
    emit('timeUpdate', (props.currentTime - 1 / 30))
    cvs.previewFrame(props.currentTime * 1e6)
}

const nextFrame = () => {
    if (isPlaying.value) {
        handlePlay(false)
    }
    emit('timeUpdate', (props.currentTime + 1 / 30))
    cvs.previewFrame(props.currentTime * 1e6)
}

// 全屏控制
const toggleFullscreen = () => {
    isFullscreen.value = !isFullscreen.value
    if (isFullscreen.value) {
        if (playerRef.value) {
            playerRef.value.requestFullscreen()
        }
    } else {
        document.exitFullscreen()
    }
}

// 键盘控制相关
const handleKeyPress = (e: KeyboardEvent) => {
    const activeElement = document.activeElement
    const isInput = activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement?.getAttribute('contenteditable') === 'true'

    if (!isInput) {
        switch (e.code) {
            case 'Space':
                e.preventDefault()
                handlePlay(!isPlaying.value)
                break
            case 'ArrowLeft':
                e.preventDefault()
                prevFrame()
                break
            case 'ArrowRight':
                e.preventDefault()
                nextFrame()
                break
        }
    }
}

// Canvas 初始化和管理
const initCanvas = () => {
    cvs = new AVCanvas(avCanvas.value, {
        bgColor: '#000',
        width: 1920,
        height: 1080,
    });
    console.log(cvs)
    initClips()
    cvs.previewFrame(0)

    cvs.on('timeupdate', (time: number) => {
        emit('timeUpdate', time / 1e6)
    })
    cvs.on('playing', () => {
        console.log('playing')
    });
    cvs.on('paused', () => {
        console.log('paused')
        if (props.currentTime >= props.playerDuration) {
            isPlaying.value = false
            emit('timeUpdate', 0)
        }
    });
    cvs.on('activeSpriteChange', (sprite: VisibleSprite | null) => {
        for (const [key, spr] of sprMap.entries()) {
            if (Object.is(spr, sprite)) {
                injectActiveClip(key)
            }
        }
    });
}

// Clip 管理相关方法
const sprMap = new Map<string, VisibleSprite>()

const initClips = () => {
    props.tracks.forEach(track => {
        track.clips.forEach(clip => {
            initClip(clip)
        })
    })
}

const addClip = (clip: TrackClip) => {
    initClip(clip)
}

const activeClip = (clip: TrackClip | null) => {
    if (!clip) return cvs.activeSprite = null
    const spr = sprMap.get(clip.id)
    if (cvs && spr?.visible) {
        cvs.activeSprite = spr
    }
}

const initClip = async (clip: TrackClip) => {
    if (sprMap.has(clip.id)) return

    let spr: VisibleSprite = null

    // 根据类型创建不同的 clip 和 sprite
    switch (clip.type) {
        case 'video': {
            let fileObject = await getFile(clip.path)
            let mp4Clip = await new MP4Clip(await fileObject.stream())
            mp4Clip.tickInterceptor = async (_, tickRet) => {
                let list = []
                for (const audio of tickRet.audio) {
                    list.push(audio.map((value) => value = value * (clip.volume / 100)))
                }
                tickRet.audio = list
                // 处理视频画面
                tickRet.video = await applyVideoEffect(tickRet.video, clip)
                return tickRet
            }
            if (Number(clip.sourceStartTime) > 0) {
                const newStartClips = await mp4Clip.split(Number(clip.sourceStartTime) * 1e6)
                mp4Clip = newStartClips[1]
            }
            spr = new VisibleSprite(mp4Clip)
            break
        }
        case 'audio': {
            const fileObject = await getFile(clip.path)
            let audioClip = await new AudioClip(await fileObject.stream())
            if (Number(clip.sourceStartTime) > 0) {
                const newStartClips = await audioClip.split(Number(clip.sourceStartTime) * 1e6)
                if (Number(clip.sourceEndTime)) {
                    const newEndClips = await newStartClips[1].split((Number(clip.originalDuration) - Number(clip.sourceEndTime) - Number(clip.sourceStartTime)) * 1e6)
                    audioClip = newEndClips[0]
                } else {
                    audioClip = newStartClips[1]
                }
            }
            spr = new VisibleSprite(audioClip)
            spr.visible = false
            break
        }
        case 'image': {
            const fileObject = await getFile(clip.path)
            let imgClip = null
            if (clip.isAnimateImg) {
                const mineType = fileObject.name.split('.').pop()
                imgClip = new ImgClip({ type: `image/${mineType}` as any, stream: await fileObject.stream() })
            } else {
                imgClip = new ImgClip(await fileObject.stream())
            }
            spr = new VisibleSprite(imgClip)
            break
        }
        case 'text': {
            const textClip = new TextClip(clip.textConfig, (width, height) => {
                emit('updateClipProps', clip.id, {
                    w: width,
                    h: height,
                })
            })
            spr = new VisibleSprite(textClip)
            spr.visible = false
            break
        }
        case 'filter': {
            const filterClip = new FilterClip(Number(clip.duration) * 1e6)
            spr = new VisibleSprite(filterClip)
            spr.visible = false
            break
        }
    }
    // 设置更新订阅
    trackStore.unsubscribeFromClipUpdates(clip.id)
    trackStore.subscribeToClipUpdates(clip.id!, async (updatedClip, type) => {
        updateClip(updatedClip, type)
    })

    if (!spr) return

    // 设置通用属性
    spr.time.offset = Number(clip.startTime) * 1e6
    spr.time.duration = Number(clip.duration) * 1e6
    spr.opacity = Number((clip.opacity / 100).toFixed(2))
    spr.rect.fixedScaleCenter = true
    spr.rect.fixedAspectRatio = true

    // 添加到 sprite map 和 canvas
    sprMap.set(clip.id, spr)
    await cvs?.addSprite(spr)
    initCount.value++

    // 设置位置和大小
    if (clip.type !== 'audio') {
        if (!clip.w) {
            if (clip.type === 'text') {
                emit('updateClipProps', clip.id, {
                    x: spr.rect.x,
                    y: spr.rect.y,
                    w: clip.textConfig.width,
                    h: clip.textConfig.height,
                    angle: spr.rect.angle
                })
            } else {
                emit('updateClipProps', clip.id, {
                    x: spr.rect.x,
                    y: spr.rect.y,
                    w: spr.rect.w,
                    h: spr.rect.h,
                    angle: spr.rect.angle
                })
            }
        } else {
            spr.rect.x = clip.x
            spr.rect.y = clip.y
            spr.rect.w = clip.w
            spr.rect.h = clip.h
            spr.rect.angle = clip.angle
        }
    }

    // 设置事件监听
    spr.rect.on('propsChange', (event) => {
        if (clip.type === 'text') {
            if ('w' in event && clip.w) {
                clip.textConfig.fontSize = event.w / clip.w * clip.textConfig.fontSize
                clip.w = event.w
            }
        } else {
            emit('updateClipProps', clip.id, event)
        }
    })
}

// 应用视频效果
const applyVideoEffect = async (frame: VideoFrame, targetClip: TrackClip): Promise<VideoFrame> => {
    if (!frame) return null
    const displayWidth = frame.displayWidth
    const displayHeight = frame.displayHeight
    // 查找当前时间点生效的滤镜
    const activeFilters = props.tracks
        .flatMap(track => track.clips)
        .filter(clip =>
            clip.type === 'filter' &&
            props.currentTime >= clip.startTime &&
            props.currentTime < (clip.startTime + clip.duration)
        ) as FilterTrackClip[]

    if (!activeFilters.length) return frame

    // 创建离屏画布
    const canvas = new OffscreenCanvas(displayWidth, displayHeight)
    const ctx = canvas.getContext('2d')
    if (!ctx) return frame

    // 将视频帧绘制到画布
    ctx.drawImage(frame, 0, 0)

    // 获取像素数据
    const imageData = ctx.getImageData(0, 0, displayWidth, displayHeight)
    frame.close()
    const pixels = imageData.data

    // 按顺序应用滤镜
    for (const filter of activeFilters) {
        // 将0-100的强度值转换为0-1
        const intensity = filter.intensity / 100

        switch (filter.filterType) {
            case 'grayscale':
                for (let i = 0; i < pixels.length; i += 4) {
                    const avg = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3
                    const original = [pixels[i], pixels[i + 1], pixels[i + 2]]
                    pixels[i] = original[0] * (1 - intensity) + avg * intensity
                    pixels[i + 1] = original[1] * (1 - intensity) + avg * intensity
                    pixels[i + 2] = original[2] * (1 - intensity) + avg * intensity
                }
                break

            case 'sepia':
                for (let i = 0; i < pixels.length; i += 4) {
                    const r = pixels[i]
                    const g = pixels[i + 1]
                    const b = pixels[i + 2]
                    const sepiaR = Math.min(255, (r * 0.393 + g * 0.769 + b * 0.189))
                    const sepiaG = Math.min(255, (r * 0.349 + g * 0.686 + b * 0.168))
                    const sepiaB = Math.min(255, (r * 0.272 + g * 0.534 + b * 0.131))
                    pixels[i] = r * (1 - intensity) + sepiaR * intensity
                    pixels[i + 1] = g * (1 - intensity) + sepiaG * intensity
                    pixels[i + 2] = b * (1 - intensity) + sepiaB * intensity
                }
                break

            case 'invert':
                for (let i = 0; i < pixels.length; i += 4) {
                    const original = [pixels[i], pixels[i + 1], pixels[i + 2]]
                    pixels[i] = original[0] * (1 - intensity) + (255 - original[0]) * intensity
                    pixels[i + 1] = original[1] * (1 - intensity) + (255 - original[1]) * intensity
                    pixels[i + 2] = original[2] * (1 - intensity) + (255 - original[2]) * intensity
                }
                break

            case 'brightness':
                const factor = 1 + intensity
                for (let i = 0; i < pixels.length; i += 4) {
                    const original = [pixels[i], pixels[i + 1], pixels[i + 2]]
                    pixels[i] = Math.min(255, original[0] * factor)
                    pixels[i + 1] = Math.min(255, original[1] * factor)
                    pixels[i + 2] = Math.min(255, original[2] * factor)
                }
                break

            case 'blur':
                const radius = Math.floor(intensity * 10) // 最大模糊半径为10像素
                const tempData = new Uint8ClampedArray(pixels)
                for (let y = 0; y < displayHeight; y++) {
                    for (let x = 0; x < displayWidth; x++) {
                        let r = 0, g = 0, b = 0, a = 0, count = 0
                        for (let dy = -radius; dy <= radius; dy++) {
                            for (let dx = -radius; dx <= radius; dx++) {
                                const px = x + dx
                                const py = y + dy
                                if (px >= 0 && px < displayWidth && py >= 0 && py < displayHeight) {
                                    const i = (py * displayWidth + px) * 4
                                    r += tempData[i]
                                    g += tempData[i + 1]
                                    b += tempData[i + 2]
                                    a += tempData[i + 3]
                                    count++
                                }
                            }
                        }
                        const i = (y * displayWidth + x) * 4
                        pixels[i] = r / count
                        pixels[i + 1] = g / count
                        pixels[i + 2] = b / count
                        pixels[i + 3] = a / count
                    }
                }
                break
        }
    }

    // 更新画布
    ctx.putImageData(imageData, 0, 0)

    // 创建新的视频帧
    return new VideoFrame(canvas, {
        timestamp: frame.timestamp,
        duration: frame.duration,
        displayWidth: displayWidth,
        displayHeight: displayHeight
    })
}

// 更新相关方法
const updateSpritesZIndex = () => {
    let currentZIndex = 0
    props.tracks.forEach((track) => {
        track.clips.forEach(clip => {
            const spr = sprMap.get(clip.id)
            if (!spr || clip.type === 'text') return
            spr.zIndex = currentZIndex++
        })
        track.clips.forEach(clip => {
            const spr = sprMap.get(clip.id)
            if (!spr || clip.type !== 'text') return
            spr.zIndex = currentZIndex++
        })
    })
}

const updateClip = async (clip: TrackClip, type: 'default' | 'resize' | 'delete' = 'default') => {
    handlePlay(false)
    if (!sprMap.has(clip.id)) return

    const spr = sprMap.get(clip.id)

    if (type === 'delete') {
        cvs?.removeSprite(spr)
        sprMap.delete(clip.id)
        return
    }

    if (type === 'resize' && (clip.type === 'video' || clip.type === 'audio')) {
        cvs?.removeSprite(spr)
        sprMap.delete(clip.id)
        await initClip(clip)
        return
    }

    spr.time.offset = clip.startTime * 1e6
    spr.time.duration = Number(clip.duration) * 1e6
    spr.opacity = Number((clip.opacity / 100).toFixed(2))

    updateSpritesZIndex()

    if (clip.type === 'text') {
        const textClip: TextClip = spr.getClip() as TextClip
        textClip.textConfig = clip.textConfig
        spr.rect.w = clip.w
        spr.rect.h = clip.h
        spr.preFrame(props.currentTime * 1e6)
    } else if (clip.type === 'filter') {
        props.tracks.forEach(track => {
            track.clips.forEach(clipItem => {
                if ((clipItem.type === 'video' || clipItem.type === 'image') && clipItem.startTime <= props.currentTime && clipItem.endTime >= props.currentTime) {
                    const sprItem = sprMap.get(clipItem.id)
                    if (sprItem) {

                        sprItem.preFrame((props.currentTime) * 1e6 - sprItem.time.offset)
                    }
                }
            })
        })
    } else if (clip.type !== 'audio') {
        spr.rect.x = clip.x
        spr.rect.y = clip.y
        spr.rect.w = clip.w
        spr.rect.h = clip.h
        spr.rect.angle = clip.angle
    }

    cvs?.previewFrame(props.currentTime * 1e6)
}

const refreshPlayer = () => {
    cvs?.destroy()
    sprMap.clear()
    initCount.value = 0
    nextTick(() => {
        initCanvas()
    })
}

// 导出相关
const handleExport = async () => {
    const com = await cvs?.createCombinator()

    try {
        const options: ElMessageBoxOptions = {
            dangerouslyUseHTMLString: true,
            showClose: false,
            closeOnClickModal: false,
            closeOnPressEscape: false,
            showCancelButton: true,
            showConfirmButton: false,
            cancelButtonText: '停止',
            customClass: 'export-progress-dialog',
            beforeClose: (action, instance, done) => {
                if (action === 'cancel') {
                    com?.destroy()
                    done()
                }
            }
        }

        ElMessageBox.alert(`
            <div class="flex flex-col gap-2 w-full min-w-[300px]">
                <div class="text-center text-base">0%</div>
                <div class="w-full bg-[#2b2b2b] rounded-full h-2">
                    <div class="bg-purple-600 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                </div>
            </div>
        `, '导出进度', options)

        await nextTick()

        com.on('OutputProgress', (prog: number) => {
            const percentage = Math.round(prog * 100)
            const messageEl = document.querySelector('.el-message-box__message')
            if (messageEl) {
                messageEl.innerHTML = `
                    <div class="flex flex-col gap-2 w-full min-w-[300px]">
                        <div class="text-center text-base">${percentage}%</div>
                        <div class="w-full bg-[#2b2b2b] rounded-full h-2">
                            <div class="bg-purple-600 h-2 rounded-full transition-all duration-300" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                `

                if (prog === 1) {
                    const cancelBtn = document.querySelector('.el-message-box__cancel') as HTMLElement
                    if (cancelBtn) {
                        cancelBtn.style.display = 'none'
                    }
                    messageEl.innerHTML = `
                        <div class="flex flex-col gap-2 w-full min-w-[300px]">
                            <div class="text-center text-green-500 text-base">导出完成！</div>
                            <div class="w-full bg-[#2b2b2b] rounded-full h-2">
                                <div class="bg-purple-600 h-2 rounded-full transition-all duration-300" style="width: 100%"></div>
                            </div>
                        </div>
                    `
                    setTimeout(() => {
                        ElMessageBox.close()
                    }, 3000)
                }
            }
        })
        await com?.output().pipeTo(await createFileWriter())
    } catch (error: any) {
        ElMessageBox.close()
        ElMessage.error('导出失败：' + error.message)
    }
}

// 工具方法
const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

const handleResize = () => {
    if (playerRef.value) {
        const observer = new ResizeObserver(entries => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                const toolBarHeight = document.querySelector('.control-bar')?.clientHeight
                const playerHeight = height - toolBarHeight
                if (width / playerHeight > 16 / 9) {
                    trackStore.setCanvasSize({ width: playerHeight * 16 / 9, height: playerHeight })
                } else {
                    trackStore.setCanvasSize({ width: width, height: width * 9 / 16 })
                }
            }
        })
        observer.observe(playerRef.value)
    }
}

// 生命周期钩子
onMounted(() => {
    Log.setLogLevel(Log.warn)
    initCanvas()
    handleResize()
    window.addEventListener('keydown', handleKeyPress)
})

onUnmounted(() => {
    cvs?.destroy()
    sprMap.clear()
    cvs = null
    initCount.value = 0
    window.removeEventListener('keydown', handleKeyPress)
    for (const clipId of sprMap.keys()) {
        trackStore.unsubscribeFromClipUpdates(clipId)
    }
})

// 监听器
watch(() => initCount.value, (newCount) => {
    if (newCount === initTotal.value) {
        loading.value = false
        cvs?.previewFrame(props.currentTime * 1e6)
        for (const clip of props.tracks.flatMap(track => track.clips)) {
            updateSpritesZIndex()
        }
        // 需要等待cvs渲染完成
        setTimeout(() => {
            const dataUrl = cvs?.captureImage()
            emit('captureImage', dataUrl)
        }, 500)
    }
})

watch(() => props.currentTime, (newTime) => {
    if (!isPlaying.value) {
        cvs.previewFrame(newTime * 1e6)
    }
})

// 导出方法
defineExpose({
    refreshPlayer,
    addClip,
    activeClip,
    handleExport
})

// 添加样式
const style = document.createElement('style')
style.textContent = `
.export-progress-dialog .el-message-box__content {
    padding: 20px;
}
.export-progress-dialog .el-message-box__message {
    padding: 0;
}
.export-progress-dialog .el-message-box__message p {
    margin: 0;
}
.export-progress-dialog .el-message-box__container {
    width: 100%;
}
`
document.head.appendChild(style)
</script>

<style scoped>
.player-container {
    aspect-ratio: 16/9;
}

.control-overlay {
    background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, transparent 100%);
}

/* 自定义滑块样式 */
input[type="range"] {
    appearance: none;
    -webkit-appearance: none;
    height: 4px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 2px;
    outline: none;
}

input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 12px;
    height: 12px;
    background: theme('colors.purple.500');
    border-radius: 50%;
    cursor: pointer;
}

input[type="range"]::-moz-range-thumb {
    width: 12px;
    height: 12px;
    background: theme('colors.purple.500');
    border-radius: 50%;
    cursor: pointer;
    border: none;
}

.export-progress-dialog {
    .el-message-box__container {
        width: 100%;

        .el-message-box__message {
            width: 100%;
        }
    }
}
</style>