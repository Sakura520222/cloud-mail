<template>
    <el-scrollbar style="height: 100%;">
        <div class="analysis-container">
            <el-tabs v-model="activeTab" class="analysis-tabs">
                <el-tab-pane v-if="hasPerm('analysis:query')" :label="$t('globalOverview')" name="overview">
                    <div v-if="overviewLoading" class="analysis-loading">
                        <loading />
                    </div>
                    <div v-else class="analysis" :key="'o' + boxKey">
                        <div class="number">
                            <div class="number-item">
                                <div class="top">
                                    <div class="left">
                                        <div>{{ $t('totalReceived') }}</div>
                                        <div><el-statistic :formatter="value => Math.round(value)"
                                                :value="receiveData" /></div>
                                    </div>
                                    <div class="right">
                                        <div class="count-icon">
                                            <Icon icon="hugeicons:mailbox-01" width="25" height="25" />
                                        </div>
                                    </div>
                                </div>
                                <div class="delete-ratio">
                                    <div>{{ $t('active') }} <span class="normal">{{ numberCount.normalReceiveTotal
                                            }}</span></div>
                                    <div>{{ $t('deleted') }} <span class="deleted">{{ numberCount.delReceiveTotal
                                            }}</span></div>
                                </div>
                            </div>
                            <div class="number-item">
                                <div class="top">
                                    <div class="left">
                                        <div>{{ $t('totalSent') }}</div>
                                        <div><el-statistic :formatter="value => Math.round(value)" :value="sendData" />
                                        </div>
                                    </div>
                                    <div class="right">
                                        <div class="count-icon">
                                            <Icon icon="cil:send" width="25" height="25" />
                                        </div>
                                    </div>
                                </div>
                                <div class="delete-ratio">
                                    <div>{{ $t('active') }} <span class="normal">{{ numberCount.normalSendTotal
                                            }}</span></div>
                                    <div>{{ $t('deleted') }} <span class="deleted">{{ numberCount.delSendTotal }}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="number-item">
                                <div class="top">
                                    <div class="left">
                                        <div>{{ $t('totalMailboxes') }}</div>
                                        <div><el-statistic :formatter="value => Math.round(value)"
                                                :value="accountData" /></div>
                                    </div>
                                    <div class="right">
                                        <div class="count-icon">
                                            <Icon icon="lets-icons:e-mail" width="23" height="23" />
                                        </div>
                                    </div>
                                </div>
                                <div class="delete-ratio">
                                    <div>{{ $t('active') }} <span class="normal">{{ numberCount.normalAccountTotal
                                            }}</span></div>
                                    <div>{{ $t('deleted') }} <span class="deleted">{{ numberCount.delAccountTotal
                                            }}</span></div>
                                </div>
                            </div>
                            <div class="number-item">
                                <div class="top">
                                    <div class="left">
                                        <div>{{ $t('totalUsers') }}</div>
                                        <div><el-statistic :formatter="value => Math.round(value)" :value="userData" />
                                        </div>
                                    </div>
                                    <div class="right">
                                        <div class="count-icon">
                                            <Icon icon="iconoir:user" width="25" height="25" />
                                        </div>
                                    </div>
                                </div>
                                <div class="delete-ratio">
                                    <div>{{ $t('active') }} <span class="normal">{{ numberCount.normalUserTotal
                                            }}</span></div>
                                    <div>{{ $t('deleted') }} <span class="deleted">{{ numberCount.delUserTotal }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="picture">
                            <div class="picture-item">
                                <div class="title">{{ $t('emailSource') }}</div>
                                <div class="sender-pie"></div>
                            </div>
                            <div class="picture-item">
                                <div class="title">{{ $t('userGrowth') }}</div>
                                <div class="increase-line"></div>
                            </div>
                        </div>
                        <div class="picture-cs">
                            <div class="picture-cs-item">
                                <div class="title">{{ $t('emailGrowth') }}</div>
                                <div class="email-column"></div>
                            </div>
                            <div class="picture-cs-item">
                                <div class="title">{{ $t('sentToday') }}</div>
                                <div class="send-count"></div>
                            </div>
                        </div>
                    </div>
                </el-tab-pane>

                <el-tab-pane :label="$t('emailReport')" name="report">
                    <div v-if="reportLoading" class="analysis-loading">
                        <loading />
                    </div>
                    <div v-else class="report" :key="'r' + boxKey">
                        <div class="controls">
                            <div class="controls-left">
                                <el-date-picker v-model="selectedMonth" type="month" :placeholder="$t('selectMonth')"
                                    format="YYYY-MM" value-format="YYYY-MM" @change="onMonthChange" :clearable="false"
                                    style="width: 160px;" />
                                <el-switch v-if="hasPerm('analysis:query')" v-model="isAdmin"
                                    :active-text="$t('fullSiteAnalysis')" @change="onScopeChange"
                                    style="margin-left: 12px;" />
                            </div>
                            <div class="controls-right">
                                <el-button @click="onRefresh" :loading="refreshing">
                                    <Icon icon="ep:refresh" width="14" height="14" style="margin-right: 4px;" />{{
                                    $t('refreshReport') }}
                                </el-button>
                                <el-button type="primary" @click="onAiAnalysis" :loading="aiGenerating">
                                    <Icon icon="ep:magic-stick" width="14" height="14" style="margin-right: 4px;" />{{
                                    $t('aiAnalysis') }}
                                </el-button>
                            </div>
                        </div>
                        <div class="number">
                            <div class="number-item">
                                <div class="top">
                                    <div class="left">
                                        <div>{{ $t('totalReceived') }}</div>
                                        <div><el-statistic :formatter="value => Math.round(value)"
                                                :value="rReceiveData" /></div>
                                    </div>
                                    <div class="right">
                                        <div class="count-icon">
                                            <Icon icon="hugeicons:mailbox-01" width="25" height="25" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="number-item">
                                <div class="top">
                                    <div class="left">
                                        <div>{{ $t('totalSent') }}</div>
                                        <div><el-statistic :formatter="value => Math.round(value)" :value="rSendData" />
                                        </div>
                                    </div>
                                    <div class="right">
                                        <div class="count-icon">
                                            <Icon icon="cil:send" width="25" height="25" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="number-item">
                                <div class="top">
                                    <div class="left">
                                        <div>{{ $t('unread') }}</div>
                                        <div><el-statistic :formatter="value => Math.round(value)"
                                                :value="rUnreadData" /></div>
                                    </div>
                                    <div class="right">
                                        <div class="count-icon">
                                            <Icon icon="fluent:mail-unread-20-regular" width="25" height="25" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="number-item">
                                <div class="top">
                                    <div class="left">
                                        <div>{{ $t('totalEmails') }}</div>
                                        <div><el-statistic :formatter="value => Math.round(value)"
                                                :value="rTotalData" /></div>
                                    </div>
                                    <div class="right">
                                        <div class="count-icon">
                                            <Icon icon="fluent:mail-20-regular" width="25" height="25" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
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
                        <div class="ai-report" v-if="showAiReport">
                            <div class="ai-report-header">
                                <div class="ai-report-title">
                                    <Icon icon="fluent:sparkle-20-filled" width="20" height="20"
                                        style="color: var(--el-color-primary);" /><span>AI {{ $t('report') }}</span>
                                </div>
                                <el-button text @click="showAiReport = false">
                                    <Icon icon="ep:close" width="16" height="16" />
                                </el-button>
                            </div>
                            <div class="ai-report-content" ref="aiReportContent">
                                <div v-if="aiGenerating" class="ai-loading">
                                    <Icon icon="ep:loading" width="18" height="18" class="spin-icon" /><span>{{
                                        $t('generatingAnalysis') }}</span>
                                </div>
                                <div v-else class="ai-text" v-html="renderMarkdown(aiResult)"></div>
                            </div>
                        </div>
                        <div class="account-section"
                            v-if="reportData.accountBreakdown && reportData.accountBreakdown.length > 0">
                            <div class="title">{{ $t('accountStats') }}</div>
                            <el-table :data="reportData.accountBreakdown" stripe style="width: 100%">
                                <el-table-column prop="email" :label="$t('emailAccount')" min-width="200" />
                                <el-table-column prop="received" :label="$t('totalReceived')" width="120"
                                    align="center" />
                                <el-table-column prop="sent" :label="$t('totalSent')" width="120" align="center" />
                            </el-table>
                        </div>
                    </div>
                </el-tab-pane>
            </el-tabs>
        </div>
    </el-scrollbar>
</template>

<script setup>
import { Icon } from "@iconify/vue";
import { useTransition } from "@vueuse/core";
import { defineOptions, onActivated, onDeactivated, onMounted, reactive, ref, watch, computed } from "vue";
import echarts from "@/echarts/index.js";
import dayjs from "dayjs";
import { analysisEcharts } from "@/request/analysis.js";
import { getReportData, refreshReport } from "@/request/report.js";
import { aiChat } from "@/request/ai.js";
import { useUiStore } from "@/store/ui.js";
import { debounce } from "lodash-es";
import loading from "@/components/loading/index.vue";
import { useRoute } from "vue-router";
import { useI18n } from 'vue-i18n';
import { hasPerm } from "@/perm/perm.js";

defineOptions({ name: 'analysis' })

const { t } = useI18n();
const route = useRoute();
const uiStore = useUiStore();
const hasAnalysisPerm = hasPerm('analysis:query');

const activeTab = ref(hasAnalysisPerm ? 'overview' : 'report');

// ========== 全局概览 ==========
const overviewLoading = ref(hasAnalysisPerm);
const receiveTotal = ref(0), sendTotal = ref(0), accountTotal = ref(0), userTotal = ref(0);
const numberCount = reactive({ normalReceiveTotal: 0, normalSendTotal: 0, normalAccountTotal: 0, normalUserTotal: 0, delReceiveTotal: 0, delSendTotal: 0, delAccountTotal: 0, delUserTotal: 0 });
const receiveData = useTransition(receiveTotal, { duration: 1500 });
const sendData = useTransition(sendTotal, { duration: 1500 });
const accountData = useTransition(accountTotal, { duration: 1500 });
const userData = useTransition(userTotal, { duration: 1500 });
const senderData = ref(null);
const userLineData = reactive({ xdata: [], sdata: [] });
const emailColumnData = { receiveData: [], sendData: [], daysData: [] };
let daySendTotal = 0;
let senderPie = null, increaseLine = null, emailColumn = null, sendGauge = null;

// ========== 邮件报告 ==========
const reportLoading = ref(true);
const refreshing = ref(false), aiGenerating = ref(false), showAiReport = ref(false), aiResult = ref(''), isAdmin = ref(false);
const aiReportContent = ref(null);
const selectedMonth = ref(dayjs().format('YYYY-MM'));
const reportData = reactive({ period: {}, stats: { received: 0, sent: 0, unread: 0, readCount: 0, total: 0 }, dayTrend: [], topSenders: [], topRecipients: [], hourlyHeatmap: [], statusBreakdown: {}, accountBreakdown: [] });
const rReceiveTotal = ref(0), rSendTotal = ref(0), rUnreadTotal = ref(0), rTotalEmails = ref(0);
const rReceiveData = useTransition(rReceiveTotal, { duration: 1500 });
const rSendData = useTransition(rSendTotal, { duration: 1500 });
const rUnreadData = useTransition(rUnreadTotal, { duration: 1500 });
const rTotalData = useTransition(rTotalEmails, { duration: 1500 });
let trendChart = null, contactsChart = null, hourlyChart = null, statusChart = null;

// ========== 公共 ==========
const boxKey = ref(0);
let first = true, leaveWidth = 0, pageDark = uiStore.dark;
const topic = computed(() => ({
    color: uiStore.dark ? '#E5EAF3' : '#303133', background: uiStore.dark ? '#141414' : '#FFFFFF',
    borderColor: uiStore.dark ? '#141414' : '#FFFFFF', scaleLineColor: uiStore.dark ? '#636466' : '#CDD0D6',
    crossColor: uiStore.dark ? '#8D9095' : '#A8ABB2', axisColor: uiStore.dark ? '#A3A6AD' : '#909399',
    splitLineColor: uiStore.dark ? '#58585B' : '#D4D7DE', gaugeSplitLine: uiStore.dark ? '#CFD3DC' : '#606266',
    containerBackground: uiStore.dark ? '#6C6E72' : '#E6EBF8'
}));

function getTimeZone() { return Intl.DateTimeFormat().resolvedOptions().timeZone; }
function parseMonth() { const p = selectedMonth.value.split('-'); return { year: parseInt(p[0]), month: parseInt(p[1]) }; }

// ========== 加载全局概览 ==========
function loadOverview() {
    if (!hasAnalysisPerm) return;
    analysisEcharts(getTimeZone()).then(data => {
        receiveTotal.value = data.numberCount.receiveTotal; sendTotal.value = data.numberCount.sendTotal;
        accountTotal.value = data.numberCount.accountTotal; userTotal.value = data.numberCount.userTotal;
        Object.assign(numberCount, data.numberCount);
        senderData.value = data.receiveRatio.nameRatio.map(i => ({ name: i.name || ' ', value: i.total }));
        userLineData.xdata = data.userDayCount.map(i => dayjs(i.date).format("M.D"));
        userLineData.sdata = data.userDayCount.map(i => i.total);
        emailColumnData.daysData = data.emailDayCount.receiveDayCount.map(i => dayjs(i.date).format("M.D"));
        emailColumnData.receiveData = data.emailDayCount.receiveDayCount.map(i => i.total);
        emailColumnData.sendData = data.emailDayCount.sendDayCount.map(i => i.total);
        daySendTotal = data.daySendTotal;
        overviewLoading.value = false;
        initOverviewCharts(); first = false;
    });
}

// ========== 加载邮件报告 ==========
async function loadReport() {
    const { year, month } = parseMonth();
    try {
        const data = await getReportData(year, month, getTimeZone(), isAdmin.value ? 'admin' : 'user');
        Object.assign(reportData, data);
        rReceiveTotal.value = data.stats.received; rSendTotal.value = data.stats.sent;
        rUnreadTotal.value = data.stats.unread; rTotalEmails.value = data.stats.total;
        reportLoading.value = false;
        initReportCharts();
    } catch (e) { reportLoading.value = false; }
}
function onMonthChange() { reportLoading.value = true; loadReport(); }
function onScopeChange() { reportLoading.value = true; loadReport(); }
async function onRefresh() {
    refreshing.value = true;
    const { year, month } = parseMonth();
    try {
        const data = await refreshReport(year, month, getTimeZone(), isAdmin.value ? 'admin' : 'user');
        Object.assign(reportData, data);
        rReceiveTotal.value = data.stats.received; rSendTotal.value = data.stats.sent;
        rUnreadTotal.value = data.stats.unread; rTotalEmails.value = data.stats.total;
        initReportCharts();
    } finally { refreshing.value = false; }
}
function onAiAnalysis() {
    showAiReport.value = true; aiResult.value = ''; aiGenerating.value = true;
    aiChat({ action: 'report', content: JSON.stringify({ period: reportData.period, stats: reportData.stats, dayTrend: reportData.dayTrend, topSenders: reportData.topSenders, topRecipients: reportData.topRecipients, hourlyHeatmap: reportData.hourlyHeatmap, statusBreakdown: reportData.statusBreakdown }, null, 2), language: '中文' }, {
        onMessage: (text) => { aiResult.value += text; if (aiReportContent.value) aiReportContent.value.scrollTop = aiReportContent.value.scrollHeight; },
        onDone: () => { aiGenerating.value = false; },
        onError: () => { aiGenerating.value = false; }
    });
}
function renderMarkdown(text) {
    if (!text) return '';
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/^### (.+)$/gm, '<h4>$1</h4>').replace(/^## (.+)$/gm, '<h3>$1</h3>').replace(/^# (.+)$/gm, '<h2>$1</h2>')
        .replace(/^- (.+)$/gm, '<li>$1</li>').replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>').replace(/\n\n/g, '<br/><br/>').replace(/\n/g, '<br/>');
}

// ========== 生命周期 ==========
onMounted(() => { loadOverview(); loadReport(); });
const widthChange = debounce(rebuildAll, 500, { leading: false, trailing: true });
watch(() => uiStore.asideShow, () => { if (window.innerWidth > 1024) widthChange(); });
onActivated(() => {
    if (first) return;
    if (window.innerWidth !== leaveWidth && leaveWidth !== 0) widthChange();
    else if (pageDark !== uiStore.dark) { pageDark = uiStore.dark; rebuildAll(); }
});
onDeactivated(() => { leaveWidth = window.innerWidth; });
window.onresize = () => widthChange();
watch(() => uiStore.dark, () => { if (route.name !== 'analysis') return; pageDark = uiStore.dark; rebuildAll(); });
watch(activeTab, (tab) => { boxKey.value++; setTimeout(() => { if (tab === 'overview') initOverviewCharts(); else initReportCharts(); }); });

function rebuildAll() { if (route.name !== 'analysis') return; boxKey.value++; setTimeout(() => { initOverviewCharts(); initReportCharts(); }); }
function initOverviewCharts() { if (!hasAnalysisPerm) return; setTimeout(() => { createSenderPie(); createIncreaseLine(); createEmailColumnChart(); createSendGauge(); }); }
function initReportCharts() { setTimeout(() => { createTrendChart(); createContactsChart(); createHourlyChart(); createStatusPie(); }); }

let senderPieLeft = window.innerWidth < 500 ? `${window.innerWidth - 110}` : '72%';
const measureCtx = document.createElement('canvas').getContext('2d'); measureCtx.font = '12px sans-serif';
function truncateTextByWidth(text, max = 140) { let w = measureCtx.measureText(text).width; if (w <= max) return text; let r = ''; for (let i = 0; i < text.length; i++) { r += text[i]; if (measureCtx.measureText(r + '…').width > max) return r.slice(0, -1) + '…'; } return text; }

// ========== 全局概览图表 ==========
function createSenderPie() {
    if (senderPie) senderPie.dispose(); const el = document.querySelector(".sender-pie"); if (!el) return; senderPie = echarts.init(el);
    senderPie.setOption({
        tooltip: { trigger: 'item', textStyle: { color: topic.value.color }, backgroundColor: topic.value.background, formatter: p => `${p.marker} ${p.name}： ${p.value} (${p.percent}%)` },
        legend: { type: 'scroll', orient: 'vertical', left: '10', top: '20', textStyle: { color: topic.value.color }, formatter: name => truncateTextByWidth(name) },
        series: [{ data: senderData.value, type: 'pie', radius: ['40%', '65%'], center: [senderPieLeft, '45%'], avoidLabelOverlap: false, itemStyle: { borderRadius: 4, borderColor: topic.value.borderColor, borderWidth: 2 }, label: { show: false }, emphasis: { label: { show: false, fontSize: 40, fontWeight: 'bold' } }, labelLine: { show: true }, color: ['#3CB2FF', '#13DEB9', '#FBBF24', '#FF7F50', '#BAE6FD', '#C084FC'] }]
    });
}
function createIncreaseLine() {
    if (increaseLine) increaseLine.dispose(); const el = document.querySelector(".increase-line"); if (!el) return; increaseLine = echarts.init(el);
    increaseLine.setOption({
        tooltip: { trigger: 'axis', axisPointer: { type: 'cross', crossStyle: { color: topic.value.crossColor }, lineStyle: { color: topic.value.crossColor }, axis: 'x' }, formatter: params => { let r = ''; params.forEach(i => { r = `${i.marker} ${t('growthTotalUsers')} ${i.value}`; }); return r; }, backgroundColor: topic.value.background, borderColor: topic.value.splitLineColor, borderWidth: 1, padding: 10, textStyle: { color: topic.value.color } },
        grid: { top: '8%', right: '20', left: '35', bottom: '35' },
        xAxis: { type: 'category', data: userLineData.xdata, boundaryGap: false, axisTick: { show: false }, axisPointer: { label: { show: false } }, axisLine: { lineStyle: { color: topic.value.axisColor, width: 1, type: 'solid' } }, axisLabel: { formatter: (v, i) => i === 0 ? '      ' + v : i === userLineData.xdata.length - 1 ? v + '   ' : v } },
        yAxis: { type: 'value', axisLabel: { margin: 5 }, boundaryGap: [0, 0.1], max: p => p.max < 8 ? 10 : undefined, axisLine: { show: true, lineStyle: { color: topic.value.axisColor, width: 1 } }, axisPointer: { label: { show: true, formatter: e => Math.round(e.value) } }, splitLine: { show: true, lineStyle: { type: 'dashed', color: topic.value.scaleLineColor } } },
        series: [{ data: userLineData.sdata, type: 'line', smooth: 0.1, symbol: 'none', lineStyle: { color: '#1D84FF', width: 2.5 }, areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(29,132,255,0.3)' }, { offset: 1, color: 'rgba(29,132,255,0.03)' }]) }, color: ['#1D84FF'] }]
    });
    const max = increaseLine.getModel().getComponent('yAxis', 0).axis.scale.getExtent()[1]; let left = 35; if (max > 99) left = 42; if (max > 999) left = 51; if (max > 9999) left = 58; if (max > 99999) left = 66;
    increaseLine.setOption({ grid: { left } });
}
function createEmailColumnChart() {
    if (emailColumn) emailColumn.dispose(); const el = document.querySelector(".email-column"); if (!el) return; emailColumn = echarts.init(el);
    emailColumn.setOption({
        tooltip: { textStyle: { color: topic.value.color }, backgroundColor: topic.value.background, formatter: p => `${p.marker} ${p.seriesName}: ${p.value}` },
        legend: { data: [t('emailReceived'), t('emailSent')], top: '0', textStyle: { color: topic.value.color } }, grid: { left: '18', right: '18', bottom: '15', top: '50', containLabel: true },
        xAxis: { type: 'category', data: emailColumnData.daysData, axisTick: { show: false }, axisLine: { show: true, lineStyle: { color: topic.value.axisColor, width: 1 } } },
        yAxis: { max: p => p.max < 8 ? 10 : undefined, splitLine: { show: true, lineStyle: { color: topic.value.splitLineColor, type: 'solid', width: 1 } }, axisLine: { show: true, lineStyle: { color: topic.value.axisColor, width: 0 } }, type: 'value', boundaryGap: [0, 0.1] },
        series: [{ name: t('emailReceived'), type: 'bar', stack: 'total', barWidth: '60%', barMaxWidth: 30, emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.3)' } }, data: emailColumnData.receiveData, itemStyle: { color: '#3CB2FF' } }, { name: t('emailSent'), type: 'bar', stack: 'total', emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.3)' } }, data: emailColumnData.sendData, itemStyle: { color: '#13deb9' } }]
    });
}
function createSendGauge() {
    if (sendGauge) sendGauge.dispose(); const el = document.querySelector(".send-count"); if (!el) return; sendGauge = echarts.init(el);
    sendGauge.setOption({
        tooltip: { textStyle: { color: topic.value.color }, backgroundColor: topic.value.background },
        series: [{ name: t('sentToday'), type: 'gauge', max: 100, progress: { show: true, roundCap: true, itemStyle: { color: '#3CB2FF' } }, pointer: { itemStyle: { color: '#3CB2FF' } }, axisLabel: { color: topic.value.gaugeSplitLine }, axisLine: { roundCap: true, lineStyle: { color: [[1, topic.value.containerBackground]] } }, splitLine: { lineStyle: { color: topic.value.gaugeSplitLine } }, axisTick: { lineStyle: { color: topic.value.axisColor } }, detail: { valueAnimation: true, formatter: '{value}', color: topic.value.color }, data: [{ value: daySendTotal, name: t('total'), title: { color: topic.value.color } }] }], color: ['#3CB2FF']
    });
}

// ========== 邮件报告图表 ==========
function createTrendChart() {
    if (trendChart) trendChart.dispose(); const el = document.querySelector('.trend-line'); if (!el) return; trendChart = echarts.init(el);
    trendChart.setOption({
        tooltip: { trigger: 'axis', backgroundColor: topic.value.background, textStyle: { color: topic.value.color }, axisPointer: { type: 'cross', crossStyle: { color: topic.value.crossColor } } }, legend: { data: [t('emailReceived'), t('emailSent')], top: '0', textStyle: { color: topic.value.color } }, grid: { top: '40', right: '20', left: '45', bottom: '30' },
        xAxis: { type: 'category', data: reportData.dayTrend.map(d => dayjs(d.date).format('M.D')), boundaryGap: false, axisTick: { show: false }, axisLine: { lineStyle: { color: topic.value.axisColor } } },
        yAxis: { type: 'value', boundaryGap: [0, 0.1], axisLine: { show: true, lineStyle: { color: topic.value.axisColor } }, splitLine: { lineStyle: { type: 'dashed', color: topic.value.scaleLineColor } } },
        series: [{ name: t('emailReceived'), type: 'line', smooth: 0.2, symbol: 'none', lineStyle: { color: '#3CB2FF', width: 2.5 }, areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(60,178,255,0.3)' }, { offset: 1, color: 'rgba(60,178,255,0.03)' }]) }, data: reportData.dayTrend.map(d => d.received) },
        { name: t('emailSent'), type: 'line', smooth: 0.2, symbol: 'none', lineStyle: { color: '#13DEB9', width: 2.5 }, areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(19,222,185,0.3)' }, { offset: 1, color: 'rgba(19,222,185,0.03)' }]) }, data: reportData.dayTrend.map(d => d.sent) }]
    });
}
function createContactsChart() {
    if (contactsChart) contactsChart.dispose(); const el = document.querySelector('.top-contacts-bar'); if (!el) return; contactsChart = echarts.init(el);
    const data = reportData.topSenders.slice(0, 10).reverse();
    contactsChart.setOption({
        tooltip: { trigger: 'axis', backgroundColor: topic.value.background, textStyle: { color: topic.value.color }, axisPointer: { type: 'shadow' } }, grid: { top: '10', right: '30', left: '120', bottom: '20' },
        xAxis: { type: 'value', splitLine: { lineStyle: { color: topic.value.scaleLineColor } }, axisLine: { lineStyle: { color: topic.value.axisColor } } },
        yAxis: { type: 'category', data: data.map(d => d.name || d.email), axisLine: { lineStyle: { color: topic.value.axisColor } }, axisTick: { show: false }, axisLabel: { width: 100, overflow: 'truncate', fontSize: 12, color: topic.value.color } },
        series: [{ type: 'bar', data: data.map(d => d.count), barMaxWidth: 20, itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#3CB2FF' }, { offset: 1, color: '#13DEB9' }]), borderRadius: [0, 4, 4, 0] } }]
    });
}
function createHourlyChart() {
    if (hourlyChart) hourlyChart.dispose(); const el = document.querySelector('.hourly-chart'); if (!el) return; hourlyChart = echarts.init(el);
    hourlyChart.setOption({
        tooltip: { trigger: 'axis', backgroundColor: topic.value.background, textStyle: { color: topic.value.color } }, grid: { top: '10', right: '20', left: '45', bottom: '30' },
        xAxis: { type: 'category', data: reportData.hourlyHeatmap.map(d => `${d.hour}:00`), axisLine: { lineStyle: { color: topic.value.axisColor } }, axisTick: { show: false }, axisLabel: { interval: 2, color: topic.value.color } },
        yAxis: { type: 'value', splitLine: { lineStyle: { color: topic.value.scaleLineColor } }, axisLine: { lineStyle: { color: topic.value.axisColor } } },
        series: [{ type: 'bar', data: reportData.hourlyHeatmap.map(d => d.count), barMaxWidth: 25, itemStyle: { color: new echarts.graphic.LinearGradient(0, 1, 0, 0, [{ offset: 0, color: 'rgba(60,178,255,0.3)' }, { offset: 1, color: '#3CB2FF' }]), borderRadius: [4, 4, 0, 0] } }]
    });
}
function createStatusPie() {
    if (statusChart) statusChart.dispose(); const el = document.querySelector('.status-pie'); if (!el) return; statusChart = echarts.init(el);
    const labels = { received: t('emailReceived'), sent: t('emailSent'), delivered: t('delivered') || 'Delivered', bounced: t('bounced') || 'Bounced', failed: t('failed') || 'Failed' };
    const pieData = Object.entries(reportData.statusBreakdown).filter(([k, v]) => v > 0 && labels[k]).map(([k, v]) => ({ name: labels[k], value: v }));
    if (!pieData.length) pieData.push({ name: t('noData'), value: 1 });
    statusChart.setOption({
        tooltip: { trigger: 'item', backgroundColor: topic.value.background, textStyle: { color: topic.value.color }, formatter: p => `${p.marker} ${p.name}: ${p.value} (${p.percent}%)` },
        legend: { orient: 'vertical', left: 'left', top: 'center', textStyle: { color: topic.value.color } },
        series: [{ type: 'pie', radius: ['40%', '65%'], center: ['60%', '50%'], avoidLabelOverlap: false, itemStyle: { borderRadius: 4, borderColor: topic.value.borderColor, borderWidth: 2 }, label: { show: false }, emphasis: { label: { show: false } }, data: pieData, color: ['#3CB2FF', '#13DEB9', '#FBBF24', '#FF7F50', '#C084FC'] }]
    });
}
</script>

<style scoped lang="scss">
.analysis-loading {
    height: 100%;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.analysis-container {
    height: 100%;
    padding: 0 20px 20px;
    background: var(--extra-light-fill);

    .analysis-tabs {
        :deep(.el-tabs__header) {
            margin-bottom: 0;
        }

        :deep(.el-tabs__nav-wrap::after) {
            display: none;
        }

        :deep(.el-tabs__active-bar) {
            display: none;
        }

        :deep(.el-tabs__item) {
            font-size: 16px;
            font-weight: 500;
            padding: 0 20px;
        }
    }
}

.analysis,
.report {
    padding: 20px 0 30px;
    gap: 20px;
    display: grid;
    grid-auto-rows: min-content;

    @media (max-width: 1024px) {
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

                    >div:first-child {
                        font-size: 15px;
                    }

                    >div:last-child {
                        font-size: 13px;
                    }

                    :deep(.el-statistic__number) {
                        font-size: 26px;
                    }
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

            .delete-ratio {
                width: 100%;
                display: grid;
                grid-template-columns: auto auto;
                justify-content: start;
                gap: 20px;
                padding-top: 5px;
                font-size: 14px;

                .normal {
                    color: var(--el-color-success);
                    font-weight: bold;
                    margin-left: 3px;
                }

                .deleted {
                    color: var(--el-color-danger);
                    font-weight: bold;
                    margin-left: 3px;
                }
            }
        }
    }

    .picture {
        display: grid;
        grid-template-columns: 500px 1fr;
        gap: 20px;

        @media (max-width:1620px) {
            grid-template-columns: 1fr;
        }

        @media (max-width:1024px) {
            gap: 15px;
        }

        .picture-item {
            background: var(--el-bg-color);
            border-radius: 8px;
            border: 1px solid var(--el-border-color);

            .sender-pie,
            .increase-line,
            .trend-line,
            .top-contacts-bar {
                height: 350px;

                @media (max-width:767px) {
                    height: 260px;
                }
            }
        }
    }

    .picture-cs {
        display: grid;
        grid-template-columns: 1fr 500px;
        gap: 20px;

        @media (max-width:1620px) {
            grid-template-columns: 1fr;
            gap: 15px;
        }

        .picture-cs-item {
            background: var(--el-bg-color);
            border-radius: 8px;
            border: 1px solid var(--el-border-color);

            .send-count,
            .email-column,
            .hourly-chart,
            .status-pie {
                height: 350px;

                @media (max-width:767px) {
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

                :deep(h2),
                :deep(h3),
                :deep(h4) {
                    margin: 16px 0 8px;
                    color: var(--el-text-color-primary);
                }

                :deep(h2) {
                    font-size: 18px;
                }

                :deep(h3) {
                    font-size: 16px;
                }

                :deep(h4) {
                    font-size: 15px;
                }

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
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

.spin-icon {
    animation: spin 1s linear infinite;
}
</style>
