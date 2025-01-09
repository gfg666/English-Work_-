<template>
    <div class="p-6 text-white">
        <template v-if="clip">
            <!-- 视频属性 -->
            <template v-if="clip.type === 'video'">
                <div class="mb-6">
                    <div class="text-base font-medium text-white mb-4">视频属性</div>
                    <div class="grid grid-cols-2 gap-3 mb-4">
                        <div>
                            <div class="text-base text-[#999] mb-1">X 坐标</div>
                            <el-input-number class="w-30" v-model="clip.x" size="small" placeholder="X" :precision="0"
                                @change="val => handleDefaultZero(val, 'x')" />
                        </div>
                        <div>
                            <div class="text-base text-[#999] mb-1">Y 坐标</div>
                            <el-input-number class="w-30" v-model="clip.y" size="small" placeholder="Y" :precision="0"
                                @change="val => handleDefaultZero(val, 'y')" />
                        </div>
                    </div>
                    <!-- 旋转角度 -->
                    <div class="mb-4">
                        <div class="text-base text-[#999] mb-2">旋转角度</div>
                        <div class="flex items-center gap-4">
                            <div class="w-full">
                                <el-input-number class="w-full" v-model="displayInputAngle" :min="0" :max="360"
                                    :step="1" size="small" controls-position="right" @change="handleAngleInput" />
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
                    </div>
                    <div class="flex gap-3 mb-3">
                        <div class="flex-1">
                            <div class="text-base text-[#999] mb-1">去片头</div>
                            <el-input-number class="w-30" v-model="clip.sourceStartTime" size="small" :min="0"
                                :step="0.1" placeholder="去片头时间"
                                @change="val => handleDefaultZero(val, 'sourceStartTime')" />
                        </div>
                        <div class="flex-1">
                            <div class="text-base text-[#999] mb-1">去片尾</div>
                            <el-input-number class="w-30" v-model="clip.sourceEndTime" size="small" :min="0" :step="0.1"
                                placeholder="去片尾时间" @change="val => handleDefaultZero(val, 'sourceEndTime')" />
                        </div>
                    </div>
                    <div class="flex items-center gap-3 mb-3">
                        <div class="flex-1">
                            <div class="text-base text-[#999] mb-1">音量</div>
                            <div class="flex items-center gap-3">
                                <el-slider v-model="clip.volume" :min="0" :max="100" :step="1" />
                                <Icon v-if="clip.volume === 100" icon="material-symbols:volume-up"
                                    @click="clip.volume = 0" />
                                <Icon v-else-if="clip.volume !== 0" icon="material-symbols:volume-down"
                                    @click="clip.volume = 0" />
                                <Icon v-else icon="material-symbols:volume-off" @click="clip.volume = 100" />
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <div class="flex-1">
                            <div class="text-base text-[#999] mb-1">不透明度</div>
                            <div class="flex items-center gap-3">
                                <el-slider v-model="clip.opacity" :min="0" :max="100" :step="1" />
                                <div class="w-12 text-right">{{ Math.round(clip.opacity) }}%</div>
                            </div>
                        </div>
                    </div>
                </div>
            </template>

            <!-- 音频属性 -->
            <template v-if="clip.type === 'audio'">
                <div class="mb-6">
                    <div class="text-base font-medium text-white mb-4">音频属性</div>
                    <div class="flex gap-3 mb-3">
                        <div class="flex-1">
                            <div class="text-base text-[#999] mb-1">去片头</div>
                            <el-input-number class="w-30" v-model="clip.sourceStartTime" size="small" :min="0"
                                :step="0.1" placeholder="去片头时间"
                                @change="val => handleDefaultZero(val, 'sourceStartTime')" />
                        </div>
                        <div class="flex-1">
                            <div class="text-base text-[#999] mb-1">去片尾</div>
                            <el-input-number class="w-30" v-model="clip.sourceEndTime" size="small" :min="0" :step="0.1"
                                placeholder="去片尾时间" @change="val => handleDefaultZero(val, 'sourceEndTime')" />
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <div class="flex-1">
                            <div class="text-base text-[#999] mb-1">音量</div>
                            <div class="flex items-center gap-3">
                                <el-slider v-model="clip.volume" :min="0" :max="100" :step="1" />
                                <Icon v-if="clip.volume === 100" icon="material-symbols:volume-up"
                                    @click="clip.volume = 0" />
                                <Icon v-else-if="clip.volume !== 0" icon="material-symbols:volume-down"
                                    @click="clip.volume = 0" />
                                <Icon v-else icon="material-symbols:volume-off" @click="clip.volume = 100" />
                            </div>
                        </div>
                    </div>
                </div>
            </template>

            <!-- 图片属性 -->
            <template v-if="clip.type === 'image'">
                <div class="mb-6">
                    <div class="text-base font-medium text-white mb-4">图片属性</div>
                    <div class="grid grid-cols-2 gap-3 mb-4">
                        <div>
                            <div class="text-base text-[#999] mb-1">X 坐标</div>
                            <el-input-number class="w-30" v-model="clip.x" size="small" placeholder="X" :precision="0"
                                @change="val => handleDefaultZero(val, 'x')" />
                        </div>
                        <div>
                            <div class="text-base text-[#999] mb-1">Y 坐标</div>
                            <el-input-number class="w-30" v-model="clip.y" size="small" placeholder="Y" :precision="0"
                                @change="val => handleDefaultZero(val, 'y')" />
                        </div>
                    </div>
                    <!-- 旋转角度 -->
                    <div class="mb-4">
                        <div class="text-base text-[#999] mb-2">旋转角度</div>
                        <div class="flex items-center gap-4">
                            <div class="w-full">
                                <el-input-number class="w-full" v-model="displayInputAngle" :min="0" :max="360"
                                    :step="1" size="small" controls-position="right" @change="handleAngleInput" />
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
                    </div>
                    <div class="flex items-center gap-3">
                        <div class="flex-1">
                            <div class="text-base text-[#999] mb-1">不透明度</div>
                            <div class="flex items-center gap-3">
                                <el-slider v-model="clip.opacity" :min="0" :max="100" :step="1" />
                                <div class="w-12 text-right">{{ Math.round(clip.opacity) }}%</div>
                            </div>
                        </div>
                    </div>
                </div>
            </template>

            <!-- 文字属性 -->
            <template v-if="clip.type === 'text'">
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
                                <el-input-number class="w-full" v-model="displayInputAngle" :min="0" :max="360"
                                    :step="1" size="small" controls-position="right" @change="handleAngleInput" />
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
                                    <el-input-number v-model="clip.textConfig.letterSpacing" :step="1"
                                        controls-position="right" class="w-30" />
                                </div>
                                <!-- 边框设置 -->
                                <div class="flex justify-between items-center mb-2">
                                    <span class="text-base text-white">边框</span>
                                    <el-switch v-model="clip.textConfig.showStroke" />
                                </div>
                                <template v-if="clip.textConfig.showStroke">
                                    <div class="flex justify-between items-center mb-2 pl-4">
                                        <span class="text-base text-white">边框颜色</span>
                                        <el-color-picker v-model="clip.textConfig.strokeColor" show-alpha
                                            size="small" />
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
                                        <el-color-picker v-model="clip.textConfig.shadowColor" show-alpha
                                            size="small" />
                                    </div>
                                    <div class="flex justify-between items-center mb-2 pl-4">
                                        <span class="text-base text-white">阴影模糊</span>
                                        <el-input-number v-model="clip.textConfig.shadowBlur" :min="0" :step="1"
                                            controls-position="right" class="w-30" />
                                    </div>
                                    <div class="flex justify-between items-center mb-2 pl-4">
                                        <span class="text-base text-white">水平偏移</span>
                                        <el-input-number v-model="clip.textConfig.shadowOffsetX" :step="1"
                                            controls-position="right" class="w-30" />
                                    </div>
                                    <div class="flex justify-between items-center mb-2 pl-4">
                                        <span class="text-base text-white">垂直偏移</span>
                                        <el-input-number v-model="clip.textConfig.shadowOffsetY" :step="1"
                                            controls-position="right" class="w-30" />
                                    </div>
                                </template>
                            </div>
                        </el-collapse-item>
                    </el-collapse>
                </div>
            </template>
        </template>
        <div v-else class="text-center text-[#999] text-base">
            请选择一个片段
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTrackStore } from '@/store/modules/track'
import { Icon } from '@iconify/vue'

const props = defineProps<{
    clip: any
}>()

const trackStore = useTrackStore()
const activeCollapse = ref([])
const isDragging = ref(false)

// 弧度转角度
const toDegree = (radian: number) => {
    let degree = radian * (180 / Math.PI)
    // 确保角度在 0-360 范围内
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
    // 显示时减去180度来修正指针方向
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

// 处理角度输入
const handleAngleInput = (val: number | null) => {
    if (!props.clip) return
    // 如果输入为空或无效，默认使用0度
    if (val === null || isNaN(val)) {
        props.clip.angle = 0
        return
    }
    // 确保角度在 0-360 范围内
    let degree = val % 360
    if (degree < 0) degree += 360
    // 转换为弧度
    props.clip.angle = toRadian(degree)
}

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
const handleAlign = (command: string) => {
    if (props.clip) {
        props.clip.textConfig.align = command
    }
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

    // 计算角度
    let angle = Math.atan2(e.clientY - centerY, e.clientX - centerX)
    angle = (angle + Math.PI / 2) // 调整为以上方为0度，逆时针为正
    if (angle < 0) angle += Math.PI * 2

    props.clip.angle = angle
}

// 停止旋转
const stopRotate = () => {
    isDragging.value = false
}

// 处理默认值为0
const handleDefaultZero = (val: number | null, prop: string) => {
    if (!props.clip) return
    if (val === null || isNaN(val)) {
        props.clip[prop] = 0
    }
}
// 监听属性变化
watch(() => props.clip, (newClip) => {
    if (!newClip) return
    trackStore.publishClipUpdate(newClip)
}, { deep: true })
</script>

<style lang="scss">
:deep(.el-input-number) {
    @apply w-full;
}

:deep(.el-input-number .el-input__wrapper) {
    @apply bg-[#1a1a1a] border-[#333] hover:border-[#666];
}

:deep(.el-textarea__inner) {
    @apply bg-[#1a1a1a] border-[#333] text-white hover:border-[#666];
}

:deep(.el-input__inner) {
    @apply bg-[#1a1a1a] border-[#333] text-white hover:border-[#666];
}

:deep(.el-select) {
    @apply w-full;
}

:deep(.el-select .el-input__wrapper) {
    @apply bg-[#1a1a1a] border-[#333] hover:border-[#666];
}

:deep(.el-slider) {
    @apply w-full;
}

:deep(.el-color-picker) {
    @apply w-full;
}

:deep(.el-color-picker .el-color-picker__trigger) {
    @apply w-full border-[#333] hover:border-[#666];
}

:deep(.el-button) {
    @apply bg-transparent border-[#333] text-white hover:bg-[#333] hover:border-[#666];
}

:deep(.el-input-number.is-controls-right .el-input-number__decrease),
:deep(.el-input-number.is-controls-right .el-input-number__increase) {
    @apply bg-transparent border-[#333] text-white hover:bg-[#333];
}

:deep(.el-switch) {
    --el-switch-on-color: #8b5cf6;
}

:deep(.el-collapse) {
    @apply border-none bg-transparent;
}

:deep(.el-collapse-item__header) {
    @apply bg-transparent border-none text-white;
}

:deep(.el-collapse-item__content) {
    @apply bg-transparent text-white p-0;
}

:deep(.el-collapse-item__arrow) {
    @apply text-white;
}

:deep(.el-dropdown-menu) {
    @apply bg-[#1a1a1a] border-[#333];
}

:deep(.el-dropdown-menu__item) {
    @apply text-white hover:bg-[#333] hover:text-white;
}

:deep(.el-dropdown-menu__item:not(.is-disabled):hover) {
    @apply bg-[#333] text-white;
}
</style>