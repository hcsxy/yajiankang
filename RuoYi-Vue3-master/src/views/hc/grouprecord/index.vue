<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="活动" prop="activityId">
        <el-select v-model="queryParams.activityId" clearable filterable placeholder="全部活动" style="width: 200px">
          <el-option v-for="a in activityOptions" :key="a.activityId" :label="a.activityName" :value="a.activityId" />
        </el-select>
      </el-form-item>
      <el-form-item label="团号" prop="groupNo">
        <el-input v-model="queryParams.groupNo" placeholder="团号" clearable style="width: 150px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="客户姓名" prop="customerName">
        <el-input v-model="queryParams.customerName" placeholder="客户姓名" clearable style="width: 140px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" clearable placeholder="状态" style="width: 110px">
          <el-option v-for="d in hc_group_status" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="参团时间" style="width: 340px">
        <el-date-picker v-model="dateRange" value-format="YYYY-MM-DD" type="daterange" start-placeholder="开始" end-placeholder="结束" style="width: 240px" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="list">
      <el-table-column label="记录号" prop="recordId" width="80" />
      <el-table-column label="活动" prop="activityName" width="160" show-overflow-tooltip />
      <el-table-column label="团号" prop="groupNo" width="150" />
      <el-table-column label="团长" width="80" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.leaderFlag === '1' ? 'warning' : 'info'">{{ scope.row.leaderFlag === '1' ? '团长' : '团员' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="客户" prop="customerName" width="110" />
      <el-table-column label="手机号" prop="phone" width="130" />
      <el-table-column label="实付金额" prop="payAmount" width="110" align="right" />
      <el-table-column label="状态" width="90" align="center">
        <template #default="scope"><dict-tag :options="hc_group_status" :value="scope.row.status" /></template>
      </el-table-column>
      <el-table-column label="订单ID" prop="orderId" width="90" align="center">
        <template #default="scope">{{ scope.row.orderId || '-' }}</template>
      </el-table-column>
      <el-table-column label="会员卡ID" prop="cardId" width="100" align="center">
        <template #default="scope">{{ scope.row.cardId || '-' }}</template>
      </el-table-column>
      <el-table-column label="参团时间" prop="createTime" width="160" />
      <el-table-column label="操作" align="center" width="110">
        <template #default="scope">
          <el-button v-if="scope.row.status === '0'" link type="danger" icon="Close" @click="handleCancel(scope.row)" v-hasPermi="['hc:grouprecord:cancel']">退团</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
  </div>
</template>

<script setup name="HcGroupRecord">
import { listGroupRecord, cancelGroupJoin, listGroupActivity } from "@/api/hc/growth"

const { proxy } = getCurrentInstance()
const { hc_group_status } = proxy.useDict("hc_group_status")
const list = ref([])
const activityOptions = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const dateRange = ref([])
const queryParams = ref({ pageNum: 1, pageSize: 10, activityId: undefined, groupNo: undefined, customerName: undefined, status: undefined })

function getList() {
  loading.value = true
  const params = proxy.addDateRange({ ...queryParams.value }, dateRange.value)
  listGroupRecord(params).then(response => {
    list.value = response.rows
    total.value = response.total
    loading.value = false
  })
}
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { dateRange.value = []; proxy.resetForm("queryRef"); handleQuery() }
function handleCancel(row) {
  proxy.$modal.confirm("确认让客户" + row.customerName + "退出该团？").then(() => cancelGroupJoin(row.recordId))
    .then(() => { proxy.$modal.msgSuccess("退团成功"); getList() }).catch(() => {})
}

listGroupActivity({ pageNum: 1, pageSize: 200 }).then(r => activityOptions.value = r.rows)
getList()
</script>
