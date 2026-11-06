<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="技师" prop="technicianId">
        <el-select v-model="queryParams.technicianId" clearable filterable placeholder="技师" style="width: 140px">
          <el-option v-for="t in techOptions" :key="t.technicianId" :label="t.techName" :value="t.technicianId" />
        </el-select>
      </el-form-item>
      <el-form-item label="门店" prop="storeId">
        <el-select v-model="queryParams.storeId" clearable placeholder="门店" style="width: 140px">
          <el-option v-for="s in storeOptions" :key="s.storeId" :label="s.storeName" :value="s.storeId" />
        </el-select>
      </el-form-item>
      <el-form-item label="排班日期">
        <el-date-picker v-model="dateRange" type="daterange" value-format="YYYY-MM-DD" start-placeholder="开始" end-placeholder="结束" style="width: 240px" />
      </el-form-item>
      <el-form-item label="班次" prop="shiftType">
        <el-select v-model="queryParams.shiftType" clearable placeholder="班次" style="width: 120px">
          <el-option v-for="d in hc_schedule_shift" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row class="mb8">
      <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['hc:schedule:add']">新增排班</el-button>
      <el-button type="success" plain icon="Calendar" @click="openBatch" v-hasPermi="['hc:schedule:batch']">批量周排班</el-button>
      <el-alert title="同技师同日时段不可重叠；改为休息/请假会校验当日预约；预约登记时校验班次时段是否覆盖" type="info" :closable="false" style="width: 620px" />
    </el-row>

    <el-table v-loading="loading" :data="list">
      <el-table-column label="排班日期" width="120" align="center">
        <template #default="scope">{{ parseTime(scope.row.workDate, '{y}-{m}-{d}') }}</template>
      </el-table-column>
      <el-table-column label="技师" prop="technicianName" width="110" />
      <el-table-column label="门店" prop="storeName" width="130" :show-overflow-tooltip="true" />
      <el-table-column label="班次时段" width="150" align="center">
        <template #default="scope">{{ scope.row.startTime }} - {{ scope.row.endTime }}</template>
      </el-table-column>
      <el-table-column label="班次类型" width="100" align="center">
        <template #default="scope">
          <el-tag :type="shiftTag(scope.row.shiftType)">{{ shiftLabel(scope.row.shiftType) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.status === '0' ? 'success' : 'info'">{{ scope.row.status === '0' ? '有效' : '已取消' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="备注" prop="remark" min-width="160" :show-overflow-tooltip="true" />
      <el-table-column label="操作" width="150" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['hc:schedule:edit']">修改</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['hc:schedule:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- 单条排班 -->
    <el-dialog :title="title" v-model="open" width="560px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="技师" prop="technicianId">
          <el-select v-model="form.technicianId" filterable style="width: 100%" @change="onTechChange">
            <el-option v-for="t in techOptions" :key="t.technicianId" :label="t.techName" :value="t.technicianId" />
          </el-select>
        </el-form-item>
        <el-form-item label="门店" prop="storeId">
          <el-select v-model="form.storeId" style="width: 100%">
            <el-option v-for="s in storeOptions" :key="s.storeId" :label="s.storeName" :value="s.storeId" />
          </el-select>
        </el-form-item>
        <el-form-item label="排班日期" prop="workDate">
          <el-date-picker v-model="form.workDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-row>
          <el-col :span="12">
            <el-form-item label="开始时间" prop="startTime">
              <el-time-picker v-model="form.startTime" format="HH:mm" value-format="HH:mm" placeholder="09:00" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束时间" prop="endTime">
              <el-time-picker v-model="form.endTime" format="HH:mm" value-format="HH:mm" placeholder="18:00" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="班次类型" prop="shiftType">
          <el-select v-model="form.shiftType" style="width: 100%">
            <el-option v-for="d in hc_schedule_shift" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" /></el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer"><el-button type="primary" @click="submitForm">确 定</el-button><el-button @click="open = false">取 消</el-button></div>
      </template>
    </el-dialog>

    <!-- 批量周排班 -->
    <el-dialog title="批量周排班" v-model="batchOpen" width="620px" append-to-body>
      <el-form ref="batchFormRef" :model="batchForm" :rules="batchRules" label-width="100px">
        <el-form-item label="技师" prop="technicianId">
          <el-select v-model="batchForm.technicianId" filterable style="width: 100%" @change="onBatchTechChange">
            <el-option v-for="t in techOptions" :key="t.technicianId" :label="t.techName" :value="t.technicianId" />
          </el-select>
        </el-form-item>
        <el-form-item label="门店" prop="storeId">
          <el-select v-model="batchForm.storeId" style="width: 100%">
            <el-option v-for="s in storeOptions" :key="s.storeId" :label="s.storeName" :value="s.storeId" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期区间" prop="range">
          <el-date-picker v-model="batchForm.range" type="daterange" value-format="YYYY-MM-DD" start-placeholder="开始" end-placeholder="结束" style="width: 100%" />
        </el-form-item>
        <el-form-item label="星期">
          <el-checkbox-group v-model="batchForm.weekDays">
            <el-checkbox v-for="(w, i) in weekLabels" :key="i" :value="i + 1">{{ w }}</el-checkbox>
          </el-checkbox-group>
          <div class="tip-text">不选则区间内每天都排，区间最长 31 天</div>
        </el-form-item>
        <el-row>
          <el-col :span="12">
            <el-form-item label="开始时间" prop="startTime">
              <el-time-picker v-model="batchForm.startTime" format="HH:mm" value-format="HH:mm" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束时间" prop="endTime">
              <el-time-picker v-model="batchForm.endTime" format="HH:mm" value-format="HH:mm" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="班次类型" prop="shiftType">
          <el-select v-model="batchForm.shiftType" style="width: 100%">
            <el-option v-for="d in hc_schedule_shift" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注"><el-input v-model="batchForm.remark" type="textarea" /></el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer"><el-button type="primary" @click="submitBatch">生成排班</el-button><el-button @click="batchOpen = false">取 消</el-button></div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Schedule">
import { listSchedule, addSchedule, updateSchedule, delSchedule, batchSchedule } from "@/api/hc/schedule"
import { listStore, listTechnician } from "@/api/hc/basic"

const { proxy } = getCurrentInstance()
const { hc_schedule_shift } = proxy.useDict("hc_schedule_shift")

const list = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const title = ref("")
const open = ref(false)
const batchOpen = ref(false)
const storeOptions = ref([])
const techOptions = ref([])
const dateRange = ref([])
const weekLabels = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
const queryParams = ref({ pageNum: 1, pageSize: 10, technicianId: undefined, storeId: undefined, shiftType: undefined })
const form = ref({})
const batchForm = ref({})

const timeRequired = { type: "string", required: true, message: "请选择时间", trigger: "change" }
const rules = {
  technicianId: [{ required: true, message: "请选择技师", trigger: "change" }],
  storeId: [{ required: true, message: "请选择门店", trigger: "change" }],
  workDate: [{ required: true, message: "请选择排班日期", trigger: "change" }],
  startTime: [timeRequired],
  endTime: [timeRequired],
  shiftType: [{ required: true, message: "请选择班次类型", trigger: "change" }]
}
const batchRules = {
  technicianId: [{ required: true, message: "请选择技师", trigger: "change" }],
  storeId: [{ required: true, message: "请选择门店", trigger: "change" }],
  range: [{ required: true, message: "请选择日期区间", trigger: "change" }],
  startTime: [timeRequired],
  endTime: [timeRequired],
  shiftType: [{ required: true, message: "请选择班次类型", trigger: "change" }]
}

function shiftLabel(v) {
  const d = hc_schedule_shift.value.find(x => x.value === v)
  return d ? d.label : v
}
function shiftTag(v) {
  return { "1": "success", "2": "info", "3": "warning", "4": "primary" }[v] || "info"
}

function getList() {
  loading.value = true
  const params = proxy.addDateRange({ ...queryParams.value }, dateRange.value)
  listSchedule(params).then(r => {
    list.value = r.rows
    total.value = r.total
    loading.value = false
  })
}
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() {
  dateRange.value = []
  proxy.resetForm("queryRef")
  handleQuery()
}

function reset() {
  form.value = { scheduleId: undefined, technicianId: undefined, technicianName: undefined, storeId: undefined, workDate: undefined, startTime: "09:00", endTime: "18:00", shiftType: "1", remark: undefined }
  proxy.resetForm("formRef")
}
function onTechChange(id) {
  const t = techOptions.value.find(x => x.technicianId === id)
  form.value.technicianName = t ? t.techName : undefined
}
function handleAdd() { reset(); open.value = true; title.value = "新增排班" }
function handleUpdate(row) {
  reset()
  form.value = { ...row }
  open.value = true
  title.value = "修改排班"
}
function submitForm() {
  proxy.$refs["formRef"].validate(valid => {
    if (!valid) return
    const fn = form.value.scheduleId ? updateSchedule : addSchedule
    fn(form.value).then(() => {
      proxy.$modal.msgSuccess(form.value.scheduleId ? "修改成功" : "排班成功")
      open.value = false
      getList()
    })
  })
}
function handleDelete(row) {
  proxy.$modal.confirm('确认删除技师"' + row.technicianName + '" ' + row.startTime + '-' + row.endTime + ' 的排班？').then(() => delSchedule(row.scheduleId))
    .then(() => { getList(); proxy.$modal.msgSuccess("删除成功") }).catch(() => {})
}

function openBatch() {
  batchForm.value = {
    technicianId: undefined, technicianName: undefined, storeId: undefined, range: [],
    weekDays: [1, 2, 3, 4, 5], startTime: "09:00", endTime: "18:00", shiftType: "1", remark: undefined
  }
  proxy.resetForm("batchFormRef")
  batchOpen.value = true
}
function onBatchTechChange(id) {
  const t = techOptions.value.find(x => x.technicianId === id)
  batchForm.value.technicianName = t ? t.techName : undefined
}
function submitBatch() {
  proxy.$refs["batchFormRef"].validate(valid => {
    if (!valid) return
    const f = batchForm.value
    if (!f.range || f.range.length !== 2) {
      proxy.$modal.msgError("请选择日期区间")
      return
    }
    const template = {
      technicianId: f.technicianId, technicianName: f.technicianName, storeId: f.storeId,
      startTime: f.startTime, endTime: f.endTime, shiftType: f.shiftType, remark: f.remark
    }
    const params = { beginDate: f.range[0], endDate: f.range[1], weekDays: (f.weekDays || []).join(",") }
    batchSchedule(template, params).then(r => {
      proxy.$modal.msgSuccess("已生成 " + (r.data || 0) + " 条排班")
      batchOpen.value = false
      getList()
    })
  })
}

listStore({ pageNum: 1, pageSize: 200 }).then(r => storeOptions.value = r.rows)
listTechnician({ pageNum: 1, pageSize: 500, status: "0" }).then(r => techOptions.value = r.rows)
getList()
</script>

<style scoped>
.tip-text { font-size: 12px; color: #909399; line-height: 1.6; }
</style>
