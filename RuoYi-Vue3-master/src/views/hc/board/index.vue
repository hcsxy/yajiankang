<template>
  <div class="app-container">
    <el-alert
      title="口径说明：实收为售卡/零售现金流入，确认收入为核销本金＋零售确认，预收余额是未核销负债；毛利＝确认收入－项目成本。绑定门店的账号仅统计本店数据。"
      type="info" :closable="false" class="mb8" />

    <el-form :inline="true" class="mb8">
      <el-form-item label="时间范围">
        <el-date-picker v-model="dateRange" type="daterange" value-format="YYYY-MM-DD"
          start-placeholder="开始日期" end-placeholder="结束日期" style="width: 240px" @change="quick = ''" />
      </el-form-item>
      <el-form-item>
        <el-radio-group v-model="quick" @change="applyQuick">
          <el-radio-button value="30">近30天</el-radio-button>
          <el-radio-button value="90">近90天</el-radio-button>
          <el-radio-button value="year">本年</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="storeList.length > 1" label="门店">
        <el-select v-model="storeId" clearable placeholder="全部门店" style="width: 170px" @change="reload">
          <el-option v-for="s in storeList" :key="s.storeId" :label="s.storeName" :value="s.storeId" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="reload">查询</el-button>
        <el-button icon="Refresh" @click="reload">刷新</el-button>
      </el-form-item>
    </el-form>

    <el-empty v-if="!canTotal && !canStore && !canFinance" description="当前账号未获经营看板权限" />
    <el-tabs v-else v-model="tab" v-loading="loading" @tab-change="loadTab">
      <!-- ==================== 总部经营板 ==================== -->
      <el-tab-pane v-if="canTotal" label="总部经营板" name="total">
        <div class="kpi-grid">
          <div v-for="c in totalKpis" :key="c.label" class="kpi" :class="c.cls">
            <div class="kpi-label">{{ c.label }}</div>
            <div class="kpi-value">{{ c.value }}</div>
            <div class="kpi-sub">{{ c.sub }}</div>
          </div>
        </div>

        <el-row :gutter="16" class="mt8">
          <el-col :span="16">
            <el-card shadow="never" class="chart-card">
              <template #header>月度收入与成本（近 {{ total.months || 12 }} 个月）</template>
              <hc-chart :option="totalTrendOption" height="300px" />
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="never" class="chart-card">
              <template #header>确认收入构成</template>
              <hc-chart :option="composeOption" height="300px" />
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="16" class="mt8">
          <el-col :span="12">
            <el-card shadow="never" class="chart-card">
              <template #header>门店收入排行（前十）</template>
              <hc-chart :option="storeRankOption" height="320px" />
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card shadow="never" class="chart-card">
              <template #header>渠道获客漏斗（扫码 → 建档 → 首单）</template>
              <hc-chart :option="funnelOption" height="320px" />
            </el-card>
          </el-col>
        </el-row>

        <el-card shadow="never" class="mt8">
          <template #header>门店业绩明细</template>
          <el-table :data="total.storeRank || []" size="small">
            <el-table-column label="门店" prop="storeName" min-width="140" />
            <el-table-column label="类型" width="110"><template #default="s"><dict-tag :options="hc_store_type" :value="s.row.storeType" /></template></el-table-column>
            <el-table-column label="确认收入" prop="revenue" align="right" :formatter="moneyFmt" />
            <el-table-column label="项目成本" prop="cost" align="right" :formatter="moneyFmt" />
            <el-table-column label="毛利" prop="grossProfit" align="right" :formatter="moneyFmt" />
            <el-table-column label="毛利率" align="right" width="90"><template #default="s">{{ pct(s.row.grossRate) }}</template></el-table-column>
            <el-table-column label="实收" prop="received" align="right" :formatter="moneyFmt" />
            <el-table-column label="核销笔数" prop="verifyCount" align="center" width="90" />
            <el-table-column label="客单价" prop="arpu" align="right" :formatter="moneyFmt" />
            <el-table-column label="新客" prop="newCustomer" align="center" width="80" />
            <el-table-column label="预收余额" prop="prepaidBalance" align="right" :formatter="moneyFmt" />
            <el-table-column label="满意度" prop="score" align="center" width="90" />
          </el-table>
        </el-card>

        <el-card shadow="never" class="mt8" v-if="(total.regionRank || []).length">
          <template #header>区域业绩对比（含下级区域门店汇总）</template>
          <el-row :gutter="16">
            <el-col :span="24">
              <hc-chart :option="regionRankOption" height="300px" />
            </el-col>
          </el-row>
          <el-table :data="total.regionRank || []" size="small" class="mt8">
            <el-table-column label="区域" prop="regionName" min-width="140" />
            <el-table-column label="层级" width="90" align="center"><template #default="s">{{ { 1: "大区", 2: "区域", 3: "门店组" }[s.row.regionLevel] || s.row.regionLevel }}</template></el-table-column>
            <el-table-column label="营业门店" prop="storeCount" align="center" width="90" />
            <el-table-column label="确认收入" prop="revenue" align="right" :formatter="moneyFmt" />
            <el-table-column label="实收" prop="received" align="right" :formatter="moneyFmt" />
            <el-table-column label="核销笔数" prop="verifyCount" align="center" width="90" />
            <el-table-column label="客单价" prop="arpu" align="right" :formatter="moneyFmt" />
            <el-table-column label="店均收入" prop="avgStoreRevenue" align="right" :formatter="moneyFmt" />
            <el-table-column label="新客" prop="newCustomer" align="center" width="80" />
            <el-table-column label="分销佣金" prop="distCommission" align="right" :formatter="moneyFmt" />
          </el-table>
        </el-card>

        <el-card shadow="never" class="mt8">
          <template #header>渠道获客明细</template>
          <el-table :data="total.funnel || []" size="small">
            <el-table-column label="渠道" prop="channelName" min-width="150" />
            <el-table-column label="类型" width="110"><template #default="s"><dict-tag :options="hc_channel_type" :value="s.row.channelType" /></template></el-table-column>
            <el-table-column label="扫码访问" prop="visitCount" align="center" width="90" />
            <el-table-column label="建档新客" prop="newCount" align="center" width="90" />
            <el-table-column label="首单笔数" prop="firstOrderCount" align="center" width="90" />
            <el-table-column label="首单金额" prop="firstOrderAmount" align="right" :formatter="moneyFmt" />
            <el-table-column label="投放成本" prop="costAmount" align="right" :formatter="moneyFmt" />
            <el-table-column label="建档率" align="right" width="90"><template #default="s">{{ pct(s.row.visitRate) }}</template></el-table-column>
            <el-table-column label="首单转化率" align="right" width="110"><template #default="s">{{ pct(s.row.orderRate) }}</template></el-table-column>
            <el-table-column label="获客成本/人" prop="cac" align="right" :formatter="moneyFmt" />
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- ==================== 门店运营板 ==================== -->
      <el-tab-pane v-if="canStore" label="门店运营板" name="store">
        <div class="kpi-grid">
          <div v-for="c in storeKpis" :key="c.label" class="kpi" :class="c.cls">
            <div class="kpi-label">{{ c.label }}</div>
            <div class="kpi-value">{{ c.value }}</div>
            <div class="kpi-sub">{{ c.sub }}</div>
          </div>
        </div>

        <el-row :gutter="16" class="mt8">
          <el-col :span="16">
            <el-card shadow="never" class="chart-card">
              <template #header>近 {{ storeData.days || 30 }} 日核销趋势</template>
              <hc-chart :option="dayTrendOption" height="300px" />
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="never" class="chart-card">
              <template #header>效果雷达（复评对比初评均分，分值越高症状越重）</template>
              <hc-radar v-if="radarPair > 0" :names="radarNames" :series="radarSeries" height="300px" />
              <el-empty v-else description="区间内尚无「初评+复评」配对样本" :image-size="80" />
            </el-card>
          </el-col>
        </el-row>

        <el-card shadow="never" class="mt8">
          <template #header>经营预警（点击卡片直达对应模块处理）</template>
          <div class="alert-grid">
            <div v-for="a in alertDefs" :key="a.key" class="alert-item" :class="{ 'alert-hit': alertVal(a.key) > 0 }" @click="goAlert(a)">
              <div class="alert-value">{{ alertVal(a.key) }}<span class="alert-unit">{{ a.unit }}</span></div>
              <div class="alert-label">{{ a.label }}</div>
            </div>
          </div>
        </el-card>

        <el-row :gutter="16" class="mt8">
          <el-col :span="14">
            <el-card shadow="never" class="chart-card">
              <template #header>技师人效（确认收入 / 提成）</template>
              <hc-chart :option="techOption" height="320px" />
            </el-card>
          </el-col>
          <el-col :span="10">
            <el-card shadow="never" class="chart-card">
              <template #header>设备使用（次数 / 时长）</template>
              <hc-chart :option="deviceOption" height="320px" />
            </el-card>
          </el-col>
        </el-row>

        <el-card shadow="never" class="mt8">
          <template #header>技师绩效明细</template>
          <el-table :data="storeData.technician || []" size="small">
            <el-table-column label="技师" prop="techName" min-width="120" />
            <el-table-column label="核销笔数" prop="verifyCount" align="center" width="100" />
            <el-table-column label="确认收入" prop="revenue" align="right" :formatter="moneyFmt" />
            <el-table-column label="单均产出" prop="avgRevenue" align="right" :formatter="moneyFmt" />
            <el-table-column label="提成" prop="commission" align="right" :formatter="moneyFmt" />
            <el-table-column label="满意度" prop="score" align="center" width="100" />
          </el-table>
        </el-card>

        <el-card shadow="never" class="mt8">
          <template #header>设备使用明细</template>
          <el-table :data="storeData.device || []" size="small">
            <el-table-column label="设备" prop="deviceName" min-width="150" />
            <el-table-column label="编码" prop="deviceCode" width="140" />
            <el-table-column label="类型" width="110"><template #default="s"><dict-tag :options="hc_device_type" :value="s.row.deviceType" /></template></el-table-column>
            <el-table-column label="使用次数" prop="useCount" align="center" width="100" />
            <el-table-column label="使用时长(分钟)" prop="durationMin" align="right" width="140" />
            <el-table-column label="计费金额" prop="amount" align="right" :formatter="moneyFmt" />
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- ==================== 财务资金板 ==================== -->
      <el-tab-pane v-if="canFinance" label="财务资金板" name="finance">
        <div class="kpi-grid">
          <div v-for="c in financeKpis" :key="c.label" class="kpi" :class="c.cls">
            <div class="kpi-label">{{ c.label }}</div>
            <div class="kpi-value">{{ c.value }}</div>
            <div class="kpi-sub">{{ c.sub }}</div>
          </div>
        </div>

        <el-card shadow="never" class="mt8">
          <template #header>月度资金流（近 {{ finance.months || 12 }} 个月）</template>
          <hc-chart :option="cashflowOption" height="340px" />
        </el-card>

        <el-row :gutter="16" class="mt8">
          <el-col :span="8">
            <el-card shadow="never" class="chart-card">
              <template #header>分账单状态（金额）</template>
              <hc-chart :option="splitPieOption" height="280px" />
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="never" class="chart-card">
              <template #header>结算单状态（金额）</template>
              <hc-chart :option="settlePieOption" height="280px" />
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="never" class="chart-card">
              <template #header>开票状态（金额）</template>
              <hc-chart :option="invoicePieOption" height="280px" />
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="16" class="mt8">
          <el-col :span="12">
            <el-card shadow="never">
              <template #header>分账与结算进度</template>
              <el-table :data="finance.splitStatus || []" size="small">
                <el-table-column label="分账状态" width="130"><template #default="s"><dict-tag :options="hc_split_status" :value="s.row.status" /></template></el-table-column>
                <el-table-column label="笔数" prop="cnt" align="center" width="90" />
                <el-table-column label="分账金额" prop="amount" align="right" :formatter="moneyFmt" />
              </el-table>
              <el-table :data="finance.settleStatus || []" size="small" class="mt8">
                <el-table-column label="结算状态" width="130"><template #default="s"><dict-tag :options="hc_settle_status" :value="s.row.status" /></template></el-table-column>
                <el-table-column label="笔数" prop="cnt" align="center" width="90" />
                <el-table-column label="结算金额" prop="amount" align="right" :formatter="moneyFmt" />
              </el-table>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card shadow="never">
              <template #header>开票结构与对账差异</template>
              <el-table :data="finance.invoiceStatus || []" size="small">
                <el-table-column label="开票状态" width="120"><template #default="s"><dict-tag :options="hc_invoice_status" :value="s.row.status" /></template></el-table-column>
                <el-table-column label="笔数" prop="cnt" align="center" width="80" />
                <el-table-column label="票面金额" prop="amount" align="right" :formatter="moneyFmt" />
                <el-table-column label="税额" prop="tax" align="right" :formatter="moneyFmt" />
              </el-table>
              <el-table :data="finance.reconcile || []" size="small" class="mt8">
                <el-table-column label="对账批次" prop="batchNo" width="150" />
                <el-table-column label="渠道" width="90"><template #default="s"><dict-tag :options="hc_pay_channel" :value="s.row.channel" /></template></el-table-column>
                <el-table-column label="账单日" prop="billDate" width="110" />
                <el-table-column label="总笔数" prop="totalCount" align="center" width="80" />
                <el-table-column label="差异" prop="diffCount" align="center" width="70" />
                <el-table-column label="差异金额" prop="diffAmount" align="right" :formatter="moneyFmt" />
                <el-table-column label="状态" width="90"><template #default="s"><dict-tag :options="hc_reconcile_status" :value="s.row.reconcileStatus" /></template></el-table-column>
              </el-table>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup name="Board">
import { boardTotal, boardStore, boardFinance } from "@/api/hc/board"
import { listStore } from "@/api/hc/basic"
import { checkPermi } from "@/utils/permission"
import HcChart from "@/components/HcChart/index.vue"
import HcRadar from "@/components/HcRadar/index.vue"

const { proxy } = getCurrentInstance()
const { hc_store_type, hc_channel_type, hc_device_type, hc_split_status, hc_settle_status, hc_invoice_status, hc_pay_channel, hc_reconcile_status } =
  proxy.useDict("hc_store_type", "hc_channel_type", "hc_device_type", "hc_split_status", "hc_settle_status", "hc_invoice_status", "hc_pay_channel", "hc_reconcile_status")

const canTotal = checkPermi(["hc:board:total"])
const canStore = checkPermi(["hc:board:store"])
const canFinance = checkPermi(["hc:board:finance"])
const tab = ref(canTotal ? "total" : (canStore ? "store" : "finance"))
const loading = ref(false)
const quick = ref("30")
const dateRange = ref([])
const storeId = ref(undefined)
const storeList = ref([])
const total = ref({})
const storeData = ref({})
const finance = ref({})
const loaded = { total: false, store: false, finance: false }

// 收入类型无字典（hc_revenue 字段注释口径），固定映射
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

function ymd(d) {
  const p = n => String(n).padStart(2, "0")
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate())
}
function num(v) { return v == null ? 0 : Number(v) }
function money(v) { return num(v).toFixed(2) }
function cnt(v) { return String(Math.round(num(v))) }
function pct(v) { return num(v).toFixed(1) + "%" }
const moneyFmt = (row, col, v) => money(v)
function alertVal(key) { return Math.round(num((storeData.value.alerts || {})[key])) }
function sumOf(list, field) { return (list || []).reduce((a, b) => a + num(b[field]), 0) }
function dictLabel(dict, val, fallback) {
  // useDict 返回的是 ref 数组，图表配置里需先取 .value
  const arr = Array.isArray(dict) ? dict : ((dict && dict.value) || [])
  const it = arr.find(d => String(d.value) === String(val))
  return it ? it.label : (fallback || (val == null || val === "" ? "-" : String(val)))
}

function applyQuick(v) {
  const now = new Date()
  if (v === "year") {
    dateRange.value = [ymd(new Date(now.getFullYear(), 0, 1)), ymd(now)]
  } else if (v) {
    dateRange.value = [ymd(new Date(now.getTime() - (Number(v) - 1) * 86400000)), ymd(now)]
  }
  reload()
}

function query() {
  const q = {}
  if (dateRange.value && dateRange.value.length === 2) {
    q.beginTime = dateRange.value[0]
    q.endTime = dateRange.value[1]
  }
  if (storeId.value) q.storeId = storeId.value
  return q
}

function reload() {
  loaded.total = loaded.store = loaded.finance = false
  loadTab()
}

function loadTab(name) {
  const t = name || tab.value
  if (!t || loaded[t]) return
  loaded[t] = true
  loading.value = true
  const q = query()
  const req = t === "total" ? boardTotal(q) : (t === "store" ? boardStore(q) : boardFinance(q))
  req.then(r => {
    const d = r.data || {}
    if (t === "total") total.value = d
    else if (t === "store") storeData.value = d
    else finance.value = d
  }).catch(() => {
    loaded[t] = false
  }).finally(() => {
    loading.value = false
  })
}

function goAlert(a) {
  if (alertVal(a.key) <= 0) return
  proxy.$router.push({ path: a.path }).catch(() => {
    proxy.$modal.msgError("未开通对应模块菜单：" + a.label)
  })
}

/* ---------------- 总部板 ---------------- */
const totalKpis = computed(() => {
  const k = total.value.kpi || {}
  return [
    { label: "确认收入", value: money(k.confirmRevenue), sub: "项目成本 " + money(k.costAmount) },
    { label: "毛利 / 毛利率", value: money(k.grossProfit), sub: "毛利率 " + pct(k.grossRate), cls: "ok" },
    { label: "实收（现金流入）", value: money(k.receivedAmount), sub: "收入确认率 " + pct(k.revenueConfirmRate) },
    { label: "预收余额", value: money(k.prepaidBalance), sub: "未核销负债", cls: "warn" },
    { label: "新客建档", value: cnt(k.newCustomer), sub: "累计服务客户 " + cnt(k.servedCustomer) },
    { label: "复购率", value: pct(k.repurchaseRate), sub: "复购客户 " + cnt(k.repurchaseCustomer) + " 人" },
    { label: "核销笔数", value: cnt(k.serviceCount), sub: "客单价 " + money(k.arpu) },
    { label: "效果改善率", value: pct(k.avgImproveRate), sub: "复评对比初评均值", cls: "ok" },
    { label: "客户满意度", value: num(k.avgScore).toFixed(1), sub: "评价均分（5分制）" },
    { label: "退款本金", value: money(k.refundAmount), sub: "提成计提 " + money(k.commissionAmount), cls: "danger" }
  ]
})

const totalTrendOption = computed(() => {
  const t = total.value.trend || {}
  return {
    tooltip: { trigger: "axis" },
    legend: { data: ["确认收入", "项目成本", "实收"] },
    grid: { left: 62, right: 28, top: 46, bottom: 32 },
    xAxis: { type: "category", data: t.months || [] },
    yAxis: { type: "value", name: "金额(元)" },
    series: [
      { name: "确认收入", type: "bar", barMaxWidth: 20, itemStyle: { color: "#409eff" }, data: t.revenue || [] },
      { name: "项目成本", type: "bar", barMaxWidth: 20, itemStyle: { color: "#e6a23c" }, data: t.cost || [] },
      { name: "实收", type: "line", smooth: true, itemStyle: { color: "#67c23a" }, data: t.received || [] }
    ]
  }
})

const composeOption = computed(() => ({
  tooltip: { trigger: "item", formatter: p => p.name + "：" + money(p.value) + " 元（" + p.percent + "%）" },
  legend: { bottom: 0 },
  series: [{
    type: "pie", radius: ["40%", "66%"], center: ["50%", "44%"], avoidLabelOverlap: true,
    label: { formatter: "{b}\n{d}%" },
    data: (total.value.compose || []).map(x => ({ name: REVENUE_TYPE[String(x.type)] || ("类型" + x.type), value: num(x.amount) }))
  }]
}))

const storeRankOption = computed(() => {
  const rows = (total.value.storeRank || []).slice(0, 10).reverse()
  return {
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    legend: { data: ["确认收入", "毛利"] },
    grid: { left: 96, right: 28, top: 40, bottom: 28 },
    xAxis: { type: "value", name: "金额(元)" },
    yAxis: { type: "category", data: rows.map(r => r.storeName) },
    series: [
      { name: "确认收入", type: "bar", barMaxWidth: 14, itemStyle: { color: "#409eff" }, data: rows.map(r => num(r.revenue)) },
      { name: "毛利", type: "bar", barMaxWidth: 14, itemStyle: { color: "#67c23a" }, data: rows.map(r => num(r.grossProfit)) }
    ]
  }
})

// M8 区域业绩对比（确认收入 / 店均收入 / 分销佣金）
const regionRankOption = computed(() => {
  const rows = (total.value.regionRank || []).slice(0, 12)
  return {
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    legend: { data: ["确认收入", "店均收入", "分销佣金"] },
    grid: { left: 60, right: 28, top: 40, bottom: 44 },
    xAxis: { type: "category", data: rows.map(r => r.regionName), axisLabel: { interval: 0, rotate: rows.length > 6 ? 30 : 0 } },
    yAxis: { type: "value", name: "金额(元)" },
    series: [
      { name: "确认收入", type: "bar", barMaxWidth: 22, itemStyle: { color: "#409eff" }, data: rows.map(r => num(r.revenue)) },
      { name: "店均收入", type: "bar", barMaxWidth: 22, itemStyle: { color: "#67c23a" }, data: rows.map(r => num(r.avgStoreRevenue)) },
      { name: "分销佣金", type: "bar", barMaxWidth: 22, itemStyle: { color: "#e6a23c" }, data: rows.map(r => num(r.distCommission)) }
    ]
  }
})

const funnelOption = computed(() => {
  const rows = total.value.funnel || []
  return {
    tooltip: { trigger: "item", formatter: p => p.name + "：" + cnt(p.value) },
    legend: { bottom: 0 },
    series: [{
      type: "funnel", sort: "none", left: "8%", width: "84%", top: 20, bottom: 40, minSize: "22%", gap: 4,
      label: { formatter: "{b}：{c}", position: "inside" },
      data: [
        { name: "扫码访问", value: sumOf(rows, "visitCount"), itemStyle: { color: "#409eff" } },
        { name: "建档新客", value: sumOf(rows, "newCount"), itemStyle: { color: "#e6a23c" } },
        { name: "首单转化", value: sumOf(rows, "firstOrderCount"), itemStyle: { color: "#67c23a" } }
      ]
    }]
  }
})

/* ---------------- 门店板 ---------------- */
const storeKpis = computed(() => {
  const k = storeData.value.kpi || {}
  return [
    { label: "确认收入", value: money(k.confirmRevenue), sub: "毛利 " + money(k.grossProfit) + "（" + pct(k.grossRate) + "）" },
    { label: "实收（现金流入）", value: money(k.receivedAmount), sub: "预收余额 " + money(k.prepaidBalance), cls: "warn" },
    { label: "核销笔数", value: cnt(k.serviceCount), sub: "客单价 " + money(k.arpu) },
    { label: "活跃客户", value: cnt(k.activeCustomer), sub: "在册客户 " + cnt(k.totalCustomer) },
    { label: "新客建档", value: cnt(k.newCustomer), sub: "复购率 " + pct(k.repurchaseRate) },
    { label: "沉睡客户", value: cnt(k.sleepCustomer), sub: "沉睡率 " + pct(k.sleepRate), cls: "danger" },
    { label: "预约到店率", value: pct(k.arriveRate), sub: "预约 " + cnt(k.appointCount) + " / 到店 " + cnt(k.arriveCount) },
    { label: "效果改善率", value: pct(k.avgImproveRate), sub: "复评对比初评均值", cls: "ok" },
    { label: "客户满意度", value: num(k.avgScore).toFixed(1), sub: "评价均分（5分制）" },
    { label: "退款本金", value: money(k.refundAmount), sub: "提成计提 " + money(k.commissionAmount), cls: "danger" }
  ]
})

const dayTrendOption = computed(() => {
  const t = storeData.value.trend || {}
  return {
    tooltip: { trigger: "axis" },
    legend: { data: ["核销笔数", "确认金额"] },
    grid: { left: 56, right: 56, top: 46, bottom: 46 },
    dataZoom: [{ type: "inside" }],
    xAxis: { type: "category", data: t.days || [] },
    yAxis: [
      { type: "value", name: "笔数" },
      { type: "value", name: "金额(元)", splitLine: { show: false } }
    ],
    series: [
      { name: "核销笔数", type: "bar", barMaxWidth: 14, itemStyle: { color: "#409eff" }, data: t.cnt || [] },
      { name: "确认金额", type: "line", yAxisIndex: 1, smooth: true, itemStyle: { color: "#67c23a" }, data: t.amount || [] }
    ]
  }
})

const radarNames = computed(() => (storeData.value.radar || {}).names || [])
const radarPair = computed(() => num((storeData.value.radar || {}).pairCount))
const radarSeries = computed(() => {
  const r = storeData.value.radar || {}
  return [
    { name: "初评均分", data: (r.initial || []).map(x => num(x)) },
    { name: "复评均分", data: (r.latest || []).map(x => num(x)) }
  ]
})

const techOption = computed(() => {
  const rows = storeData.value.technician || []
  return {
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    legend: { data: ["确认收入", "提成"] },
    grid: { left: 62, right: 28, top: 40, bottom: 48 },
    xAxis: { type: "category", data: rows.map(r => r.techName), axisLabel: { interval: 0, rotate: 30 } },
    yAxis: { type: "value", name: "金额(元)" },
    series: [
      { name: "确认收入", type: "bar", barMaxWidth: 18, itemStyle: { color: "#409eff" }, data: rows.map(r => num(r.revenue)) },
      { name: "提成", type: "bar", barMaxWidth: 18, itemStyle: { color: "#e6a23c" }, data: rows.map(r => num(r.commission)) }
    ]
  }
})

const deviceOption = computed(() => {
  const rows = storeData.value.device || []
  return {
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    legend: { data: ["使用次数", "使用时长"] },
    grid: { left: 52, right: 56, top: 40, bottom: 48 },
    xAxis: { type: "category", data: rows.map(r => r.deviceName), axisLabel: { interval: 0, rotate: 30 } },
    yAxis: [
      { type: "value", name: "次数" },
      { type: "value", name: "分钟", splitLine: { show: false } }
    ],
    series: [
      { name: "使用次数", type: "bar", barMaxWidth: 18, itemStyle: { color: "#409eff" }, data: rows.map(r => num(r.useCount)) },
      { name: "使用时长", type: "line", yAxisIndex: 1, smooth: true, itemStyle: { color: "#f56c6c" }, data: rows.map(r => num(r.durationMin)) }
    ]
  }
})

/* ---------------- 财务板 ---------------- */
const financeKpis = computed(() => {
  const k = finance.value.kpi || {}
  return [
    { label: "实收（现金流入）", value: money(k.receivedAmount), sub: "确认收入 " + money(k.confirmRevenue) },
    { label: "收入确认率", value: pct(k.revenueConfirmRate), sub: "毛利 " + money(k.grossProfit) + "（" + pct(k.grossRate) + "）", cls: "ok" },
    { label: "预收余额", value: money(k.prepaidBalance), sub: "剩余本金 " + money(k.remainPrincipal), cls: "warn" },
    { label: "退款本金", value: money(k.refundAmount), sub: "采购成本 " + money(k.purchaseAmount), cls: "danger" },
    { label: "提成计提", value: money(k.commissionAmount), sub: "分账基数 " + money(k.splitTotal) },
    { label: "分账已结算", value: money(k.splitSettled), sub: "结算率 " + pct(k.splitSettleRate) },
    { label: "分账待结算", value: money(k.splitPendingAmount), sub: "待结算单 " + cnt(k.splitPendingCount) + " 笔", cls: "warn" },
    { label: "已确认结算额", value: money(k.settleAmount), sub: "待确认结算 " + money(k.settlePendingAmount) },
    { label: "开票净额", value: money(k.invoiceNetAmount), sub: "销项税额 " + money(k.invoiceTaxAmount) },
    { label: "待开票金额", value: money(k.invoicePendingAmount), sub: "待开申请 " + cnt(k.invoicePendingCount) + " 笔", cls: "warn" },
    { label: "红冲发票", value: money(k.invoiceRedAmount), sub: "负数票合计", cls: "danger" },
    { label: "未处理对账差异", value: cnt(k.reconcileDiffCount), sub: "差异金额 " + money(k.reconcileDiffAmount), cls: "danger" }
  ]
})

const cashflowOption = computed(() => {
  const c = finance.value.cashflow || {}
  return {
    tooltip: { trigger: "axis" },
    legend: { data: ["实收", "确认收入", "退款", "提成", "采购成本", "分账结算"], type: "scroll" },
    grid: { left: 62, right: 28, top: 46, bottom: 34 },
    xAxis: { type: "category", data: c.months || [] },
    yAxis: { type: "value", name: "金额(元)" },
    series: [
      { name: "实收", type: "bar", barMaxWidth: 18, itemStyle: { color: "#409eff" }, data: c.received || [] },
      { name: "确认收入", type: "bar", barMaxWidth: 18, itemStyle: { color: "#67c23a" }, data: c.revenue || [] },
      { name: "退款", type: "line", smooth: true, itemStyle: { color: "#f56c6c" }, data: c.refund || [] },
      { name: "提成", type: "line", smooth: true, itemStyle: { color: "#e6a23c" }, data: c.commission || [] },
      { name: "采购成本", type: "line", smooth: true, itemStyle: { color: "#909399" }, data: c.purchase || [] },
      { name: "分账结算", type: "line", smooth: true, itemStyle: { color: "#a5673f" }, data: c.settle || [] }
    ]
  }
})

function pieOption(rows, dict, color) {
  return {
    tooltip: { trigger: "item", formatter: p => p.name + "：" + money(p.value) + " 元（" + p.percent + "%）" },
    legend: { bottom: 0, type: "scroll" },
    series: [{
      type: "pie", radius: ["38%", "64%"], center: ["50%", "42%"], label: { formatter: "{b}\n{d}%" },
      data: (rows || []).map(x => ({ name: dictLabel(dict, x.status), value: num(x.amount), itemStyle: { color } }))
    }]
  }
}
const splitPieOption = computed(() => pieOption(finance.value.splitStatus, hc_split_status, "#409eff"))
const settlePieOption = computed(() => pieOption(finance.value.settleStatus, hc_settle_status, "#67c23a"))
const invoicePieOption = computed(() => pieOption(finance.value.invoiceStatus, hc_invoice_status, "#e6a23c"))

listStore({ pageNum: 1, pageSize: 50 }).then(r => {
  storeList.value = r.rows || []
}).catch(() => {
  storeList.value = []
})
applyQuick(quick.value)
</script>

<style scoped>
.mt8 { margin-top: 8px; }
.kpi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 12px; }
.kpi { background: #fff; border: 1px solid #ebeef5; border-radius: 6px; padding: 12px 14px; }
.kpi-label { font-size: 13px; color: #909399; margin-bottom: 6px; }
.kpi-value { font-size: 21px; font-weight: 600; color: #303133; }
.kpi-sub { font-size: 12px; color: #a8abb2; margin-top: 4px; }
.kpi.ok .kpi-value { color: #67c23a; }
.kpi.warn .kpi-value { color: #e6a23c; }
.kpi.danger .kpi-value { color: #f56c6c; }
.chart-card { height: 100%; }
.alert-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
.alert-item { border: 1px solid #ebeef5; border-radius: 6px; padding: 10px 12px; cursor: default; }
.alert-item.alert-hit { border-color: #fbc4c4; background: #fef0f0; cursor: pointer; }
.alert-value { font-size: 20px; font-weight: 600; color: #909399; }
.alert-item.alert-hit .alert-value { color: #f56c6c; }
.alert-unit { font-size: 12px; font-weight: 400; margin-left: 4px; color: #909399; }
.alert-label { font-size: 12px; color: #606266; margin-top: 4px; }
</style>
