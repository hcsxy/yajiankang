<template>
  <div class="app-container">
    <el-form :inline="true">
      <el-form-item label="时间范围">
        <el-date-picker v-model="dateRange" type="daterange" value-format="YYYY-MM-DD" start-placeholder="开始" end-placeholder="结束" style="width: 240px" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="loadAll">查询</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="16" class="mb8">
      <el-col :span="5">
        <el-card shadow="hover"><div class="kpi-label">区间实收（现金流入）</div><div class="kpi-value">{{ fmt(summary.receivedAmount) }}</div></el-card>
      </el-col>
      <el-col :span="5">
        <el-card shadow="hover"><div class="kpi-label">预收余额（未核销负债）</div><div class="kpi-value warn">{{ fmt(summary.prepaidBalance) }}</div></el-card>
      </el-col>
      <el-col :span="5">
        <el-card shadow="hover"><div class="kpi-label">区间确认收入（核销本金）</div><div class="kpi-value ok">{{ fmt(summary.confirmRevenue) }}</div></el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover"><div class="kpi-label">累计退款本金</div><div class="kpi-value danger">{{ fmt(summary.refundAmount) }}</div></el-card>
      </el-col>
      <el-col :span="5">
        <el-card shadow="hover"><div class="kpi-label">区间提成计提（含冲减）</div><div class="kpi-value">{{ fmt(summary.commissionAmount) }}</div></el-card>
      </el-col>
    </el-row>

    <el-alert title="口径说明：实收≠收入。售卡收款计入预收负债，仅核销本金部分确认为收入（赠金不确认）；门店/技师维度全量数据仅总部账号可见" type="info" :closable="false" class="mb8" />

    <el-tabs v-model="activeTab">
      <el-tab-pane label="门店业绩" name="store">
        <el-table :data="storeRows" size="small">
          <el-table-column label="门店" prop="dimName" />
          <el-table-column label="实收" prop="receivedAmount" align="right" :formatter="moneyFmt" />
          <el-table-column label="预收余额" prop="prepaidBalance" align="right" :formatter="moneyFmt" />
          <el-table-column label="确认收入" prop="confirmRevenue" align="right" :formatter="moneyFmt" />
          <el-table-column label="提成" prop="commissionAmount" align="right" :formatter="moneyFmt" />
          <el-table-column label="订单数" prop="cnt" align="center" />
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="技师提成" name="tech">
        <el-table :data="techRows" size="small">
          <el-table-column label="技师" prop="dimName" />
          <el-table-column label="提成合计" prop="commissionAmount" align="right" :formatter="moneyFmt" />
          <el-table-column label="笔数" prop="cnt" align="center" />
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="项目收入" name="item">
        <el-table :data="itemRows" size="small">
          <el-table-column label="项目" prop="dimName" />
          <el-table-column label="确认收入" prop="confirmRevenue" align="right" :formatter="moneyFmt" />
          <el-table-column label="核销次数" prop="cnt" align="center" />
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup name="Report">
import { financeSummary, storePerformance, technicianCommission, revenueByItem } from "@/api/hc/report"

const { proxy } = getCurrentInstance()
const dateRange = ref([])
const activeTab = ref("store")
const summary = ref({})
const storeRows = ref([])
const techRows = ref([])
const itemRows = ref([])

function fmt(v) { return v == null ? "0.00" : Number(v).toFixed(2) }
const moneyFmt = (row, col, v) => fmt(v)

function range() {
  return dateRange.value && dateRange.value.length === 2 ? { beginTime: dateRange.value[0], endTime: dateRange.value[1] } : {}
}
function loadAll() {
  const q = range()
  financeSummary(q).then(r => summary.value = r.data || {})
  storePerformance(q).then(r => storeRows.value = r.data || [])
  technicianCommission(q).then(r => techRows.value = r.data || [])
  revenueByItem(q).then(r => itemRows.value = r.data || [])
}
loadAll()
</script>

<style scoped>
.kpi-label { font-size: 13px; color: #909399; margin-bottom: 8px; }
.kpi-value { font-size: 22px; font-weight: 600; }
.kpi-value.ok { color: #67c23a; }
.kpi-value.warn { color: #e6a23c; }
.kpi-value.danger { color: #f56c6c; }
</style>
