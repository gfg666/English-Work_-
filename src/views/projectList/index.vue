<template>
    <div class="project-list">
        <div class="header">
            <h1>我的剪辑项目</h1>
            <el-button type="primary" @click="createNewProject">新建项目</el-button>
        </div>

        <div v-if="!projects.length" class="empty-state">
            <div class="empty-content">
                <el-icon class="empty-icon">
                    <VideoCamera />
                </el-icon>
                <p class="empty-text">还没有创建任何项目</p>
                <p class="empty-subtext">点击"新建项目"开始创作吧！</p>
                <el-button type="primary" class="mt-4" @click="createNewProject">
                    <el-icon class="mr-2">
                        <Plus />
                    </el-icon>
                    新建项目
                </el-button>
            </div>
        </div>

        <div v-else class="projects-grid text-base">
            <div v-for="project in projects" :key="project.id" class="project-card">
                <div class="thumbnail" @click="openProject(project)">
                    <img v-if="project.thumbnail" class="rounded-t-xl" :src="project.thumbnail" alt="项目缩略图">
                    <div v-else class="placeholder">无缩略图</div>
                </div>
                <div class="info">
                    <div class="flex justify-between items-center">
                        <h3>{{ project.name }}</h3>
                        <el-button type="danger" size="small" @click.stop="confirmDelete(project)">
                            删除
                        </el-button>
                    </div>
                    <p>更新时间：{{ formatDate(project.updateTime) }}</p>
                </div>
            </div>
        </div>

        <el-dialog v-model="dialogVisible" title="新建项目">
            <el-form :model="newProject" @submit.prevent="handleCreateProject">
                <el-form-item label="项目名称">
                    <el-input v-model="newProject.name" ref="inputRef" @keyup.enter="handleCreateProject"></el-input>
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="handleCreateProject">确定</el-button>
            </template>
        </el-dialog>

        <el-dialog v-model="deleteDialogVisible" title="删除确认" width="30%">
            <span>确定要删除项目"{{ projectToDelete?.name }}"吗？此操作不可恢复。</span>
            <template #footer>
                <el-button @click="deleteDialogVisible = false">取消</el-button>
                <el-button type="danger" @click="handleDeleteProject">确定删除</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { db, type Project } from '@/db/db';
import dayjs from 'dayjs';
import { ElMessage } from 'element-plus';
import { VideoCamera, Plus } from '@element-plus/icons-vue';
import { getFileUrl } from '@/utils/opfs-file';

const router = useRouter();
const projects = ref<Project[]>([]);
const dialogVisible = ref(false);
const newProject = ref({ name: '' });
const inputRef = ref();

// 删除相关
const deleteDialogVisible = ref(false);
const projectToDelete = ref<Project | null>(null);

onMounted(async () => {
    getProjectList()
});

const getProjectList = async () => {
    projects.value = await db.projects.toArray();
    projects.value.forEach(async (project) => {
        project.thumbnail = await getFileUrl(project.thumbnail)
    })
};

const createNewProject = () => {
    dialogVisible.value = true;
    nextTick(() => {
        inputRef.value.focus();
    });
};

const handleCreateProject = async () => {
    if (!newProject.value.name) return;
    const project = await db.projects.add({
        name: newProject.value.name,
        createTime: new Date().getTime(),
        tracks: [],
        thumbnail: ''
    });
    dialogVisible.value = false;
    newProject.value.name = '';
    getProjectList()
};

const openProject = (project: Project) => {
    // 获取当前窗口的URL和路径
    const baseUrl = window.location.origin;
    const basePath = window.location.pathname;
    // 处理基础路径 - 移除最后一级路径(projects)及其后的内容
    const cleanBasePath = basePath.split('/projects')[0];
    // 构建项目URL,确保使用正确的基础路径
    const projectUrl = `${baseUrl}${cleanBasePath}#/clip/${project.id}`;
    console.log(baseUrl, basePath, cleanBasePath, projectUrl);
    // 在新标签页中打开
    window.open(projectUrl, '_blank');
};

const confirmDelete = (project: Project) => {
    projectToDelete.value = project;
    deleteDialogVisible.value = true;
};

const handleDeleteProject = async () => {
    if (!projectToDelete.value?.id) return;

    try {
        await db.projects.delete(projectToDelete.value.id);
        ElMessage.success('项目删除成功');
        deleteDialogVisible.value = false;
        projectToDelete.value = null;
        await getProjectList();
    } catch (error) {
        ElMessage.error('删除项目失败');
        console.error('删除项目失败:', error);
    }
};

const formatDate = (timestamp: number) => {
    return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss');
};
</script>

<style scoped>
.project-list {
    padding: 20px;
    min-height: calc(100vh - 40px);
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.empty-state {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: calc(100vh - 120px);
    background: #1a1a1a;
    border-radius: 8px;
}

.empty-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40px;
}

.empty-icon {
    font-size: 64px;
    color: #666;
    margin-bottom: 16px;
}

.empty-text {
    font-size: 20px;
    color: #666;
    margin-bottom: 8px;
}

.empty-subtext {
    font-size: 14px;
    color: #555;
    margin-bottom: 16px;
}

.projects-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 20px;
}

.project-card {
    border: 1px solid #686868;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.2s;
    background: #1a1a1a;
}

.project-card:hover {
    transform: translateY(-5px);
}

.thumbnail {
    height: 150px;
    background: #333333;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 5px;
}

.placeholder {
    color: #666;
    font-size: 14px;
}

.info {
    padding: 10px;
}

.info h3 {
    margin: 0;
    font-size: 16px;
    color: #fff;
}

.info p {
    margin: 8px 0 0;
    font-size: 12px;
    color: #999;
}
</style>