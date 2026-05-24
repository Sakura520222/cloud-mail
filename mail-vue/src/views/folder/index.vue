<template>
  <div class="folder-manage">
    <div class="manage-header">
      <span class="title">{{$t('folderManage')}}</span>
      <el-button type="primary" size="small" @click="openAdd">
        <Icon icon="mdi:plus" width="16" height="16" />
        {{$t('createFolder')}}
      </el-button>
    </div>
    <el-scrollbar class="scroll">
      <div class="folder-list">
        <div v-for="item in folderStore.folders" :key="item.folderId" class="folder-item">
          <Icon :icon="item.icon || 'mdi:folder-outline'" width="20" height="20" />
          <span class="folder-name">{{item.name}}</span>
          <div class="folder-actions">
            <Icon icon="mdi:pencil-outline" width="16" height="16" @click="openEdit(item)" />
            <Icon icon="mdi:delete-outline" width="16" height="16" @click="handleDelete(item)" />
          </div>
        </div>
        <div v-if="folderStore.folders.length === 0" class="empty-tip">
          {{$t('noMessagesFound')}}
        </div>
      </div>
    </el-scrollbar>

    <el-dialog v-model="dialogVisible" :title="isEdit ? $t('editFolder') : $t('createFolder')" width="400">
      <el-form>
        <el-form-item :label="$t('folderName')">
          <el-input v-model="form.name" :placeholder="$t('folderNamePlaceholder')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{$t('cancel')}}</el-button>
        <el-button type="primary" @click="handleSubmit">{{$t('confirm')}}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useFolderStore } from '@/store/folder.js'
import { folderAdd, folderUpdate, folderDelete } from '@/request/folder.js'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const folderStore = useFolderStore()
const dialogVisible = ref(false)
const isEdit = ref(false)
const form = ref({ folderId: null, name: '' })

onMounted(() => {
  folderStore.refreshFolders()
})

function openAdd() {
  isEdit.value = false
  form.value = { folderId: null, name: '' }
  dialogVisible.value = true
}

function openEdit(item) {
  isEdit.value = true
  form.value = { folderId: item.folderId, name: item.name }
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!form.value.name.trim()) return
  if (isEdit.value) {
    await folderUpdate(form.value.folderId, form.value.name)
    ElMessage.success(t('folderUpdated'))
  } else {
    await folderAdd(form.value.name)
    ElMessage.success(t('folderCreated'))
  }
  dialogVisible.value = false
  await folderStore.refreshFolders()
}

async function handleDelete(item) {
  try {
    await ElMessageBox.confirm(t('confirmDeleteFolder', { name: item.name }), t('warning'), { type: 'warning' })
    await folderDelete(item.folderId)
    ElMessage.success(t('folderDeleted'))
    await folderStore.refreshFolders()
  } catch {}
}
</script>

<style scoped>
.folder-manage {
  padding: 20px;
}
.manage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.manage-header .title {
  font-size: 18px;
  font-weight: bold;
}
.folder-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.folder-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  gap: 10px;
}
.folder-name {
  flex: 1;
  font-size: 14px;
}
.folder-actions {
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}
.folder-item:hover .folder-actions {
  opacity: 1;
}
.folder-actions .icon {
  cursor: pointer;
  color: var(--el-text-color-secondary);
}
.folder-actions .icon:hover {
  color: var(--el-color-primary);
}
.empty-tip {
  text-align: center;
  color: var(--el-text-color-secondary);
  padding: 40px 0;
}
</style>
