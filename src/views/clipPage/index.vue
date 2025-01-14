<!--
  * 视频剪辑页面主组件
  * 包含左侧菜单、中间播放器和属性面板、底部轨道编辑区域
  * 实现了视频剪辑的核心功能
-->
<template>
    <!-- 主容器：使用Tailwind CSS进行样式设置 -->
    <div class="w-full h-full flex bg-[#1b1b1d] overflow-hidden" @click="closeContextMenu">
        <!-- 左侧菜单区域 -->
        <div id="left" class="h-screen">
            <ClipMenu />
        </div>
        <!-- 中间主要内容区域 -->
        <div id="right" class="h-screen overflow-hidden">
            <!-- 顶部区域：包含播放器和属性面板 -->
            <div id="top" class="flex justify-between">
                <!-- 播放器区域 -->
                <div id="topLeft" class="w-4/5">
                    <Player ref="playerRef" :currentTime="currentTime" :tracks="tracks"
                        :timelineDuration="timelineDuration" :playerDuration="playerDuration" @prevFrame="prevFrame"
                        @nextFrame="nextFrame" @timeUpdate="timeUpdate" @captureImage="captureImage"
                        @updateClipProps="updateClipProps" />
                </div>
                <!-- 右侧属性面板 -->
                <div id="topRight" class="w-1/5 bg-[#303030]">
                    <ClipProperties :clip="selectedClip" @update="updateClipProps" />
                </div>
            </div>
            <!-- 底部轨道编辑区域 -->
            <div id="bottom" class="bg-[#201f20]">
                <ClipTrack ref="clipTrackRef" v-model:tracks="tracks" :maxTracksNum="MAX_TRACKS_NUM"
                    :currentTime="currentTime" :timelineDuration="timelineDuration" @timeUpdate="timeUpdate"
                    @add-clip="addPlayerClip" @refreshPlayer="refreshPlayer" @delete-empty-track="deleteEmptyTrack"
                    @activeClip="handleActiveClip" @handle-export="handleExport" />
            </div>
        </div>
    </div>
</template>

<script setup lang='ts'>
/**
 * 导入所需的组件和工具
 */
import Player from './clipPlayer/Player.vue'
import { useTrackStore } from '@/store/modules/track'
import ClipMenu from './clipMenu/clipMenu.vue'
import Split from 'split.js'
import ClipTrack from './clipTrack/clipTrack.vue'
import ClipProperties from './ClipProperties/ClipProperties.vue'
import { onMounted, provide, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { db } from '@/db/db'
import { Track, TrackClip } from '@/types/track'
import { getKeyframes, getVolume } from '@/components/js/webcodecs'
import { cloneDeep } from 'lodash'
import { ElMessage } from 'element-plus'
import { dataURLToBuffer } from '@/utils/opfs-file'
import { file, write } from 'opfs-tools'

/**
 * 禁用浏览器默认的缩放行为
 * 防止Ctrl+滚轮触发浏览器缩放，影响编辑体验
 */
const disableZoom = (e: WheelEvent) => {
    if (e.ctrlKey) {
        e.preventDefault()
    }
}

onMounted(() => {
    window.addEventListener('wheel', disableZoom, { passive: false })
})

onUnmounted(() => {
    window.removeEventListener('wheel', disableZoom)
})

const route = useRoute();
const trackStore = useTrackStore()
const projectId = Number(route.params.id);
const MAX_TRACKS_NUM = 10 // 最大轨道数量
const MIN_DURATION = 300 // 最小时长5分钟（秒）
const BUFFER_DURATION = 5 // 缓冲时长（秒）

// Split布局相关
const SPLIT_STORAGE_KEY = 'split-sizes'
const DEFAULT_HORIZONTAL_SIZES = [25, 75]
const DEFAULT_VERTICAL_SIZES = [65, 35]

// 轨道数据
const tracks = ref<Track[]>([])
const currentTime = ref(0)
// 计算时间轴的总时长
const timelineDuration = computed(() => {
    // 最大endTime加缓冲时长，且不小于最小时长
    return Math.max(playerDuration.value + BUFFER_DURATION, MIN_DURATION)
})
// 计算播放器总时长
const playerDuration = computed(() => {
    // 找出所有轨道中最大的endTime
    let maxEndTime = 0
    tracks.value.forEach(track => {
        track.clips.forEach(clip => {
            const endTime = Number(clip.endTime)
            if (endTime > maxEndTime) {
                maxEndTime = endTime
            }
        })
    })
    return maxEndTime
})

const playerRef = ref(null)
const clipTrackRef = ref(null)

const timeUpdate = (time: number) => {
    currentTime.value = time
}

const captureImage = async (dataUrl: string) => {
    const buffer = dataURLToBuffer(dataUrl)
    await write('/capture/' + projectId + '.png', buffer, {
        overwrite: true
    })
    const project = await db.projects.where({ id: projectId }).first()
    if (project) {
        db.projects.update(project, { thumbnail: '/capture/' + projectId + '.png' })
    }
}

const prevFrame = () => {
    currentTime.value -= 30 / 1000 / 1000
}

const nextFrame = () => {
    currentTime.value += 30 / 1000 / 1000
}

// 提供 addClip 方法给所有子组件使用
provide('addClip', async (clip: TrackClip, createNewTrack?: boolean) => {
    // 设置 clip 的开始时间为当前时间
    clip.startTime = currentTime.value
    clip.endTime = currentTime.value + clip.duration

    // 对于视频类型，设置源时间相关属性
    if (clip.type === 'video') {
        clip.sourceStartTime = 0
        clip.sourceEndTime = 0
        clip.originalDuration = clip.duration
    }


    // 获取视频关键帧或图片缩略图
    if (clip.type === 'video' || clip.type === 'image') {
        const res = await getKeyframes(clip)
        if (res.type === 'video') {
            clip.thumbnail = res.data as { url: string; timestamp: number }[]
        } else if (res.type === 'image') {
            clip.thumbnail = [{ timestamp: 0, url: URL.createObjectURL(res.data as Blob) }]
        }
    }

    // 获取音频波形数据
    if (clip.type === 'audio') {
        const res = await getVolume(clip)
        if (res.type === 'audio') {
            clip.volumeData = res.data
        }
    }

    // 如果需要创建新轨道
    if (createNewTrack) {
        if (tracks.value.length >= MAX_TRACKS_NUM) {
            ElMessage.warning(`轨道数量已达到最大限制(${MAX_TRACKS_NUM})`)
            return
        }
        const newTrack: Track = {
            id: String(tracks.value.length),
            clips: [clip]
        }
        tracks.value.push(newTrack)
    } else {
        // 否则添加到最后一个轨道
        if (tracks.value.length === 0) {
            tracks.value.push({
                id: '0',
                clips: []
            })
        }
        tracks.value[tracks.value.length - 1].clips.push(clip)
    }
    // 更新播放器
    nextTick(() => {
        playerRef.value?.refreshPlayer()
    })
})

// 提供 activeClip 方法，在需要时激活轨道中的clip
provide('activeClip', (id: string | null) => {
    if (id) {
        const clip = tracks.value.find(track => track.clips.some(clip => clip.id === id))?.clips.find(clip => clip.id === id)
        if (clip) {
            clipTrackRef.value?.activeClip(clip)
            selectedClip.value = clip
        }
    } else {
        clipTrackRef.value?.activeClip(null)
        selectedClip.value = null
    }
})

const playerWidth = ref(0)
const playerHeight = ref(0)
onMounted(async () => {
    // 从localStorage获取Split布局数据
    const savedSizes = localStorage.getItem(SPLIT_STORAGE_KEY)
    const { horizontalSizes, verticalSizes } = savedSizes ?
        JSON.parse(savedSizes) :
        { horizontalSizes: DEFAULT_HORIZONTAL_SIZES, verticalSizes: DEFAULT_VERTICAL_SIZES }

    // 初始化水平分割
    const horizontalSplit = Split(['#left', '#right'], {
        sizes: horizontalSizes,
        minSize: [250, 500],
        snapOffset: 0,
        onDragEnd: (sizes) => {
            // 保存新的水平分割尺寸
            const savedSizes = localStorage.getItem(SPLIT_STORAGE_KEY)
            const sizeData = savedSizes ? JSON.parse(savedSizes) : {}
            localStorage.setItem(SPLIT_STORAGE_KEY, JSON.stringify({
                ...sizeData,
                horizontalSizes: sizes
            }))
        }
    })

    // 初始化垂直分割
    const verticalSplit = Split(['#top', '#bottom'], {
        direction: 'vertical',
        sizes: verticalSizes,
        minSize: [250, 150],
        snapOffset: 0,
        onDragEnd: (sizes) => {
            // 保存新的垂直分割尺寸
            const savedSizes = localStorage.getItem(SPLIT_STORAGE_KEY)
            const sizeData = savedSizes ? JSON.parse(savedSizes) : {}
            localStorage.setItem(SPLIT_STORAGE_KEY, JSON.stringify({
                ...sizeData,
                verticalSizes: sizes
            }))
        }
    })

    const project = await db.projects.where({ id: projectId }).first();
    if (project) {
        tracks.value = project.tracks
        deleteEmptyTrack()
        tracks.value.forEach(track => {
            track.clips.forEach(clip => {
                if (clip.type === 'audio') {
                    getVolume(clip).then(res => {
                        if (res.type === 'audio') {
                            clip.volumeData = res.data
                        }
                    })
                } else if (clip.type === 'video' || clip.type === 'image') {
                    getKeyframes(clip).then(res => {
                        if (res.type === 'video') {
                            clip.thumbnail = res.data as { url: string; timestamp: number }[]
                        } else if (res.type === 'image') {
                            clip.thumbnail = [{ timestamp: 0, url: URL.createObjectURL(res.data as Blob) }]
                        }
                    })
                }
            })
        })
        trackStore.clearHistory(projectId)
        trackStore.saveHistoryState(projectId, tracks.value)
        refreshPlayer()
    }
});

const closeContextMenu = () => {
    trackStore.setShowContextMenu(false)
}

const updateClipProps = (id, newProps: any) => {
    for (const track of tracks.value) {
        for (const clip of track.clips) {
            if (clip.id === id) {
                Object.assign(clip, newProps)
                break;
            }
        }
    }
}

watch(() => tracks.value, async (val) => {
    await saveProject()
}, {
    deep: true
})

// 在保存轨道数据时更新项目
const saveProject = async () => {
    const project = await db.projects.where({ id: projectId }).first();
    if (project) {
        // 需要深拷贝 tracks 数组,避免 IDB 克隆错误
        const rawTracks = cloneDeep(tracks.value)
        rawTracks.forEach(track => {
            track.clips.forEach(clip => {
                clip.thumbnail = null
            })
        })
        await db.projects.update(project, { tracks: rawTracks });
    }
};

const selectedClip = ref(null)

const handleActiveClip = (clip: TrackClip | null) => {
    selectedClip.value = clip
    playerRef.value?.activeClip(clip)
}

const addPlayerClip = (clip: TrackClip) => {
    playerRef.value?.addClip(clip)
}

// 删除没有clip的轨道
const deleteEmptyTrack = () => {
    tracks.value = tracks.value.filter(track => track.clips.length > 0)
}

const refreshPlayer = () => {
    playerRef.value?.refreshPlayer()
}

const handleExport = () => {
    playerRef.value?.handleExport()
}

</script>

<style lang="scss">
#left+.gutter {
    position: relative;
    z-index: 100;
    cursor: col-resize;
    background-color: #303030;
    box-shadow: inset 2px 0 1px 0px #303030;
    transition: box-shadow 0.4s ease-in-out 0.2s;

    &:hover {
        box-shadow: inset -2px 0 1px 0px rgba(128, 0, 128, 0.7);
    }

    &.gutter-vertical {
        cursor: n-resize;
    }
}

#right .gutter {
    position: relative;
    z-index: 100;
    cursor: row-resize;
    background-color: #1b1b1b;
    transition: box-shadow 0.4s ease-in-out 0.2s;

    &:hover {
        box-shadow: inset 0 -2px 1px 0px rgba(128, 0, 128, 0.7);
    }
}
</style>