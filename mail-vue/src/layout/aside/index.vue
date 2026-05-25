<template>
  <el-scrollbar class="scroll">
    <div>
      <div class="title" >
        <Icon icon="mdi:email-outline" width="24" height="24" />
        <div>{{settingStore.settings.title}}</div>
      </div>
      <el-menu :collapse="false" text-color="#fff" active-text-color="#fff" style="margin-top: 10px">
        <el-menu-item @click="router.push({name: 'email'})" index="email"
                      :class="route.meta.name === 'email' ? 'choose-item' : ''">
          <Icon icon="hugeicons:mailbox-01" width="20" height="20" />
          <span class="menu-name" style="margin-left: 21px">{{$t('inbox')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'send'})" index="send" v-perm="'email:send'"
                      :class="route.meta.name === 'send' ? 'choose-item' : ''">
          <Icon icon="cil:send" width="20" height="20" />
          <span class="menu-name" style="margin-left: 21px">{{$t('sent')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'draft'})" index="draft" v-perm="'email:send'"
                      :class="route.meta.name === 'draft' ? 'choose-item' : ''">
          <Icon icon="ep:document" width="19" height="19" />
          <span class="menu-name" style="margin-left: 22px">{{$t('drafts')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'star'})" index="star"
                      :class="route.meta.name === 'star' ? 'choose-item' : ''">
          <Icon icon="solar:star-line-duotone" width="20" height="20" />
          <span class="menu-name" style="margin-left: 21px">{{$t('starred')}}</span>
        </el-menu-item>

        <!-- Folders section -->
        <div class="section-header">
          <span class="section-title" v-if="folderStore.folders.length > 0">{{$t('folders')}}</span>
          <Icon class="section-add-icon" icon="mdi:plus" width="16" height="16" @click="openAddFolder" />
        </div>
        <el-menu-item v-for="f in folderStore.folders" :key="'folder-'+f.folderId"
                      @click="router.push({path: '/email-folder/' + f.folderId})"
                      :class="route.params.folderId == f.folderId ? 'choose-item' : ''">
          <Icon :icon="f.icon || 'mdi:folder-outline'" width="20" height="20" />
          <span class="menu-name" style="margin-left: 21px">{{f.name}}</span>
          <Icon class="item-delete-icon" icon="mdi:close" width="14" height="14" @click.stop="handleDeleteFolder(f)" />
        </el-menu-item>

        <!-- Tags section -->
        <div class="section-header">
          <span class="section-title" v-if="tagStore.tags.length > 0">{{$t('tags')}}</span>
          <Icon class="section-add-icon" icon="mdi:plus" width="16" height="16" @click="openAddTag" />
        </div>
        <el-menu-item v-for="tg in tagStore.tags" :key="'tag-'+tg.tagId"
                      @click="router.push({path: '/email-tag/' + tg.tagId})"
                      :class="route.params.tagId == tg.tagId ? 'choose-item' : ''">
          <span class="tag-dot" :style="{background: tg.color}"></span>
          <span class="menu-name" style="margin-left: 17px">{{tg.name}}</span>
          <Icon class="item-delete-icon" icon="mdi:close" width="14" height="14" @click.stop="handleDeleteTag(tg)" />
        </el-menu-item>

        <el-menu-item @click="router.push({name: 'analysis'})" index="analysis"
                      :class="route.meta.name === 'analysis' ? 'choose-item' : ''">
          <Icon icon="fluent:data-pie-20-regular" width="20" height="20" />
          <span class="menu-name" style="margin-left: 21px">{{$t('analytics')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'setting'})" index="setting"
                      :class="route.meta.name === 'setting' ? 'choose-item' : ''">
          <Icon icon="fluent:settings-48-regular" width="20" height="20" />
          <span class="menu-name" style="margin-left: 21px">{{$t('settings')}}</span>
        </el-menu-item>
        <div class="manage-title" v-perm="['all-email:query','user:query','role:query','setting:query','reg-key:query']">
          <div>{{$t('manage')}}</div>
        </div>
        <el-menu-item @click="router.push({name: 'user'})" index="setting" v-perm="'user:query'"
                      :class="route.meta.name === 'user' ? 'choose-item' : ''">
          <Icon icon="si:user-alt-2-line" width="20" height="20" />
          <span class="menu-name" style="margin-left: 21px">{{$t('allUsers')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'all-email'})" index="all-email" v-perm="'all-email:query'"
                      :class="route.meta.name === 'all-email' ? 'choose-item' : ''">
          <Icon icon="fluent:mail-list-28-regular" width="22" height="22" />
          <span class="menu-name" style="margin-left: 20px">{{$t('allMail')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'role'})" index="setting" v-perm="'role:query'"
                      :class="route.meta.name === 'role' ? 'choose-item' : ''">
          <Icon icon="fluent:lock-closed-16-regular" width="22" height="22" />
          <span class="menu-name" style="margin-left: 20px">{{$t('permissions')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'reg-key'})" index="reg-key" v-perm="'reg-key:query'"
                      :class="route.meta.name === 'reg-key' ? 'choose-item' : ''">
          <Icon icon="fluent:fingerprint-20-filled" width="22" height="22" />
          <span class="menu-name" style="margin-left: 20px">{{$t('inviteCode')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'sys-setting'})" index="sys-setting" v-perm="'setting:query'"
                      :class="route.meta.name === 'sys-setting' ? 'choose-item' : ''">
          <Icon icon="eos-icons:system-ok-outlined" width="18" height="18" style="margin-left: 2px" />
          <span class="menu-name" style="margin-left: 22px">{{$t('SystemSettings')}}</span>
        </el-menu-item>
      </el-menu>
    </div>
  </el-scrollbar>
</template>

<script setup>
import router from "@/router/index.js";
import { useRoute } from "vue-router";
import {Icon} from "@iconify/vue";
import {useSettingStore} from "@/store/setting.js";
import {useFolderStore} from "@/store/folder.js";
import {useTagStore} from "@/store/tag.js";
import {folderAdd, folderDelete} from "@/request/folder.js";
import {tagAdd, tagDelete} from "@/request/tag.js";
import {ElMessage, ElMessageBox} from 'element-plus';
import {useI18n} from "vue-i18n";
import {onMounted} from "vue";

const {t} = useI18n();
const settingStore = useSettingStore();
const folderStore = useFolderStore();
const tagStore = useTagStore();
const route = useRoute();

onMounted(async () => {
  try {
    await folderStore.refreshFolders();
    await tagStore.refreshTags();
  } catch {}
});

async function openAddFolder() {
  try {
    const {value} = await ElMessageBox.prompt(t('folderNamePlaceholder'), t('createFolder'), {
      confirmButtonText: t('createFolder'),
      cancelButtonText: 'Cancel',
      inputPattern: /\S+/,
      inputErrorMessage: t('folderNamePlaceholder')
    });
    await folderAdd(value.trim(), '');
    await folderStore.refreshFolders();
    ElMessage.success(t('folderCreated'));
  } catch {}
}

async function handleDeleteFolder(f) {
  try {
    await ElMessageBox.confirm(
      t('confirmDeleteFolder', {name: f.name}),
      {confirmButtonText: 'OK', cancelButtonText: 'Cancel', type: 'warning'}
    );
    await folderDelete(f.folderId);
    await folderStore.refreshFolders();
    ElMessage.success(t('folderDeleted'));
  } catch {}
}

async function openAddTag() {
  try {
    const {value} = await ElMessageBox.prompt(t('tagNamePlaceholder'), t('createTag'), {
      confirmButtonText: t('createTag'),
      cancelButtonText: 'Cancel',
      inputPattern: /\S+/,
      inputErrorMessage: t('tagNamePlaceholder')
    });
    await tagAdd(value.trim(), '#409EFF');
    await tagStore.refreshTags();
    ElMessage.success(t('tagCreated'));
  } catch {}
}

async function handleDeleteTag(tg) {
  try {
    await ElMessageBox.confirm(
      t('confirmDeleteTag', {name: tg.name}),
      {confirmButtonText: 'OK', cancelButtonText: 'Cancel', type: 'warning'}
    );
    await tagDelete(tg.tagId);
    await tagStore.refreshTags();
    ElMessage.success(t('tagDeleted'));
  } catch {}
}
</script>

<style lang="scss" scoped>

.title {
  margin: 15px 10px;
  height: 45px;
  border-radius: 6px;
  display: flex;
  position: relative;
  font-size: 16px;
  font-weight: bold;
  align-items: center;
  justify-content: center;
  gap: 5px;
  color: #ffffff;
  background: linear-gradient(135deg, #1890ff, #3a80dd);
  transition: all 0.3s ease;
  max-width: 240px;
  padding: 0 10px;
  > div {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    max-width: calc(240px - 20px - 30px);
  }

  :deep(.el-icon) {
    flex-shrink: 0;
    font-size: 20px;
  }

  .user-right-icon {
    align-self: center;
    position: absolute;
    font-size: 12px;
    right: 8px;
    color: #ffffff;
  }

}


.manage-title {
  margin-top: 10px;
  padding-left: 20px;
  color: #fff;
}

.el-menu-item {
  margin: 5px 10px !important;
  border-radius: 6px;
  height: 36px;
  padding: 10px !important;
}

.choose-item {
  font-weight: bold;
  background: rgba(255, 255, 255, 0.08) !important;
  backdrop-filter: blur(4px);
}

@media (hover: hover) {
  .el-menu-item:hover {
    background: rgba(255, 255, 255, 0.08) !important;
  }
}

.menu-name {
  user-select: none;
}


:deep(.el-scrollbar__wrap--hidden-default ) {
  background: var(--aside-backgound) !important;
}

:deep(.el-menu-item) {
  background: var(--aside-backgound);
}

:deep(.el-menu) {
  background: var(--aside-backgound);
}

.el-menu {
  border-right: 0;
  width: 260px;
}

:deep(.el-divider__text) {
  background: var(--aside-backgound);
  color: #FFFFFF;
}

.scroll {

}

.section-title {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px 4px;
}

.section-add-icon {
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  padding: 2px;
  border-radius: 50%;
  &:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.1);
  }
}

.item-delete-icon {
  color: rgba(255, 255, 255, 0.3);
  margin-left: auto;
  padding: 2px;
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.2s, color 0.2s;
}

.el-menu-item:hover .item-delete-icon {
  opacity: 1;
  &:hover {
    color: #f56c6c;
  }
}

.tag-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}
</style>
