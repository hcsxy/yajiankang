<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="渠道名称" prop="channelName">
        <el-input v-model="queryParams.channelName" placeholder="渠道名称" clearable style="width: 150px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="渠道类型" prop="channelType">
        <el-select v-model="queryParams.channelType" clearable placeholder="类型" style="width: 130px">
          <el-option v-for="d in hc_channel_type" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="统计时间" style="width: 340px">
        <el-date-picker v-model="dateRange" value-format="YYYY-MM-DD" type="daterange" start-placeholder="开始" end-placeholder="结束" style="width: 240px" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="list">
      <el-table-column label="渠道编码" prop="channelCode" width="120" />
      <el-table-column label="渠道名称" prop="channelName" width="140" show-overflow-tooltip />
      <el-table-column label="类型" width="110" align="center">
        <template #default="scope"><dict-tag :options="hc_channel_type" :value="scope.row.channelType" /></template>
      </el-table-column>
      <el-table-column label="门店" prop="storeName" width="120">
        <template #default="scope">{{ scope.row.storeName || '总部通用' }}</template>
      </el-table-column>
      <el-table-column label="渠道成本" prop="costAmount" width="100" align="right" />
      <el-table-column label="扫码访问" prop="visitCount" width="90" align="right" />
      <el-table-column label="新客数" prop="newCount" width="80" align="right" />
      <el-table-column label="首单数" prop="firstOrderCount" width="80" align="right" />
      <el-table-column label="首单金额" prop="firstOrderAmount" width="100" align="right" />
      <el-table-column label="获客成本" prop="costPerNew" width="100" align="right" />
      <el-table-column label="转化率" width="100" align="right">
        <template #default="scope">{{ scope.row.convertRate }}%</template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="110">
        <template #default="scope">
          <el-button link type="primary" icon="View" @click="openDetail(scope.row)">转化明细</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog title="渠道转化明细" v-model="detailOpen" width="900px" append-to-body>
      <div style="margin-bottom: 8px">渠道：{{ detailChannel.channelName }}（{{ detailChannel.channelCode }}）</div>
      <el-table v-loading="detailLoading" :data="detailList">
        <el-table-column label="类型" width="110" align="center">
          <template #default="scope">
            <el-tag :type="visitTagType(scope.row.visitType)">{{ visitTypeName(scope.row.visitType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="客户" prop="customerName" width="120">
          <template #default="scope">{{ scope.row.customerName || '-' }}</template>
        </el-table-column>
        <el-table-column label="首单金额" prop="amount" width="110" align="right">
          <template #default="scope">{{ scope.row.amount || '-' }}</template>
        </el-table-column>
        <el-table-column label="订单ID" prop="orderId" width="90" align="center">
          <template #default="scope">{{ scope.row.orderId || '-' }}</template>
        </el-table-column>
        <el-table-column label="门店ID" prop="storeId" width="80" align="center">
          <template #default="scope">{{ scope.row.storeId || '-' }}</template>
        </el-table-column>
        <el-table-column label="发生时间" prop="visitTime" width="160" />
        <el-table-column label="备注" prop="remark" :show-overflow-tooltip="true" />
      </el-table>
      <pagination v-show="detailTotal > 0" :total="detailTotal" v-model:page="detailQuery.pageNum" v-model:limit="detailQuery.pageSize" @pagination="getDetail" />
    </el-dialog>
  </div>
</template>

<script setup name="HcChannelStat">
import { channelStats, listChannelVisit } from "@/api/hc/growth"

const { proxy } = getCurrentInstance()
const { hc_channel_type } = proxy.useDict("hc_channel_type")
const list = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const dateRange = ref([])
const detailOpen = ref(false)
const detailLoading = ref(false)
const detailList = ref([])
const detailTotal = ref(0)
const detailChannel = ref({})
const detailQuery = ref({ pageNum: 1, pageSize: 10, channelId: undefined })
const queryParams = ref({ pageNum: 1, pageSize: 10, channelName: undefined, channelType: undefined })

function getList() {
  loading.value = true
  const params = proxy.addDateRange({ ...queryParams.value }, dateRange.value)
  channelStats(params).then(response => {
    list.value = response.rows
    total.value = response.total
    loading.value = false
  })
}
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { dateRange.value = []; proxy.resetForm("queryRef"); handleQuery() }
function visitTypeName(t) {
  return t === "1" ? "扫码访问" : t === "2" ? "建档" : t === "3" ? "首单" : "其他"
}
function visitTagType(t) {
  return t === "3" ? "success" : t === "2" ? "warning" : "info"
}
function openDetail(row) {
  detailChannel.value = row
  detailQuery.value.channelId = row.channelId
  detailQuery.value.pageNum = 1
  detailList.value = []
  detailOpen.value = true
  getDetail()
}
function getDetail() {
  detailLoading.value = true
  listChannelVisit(detailQuery.value).then(response => {
    detailList.value = response.rows
    detailTotal.value = response.total
    detailLoading.value = false
  })
}
getList()
</script>
