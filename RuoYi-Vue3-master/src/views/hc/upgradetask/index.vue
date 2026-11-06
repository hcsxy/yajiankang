<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="客户姓名" prop="customerName">
        <el-input v-model="queryParams.customerName" placeholder="客户姓名" clearable style="width: 150px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" clearable placeholder="状态" style="width: 120px">
          <el-option v-for="d in hc_upgrade_status" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="指派对象" prop="assignType">
        <el-select v-model="queryParams.assignType" clearable placeholder="指派" style="width: 120px">
          <el-option v-for="d in hc_upgrade_assign_type" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="创建时间" style="width: 340px">
        <el-date-picker v-model="dateRange" value-format="YYYY-MM-DD" type="daterange" start-placeholder="开始" end-placeholder="结束" style="width: 240px" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="list">
      <el-table-column label="任务号" prop="taskId" width="80" />
      <el-table-column label="客户" prop="customerName" width="110" />
      <el-table-column label="门店" prop="storeName" width="120">
        <template #default="scope">{{ scope.row.storeName || '-' }}</template>
      </el-table-column>
      <el-table-column label="钩子品" prop="sourceItem" width="150" show-overflow-tooltip />
      <el-table-column label="指派对象" width="100" align="center">
        <template #default="scope"><dict-tag :options="hc_upgrade_assign_type" :value="scope.row.assignType" /></template>
      </el-table-column>
      <el-table-column label="处理人" prop="assignName" width="100">
        <template #default="scope">{{ scope.row.assignName || '-' }}</template>
      </el-table-column>
      <el-table-column label="状态" width="90" align="center">
        <template #default="scope"><dict-tag :options="hc_upgrade_status" :value="scope.row.status" /></template>
      </el-table-column>
      <el-table-column label="升单金额" prop="finishAmount" width="110" align="right">
        <template #default="scope">{{ scope.row.finishAmount || '-' }}</template>
      </el-table-column>
      <el-table-column label="处理时间" prop="finishTime" width="160">
        <template #default="scope">{{ scope.row.finishTime || '-' }}</template>
      </el-table-column>
      <el-table-column label="处理说明" prop="handleRemark" :show-overflow-tooltip="true" />
      <el-table-column label="创建时间" prop="createTime" width="160" />
      <el-table-column label="操作" align="center" width="160" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button v-if="scope.row.status === '0'" link type="primary" icon="Edit" @click="openHandle(scope.row)" v-hasPermi="['hc:upgradetask:handle']">处理</el-button>
          <el-button v-if="scope.row.status === '0'" link type="primary" icon="User" @click="openAssign(scope.row)" v-hasPermi="['hc:upgradetask:handle']">指派</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog title="处理升单任务" v-model="handleOpen" width="520px" append-to-body>
      <el-form label-width="100px">
        <el-form-item label="客户"><el-input :model-value="current.customerName" disabled /></el-form-item>
        <el-form-item label="钩子品"><el-input :model-value="current.sourceItem" disabled /></el-form-item>
        <el-form-item label="处理结果" required>
          <el-radio-group v-model="handleForm.status">
            <el-radio value="1">成交升单</el-radio>
            <el-radio value="2">放弃</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="handleForm.status === '1'" label="升单金额" required>
          <el-input-number v-model="handleForm.finishAmount" :min="0.01" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="处理说明"><el-input v-model="handleForm.handleRemark" type="textarea" placeholder="跟进过程/放弃原因" /></el-form-item>
      </el-form>
      <template #footer><div class="dialog-footer"><el-button type="primary" @click="submitHandle">确 定</el-button><el-button @click="handleOpen = false">取 消</el-button></div></template>
    </el-dialog>

    <el-dialog title="指派处理人" v-model="assignOpen" width="460px" append-to-body>
      <el-form label-width="100px">
        <el-form-item label="客户"><el-input :model-value="current.customerName" disabled /></el-form-item>
        <el-form-item label="指派对象" required>
          <el-select v-model="assignForm.assignType" placeholder="请选择" style="width: 100%">
            <el-option v-for="d in hc_upgrade_assign_type" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理人" required>
          <el-input v-model="assignForm.assignName" maxlength="30" placeholder="请输入处理人姓名" />
        </el-form-item>
        <el-form-item label="员工ID">
          <el-input-number v-model="assignForm.assignId" :min="0" controls-position="right" style="width: 100%" placeholder="可空" />
        </el-form-item>
      </el-form>
      <template #footer><div class="dialog-footer"><el-button type="primary" @click="submitAssign">确 定</el-button><el-button @click="assignOpen = false">取 消</el-button></div></template>
    </el-dialog>
  </div>
</template>

<script setup name="HcUpgradeTask">
import { listUpgradeTask, handleUpgradeTask, assignUpgradeTask } from "@/api/hc/growth"

const { proxy } = getCurrentInstance()
const { hc_upgrade_status, hc_upgrade_assign_type } = proxy.useDict("hc_upgrade_status", "hc_upgrade_assign_type")
const list = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const dateRange = ref([])
const handleOpen = ref(false)
const assignOpen = ref(false)
const current = ref({})
const handleForm = ref({})
const assignForm = ref({})
const queryParams = ref({ pageNum: 1, pageSize: 10, customerName: undefined, status: undefined, assignType: undefined })

function getList() {
  loading.value = true
  const params = proxy.addDateRange({ ...queryParams.value }, dateRange.value)
  listUpgradeTask(params).then(response => {
    list.value = response.rows
    total.value = response.total
    loading.value = false
  })
}
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { dateRange.value = []; proxy.resetForm("queryRef"); handleQuery() }
function openHandle(row) {
  current.value = row
  handleForm.value = { taskId: row.taskId, status: "1", finishAmount: undefined, handleRemark: undefined }
  handleOpen.value = true
}
function submitHandle() {
  const f = handleForm.value
  if (f.status === "1" && !f.finishAmount) return proxy.$modal.msgError("成交需填写升单金额")
  handleUpgradeTask(f).then(r => {
    proxy.$modal.msgSuccess(r.msg || "处理成功")
    handleOpen.value = false
    getList()
  })
}
function openAssign(row) {
  current.value = row
  assignForm.value = { taskId: row.taskId, assignType: row.assignType || "2", assignId: row.assignId, assignName: row.assignName }
  assignOpen.value = true
}
function submitAssign() {
  const f = assignForm.value
  if (!f.assignType) return proxy.$modal.msgError("请选择指派对象")
  if (!f.assignName) return proxy.$modal.msgError("请填写处理人")
  const payload = { taskId: f.taskId, assignType: f.assignType, assignName: f.assignName }
  if (f.assignId) payload.assignId = f.assignId
  assignUpgradeTask(payload).then(r => {
    proxy.$modal.msgSuccess(r.msg || "指派成功")
    assignOpen.value = false
    getList()
  })
}
getList()
</script>
