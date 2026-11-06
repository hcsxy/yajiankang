<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="方案名称" prop="planName">
        <el-input v-model="queryParams.planName" placeholder="方案名称" clearable style="width: 160px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="客户姓名" prop="customerName">
        <el-input v-model="queryParams.customerName" placeholder="客户姓名" clearable style="width: 140px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="状态" prop="planStatus">
        <el-select v-model="queryParams.planStatus" clearable placeholder="状态" style="width: 130px">
          <el-option v-for="d in hc_plan_status" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row class="mb8">
      <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['hc:plan:add']">制定方案</el-button>
      <el-button type="warning" plain icon="Bell" @click="showTodo = true" v-hasPermi="['hc:plan:list']">待复评提醒</el-button>
    </el-row>

    <el-table v-loading="loading" :data="list">
      <el-table-column label="方案ID" prop="planId" width="70" />
      <el-table-column label="方案名称" prop="planName" :show-overflow-tooltip="true" />
      <el-table-column label="客户" prop="customerName" width="90" />
      <el-table-column label="版本" width="60" align="center">
        <template #default="scope">V{{ scope.row.versionNo }}</template>
      </el-table-column>
      <el-table-column label="状态" width="90" align="center">
        <template #default="scope"><dict-tag :options="hc_plan_status" :value="scope.row.planStatus" /></template>
      </el-table-column>
      <el-table-column label="总价" prop="totalPrice" width="90" align="right" />
      <el-table-column label="次均价" prop="avgPrice" width="90" align="right" />
      <el-table-column label="周期(天)" prop="cycleDays" width="80" align="center" />
      <el-table-column label="复评截止" width="110">
        <template #default="scope">{{ parseTime(scope.row.reassessDeadline, '{y}-{m}-{d}') }}</template>
      </el-table-column>
      <el-table-column label="顾问" prop="consultantName" width="90" />
      <el-table-column label="创建时间" width="150">
        <template #default="scope">{{ parseTime(scope.row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="270" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="View" @click="handleDetail(scope.row)" v-hasPermi="['hc:plan:query']">详情</el-button>
          <el-button v-if="scope.row.planStatus === '0'" link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['hc:plan:edit']">修改</el-button>
          <el-button v-if="scope.row.planStatus === '0'" link type="success" icon="Select" @click="handleConfirm(scope.row)" v-hasPermi="['hc:plan:confirm']">确认</el-button>
          <el-button v-if="['1', '2', '3'].includes(scope.row.planStatus)" link type="warning" icon="Sort" @click="handleAdjust(scope.row)" v-hasPermi="['hc:plan:adjust']">调整</el-button>
          <el-button v-if="scope.row.planStatus === '3' && scope.row.reassessDone !== '1'" link type="primary" icon="Checked" @click="handleReassessDone(scope.row)" v-hasPermi="['hc:plan:edit']">复评完成</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['hc:plan:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- 制定/修改/调整对话框 -->
    <el-dialog :title="title" v-model="open" width="760px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="12"><el-form-item label="方案名称" prop="planName"><el-input v-model="form.planName" maxlength="100" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="客户" prop="customerId">
            <el-select v-model="form.customerId" filterable remote :remote-method="searchCustomer" placeholder="输入姓名/手机号搜索" style="width: 100%" :disabled="mode !== 'add'">
              <el-option v-for="c in customerOptions" :key="c.customerId" :label="c.name + '（' + (c.phone || '') + '）'" :value="c.customerId" />
            </el-select>
          </el-form-item></el-col>
        </el-row>
        <el-row>
          <el-col :span="12" v-if="mode === 'add'"><el-form-item label="引用模板">
            <el-select v-model="form.templateId" clearable placeholder="从模板带入项目" style="width: 100%" @change="onTemplateChange">
              <el-option v-for="t in templateOptions" :key="t.templateId" :label="t.templateName" :value="t.templateId" />
            </el-select>
          </el-form-item></el-col>
          <el-col :span="12"><el-form-item label="周期(天)" prop="cycleDays"><el-input-number v-model="form.cycleDays" :min="1" style="width: 100%" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="调整原因" prop="adjustReason" v-if="mode === 'adjust'">
          <el-input v-model="form.adjustReason" type="textarea" :rows="2" maxlength="500" placeholder="方案调整将生成新版本，旧版本留痕" />
        </el-form-item>
        <el-form-item label="项目明细">
          <el-button link type="primary" icon="Plus" @click="addItemRow">添加项目</el-button>
          <el-table :data="form.items" size="small" class="mt8">
            <el-table-column label="项目名称" min-width="160">
              <template #default="scope"><el-input v-model="scope.row.itemName" placeholder="项目名称" /></template>
            </el-table-column>
            <el-table-column label="关联卡项" width="180">
              <template #default="scope">
                <el-select v-model="scope.row.cardDefId" clearable placeholder="可不选" style="width: 100%" @change="v => onDefChange(scope.row, v)">
                  <el-option v-for="d in defOptions" :key="d.defId" :label="d.defName" :value="d.defId" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="数量" width="110">
              <template #default="scope"><el-input-number v-model="scope.row.quantity" :min="1" size="small" style="width: 100%" /></template>
            </el-table-column>
            <el-table-column label="单价" width="120">
              <template #default="scope"><el-input-number v-model="scope.row.unitPrice" :min="0" :precision="2" size="small" style="width: 100%" /></template>
            </el-table-column>
            <el-table-column label="操作" width="60" align="center">
              <template #default="scope"><el-button link type="danger" icon="Delete" @click="form.items.splice(scope.$index, 1)" /></template>
            </el-table-column>
          </el-table>
        </el-form-item>
      </el-form>
      <template #footer><div class="dialog-footer"><el-button type="primary" @click="submitForm">确 定</el-button><el-button @click="open = false">取 消</el-button></div></template>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog title="方案详情" v-model="detailOpen" width="700px" append-to-body>
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="方案名称">{{ detail.planName }}</el-descriptions-item>
        <el-descriptions-item label="客户">{{ detail.customerName }}</el-descriptions-item>
        <el-descriptions-item label="版本">V{{ detail.versionNo }}</el-descriptions-item>
        <el-descriptions-item label="状态"><dict-tag :options="hc_plan_status" :value="detail.planStatus" /></el-descriptions-item>
        <el-descriptions-item label="总价">{{ detail.totalPrice }}</el-descriptions-item>
        <el-descriptions-item label="次均价">{{ detail.avgPrice }}</el-descriptions-item>
        <el-descriptions-item label="周期(天)">{{ detail.cycleDays }}</el-descriptions-item>
        <el-descriptions-item label="复评截止">{{ parseTime(detail.reassessDeadline, '{y}-{m}-{d}') }}</el-descriptions-item>
        <el-descriptions-item label="调整原因" :span="2">{{ detail.adjustReason || '-' }}</el-descriptions-item>
      </el-descriptions>
      <el-table :data="detail.items || []" size="small" class="mt8">
        <el-table-column label="项目" prop="itemName" />
        <el-table-column label="计划次数" prop="quantity" width="90" align="center" />
        <el-table-column label="已核销" prop="usedQuantity" width="90" align="center" />
        <el-table-column label="单价" prop="unitPrice" width="90" align="right" />
      </el-table>
    </el-dialog>

    <!-- 待复评清单 -->
    <el-dialog title="待复评方案提醒" v-model="showTodo" width="640px" append-to-body>
      <el-table :data="todoRows" size="small">
        <el-table-column label="方案名称" prop="planName" :show-overflow-tooltip="true" />
        <el-table-column label="客户" prop="customerName" width="100" />
        <el-table-column label="状态" width="90" align="center">
          <template #default="scope"><dict-tag :options="hc_plan_status" :value="scope.row.planStatus" /></template>
        </el-table-column>
        <el-table-column label="复评截止" width="120">
          <template #default="scope">{{ parseTime(scope.row.reassessDeadline, '{y}-{m}-{d}') }}</template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup name="Plan">
import { listPlan, getPlan, addPlan, updatePlan, confirmPlan, adjustPlan, reassessDone, reassessTodo, listTemplate, delPlan } from "@/api/hc/plan"
import { listCustomer } from "@/api/hc/card"
import { listCardDef } from "@/api/hc/basic"

const { proxy } = getCurrentInstance()
const { hc_plan_status } = proxy.useDict("hc_plan_status")
const list = ref([])
const customerOptions = ref([])
const templateOptions = ref([])
const defOptions = ref([])
const todoRows = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const title = ref("")
const open = ref(false)
const detailOpen = ref(false)
const showTodo = ref(false)
const detail = ref({})
const mode = ref("add")
const queryParams = ref({ pageNum: 1, pageSize: 10, planName: undefined, customerName: undefined, planStatus: undefined })
const form = ref({ items: [] })
const rules = {
  planName: [{ required: true, message: "方案名称不能为空", trigger: "blur" }],
  customerId: [{ required: true, message: "客户不能为空", trigger: "change" }],
  cycleDays: [{ required: true, message: "周期不能为空", trigger: "blur" }]
}

function searchCustomer(kw) {
  listCustomer({ pageNum: 1, pageSize: 20, name: kw, phone: /^[0-9]*$/.test(kw || '') ? kw : undefined }).then(r => customerOptions.value = r.rows)
}
function onDefChange(row, defId) {
  const d = defOptions.value.find(x => x.defId === defId)
  if (d) { row.itemName = d.defName; row.unitPrice = d.price }
}
function onTemplateChange(templateId) {
  const t = templateOptions.value.find(x => x.templateId === templateId)
  if (!t) return
  form.value.cycleDays = t.cycleDays
  try {
    form.value.items = JSON.parse(t.itemsJson || "[]").map(i => ({ itemName: i.itemName, cardDefId: i.cardDefId, quantity: i.quantity, unitPrice: i.unitPrice }))
  } catch (e) { /* ignore */ }
}
function addItemRow() { form.value.items.push({ itemName: undefined, cardDefId: undefined, quantity: 1, unitPrice: 0 }) }
function getList() {
  loading.value = true
  listPlan(queryParams.value).then(response => {
    list.value = response.rows
    total.value = response.total
    loading.value = false
  })
}
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm("queryRef"); handleQuery() }
function resetForm(formName) { form.value = { planId: undefined, planName: undefined, customerId: undefined, templateId: undefined, cycleDays: 21, adjustReason: undefined, items: [] }; proxy.resetForm(formName) }
function handleAdd() {
  resetForm("formRef"); mode.value = "add"; searchCustomer("")
  if (!templateOptions.value.length) listTemplate({ pageNum: 1, pageSize: 200, status: "0" }).then(r => templateOptions.value = r.rows)
  title.value = "制定调理方案"; open.value = true
}
function handleUpdate(row) {
  resetForm("formRef"); mode.value = "edit"
  getPlan(row.planId).then(response => {
    form.value = response.data
    if (!form.value.items) form.value.items = []
    title.value = "修改方案（草稿）"; open.value = true
  })
}
function handleAdjust(row) {
  resetForm("formRef"); mode.value = "adjust"
  getPlan(row.planId).then(response => {
    form.value = { ...response.data, planId: row.planId, adjustReason: undefined }
    if (!form.value.items) form.value.items = []
    title.value = "方案调整（生成新版本）"; open.value = true
  })
}
function submitForm() {
  proxy.$refs["formRef"].validate(valid => {
    if (!valid) return
    if (!form.value.items || !form.value.items.length) { proxy.$modal.msgWarning("请至少添加一个项目明细"); return }
    if (mode.value === "adjust") {
      if (!form.value.adjustReason) { proxy.$modal.msgWarning("调整原因必填"); return }
      adjustPlan(form.value).then(() => { proxy.$modal.msgSuccess("已生成新版本"); open.value = false; getList() })
      return
    }
    const fn = mode.value === "edit" ? updatePlan : addPlan
    fn(form.value).then(() => { proxy.$modal.msgSuccess("操作成功"); open.value = false; getList() })
  })
}
function handleConfirm(row) {
  proxy.$modal.confirm('确认方案"' + row.planName + '"？确认后将登记复评截止节点').then(() => confirmPlan(row.planId))
    .then(() => { getList(); proxy.$modal.msgSuccess("已确认") }).catch(() => {})
}
function handleReassessDone(row) {
  proxy.$modal.confirm('确认客户"' + row.customerName + '"已完成复评？').then(() => reassessDone(row.planId))
    .then(() => { getList(); proxy.$modal.msgSuccess("已标记") }).catch(() => {})
}
function handleDetail(row) {
  getPlan(row.planId).then(response => { detail.value = response.data || {}; detailOpen.value = true })
}
function handleDelete(row) {
  proxy.$modal.confirm('确认删除方案"' + row.planName + '"及其明细？').then(() => delPlan(row.planId))
    .then(() => { getList(); proxy.$modal.msgSuccess("删除成功") }).catch(() => {})
}
watch(showTodo, v => { if (v) reassessTodo({}).then(r => todoRows.value = r.data || []) })
listCustomer({ pageNum: 1, pageSize: 20 }).then(r => customerOptions.value = r.rows)
listCardDef({ pageNum: 1, pageSize: 500, status: "0" }).then(r => defOptions.value = r.rows)
getList()
</script>
