<template>
  <div class="app-container">
    <el-form :model="queryParams" :inline="true" v-show="showSearch">
      <el-form-item label="卡ID" prop="cardId">
        <el-input v-model="queryParams.cardId" placeholder="卡ID" clearable style="width: 120px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="客户姓名" prop="customerName">
        <el-input v-model="queryParams.customerName" placeholder="客户姓名" clearable style="width: 150px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="业务类型" prop="bizType">
        <el-select v-model="queryParams.bizType" clearable placeholder="业务类型" style="width: 130px">
          <el-option label="售卡收款" value="1" /><el-option label="核销结转" value="2" /><el-option label="退款" value="3" /><el-option label="调整" value="4" />
        </el-select>
      </el-form-item>
      <el-form-item label="时间范围" prop="dateRange">
        <el-date-picker v-model="dateRange" type="daterange" value-format="YYYY-MM-DD" start-placeholder="开始" end-placeholder="结束" style="width: 240px" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-alert title="售卡收款计入预收（合同负债），核销/退款才结转，全部资金变动留痕" type="info" :closable="false" class="mb8" />

    <el-table v-loading="loading" :data="list">
      <el-table-column label="台账ID" prop="ledgerId" width="80" />
      <el-table-column label="卡ID" prop="cardId" width="80" />
      <el-table-column label="客户" prop="customerName" width="100" />
      <el-table-column label="业务类型" width="100">
        <template #default="scope">
          <el-tag :type="['success', 'warning', 'danger', 'info'][scope.row.bizType - 1]">{{ bizMap[scope.row.bizType] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="关联单据" prop="bizId" width="90" />
      <el-table-column label="本金变动" prop="changeAmount" width="110" align="right" />
      <el-table-column label="赠金变动" prop="giftChange" width="100" align="right" />
      <el-table-column label="变动后余额" prop="balanceAfter" width="110" align="right" />
      <el-table-column label="操作人" prop="createBy" width="100" />
      <el-table-column label="时间" width="160">
        <template #default="scope">{{ parseTime(scope.row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="摘要" prop="remark" :show-overflow-tooltip="true" />
    </el-table>
    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
  </div>
</template>

<script setup name="Ledger">
import { listLedger } from "@/api/hc/ledger"

const { proxy } = getCurrentInstance()
const bizMap = { "1": "售卡收款", "2": "核销结转", "3": "退款", "4": "调整" }
const list = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const dateRange = ref([])
const queryParams = ref({ pageNum: 1, pageSize: 10, cardId: undefined, customerName: undefined, bizType: undefined })

function getList() {
  loading.value = true
  const params = proxy.addDateRange(queryParams.value, dateRange.value)
  listLedger(params).then(response => {
    list.value = response.rows
    total.value = response.total
    loading.value = false
  })
}
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { dateRange.value = []; proxy.resetForm("queryRef"); handleQuery() }
getList()
</script>
