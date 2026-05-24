<template>
  <div v-if="reportLoading" class="report-loading">
    <loading/>
  </div>
  <el-scrollbar v-else style="height: 100%;">
    <div class="report" :key="boxKey">
      <!-- 控制栏 -->
      <div class="controls">
        <div class="controls-left">
          <el-date-picker
              v-model="selectedMonth"
              type="month"
              :placeholder="$t('selectMonth')"
              format="YYYY-MM"
              value-format="YYYY-MM"
              @change="onMonthChange"
              :clearable="false"
              style="width: 160px;"
          />
          <el-switch
              v-if="hasPerm('analysis:query')"
              v-model="isAdmin"
              :active-text="$t('fullSiteAnalysis')"
              @change="onScopeChange"
              style="margin-left: 12px;"
          />
        </div>
        <div class="controls-right">
          <el-button @click="onRefresh" :loading="refreshing">
            <Icon icon="ep:refresh" width="14" height="14" style="margin-right: 4px;"/>
            {{ $t('refreshReport') }}
          </el-button>
          <el-button type="primary" @click="onAiAnalysis" :loading="aiGenerating">
            <Icon icon="ep:magic-stick" width="14" height="14" style="margin-right: 4px;"/>
            {{ $t('aiAnalysis') }}
          </el-button>
        </div>
      </div>

      <!-- 统计卡片 -->
      <div class="number">
        <div class="number-item">
          <div class="top">
            <div class="left">
              <div>{{ $t('totalReceived') }}</div>
              <div>
                <el-statistic :formatter="value => Math.round(value)" :value="receiveData"/>
              </div>
            </div>
            <div class="right">
              <div class="count-icon">
                <Icon icon="hugeicons:mailbox-01" width="25" height="25"/>
              </div>
            </div>
          </div>
        </div>
        <div class="number-item">
          <div class="top">
            <div class="left">
              <div>{{ $t('totalSent') }}</div>
              <div>
                <el-statistic :formatter="value => Math.round(value)" :value="sendData"/>
              </div>
            </div>
            <div class="right">
              <div class="count-icon">
                <Icon icon="cil:send" width="25" height="25"/>
              </div>
            </div>
          </div>
        </div>
        <div class="number-item">
          <div class="top">
            <div class="left">
              <div>{{ $t('unread') }}</div>
              <div>
                <el-statistic :formatter="value => Math.round(value)" :value="unreadData"/>
              </div>
            </div>
            <div class="right">
              <div class="count-icon">
                <Icon icon="fluent:mail-unread-20-regular" width="25" height="25"/>
              </div>
            </div>
          </div>
        </div>
        <div class="number-item">
          <div class="top">
            <div class="left">
              <div>{{ $t('totalEmails') }}</div>
              <div>
                <el-statistic :formatter="value => Math.round(value)" :value="totalData"/>
              </div>
            </div>
            <div class="right">
              <div class="count-icon">
                <Icon icon="fluent:mail-20-regular" width="25" height="25"/>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 图表区域 -->
      <div class="picture">
        <div class="picture-item">
          <div class="title">{{ $t('emailTrend') }}</div>
          <div class="trend-line"></div>
        </div>
        <div class="picture-item">
          <div class="title">{{ $t('topSenders') }}</div>
          <div class="top-contacts-bar"></div>
        </div>
      </div>
      <div class="picture-cs">
        <div class="picture-cs-item">
          <div class="title">{{ $t('activityDistribution') }}</div>
          <div class="hourly-chart"></div>
        </div>
        <div class="picture-cs-item">
          <div class="title">{{ $t('statusBreakdown') }}</div>
          <div class="status-pie"></div>
        </div>
      </div>

      <!-- AI 分析报告 -->
      <div class="ai-report" v-if="showAiReport">
        <div class="ai-report-header">
          <div class="ai-report-title">
            <Icon icon="fluent:sparkle-20-filled" width="20" height="20" style="color: var(--el-color-primary);"/>
            <span>AI {{ $t('report') }}</span>
          </div>
          <el-button text @click="showAiReport = false">
            <Icon icon="ep:close" width="16" height="16"/>
          </el-button>
        </div>
        <div class="ai-report-content" ref="aiReportContent">
          <div v-if="aiGenerating" class="ai-loading">
            <Icon icon="ep:loading" width="18" height="18" class="spin-icon"/>
            <span>{{ $t('generatingAnalysis') }}</span>
          </div>
          <div v-else class="ai-text" v-html="renderMarkdown(aiResult)"></div>
        </div>
      </div>

      <!-- 账号分布 -->
      <div class="account-section" v-if="reportData.accountBreakdown && reportData.accountBreakdown.length > 0">
        <div class="title">{{ $t('accountStats') }}</div>
        <el-table :data="reportData.accountBreakdown" stripe style="width: 100%">
          <el-table-column prop="email" :label="$t('emailAccount')" min-width="200"/>
          <el-table-column prop="received" :label="$t('totalReceived')" width="120" align="center"/>
          <el-table-column prop="sent" :label="$t('totalSent')" width="120" align="center"/>
        </el-table>
      </div>
    </div>
  </el-scrollbar>
</template>

<script setup>
import {Icon} from "@iconify/vue";
import {useTransition} from "@vueuse/core";
import {defineOptions, onActivated, onDeactivated, onMounted, reactive, ref, watch, computed} from "vue";
import echarts from "@/echarts/index.js";
import dayjs from "dayjs";
import {getReportData, refreshReport} from "@/request/report.js";
import {aiChat} from "@/request/ai.js";
import {useUiStore} from "@/store/ui.js";
import {debounce} from "lodash-es";
import loading from "@/components/loading/index.vue";
import {useRoute} from "vue-router";
import {useI18n} from 'vue-i18n';
import {hasPerm} from "@/perm/perm.js";

defineOptions({
  name: 'report'
})

const {t} = useI18n();
const route = useRoute();
const uiStore = useUiStore();
const reportLoading = ref(true);
const refreshing = ref(false);
const aiGenerating = ref(false);
const showAiReport = ref(false);
const aiResult = ref('');
const aiReportContent = ref(null);
const isAdmin = ref(false);
const boxKey = ref(0);

const now = dayjs();
const selectedMonth = ref(now.format('YYYY-MM'));
const reportData = reactive({
  period: {},
  stats: { received: 0, sent: 0, unread: 0, readCount: 0, total: 0 },
  dayTrend: [],
  topSenders: [],
  topRecipients: [],
  hourlyHeatmap: [],
  statusBreakdown: {},
  accountBreakdown: []
});

const receiveTotal = ref(0);
const sendTotal = ref(0);
const unreadTotal = ref(0);
const totalEmails = ref(0);

const receiveData = useTransition(receiveTotal, { duration: 1500 });
const sendData = useTransition(sendTotal, { duration: 1500 });
const unreadData = useTransition(unreadTotal, { duration: 1500 });
const totalData = useTransition(totalEmails, { duration: 1500 });

const topic = computed(() => ({
  color: uiStore.dark ? '#E5EAF3' : '#303133',
  background: uiStore.dark ? '#141414' : '#FFFFFF',
  borderColor: uiStore.dark ? '#141414' : '#FFFFFF',
  scaleLineColor: uiStore.dark ? '#636466' : '#CDD0D6',
  crossColor: uiStore.dark ? '#8D9095' : '#A8ABB2',
  axisColor: uiStore.dark ? '#A3A6AD' : '#909399',
  splitLineColor: uiStore.dark ? '#58585B' : '#D4D7DE',
  gaugeSplitLine: uiStore.dark ? '#CFD3DC' : '#606266',
  containerBackground: uiStore.dark ? '#6C6E72' : '#E6EBF8'
}));

let trendChart = null;
let contactsChart = null;
let hourlyChart = null;
let statusChart = null;
let first = true;
let leaveWidth = 0;
let reportDark = uiStore.dark;

function getTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function parseMonth() {
  const parts = selectedMonth.value.split('-');
  return { year: parseInt(parts[0]), month: parseInt(parts[1]) };
}

async function loadReport() {
  const { year, month } = parseMonth();
  const scope = isAdmin.value ? 'admin' : 'user';
  try {
    const data = await getReportData(year, month, getTimeZone(), scope);
    Object.assign(reportData, data);
    receiveTotal.value = data.stats.received;
    sendTotal.value = data.stats.sent;
    unreadTotal.value = data.stats.unread;
    totalEmails.value = data.stats.total;
    reportLoading.value = false;
    initPicture();
  } catch (e) {
    reportLoading.value = false;
  }
}

onMounted(() => {
  loadReport();
});

function onMonthChange() {
  reportLoading.value = true;
  loadReport();
}

function onScopeChange() {
  reportLoading.value = true;
  loadReport();
}

async function onRefresh() {
  refreshing.value = true;
  const { year, month } = parseMonth();
  const scope = isAdmin.value ? 'admin' : 'user';
  try {
    const data = await refreshReport(year, month, getTimeZone(), scope);
    Object.assign(reportData, data);
    receiveTotal.value = data.stats.received;
    sendTotal.value = data.stats.sent;
    unreadTotal.value = data.stats.unread;
    totalEmails.value = data.stats.total;
    initPicture();
  } finally {
    refreshing.value = false;
  }
}

function onAiAnalysis() {
  showAiReport.value = true;
  aiResult.value = '';
  aiGenerating.value = true;

  const reportJson = JSON.stringify({
    period: reportData.period,
    stats: reportData.stats,
    dayTrend: reportData.dayTrend,
    topSenders: reportData.topSenders,
    topRecipients: reportData.topRecipients,
    hourlyHeatmap: reportData.hourlyHeatmap,
    statusBreakdown: reportData.statusBreakdown
  }, null, 2);

  aiChat(
      { action: 'report', content: reportJson, language: '中文' },
      {
        onMessage: (text) => {
          aiResult.value += text;
          if (aiReportContent.value) {
            aiReportContent.value.scrollTop = aiReportContent.value.scrollHeight;
          }
        },
        onDone: () => {
          aiGenerating.value = false;
        },
        onError: () => {
          aiGenerating.value = false;
        }
      }
  );
}

function renderMarkdown(text) {
  if (!text) return '';
  return text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/^### (.+)$/gm, '<h4>$1</h4>')
      .replace(/^## (.+)$/gm, '<h3>$1</h3>')
      .replace(/^# (.+)$/gm, '<h2>$1</h2>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n/g, '<br/>');
}

const widthChange = debounce(initPicture, 500, { leading: false, trailing: true });

watch(() => uiStore.asideShow, () => {
  if (window.innerWidth > 1024) widthChange();
});

onActivated(() => {
  if (first) return;
  if (window.innerWidth !== leaveWidth && leaveWidth !== 0) {
    widthChange();
  } else if (!trendChart) {
    widthChange();
  } else if (reportDark !== uiStore.dark) {
    initPicture();
    reportDark = uiStore.dark;
  }
});

onDeactivated(() => {
  leaveWidth = window.innerWidth;
});

window.onresize = () => widthChange();

watch(() => uiStore.dark, () => {
  if (route.name !== 'report') return;
  reportDark = uiStore.dark;
  initPicture();
});

function initPicture() {
  if (route.name !== 'report') return;
  boxKey.value++;
  setTimeout(() => {
    createTrendChart();
    createContactsChart();
    createHourlyChart();
    createStatusPie();
  });
}

function createTrendChart() {
  if (trendChart) trendChart.dispose();
  const el = document.querySelector('.trend-line');
  if (!el) return;
  trendChart = echarts.init(el);

  const dates = reportData.dayTrend.map(d => dayjs(d.date).format('M.D'));
  const received = reportData.dayTrend.map(d => d.received);
  const sent = reportData.dayTrend.map(d => d.sent);

  trendChart.setOption({
    tooltip: {
      trigger: 'axis',
      backgroundColor: topic.value.background,
      textStyle: { color: topic.value.color },
      axisPointer: { type: 'cross', crossStyle: { color: topic.value.crossColor } }
    },
    legend: {
      data: [t('emailReceived'), t('emailSent')],
      top: '0',
      textStyle: { color: topic.value.color }
    },
    grid: { top: '40', right: '20', left: '45', bottom: '30' },
    xAxis: {
      type: 'category',
      data: dates,
      boundaryGap: false,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: topic.value.axisColor } }
    },
    yAxis: {
      type: 'value',
      boundaryGap: [0, 0.1],
      axisLine: { show: true, lineStyle: { color: topic.value.axisColor } },
      splitLine: { lineStyle: { type: 'dashed', color: topic.value.scaleLineColor } }
    },
    series: [
      {
        name: t('emailReceived'), type: 'line', smooth: 0.2, symbol: 'none',
        lineStyle: { color: '#3CB2FF', width: 2.5 },
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(60,178,255,0.3)' },
              { offset: 1, color: 'rgba(60,178,255,0.03)' }
            ]) },
        data: received
      },
      {
        name: t('emailSent'), type: 'line', smooth: 0.2, symbol: 'none',
        lineStyle: { color: '#13DEB9', width: 2.5 },
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(19,222,185,0.3)' },
              { offset: 1, color: 'rgba(19,222,185,0.03)' }
            ]) },
        data: sent
      }
    ]
  });
}

function createContactsChart() {
  if (contactsChart) contactsChart.dispose();
  const el = document.querySelector('.top-contacts-bar');
  if (!el) return;
  contactsChart = echarts.init(el);

  const data = reportData.topSenders.slice(0, 10).reverse();
  const names = data.map(d => d.name || d.email);
  const counts = data.map(d => d.count);

  contactsChart.setOption({
    tooltip: {
      trigger: 'axis',
      backgroundColor: topic.value.background,
      textStyle: { color: topic.value.color },
      axisPointer: { type: 'shadow' }
    },
    grid: { top: '10', right: '30', left: '120', bottom: '20' },
    xAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: topic.value.scaleLineColor } },
      axisLine: { lineStyle: { color: topic.value.axisColor } }
    },
    yAxis: {
      type: 'category',
      data: names,
      axisLine: { lineStyle: { color: topic.value.axisColor } },
      axisTick: { show: false },
      axisLabel: {
        width: 100,
        overflow: 'truncate',
        fontSize: 12,
        color: topic.value.color
      }
    },
    series: [{
      type: 'bar',
      data: counts,
      barMaxWidth: 20,
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#3CB2FF' },
          { offset: 1, color: '#13DEB9' }
        ]),
        borderRadius: [0, 4, 4, 0]
      }
    }]
  });
}

function createHourlyChart() {
  if (hourlyChart) hourlyChart.dispose();
  const el = document.querySelector('.hourly-chart');
  if (!el) return;
  hourlyChart = echarts.init(el);

  const hours = reportData.hourlyHeatmap.map(d => `${d.hour}:00`);
  const counts = reportData.hourlyHeatmap.map(d => d.count);

  hourlyChart.setOption({
    tooltip: {
      trigger: 'axis',
      backgroundColor: topic.value.background,
      textStyle: { color: topic.value.color }
    },
    grid: { top: '10', right: '20', left: '45', bottom: '30' },
    xAxis: {
      type: 'category',
      data: hours,
      axisLine: { lineStyle: { color: topic.value.axisColor } },
      axisTick: { show: false },
      axisLabel: {
        interval: 2,
        color: topic.value.color
      }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: topic.value.scaleLineColor } },
      axisLine: { lineStyle: { color: topic.value.axisColor } }
    },
    series: [{
      type: 'bar',
      data: counts,
      barMaxWidth: 25,
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 1, 0, 0, [
          { offset: 0, color: 'rgba(60,178,255,0.3)' },
          { offset: 1, color: '#3CB2FF' }
        ]),
        borderRadius: [4, 4, 0, 0]
      }
    }]
  });
}

function createStatusPie() {
  if (statusChart) statusChart.dispose();
  const el = document.querySelector('.status-pie');
  if (!el) return;
  statusChart = echarts.init(el);

  const statusLabels = {
    received: t('emailReceived'),
    sent: t('emailSent'),
    delivered: t('delivered') || 'Delivered',
    bounced: t('bounced') || 'Bounced',
    failed: t('failed') || 'Failed'
  };

  const pieData = Object.entries(reportData.statusBreakdown)
      .filter(([key, val]) => val > 0 && statusLabels[key])
      .map(([key, val]) => ({ name: statusLabels[key], value: val }));

  if (pieData.length === 0) {
    pieData.push({ name: t('noData'), value: 1 });
  }

  statusChart.setOption({
    tooltip: {
      trigger: 'item',
      backgroundColor: topic.value.background,
      textStyle: { color: topic.value.color },
      formatter: p => `${p.marker} ${p.name}: ${p.value} (${p.percent}%)`
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'center',
      textStyle: { color: topic.value.color }
    },
    series: [{
      type: 'pie',
      radius: ['40%', '65%'],
      center: ['60%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 4, borderColor: topic.value.borderColor, borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: false } },
      data: pieData,
      color: ['#3CB2FF', '#13DEB9', '#FBBF24', '#FF7F50', '#C084FC']
    }]
  });
}
</script>

<style scoped lang="scss">
.report-loading {
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.report {
  height: 100%;
  padding: 20px 20px 30px;
  gap: 20px;
  background: var(--extra-light-fill);
  display: grid;
  grid-auto-rows: min-content;

  @media (max-width: 1024px) {
    padding: 15px 15px 30px;
    gap: 15px;
  }

  .title {
    margin-top: 10px;
    margin-left: 15px;
    font-size: 18px;
    font-weight: 500;
  }

  .controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;

    .controls-left {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }

    .controls-right {
      display: flex;
      gap: 8px;
    }
  }

  .number {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    gap: 20px;

    @media (max-width: 1366px) {
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }
    @media (max-width: 767px) {
      grid-template-columns: 1fr;
    }

    .number-item {
      background: var(--el-bg-color);
      border-radius: 8px;
      border: 1px solid var(--el-border-color);
      padding: 21px 20px;

      .top {
        display: grid;
        justify-content: space-between;
        align-content: center;
        grid-template-columns: auto auto;

        .left {
          display: grid;
          gap: 5px;
          grid-auto-rows: min-content;

          > div:first-child { font-size: 15px; }
          > div:last-child { font-size: 13px; }
          :deep(.el-statistic__number) { font-size: 26px; }
        }

        .right {
          display: grid;
          align-items: center;

          .count-icon {
            top: 3px;
            position: relative;
            display: grid;
            align-items: center;
            padding: 14px;
            border-radius: 8px;
            background: var(--el-color-primary-light-9);
            color: var(--el-color-primary);
          }
        }
      }
    }
  }

  .picture {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;

    @media (max-width: 1200px) {
      grid-template-columns: 1fr;
    }
    @media (max-width: 1024px) {
      gap: 15px;
    }

    .picture-item {
      background: var(--el-bg-color);
      border-radius: 8px;
      border: 1px solid var(--el-border-color);

      .trend-line, .top-contacts-bar {
        height: 350px;
        @media (max-width: 767px) {
          height: 260px;
        }
      }
    }
  }

  .picture-cs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;

    @media (max-width: 1200px) {
      grid-template-columns: 1fr;
      gap: 15px;
    }

    .picture-cs-item {
      background: var(--el-bg-color);
      border-radius: 8px;
      border: 1px solid var(--el-border-color);

      .hourly-chart, .status-pie {
        height: 350px;
        @media (max-width: 767px) {
          height: 260px;
        }
      }
    }
  }

  .ai-report {
    background: var(--el-bg-color);
    border-radius: 8px;
    border: 1px solid var(--el-border-color);
    overflow: hidden;

    .ai-report-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid var(--el-border-color);

      .ai-report-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 16px;
        font-weight: 500;
      }
    }

    .ai-report-content {
      padding: 16px;
      max-height: 500px;
      overflow-y: auto;

      .ai-loading {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--el-text-color-secondary);
        padding: 20px;
        justify-content: center;
      }

      .ai-text {
        line-height: 1.8;
        font-size: 14px;
        color: var(--el-text-color-primary);

        :deep(h2), :deep(h3), :deep(h4) {
          margin: 16px 0 8px;
          color: var(--el-text-color-primary);
        }
        :deep(h2) { font-size: 18px; }
        :deep(h3) { font-size: 16px; }
        :deep(h4) { font-size: 15px; }
        :deep(li) {
          margin-left: 20px;
          list-style: disc;
        }
        :deep(strong) {
          color: var(--el-color-primary);
        }
      }
    }
  }

  .account-section {
    background: var(--el-bg-color);
    border-radius: 8px;
    border: 1px solid var(--el-border-color);
    padding-bottom: 16px;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.spin-icon {
  animation: spin 1s linear infinite;
}
</style>
