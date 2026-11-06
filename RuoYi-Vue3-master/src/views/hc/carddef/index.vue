<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="卡项名称" prop="defName">
        <el-input v-model="queryParams.defName" placeholder="卡项名称" clearable style="width: 160px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="类型" prop="cardType">
        <el-select v-model="queryParams.cardType" clearable placeholder="类型" style="width: 130px">
          <el-option v-for="d in hc_card_type" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" clearable placeholder="状态" style="width: 120px">
          <el-option label="启用" value="0" /><el-option label="停用" value="1" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row class="mb8">
      <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['hc:carddef:add']">新增</el-button>
      <el-button type="danger" plain icon="Delete" :disabled="!multiple.length" @click="handleDelete()" v-hasPermi="['hc:carddef:remove']">删除</el-button>
    </el-row>

    <el-table v-loading="loading" :data="list" @selection-change="v => multiple = v">
      <el-table-column type="selection" width="50" />
      <el-table-column label="编码" prop="defCode" width="110" />
      <el-table-column label="卡项名称" prop="defName" :show-overflow-tooltip="true" />
      <el-table-column label="类型" width="90" align="center">
        <template #default="scope"><dict-tag :options="hc_card_type" :value="scope.row.cardType" /></template>
      </el-table-column>
      <el-table-column label="售价" prop="price" width="90" align="right" />
      <el-table-column label="赠金" prop="giftAmount" width="90" align="right" />
      <el-table-column label="次数/赠次" width="100" align="center">
        <template #default="scope">{{ scope.row.totalTimes || '-' }} / {{ scope.row.giftTimes || 0 }}</template>
      </el-table-column>
      <el-table-column label="有效期(天)" prop="validDays" width="90" align="center" />
      <el-table-column label="可转赠" width="70" align="center">
        <template #default="scope">{{ scope.row.transferable === '1' ? '是' : '否' }}</template>
      </el-table-column>
      <el-table-column label="可退款" width="70" align="center">
        <template #default="scope">{{ scope.row.refundable === '1' ? '是' : '否' }}</template>
      </el-table-column>
      <el-table-column label="引流卡" width="70" align="center">
        <template #default="scope"><el-tag v-if="scope.row.isHook === '1'" type="warning" size="small">是</el-tag><span v-else>否</span></template>
      </el-table-column>
      <el-table-column label="状态" width="80" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.status === '0' ? 'success' : 'info'">{{ scope.row.status === '0' ? '启用' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="150" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['hc:carddef:edit']">修改</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['hc:carddef:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="title" v-model="open" width="680px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-row>
          <el-col :span="12"><el-form-item label="卡项编码" prop="defCode"><el-input v-model="form.defCode" maxlength="30" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="卡项名称" prop="defName"><el-input v-model="form.defName" maxlength="100" /></el-form-item></el-col>
        </el-row>
        <el-row>
          <el-col :span="12"><el-form-item label="卡项类型" prop="cardType">
            <el-select v-model="form.cardType" style="width: 100%">
              <el-option v-for="d in hc_card_type" :key="d.value" :label="d.label" :value="d.value" />
            </el-select>
          </el-form-item></el-col>
          <el-col :span="12"><el-form-item label="售价(本金)" prop="price"><el-input-number v-model="form.price" :min="0" :precision="2" style="width: 100%" /></el-form-item></el-col>
        </el-row>
        <el-row v-if="form.cardType === '1'">
          <el-col :span="12"><el-form-item label="赠金金额" prop="giftAmount"><el-input-number v-model="form.giftAmount" :min="0" :precision="2" style="width: 100%" /></el-form-item></el-col>
        </el-row>
        <el-row v-if="form.cardType === '2' || form.cardType === '3' || form.cardType === '5'">
          <el-col :span="12"><el-form-item label="总次数" prop="totalTimes"><el-input-number v-model="form.totalTimes" :min="0" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="赠送次数" prop="giftTimes"><el-input-number v-model="form.giftTimes" :min="0" style="width: 100%" /></el-form-item></el-col>
        </el-row>
        <el-row>
          <el-col :span="12"><el-form-item label="有效期(天)" prop="validDays"><el-input-number v-model="form.validDays" :min="0" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="12">
            <el-form-item label="适用门店">
              <el-select v-model="scopeStoreArr" multiple placeholder="留空=全部门店可用" style="width: 100%">
                <el-option v-for="s in storeOptions" :key="s.storeId" :label="s.storeName" :value="String(s.storeId)" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="8"><el-form-item label="可转赠" prop="transferable">
            <el-radio-group v-model="form.transferable"><el-radio value="1">是</el-radio><el-radio value="0">否</el-radio></el-radio-group>
          </el-form-item></el-col>
          <el-col :span="8"><el-form-item label="可退款" prop="refundable">
            <el-radio-group v-model="form.refundable"><el-radio value="1">是</el-radio><el-radio value="0">否</el-radio></el-radio-group>
          </el-form-item></el-col>
          <el-col :span="8"><el-form-item label="引流卡" prop="isHook">
            <el-radio-group v-model="form.isHook"><el-radio value="1">是</el-radio><el-radio value="0">否</el-radio></el-radio-group>
          </el-form-item></el-col>
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

<script setup name="Carddef">
import { listCardDef, getCardDef, addCardDef, updateCardDef, delCardDef, listStore } from "@/api/hc/basic"

const { proxy } = getCurrentInstance()
const { hc_card_type } = proxy.useDict("hc_card_type")
const list = ref([])
const storeOptions = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const title = ref("")
const open = ref(false)
const multiple = ref([])
const scopeStoreArr = ref([])
const queryParams = ref({ pageNum: 1, pageSize: 10, defName: undefined, cardType: undefined, status: undefined })
const form = ref({})
const rules = {
  defName: [{ required: true, message: "卡项名称不能为空", trigger: "blur" }],
  cardType: [{ required: true, message: "卡项类型不能为空", trigger: "change" }],
  price: [{ required: true, message: "售价不能为空", trigger: "blur" }]
}

function getList() {
  loading.value = true
  listCardDef(queryParams.value).then(response => {
    list.value = response.rows
    total.value = response.total
    loading.value = false
  })
}
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm("queryRef"); handleQuery() }
function reset() {
  form.value = { defId: undefined, defCode: undefined, defName: undefined, cardType: "1", price: 0, giftAmount: 0, totalTimes: 0, giftTimes: 0, validDays: 365, transferable: "0", refundable: "1", isHook: "0", status: "0", scopeStoreIds: undefined, remark: undefined }
  scopeStoreArr.value = []; proxy.resetForm("formRef")
}
function handleAdd() { reset(); open.value = true; title.value = "添加卡项" }
function handleUpdate(row) {
  reset()
  getCardDef(row.defId).then(response => {
    form.value = response.data
    scopeStoreArr.value = form.value.scopeStoreIds ? form.value.scopeStoreIds.split(",") : []
    open.value = true; title.value = "修改卡项"
  })
}
function submitForm() {
  proxy.$refs["formRef"].validate(valid => {
    if (!valid) return
    form.value.scopeStoreIds = scopeStoreArr.value.join(",")
    form.value.scopeType = scopeStoreArr.value.length ? "2" : "1"
    const fn = form.value.defId ? updateCardDef : addCardDef
    fn(form.value).then(() => {
      proxy.$modal.msgSuccess("操作成功"); open.value = false; getList()
    })
  })
}
function handleDelete(row) {
  const ids = row.defId || multiple.value.map(r => r.defId)
  if (!ids || !ids.length) return
  proxy.$modal.confirm('确认删除所选卡项？').then(() => delCardDef(ids)).then(() => { getList(); proxy.$modal.msgSuccess("删除成功") }).catch(() => {})
}
listStore({ pageNum: 1, pageSize: 200 }).then(r => storeOptions.value = r.rows)
getList()
</script>
