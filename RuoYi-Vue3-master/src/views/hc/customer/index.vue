<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="姓名" prop="name">
        <el-input v-model="queryParams.name" placeholder="客户姓名" clearable style="width: 140px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="手机号" prop="phone">
        <el-input v-model="queryParams.phone" placeholder="手机号" clearable style="width: 150px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="体质" prop="constitution">
        <el-select v-model="queryParams.constitution" clearable placeholder="体质" style="width: 130px">
          <el-option v-for="d in hc_constitution" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="标签" prop="tagIds">
        <el-select v-model="queryParams.tagIds" clearable placeholder="标签" style="width: 140px">
          <el-option v-for="d in hc_customer_tag" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row class="mb8">
      <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['hc:customer:add']">新增</el-button>
      <el-button type="danger" plain icon="Delete" :disabled="!multiple.length" @click="handleDelete()" v-hasPermi="['hc:customer:remove']">删除</el-button>
    </el-row>

    <el-table v-loading="loading" :data="list" @selection-change="v => multiple = v">
      <el-table-column type="selection" width="50" />
      <el-table-column label="客户号" prop="customerNo" width="140" />
      <el-table-column label="姓名" prop="name" width="90" />
      <el-table-column label="手机号" prop="phone" width="120" />
      <el-table-column label="身份证号" prop="idNo" width="170" :show-overflow-tooltip="true">
        <template #default="scope">{{ scope.row.idNo || '-' }}</template>
      </el-table-column>
      <el-table-column label="性别" width="60" align="center">
        <template #default="scope">{{ scope.row.gender === '1' ? '男' : scope.row.gender === '2' ? '女' : '未知' }}</template>
      </el-table-column>
      <el-table-column label="体质" width="90" align="center">
        <template #default="scope"><dict-tag :options="hc_constitution" :value="scope.row.constitution" /></template>
      </el-table-column>
      <el-table-column label="标签" width="160" :show-overflow-tooltip="true">
        <template #default="scope">{{ tagNames(scope.row.tagIds) }}</template>
      </el-table-column>
      <el-table-column label="来源" width="100" align="center">
        <template #default="scope"><dict-tag :options="hc_source_channel" :value="scope.row.sourceChannel" /></template>
      </el-table-column>
      <el-table-column label="会员等级" prop="memberLevel" width="80" align="center" />
      <el-table-column label="累计消费" prop="totalAmount" width="100" align="right" />
      <el-table-column label="核销次数" prop="verifyCount" width="80" align="center" />
      <el-table-column label="最近核销" width="110">
        <template #default="scope">{{ parseTime(scope.row.lastVerifyDate, '{y}-{m}-{d}') }}</template>
      </el-table-column>
      <el-table-column label="主理门店" prop="mainStoreName" width="110" :show-overflow-tooltip="true" />
      <el-table-column label="状态" width="80" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.status === '0' ? 'success' : 'info'">{{ scope.row.status === '0' ? '正常' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="150" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['hc:customer:edit']">修改</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['hc:customer:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="title" v-model="open" width="680px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="12"><el-form-item label="姓名" prop="name"><el-input v-model="form.name" maxlength="30" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="手机号" prop="phone"><el-input v-model="form.phone" maxlength="20" /></el-form-item></el-col>
        </el-row>
        <el-row>
          <el-col :span="12"><el-form-item label="身份证号" prop="idNo"><el-input v-model="form.idNo" maxlength="30" placeholder="实名留档，仅用于医疗合规追溯" /></el-form-item></el-col>
        </el-row>
        <el-alert title="手机号/身份证号/健康结论对无“敏感信息明文”权限的账号默认脱敏展示；保存时掩码值不会覆盖库中原值，如需修改请录入完整号码" type="info" :closable="false" class="mb8" />
        <el-row>
          <el-col :span="12">
            <el-form-item label="性别" prop="gender">
              <el-radio-group v-model="form.gender"><el-radio value="1">男</el-radio><el-radio value="2">女</el-radio><el-radio value="0">未知</el-radio></el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12"><el-form-item label="生日" prop="birthday"><el-date-picker v-model="form.birthday" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item></el-col>
        </el-row>
        <el-row>
          <el-col :span="12"><el-form-item label="来源渠道" prop="sourceChannel">
            <el-select v-model="form.sourceChannel" clearable style="width: 100%">
              <el-option v-for="d in hc_source_channel" :key="d.value" :label="d.label" :value="d.value" />
            </el-select>
          </el-form-item></el-col>
          <el-col :span="12"><el-form-item label="体质倾向" prop="constitution">
            <el-select v-model="form.constitution" clearable style="width: 100%">
              <el-option v-for="d in hc_constitution" :key="d.value" :label="d.label" :value="d.value" />
            </el-select>
          </el-form-item></el-col>
        </el-row>
        <el-form-item label="客户标签" prop="tags">
          <el-select v-model="tagArr" multiple style="width: 100%">
            <el-option v-for="d in hc_customer_tag" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </el-form-item>
        <el-row>
          <el-col :span="12"><el-form-item label="主理门店" prop="mainStoreId">
            <el-select v-model="form.mainStoreId" clearable style="width: 100%">
              <el-option v-for="s in storeOptions" :key="s.storeId" :label="s.storeName" :value="s.storeId" />
            </el-select>
          </el-form-item></el-col>
          <el-col :span="12"><el-form-item label="主理技师" prop="mainTechnicianId">
            <el-select v-model="form.mainTechnicianId" clearable filterable style="width: 100%">
              <el-option v-for="t in techOptions" :key="t.technicianId" :label="t.techName" :value="t.technicianId" />
            </el-select>
          </el-form-item></el-col>
        </el-row>
        <el-row>
          <el-col :span="12"><el-form-item label="会员等级" prop="memberLevel"><el-input-number v-model="form.memberLevel" :min="0" :max="9" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="form.status"><el-radio value="0">正常</el-radio><el-radio value="1">停用</el-radio></el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注" prop="remark"><el-input v-model="form.remark" type="textarea" /></el-form-item>
      </el-form>
      <template #footer><div class="dialog-footer"><el-button type="primary" @click="submitForm">确 定</el-button><el-button @click="open = false">取 消</el-button></div></template>
    </el-dialog>
  </div>
</template>

<script setup name="Customer">
import { listCustomer, getCustomer, addCustomer, updateCustomer, delCustomer } from "@/api/hc/card"
import { listStore, listTechnician } from "@/api/hc/basic"
import { plainOrMasked } from "@/utils/hc/privacy"

const { proxy } = getCurrentInstance()
const { hc_constitution, hc_source_channel, hc_customer_tag } = proxy.useDict("hc_constitution", "hc_source_channel", "hc_customer_tag")
const list = ref([])
const storeOptions = ref([])
const techOptions = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const title = ref("")
const open = ref(false)
const multiple = ref([])
const tagArr = ref([])
const queryParams = ref({ pageNum: 1, pageSize: 10, name: undefined, phone: undefined, constitution: undefined, tagIds: undefined })
const form = ref({})
// 脱敏回显值（含 *）允许原样提交，后端会忽略该字段，不覆盖库中原值
const rules = {
  name: [{ required: true, message: "姓名不能为空", trigger: "blur" }],
  phone: [{ validator: plainOrMasked(/^1[3-9]\d{9}$/), message: "手机号格式不正确", trigger: "blur" }],
  idNo: [{ validator: plainOrMasked(/(^\d{17}[0-9Xx]$)|(^\d{15}$)/), message: "身份证号格式不正确", trigger: "blur" }]
}

function tagNames(ids) {
  if (!ids) return "-"
  return ids.split(",").map(id => { const d = hc_customer_tag.value.find(x => x.value === id); return d ? d.label : id }).join("、")
}
function getList() {
  loading.value = true
  listCustomer(queryParams.value).then(response => {
    list.value = response.rows
    total.value = response.total
    loading.value = false
  })
}
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm("queryRef"); handleQuery() }
function reset() { form.value = { customerId: undefined, name: undefined, phone: undefined, idNo: undefined, gender: "0", birthday: undefined, sourceChannel: undefined, constitution: undefined, mainStoreId: undefined, mainTechnicianId: undefined, tagIds: undefined, memberLevel: 1, status: "0", remark: undefined }; tagArr.value = []; proxy.resetForm("formRef") }
function handleAdd() { reset(); open.value = true; title.value = "添加客户档案" }
function handleUpdate(row) {
  reset()
  getCustomer(row.customerId).then(response => {
    form.value = response.data
    tagArr.value = form.value.tagIds ? form.value.tagIds.split(",") : []
    open.value = true; title.value = "修改客户档案"
  })
}
function submitForm() {
  proxy.$refs["formRef"].validate(valid => {
    if (!valid) return
    form.value.tagIds = tagArr.value.join(",")
    const fn = form.value.customerId ? updateCustomer : addCustomer
    fn(form.value).then(() => {
      proxy.$modal.msgSuccess("操作成功"); open.value = false; getList()
    })
  })
}
function handleDelete(row) {
  const ids = row.customerId || multiple.value.map(r => r.customerId)
  if (!ids || !ids.length) return
  proxy.$modal.confirm('确认删除所选客户档案？').then(() => delCustomer(ids)).then(() => { getList(); proxy.$modal.msgSuccess("删除成功") }).catch(() => {})
}
listStore({ pageNum: 1, pageSize: 200 }).then(r => storeOptions.value = r.rows)
listTechnician({ pageNum: 1, pageSize: 500, status: "0" }).then(r => techOptions.value = r.rows)
getList()
</script>
