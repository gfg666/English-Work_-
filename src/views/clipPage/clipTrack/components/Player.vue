<template>
    <div class="player-container w-full h-full bg-black relative flex flex-col">
        <!-- 视频显示区域 -->
        <div class="video-area flex-1 relative">
            <!-- av-canvas -->
            <av-canvas ref="avCanvas" class="w-full h-full"></av-canvas>
        </div>

        <!-- 控制栏容器 -->
        <div class="control-bar-container relative bg-[#1a1a1a] h-12">
            <!-- 控制栏 -->
            <div class="w-full h-full px-4 flex items-center gap-4">
                <!-- 上一帧 -->
                <button class="text-white hover:text-purple-500 transition-colors p-2" @click="prevFrame">
                    <i class="fas fa-step-backward"></i>
                </button>

                <!-- 播放/暂停按钮 -->
                <button class="text-white hover:text-purple-500 transition-colors p-2" @click="togglePlay">
                    <i :class="['fas', isPlaying ? 'fa-pause' : 'fa-play']"></i>
                </button>

                <!-- 下一帧 -->
                <button class="text-white hover:text-purple-500 transition-colors p-2" @click="nextFrame">
                    <i class="fas fa-step-forward"></i>
                </button>

                <!-- 当前时间 -->
                <div class="text-white text-sm min-w-[40px]">
                    {{ formatTime(currentTime) }}
                </div>

                <!-- 时间分隔符 -->
                <div class="text-white text-sm">/</div>

                <!-- 总时长 -->
                <div class="text-white text-sm min-w-[40px]">
                    {{ formatTime(duration) }}
                </div>

                <!-- 右侧控制按钮组 -->
                <div class="ml-auto flex items-center gap-4">
                    <!-- 音量控制 -->
                    <div class="volume-control relative group">
                        <button class="text-white hover:text-purple-500 transition-colors p-2" @click="toggleMute">
                            <i :class="['fas', volumeIcon]"></i>
                        </button>
                        <!-- 音量滑块 -->
                        <div
                            class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 h-8 bg-[#1a1a1a] rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            <input type="range"
                                class="absolute top-1/2 left-4 right-4 -translate-y-1/2 accent-purple-500" min="0"
                                max="100" :value="volume" @input="updateVolume">
                        </div>
                    </div>

                    <!-- 全屏按钮 -->
                    <button class="text-white hover:text-purple-500 transition-colors p-2" @click="toggleFullscreen">
                        <i :class="['fas', isFullscreen ? 'fa-compress' : 'fa-expand']"></i>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
// ... script 部分保持不变 ...
</script>

<style scoped>
.player-container {
    aspect-ratio: 16/9;
    min-height: 200px;
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

.volume-control:hover input[type="range"] {
    display: block;
}
</style>