<template>
  <div class="screen" ref="screenRef">
    <!-- 背景装饰 -->
    <div class="scr-bg-grid"></div>
    <div class="scr-bg-glow g1"></div>
    <div class="scr-bg-glow g2"></div>

    <!-- 顶部标题栏 -->
    <div class="scr-header">
      <div class="hd-side left">
        <span class="hd-tag">REAL-TIME</span>
        <span class="hd-date">{{ dateStr }}</span>
      </div>
      <div class="hd-title">
        <div class="title-deco l"></div>
        <h1>智慧调理经营数字大屏</h1>
        <div class="title-deco r"></div>
      </div>
      <div class="hd-side right">
        <span class="hd-clock">{{ timeStr }}</span>
        <button class="fs-btn" @click="toggleFull">{{ isFullscreen ? '退出全屏' : '全屏' }}</button>
      </div>
    </div>

    <!-- KPI 发光指标带 -->
    <div class="kpi-band">
      <div class="kpi-cell" v-for="k in kpis" :key="k.label">
        <div class="kpi-value" :style="{ color: k.color, textShadow: '0 0 18px ' + k.color }">{{ k.value }}</div>
        <div class="kpi-label">{{ k.label }}</div>
      </div>
    </div>

    <!-- 图表主体 -->
    <div class="scr-body" v-loading="loading" element-loading-background="rgba(4,20,16,0.6)">
      <div class="col left">
        <div class="panel">
          <div class="panel-title">月度收入 · 成本 · 实收</div>
          <div class="panel-chart"><HcChart :option="trendOption" height="260px" /></div>
        </div>
        <div class="panel">
          <div class="panel-title">门店确认收入排行 TOP10</div>
          <div class="panel-chart"><HcChart :option="rankOption" height="300px" /></div>
        </div>
      </div>

      <div class="col center">
        <div class="panel center-panel">
          <div class="panel-title">近 30 日核销走势</div>
          <div class="panel-chart"><HcChart :option="dayTrendOption" height="290px" /></div>
        </div>
        <div class="panel">
          <div class="panel-title">经营预警</div>
          <div class="alert-band">
            <div class="alert-cell" v-for="a in alertList" :key="a.key" :class="{ hit: a.value > 0 }">
              <div class="al-value">{{ a.value }}</div>
              <div class="al-label">{{ a.label }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="col right">
        <div class="panel">
          <div class="panel-title">确认收入构成</div>
          <div class="panel-chart"><HcChart :option="composeOption" height="250px" /></div>
        </div>
        <div class="panel">
          <div class="panel-title">渠道获客漏斗</div>
          <div class="panel-chart"><HcChart :option="funnelOption" height="220px" /></div>
        </div>
        <div class="panel">
          <div class="panel-title">调理效果雷达（初评 vs 复评）</div>
          <div class="panel-chart">
            <HcChart v-if="hasRadar" :option="radarOption" height="240px" />
            <div v-else class="radar-empty">区间内尚无「初评+复评」配对样本</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部滚动条 -->
    <div class="scr-footer">
      <div class="marquee">
        <div class="marquee-inner">
          <span class="mq-item" v-for="(t, i) in tickerItems" :key="i">{{ t }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup name="BigScreen">
import { boardTotal, boardStore } from "@/api/hc/board"
import { checkPermi } from "@/utils/permission"
import HcChart from "@/components/HcChart/index.vue"

const screenRef = ref(null)
const isFullscreen = ref(false)
const loading = ref(false)
const total = ref({})
const storeData = ref({})

const canTotal = checkPermi(["hc:board:total"])
const canStore = checkPermi(["hc:board:store"])

/* ---------- 时钟 ---------- */
const now = ref(new Date())
let clockTimer = null
const p2 = n => String(n).padStart(2, "0")
const timeStr = computed(() => p2(now.value.getHours()) + ":" + p2(now.value.getMinutes()) + ":" + p2(now.value.getSeconds()))
const dateStr = computed(() => {
  const week = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][now.value.getDay()]
  return now.value.getFullYear() + "-" + p2(now.value.getMonth() + 1) + "-" + p2(now.value.getDate()) + " " + week
})

/* ---------- 数据加载与轮询 ---------- */
function ymd(d) {
  return d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate())
}
function loadAll() {
  loading.value = true
  const now2 = new Date()
  const q = { beginTime: ymd(new Date(now2.getTime() - 29 * 86400000)), endTime: ymd(now2) }
  const tasks = []
  if (canTotal) tasks.push(boardTotal(q).then(r => { total.value = r.data || {} }).catch(() => {}))
  if (canStore) tasks.push(boardStore(q).then(r => { storeData.value = r.data || {} }).catch(() => {}))
  Promise.all(tasks).finally(() => { loading.value = false })
}
let pollTimer = null

/* ---------- 工具 ---------- */
function num(v) { return v == null ? 0 : Number(v) }
function money(v) { return num(v).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
function wan(v) { return num(v) >= 10000 ? (num(v) / 10000).toFixed(1) + " 万" : money(v) }
function cnt(v) { return String(Math.round(num(v))) }
function pct(v) { return num(v).toFixed(1) + "%" }
function sumOf(list, field) { return (list || []).reduce((a, b) => a + num(b[field]), 0) }
const REVENUE_TYPE = { "1": "核销确认", "2": "零售确认", "3": "退款冲减" }

/* 深色通用轴样式 */
const AXIS = {
  axisLine: { lineStyle: { color: "rgba(94,230,190,0.25)" } },
  axisLabel: { color: "#7fd8c0", fontSize: 10 },
  splitLine: { lineStyle: { color: "rgba(94,230,190,0.08)" } }
}
const LEGEND = { textStyle: { color: "#9fe8cf", fontSize: 11 }, top: 2, right: 4, itemWidth: 12, itemHeight: 8 }
const TIP = { trigger: "axis", backgroundColor: "rgba(4,31,25,0.92)", borderColor: "rgba(94,230,190,0.4)", textStyle: { color: "#d8f7eb", fontSize: 12 } }

/* ---------- KPI ---------- */
const kpis = computed(() => {
  const k = total.value.kpi || {}
  const sk = storeData.value.kpi || {}
  return [
    { label: "确认收入(元)", value: wan(k.confirmRevenue), color: "#5ee6be" },
    { label: "实收流入(元)", value: wan(k.receivedAmount), color: "#64d2ff" },
    { label: "毛利率", value: pct(k.grossRate), color: "#5ee6be" },
    { label: "核销笔数", value: cnt(k.serviceCount), color: "#ffd66b" },
    { label: "服务客户", value: cnt(k.servedCustomer), color: "#64d2ff" },
    { label: "客单价(元)", value: money(k.arpu), color: "#c99bff" },
    { label: "复购率", value: pct(k.repurchaseRate), color: "#ffd66b" },
    { label: "预约到店率", value: pct(sk.arriveRate), color: "#8ff0b7" },
    { label: "满意度", value: num(k.avgScore || sk.avgScore).toFixed(1), color: "#ff9d7a" }
  ]
})

/* ---------- 图表 option ---------- */
const trendOption = computed(() => {
  const t = total.value.trend || {}
  return {
    tooltip: TIP,
    legend: { ...LEGEND, data: ["确认收入", "成本", "实收"] },
    grid: { left: 52, right: 16, top: 30, bottom: 24 },
    xAxis: { type: "category", data: t.months || [], ...AXIS },
    yAxis: { type: "value", ...AXIS },
    series: [
      { name: "确认收入", type: "bar", barMaxWidth: 12, itemStyle: { color: "#5ee6be" }, data: t.revenue || [] },
      { name: "成本", type: "bar", barMaxWidth: 12, itemStyle: { color: "#e6a23c" }, data: t.cost || [] },
      { name: "实收", type: "line", smooth: true, symbol: "none", lineStyle: { color: "#64d2ff", width: 2 }, itemStyle: { color: "#64d2ff" }, areaStyle: { color: "rgba(100,210,255,0.12)" }, data: t.received || [] }
    ]
  }
})

const rankOption = computed(() => {
  const rows = (total.value.storeRank || []).slice(0, 10).reverse()
  return {
    tooltip: { ...TIP, axisPointer: { type: "shadow" } },
    legend: { ...LEGEND, data: ["确认收入", "毛利"] },
    grid: { left: 88, right: 20, top: 28, bottom: 20 },
    xAxis: { type: "value", ...AXIS },
    yAxis: { type: "category", data: rows.map(r => r.storeName), ...AXIS, axisLabel: { color: "#7fd8c0", fontSize: 11 } },
    series: [
      {
        name: "确认收入", type: "bar", barMaxWidth: 10,
        itemStyle: { borderRadius: [0, 4, 4, 0], color: { type: "linear", x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: "rgba(94,230,190,0.15)" }, { offset: 1, color: "#5ee6be" }] } },
        data: rows.map(r => num(r.revenue))
      },
      { name: "毛利", type: "bar", barMaxWidth: 10, itemStyle: { color: "#ffd66b", borderRadius: [0, 4, 4, 0] }, data: rows.map(r => num(r.grossProfit)) }
    ]
  }
})

const composeOption = computed(() => ({
  tooltip: { trigger: "item", backgroundColor: "rgba(4,31,25,0.92)", borderColor: "rgba(94,230,190,0.4)", textStyle: { color: "#d8f7eb", fontSize: 12 }, formatter: p => p.name + "：" + money(p.value) + " 元（" + p.percent + "%）" },
  legend: { ...LEGEND, top: "auto", bottom: 2, right: "center", data: ["核销确认", "零售确认", "退款冲减"] },
  color: ["#5ee6be", "#64d2ff", "#f56c6c"],
  series: [{
    type: "pie", radius: ["42%", "66%"], center: ["50%", "46%"],
    label: { color: "#9fe8cf", fontSize: 11, formatter: "{b}\n{d}%" },
    labelLine: { lineStyle: { color: "rgba(94,230,190,0.35)" } },
    itemStyle: { borderColor: "#062820", borderWidth: 2 },
    data: (total.value.compose || []).map(x => ({ name: REVENUE_TYPE[String(x.type)] || ("类型" + x.type), value: num(x.amount) }))
  }]
}))

const funnelOption = computed(() => {
  const rows = total.value.funnel || []
  return {
    tooltip: { trigger: "item", backgroundColor: "rgba(4,31,25,0.92)", borderColor: "rgba(94,230,190,0.4)", textStyle: { color: "#d8f7eb", fontSize: 12 }, formatter: p => p.name + "：" + cnt(p.value) },
    series: [{
      type: "funnel", sort: "none", left: "6%", width: "88%", top: 12, bottom: 8, minSize: "24%", gap: 4,
      label: { color: "#eafcf5", fontSize: 11, formatter: "{b}：{c}", position: "inside" },
      itemStyle: { borderColor: "#062820", borderWidth: 1 },
      data: [
        { name: "扫码访问", value: sumOf(rows, "visitCount"), itemStyle: { color: "#2b7a9e" } },
        { name: "建档新客", value: sumOf(rows, "newCount"), itemStyle: { color: "#2b9e7a" } },
        { name: "首单转化", value: sumOf(rows, "firstOrderCount"), itemStyle: { color: "#5ee6be" } }
      ]
    }]
  }
})

const dayTrendOption = computed(() => {
  const t = storeData.value.trend || {}
  return {
    tooltip: TIP,
    legend: { ...LEGEND, data: ["核销笔数", "确认金额"] },
    grid: { left: 44, right: 52, top: 30, bottom: 24 },
    xAxis: { type: "category", data: (t.days || []).map(d => String(d).substring(5)), ...AXIS },
    yAxis: [
      { type: "value", name: "笔数", nameTextStyle: { color: "#7fd8c0" }, ...AXIS },
      { type: "value", name: "金额", nameTextStyle: { color: "#7fd8c0" }, ...AXIS, splitLine: { show: false } }
    ],
    series: [
      { name: "核销笔数", type: "bar", barMaxWidth: 10, itemStyle: { color: "#64d2ff", borderRadius: [3, 3, 0, 0] }, data: t.cnt || [] },
      { name: "确认金额", type: "line", yAxisIndex: 1, smooth: true, symbol: "none", lineStyle: { color: "#5ee6be", width: 2 }, itemStyle: { color: "#5ee6be" }, areaStyle: { color: "rgba(94,230,190,0.14)" }, data: t.amount || [] }
    ]
  }
})

const radarOption = computed(() => {
  const r = storeData.value.radar || {}
  const dims = (r.names || []).map(n => ({ name: n, max: 100 }))
  return {
    tooltip: { backgroundColor: "rgba(4,31,25,0.92)", borderColor: "rgba(94,230,190,0.4)", textStyle: { color: "#d8f7eb", fontSize: 12 } },
    legend: { ...LEGEND, data: ["初评均分", "复评均分"] },
    radar: {
      indicator: dims, radius: "64%", center: ["50%", "54%"],
      axisName: { color: "#9fe8cf", fontSize: 10 },
      splitLine: { lineStyle: { color: "rgba(94,230,190,0.18)" } },
      splitArea: { areaStyle: { color: ["rgba(94,230,190,0.03)", "rgba(94,230,190,0.07)"] } },
      axisLine: { lineStyle: { color: "rgba(94,230,190,0.2)" } }
    },
    series: [{
      type: "radar", symbolSize: 4,
      data: [
        { name: "初评均分", value: (r.initial || []).map(x => num(x)), lineStyle: { color: "#ffd66b", width: 2 }, itemStyle: { color: "#ffd66b" }, areaStyle: { color: "rgba(255,214,107,0.12)" } },
        { name: "复评均分", value: (r.latest || []).map(x => num(x)), lineStyle: { color: "#5ee6be", width: 2 }, itemStyle: { color: "#5ee6be" }, areaStyle: { color: "rgba(94,230,190,0.18)" } }
      ]
    }]
  }
})
const hasRadar = computed(() => num((storeData.value.radar || {}).pairCount) > 0 && (storeData.value.radar || {}).names && storeData.value.radar.names.length > 0)

/* ---------- 预警 ---------- */
const ALERT_DEFS = [
  { key: "stockLow", label: "库存告急" },
  { key: "cardExpire30", label: "30天到期卡" },
  { key: "couponExpire7", label: "7天到期券" },
  { key: "reassessPending", label: "待复评" },
  { key: "deviceCalibrate", label: "校准临期" },
  { key: "sleepCustomer", label: "沉睡客户" }
]
const alertList = computed(() => {
  const a = storeData.value.alerts || {}
  return ALERT_DEFS.map(d => ({ ...d, value: Math.round(num(a[d.key])) }))
})

/* ---------- 底部滚动 ---------- */
const tickerItems = computed(() => {
  const k = total.value.kpi || {}
  const sk = storeData.value.kpi || {}
  const items = [
    "预收余额 ¥" + money(k.prepaidBalance) + "（未核销负债）",
    "本月新客建档 " + cnt(k.newCustomer) + " 人",
    "收入确认率 " + pct(k.revenueConfirmRate),
    "沉睡客户 " + cnt(sk.sleepCustomer) + " 人，请关注回访",
    "效果改善率 " + pct(k.avgImproveRate || sk.avgImproveRate)
  ]
  const tech = (storeData.value.technician || [])[0]
  if (tech) items.unshift("服务榜第一：" + tech.techName + "，确认收入 ¥" + money(tech.revenue))
  return items.concat(items)
})

/* ---------- 全屏 ---------- */
function toggleFull() {
  const el = screenRef.value
  if (!document.fullscreenElement) {
    (el.requestFullscreen || el.webkitRequestFullscreen).call(el)
  } else if (document.exitFullscreen) {
    document.exitFullscreen()
  }
}
function onFsChange() { isFullscreen.value = !!document.fullscreenElement }

onMounted(() => {
  clockTimer = setInterval(() => { now.value = new Date() }, 1000)
  pollTimer = setInterval(loadAll, 60000)
  document.addEventListener("fullscreenchange", onFsChange)
  loadAll()
})
onBeforeUnmount(() => {
  if (clockTimer) clearInterval(clockTimer)
  if (pollTimer) clearInterval(pollTimer)
  document.removeEventListener("fullscreenchange", onFsChange)
})
</script>

<style lang="scss" scoped>
.screen {
  position: relative;
  min-height: calc(100vh - 84px);
  margin: -20px;
  padding: 16px 20px;
  box-sizing: border-box;
  overflow: hidden;
  background: linear-gradient(160deg, #04140f 0%, #06281f 45%, #06222e 100%);
  color: #d8f7eb;
}
.screen:fullscreen {
  min-height: 100vh;
  margin: 0;
  overflow: auto;
}

.scr-bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(94, 230, 190, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(94, 230, 190, 0.05) 1px, transparent 1px);
  background-size: 56px 56px;
  pointer-events: none;
}
.scr-bg-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
}
.g1 {
  width: 520px; height: 520px;
  top: -220px; left: 18%;
  background: radial-gradient(circle, rgba(43, 122, 95, 0.4), transparent 70%);
  animation: breathe 8s ease-in-out infinite;
}
.g2 {
  width: 560px; height: 560px;
  bottom: -260px; right: 8%;
  background: radial-gradient(circle, rgba(24, 144, 255, 0.22), transparent 70%);
  animation: breathe 10s ease-in-out infinite reverse;
}
@keyframes breathe {
  0%, 100% { opacity: 0.65; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.12); }
}

/* 头部 */
.scr-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0 14px;
}
.hd-title {
  display: flex;
  align-items: center;
  gap: 18px;
  h1 {
    margin: 0;
    font-size: 26px;
    letter-spacing: 6px;
    font-weight: 700;
    background: linear-gradient(90deg, #5ee6be, #64d2ff);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    text-shadow: 0 0 30px rgba(94, 230, 190, 0.35);
  }
}
.title-deco {
  width: 120px;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(94, 230, 190, 0.8));
  &.r { background: linear-gradient(90deg, rgba(94, 230, 190, 0.8), transparent); }
}
.hd-side {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #7fd8c0;
  &.right { min-width: 190px; justify-content: flex-end; }
}
.hd-tag {
  padding: 2px 10px;
  border: 1px solid rgba(94, 230, 190, 0.5);
  border-radius: 3px;
  font-size: 11px;
  letter-spacing: 2px;
  color: #5ee6be;
  animation: breathe 3s ease-in-out infinite;
}
.hd-clock {
  font-size: 22px;
  font-weight: 600;
  color: #b8f5df;
  text-shadow: 0 0 14px rgba(94, 230, 190, 0.5);
  font-variant-numeric: tabular-nums;
}
.fs-btn {
  padding: 4px 14px;
  background: rgba(94, 230, 190, 0.12);
  border: 1px solid rgba(94, 230, 190, 0.4);
  border-radius: 4px;
  color: #5ee6be;
  font-size: 12px;
  cursor: pointer;
  &:hover { background: rgba(94, 230, 190, 0.25); }
}

/* KPI 带 */
.kpi-band {
  position: relative;
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  gap: 12px;
  margin-bottom: 14px;
}
.kpi-cell {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(94, 230, 190, 0.16);
  border-radius: 8px;
  padding: 12px 6px;
  text-align: center;
  backdrop-filter: blur(6px);
  transition: border-color 0.2s;
  &:hover { border-color: rgba(94, 230, 190, 0.5); }
}
.kpi-value {
  font-size: 22px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.kpi-label {
  margin-top: 4px;
  font-size: 12px;
  color: rgba(159, 232, 207, 0.72);
}

/* 主体三列 */
.scr-body {
  position: relative;
  display: flex;
  gap: 12px;
  align-items: stretch;
}
.col {
  display: flex;
  flex-direction: column;
  gap: 12px;
  &.left, &.right { width: 27%; flex-shrink: 0; }
  &.center { flex: 1; min-width: 0; }
}
.panel {
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(94, 230, 190, 0.14);
  border-radius: 10px;
  padding: 12px 14px;
  backdrop-filter: blur(6px);
}
.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: #b8f5df;
  padding-left: 10px;
  margin-bottom: 8px;
  border-left: 3px solid #5ee6be;
  line-height: 1.2;
  text-shadow: 0 0 12px rgba(94, 230, 190, 0.3);
}
.radar-empty {
  height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(159, 232, 207, 0.5);
  font-size: 13px;
}

/* 预警 */
.alert-band {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.alert-cell {
  border: 1px solid rgba(94, 230, 190, 0.14);
  border-radius: 8px;
  padding: 12px;
  text-align: center;
  transition: all 0.2s;
  .al-value {
    font-size: 24px;
    font-weight: 700;
    color: rgba(184, 245, 223, 0.75);
    font-variant-numeric: tabular-nums;
  }
  .al-label { font-size: 12px; color: rgba(159, 232, 207, 0.6); margin-top: 4px; }
  &.hit {
    border-color: rgba(245, 108, 108, 0.55);
    background: rgba(245, 108, 108, 0.08);
    .al-value {
      color: #ff9d7a;
      text-shadow: 0 0 16px rgba(255, 157, 122, 0.6);
    }
    animation: alertPulse 2s ease-in-out infinite;
  }
}
@keyframes alertPulse {
  0%, 100% { box-shadow: 0 0 0 rgba(255, 157, 122, 0); }
  50% { box-shadow: 0 0 18px rgba(255, 157, 122, 0.35); }
}

/* 底部滚动 */
.scr-footer {
  position: relative;
  margin-top: 14px;
  border-top: 1px solid rgba(94, 230, 190, 0.12);
  padding-top: 8px;
}
.marquee {
  overflow: hidden;
  white-space: nowrap;
}
.marquee-inner {
  display: inline-block;
  animation: marquee 40s linear infinite;
}
.mq-item {
  display: inline-block;
  margin-right: 60px;
  font-size: 13px;
  color: rgba(159, 232, 207, 0.8);
  &::before {
    content: "◆";
    color: #5ee6be;
    margin-right: 8px;
    font-size: 10px;
  }
}
@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

@media (max-width: 1400px) {
  .kpi-band { grid-template-columns: repeat(5, 1fr); }
  .scr-body { flex-direction: column; }
  .col.left, .col.right { width: 100%; }
}
</style>
