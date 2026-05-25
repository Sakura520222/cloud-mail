<template>
  <div class="box">
    <div class="header-actions">
      <Icon class="icon" icon="material-symbols-light:arrow-back-ios-new" width="20" height="20" @click="handleBack"/>
      <Icon v-perm="'email:delete'" class="icon" icon="uiw:delete" width="16" height="16" @click="handleDelete"/>
      <span class="star" v-if="emailStore.contentData.showStar">
        <Icon class="icon" @click="changeStar" v-if="email.isStar" icon="fluent-color:star-16" width="20" height="20"/>
        <Icon class="icon" @click="changeStar" v-else icon="solar:star-line-duotone" width="18" height="18"/>
      </span>
      <Icon class="icon" v-if="emailStore.contentData.showReply" v-perm="'email:send'"  @click="openReply" icon="la:reply" width="21" height="21" />
      <Icon class="icon" v-if="emailStore.contentData.showReply" v-perm="'email:send'"  @click="openForward" icon="iconoir:arrow-up-right" width="20" height="20" />
      <el-popover v-perm="'ai:use'" placement="bottom" trigger="click" :width="120" v-model:visible="aiPopoverVisible">
        <template #reference>
          <Icon class="icon" icon="fluent:brain-sparkle-24-regular" width="20" height="20" />
        </template>
        <div class="ai-action-list">
          <div class="ai-action-item" @click="triggerAiAction('translate')">{{ $t('aiTranslate') }}</div>
          <div class="ai-action-item" @click="triggerAiAction('summarize')">{{ $t('aiSummarize') }}</div>
          <div class="ai-action-item" @click="triggerAiAction('reply')">{{ $t('aiReply') }}</div>
          <div class="ai-action-item" v-perm="'ai:classify'" @click="handleAiClassify">{{ $t('aiClassify') }}</div>
          <div class="ai-action-item" v-perm="'ai:tag'" @click="handleAiTag">{{ $t('aiTagEmail') }}</div>
        </div>
      </el-popover>
    </div>
    <div></div>
    <el-scrollbar class="scrollbar">
      <div class="container">
        <div class="email-title">
          {{ email.subject }}
        </div>
        <div class="content">
          <div class="email-info">
            <div>
              <div class="send"><span class="send-source">{{$t('from')}}</span>
                <div class="send-name">
                  <span class="send-name-title">{{ email.name }}</span>
                  <span><{{ email.sendEmail }}></span>
                </div>
              </div>
              <div class="receive"><span class="source">{{$t('recipient')}}</span><span class="receive-email">{{  formateReceive(email.recipient) }}</span></div>
              <div class="date">
                <div>{{ formatDetailDate(email.createTime) }}</div>
              </div>
              <!-- Folder & Tags display with manual actions -->
              <div class="email-folder-tags">
                <template v-if="email.folderName">
                  <span class="folder-badge" @click="showFolderDialog = true">
                    <Icon icon="mdi:folder-outline" width="14" height="14" />
                    {{email.folderName}}
                  </span>
                  <Icon class="tag-remove-icon" icon="mdi:close-circle" width="14" height="14"
                        @click="handleRemoveFolder" :title="$t('removeFolder')" />
                </template>
                <span class="folder-badge folder-badge-add" v-else @click="showFolderDialog = true">
                  <Icon icon="mdi:folder-plus-outline" width="14" height="14" />
                  {{$t('moveToFolder')}}
                </span>
                <span class="tag-badge" v-for="tg in (email.tagList || [])" :key="tg.tagId"
                      :style="{borderColor: tg.tagColor, color: tg.tagColor}">
                  {{tg.tagName}}
                  <Icon class="tag-remove-icon" icon="mdi:close-circle" width="12" height="12"
                        @click.stop="handleRemoveTag(tg)" />
                </span>
                <span class="tag-badge tag-badge-add" @click="showTagDialog = true">
                  <Icon icon="mdi:tag-plus-outline" width="14" height="14" />
                  {{$t('addTag')}}
                </span>
              </div>
            </div>
            <el-alert v-if="email.status === 3" :closable="false" :title="toMessage(email.message)" class="email-msg" type="error" show-icon />
            <el-alert v-if="email.status === 4" :closable="false" :title="$t('complained')" class="email-msg" type="warning" show-icon />
            <el-alert v-if="email.status === 5" :closable="false" :title="$t('delayed')" class="email-msg" type="warning" show-icon />
          </div>
          <el-scrollbar class="htm-scrollbar" :class="email.attList.length === 0 ? 'bottom-distance' : ''">
            <ShadowHtml class="shadow-html" :html="formatImage(email.content)" v-if="email.content" />
            <pre v-else class="email-text" >{{email.text}}</pre>
          </el-scrollbar>
          <div class="att" v-if="email.attList.length > 0">
            <div class="att-title">
              <span>{{$t('attachments')}}</span>
              <span>{{$t('attCount',{total: email.attList.length})}}</span>
            </div>
            <div class="att-box">

              <div class="att-item" v-for="att in email.attList" :key="att.attId">
                <div class="att-icon" @click="showImage(att.key)">
                  <Icon v-bind="getIconByName(att.filename)" />
                </div>
                <div class="att-name" @click="showImage(att.key)">
                  {{ att.filename }}
                </div>
                <div class="att-size">{{ formatBytes(att.size) }}</div>
                <div class="opt-icon att-icon">
                  <Icon v-if="isImage(att.filename)" icon="hugeicons:view" width="22" height="22" @click="showImage(att.key)"/>
                  <a :href="cvtR2Url(att.key)" download>
                    <Icon icon="system-uicons:push-down" width="22" height="22"/>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-scrollbar>
    <el-image-viewer
        v-if="showPreview"
        :url-list="srcList"
        show-progress
        @close="showPreview = false"
    />
    <AiDialog
      v-model="aiDialogVisible"
      :action="aiAction"
      :content="aiContent"
      :subject="email.subject"
      :metadata="aiMetadata"
      :show-insert="aiAction === 'reply'"
      @insert="handleAiInsert"
    />

    <!-- Manual folder select dialog -->
    <el-dialog v-model="showFolderDialog" :title="$t('selectFolder')" width="360px" append-to-body>
      <div class="folder-select-list">
        <div class="folder-select-item" v-for="f in folderList" :key="f.folderId"
             :class="{active: email.folderId === f.folderId}" @click="handleMoveToFolder(f)">
          <Icon :icon="f.icon || 'mdi:folder-outline'" width="18" height="18" />
          <span>{{f.name}}</span>
          <Icon v-if="email.folderId === f.folderId" icon="mdi:check" width="16" height="16" style="margin-left:auto;color:var(--el-color-primary)" />
        </div>
        <div v-if="folderList.length === 0" class="empty-hint">{{$t('noFolder')}}</div>
      </div>
    </el-dialog>

    <!-- Manual tag select dialog -->
    <el-dialog v-model="showTagDialog" :title="$t('selectTags')" width="360px" append-to-body>
      <div class="tag-select-list">
        <el-check-tag v-for="tg in tagList" :key="tg.tagId"
                      :checked="isTagChecked(tg.tagId)"
                      @change="handleToggleTag(tg)"
                      :style="{borderColor: tg.color}">
          <span class="tag-dot" :style="{background: tg.color}"></span>
          {{tg.name}}
        </el-check-tag>
        <div v-if="tagList.length === 0" class="empty-hint">{{$t('noFolder')}}</div>
      </div>
    </el-dialog>
  </div>
</template>
<script setup>
import ShadowHtml from '@/components/shadow-html/index.vue'
import AiDialog from '@/components/ai-dialog/index.vue'
import {reactive, ref, watch, onMounted, onUnmounted} from "vue";
import {useRouter} from 'vue-router'
import {ElMessage, ElMessageBox} from 'element-plus'
import {emailDelete, emailRead, emailMoveFolder, emailSetTags} from "@/request/email.js";
import {Icon} from "@iconify/vue";
import {useEmailStore} from "@/store/email.js";
import {useAccountStore} from "@/store/account.js";
import {formatDetailDate} from "@/utils/day.js";
import {starAdd, starCancel} from "@/request/star.js";
import {aiClassify as aiClassifyReq, aiTagEmail as aiTagReq} from "@/request/ai.js";
import {folderList as fetchFolderList, folderAdd as fetchFolderAdd} from "@/request/folder.js";
import {tagList as fetchTagList, tagAdd as fetchTagAdd} from "@/request/tag.js";
import {getExtName, formatBytes} from "@/utils/file-utils.js";
import {cvtR2Url,toOssDomain} from "@/utils/convert.js";
import {getIconByName} from "@/utils/icon-utils.js";
import {useFolderStore} from "@/store/folder.js";
import {useTagStore} from "@/store/tag.js";
import {useSettingStore} from "@/store/setting.js";
import {allEmailDelete} from "@/request/all-email.js";
import {useUiStore} from "@/store/ui.js";
import {useI18n} from "vue-i18n";
import {EmailUnreadEnum} from "@/enums/email-enum.js";
import {callWriter} from "@/utils/writer-utils.js";

const uiStore = useUiStore();
const settingStore = useSettingStore();
const accountStore = useAccountStore();
const emailStore = useEmailStore();
const router = useRouter()
const email = emailStore.contentData.email
const showPreview = ref(false)
const srcList = reactive([])
const aiDialogVisible = ref(false)
const aiAction = ref('')
const aiContent = ref('')
const aiMetadata = ref({})

const { t } = useI18n()
watch(() => accountStore.currentAccountId, () => {
  handleBack()
})

onMounted(() => {
  if (emailStore.contentData.showUnread && email.unread === EmailUnreadEnum.UNREAD) {
    email.unread = EmailUnreadEnum.READ;
    emailRead([email.emailId]);
  }
})

onUnmounted(() => {
  emailStore.contentData.showUnread = false;
})

function openReply() {
  callWriter(uiStore, 'openReply', email)
}

function openForward() {
  callWriter(uiStore, 'openForward', email)
}

const aiPopoverVisible = ref(false)

function triggerAiAction(action) {
  aiPopoverVisible.value = false
  handleAiAction(action)
}

function handleAiAction(command) {
  aiAction.value = command
  const domain = settingStore.settings.r2Domain
  aiContent.value = email.content
    ? email.content.replace(/{{domain}}/g, toOssDomain(domain) + '/')
    : email.text || ''
  aiMetadata.value = {
    from: `${email.name} <${email.sendEmail}>`,
    to: formateReceive(email.recipient),
    date: email.createTime
  }
  aiDialogVisible.value = true
}

function handleAiInsert(aiContent) {
  if (aiAction.value === 'reply') {
    callWriter(uiStore, 'openReply', email, aiContent)
  }
}

function toMessage(message) {
  return  message ? JSON.parse(message).message : '';
}

function formatImage(content) {
  content = content || '';
  const domain = settingStore.settings.r2Domain;
  return  content.replace(/{{domain}}/g, toOssDomain(domain) + '/');
}

function showImage(key) {
  if (!isImage(key)) return;
  const url = cvtR2Url(key)
  srcList.length = 0
  srcList.push(url)
  showPreview.value = true
}

function isImage(filename) {
  return ['png', 'jpg', 'jpeg', 'bmp', 'gif','jfif'].includes(getExtName(filename))
}

function formateReceive(recipient) {
  recipient = JSON.parse(recipient)
  return recipient.map(item => item.address).join(', ')
}

function changeStar() {
  if (email.isStar) {
    email.isStar = 0;
    starCancel(email.emailId).then(() => {
      email.isStar = 0;
      emailStore.cancelStarEmailId = email.emailId
      setTimeout(() => emailStore.cancelStarEmailId = 0)
      emailStore.starScroll?.deleteEmail([email.emailId])
    }).catch((e) => {
      console.error(e)
      email.isStar = 1;
    })
  } else {
    email.isStar = 1;
    starAdd(email.emailId).then(() => {
      email.isStar = 1;
      emailStore.addStarEmailId = email.emailId
      setTimeout(() => emailStore.addStarEmailId = 0)
      emailStore.starScroll?.addItem(email)
    }).catch((e) => {
      console.error(e)
      email.isStar = 0;
    })
  }
}

const handleBack = () => {
  router.back()
}

const handleDelete = () => {
  ElMessageBox.confirm(t('delEmailConfirm'), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'warning'
  }).then(() => {
    if (emailStore.contentData.delType === 'logic') {
      emailDelete(email.emailId).then(() => {
        ElMessage({
          message: t('delSuccessMsg'),
          type: 'success',
          plain: true,
        })
        emailStore.deleteIds = [email.emailId]
      })
    } else  {

      allEmailDelete(email.emailId).then(() => {
        ElMessage({
          message: t('delSuccessMsg'),
          type: 'success',
          plain: true,
        })
        emailStore.deleteIds = [email.emailId]
      })
    }

    router.back()
  })
}

const showFolderDialog = ref(false)
const showTagDialog = ref(false)
const folderList = ref([])
const tagList = ref([])

watch(showFolderDialog, async (v) => {
  if (v) folderList.value = await fetchFolderList()
})

watch(showTagDialog, async (v) => {
  if (v) tagList.value = await fetchTagList()
})

function isTagChecked(tagId) {
  return (email.tagList || []).some(t => t.tagId === tagId)
}

async function handleMoveToFolder(f) {
  try {
    await emailMoveFolder(String(email.emailId), f.folderId)
    email.folderId = f.folderId
    email.folderName = f.name
    showFolderDialog.value = false
    ElMessage.success(t('folderUpdated'))
  } catch (e) {
    console.error(e)
  }
}

async function handleRemoveFolder() {
  try {
    await emailMoveFolder(String(email.emailId), null)
    email.folderId = null
    email.folderName = null
    ElMessage.success(t('folderUpdated'))
  } catch (e) {
    console.error(e)
  }
}

async function handleToggleTag(tg) {
  try {
    let currentIds = (email.tagList || []).map(t => t.tagId)
    const idx = currentIds.indexOf(tg.tagId)
    if (idx >= 0) {
      currentIds.splice(idx, 1)
    } else {
      currentIds.push(tg.tagId)
    }
    await emailSetTags(email.emailId, currentIds)
    if (idx >= 0) {
      email.tagList = email.tagList.filter(t => t.tagId !== tg.tagId)
    } else {
      email.tagList = email.tagList || []
      email.tagList.push({tagId: tg.tagId, tagName: tg.name, tagColor: tg.color})
    }
  } catch (e) {
    console.error(e)
  }
}

async function handleRemoveTag(tg) {
  try {
    let currentIds = (email.tagList || []).map(t => t.tagId).filter(id => id !== tg.tagId)
    await emailSetTags(email.emailId, currentIds)
    email.tagList = email.tagList.filter(t => t.tagId !== tg.tagId)
  } catch (e) {
    console.error(e)
  }
}

async function handleAiClassify() {
  aiPopoverVisible.value = false
  try {
    ElMessage.info(t('aiClassifying'))
    const res = await aiClassifyReq(email.emailId)
    if (res) {
      email.folderId = res.folder?.folderId
      email.folderName = res.folder?.name
      ElMessage.success(t('aiClassifySuccess'))
    }
  } catch (e) {
    console.error(e)
  }
}

async function handleAiTag() {
  aiPopoverVisible.value = false
  try {
    ElMessage.info(t('aiTagging'))
    const res = await aiTagReq(email.emailId)
    if (res && res.length > 0) {
      email.tagList = res.map(tg => ({
        tagId: tg.tagId,
        tagName: tg.name,
        tagColor: tg.color
      }))
      ElMessage.success(t('aiTagSuccess'))
    }
  } catch (e) {
    console.error(e)
  }
}
</script>
<style scoped lang="scss">
.box {
  height: 100%;
  overflow: hidden;
}

.header-actions {
  padding: 9px 15px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: var(--header-actions-border);
  font-size: 18px;
  .star {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 21px;
  }
  .icon {
    cursor: pointer;
  }
}


.scrollbar {
  height: calc(100% - 38px);
  width: 100%;
}

.container {
  font-size: 14px;
  padding-left: 20px;
  padding-right: 20px;
  padding-top: 10px;
  @media (max-width: 1023px) {
    padding-left: 15px;
    padding-right: 15px;
  }

  .email-title {
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 10px;
  }

  .htm-scrollbar {
  }

  .content {
    display: flex;
    flex-direction: column;

    .att {
      margin-top: 30px;
      margin-bottom: 30px;
      border: 1px solid var(--light-border-color);
      padding: 14px;
      border-radius: 6px;
      width: fit-content;
      .att-box {
        min-width: min(410px,calc(100vw - 60px));
        max-width: 600px;
        display: grid;
        gap: 12px;
        grid-template-rows: 1fr;
      }

      .att-title {
        margin-bottom: 8px;
        display: flex;
        justify-content: space-between;
        span:first-child {
          font-weight: bold;
        }
      }

      .att-item {
        cursor: pointer;
        div {
          align-self: center;
        }
        background: var(--light-ill);
        padding: 5px 7px;
        border-radius: 4px;
        align-self: start;
        display: grid;
        grid-template-columns: auto 1fr auto auto;
        .att-icon {
          display: grid;
        }

        .att-size {
          color: var(--secondary-text-color);
        }

        .att-name {
          margin-left: 8px;
          margin-right: 8px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          word-break: break-all;
        }

        .att-image {
          width: 60px;
          height: 60px;
          object-fit: contain;
        }

        .opt-icon {
          padding-left: 10px;
          color: var(--secondary-text-color);
          align-items: center;
          display: flex;
          gap: 8px;
          cursor: pointer;
          a {
            color: var(--secondary-text-color);
            align-items: center;
            display: flex;
          }
        }
      }
    }

    .email-info {

      border-bottom: 1px solid var(--light-border-color);
      margin-bottom: 20px;
      padding-bottom: 8px;
      @media (max-width: 1024px) {
        margin-bottom: 15px;
      }
      .date {
        color: var(--regular-text-color);
        margin-bottom: 6px;
      }

      .email-msg {
        max-width: 400px;
        width: fit-content;
        margin-bottom: 15px;
      }

      .send {
        display: flex;
        margin-bottom: 6px;

        .send-name {
          color: var(--regular-text-color);
          display: flex;
          flex-wrap: wrap;
        }

        .send-name-title {
          padding-right: 5px;
        }
      }

      .receive {
        margin-bottom: 6px;
        display: flex;
        .receive-email {
          max-width: 700px;
          word-break: break-word;
        }
        span:nth-child(2) {
          color: var(--regular-text-color);
        }
      }

      .send-source {
        white-space: nowrap;
        font-weight: bold;
        padding-right: 10px;
      }

      .source {
        white-space: nowrap;
        font-weight: bold;
        padding-right: 10px;
      }
    }
  }
}

.shadow-html::after  {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--message-block-color); /* 半透明黑色蒙层 */
  pointer-events: none; /* 不影响点击 */
}

.email-text {
  font-family: inherit;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
}

.bottom-distance {
  margin-bottom: 30px;
}

.ai-action-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ai-action-item {
  padding: 6px 12px;
  cursor: pointer;
  border-radius: 4px;
  font-size: 13px;
  transition: background 0.2s;
  &:hover {
    background: var(--el-fill-color-light);
  }
}

.email-folder-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.folder-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  background: var(--el-fill-color);
  color: var(--el-text-color-secondary);
  cursor: pointer;
  &:hover {
    background: var(--el-fill-color-dark);
  }
}

.tag-badge {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  border: 1px solid;
}

.tag-remove-icon {
  color: rgba(0,0,0,0.3);
  cursor: pointer;
  vertical-align: middle;
  &:hover {
    color: #f56c6c;
  }
}

.folder-badge-add {
  border: 1px dashed var(--el-border-color);
  color: var(--el-text-color-secondary);
}

.tag-badge-add {
  border: 1px dashed var(--el-border-color) !important;
  color: var(--el-text-color-secondary) !important;
  cursor: pointer;
  &:hover {
    border-color: var(--el-color-primary) !important;
    color: var(--el-color-primary) !important;
  }
}

.folder-select-list, .tag-select-list {
  max-height: 300px;
  overflow-y: auto;
}

.folder-select-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 6px;
  &:hover {
    background: var(--el-fill-color-light);
  }
  &.active {
    background: var(--el-fill-color);
    font-weight: 500;
  }
}

.tag-select-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-select-list .el-check-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 1px solid;
  border-radius: 4px;
  padding: 4px 10px;
}

.empty-hint {
  text-align: center;
  color: var(--el-text-color-secondary);
  padding: 20px 0;
  font-size: 13px;
}


</style>
