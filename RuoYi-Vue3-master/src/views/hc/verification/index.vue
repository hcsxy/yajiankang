<template>
  <div class="app-container">
    <el-form :model="queryParams" :inline="true" v-show="showSearch">
      <el-form-item label="核销流水号" prop="verifyNo">
        <el-input v-model="queryParams.verifyNo" placeholder="流水号" clearable style="width: 170px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="客户姓名" prop="customerName">
        <el-input v-model="queryParams.customerName" placeholder="客户姓名" clearable style="width: 140px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="时间范围">
        <el-date-picker v-model="dateRange" type="daterange" value-format="YYYY-MM-DD" start-placeholder="开始" end-placeholder="结束" style="width: 240px" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="list">
      <el-table-column label="流水号" prop="verifyNo" width="170" />
      <el-table-column label="客户" prop="customerName" width="90" />
      <el-table-column label="项目" prop="itemName" :show-overflow-tooltip="true" />
      <el-table-column label="核销类型" width="90" align="center">
        <template #default="scope">
          <el-tag :type="['', 'success', 'warning', 'info'][Number(scope.row.verifyType)]">{{ ['', '正常', '加项', '补核销'][Number(scope.row.verifyType)] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="扣次" prop="timesDeduct" width="70" align="center" />
      <el-table-column label="抵扣总额" prop="amountDeduct" width="100" align="right" />
      <el-table-column label="扣本金" prop="principalDeduct" width="90" align="right" />
      <el-table-column label="扣赠金" prop="giftDeduct" width="90" align="right" />
      <el-table-column label="确认收入" prop="confirmAmount" width="100" align="right" />
      <el-table-column label="技师" prop="technicianName" width="90" />
      <el-table-column label="核销门店" prop="storeName" width="110" :show-overflow-tooltip="true" />
      <el-table-column label="状态" width="80" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.status === '1' ? 'success' : 'danger'">{{ scope.row.status === '1' ? '有效' : '已撤销' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="核销时间" width="160">
        <template #default="scope">{{ parseTime(scope.row.verifyTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="90" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button v-if="scope.row.status === '1'" link type="danger" icon="RefreshLeft" @click="handleRevert(scope.row)" v-hasPermi="['hc:verification:revert']">撤销</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
  </div>
</template>

<script setup name="Verification">
import { listVerification } from "@/api/hc/ledger"
import { revertVerify } from "@/api/hc/card"

const { proxy } = getCurrentInstance()
const list = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const dateRange = ref([])
const queryParams = ref({ pageNum: 1, pageSize: 10, verifyNo: undefined, customerName: undefined })

function getList() {
  loading.value = true
  const params = proxy.addDateRange(queryParams.value, dateRange.value)
  listVerification(params).then(response => {
    list.value = response.rows
    total.value = response.total
    loading.value = false
  })
}
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { dateRange.value = []; proxy.resetForm("queryRef"); handleQuery() }
function handleRevert(row) {
  proxy.$modal.prompt('请输入撤销原因（必填，异常处理留痕）').then(function ({ value }) {
    return revertVerify(row.verifyId, value)
  }).then(() => { getList(); proxy.$modal.msgSuccess("已撤销并反向冲销") }).catch(() => {})
}
getList()
</script>
