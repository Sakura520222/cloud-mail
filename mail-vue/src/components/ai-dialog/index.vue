<template>
  <el-dialog v-model="visible" :title="dialogTitle" width="600px" :before-close="handleClose" class="ai-dialog" @opened="onOpened">
    <div class="ai-content">
      <div class="ai-result" ref="resultRef">
        <div v-if="loading && !result" class="ai-loading">
          <Icon class="loading-icon" icon="svg-spinners:ring-resize" width="18" height="18" />
          <span>{{ $t('aiGenerating') }}</span>
        </div>
        <div v-else-if="result" class="ai-text" v-html="formattedResult"></div>
        <div v-else-if="error" class="ai-error">
          <el-alert :title="error" type="error" show-icon :closable="false" />
        </div>
        <div v-else class="ai-placeholder">
          <span>{{ $t('aiReady') }}</span>
        </div>
      </div>
      <div v-if="promptVisible" class="ai-prompt-input">
        <el-input v-model="userPrompt" :placeholder="$t('aiInputPrompt')" type="textarea" :rows="3" />
      </div>
    </div>
    <template #footer>
      <div class="ai-footer">
        <div class="ai-footer-left">
          <el-button v-if="result" @click="copyResult">{{ $t('aiCopy') }}</el-button>
          <el-button v-if="result" @click="regenerate">{{ $t('aiRegenerate') }}</el-button>
        </div>
        <div class="ai-footer-right">
          <el-button v-if="result && showInsert" type="primary" @click="handleInsert">{{ $t('aiInsertEditor') }}</el-button>
          <el-button v-if="props.action === 'generate' && !loading && !result" type="primary" @click="startChat">{{ $t('aiGenerate') }}</el-button>
          <el-button @click="handleClose">{{ $t('cancel') }}</el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Icon } from '@iconify/vue'
import { aiChat } from '@/request/ai.js'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  action: { type: String, default: '' },
  content: { type: String, default: '' },
  subject: { type: String, default: '' },
  metadata: { type: Object, default: () => ({}) },
  showInsert: { type: Boolean, default: false },
  promptVisible: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'insert', 'regenerate'])

const { t } = useI18n()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const result = ref('')
const error = ref('')
const loading = ref(false)
const resultRef = ref(null)
const userPrompt = ref('')
let abortController = null

const dialogTitle = computed(() => {
  const titles = {
    translate: t('aiTranslate'),
    summarize: t('aiSummarize'),
    reply: t('aiReply'),
    polish: t('aiPolish'),
    generate: t('aiGenerate')
  }
  return titles[props.action] || t('aiGenerate')
})

const formattedResult = computed(() => {
  return result.value.replace(/\n/g, '<br>')
})

const promptVisible = computed(() => {
  return props.promptVisible || props.action === 'generate'
})

watch(() => props.modelValue, (val) => {
  if (val) {
    result.value = ''
    error.value = ''
    loading.value = false
    userPrompt.value = ''
  }
})

function onOpened() {
  if (props.action && props.action !== 'generate') {
    startChat()
  }
}

function startChat() {
  if (abortController) {
    abortController.abort()
  }

  result.value = ''
  error.value = ''
  loading.value = true

  const params = {
    action: props.action,
    content: props.content,
    subject: props.subject,
    language: t('aiLanguage'),
    metadata: props.metadata
  }

  if (props.action === 'generate') {
    params.prompt = userPrompt.value
  }

  abortController = aiChat(params, {
    onMessage(text) {
      result.value += text
      loading.value = false
      nextTick(() => {
        if (resultRef.value) {
          resultRef.value.scrollTop = resultRef.value.scrollHeight
        }
      })
    },
    onDone() {
      loading.value = false
      abortController = null
    },
    onError(err) {
      error.value = err
      loading.value = false
      abortController = null
    }
  })
}

function regenerate() {
  startChat()
}

function handleInsert() {
  emit('insert', result.value)
  handleClose()
}

async function copyResult() {
  try {
    await navigator.clipboard.writeText(result.value)
    ElMessage({ message: t('aiCopySuccess'), type: 'success', plain: true })
  } catch {
    ElMessage({ message: t('aiCopyFail'), type: 'error', plain: true })
  }
}

function handleClose() {
  if (abortController) {
    abortController.abort()
    abortController = null
  }
  visible.value = false
}

defineExpose({ startChat, regenerate })
</script>

<style scoped lang="scss">
.ai-content {
  min-height: 200px;
}

.ai-result {
  max-height: 400px;
  overflow-y: auto;
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
  min-height: 150px;
}

.ai-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--el-text-color-secondary);
  font-size: 14px;

  .loading-icon {
    animation: rotating 1.5s linear infinite;
  }
}

@keyframes rotating {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.ai-text {
  font-size: 14px;
  line-height: 1.8;
  color: var(--el-text-color-primary);
  white-space: pre-wrap;
  word-break: break-word;
}

.ai-error {
  padding: 0;
}

.ai-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  color: var(--el-text-color-placeholder);
  font-size: 14px;
}

.ai-prompt-input {
  margin-top: 12px;
}

.ai-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;

  .ai-footer-left,
  .ai-footer-right {
    display: flex;
    gap: 8px;
  }
}
</style>
