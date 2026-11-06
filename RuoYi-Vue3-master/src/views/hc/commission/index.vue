<template>
  <div class="app-container">
    <el-form :model="queryParams" :inline="true" v-show="showSearch">
      <el-form-item label="技师姓名" prop="technicianName">
        <el-input v-model="queryParams.technicianName" placeholder="技师姓名" clearable style="width: 150px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="提成类型" prop="commissionType">
        <el-select v-model="queryParams.commissionType" clearable placeholder="类型" style="width: 130px">
          <el-option v-for="d in hc_commission_type" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="结算状态" prop="settleStatus">
        <el-select v-model="queryParams.settleStatus" clearable placeholder="状态" style="width: 130px">
          <el-option label="待结算" value="0" /><el-option label="已结算" value="1" /><el-option label="已冻结" value="2" /><el-option label="已冲减" value="3" />
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

    <el-row class="mb8">
      <el-button type="success" plain icon="Money" :disabled="!selected.length" @click="handleSettle" v-hasPermi="['hc:commission:settle']">批量结算</el-button>
      <span style="margin-left: 10px; color: #909399; line-height: 32px">仅“待结算”可勾选结算；退款/撤销核销会自动生成“已冲减”记录，结算时相抵</span>
    </el-row>

    <el-table v-loading="loading" :data="list" @selection-change="s => selected = s">
      <el-table-column type="selection" width="50" :selectable="r => r.settleStatus === '0'" />
      <el-table-column label="提成ID" prop="commissionId" width="80" />
      <el-table-column label="技师" prop="technicianName" width="100" />
      <el-table-column label="类型" width="100" align="center">
        <template #default="scope"><dict-tag :options="hc_commission_type" :value="scope.row.commissionType" /></template>
      </el-table-column>
      <el-table-column label="计提基数" prop="baseAmount" width="100" align="right" />
      <el-table-column label="比例" width="80" align="right">
        <template #default="scope">{{ scope.row.rate != null ? (scope.row.rate * 100).toFixed(1) + '%' : '-' }}</template>
      </el-table-column>
      <el-table-column label="提成金额" prop="commissionAmount" width="110" align="right" />
      <el-table-column label="结算状态" width="90" align="center">
        <template #default="scope">
          <el-tag :type="['warning', 'success', 'info', 'danger'][Number(scope.row.settleStatus)]">{{ ['待结算', '已结算', '已冻结', '已冲减'][Number(scope.row.settleStatus)] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="结算时间" width="160">
        <template #default="scope">{{ parseTime(scope.row.settleTime) }}</template>
      </el-table-column>
      <el-table-column label="产生时间" width="160">
        <template #default="scope">{{ parseTime(scope.row.createTime) }}</template>
      </el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
  </div>
</template>

<script setup name="Commission">
import { listCommission, settleCommission } from "@/api/hc/ledger"

const { proxy } = getCurrentInstance()
const { hc_commission_type } = proxy.useDict("hc_commission_type")
const list = ref([])
const selected = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const dateRange = ref([])
const queryParams = ref({ pageNum: 1, pageSize: 10, technicianName: undefined, commissionType: undefined, settleStatus: undefined })

function getList() {
  loading.value = true
  const params = proxy.addDateRange(queryParams.value, dateRange.value)
  listCommission(params).then(response => {
    list.value = response.rows
    total.value = response.total
    loading.value = false
  })
}
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { dateRange.value = []; proxy.resetForm("queryRef"); handleQuery() }
function handleSettle() {
  const tip = '确认结算选中的 ' + selected.value.length + ' 条提成？结算后不可重复结算。'
  proxy.$modal.confirm(tip).then(() => settleCommission(selected.value.map(r => r.commissionId)))
    .then(() => { getList(); proxy.$modal.msgSuccess("结算成功") }).catch(() => {})
}
getList()
</script>
