<template>
  <div class="tag-manage">
    <div class="manage-header">
      <span class="title">{{$t('tagManage')}}</span>
      <el-button type="primary" size="small" @click="openAdd">
        <Icon icon="mdi:plus" width="16" height="16" />
        {{$t('createTag')}}
      </el-button>
    </div>
    <el-scrollbar class="scroll">
      <div class="tag-list">
        <div v-for="item in tagStore.tags" :key="item.tagId" class="tag-item">
          <span class="tag-color" :style="{background: item.color}"></span>
          <span class="tag-name">{{item.name}}</span>
          <div class="tag-actions">
            <Icon icon="mdi:pencil-outline" width="16" height="16" @click="openEdit(item)" />
            <Icon icon="mdi:delete-outline" width="16" height="16" @click="handleDelete(item)" />
          </div>
        </div>
        <div v-if="tagStore.tags.length === 0" class="empty-tip">
          {{$t('noMessagesFound')}}
        </div>
      </div>
    </el-scrollbar>

    <el-dialog v-model="dialogVisible" :title="isEdit ? $t('editTag') : $t('createTag')" width="400">
      <el-form>
        <el-form-item :label="$t('tagName')">
          <el-input v-model="form.name" :placeholder="$t('tagNamePlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('tagColor')">
          <el-color-picker v-model="form.color" />
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
import { useTagStore } from '@/store/tag.js'
import { tagAdd, tagUpdate, tagDelete } from '@/request/tag.js'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const tagStore = useTagStore()
const dialogVisible = ref(false)
const isEdit = ref(false)
const form = ref({ tagId: null, name: '', color: '#409EFF' })

onMounted(() => {
  tagStore.refreshTags()
})

function openAdd() {
  isEdit.value = false
  form.value = { tagId: null, name: '', color: '#409EFF' }
  dialogVisible.value = true
}

function openEdit(item) {
  isEdit.value = true
  form.value = { tagId: item.tagId, name: item.name, color: item.color }
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!form.value.name.trim()) return
  if (isEdit.value) {
    await tagUpdate(form.value.tagId, form.value.name, form.value.color)
    ElMessage.success(t('tagUpdated'))
  } else {
    await tagAdd(form.value.name, form.value.color)
    ElMessage.success(t('tagCreated'))
  }
  dialogVisible.value = false
  await tagStore.refreshTags()
}

async function handleDelete(item) {
  try {
    await ElMessageBox.confirm(t('confirmDeleteTag', { name: item.name }), t('warning'), { type: 'warning' })
    await tagDelete(item.tagId)
    ElMessage.success(t('tagDeleted'))
    await tagStore.refreshTags()
  } catch {}
}
</script>

<style scoped>
.tag-manage {
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
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.tag-item {
  display: flex;
  align-items: center;
  padding: 8px 14px;
  border-radius: 20px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  gap: 8px;
  transition: all 0.2s;
}
.tag-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}
.tag-name {
  font-size: 14px;
}
.tag-actions {
  display: flex;
  gap: 6px;
  opacity: 0;
  transition: opacity 0.2s;
}
.tag-item:hover .tag-actions {
  opacity: 1;
}
.tag-actions .icon {
  cursor: pointer;
  color: var(--el-text-color-secondary);
}
.tag-actions .icon:hover {
  color: var(--el-color-primary);
}
.empty-tip {
  text-align: center;
  color: var(--el-text-color-secondary);
  padding: 40px 0;
  width: 100%;
}
</style>
