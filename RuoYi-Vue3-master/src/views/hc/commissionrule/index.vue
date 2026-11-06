<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="规则名称" prop="ruleName">
        <el-input v-model="queryParams.ruleName" placeholder="规则名称" clearable style="width: 160px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="提成类型" prop="commissionType">
        <el-select v-model="queryParams.commissionType" clearable placeholder="类型" style="width: 130px">
          <el-option v-for="d in hc_commission_type" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row class="mb8">
      <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['hc:commissionrule:add']">新增</el-button>
      <el-button type="danger" plain icon="Delete" :disabled="!multiple.length" @click="handleDelete()" v-hasPermi="['hc:commissionrule:remove']">删除</el-button>
      <el-alert title="匹配优先级：项目级规则 > 门店级规则 > 全局通用规则；未命中规则时按技师基础提成比例计算" type="info" :closable="false" class="mb8" style="width: 500px" />
    </el-row>

    <el-table v-loading="loading" :data="list" @selection-change="v => multiple = v">
      <el-table-column type="selection" width="50" />
      <el-table-column label="规则名称" prop="ruleName" :show-overflow-tooltip="true" />
      <el-table-column label="提成类型" width="100" align="center">
        <template #default="scope"><dict-tag :options="hc_commission_type" :value="scope.row.commissionType" /></template>
      </el-table-column>
      <el-table-column label="适用卡项" width="150" :show-overflow-tooltip="true">
        <template #default="scope">{{ defName(scope.row.defId) }}</template>
      </el-table-column>
      <el-table-column label="适用门店" width="130" :show-overflow-tooltip="true">
        <template #default="scope">{{ scope.row.storeId ? storeName(scope.row.storeId) : '全部门店' }}</template>
      </el-table-column>
      <el-table-column label="计算方式" width="110" align="center">
        <template #default="scope">{{ scope.row.calcType === '1' ? '比例' : '固定额' }}</template>
      </el-table-column>
      <el-table-column label="比例" width="90" align="right">
        <template #default="scope">{{ scope.row.calcType === '1' && scope.row.rate != null ? (scope.row.rate * 100).toFixed(1) + '%' : '-' }}</template>
      </el-table-column>
      <el-table-column label="固定金额" width="100" align="right">
        <template #default="scope">{{ scope.row.calcType === '2' ? scope.row.fixAmount : '-' }}</template>
      </el-table-column>
      <el-table-column label="状态" width="80" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.status === '0' ? 'success' : 'info'">{{ scope.row.status === '0' ? '启用' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="150" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['hc:commissionrule:edit']">修改</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['hc:commissionrule:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="title" v-model="open" width="560px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="规则名称" prop="ruleName"><el-input v-model="form.ruleName" maxlength="100" /></el-form-item>
        <el-form-item label="提成类型" prop="commissionType">
          <el-select v-model="form.commissionType" style="width: 100%">
            <el-option v-for="d in hc_commission_type" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </el-form-item>
        <el-row>
          <el-col :span="12"><el-form-item label="适用卡项" prop="defId">
            <el-select v-model="form.defId" clearable placeholder="通用（不限）" style="width: 100%">
              <el-option v-for="d in defOptions" :key="d.defId" :label="d.defName" :value="d.defId" />
            </el-select>
          </el-form-item></el-col>
          <el-col :span="12"><el-form-item label="适用门店" prop="storeId">
            <el-select v-model="form.storeId" clearable placeholder="全部门店" style="width: 100%">
              <el-option v-for="s in storeOptions" :key="s.storeId" :label="s.storeName" :value="s.storeId" />
            </el-select>
          </el-form-item></el-col>
        </el-row>
        <el-form-item label="计算方式" prop="calcType">
          <el-radio-group v-model="form.calcType"><el-radio value="1">比例</el-radio><el-radio value="2">固定额</el-radio></el-radio-group>
        </el-form-item>
        <el-form-item label="提成比例" prop="rate" v-if="form.calcType === '1'">
          <el-input-number v-model="form.rate" :min="0" :max="1" :step="0.01" :precision="4" style="width: 100%" />
        </el-form-item>
        <el-form-item label="固定金额" prop="fixAmount" v-if="form.calcType === '2'">
          <el-input-number v-model="form.fixAmount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status"><el-radio value="0">启用</el-radio><el-radio value="1">停用</el-radio></el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark"><el-input v-model="form.remark" type="textarea" /></el-form-item>
      </el-form>
      <template #footer><div class="dialog-footer"><el-button type="primary" @click="submitForm">确 定</el-button><el-button @click="open = false">取 消</el-button></div></template>
    </el-dialog>
  </div>
</template>

<script setup name="Commissionrule">
import { listStore, listCardDef } from "@/api/hc/basic"
import { listRule, getRule, addRule, updateRule, delRule } from "@/api/hc/ledger"

const { proxy } = getCurrentInstance()
const { hc_commission_type } = proxy.useDict("hc_commission_type")
const list = ref([])
const storeOptions = ref([])
const defOptions = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const title = ref("")
const open = ref(false)
const multiple = ref([])
const queryParams = ref({ pageNum: 1, pageSize: 10, ruleName: undefined, commissionType: undefined })
const form = ref({})
const rules = {
  ruleName: [{ required: true, message: "规则名称不能为空", trigger: "blur" }],
  commissionType: [{ required: true, message: "提成类型不能为空", trigger: "change" }],
  calcType: [{ required: true, message: "计算方式不能为空", trigger: "change" }]
}

function storeName(id) { const s = storeOptions.value.find(x => x.storeId === id); return s ? s.storeName : id }
function defName(id) { if (!id) return "通用（不限卡项）"; const d = defOptions.value.find(x => x.defId === id); return d ? d.defName : id }
function getList() {
  loading.value = true
  listRule(queryParams.value).then(response => {
    list.value = response.rows
    total.value = response.total
    loading.value = false
  })
}
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm("queryRef"); handleQuery() }
function reset() { form.value = { ruleId: undefined, ruleName: undefined, commissionType: "1", defId: undefined, storeId: undefined, calcType: "1", rate: 0.1, fixAmount: 0, status: "0", remark: undefined }; proxy.resetForm("formRef") }
function handleAdd() { reset(); open.value = true; title.value = "添加提成规则" }
function handleUpdate(row) {
  reset()
  getRule(row.ruleId).then(response => {
    form.value = response.data
    open.value = true; title.value = "修改提成规则"
  })
}
function submitForm() {
  proxy.$refs["formRef"].validate(valid => {
    if (!valid) return
    const fn = form.value.ruleId ? updateRule : addRule
    fn(form.value).then(() => {
      proxy.$modal.msgSuccess("操作成功"); open.value = false; getList()
    })
  })
}
function handleDelete(row) {
  const ids = row.ruleId || multiple.value.map(r => r.ruleId)
  if (!ids || !ids.length) return
  proxy.$modal.confirm('确认删除所选提成规则？').then(() => delRule(ids)).then(() => { getList(); proxy.$modal.msgSuccess("删除成功") }).catch(() => {})
}
listStore({ pageNum: 1, pageSize: 200 }).then(r => storeOptions.value = r.rows)
listCardDef({ pageNum: 1, pageSize: 500, status: "0" }).then(r => defOptions.value = r.rows)
getList()
</script>
