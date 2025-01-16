<template>
  <el-result icon="warning" title="404" sub-title="抱歉，您访问的页面不存在!">
    <template #extra>
      <el-button type="primary" @click="backHome">返回首页</el-button>
    </template>
  </el-result>
</template>

<script setup lang="ts">
const router = useRouter();
const backHome = () => {
  router.push('/index');
};
</script>

<style lang="scss" scoped></style>
