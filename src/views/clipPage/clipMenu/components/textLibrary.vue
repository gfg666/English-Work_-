<template>
    <div class="p-4">
        <div class="grid grid-cols-2 gap-4">
            <!-- 基础文字 -->
            <div class="relative group cursor-pointer bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg p-4 flex flex-col items-center"
                @click="handleAddText(basicTemplate)" draggable="true" @dragstart="handleDragStart(basicTemplate)">
                <!-- 预览效果 -->
                <div class="text-white text-xl mb-2">
                    {{ basicTemplate.preview }}
                </div>
                <!-- 模板名称 -->
                <div class="text-[#666] text-sm">{{ basicTemplate.name }}</div>
                <!-- 悬停时显示的添加按钮 -->
                <div
                    class="absolute inset-0 bg-purple-500/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
                    <el-icon class="text-white text-2xl">
                        <Plus />
                    </el-icon>
                </div>
            </div>

            <!-- 花字模板 -->
            <div v-for="template in textTemplates" :key="template.name"
                class="relative group cursor-pointer bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg aspect-video overflow-hidden"
                @click="handleAddText(template)" draggable="true" @dragstart="handleDragStart(template)">
                <img :src="template.preview" class="w-full h-full px-3 object-contain" />
                <div
                    class="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity">
                    <el-icon class="text-white text-2xl mb-2">
                        <Plus />
                    </el-icon>
                    <span class="text-white text-sm">{{ template.name }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang='ts'>
import { useTrackStore } from '@/store/modules/track'
import { v4 } from 'uuid'
import { Plus } from '@element-plus/icons-vue'
import type { TrackClip } from '@/types/track'
import { baseCanvasSize } from '@/types/type'
import { textTemplates } from '@/constants/textTemplates'

interface TextTemplate {
    preview: string
    name: string
    style: {
        fontSize: number
        fontFamily: string
        color: string
        animation?: string
    }
}

const trackStore = useTrackStore()
const addClip = inject('addClip') as ((clip: TrackClip, createNewTrack?: boolean) => void) | undefined

// 基础文字模板
const basicTemplate = ref<TextTemplate>({
    preview: 'Aa',
    name: '基础文字',
    style: {
        fontSize: 72,
        fontFamily: 'Microsoft YaHei',
        color: '#ffffff',
    }
})

// 处理拖拽开始
const handleDragStart = (template: TextTemplate) => {
    const textClip = createTextClip(template)
    trackStore.setDragData(textClip)
}

// 处理点击添加
const handleAddText = (template: TextTemplate) => {
    const textClip = createTextClip(template)
    // 使用注入的 addClip 方法
    addClip?.(textClip as TrackClip, true)
}

// 创建文字clip
const createTextClip = (template: TextTemplate) => {
    return {
        id: v4(),
        type: 'text',
        name: template.name,
        duration: 5,
        startTime: 0,
        endTime: 5,
        opacity: 100,
        angle: 0,
        textConfig: {
            content: template.name || '基础文字',
            lineSpacing: 0,
            letterSpacing: 0,
            showStroke: false,
            strokeColor: '#ffffff',
            strokeWidth: 0,
            showShadow: false,
            shadowColor: '#ffffff',
            shadowBlur: 0,
            shadowOffsetX: 0,
            shadowOffsetY: 0,
            ...template.style,
        }
    }
}
</script>