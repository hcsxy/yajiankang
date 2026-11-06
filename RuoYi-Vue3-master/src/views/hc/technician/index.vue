<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="技师姓名" prop="techName">
        <el-input v-model="queryParams.techName" placeholder="技师姓名" clearable style="width: 150px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="所属门店" prop="storeId">
        <el-select v-model="queryParams.storeId" clearable placeholder="门店" style="width: 160px">
          <el-option v-for="s in storeOptions" :key="s.storeId" :label="s.storeName" :value="s.storeId" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" clearable placeholder="状态" style="width: 120px">
          <el-option label="在职" value="0" /><el-option label="离职" value="1" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row class="mb8">
      <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['hc:technician:add']">新增</el-button>
      <el-button type="danger" plain icon="Delete" :disabled="!multiple.length" @click="handleDelete()" v-hasPermi="['hc:technician:remove']">删除</el-button>
    </el-row>

    <el-table v-loading="loading" :data="list" @selection-change="v => multiple = v">
      <el-table-column type="selection" width="50" />
      <el-table-column label="工号" prop="techNo" width="110" />
      <el-table-column label="姓名" prop="techName" width="100" />
      <el-table-column label="所属门店" prop="storeName" :show-overflow-tooltip="true" />
      <el-table-column label="可服务门店" prop="serviceStoreIds" :show-overflow-tooltip="true">
        <template #default="scope">{{ serviceStoreNames(scope.row.serviceStoreIds) }}</template>
      </el-table-column>
      <el-table-column label="擅长项目" prop="goodAtItems" :show-overflow-tooltip="true" />
      <el-table-column label="基础提成比例" width="110" align="right">
        <template #default="scope">{{ scope.row.baseCommissionRate != null ? (scope.row.baseCommissionRate * 100).toFixed(1) + '%' : '-' }}</template>
      </el-table-column>
      <el-table-column label="状态" width="80" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.status === '0' ? 'success' : 'info'">{{ scope.row.status === '0' ? '在职' : '离职' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="150" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['hc:technician:edit']">修改</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['hc:technician:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="title" v-model="open" width="620px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-row>
          <el-col :span="12"><el-form-item label="技师姓名" prop="techName"><el-input v-model="form.techName" maxlength="30" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="所属门店" prop="storeId">
            <el-select v-model="form.storeId" placeholder="门店" style="width: 100%">
              <el-option v-for="s in storeOptions" :key="s.storeId" :label="s.storeName" :value="s.storeId" />
            </el-select>
          </el-form-item></el-col>
        </el-row>
        <el-form-item label="可服务门店" prop="serviceStoreIds">
          <el-select v-model="serviceStoreArr" multiple placeholder="跨店服务门店（留空=仅所属门店）" style="width: 100%">
            <el-option v-for="s in storeOptions" :key="s.storeId" :label="s.storeName" :value="String(s.storeId)" />
          </el-select>
        </el-form-item>
        <el-row>
          <el-col :span="12"><el-form-item label="资格证号" prop="certNo"><el-input v-model="form.certNo" maxlength="50" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="基础提成比例" prop="baseCommissionRate">
            <el-input-number v-model="form.baseCommissionRate" :min="0" :max="1" :step="0.01" :precision="4" style="width: 100%" />
          </el-form-item></el-col>
        </el-row>
        <el-form-item label="擅长项目" prop="goodAtItems"><el-input v-model="form.goodAtItems" maxlength="200" placeholder="如：推拿、艾灸、颈肩调理" /></el-form-item>
        <el-row>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="form.status"><el-radio value="0">在职</el-radio><el-radio value="1">离职</el-radio></el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12"><el-form-item label="关联系统账号ID" prop="userId"><el-input v-model="form.userId" placeholder="sys_user主键（可空）" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="备注" prop="remark"><el-input v-model="form.remark" type="textarea" /></el-form-item>
      </el-form>
      <template #footer><div class="dialog-footer"><el-button type="primary" @click="submitForm">确 定</el-button><el-button @click="open = false">取 消</el-button></div></template>
    </el-dialog>
  </div>
</template>

<script setup name="Technician">
import { listTechnician, getTechnician, addTechnician, updateTechnician, delTechnician, listStore } from "@/api/hc/basic"

const { proxy } = getCurrentInstance()
const list = ref([])
const storeOptions = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const title = ref("")
const open = ref(false)
const multiple = ref([])
const serviceStoreArr = ref([])
const queryParams = ref({ pageNum: 1, pageSize: 10, techName: undefined, storeId: undefined, status: undefined })
const form = ref({})
const rules = {
  techName: [{ required: true, message: "技师姓名不能为空", trigger: "blur" }],
  storeId: [{ required: true, message: "所属门店不能为空", trigger: "change" }]
}

function serviceStoreNames(ids) {
  if (!ids) return "仅所属门店"
  return ids.split(",").map(id => { const s = storeOptions.value.find(x => String(x.storeId) === id); return s ? s.storeName : id }).join("、")
}
function getList() {
  loading.value = true
  listTechnician(queryParams.value).then(response => {
    list.value = response.rows
    total.value = response.total
    loading.value = false
  })
}
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm("queryRef"); handleQuery() }
function reset() { form.value = { technicianId: undefined, techName: undefined, storeId: undefined, serviceStoreIds: undefined, certNo: undefined, goodAtItems: undefined, baseCommissionRate: 0.1, status: "0", userId: undefined, remark: undefined }; serviceStoreArr.value = []; proxy.resetForm("formRef") }
function handleAdd() { reset(); open.value = true; title.value = "添加技师" }
function handleUpdate(row) {
  reset()
  getTechnician(row.technicianId).then(response => {
    form.value = response.data
    serviceStoreArr.value = form.value.serviceStoreIds ? form.value.serviceStoreIds.split(",") : []
    open.value = true; title.value = "修改技师"
  })
}
function submitForm() {
  proxy.$refs["formRef"].validate(valid => {
    if (!valid) return
    form.value.serviceStoreIds = serviceStoreArr.value.join(",")
    const fn = form.value.technicianId ? updateTechnician : addTechnician
    fn(form.value).then(() => {
      proxy.$modal.msgSuccess("操作成功"); open.value = false; getList()
    })
  })
}
function handleDelete(row) {
  const ids = row.technicianId || multiple.value.map(r => r.technicianId)
  if (!ids || !ids.length) return
  proxy.$modal.confirm('确认删除所选技师？').then(() => delTechnician(ids)).then(() => { getList(); proxy.$modal.msgSuccess("删除成功") }).catch(() => {})
}
listStore({ pageNum: 1, pageSize: 200 }).then(r => storeOptions.value = r.rows)
getList()
</script>
