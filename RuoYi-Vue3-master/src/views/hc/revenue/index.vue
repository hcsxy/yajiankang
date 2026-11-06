<template>
  <div class="app-container">
    <el-form :model="queryParams" :inline="true" v-show="showSearch">
      <el-form-item label="客户姓名" prop="customerName">
        <el-input v-model="queryParams.customerName" placeholder="客户姓名" clearable style="width: 150px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="类型" prop="revenueType">
        <el-select v-model="queryParams.revenueType" clearable placeholder="类型" style="width: 130px">
          <el-option label="核销确认" value="1" /><el-option label="零售确认" value="2" /><el-option label="退款冲减" value="3" />
        </el-select>
      </el-form-item>
      <el-form-item label="时间范围">
        <el-date-picker v-model="dateRange" type="daterange" value-format="YYYY-MM-DD" start-placeholder="开始" end-placeholder="结束" style="width: 240px" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-alert title="仅核销本金部分确认为收入（赠金不确认收入），撤销核销自动红冲" type="info" :closable="false" class="mb8" />

    <el-table v-loading="loading" :data="list">
      <el-table-column label="流水ID" prop="revenueId" width="80" />
      <el-table-column label="关联核销" prop="verifyId" width="90" />
      <el-table-column label="客户" prop="customerName" width="100" />
      <el-table-column label="项目" prop="itemName" :show-overflow-tooltip="true" />
      <el-table-column label="确认收入" prop="revenueAmount" width="110" align="right" />
      <el-table-column label="类型" width="100" align="center">
        <template #default="scope">
          <el-tag>{{ ['核销确认', '零售确认', '退款冲减'][Number(scope.row.revenueType) - 1] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.status === '1' ? 'success' : 'danger'">{{ scope.row.status === '1' ? '有效' : '已冲销' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="售卡门店" prop="storeName" width="110" :show-overflow-tooltip="true" />
      <el-table-column label="确认时间" width="160">
        <template #default="scope">{{ parseTime(scope.row.confirmTime) }}</template>
      </el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
  </div>
</template>

<script setup name="Revenue">
import { listRevenue } from "@/api/hc/ledger"

const { proxy } = getCurrentInstance()
const list = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const dateRange = ref([])
const queryParams = ref({ pageNum: 1, pageSize: 10, customerName: undefined, revenueType: undefined })

function getList() {
  loading.value = true
  const params = proxy.addDateRange(queryParams.value, dateRange.value)
  listRevenue(params).then(response => {
    list.value = response.rows
    total.value = response.total
    loading.value = false
  })
}
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { dateRange.value = []; proxy.resetForm("queryRef"); handleQuery() }
getList()
</script>
