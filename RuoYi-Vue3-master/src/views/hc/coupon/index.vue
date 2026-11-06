<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="券名称" prop="name">
        <el-input v-model="queryParams.name" placeholder="券名称" clearable style="width: 150px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="券类型" prop="couponType">
        <el-select v-model="queryParams.couponType" clearable placeholder="类型" style="width: 130px">
          <el-option v-for="d in hc_coupon_type" :key="d.value" :label="d.label" :value="d.value" />
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
      <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['hc:coupon:add']">新增</el-button>
      <el-button type="danger" plain icon="Delete" :disabled="!multiple.length" @click="handleDelete()" v-hasPermi="['hc:coupon:remove']">删除</el-button>
    </el-row>

    <el-table v-loading="loading" :data="list" @selection-change="v => multiple = v">
      <el-table-column type="selection" width="50" />
      <el-table-column label="券名称" prop="name" :show-overflow-tooltip="true" />
      <el-table-column label="类型" width="90" align="center">
        <template #default="scope"><dict-tag :options="hc_coupon_type" :value="scope.row.couponType" /></template>
      </el-table-column>
      <el-table-column label="面额" prop="discountAmount" width="80" align="right" />
      <el-table-column label="门槛" prop="minAmount" width="80" align="right" />
      <el-table-column label="有效期" width="170" align="center">
        <template #default="scope">
          <span v-if="scope.row.validType === '1'">领取后{{ scope.row.validDays }}天</span>
          <span v-else>{{ parseTime(scope.row.startDate, '{y}-{m}-{d}') }} ~ {{ parseTime(scope.row.endDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="发放(已/总)" width="110" align="center">
        <template #default="scope">{{ scope.row.sendCount || 0 }} / {{ scope.row.totalCount === 0 ? '不限' : scope.row.totalCount }}</template>
      </el-table-column>
      <el-table-column label="限领" prop="perLimit" width="70" align="center" />
      <el-table-column label="状态" width="80" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.status === '0' ? 'success' : 'info'">{{ scope.row.status === '0' ? '启用' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="200" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="success" icon="Promotion" @click="openSend(scope.row)" v-hasPermi="['hc:coupon:send']">发放</el-button>
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['hc:coupon:edit']">修改</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['hc:coupon:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="title" v-model="open" width="640px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-row>
          <el-col :span="12"><el-form-item label="券名称" prop="name"><el-input v-model="form.name" maxlength="100" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="券类型" prop="couponType">
            <el-select v-model="form.couponType" style="width: 100%">
              <el-option v-for="d in hc_coupon_type" :key="d.value" :label="d.label" :value="d.value" />
            </el-select>
          </el-form-item></el-col>
        </el-row>
        <el-row>
          <el-col :span="12"><el-form-item label="所属门店" prop="storeId">
            <el-select v-model="form.storeId" clearable placeholder="留空=总部通用券" style="width: 100%">
              <el-option v-for="s in storeOptions" :key="s.storeId" :label="s.storeName" :value="s.storeId" />
            </el-select>
          </el-form-item></el-col>
          <el-col :span="12"><el-form-item label="面额(抵扣)" prop="discountAmount"><el-input-number v-model="form.discountAmount" :min="0.01" :precision="2" style="width: 100%" /></el-form-item></el-col>
        </el-row>
        <el-row>
          <el-col :span="12"><el-form-item label="使用门槛(满)" prop="minAmount"><el-input-number v-model="form.minAmount" :min="0" :precision="2" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="有效期方式" prop="validType">
            <el-radio-group v-model="form.validType"><el-radio value="1">领取后N天</el-radio><el-radio value="2">固定日期</el-radio></el-radio-group>
          </el-form-item></el-col>
        </el-row>
        <el-row v-if="form.validType === '1'">
          <el-col :span="12"><el-form-item label="有效天数" prop="validDays"><el-input-number v-model="form.validDays" :min="1" style="width: 100%" /></el-form-item></el-col>
        </el-row>
        <el-row v-else>
          <el-col :span="12"><el-form-item label="开始日期" prop="startDate"><el-date-picker v-model="form.startDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="截止日期" prop="endDate"><el-date-picker v-model="form.endDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item></el-col>
        </el-row>
        <el-row>
          <el-col :span="12"><el-form-item label="发放总量" prop="totalCount"><el-input-number v-model="form.totalCount" :min="0" style="width: 100%" /><div class="tip">0 表示不限</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="每人限领" prop="perLimit"><el-input-number v-model="form.perLimit" :min="0" style="width: 100%" /><div class="tip">0 表示不限</div></el-form-item></el-col>
        </el-row>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status"><el-radio value="0">启用</el-radio><el-radio value="1">停用</el-radio></el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark"><el-input v-model="form.remark" type="textarea" /></el-form-item>
      </el-form>
      <template #footer><div class="dialog-footer"><el-button type="primary" @click="submitForm">确 定</el-button><el-button @click="open = false">取 消</el-button></div></template>
    </el-dialog>

    <!-- 发放 -->
    <el-dialog :title="'发放优惠券：' + (sendRow.name || '')" v-model="sendOpen" width="480px" append-to-body>
      <el-form label-width="90px">
        <el-form-item label="发放门店">
          <el-select v-model="sendForm.sendStoreId" clearable placeholder="发放门店（可不选）" style="width: 100%">
            <el-option v-for="s in storeOptions" :key="s.storeId" :label="s.storeName" :value="s.storeId" />
          </el-select>
        </el-form-item>
        <el-form-item label="客户" required>
          <el-select v-model="sendCustomerIds" multiple filterable placeholder="可多选客户" style="width: 100%">
            <el-option v-for="c in customerOptions" :key="c.customerId" :label="c.name + '（' + c.customerNo + '）'" :value="c.customerId" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer><div class="dialog-footer"><el-button type="primary" @click="submitSend">确认发放</el-button><el-button @click="sendOpen = false">取 消</el-button></div></template>
    </el-dialog>
  </div>
</template>

<script setup name="Coupon">
import { listCoupon, getCoupon, addCoupon, updateCoupon, delCoupon, sendCoupon } from "@/api/hc/coupon"
import { listCustomer } from "@/api/hc/card"
import { listStore } from "@/api/hc/basic"

const { proxy } = getCurrentInstance()
const { hc_coupon_type } = proxy.useDict("hc_coupon_type")
const list = ref([])
const storeOptions = ref([])
const customerOptions = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const title = ref("")
const open = ref(false)
const sendOpen = ref(false)
const multiple = ref([])
const sendRow = ref({})
const sendForm = ref({})
const sendCustomerIds = ref([])
const queryParams = ref({ pageNum: 1, pageSize: 10, name: undefined, couponType: undefined, status: undefined })
const form = ref({})
const rules = {
  name: [{ required: true, message: "券名称不能为空", trigger: "blur" }],
  couponType: [{ required: true, message: "券类型不能为空", trigger: "change" }],
  discountAmount: [{ required: true, message: "面额不能为空", trigger: "blur" }]
}

function getList() {
  loading.value = true
  listCoupon(queryParams.value).then(response => {
    list.value = response.rows
    total.value = response.total
    loading.value = false
  })
}
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm("queryRef"); handleQuery() }
function reset() {
  form.value = { couponId: undefined, name: undefined, couponType: "1", storeId: undefined, discountAmount: 10, minAmount: 0, validType: "1", validDays: 30, startDate: undefined, endDate: undefined, totalCount: 0, perLimit: 1, status: "0", remark: undefined }
  proxy.resetForm("formRef")
}
function handleAdd() { reset(); open.value = true; title.value = "添加优惠券" }
function handleUpdate(row) {
  reset()
  getCoupon(row.couponId).then(response => { form.value = response.data; open.value = true; title.value = "修改优惠券" })
}
function submitForm() {
  proxy.$refs["formRef"].validate(valid => {
    if (!valid) return
    const fn = form.value.couponId ? updateCoupon : addCoupon
    fn(form.value).then(() => { proxy.$modal.msgSuccess("操作成功"); open.value = false; getList() })
  })
}
function handleDelete(row) {
  const ids = row.couponId || multiple.value.map(r => r.couponId)
  if (!ids || !ids.length) return
  proxy.$modal.confirm('确认删除所选优惠券？').then(() => delCoupon(ids)).then(() => { getList(); proxy.$modal.msgSuccess("删除成功") }).catch(() => {})
}
function openSend(row) {
  sendRow.value = row
  sendForm.value = { sendStoreId: undefined }
  sendCustomerIds.value = []
  sendOpen.value = true
}
function submitSend() {
  if (!sendCustomerIds.value.length) return proxy.$modal.msgError("请选择客户")
  const data = sendCustomerIds.value.map(cid => ({ couponId: sendRow.value.couponId, customerId: cid, sendStoreId: sendForm.value.sendStoreId }))
  sendCoupon(data).then(r => { proxy.$modal.msgSuccess(r.msg || "发放成功"); sendOpen.value = false; getList() })
}
listCustomer({ pageNum: 1, pageSize: 500 }).then(r => customerOptions.value = r.rows)
listStore({ pageNum: 1, pageSize: 200 }).then(r => storeOptions.value = r.rows)
getList()
</script>

<style scoped>
.tip { font-size: 12px; color: #909399; line-height: 18px; }
</style>
