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
        <div class="control-bar w-full px-4 py-2 flex items-center gap-4">
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
import { Track, TrackClip } from '@/types/track';
import { getFile } from '@/utils/opfs-file';
import { MP4Clip, AudioClip, VisibleSprite, ImgClip } from '@webav/av-cliper';
import { useTrackStore } from '@/store/modules/track';
import { Icon } from '@iconify/vue';
import { createFileWriter } from '@/utils/opfs-file';
import { TextClip } from '@/components/av-cliper/clips/text-clip';
import { ElMessageBox, ElMessage } from 'element-plus';
import type { ElMessageBoxOptions } from 'element-plus';
import { nextTick } from 'vue';

const props = defineProps<{
    tracks: Track[]
    currentTime: number,
    playerDuration: number // 视频总时长
}>()
// 定义组件事件
const emit = defineEmits(['prevFrame', 'nextFrame', 'timeUpdate', 'fullscreenChange', 'updateClipProps'])

const trackStore = useTrackStore()

const injectActiveClip = inject('activeClip') as ((id: string) => void) | undefined

const loading = ref(true)
// 播放器状态
const isPlaying = ref(false)
const volume = ref(100)
const isMuted = ref(false)
const isFullscreen = ref(false)

// av-canvas引用
const avCanvas = ref(null)

let cvs = null

onMounted(() => {
    Log.setLogLevel(Log.warn)
    initCanvas()
    handleResize()
})
onUnmounted(() => {
    cvs?.destroy()
    sprMap.clear()
    cvs = null
    initCount.value = 0
})

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

const sprMap = new Map<string, VisibleSprite>()
const initCount = ref(0)
const initTotal = computed(() => props.tracks.length)

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
    // 对于audio-clip等没有宽高的sprite，不显示控制点
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
            // 音量调整
            mp4Clip.tickInterceptor = async (_, tickRet) => {
                let list = []
                for (const audio of tickRet.audio) {
                    list.push(audio.map((value) => value = value * (clip.volume / 100)))
                }
                tickRet.audio = list
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
            break
        }
    }

    if (!spr) return

    // 设置通用属性
    spr.time.offset = Number(clip.startTime) * 1e6
    spr.time.duration = Number(clip.duration) * 1e6
    spr.opacity = Number((clip.opacity / 100).toFixed(2))
    spr.rect.fixedScaleCenter = true
    spr.rect.fixedAspectRatio = true // 文字因缩放比例问题，需要固定宽高比

    // 添加到 sprite map 和 canvas
    sprMap.set(clip.id, spr)
    await cvs?.addSprite(spr)
    // 设置位置和大小
    if (clip.type !== 'audio') {
        if (!clip.w) {
            // 视频和图片初始化时需要设置宽高
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
            // 针对固定宽高比的情况，更新字体大小来实现缩放，其他情况需自行调节
            if ('w' in event && clip.w) {
                clip.textConfig.fontSize = event.w / clip.w * clip.textConfig.fontSize
                clip.w = event.w
            }
        } else {
            emit('updateClipProps', clip.id, event)
        }
    })

    // 设置更新订阅
    trackStore.unsubscribeFromClipUpdates(clip.id)
    trackStore.subscribeToClipUpdates(clip.id!, async (updatedClip, type) => {
        updateClip(updatedClip, type)
    })

    initCount.value++
}

// 计算并更新sprite的zIndex
const updateSpritesZIndex = () => {
    let currentZIndex = 0

    // 遍历所有轨道,从上到下
    props.tracks.forEach((track) => {
        // 先处理非文字类型
        track.clips.forEach(clip => {
            const spr = sprMap.get(clip.id)
            if (!spr || clip.type === 'text') return
            spr.zIndex = currentZIndex++
        })

        // 再处理文字类型,确保同一轨道的文字显示在其他类型上面
        track.clips.forEach(clip => {
            const spr = sprMap.get(clip.id)
            if (!spr || clip.type !== 'text') return
            spr.zIndex = currentZIndex++
        })
    })
}

const updateClip = async (clip: TrackClip, type: 'default' | 'resize' | 'delete' = 'default') => {
    handlePlay(false)
    console.log('updateClip', clip)
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

    // 更新通用属性
    spr.time.offset = clip.startTime * 1e6
    spr.time.duration = Number(clip.duration) * 1e6
    spr.opacity = Number((clip.opacity / 100).toFixed(2))

    // 更新zIndex
    updateSpritesZIndex()

    // 根据类型更新特定属性
    if (clip.type === 'text') {
        const textClip: TextClip = spr.getClip() as TextClip
        textClip.textConfig = clip.textConfig
        spr.rect.w = clip.w
        spr.rect.h = clip.h
        spr.preFrame(props.currentTime * 1e6)
    } else if (clip.type !== 'audio') {
        spr.rect.x = clip.x
        spr.rect.y = clip.y
        spr.rect.w = clip.w
        spr.rect.h = clip.h
        spr.rect.angle = clip.angle
    }
}

const refreshPlayer = () => {
    cvs?.destroy()
    sprMap.clear()
    initCount.value = 0
    nextTick(() => {
        initCanvas()
    })
}

watch(() => initCount.value, (newCount) => {
    if (newCount === initTotal.value) {
        loading.value = false
        cvs?.previewFrame(props.currentTime * 1e6)
        // 更新zIndex
        for (const clip of props.tracks.flatMap(track => track.clips)) {
            updateSpritesZIndex()
        }
    }
})

watch(() => props.currentTime, (newTime) => {
    if (!isPlaying.value) {
        cvs.previewFrame(newTime * 1e6)
    }
})

// 音量图标计算属性
const volumeIcon = computed(() => {
    if (isMuted.value || volume.value === 0) return 'fa-volume-mute'
    if (volume.value < 30) return 'fa:volume-off'
    if (volume.value < 70) return 'fa-volume-down'
    return 'fa-volume-up'
})

const playerRef = ref<HTMLElement | null>(null)
const canvasSize = computed(() => trackStore.getCanvasSize)
const handleResize = () => {
    if (playerRef.value) {
        const observer = new ResizeObserver(entries => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;

                trackStore.setCanvasSize({ width: width, height: width * 9 / 16 })
            }
        })
        observer.observe(playerRef.value)
    }
}

// 格式化时间
const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

// 播放控制
const handlePlay = (isPlay: boolean) => {
    if (isPlay) {
        cvs.play({ start: props.currentTime * 1e6 })
        isPlaying.value = true
    } else {
        cvs.pause()
        isPlaying.value = false
    }
}

// 帧控制
const prevFrame = () => {
    // 实现上一帧逻辑
    emit('timeUpdate', (props.currentTime - 1 / 30))
    cvs.previewFrame(props.currentTime * 1e6)
}

const nextFrame = () => {
    // 实现下一帧逻辑
    emit('timeUpdate', (props.currentTime + 1 / 30))
    cvs.previewFrame(props.currentTime * 1e6)
}

// 全屏控制
const toggleFullscreen = () => {
    isFullscreen.value = !isFullscreen.value
    // playerRef全屏
    if (isFullscreen.value) {
        if (playerRef.value) {
            playerRef.value.requestFullscreen()
        }
    } else {
        document.exitFullscreen()
    }
}

// 导出
const handleExport = async () => {
    const com = await cvs?.createCombinator()

    try {
        // 创建导出进度弹窗
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

        // 等待DOM更新
        await nextTick()

        com.on('OutputProgress', (prog: number) => {
            // 更新进度条内容
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

                // 当进度为100%时
                if (prog === 1) {
                    // 隐藏取消按钮
                    const cancelBtn = document.querySelector('.el-message-box__cancel') as HTMLElement
                    if (cancelBtn) {
                        cancelBtn.style.display = 'none'
                    }
                    // 更新内容
                    messageEl.innerHTML = `
                        <div class="flex flex-col gap-2 w-full min-w-[300px]">
                            <div class="text-center text-green-500 text-base">导出完成！</div>
                            <div class="w-full bg-[#2b2b2b] rounded-full h-2">
                                <div class="bg-purple-600 h-2 rounded-full transition-all duration-300" style="width: 100%"></div>
                            </div>
                        </div>
                    `
                    // 3秒后自动关闭
                    setTimeout(() => {
                        ElMessageBox.close()
                    }, 3000)
                }
            }
        })
        await com?.output().pipeTo(await createFileWriter())
    } catch (error: any) {
        // 如果出现错误，关闭弹窗并显示错误信息
        ElMessageBox.close()
        ElMessage.error('导出失败：' + error.message)
    }
}

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

// 组件卸载时取消订阅
onUnmounted(() => {
    // 取消所有订阅
    for (const clipId of sprMap.keys()) {
        trackStore.unsubscribeFromClipUpdates(clipId)
    }
})

defineExpose({
    refreshPlayer,
    addClip,
    activeClip,
    handleExport
})
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