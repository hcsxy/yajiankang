<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="客户姓名" prop="customerName">
        <el-input v-model="queryParams.customerName" placeholder="客户姓名" clearable style="width: 150px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="预约日期" prop="appointDate">
        <el-date-picker v-model="queryParams.appointDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width: 150px" />
      </el-form-item>
      <el-form-item label="状态" prop="appointStatus">
        <el-select v-model="queryParams.appointStatus" clearable placeholder="状态" style="width: 130px">
          <el-option label="待到店" value="0" /><el-option label="已到店" value="1" /><el-option label="已完成" value="2" /><el-option label="已取消" value="3" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row class="mb8">
      <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['hc:appointment:add']">新增预约</el-button>
      <el-alert title="同技师同日同时段不可重复预约；选定设备后同一时段也不可重复占用（后端校验）；状态改为“已到店”自动记录到店时间" type="info" :closable="false" class="mb8" style="width: 620px" />
    </el-row>

    <el-table v-loading="loading" :data="list">
      <el-table-column label="预约号" prop="appointNo" width="170" />
      <el-table-column label="客户" prop="customerName" width="90" />
      <el-table-column label="门店" prop="storeName" width="120" :show-overflow-tooltip="true" />
      <el-table-column label="技师" prop="technicianName" width="90" />
      <el-table-column label="设备" prop="deviceName" width="120" :show-overflow-tooltip="true">
        <template #default="scope">{{ scope.row.deviceName || '-' }}</template>
      </el-table-column>
      <el-table-column label="项目" prop="itemName" :show-overflow-tooltip="true" />
      <el-table-column label="预约日期" width="110">
        <template #default="scope">{{ parseTime(scope.row.appointDate, '{y}-{m}-{d}') }}</template>
      </el-table-column>
      <el-table-column label="时段" prop="appointTime" width="120" align="center" />
      <el-table-column label="状态" width="90" align="center">
        <template #default="scope">
          <el-tag :type="['', 'warning', 'success', 'info'][Number(scope.row.appointStatus)]">{{ ['待到店', '已到店', '已完成', '已取消'][Number(scope.row.appointStatus)] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="到店时间" width="150">
        <template #default="scope">{{ parseTime(scope.row.arriveTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="230" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button v-if="scope.row.appointStatus === '0'" link type="success" icon="Position" @click="changeStatus(scope.row, '1')" v-hasPermi="['hc:appointment:edit']">到店</el-button>
          <el-button v-if="scope.row.appointStatus === '1'" link type="primary" icon="Select" @click="changeStatus(scope.row, '2')" v-hasPermi="['hc:appointment:edit']">完成</el-button>
          <el-button v-if="scope.row.appointStatus === '0'" link type="warning" icon="Close" @click="changeStatus(scope.row, '3')" v-hasPermi="['hc:appointment:edit']">取消</el-button>
          <el-button v-if="scope.row.appointStatus === '0'" link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['hc:appointment:edit']">修改</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['hc:appointment:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="title" v-model="open" width="600px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="客户" prop="customerId">
          <el-select v-model="form.customerId" filterable remote :remote-method="searchCustomer" placeholder="输入姓名/手机号搜索" style="width: 100%">
            <el-option v-for="c in customerOptions" :key="c.customerId" :label="c.name + '（' + (c.phone || '') + '）'" :value="c.customerId" />
          </el-select>
        </el-form-item>
        <el-row>
          <el-col :span="12"><el-form-item label="门店" prop="storeId">
            <el-select v-model="form.storeId" style="width: 100%">
              <el-option v-for="s in storeOptions" :key="s.storeId" :label="s.storeName" :value="s.storeId" />
            </el-select>
          </el-form-item></el-col>
          <el-col :span="12"><el-form-item label="技师" prop="technicianId">
            <el-select v-model="form.technicianId" filterable style="width: 100%">
              <el-option v-for="t in techOptions" :key="t.technicianId" :label="t.techName" :value="t.technicianId" />
            </el-select>
          </el-form-item></el-col>
        </el-row>
        <el-row>
          <el-col :span="12"><el-form-item label="治疗设备" prop="deviceId">
            <el-select v-model="form.deviceId" filterable clearable placeholder="可不选，占用时按时段校验" style="width: 100%">
              <el-option v-for="d in deviceList" :key="d.deviceId" :label="d.deviceName + '（' + (d.storeName || '') + '）'" :value="d.deviceId" />
            </el-select>
          </el-form-item></el-col>
        </el-row>
        <el-form-item label="项目" prop="defId">
          <el-select v-model="form.defId" clearable placeholder="可不选" style="width: 100%" @change="onDefChange">
            <el-option v-for="d in defOptions" :key="d.defId" :label="d.defName" :value="d.defId" />
          </el-select>
        </el-form-item>
        <el-row>
          <el-col :span="12"><el-form-item label="预约日期" prop="appointDate"><el-date-picker v-model="form.appointDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="时段" prop="appointTime">
            <el-select v-model="form.appointTime" style="width: 100%">
              <el-option v-for="t in timeSlots" :key="t" :label="t" :value="t" />
            </el-select>
          </el-form-item></el-col>
        </el-row>
        <el-form-item label="备注" prop="remark"><el-input v-model="form.remark" type="textarea" /></el-form-item>
      </el-form>
      <template #footer><div class="dialog-footer"><el-button type="primary" @click="submitForm">确 定</el-button><el-button @click="open = false">取 消</el-button></div></template>
    </el-dialog>
  </div>
</template>

<script setup name="Appointment">
import { listAppointment, addAppointment, updateAppointment, delAppointment } from "@/api/hc/appointment"
import { listCustomer } from "@/api/hc/card"
import { listStore, listTechnician, listCardDef } from "@/api/hc/basic"
import { deviceOptions } from "@/api/hc/device"

const { proxy } = getCurrentInstance()
const list = ref([])
const customerOptions = ref([])
const storeOptions = ref([])
const techOptions = ref([])
const defOptions = ref([])
const deviceList = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const title = ref("")
const open = ref(false)
const timeSlots = ref(["09:00-10:00", "10:00-11:00", "11:00-12:00", "13:00-14:00", "14:00-15:00", "15:00-16:00", "16:00-17:00", "17:00-18:00", "18:00-19:00", "19:00-20:00"])
const queryParams = ref({ pageNum: 1, pageSize: 10, customerName: undefined, appointDate: undefined, appointStatus: undefined })
const form = ref({})
const rules = {
  customerId: [{ required: true, message: "客户不能为空", trigger: "change" }],
  storeId: [{ required: true, message: "门店不能为空", trigger: "change" }],
  technicianId: [{ required: true, message: "技师不能为空", trigger: "change" }],
  appointDate: [{ required: true, message: "预约日期不能为空", trigger: "change" }],
  appointTime: [{ required: true, message: "时段不能为空", trigger: "change" }]
}

function searchCustomer(kw) {
  listCustomer({ pageNum: 1, pageSize: 20, name: kw, phone: /^[0-9]*$/.test(kw || '') ? kw : undefined }).then(r => customerOptions.value = r.rows)
}
function onDefChange(defId) {
  const d = defOptions.value.find(x => x.defId === defId)
  form.value.itemName = d ? d.defName : undefined
}
function getList() {
  loading.value = true
  listAppointment(queryParams.value).then(response => {
    list.value = response.rows
    total.value = response.total
    loading.value = false
  })
}
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm("queryRef"); handleQuery() }
function reset() { form.value = { appointId: undefined, customerId: undefined, storeId: undefined, technicianId: undefined, deviceId: undefined, defId: undefined, itemName: undefined, appointDate: undefined, appointTime: undefined, remark: undefined }; proxy.resetForm("formRef") }
function handleAdd() { reset(); searchCustomer(''); open.value = true; title.value = "新增预约" }
function handleUpdate(row) {
  reset()
  form.value = { ...row }
  customerOptions.value = [{ customerId: row.customerId, name: row.customerName, phone: '' }]
  open.value = true; title.value = "修改预约"
}
function submitForm() {
  proxy.$refs["formRef"].validate(valid => {
    if (!valid) return
    const fn = form.value.appointId ? updateAppointment : addAppointment
    fn(form.value).then(() => {
      proxy.$modal.msgSuccess("操作成功"); open.value = false; getList()
    })
  })
}
function changeStatus(row, status) {
  const names = { '1': '已到店', '2': '已完成', '3': '已取消' }
  proxy.$modal.confirm('确认将预约"' + row.appointNo + '"标记为' + names[status] + '？').then(() => updateAppointment({ appointId: row.appointId, appointStatus: status }))
    .then(() => { getList(); proxy.$modal.msgSuccess("状态已更新") }).catch(() => {})
}
function handleDelete(row) {
  proxy.$modal.confirm('确认删除预约"' + row.appointNo + '"？').then(() => delAppointment(row.appointId))
    .then(() => { getList(); proxy.$modal.msgSuccess("删除成功") }).catch(() => {})
}
listStore({ pageNum: 1, pageSize: 200 }).then(r => storeOptions.value = r.rows)
listTechnician({ pageNum: 1, pageSize: 500, status: "0" }).then(r => techOptions.value = r.rows)
listCardDef({ pageNum: 1, pageSize: 500, status: "0" }).then(r => defOptions.value = r.rows)
deviceOptions().then(r => deviceList.value = r.data || [])
getList()
</script>
