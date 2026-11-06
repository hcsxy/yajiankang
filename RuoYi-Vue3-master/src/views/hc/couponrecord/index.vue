<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="客户姓名" prop="customerName">
        <el-input v-model="queryParams.customerName" placeholder="客户姓名" clearable style="width: 150px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="券名称" prop="name">
        <el-input v-model="queryParams.name" placeholder="券名称" clearable style="width: 150px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="券码" prop="couponCode">
        <el-input v-model="queryParams.couponCode" placeholder="券码" clearable style="width: 180px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" clearable placeholder="状态" style="width: 120px">
          <el-option v-for="d in hc_coupon_record_status" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="list">
      <el-table-column label="记录ID" prop="recordId" width="80" />
      <el-table-column label="券码" prop="couponCode" width="170" />
      <el-table-column label="券名称" prop="name" :show-overflow-tooltip="true" />
      <el-table-column label="客户" prop="customerName" width="100" />
      <el-table-column label="面额" prop="discountAmount" width="80" align="right" />
      <el-table-column label="门槛" prop="minAmount" width="80" align="right" />
      <el-table-column label="有效期至" width="110" align="center">
        <template #default="scope">{{ parseTime(scope.row.expireDate, '{y}-{m}-{d}') }}</template>
      </el-table-column>
      <el-table-column label="状态" width="90" align="center">
        <template #default="scope"><dict-tag :options="hc_coupon_record_status" :value="scope.row.status" /></template>
      </el-table-column>
      <el-table-column label="领取时间" prop="receiveTime" width="150" />
      <el-table-column label="使用时间" width="150">
        <template #default="scope">{{ scope.row.useTime || '-' }}</template>
      </el-table-column>
      <el-table-column label="关联订单" width="90" align="center">
        <template #default="scope">{{ scope.row.orderId || '-' }}</template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="100" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button v-if="scope.row.status === '0'" link type="danger" icon="CircleClose" @click="handleInvalid(scope.row)" v-hasPermi="['hc:couponrecord:invalid']">作废</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
  </div>
</template>

<script setup name="Couponrecord">
import { listCouponRecord, invalidCouponRecord } from "@/api/hc/coupon"

const { proxy } = getCurrentInstance()
const { hc_coupon_record_status } = proxy.useDict("hc_coupon_record_status")
const list = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const queryParams = ref({ pageNum: 1, pageSize: 10, customerName: undefined, name: undefined, couponCode: undefined, status: undefined })

function getList() {
  loading.value = true
  listCouponRecord(queryParams.value).then(response => {
    list.value = response.rows
    total.value = response.total
    loading.value = false
  })
}
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm("queryRef"); handleQuery() }
function handleInvalid(row) {
  proxy.$modal.confirm('确认作废券【' + row.name + '】（' + row.couponCode + '）？').then(() => invalidCouponRecord(row.recordId)).then(() => {
    getList(); proxy.$modal.msgSuccess("已作废")
  }).catch(() => {})
}
getList()
</script>
