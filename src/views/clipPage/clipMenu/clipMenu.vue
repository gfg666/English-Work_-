<template>
    <div class="h-screen">
        <el-tabs type="border-card" tabPosition="left">
            <el-tab-pane v-for="item in menuList" label="User">
                <template #label>
                    <div class="flex flex-col items-center justify-center">
                        <el-icon>
                            <Files />
                        </el-icon>
                        <div>{{ item.name }}</div>
                    </div>
                </template>
                <component :is="item.component" class="w-full h-screen bg-[#303030]" />
            </el-tab-pane>
        </el-tabs>
    </div>
</template>

<script setup lang='ts'>
import MediaLibrary from './components/mediaLibrary.vue';
import TextLibrary from './components/textLibrary.vue';
import FilterLibrary from './components/filterLibrary.vue';

const menuList = [
    { name: '媒体库', component: MediaLibrary },
    { name: '文字', component: TextLibrary },
    { name: '滤镜', component: FilterLibrary },
    // { name: 'Role', component: 'Role' },
    // { name: 'Task', component: 'Task' },
]
</script>

<style lang="scss" scoped>
:deep(.el-tabs) {
    border: none;
    background-color: #1b1b1d;

    .el-tabs__header {
        border: none;
        margin-right: 0;

        .el-tabs__item {
            display: flex;
            justify-content: center;
            height: auto;
            background-color: #1b1b1d;
            color: #bdbdbd;
            padding: 0.75rem 1rem;
            border: none !important;

            &:hover {
                color: #bdbdbd;
            }

            &.is-active {
                background-color: #303030;
            }
        }
    }

    .el-tabs__content {
        padding: 0;
    }
}
</style>