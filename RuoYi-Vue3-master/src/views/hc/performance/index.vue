<template>
  <div class="app-container">
    <el-form :model="queryParams" :inline="true">
      <el-form-item label="门店">
        <el-select v-model="queryParams.storeId" clearable placeholder="全部门店" style="width: 150px">
          <el-option v-for="s in storeOptions" :key="s.storeId" :label="s.storeName" :value="s.storeId" />
        </el-select>
      </el-form-item>
      <el-form-item label="技师">
        <el-select v-model="queryParams.technicianId" clearable filterable placeholder="全部技师" style="width: 150px">
          <el-option v-for="t in techOptions" :key="t.technicianId" :label="t.techName" :value="t.technicianId" />
        </el-select>
      </el-form-item>
      <el-form-item label="统计区间">
        <el-date-picker v-model="dateRange" type="daterange" value-format="YYYY-MM-DD" start-placeholder="开始" end-placeholder="结束" style="width: 250px" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="getList">统计</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row class="mb8">
      <el-alert title="人效 = 核销确认金额 / 出勤天数；复购率 = 服务≥2次客户 / 服务客户数；退费按该技师服务过的客户在区间内的退费归因" type="info" :closable="false" style="width: 720px" />
    </el-row>

    <el-table v-loading="loading" :data="list" show-summary :summary-method="summaryMethod">
      <el-table-column label="技师" prop="technicianName" width="110" fixed="left" />
      <el-table-column label="工号" prop="techNo" width="110" />
      <el-table-column label="门店" prop="storeName" width="120" :show-overflow-tooltip="true" />
      <el-table-column label="服务人次" prop="verifyCount" width="95" align="center" />
      <el-table-column label="服务客户数" prop="customerCount" width="105" align="center" />
      <el-table-column label="确认金额" width="110" align="right">
        <template #default="scope">{{ money(scope.row.confirmAmount) }}</template>
      </el-table-column>
      <el-table-column label="人效" width="110" align="right">
        <template #default="scope">{{ money(scope.row.perCapita) }}</template>
      </el-table-column>
      <el-table-column label="加项数" prop="addonCount" width="90" align="center" />
      <el-table-column label="加项率" width="90" align="center">
        <template #default="scope">{{ percent(scope.row.addonRate) }}</template>
      </el-table-column>
      <el-table-column label="复购客户" prop="repeatCount" width="95" align="center" />
      <el-table-column label="复购率" width="90" align="center">
        <template #default="scope">{{ percent(scope.row.repeatRate) }}</template>
      </el-table-column>
      <el-table-column label="退费单数" prop="refundCount" width="95" align="center" />
      <el-table-column label="退费金额" width="110" align="right">
        <template #default="scope"><span class="danger">{{ money(scope.row.refundAmount) }}</span></template>
      </el-table-column>
      <el-table-column label="提成合计" width="110" align="right">
        <template #default="scope">{{ money(scope.row.commissionAmount) }}</template>
      </el-table-column>
      <el-table-column label="评价数" prop="reviewCount" width="90" align="center" />
      <el-table-column label="差评数" width="90" align="center">
        <template #default="scope"><span class="danger">{{ scope.row.badReviewCount || 0 }}</span></template>
      </el-table-column>
      <el-table-column label="平均评分" width="95" align="center">
        <template #default="scope">{{ scope.row.avgScore == null ? '-' : Number(scope.row.avgScore).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column label="出勤天数" prop="attendanceDays" width="95" align="center" />
      <el-table-column label="在岗工时" width="95" align="center">
        <template #default="scope">{{ hours(scope.row.workHours) }}</template>
      </el-table-column>
    </el-table>
    <el-empty v-if="!loading && list.length === 0" description="所选区间暂无绩效数据" />
  </div>
</template>

<script setup name="Performance">
import { listPerformance } from "@/api/hc/review"
import { listStore, listTechnician } from "@/api/hc/basic"

const list = ref([])
const loading = ref(false)
const storeOptions = ref([])
const techOptions = ref([])
const dateRange = ref([])
const queryParams = ref({ storeId: undefined, technicianId: undefined })

function money(v) { return v == null ? "0.00" : Number(v).toFixed(2) }
function percent(v) { return v == null ? "0.0%" : (Number(v) * 100).toFixed(1) + "%" }
function hours(v) { return v == null ? "0.0" : Number(v).toFixed(1) }

function getList() {
  loading.value = true
  const params = { storeId: queryParams.value.storeId, technicianId: queryParams.value.technicianId }
  if (dateRange.value && dateRange.value.length === 2) {
    params.beginTime = dateRange.value[0]
    params.endTime = dateRange.value[1]
  }
  listPerformance(params).then(r => {
    list.value = r.data || []
    loading.value = false
  }).catch(() => { loading.value = false })
}
function resetQuery() {
  dateRange.value = []
  queryParams.value = { storeId: undefined, technicianId: undefined }
  getList()
}

function summaryMethod({ columns, data }) {
  return columns.map((col, i) => {
    if (i === 0) return "合计"
    if (col.property === "verifyCount") return data.reduce((s, r) => s + (Number(r.verifyCount) || 0), 0)
    if (col.property === "confirmAmount") return money(data.reduce((s, r) => s + (Number(r.confirmAmount) || 0), 0))
    if (col.property === "refundAmount") return money(data.reduce((s, r) => s + (Number(r.refundAmount) || 0), 0))
    if (col.property === "commissionAmount") return money(data.reduce((s, r) => s + (Number(r.commissionAmount) || 0), 0))
    if (col.property === "attendanceDays") return data.reduce((s, r) => s + (Number(r.attendanceDays) || 0), 0)
    return ""
  })
}

listStore({ pageNum: 1, pageSize: 200 }).then(r => storeOptions.value = r.rows)
listTechnician({ pageNum: 1, pageSize: 500, status: "0" }).then(r => techOptions.value = r.rows)
getList()
</script>

<style scoped>
.danger { color: #f56c6c; }
</style>
