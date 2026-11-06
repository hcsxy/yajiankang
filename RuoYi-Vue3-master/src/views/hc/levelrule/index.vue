<template>
  <div class="app-container">
    <el-row class="mb8">
      <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['hc:levelrule:add']">新增</el-button>
      <el-button type="danger" plain icon="Delete" :disabled="!multiple.length" @click="handleDelete()" v-hasPermi="['hc:levelrule:remove']">删除</el-button>
      <el-button type="warning" plain icon="Refresh" @click="handleRefresh" v-hasPermi="['hc:levelrule:edit']">立即重算等级</el-button>
    </el-row>

    <el-table v-loading="loading" :data="list" @selection-change="v => multiple = v">
      <el-table-column type="selection" width="50" />
      <el-table-column label="等级序号" prop="levelNo" width="90" align="center" />
      <el-table-column label="等级名称" prop="levelName" width="130" />
      <el-table-column label="累计消费≥(元)" prop="minAmount" width="130" align="right" />
      <el-table-column label="核销次数≥" prop="minVerify" width="100" align="center" />
      <el-table-column label="复评完成率≥(%)" prop="minReassessRate" width="140" align="center" />
      <el-table-column label="积分倍率" prop="pointsRate" width="100" align="center" />
      <el-table-column label="状态" width="80" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.status === '0' ? 'success' : 'info'">{{ scope.row.status === '0' ? '启用' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="备注" prop="remark" :show-overflow-tooltip="true" />
      <el-table-column label="操作" align="center" width="150" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['hc:levelrule:edit']">修改</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['hc:levelrule:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="title" v-model="open" width="560px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="130px">
        <el-row>
          <el-col :span="12"><el-form-item label="等级序号" prop="levelNo"><el-input-number v-model="form.levelNo" :min="1" :max="99" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="等级名称" prop="levelName"><el-input v-model="form.levelName" maxlength="50" /></el-form-item></el-col>
        </el-row>
        <el-row>
          <el-col :span="12"><el-form-item label="累计消费≥(元)" prop="minAmount"><el-input-number v-model="form.minAmount" :min="0" :precision="2" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="核销次数≥" prop="minVerify"><el-input-number v-model="form.minVerify" :min="0" style="width: 100%" /></el-form-item></el-col>
        </el-row>
        <el-row>
          <el-col :span="12"><el-form-item label="复评完成率≥(%)" prop="minReassessRate"><el-input-number v-model="form.minReassessRate" :min="0" :max="100" :precision="2" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="积分倍率" prop="pointsRate"><el-input-number v-model="form.pointsRate" :min="0" :precision="2" :step="0.1" style="width: 100%" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status"><el-radio value="0">启用</el-radio><el-radio value="1">停用</el-radio></el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark"><el-input v-model="form.remark" type="textarea" /></el-form-item>
      </el-form>
      <template #footer><div class="dialog-footer"><el-button type="primary" @click="submitForm">确 定</el-button><el-button @click="open = false">取 消</el-button></div></template>
    </el-dialog>
  </div>
</template>

<script setup name="Levelrule">
import { listLevelRule, getLevelRule, addLevelRule, updateLevelRule, delLevelRule, refreshLevel } from "@/api/hc/member"

const { proxy } = getCurrentInstance()
const list = ref([])
const loading = ref(true)
const total = ref(0)
const title = ref("")
const open = ref(false)
const multiple = ref([])
const queryParams = ref({ pageNum: 1, pageSize: 10 })
const form = ref({})
const rules = {
  levelNo: [{ required: true, message: "等级序号不能为空", trigger: "blur" }],
  levelName: [{ required: true, message: "等级名称不能为空", trigger: "blur" }]
}

function getList() {
  loading.value = true
  listLevelRule(queryParams.value).then(response => {
    list.value = response.rows
    total.value = response.total
    loading.value = false
  })
}
function reset() {
  form.value = { ruleId: undefined, levelNo: 1, levelName: undefined, minAmount: 0, minVerify: 0, minReassessRate: 0, pointsRate: 1, status: "0", remark: undefined }
  proxy.resetForm("formRef")
}
function handleAdd() { reset(); open.value = true; title.value = "添加等级规则" }
function handleUpdate(row) {
  reset()
  getLevelRule(row.ruleId).then(response => { form.value = response.data; open.value = true; title.value = "修改等级规则" })
}
function submitForm() {
  proxy.$refs["formRef"].validate(valid => {
    if (!valid) return
    const fn = form.value.ruleId ? updateLevelRule : addLevelRule
    fn(form.value).then(() => { proxy.$modal.msgSuccess("操作成功"); open.value = false; getList() })
  })
}
function handleDelete(row) {
  const ids = row.ruleId || multiple.value.map(r => r.ruleId)
  if (!ids || !ids.length) return
  proxy.$modal.confirm('确认删除所选等级规则？').then(() => delLevelRule(ids)).then(() => { getList(); proxy.$modal.msgSuccess("删除成功") }).catch(() => {})
}
function handleRefresh() {
  proxy.$modal.confirm('将按规则全量重算所有客户等级，确认执行？').then(() => refreshLevel()).then(r => {
    proxy.$modal.msgSuccess(r.msg || "等级重算完成")
  }).catch(() => {})
}
getList()
</script>
