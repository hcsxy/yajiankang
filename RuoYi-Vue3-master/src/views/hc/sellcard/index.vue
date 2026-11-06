<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="订单号" prop="orderNo">
        <el-input v-model="queryParams.orderNo" placeholder="订单号" clearable style="width: 170px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="客户姓名" prop="customerName">
        <el-input v-model="queryParams.customerName" placeholder="客户姓名" clearable style="width: 140px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="订单类型" prop="orderType">
        <el-select v-model="queryParams.orderType" clearable placeholder="类型" style="width: 130px">
          <el-option label="售卡" value="1" /><el-option label="方案确认" value="2" /><el-option label="单次购买" value="3" /><el-option label="加项" value="4" />
        </el-select>
      </el-form-item>
      <el-form-item label="订单状态" prop="orderStatus">
        <el-select v-model="queryParams.orderStatus" clearable placeholder="状态" style="width: 130px">
          <el-option label="待支付" value="0" /><el-option label="已支付" value="1" /><el-option label="部分核销" value="2" />
          <el-option label="已完成" value="3" /><el-option label="已退款" value="4" /><el-option label="已取消" value="5" />
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

    <el-alert title="售卡开卡请前往「会员卡工作台」执行；售卡收款计入预收负债，不直接确认收入" type="info" :closable="false" class="mb8" />

    <el-table v-loading="loading" :data="list">
      <el-table-column label="订单号" prop="orderNo" width="175" />
      <el-table-column label="类型" width="90" align="center">
        <template #default="scope">
          <el-tag>{{ ['售卡', '方案确认', '单次购买', '加项'][Number(scope.row.orderType) - 1] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="客户" prop="customerName" width="90" />
      <el-table-column label="项目/卡项" prop="itemName" :show-overflow-tooltip="true" />
      <el-table-column label="金额" prop="amount" width="100" align="right" />
      <el-table-column label="赠金" prop="giftAmount" width="90" align="right" />
      <el-table-column label="已核销金额" prop="verifiedAmount" width="100" align="right" />
      <el-table-column label="支付方式" width="90" align="center">
        <template #default="scope">{{ { '1': '现金', '2': '微信', '3': '支付宝', '4': '银行卡' }[scope.row.payMethod] || '-' }}</template>
      </el-table-column>
      <el-table-column label="门店" prop="storeName" width="110" :show-overflow-tooltip="true" />
      <el-table-column label="销售员" prop="saleStaff" width="90" />
      <el-table-column label="状态" width="90" align="center">
        <template #default="scope">
          <el-tag :type="['info', 'success', 'warning', 'success', 'danger', 'info'][Number(scope.row.orderStatus)]">{{ ['待支付', '已支付', '部分核销', '已完成', '已退款', '已取消'][Number(scope.row.orderStatus)] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="下单时间" width="160">
        <template #default="scope">{{ parseTime(scope.row.createTime) }}</template>
      </el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
  </div>
</template>

<script setup name="Sellcard">
import { listOrder } from "@/api/hc/ledger"

const { proxy } = getCurrentInstance()
const list = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const dateRange = ref([])
const queryParams = ref({ pageNum: 1, pageSize: 10, orderNo: undefined, customerName: undefined, orderType: undefined, orderStatus: undefined })

function getList() {
  loading.value = true
  const params = proxy.addDateRange(queryParams.value, dateRange.value)
  listOrder(params).then(response => {
    list.value = response.rows
    total.value = response.total
    loading.value = false
  })
}
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { dateRange.value = []; proxy.resetForm("queryRef"); handleQuery() }
getList()
</script>
