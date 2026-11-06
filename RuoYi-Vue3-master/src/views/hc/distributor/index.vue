<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="姓名" prop="name">
        <el-input v-model="queryParams.name" placeholder="分销员姓名" clearable style="width: 140px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="手机号" prop="phone">
        <el-input v-model="queryParams.phone" placeholder="手机号" clearable style="width: 140px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="邀请码" prop="inviteCode">
        <el-input v-model="queryParams.inviteCode" placeholder="邀请码" clearable style="width: 130px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="类型" prop="distType">
        <el-select v-model="queryParams.distType" clearable placeholder="类型" style="width: 130px">
          <el-option label="忠实客户" value="1" /><el-option label="兼职理疗师" value="2" /><el-option label="内部员工" value="3" />
        </el-select>
      </el-form-item>
      <el-form-item label="归属门店" prop="storeId">
        <el-select v-model="queryParams.storeId" clearable filterable placeholder="门店" style="width: 160px">
          <el-option v-for="s in storeOptions" :key="s.storeId" :label="s.storeName" :value="s.storeId" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" clearable placeholder="状态" style="width: 100px">
          <el-option label="正常" value="0" /><el-option label="停用" value="1" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['hc:distributor:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete" v-hasPermi="['hc:distributor:remove']">删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['hc:distributor:export']">导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="list" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="分销编号" prop="distributorNo" width="130" />
      <el-table-column label="姓名" prop="name" width="100" />
      <el-table-column label="手机号" prop="phone" width="120" />
      <el-table-column label="邀请码" prop="inviteCode" width="110" />
      <el-table-column label="类型" width="100" align="center">
        <template #default="scope">{{ distTypeLabel(scope.row.distType) }}</template>
      </el-table-column>
      <el-table-column label="归属门店" prop="storeName" width="120" :show-overflow-tooltip="true" />
      <el-table-column label="关联客户" prop="customerName" width="100" />
      <el-table-column label="专属比例%" prop="rate" width="95" align="right" />
      <el-table-column label="累计分销额" prop="totalAmount" width="110" align="right" />
      <el-table-column label="累计佣金" prop="totalCommission" width="100" align="right" />
      <el-table-column label="已结算" prop="settledAmount" width="100" align="right" />
      <el-table-column label="状态" width="80" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.status === '0' ? 'success' : 'info'">{{ scope.row.status === '0' ? '正常' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="140" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['hc:distributor:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['hc:distributor:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="title" v-model="open" width="640px" append-to-body>
      <el-form ref="distributorRef" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="姓名" prop="name"><el-input v-model="form.name" placeholder="分销员姓名" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号" prop="phone"><el-input v-model="form.phone" maxlength="11" placeholder="手机号" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="类型" prop="distType">
              <el-select v-model="form.distType" placeholder="类型" style="width: 100%">
                <el-option label="忠实客户" value="1" /><el-option label="兼职理疗师" value="2" /><el-option label="内部员工" value="3" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="归属门店" prop="storeId">
              <el-select v-model="form.storeId" clearable filterable placeholder="门店" style="width: 100%">
                <el-option v-for="s in storeOptions" :key="s.storeId" :label="s.storeName" :value="s.storeId" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="关联客户" prop="customerId">
              <el-select v-model="form.customerId" clearable filterable remote :remote-method="searchCustomer"
                :loading="customerLoading" placeholder="输入客户姓名/手机号" style="width: 100%">
                <el-option v-for="c in customerOptions" :key="c.customerId" :label="c.name + ' / ' + c.phone" :value="c.customerId" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="专属比例%" prop="rate">
              <el-input-number v-model="form.rate" :min="0" :max="100" :precision="2" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邀请码" prop="inviteCode">
              <el-input v-model="form.inviteCode" placeholder="留空由系统生成" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio value="0">正常</el-radio>
                <el-radio value="1">停用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注" prop="remark"><el-input v-model="form.remark" type="textarea" placeholder="备注" /></el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Distributor">
import { listDistributor, getDistributor, addDistributor, updateDistributor, delDistributor } from "@/api/hc/distribution"
import { listStore } from "@/api/hc/basic"
import { listCustomer } from "@/api/hc/card"

const { proxy } = getCurrentInstance()
const list = ref([])
const storeOptions = ref([])
const customerOptions = ref([])
const customerLoading = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref("")
const open = ref(false)
const ids = ref([])
const queryParams = ref({
  pageNum: 1, pageSize: 10, name: undefined, phone: undefined, inviteCode: undefined,
  distType: undefined, storeId: undefined, status: undefined
})
const data = {
  form: {},
  rules: {
    name: [{ required: true, message: "姓名不能为空", trigger: "blur" }],
    phone: [{ pattern: /^1[3-9]\d{9}$/, message: "请输入正确的手机号码", trigger: "blur" }],
    distType: [{ required: true, message: "类型不能为空", trigger: "change" }]
  }
}
const { form, rules } = toRefs(data)

function distTypeLabel(v) {
  return { "1": "忠实客户", "2": "兼职理疗师", "3": "内部员工" }[v] || v
}
function getList() {
  loading.value = true
  listDistributor(queryParams.value).then(response => {
    list.value = response.rows
    total.value = response.total
    loading.value = false
  })
}
function searchCustomer(keyword) {
  if (!keyword) return
  customerLoading.value = true
  listCustomer({ pageNum: 1, pageSize: 20, name: keyword }).then(response => {
    customerOptions.value = response.rows || []
    customerLoading.value = false
  })
}
function cancel() { open.value = false; reset() }
function reset() {
  form.value = { distributorId: undefined, name: undefined, phone: undefined, customerId: undefined, storeId: undefined,
    distType: "1", inviteCode: undefined, rate: undefined, status: "0", remark: undefined }
  proxy.resetForm("distributorRef")
}
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm("queryRef"); handleQuery() }
function handleSelectionChange(selection) { ids.value = selection.map(item => item.distributorId); multiple.value = !selection.length }
function handleAdd() { reset(); title.value = "添加分销员"; open.value = true }
function handleUpdate(row) {
  reset()
  getDistributor(row.distributorId || ids.value[0]).then(response => {
    form.value = response.data
    if (form.value.customerId) customerOptions.value = [{ customerId: form.value.customerId, name: form.value.customerName, phone: "" }]
    title.value = "修改分销员"
    open.value = true
  })
}
function submitForm() {
  proxy.$refs["distributorRef"].validate(valid => {
    if (valid) {
      if (form.value.distributorId != undefined) {
        updateDistributor(form.value).then(() => { proxy.$modal.msgSuccess("修改成功"); open.value = false; getList() })
      } else {
        addDistributor(form.value).then(() => { proxy.$modal.msgSuccess("新增成功"); open.value = false; getList() })
      }
    }
  })
}
function handleDelete(row) {
  const distributorIds = row.distributorId || ids.value
  proxy.$modal.confirm('是否确认删除选中的分销员？删除后其历史佣金记录仍保留。').then(function () {
    return delDistributor(distributorIds)
  }).then(() => { getList(); proxy.$modal.msgSuccess("删除成功") }).catch(() => {})
}
function handleExport() {
  proxy.download("hc/distributor/export", { ...queryParams.value }, `distributor_${new Date().getTime()}.xlsx`)
}
listStore({ pageNum: 1, pageSize: 200, status: "0" }).then(response => { storeOptions.value = response.rows || [] })
getList()
</script>
