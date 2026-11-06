<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="模板名称" prop="templateName">
        <el-input v-model="queryParams.templateName" placeholder="模板名称" clearable style="width: 180px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row class="mb8">
      <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['hc:plantemplate:add']">新增</el-button>
      <el-button type="danger" plain icon="Delete" :disabled="!multiple.length" @click="handleDelete()" v-hasPermi="['hc:plantemplate:remove']">删除</el-button>
    </el-row>

    <el-table v-loading="loading" :data="list" @selection-change="v => multiple = v">
      <el-table-column type="selection" width="50" />
      <el-table-column label="模板名称" prop="templateName" :show-overflow-tooltip="true" />
      <el-table-column label="适用体质" prop="suitConstitution" width="160" :show-overflow-tooltip="true" />
      <el-table-column label="项目数" width="80" align="center">
        <template #default="scope">{{ parseItems(scope.row.itemsJson).length }}</template>
      </el-table-column>
      <el-table-column label="模板总价" prop="totalPrice" width="100" align="right" />
      <el-table-column label="调理周期(天)" prop="cycleDays" width="110" align="center" />
      <el-table-column label="需复评" width="80" align="center">
        <template #default="scope">{{ scope.row.needReassess === '1' ? '是' : '否' }}</template>
      </el-table-column>
      <el-table-column label="状态" width="80" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.status === '0' ? 'success' : 'info'">{{ scope.row.status === '0' ? '启用' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="150" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['hc:plantemplate:edit']">修改</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['hc:plantemplate:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="title" v-model="open" width="720px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-row>
          <el-col :span="12"><el-form-item label="模板名称" prop="templateName"><el-input v-model="form.templateName" maxlength="100" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="适用体质" prop="suitConstitution">
            <el-select v-model="suitArr" multiple style="width: 100%" placeholder="可多选">
              <el-option v-for="d in hc_constitution" :key="d.value" :label="d.label" :value="d.label" />
            </el-select>
          </el-form-item></el-col>
        </el-row>
        <el-row>
          <el-col :span="8"><el-form-item label="调理周期(天)" prop="cycleDays"><el-input-number v-model="form.cycleDays" :min="1" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="需复评" prop="needReassess">
            <el-radio-group v-model="form.needReassess"><el-radio value="1">是</el-radio><el-radio value="0">否</el-radio></el-radio-group>
          </el-form-item></el-col>
          <el-col :span="8"><el-form-item label="状态" prop="status">
            <el-radio-group v-model="form.status"><el-radio value="0">启用</el-radio><el-radio value="1">停用</el-radio></el-radio-group>
          </el-form-item></el-col>
        </el-row>

        <el-form-item label="项目明细">
          <el-button link type="primary" icon="Plus" @click="addItemRow">添加项目</el-button>
          <span style="margin-left: 12px; color: #909399">合计自动汇总为模板总价</span>
          <el-table :data="itemRows" size="small" class="mt8">
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
            <el-table-column label="操作" width="70" align="center">
              <template #default="scope"><el-button link type="danger" icon="Delete" @click="itemRows.splice(scope.$index, 1)">移除</el-button></template>
            </el-table-column>
          </el-table>
        </el-form-item>
        <el-form-item label="模板总价"><el-input :model-value="totalPrice" disabled style="width: 200px" /></el-form-item>
        <el-form-item label="备注" prop="remark"><el-input v-model="form.remark" type="textarea" /></el-form-item>
      </el-form>
      <template #footer><div class="dialog-footer"><el-button type="primary" @click="submitForm">确 定</el-button><el-button @click="open = false">取 消</el-button></div></template>
    </el-dialog>
  </div>
</template>

<script setup name="Plantemplate">
import { listTemplate, getTemplate, addTemplate, updateTemplate, delTemplate } from "@/api/hc/plan"
import { listCardDef } from "@/api/hc/basic"

const { proxy } = getCurrentInstance()
const { hc_constitution } = proxy.useDict("hc_constitution")
const list = ref([])
const defOptions = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const title = ref("")
const open = ref(false)
const multiple = ref([])
const suitArr = ref([])
const itemRows = ref([])
const queryParams = ref({ pageNum: 1, pageSize: 10, templateName: undefined })
const form = ref({})
const rules = {
  templateName: [{ required: true, message: "模板名称不能为空", trigger: "blur" }],
  cycleDays: [{ required: true, message: "调理周期不能为空", trigger: "blur" }]
}

const totalPrice = computed(() => itemRows.value.reduce((s, i) => s + (i.quantity || 0) * (i.unitPrice || 0), 0).toFixed(2))

function parseItems(json) { try { return JSON.parse(json || "[]") } catch (e) { return [] } }
function onDefChange(row, defId) {
  const d = defOptions.value.find(x => x.defId === defId)
  if (d) { row.itemName = d.defName; row.unitPrice = d.price }
}
function addItemRow() { itemRows.value.push({ itemName: undefined, cardDefId: undefined, quantity: 1, unitPrice: 0 }) }
function getList() {
  loading.value = true
  listTemplate(queryParams.value).then(response => {
    list.value = response.rows
    total.value = response.total
    loading.value = false
  })
}
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm("queryRef"); handleQuery() }
function reset() { form.value = { templateId: undefined, templateName: undefined, suitConstitution: undefined, cycleDays: 21, needReassess: "1", status: "0", remark: undefined }; suitArr.value = []; itemRows.value = []; proxy.resetForm("formRef") }
function handleAdd() { reset(); open.value = true; title.value = "添加方案模板" }
function handleUpdate(row) {
  reset()
  getTemplate(row.templateId).then(response => {
    form.value = response.data
    suitArr.value = form.value.suitConstitution ? form.value.suitConstitution.split(",") : []
    itemRows.value = parseItems(form.value.itemsJson)
    open.value = true; title.value = "修改方案模板"
  })
}
function submitForm() {
  proxy.$refs["formRef"].validate(valid => {
    if (!valid) return
    if (!itemRows.value.length) { proxy.$modal.msgWarning("请至少添加一个项目明细"); return }
    form.value.suitConstitution = suitArr.value.join(",")
    form.value.itemsJson = JSON.stringify(itemRows.value)
    form.value.totalPrice = totalPrice.value
    const fn = form.value.templateId ? updateTemplate : addTemplate
    fn(form.value).then(() => {
      proxy.$modal.msgSuccess("操作成功"); open.value = false; getList()
    })
  })
}
function handleDelete(row) {
  const ids = row.templateId || multiple.value.map(r => r.templateId)
  if (!ids || !ids.length) return
  proxy.$modal.confirm('确认删除所选方案模板？').then(() => delTemplate(ids)).then(() => { getList(); proxy.$modal.msgSuccess("删除成功") }).catch(() => {})
}
listCardDef({ pageNum: 1, pageSize: 500, status: "0" }).then(r => defOptions.value = r.rows)
getList()
</script>
