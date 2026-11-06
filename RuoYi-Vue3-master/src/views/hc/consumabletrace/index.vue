<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="门店" prop="storeId">
        <el-select v-model="queryParams.storeId" clearable placeholder="门店" style="width: 150px">
          <el-option v-for="s in stores" :key="s.storeId" :label="s.storeName" :value="s.storeId" />
        </el-select>
      </el-form-item>
      <el-form-item label="耗材编码" prop="productCode">
        <el-input v-model="queryParams.productCode" placeholder="编码" clearable style="width: 140px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="耗材名称" prop="productName">
        <el-input v-model="queryParams.productName" placeholder="名称" clearable style="width: 150px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="批号" prop="batchNo">
        <el-input v-model="queryParams.batchNo" placeholder="批号" clearable style="width: 140px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="客户" prop="customerName">
        <el-input v-model="queryParams.customerName" placeholder="客户姓名" clearable style="width: 130px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="核销单号" prop="verifyId">
        <el-input v-model="queryParams.verifyId" placeholder="verifyId" clearable style="width: 120px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="使用时间" style="width: 340px">
        <el-date-picker v-model="dateRange" value-format="YYYY-MM-DD" type="daterange" range-separator="-" start-placeholder="开始" end-placeholder="结束" style="width: 240px" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-alert type="info" :closable="false" class="mb8"
      title="高值耗材四要素追溯：卡项核销时按 consumableJson 自动扣减库存并生成追溯记录（批号-客户-技师-订单），撤销核销时回补并清除记录。" />

    <el-table v-loading="loading" :data="list">
      <el-table-column label="追溯时间" prop="traceTime" width="160" />
      <el-table-column label="门店" prop="storeName" width="130" show-overflow-tooltip />
      <el-table-column label="耗材编码" prop="productCode" width="120" />
      <el-table-column label="耗材名称" prop="productName" min-width="150" show-overflow-tooltip />
      <el-table-column label="批号" prop="batchNo" width="150">
        <template #default="scope">{{ scope.row.batchNo || '-' }}</template>
      </el-table-column>
      <el-table-column label="客户" prop="customerName" width="110">
        <template #default="scope">{{ scope.row.customerName || '-' }}</template>
      </el-table-column>
      <el-table-column label="技师" prop="technicianName" width="110">
        <template #default="scope">{{ scope.row.technicianName || '-' }}</template>
      </el-table-column>
      <el-table-column label="订单号" prop="orderId" width="100" align="center">
        <template #default="scope">{{ scope.row.orderId || '-' }}</template>
      </el-table-column>
      <el-table-column label="核销号" prop="verifyId" width="100" align="center" />
      <el-table-column label="数量" prop="quantity" width="80" align="right" />
      <el-table-column label="备注" prop="remark" min-width="140" show-overflow-tooltip />
    </el-table>
    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
  </div>
</template>

<script setup name="HcConsumableTrace">
import { listConsumableTrace } from "@/api/hc/inventory"
import { listStore } from "@/api/hc/basic"

const { proxy } = getCurrentInstance()
const list = ref([])
const loading = ref(false)
const showSearch = ref(true)
const total = ref(0)
const dateRange = ref([])
const stores = ref([])
const queryParams = ref({ pageNum: 1, pageSize: 10, storeId: undefined, productCode: undefined, productName: undefined, batchNo: undefined, customerName: undefined, verifyId: undefined })

function getList() {
  loading.value = true
  listConsumableTrace(proxy.addDateRange(queryParams.value, dateRange.value)).then(r => {
    list.value = r.rows
    total.value = r.total
  }).finally(() => loading.value = false)
}
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { dateRange.value = []; proxy.resetForm("queryRef"); handleQuery() }

listStore({ pageNum: 1, pageSize: 200 }).then(r => { stores.value = r.rows || [] })
getList()
</script>
