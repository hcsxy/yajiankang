<template>
  <div class="app-container">
    <el-form :model="queryParams" :inline="true" v-show="showSearch">
      <el-form-item label="退款单号" prop="refundNo">
        <el-input v-model="queryParams.refundNo" placeholder="退款单号" clearable style="width: 170px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="客户姓名" prop="customerName">
        <el-input v-model="queryParams.customerName" placeholder="客户姓名" clearable style="width: 150px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="审批状态" prop="auditStatus">
        <el-select v-model="queryParams.auditStatus" clearable placeholder="状态" style="width: 130px">
          <el-option label="待审批" value="0" /><el-option label="已通过" value="1" /><el-option label="已驳回" value="2" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-alert title="退款必须反向冲销：通过后卡余额清零、赠金作废、未结算售卡提成自动冲减" type="warning" :closable="false" class="mb8" />

    <el-table v-loading="loading" :data="list">
      <el-table-column label="退款单号" prop="refundNo" width="170" />
      <el-table-column label="卡号" prop="cardNo" width="160" />
      <el-table-column label="客户" prop="customerName" width="90" />
      <el-table-column label="退还本金" prop="refundPrincipal" width="100" align="right" />
      <el-table-column label="作废赠金" prop="giftCancel" width="100" align="right" />
      <el-table-column label="作废次数" prop="timesCancel" width="90" align="center" />
      <el-table-column label="退款原因" prop="reason" :show-overflow-tooltip="true" />
      <el-table-column label="申请人" prop="createBy" width="90" />
      <el-table-column label="审批状态" width="90" align="center">
        <template #default="scope">
          <el-tag :type="['warning', 'success', 'danger'][Number(scope.row.auditStatus)]">{{ ['待审批', '已通过', '已驳回'][Number(scope.row.auditStatus)] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="审批人" prop="auditor" width="90" />
      <el-table-column label="操作" align="center" width="120" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button v-if="scope.row.auditStatus === '0'" link type="primary" icon="Select" @click="doAudit(scope.row, true)" v-hasPermi="['hc:refund:audit']">通过</el-button>
          <el-button v-if="scope.row.auditStatus === '0'" link type="danger" icon="Close" @click="doAudit(scope.row, false)" v-hasPermi="['hc:refund:audit']">驳回</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
  </div>
</template>

<script setup name="Refund">
import { listRefund, auditRefund } from "@/api/hc/card"

const { proxy } = getCurrentInstance()
const list = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const queryParams = ref({ pageNum: 1, pageSize: 10, refundNo: undefined, customerName: undefined, auditStatus: undefined })

function getList() {
  loading.value = true
  listRefund(queryParams.value).then(response => {
    list.value = response.rows
    total.value = response.total
    loading.value = false
  })
}
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm("queryRef"); handleQuery() }
function doAudit(row, pass) {
  const tip = pass ? '确认通过退款"' + row.refundNo + '"？将清零会员卡并冲减相关提成。' : '确认驳回退款"' + row.refundNo + '"？'
  proxy.$modal.confirm(tip).then(() => auditRefund(row.refundId, pass))
    .then(() => { getList(); proxy.$modal.msgSuccess("操作成功") }).catch(() => {})
}
getList()
</script>
