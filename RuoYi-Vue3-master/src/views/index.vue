<template>
  <div class="dash-home">
    <!-- 背景装饰层 -->
    <div class="tech-bg">
      <div class="grid-layer"></div>
      <span class="glow glow-a"></span>
      <span class="glow glow-b"></span>
    </div>

    <!-- 顶部问候 + 工具 -->
    <div class="dash-header">
      <div class="hello">
        <h1>{{ greeting }}，{{ nickName }}</h1>
        <p class="date-line">{{ todayText }} · 亚健康轻医院管理系统数据总览</p>
      </div>
      <div class="tools">
        <el-radio-group v-model="quick" class="quick-group" @change="applyQuick">
          <el-radio-button value="30">近30天</el-radio-button>
          <el-radio-button value="90">近90天</el-radio-button>
          <el-radio-button value="year">本年</el-radio-button>
        </el-radio-group>
        <el-button class="refresh-btn" :loading="loading" icon="Refresh" @click="loadAll">刷新</el-button>
        <el-button class="board-btn" icon="DataAnalysis" @click="$router.push('/hc/board')">完整看板</el-button>
      </div>
    </div>

    <el-alert
      v-if="noPermi"
      title="当前账号未获经营看板权限（hc:board:total / hc:board:store），首页统计暂不展示。"
      type="warning" :closable="false" class="mb8" />

    <template v-else>
      <!-- KPI 卡片 -->
      <div class="kpi-grid">
        <div v-for="c in kpiCards" :key="c.label" class="kpi-card" :class="c.cls">
          <div class="kpi-label">{{ c.label }}</div>
          <div class="kpi-value">{{ c.value }}</div>
          <div class="kpi-sub">{{ c.sub }}</div>
          <span class="kpi-bar"></span>
        </div>
      </div>

      <el-row :gutter="16" class="mt16">
        <el-col :xs="24" :lg="16">
          <div class="panel">
            <div class="panel-header">月度收入与成本（近 12 个月）</div>
            <hc-chart :option="trendOption" height="300px" />
          </div>
        </el-col>
        <el-col :xs="24" :lg="8">
          <div class="panel">
            <div class="panel-header">确认收入构成</div>
            <hc-chart v-if="hasCompose" :option="composeOption" height="300px" />
            <el-empty v-else description="区间内暂无确认收入数据" :image-size="80" />
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="16" class="mt16">
        <el-col :xs="24" :lg="12">
          <div class="panel">
            <div class="panel-header">门店收入排行（前十）</div>
            <hc-chart v-if="hasStoreRank" :option="storeRankOption" height="320px" />
            <el-empty v-else description="区间内暂无门店业绩数据" :image-size="90" />
          </div>
        </el-col>
        <el-col :xs="24" :lg="12">
          <div class="panel">
            <div class="panel-header">经营预警（点击卡片直达对应模块处理）</div>
            <div class="alert-grid">
              <div v-for="a in alertDefs" :key="a.key" class="alert-item"
                :class="{ 'alert-hit': alertVal(a.key) > 0 }" @click="goAlert(a)">
                <div class="alert-value">{{ alertVal(a.key) }}<span class="alert-unit">{{ a.unit }}</span></div>
                <div class="alert-label">{{ a.label }}</div>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </template>
  </div>
</template>

<script setup name="Index">
import { boardTotal, boardStore } from "@/api/hc/board"
import { checkPermi } from "@/utils/permission"
import useUserStore from "@/store/modules/user"
import HcChart from "@/components/HcChart/index.vue"

const { proxy } = getCurrentInstance()
const nickName = computed(() => useUserStore().nickName || useUserStore().name || "管理员")
const canTotal = checkPermi(["hc:board:total"])
const canStore = checkPermi(["hc:board:store"])
const noPermi = computed(() => !canTotal && !canStore)

const loading = ref(false)
const quick = ref("30")
const dateRange = ref([])
const total = ref({})
const storeData = ref({})

// 收入类型无字典（与经营看板口径一致）
const REVENUE_TYPE = { "1": "核销确认", "2": "零售确认", "3": "退款冲减" }
const alertDefs = [
  { key: "stockLow", label: "库存低于安全线", unit: "项", path: "/hc/inventory" },
  { key: "expiry30", label: "30天内效期批次", unit: "批", path: "/hc/stockbill" },
  { key: "cardExpire30", label: "30天内到期卡", unit: "张", path: "/hc/membercard" },
  { key: "couponExpire7", label: "7天内到期券", unit: "张", path: "/hc/couponrecord" },
  { key: "reassessPending", label: "待复评方案", unit: "个", path: "/hc/plan" },
  { key: "upgradePending", label: "待处理升单任务", unit: "单", path: "/hc/upgradetask" },
  { key: "deviceCalibrate", label: "校准临期设备", unit: "台", path: "/hc/device" },
  { key: "reviewPending", label: "待处理评价", unit: "条", path: "/hc/review" },
  { key: "sleepCustomer", label: "沉睡客户(60天+)", unit: "人", path: "/hc/customer" },
  { key: "refundAudit", label: "待审批退款", unit: "单", path: "/hc/refund" }
]

/* ---------------- 时间口径 ---------------- */
function ymd(d) {
  const p = n => String(n).padStart(2, "0")
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate())
}
const todayText = computed(() => {
  const d = new Date()
  const week = ["日", "一", "二", "三", "四", "五", "六"][d.getDay()]
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 星期${week}`
})
const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return "凌晨好"
  if (h < 9) return "早上好"
  if (h < 12) return "上午好"
  if (h < 14) return "中午好"
  if (h < 18) return "下午好"
  return "晚上好"
})
function applyQuick(v) {
  const now = new Date()
  if (v === "year") {
    dateRange.value = [ymd(new Date(now.getFullYear(), 0, 1)), ymd(now)]
  } else if (v) {
    dateRange.value = [ymd(new Date(now.getTime() - (Number(v) - 1) * 86400000)), ymd(now)]
  }
  loadAll()
}
function query() {
  const q = {}
  if (dateRange.value && dateRange.value.length === 2) {
    q.beginTime = dateRange.value[0]
    q.endTime = dateRange.value[1]
  }
  return q
}

/* ---------------- 数据加载 ---------------- */
function loadAll() {
  if (noPermi.value) return
  loading.value = true
  const q = query()
  const jobs = []
  if (canTotal) {
    jobs.push(boardTotal(q).then(r => { total.value = r.data || {} }).catch(() => {}))
  }
  if (canStore) {
    jobs.push(boardStore(q).then(r => { storeData.value = r.data || {} }).catch(() => {}))
  }
  Promise.allSettled(jobs).finally(() => { loading.value = false })
}

/* ---------------- 数值格式 ---------------- */
function num(v) { return v == null ? 0 : Number(v) }
function money(v) { return num(v).toFixed(2) }
function cnt(v) { return String(Math.round(num(v))) }
function pct(v) { return num(v).toFixed(1) + "%" }
function alertVal(key) { return Math.round(num((storeData.value.alerts || {})[key])) }
function sumOf(list, field) { return (list || []).reduce((a, b) => a + num(b[field]), 0) }

function goAlert(a) {
  if (alertVal(a.key) <= 0) return
  proxy.$router.push({ path: a.path }).catch(() => {
    proxy.$modal.msgError("未开通对应模块菜单：" + a.label)
  })
}

/* ---------------- KPI ---------------- */
const kpiCards = computed(() => {
  // 优先总部口径；无总部权限时退回门店口径
  const k = canTotal ? (total.value.kpi || {}) : (storeData.value.kpi || {})
  return [
    { label: "确认收入", value: money(k.confirmRevenue), sub: "项目成本 " + money(k.costAmount), cls: "c1" },
    { label: "毛利 / 毛利率", value: money(k.grossProfit), sub: "毛利率 " + pct(k.grossRate), cls: "c2" },
    { label: "实收（现金流入）", value: money(k.receivedAmount), sub: "收入确认率 " + pct(k.revenueConfirmRate), cls: "c3" },
    { label: "预收余额", value: money(k.prepaidBalance), sub: "未核销负债", cls: "c4" },
    { label: "核销笔数", value: cnt(k.serviceCount), sub: "客单价 " + money(k.arpu), cls: "c5" },
    { label: "新客建档", value: cnt(k.newCustomer), sub: "累计服务客户 " + cnt(k.servedCustomer ?? k.totalCustomer), cls: "c6" },
    { label: "复购率", value: pct(k.repurchaseRate), sub: "复购客户 " + cnt(k.repurchaseCustomer ?? k.activeCustomer) + " 人", cls: "c2" },
    { label: "客户满意度", value: num(k.avgScore).toFixed(1), sub: "评价均分（5分制）", cls: "c3" },
    { label: "效果改善率", value: pct(k.avgImproveRate), sub: "复评对比初评均值", cls: "c6" },
    { label: "退款本金", value: money(k.refundAmount), sub: "提成计提 " + money(k.commissionAmount), cls: "c4" }
  ]
})

/* ---------------- 图表（科技蓝配色） ---------------- */
const AXIS_LABEL = { color: "#9db8dc", fontSize: 12 }
const SPLIT_LINE = { lineStyle: { color: "rgba(120,170,255,.12)" } }

const trendOption = computed(() => {
  const t = total.value.trend || {}
  return {
    tooltip: { trigger: "axis" },
    legend: { data: ["确认收入", "项目成本", "实收"], textStyle: { color: "#c9dcf5" }, top: 4 },
    grid: { left: 66, right: 28, top: 46, bottom: 32 },
    xAxis: { type: "category", data: t.months || [], axisLabel: AXIS_LABEL, axisLine: { lineStyle: { color: "rgba(120,170,255,.3)" } } },
    yAxis: { type: "value", name: "金额(元)", nameTextStyle: { color: "#9db8dc" }, axisLabel: AXIS_LABEL, splitLine: SPLIT_LINE },
    series: [
      { name: "确认收入", type: "bar", barMaxWidth: 20, itemStyle: { color: "#3ba9ff", borderRadius: [4, 4, 0, 0] }, data: t.revenue || [] },
      { name: "项目成本", type: "bar", barMaxWidth: 20, itemStyle: { color: "#2b6cb0", borderRadius: [4, 4, 0, 0] }, data: t.cost || [] },
      { name: "实收", type: "line", smooth: true, symbol: "circle", symbolSize: 6, itemStyle: { color: "#4dd0ff" }, lineStyle: { color: "#4dd0ff", width: 2, shadowColor: "rgba(77,208,255,.6)", shadowBlur: 8 }, data: t.received || [] }
    ]
  }
})

const hasCompose = computed(() => (total.value.compose || []).length > 0)
const composeOption = computed(() => ({
  tooltip: { trigger: "item", formatter: p => p.name + "：" + money(p.value) + " 元（" + p.percent + "%）" },
  legend: { bottom: 0, textStyle: { color: "#c9dcf5" } },
  series: [{
    type: "pie", radius: ["40%", "66%"], center: ["50%", "44%"], avoidLabelOverlap: true,
    label: { color: "#c9dcf5", formatter: "{b}\n{d}%" },
    itemStyle: { borderColor: "rgba(8,18,38,.85)", borderWidth: 2 },
    data: (total.value.compose || []).map((x, i) => ({
      name: REVENUE_TYPE[String(x.type)] || ("类型" + x.type),
      value: num(x.amount),
      itemStyle: { color: ["#3ba9ff", "#4dd0ff", "#f5a623"][i % 3] }
    }))
  }]
}))

const hasStoreRank = computed(() => (total.value.storeRank || []).length > 0)
const storeRankOption = computed(() => {
  const rows = (total.value.storeRank || []).slice(0, 10).reverse()
  return {
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    legend: { data: ["确认收入", "毛利"], textStyle: { color: "#c9dcf5" }, top: 4 },
    grid: { left: 96, right: 28, top: 40, bottom: 28 },
    xAxis: { type: "value", name: "金额(元)", nameTextStyle: { color: "#9db8dc" }, axisLabel: AXIS_LABEL, splitLine: SPLIT_LINE },
    yAxis: { type: "category", data: rows.map(r => r.storeName), axisLabel: AXIS_LABEL, axisLine: { lineStyle: { color: "rgba(120,170,255,.3)" } } },
    series: [
      { name: "确认收入", type: "bar", barMaxWidth: 14, itemStyle: { color: "#3ba9ff", borderRadius: [0, 4, 4, 0] }, data: rows.map(r => num(r.revenue)) },
      { name: "毛利", type: "bar", barMaxWidth: 14, itemStyle: { color: "#4dd0ff", borderRadius: [0, 4, 4, 0] }, data: rows.map(r => num(r.grossProfit)) }
    ]
  }
})

applyQuick(quick.value)
</script>

<style scoped lang="scss">
$accent: #3ba9ff;
$accent2: #4dd0ff;

.dash-home {
  position: relative;
  min-height: calc(100vh - 84px);
  padding: 18px 20px 26px;
  margin: -20px;
  background: linear-gradient(150deg, #050b1a, #0a1c3a 50%, #061325);
  color: #e6f2ff;
  overflow-x: hidden;
}

/* ---------- 背景装饰 ---------- */
.tech-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;

  .grid-layer {
    position: absolute;
    inset: -40px;
    background-image:
      linear-gradient(rgba(59, 169, 255, 0.06) 1px, transparent 1px),
      linear-gradient(90deg, rgba(59, 169, 255, 0.06) 1px, transparent 1px);
    background-size: 42px 42px;
    animation: gridMove 18s linear infinite;
  }

  .glow {
    position: absolute;
    border-radius: 50%;
    filter: blur(90px);
    animation: breathe 7s ease-in-out infinite;
  }
  .glow-a { width: 420px; height: 420px; top: -140px; right: -80px; background: rgba(59, 169, 255, 0.16); }
  .glow-b { width: 360px; height: 360px; bottom: -120px; left: -100px; background: rgba(77, 208, 255, 0.1); animation-delay: 2.5s; }
}
@keyframes gridMove { from { transform: translateY(0); } to { transform: translateY(42px); } }
@keyframes breathe { 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } }

/* ---------- 头部 ---------- */
.dash-header {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;

  .hello h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    letter-spacing: 1px;
    background: linear-gradient(90deg, #e6f2ff, $accent2);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  .date-line {
    margin: 6px 0 0;
    font-size: 13px;
    color: #7f9cc4;
  }

  .tools {
    display: flex;
    align-items: center;
    gap: 10px;
  }
}

:deep(.quick-group) {
  .el-radio-button__inner {
    background: rgba(13, 33, 63, 0.6);
    border-color: rgba(90, 160, 255, 0.3);
    color: #9db8dc;
  }
  .el-radio-button__original-radio:checked + .el-radio-button__inner {
    background: linear-gradient(135deg, $accent2, $accent);
    border-color: $accent;
    color: #041224;
    box-shadow: 0 0 12px rgba(77, 208, 255, 0.4);
  }
}

.refresh-btn,
.board-btn {
  background: rgba(13, 33, 63, 0.6);
  border-color: rgba(90, 160, 255, 0.3);
  color: #c9dcf5;

  &:hover {
    border-color: $accent2;
    color: $accent2;
    background: rgba(20, 46, 84, 0.8);
  }
}

/* ---------- KPI ---------- */
.kpi-grid {
  position: relative;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(196px, 1fr));
  gap: 12px;
}

.kpi-card {
  position: relative;
  padding: 14px 16px 12px;
  border: 1px solid rgba(90, 160, 255, 0.22);
  border-radius: 10px;
  background: rgba(13, 33, 63, 0.55);
  backdrop-filter: blur(10px);
  overflow: hidden;
  transition: transform 0.25s, border-color 0.25s, box-shadow 0.25s;

  &:hover {
    transform: translateY(-3px);
    border-color: rgba(77, 208, 255, 0.55);
    box-shadow: 0 6px 24px rgba(59, 169, 255, 0.18);
  }

  .kpi-label { font-size: 13px; color: #8fb0d8; }
  .kpi-value { margin: 8px 0 4px; font-size: 24px; font-weight: 700; letter-spacing: 0.5px; }
  .kpi-sub { font-size: 12px; color: #6d8bb5; }

  .kpi-bar {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    border-radius: 3px 0 0 3px;
  }
  &.c1 .kpi-value { color: #e6f2ff; }
  &.c1 .kpi-bar { background: linear-gradient(180deg, $accent2, $accent); }
  &.c2 .kpi-value { color: #5ee6a8; }
  &.c2 .kpi-bar { background: linear-gradient(180deg, #5ee6a8, #2b9a6c); }
  &.c3 .kpi-value { color: $accent2; }
  &.c3 .kpi-bar { background: linear-gradient(180deg, $accent2, #1e6fff); }
  &.c4 .kpi-value { color: #f5a623; }
  &.c4 .kpi-bar { background: linear-gradient(180deg, #f5a623, #c07f11); }
  &.c5 .kpi-value { color: #b48bff; }
  &.c5 .kpi-bar { background: linear-gradient(180deg, #b48bff, #7a4de0); }
  &.c6 .kpi-value { color: #6fd6ff; }
  &.c6 .kpi-bar { background: linear-gradient(180deg, #6fd6ff, #2b7fd4); }
}

/* ---------- 面板 ---------- */
.mt16 { margin-top: 16px; }
.mb8 { margin-bottom: 8px; }

.panel {
  height: 100%;
  padding: 14px 16px;
  border: 1px solid rgba(90, 160, 255, 0.22);
  border-radius: 10px;
  background: rgba(13, 33, 63, 0.55);
  backdrop-filter: blur(10px);
  box-shadow: inset 0 0 30px rgba(59, 169, 255, 0.04);

  .panel-header {
    position: relative;
    padding-left: 12px;
    margin-bottom: 10px;
    font-size: 15px;
    font-weight: 600;
    color: #d6e9ff;

    &::before {
      content: "";
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 4px;
      height: 14px;
      border-radius: 2px;
      background: linear-gradient(180deg, $accent2, $accent);
      box-shadow: 0 0 8px rgba(77, 208, 255, 0.7);
    }
  }
}

:deep(.el-empty__description p) { color: #7f9cc4; }
:deep(.el-alert) { position: relative; }

/* ---------- 预警 ---------- */
.alert-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(148px, 1fr));
  gap: 10px;
}

.alert-item {
  padding: 12px 14px;
  border: 1px solid rgba(90, 160, 255, 0.18);
  border-radius: 8px;
  background: rgba(8, 22, 44, 0.6);
  transition: all 0.25s;

  .alert-value {
    font-size: 22px;
    font-weight: 700;
    color: #5f7fa8;

    .alert-unit { font-size: 12px; font-weight: 400; margin-left: 4px; color: #5f7fa8; }
  }
  .alert-label { margin-top: 5px; font-size: 12px; color: #8fb0d8; }

  &.alert-hit {
    cursor: pointer;
    border-color: rgba(255, 120, 130, 0.5);
    background: rgba(80, 20, 34, 0.45);
    box-shadow: 0 0 14px rgba(245, 108, 108, 0.2);

    .alert-value, .alert-unit { color: #ff8f95; }
    .alert-label { color: #ffc9cc; }

    &:hover {
      transform: translateY(-2px);
      border-color: #f56c6c;
    }
  }
}
</style>
