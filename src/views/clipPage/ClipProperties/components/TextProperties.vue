<!--
 * 文字属性设置组件
 * 用于设置文字的内容、字体、样式、颜色等属性
-->
<template>
    <div class="mb-6">
        <div class="text-base font-medium text-white mb-4">文字属性</div>
        <!-- 文本内容 -->
        <div class="mb-2">
            <el-input v-model="clip.textConfig.content" type="textarea" :rows="3" placeholder="请输入文字内容" />
        </div>

        <!-- 字体设置 -->
        <div class="mb-4">
            <div class="text-base text-white mb-2">字体</div>
            <el-select v-model="clip.textConfig.fontFamily" class="w-full mb-2">
                <el-option label="DM Sans" value="DM Sans" />
                <el-option label="微软雅黑" value="Microsoft YaHei" />
                <el-option label="宋体" value="SimSun" />
                <el-option label="黑体" value="SimHei" />
            </el-select>
            <div class="text-base text-white mb-2">旋转角度</div>
            <div class="flex items-center gap-4 mb-3">
                <div class="w-full">
                    <el-input-number class="w-full" v-model="displayInputAngle" :min="0" :max="360" :step="1"
                        size="small" controls-position="right" @change="handleAngleInput" />
                </div>
                <div class="relative flex items-center justify-center" @mousedown="startRotate"
                    @mousemove="handleRotate" @mouseup="stopRotate" @mouseleave="stopRotate">
                    <div class="w-8 h-8 rounded-full border border-[#af24ff] relative">
                        <!-- 旋转指针 -->
                        <div class="absolute w-[1px] h-[13px] bg-[#af24ff]"
                            :style="{ transform: `rotate(${displayAngle}deg)`, left: 'calc(50% - 0.5px)', top: '50%', transformOrigin: 'top' }">
                            <div
                                class="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#af24ff]">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="flex justify-start items-center gap-1">
                <el-button :class="{ 'text-purple-500': clip.textConfig.bold }" size="small"
                    @click="clip.textConfig.bold = !clip.textConfig.bold">
                    <Icon icon="material-symbols:format-bold" />
                </el-button>
                <el-button class="!ml-0" :class="{ 'text-purple-500': clip.textConfig.italic }" size="small"
                    @click="clip.textConfig.italic = !clip.textConfig.italic">
                    <Icon icon="material-symbols:format-italic" />
                </el-button>
                <el-dropdown trigger="click" @command="handleAlign">
                    <el-button size="small">
                        <Icon :icon="alignIcon" />
                    </el-button>
                    <template #dropdown>
                        <el-dropdown-menu>
                            <el-dropdown-item command="left">
                                <Icon icon="material-symbols:format-align-left" />
                                <span class="text-sm text-white ml-2">左对齐</span>
                            </el-dropdown-item>
                            <el-dropdown-item command="center">
                                <Icon icon="material-symbols:format-align-center" />
                                <span class="text-sm text-white ml-2">居中</span>
                            </el-dropdown-item>
                            <el-dropdown-item command="right">
                                <Icon icon="material-symbols:format-align-right" />
                                <span class="text-sm text-white ml-2">右对齐</span>
                            </el-dropdown-item>
                        </el-dropdown-menu>
                    </template>
                </el-dropdown>
                <!-- 添加颜色选择器 -->
                <el-color-picker v-model="clip.textConfig.color" size="small" show-alpha />
            </div>
        </div>

        <!-- 高级设置 -->
        <el-collapse v-model="activeCollapse">
            <el-collapse-item name="advanced">
                <template #title>
                    <span class="text-base text-white">高级</span>
                </template>
                <!-- 透明度设置 -->
                <div class="py-2">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-base text-white">透明度</span>
                        <div class="flex-1 mx-4">
                            <el-slider v-model="clip.opacity" :min="0" :max="100" :step="1" />
                        </div>
                    </div>
                    <!-- 行高设置 -->
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-base text-white">行高</span>
                        <el-input-number v-model="clip.textConfig.lineSpacing" :min="0" :step="1"
                            controls-position="right" class="w-30" />
                    </div>
                    <!-- 字间距 -->
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-base text-white">字间距</span>
                        <el-input-number v-model="clip.textConfig.letterSpacing" :step="1" controls-position="right"
                            class="w-30" />
                    </div>
                    <!-- 边框设置 -->
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-base text-white">边框</span>
                        <el-switch v-model="clip.textConfig.showStroke" />
                    </div>
                    <template v-if="clip.textConfig.showStroke">
                        <div class="flex justify-between items-center mb-2 pl-4">
                            <span class="text-base text-white">边框颜色</span>
                            <el-color-picker v-model="clip.textConfig.strokeColor" show-alpha size="small" />
                        </div>
                        <div class="flex justify-between items-center mb-2 pl-4">
                            <span class="text-base text-white">边框宽度</span>
                            <el-input-number v-model="clip.textConfig.strokeWidth" :min="0" :step="0.5"
                                controls-position="right" class="w-30" />
                        </div>
                    </template>
                    <!-- 阴影设置 -->
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-base text-white">阴影</span>
                        <el-switch v-model="clip.textConfig.showShadow" />
                    </div>
                    <template v-if="clip.textConfig.showShadow">
                        <div class="flex justify-between items-center mb-2 pl-4">
                            <span class="text-base text-white">阴影颜色</span>
                            <el-color-picker v-model="clip.textConfig.shadowColor" show-alpha size="small" />
                        </div>
                        <div class="flex justify-between items-center mb-2 pl-4">
                            <span class="text-base text-white">阴影模糊</span>
                            <el-input-number v-model="clip.textConfig.shadowBlur" :min="0" :step="1"
                                controls-position="right" class="w-30" />
                        </div>
                        <div class="flex justify-between items-center mb-2 pl-4">
                            <span class="text-base text-white">水平偏移</span>
                            <el-input-number v-model="clip.textConfig.shadowOffsetX" :step="1" controls-position="right"
                                class="w-30" />
                        </div>
                        <div class="flex justify-between items-center mb-2 pl-4">
                            <span class="text-base text-white">垂直偏移</span>
                            <el-input-number v-model="clip.textConfig.shadowOffsetY" :step="1" controls-position="right"
                                class="w-30" />
                        </div>
                    </template>
                </div>
            </el-collapse-item>
        </el-collapse>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { TrackClip } from '@/types/track'
import { Icon } from '@iconify/vue'

const props = defineProps<{
    clip: TrackClip
}>()

const emit = defineEmits(['update'])

const isDragging = ref(false)
const activeCollapse = ref([])

// 弧度转角度
const toDegree = (radian: number) => {
    let degree = radian * (180 / Math.PI)
    degree = degree % 360
    if (degree < 0) degree += 360
    return Math.round(degree)
}

// 角度转弧度
const toRadian = (degree: number) => {
    return degree * (Math.PI / 180)
}

// 显示角度
const displayAngle = computed(() => {
    if (props.clip?.angle === undefined) return 0
    let angle = toDegree(props.clip.angle)
    angle = (angle + 180) % 360
    return angle
})

// 输入框显示的角度
const displayInputAngle = computed({
    get: () => {
        if (props.clip?.angle === undefined) return 0
        return toDegree(props.clip.angle)
    },
    set: (val) => {
        if (!props.clip) return
        props.clip.angle = toRadian(val)
    }
})

// 对齐方式图标
const alignIcon = computed(() => {
    switch (props.clip?.textConfig?.align) {
        case 'center':
            return 'material-symbols:format-align-center'
        case 'right':
            return 'material-symbols:format-align-right'
        default:
            return 'material-symbols:format-align-left'
    }
})

// 处理对齐方式
const handleAlign = (command: 'left' | 'center' | 'right') => {
    if (props.clip) {
        props.clip.textConfig.align = command
        emit('update', props.clip)
    }
}

// 处理角度输入
const handleAngleInput = (val: number | null) => {
    if (!props.clip) return
    if (val === null || isNaN(val)) {
        props.clip.angle = 0
        return
    }
    let degree = val % 360
    if (degree < 0) degree += 360
    props.clip.angle = toRadian(degree)
    emit('update', props.clip)
}

// 开始旋转
const startRotate = (e: MouseEvent) => {
    isDragging.value = true
}

// 处理旋转
const handleRotate = (e: MouseEvent) => {
    if (!isDragging.value || !props.clip) return

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    let angle = Math.atan2(e.clientY - centerY, e.clientX - centerX)
    angle = (angle + Math.PI / 2)
    if (angle < 0) angle += Math.PI * 2

    props.clip.angle = angle
    emit('update', props.clip)
}

// 停止旋转
const stopRotate = () => {
    isDragging.value = false
}
</script>

<style scoped>
:deep(.el-slider__runway) {
    background-color: #2a2a2a;
}

:deep(.el-slider__bar) {
    background-color: theme('colors.purple.500');
}

:deep(.el-slider__button) {
    border-color: theme('colors.purple.500');
}

:deep(.el-collapse-item__header) {
    background-color: transparent;
    border: none;
    color: white;
}

:deep(.el-collapse-item__content) {
    background-color: transparent;
    color: white;
    padding: 0;
}

:deep(.el-collapse-item__arrow) {
    color: white;
}
</style>