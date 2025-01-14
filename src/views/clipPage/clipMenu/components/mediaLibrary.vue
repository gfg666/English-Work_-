<template>
    <div class="p-5">
        <div class="flex items-center justify-center">
            <el-upload class="w-full" drag action="163" multiple :show-file-list="false" :before-upload="beforeUpload">
                <div class="flex items-center justify-center">
                    <el-icon class="mr-1" size="30"><upload-filled /></el-icon>
                    <div class="flex flex-col items-start">
                        <div class="text-tiny">
                            拖拽或上传文件
                        </div>
                        <div class="flex items-center justify-center text-xs">
                            支持视频、音频、图片格式
                        </div>
                    </div>
                </div>
                <template #tip>

                </template>
            </el-upload>
        </div>
        <div class=" h-[calc(100vh-7rem)] mt-2 overflow-y-auto">
            <div class="w-full grid grid-cols-2 gap-3">
                <div class="relative flex flex-col justify-center w-full hover:bg-[#121212] p-1.5 rounded-md"
                    v-for="(item, index) in mediaList" @contextmenu.prevent="openMenu($event, item)"
                    @mouseover="handleMouseover(item, index)" @mouseleave="handleMouseleave(item, index)"
                    @dragstart="handleDragStart($event, item)" draggable="true">
                    <div class="relative w-full h-full bg-[#121212]">
                        <img :src="item.filePath" alt="" class="aspect-video object-contain rounded"
                            v-if="item.type === 'image'">
                        <video :ref="setPlayRef(index)" v-if="item.type === 'video'" :src="item.filePath" muted loop
                            disablepictureinpicture class="aspect-video object-contain  rounded"></video>
                        <div v-if="item.type === 'audio'" class="w-full aspect-video flex items-center justify-center">
                            <el-icon>
                                <Headset />
                            </el-icon>
                        </div>
                        <div v-if="item.hovered"
                            class="absolute w-[12%] h-[12%] right-[16%] bottom-[12%] flex items-center gap-1 rounded-full">
                            <el-icon class="w-full h-full bg-[#333333] rounded-full cursor-pointer"
                                @click.stop="addMedia(item)">
                                <CirclePlus />
                            </el-icon>
                            <el-icon class="w-full h-full bg-[#333333] rounded-full cursor-pointer"
                                @click.stop="delMeida(item)">
                                <DeleteFilled />
                            </el-icon>
                        </div>
                        <div v-if="showContextMenu && item.id === contextMenuId"
                            class="absolute flex flex-col justify-center bg-[#121212] py-1.5 rounded-md"
                            :style="{ 'left': contextMenuPosition.x + 'px', 'top': contextMenuPosition.y + 'px' }">
                            <div class="px-3 py-0.5 text-tiny hover:bg-gray cursor-pointer">裁剪</div>
                        </div>
                    </div>
                    <div class="text-tiny truncate mt-1">{{ item.name }}</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang='ts'>
import { useTrackStore } from '@/store/modules/track';
import { db } from '@/db/db'
import type { Media } from '@/db/db'
import { getFileUrl } from '@/utils/opfs-file';
import { ElMessage } from 'element-plus';
import { file, write } from 'opfs-tools';
import { MP4Clip, AudioClip, ImgClip } from '@webav/av-cliper';
import { v4 } from 'uuid';
import { ref, inject } from 'vue'
import type { TrackClip } from '@/types/track'

interface MediaItem extends Media {
    filePath: string
    hovered: boolean
}
const trackStore = useTrackStore()
const addClip = inject('addClip') as ((clip: TrackClip, createNewTrack?: boolean) => void) | undefined
const mediaList = ref<MediaItem[]>([])

const playRefMap = new Map<number, HTMLVideoElement>()
const setPlayRef = (index) => (el) => {
    playRefMap.set(index, el)
}
onMounted(() => {
    getMediaList()
})
const getMediaList = () => {
    db.medias.toArray().then(async (res) => {
        if (res) {
            let list = []
            for (const item of res) {
                const url = await getFileUrl(item.path)
                list.push({ ...item, filePath: url })
            }
            mediaList.value = list
        }
    })
}
const beforeUpload = async (fileObject: any) => {
    const res = await db.medias.where({ 'name': fileObject.name }).first()
    if (res && res.size === fileObject.size) {
        ElMessage.warning('文件已存在')
        return false
    }
    const mineType = fileObject.name.split('.').pop()
    let fileType = ''
    switch (mineType) {
        case 'mp4':
        case 'mov':
        case 'avi':
        case 'wmv':
            fileType = 'video'
            break;

        case 'mp3':
        case 'wav':
        case 'm4a':
        case 'm4s':
        case 'm3u8':
        case 'aac':
        case 'ogg':
        case 'flac':
        case 'webm':
        case 'opus':
            fileType = 'audio'
            break;

        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'gif':
        case 'bmp':
        case 'tiff':
        case 'ico':
        case 'svg':
        case 'webp':
        case 'avif':
            fileType = 'image'
            break;

        default:
            ElMessage.warning('请检查文件格式')
            return false
    }

    let path = '/' + fileType + '/' + fileObject.name
    const opfsFile = await file(path)
    let needUpdate = false;
    if (opfsFile.exists()) {
        await opfsFile.remove();
        needUpdate = true
    }
    await write(path, fileObject.stream());
    if (await file(path).exists()) {
        const media: Media = {
            name: fileObject.name,
            size: fileObject.size,
            type: fileType as 'video' | 'audio' | 'image',
            path: path,
            isAnimateImg: false
        }
        switch (fileType) {
            case 'video':
                const VideoClip = new MP4Clip(fileObject.stream())
                const videoReadyRes = await VideoClip.ready
                if (videoReadyRes) {
                    media.duration = videoReadyRes.duration
                }
                break;
            case 'audio':
                const audioClip = new AudioClip(await fileObject.stream())
                const audioReadyRes = await audioClip.ready
                if (audioReadyRes) {
                    media.duration = audioReadyRes.duration
                }
                break;

            case 'image':
                try {

                    media.duration = 3000000
                    const animateImgTypeList = ['gif', 'webp', 'avif', 'webp']
                    const mineType = fileObject.name.split('.').pop()
                    if (animateImgTypeList.includes(mineType)) {
                        const imgClip = new ImgClip({ type: `image/${mineType}` as any, stream: await fileObject.stream() })
                        const readyRes = await imgClip.ready
                        const { video: data1 }: any = await imgClip.tick(0)
                        const { video: data2 }: any = await imgClip.tick(1000000)
                        const offscreenCanvas = new OffscreenCanvas(data1.codedWidth, data1.codedHeight)
                        const ctx = offscreenCanvas.getContext('2d')
                        ctx.drawImage(data1, 0, 0)
                        const imageData1 = ctx.getImageData(0, 0, data1.codedWidth, data1.codedHeight)
                        ctx.clearRect(0, 0, data1.codedWidth, data1.height)
                        ctx.drawImage(data2, 0, 0)
                        const imageData2 = ctx.getImageData(0, 0, data2.codedWidth, data2.codedHeight)
                        const isSame = compareImageData(imageData1.data, imageData2.data)
                        media.isAnimateImg = true
                    } else {
                        media.isAnimateImg = false
                    }

                } catch (error) {
                    console.log(error)
                }
                break;

            default:
                break;
        }
        if (needUpdate && res) {
            media.updateTime = new Date().getTime()
            await db.medias.where({ 'name': fileObject.name }).modify(media)
        } else {
            media.createTime = new Date().getTime()
            await db.medias.add(media);
        }
        getMediaList()
    } else {
        ElMessage.error('上传失败')
    }
    return false
}

const compareImageData = (data1, data2) => {
    if (data1.length !== data2.length) {
        return false;
    }
    for (let i = 0; i < data1.length; i++) {
        if (data1[i] !== data2[i]) {
            return false;
        }
    }
    return true;

}
const showContextMenu = computed(() => {
    return trackStore.getShowContextMenu
})
const contextMenuPosition = computed(() => {
    return trackStore.getContextMenuPosition
})
const contextMenuId = ref('')
const openMenu = (event: MouseEvent, item: Media) => {
    contextMenuId.value = item.id
    trackStore.setShowContextMenu(true)
    const { offsetX, offsetY } = event
    trackStore.setContextMenuPosition({ x: offsetX, y: offsetY })
}

const handleMouseover = (item: MediaItem, index: number) => {
    item.hovered = true
    const el = playRefMap.get(index)
    if (el) {
        if (item.type === 'video') {
            el.play()
        }
    }
}
const handleMouseleave = (item: MediaItem, index: number) => {
    item.hovered = false
    const el = playRefMap.get(index)
    if (el) {
        if (item.type === 'video') {
            el.currentTime = 0
            el.pause()
        }
    }
}
const handleDragStart = (e: DragEvent, item: MediaItem) => {
    if (!e.dataTransfer) return

    // 设置拖拽效果
    e.dataTransfer.effectAllowed = 'move'

    // 同时使用多种数据格式设置数据
    e.dataTransfer.setData('application/json', JSON.stringify(item))
    e.dataTransfer.setData('text/plain', JSON.stringify(item))

    // 在 store 中保存数据
    trackStore.setDragData(item)
}
const handleDragEnd = (e: DragEvent) => {
    e.preventDefault()
    // 清除 store 中的数据
    trackStore.clearDragData()
}
const emit = defineEmits<{
    (e: 'add-clip', clip: any, createNewTrack?: boolean): void
}>()

const addMedia = (item: Media) => {
    const clip = {
        id: v4(),
        type: item.type,
        isAnimateImg: item.isAnimateImg,
        name: item.name,
        path: item.path,
        duration: item.duration ? Number(item.duration) / 1e6 : 5,
        startTime: 0,
        endTime: item.duration ? Number(item.duration) / 1e6 : 5,
        opacity: 100,
        angle: 0,
    }

    if (item.type === 'image') {
        clip.duration = 5
        clip.endTime = 5
    }

    // 使用注入的 addClip 方法
    addClip?.(clip, true)
}
const delMeida = (item: Media) => {
    db.medias.where({ 'id': item.id }).delete()
    getMediaList()
}
</script>

<style lang="scss" scoped>
:deep(.el-upload-dragger) {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 5rem;
    padding: 2rem;

    &:hover {
        color: #8934aa;
    }
}
</style>