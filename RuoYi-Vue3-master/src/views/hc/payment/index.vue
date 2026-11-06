<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true">
      <el-form-item label="流水号" prop="paymentNo">
        <el-input v-model="queryParams.paymentNo" placeholder="请输入流水号" clearable style="width: 180px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="订单号" prop="orderNo">
        <el-input v-model="queryParams.orderNo" placeholder="请输入订单号" clearable style="width: 180px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="渠道" prop="channel">
        <el-select v-model="queryParams.channel" placeholder="支付渠道" clearable style="width: 130px">
          <el-option v-for="c in CHANNELS" :key="c.value" :label="c.label" :value="c.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="状态" clearable style="width: 120px">
          <el-option v-for="s in STATUSES" :key="s.value" :label="s.label" :value="s.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="支付日期">
        <el-date-picker v-model="dateRange" type="daterange" value-format="YYYY-MM-DD" start-placeholder="开始日期" end-placeholder="结束日期" style="width: 240px" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-alert type="info" :closable="false" class="mb8"
      title="口径说明：一笔订单可拆多渠道收款（组合收款），每个渠道一条流水；网关 mock=沙箱即时到账，wechat/alipay 适配器待商户号后切换真实网关。" />

    <el-table v-loading="loading" :data="paymentList">
      <el-table-column label="流水号" prop="paymentNo" width="180" />
      <el-table-column label="订单号" prop="orderNo" width="170" />
      <el-table-column label="客户" prop="customerName" width="90" />
      <el-table-column label="门店" prop="storeName" width="120" :show-overflow-tooltip="true" />
      <el-table-column label="渠道" width="90" align="center">
        <template #default="scope">
          <el-tag size="small" :type="channelTag(scope.row.channel)">{{ channelLabel(scope.row.channel) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="金额" prop="amount" width="100" align="right" :formatter="moneyFmt" />
      <el-table-column label="网关" prop="gateway" width="80" align="center" />
      <el-table-column label="渠道交易号" prop="tradeNo" width="180" :show-overflow-tooltip="true" />
      <el-table-column label="状态" width="80" align="center">
        <template #default="scope">
          <el-tag size="small" :type="statusTag(scope.row.status)">{{ statusLabel(scope.row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="支付时间" prop="payTime" width="160" />
      <el-table-column label="操作" align="center" width="120" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button v-if="scope.row.status === '1'" link type="primary" icon="RefreshLeft"
            @click="handleRefund(scope.row)" v-hasPermi="['hc:payment:refund']">退款</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
  </div>
</template>

<script setup name="Payment">
import { listPayment, refundPayment } from "@/api/hc/payment"

const { proxy } = getCurrentInstance()

const CHANNELS = [
  { value: "wechat", label: "微信" },
  { value: "alipay", label: "支付宝" },
  { value: "cash", label: "现金" },
  { value: "bankcard", label: "银行卡" },
  { value: "balance", label: "余额" },
  { value: "other", label: "其他" }
]
const STATUSES = [
  { value: "0", label: "待支付" },
  { value: "1", label: "成功" },
  { value: "2", label: "失败" },
  { value: "3", label: "已退款" }
]

const paymentList = ref([])
const loading = ref(true)
const total = ref(0)
const dateRange = ref([])

const data = reactive({
  queryParams: { pageNum: 1, pageSize: 10, paymentNo: undefined, orderNo: undefined, channel: undefined, status: undefined }
})
const { queryParams } = toRefs(data)

function channelLabel(v) { return (CHANNELS.find(c => c.value === v) || {}).label || v }
function channelTag(v) { return { wechat: "success", alipay: "primary", cash: "warning", bankcard: "info", balance: "info" }[v] || "info" }
function statusLabel(v) { return (STATUSES.find(s => s.value === v) || {}).label || v }
function statusTag(v) { return { 0: "info", 1: "success", 2: "danger", 3: "warning" }[v] || "info" }
function moneyFmt(row, col, v) { return Number(v || 0).toFixed(2) }

function getList() {
  loading.value = true
  const q = { ...queryParams.value }
  if (dateRange.value && dateRange.value.length === 2) {
    q.params = { beginTime: dateRange.value[0], endTime: dateRange.value[1] }
  }
  listPayment(q).then(res => {
    paymentList.value = res.rows
    total.value = res.total
    loading.value = false
  })
}
function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}
function resetQuery() {
  dateRange.value = []
  proxy.resetForm("queryRef")
  handleQuery()
}
function handleRefund(row) {
  proxy.$modal.confirm('确认对流水 "' + row.paymentNo + '"（' + channelLabel(row.channel) + ' ¥' + Number(row.amount).toFixed(2) + '）发起渠道退款？').then(() => {
    return refundPayment(row.paymentId)
  }).then(() => {
    proxy.$modal.msgSuccess("退款成功")
    getList()
  }).catch(() => {})
}
getList()
</script>
