<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="活动名称" prop="activityName">
        <el-input v-model="queryParams.activityName" placeholder="活动名称" clearable style="width: 160px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="活动状态" prop="status">
        <el-select v-model="queryParams.status" clearable placeholder="状态" style="width: 120px">
          <el-option v-for="d in hc_group_activity_status" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5"><el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['hc:group:add']">新增活动</el-button></el-col>
      <el-col :span="1.5"><el-button type="warning" plain icon="AlarmClock" @click="handleCloseExpired" v-hasPermi="['hc:group:edit']">手动结算</el-button></el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="list">
      <el-table-column label="活动号" prop="activityId" width="80" />
      <el-table-column label="活动名称" prop="activityName" width="170" show-overflow-tooltip />
      <el-table-column label="卡项" prop="defName" width="140" show-overflow-tooltip />
      <el-table-column label="项目" prop="itemName" width="130" show-overflow-tooltip />
      <el-table-column label="成团人数" prop="groupSize" width="90" align="center" />
      <el-table-column label="成团单价" prop="groupPrice" width="100" align="right" />
      <el-table-column label="开始时间" prop="startTime" width="160" />
      <el-table-column label="结束时间" prop="endTime" width="160" />
      <el-table-column label="限参团" prop="limitPerCustomer" width="80" align="center" />
      <el-table-column label="已参团" prop="joinedCount" width="80" align="center" />
      <el-table-column label="状态" width="90" align="center">
        <template #default="scope"><dict-tag :options="hc_group_activity_status" :value="scope.row.status" /></template>
      </el-table-column>
      <el-table-column label="下发" width="80" align="center">
        <template #default="scope">
          <el-tag v-if="scope.row.publishFlag === '1'" type="success">已下发</el-tag>
          <el-tag v-else type="info">未下发</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="330" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button v-if="scope.row.status === '0'" link type="success" icon="Plus" @click="openJoin(scope.row)" v-hasPermi="['hc:group:join']">参团登记</el-button>
          <el-button link type="warning" icon="Promotion" @click="openPublish(scope.row)" v-hasPermi="['hc:group:publish']">下发</el-button>
          <el-button link type="primary" icon="Tickets" @click="openStores(scope.row)" v-hasPermi="['hc:group:list']">确认清单</el-button>
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['hc:group:edit']">修改</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['hc:group:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="title" v-model="open" width="680px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-row>
          <el-col :span="12"><el-form-item label="活动名称" prop="activityName"><el-input v-model="form.activityName" maxlength="100" /></el-form-item></el-col>
          <el-col :span="12">
            <el-form-item label="关联卡项" prop="defId">
              <el-select v-model="form.defId" filterable placeholder="请选择卡项" style="width: 100%">
                <el-option v-for="d in defOptions" :key="d.defId" :label="d.defName" :value="d.defId" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12"><el-form-item label="项目名称"><el-input v-model="form.itemName" maxlength="100" placeholder="不填默认取卡项名称" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="成团单价" prop="groupPrice"><el-input-number v-model="form.groupPrice" :min="0.01" :precision="2" style="width: 100%" /></el-form-item></el-col>
        </el-row>
        <el-row>
          <el-col :span="12"><el-form-item label="成团人数" prop="groupSize"><el-input-number v-model="form.groupSize" :min="2" :max="20" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="每人限参团" prop="limitPerCustomer"><el-input-number v-model="form.limitPerCustomer" :min="1" :max="10" style="width: 100%" /></el-form-item></el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="开始时间" prop="startTime">
              <el-date-picker v-model="form.startTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="开始时间" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束时间" prop="endTime">
              <el-date-picker v-model="form.endTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="结束时间" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="活动状态" prop="status">
              <el-radio-group v-model="form.status"><el-radio value="0">进行中</el-radio><el-radio value="1">已结束</el-radio></el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" /></el-form-item>
      </el-form>
      <template #footer><div class="dialog-footer"><el-button type="primary" @click="submitForm">确 定</el-button><el-button @click="open = false">取 消</el-button></div></template>
    </el-dialog>

    <el-dialog title="参团登记" v-model="joinOpen" width="480px" append-to-body>
      <el-form label-width="100px">
        <el-form-item label="活动"><el-input :model-value="joinActivity.activityName" disabled /></el-form-item>
        <el-form-item label="客户" required>
          <el-select v-model="joinForm.customerId" filterable placeholder="选择客户" style="width: 100%">
            <el-option v-for="c in customerOptions" :key="c.customerId" :label="c.name + '（' + c.phone + '）'" :value="c.customerId" />
          </el-select>
        </el-form-item>
        <el-form-item label="团号">
          <el-input v-model="joinForm.groupNo" maxlength="32" placeholder="留空则自动开新团（团长）" />
        </el-form-item>
        <el-form-item label="门店">
          <el-select v-model="joinForm.storeId" clearable placeholder="默认取客户归属门店" style="width: 100%">
            <el-option v-for="s in storeOptions" :key="s.storeId" :label="s.storeName" :value="s.storeId" />
          </el-select>
        </el-form-item>
        <el-form-item label="提示">
          <span style="color: #909399">成团单价 {{ joinActivity.groupPrice }} 元，满 {{ joinActivity.groupSize }} 人自动成团发卡</span>
        </el-form-item>
      </el-form>
      <template #footer><div class="dialog-footer"><el-button type="primary" @click="submitJoin">确 定</el-button><el-button @click="joinOpen = false">取 消</el-button></div></template>
    </el-dialog>

    <!-- M8 活动下发：总部选择目标门店（不选=全部营业中门店） -->
    <el-dialog title="下发活动到门店" v-model="publishOpen" width="560px" append-to-body>
      <el-form label-width="100px">
        <el-form-item label="活动"><el-input :model-value="publishActivityRow.activityName" disabled /></el-form-item>
        <el-form-item label="总部活动价"><el-input :model-value="publishActivityRow.groupPrice + ' 元 / ' + publishActivityRow.groupSize + ' 人成团'" disabled /></el-form-item>
        <el-form-item label="目标门店">
          <el-select v-model="publishStoreIds" multiple filterable collapse-tags collapse-tags-tooltip clearable placeholder="留空则下发到全部营业中门店" style="width: 100%">
            <el-option v-for="s in storeOptions" :key="s.storeId" :label="s.storeName" :value="s.storeId" />
          </el-select>
        </el-form-item>
        <el-form-item label="提示">
          <span style="color: #909399">下发后门店需在本页“确认清单”中确认执行，确认后方可参与本门店参团登记</span>
        </el-form-item>
      </el-form>
      <template #footer><div class="dialog-footer"><el-button type="primary" @click="submitPublish">确 定</el-button><el-button @click="publishOpen = false">取 消</el-button></div></template>
    </el-dialog>

    <!-- M8 下发确认清单 -->
    <el-dialog :title="'活动确认清单 - ' + (storeDlgActivity.activityName || '')" v-model="storeOpen" width="900px" append-to-body>
      <el-table v-loading="storeLoading" :data="storeRows" max-height="420">
        <el-table-column label="门店" prop="storeName" width="160" show-overflow-tooltip />
        <el-table-column label="总部价" prop="groupPrice" width="90" align="right">
          <template #default="scope">{{ scope.row.groupPrice != null ? scope.row.groupPrice : (storeDlgActivity.groupPrice || '-') }}</template>
        </el-table-column>
        <el-table-column label="门店活动价" width="130" align="right">
          <template #default="scope">{{ scope.row.priceOverride != null ? scope.row.priceOverride : '-' }}</template>
        </el-table-column>
        <el-table-column label="执行状态" width="100" align="center">
          <template #default="scope">
            <el-tag :type="{ '0': 'info', '1': 'success', '2': 'danger' }[scope.row.confirmStatus]">{{ { '0': '待确认', '1': '已执行', '2': '不执行' }[scope.row.confirmStatus] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="确认人" prop="confirmBy" width="100" />
        <el-table-column label="确认时间" prop="confirmTime" width="160" />
        <el-table-column label="操作" align="center" width="220">
          <template #default="scope">
            <el-button link type="success" icon="Select" @click="doConfirm(scope.row, '1')" v-hasPermi="['hc:group:confirm']">确认执行</el-button>
            <el-button link type="warning" icon="Edit" @click="doConfirmPrice(scope.row)" v-hasPermi="['hc:group:confirm']">改价执行</el-button>
            <el-button link type="danger" icon="Close" @click="doConfirm(scope.row, '2')" v-hasPermi="['hc:group:confirm']">不执行</el-button>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-show="storeTotal > 0" :total="storeTotal" v-model:page="storeQuery.pageNum" v-model:limit="storeQuery.pageSize" @pagination="getActivityStores" />
      <template #footer><div class="dialog-footer"><el-button @click="storeOpen = false">关 闭</el-button></div></template>
    </el-dialog>
  </div>
</template>

<script setup name="HcGroupActivity">
import { listGroupActivity, getGroupActivity, addGroupActivity, updateGroupActivity, delGroupActivity, joinGroup, closeExpiredGroup, publishActivity, listActivityStore, confirmActivityStore } from "@/api/hc/growth"
import { optionCardDef, listStore } from "@/api/hc/basic"
import { listCustomer } from "@/api/hc/card"

const { proxy } = getCurrentInstance()
const { hc_group_activity_status } = proxy.useDict("hc_group_activity_status")
const list = ref([])
const defOptions = ref([])
const storeOptions = ref([])
const customerOptions = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const title = ref("")
const open = ref(false)
const joinOpen = ref(false)
const joinActivity = ref({})
const joinForm = ref({})
const publishOpen = ref(false)
const publishActivityRow = ref({})
const publishStoreIds = ref([])
const storeOpen = ref(false)
const storeLoading = ref(false)
const storeRows = ref([])
const storeTotal = ref(0)
const storeDlgActivity = ref({})
const storeQuery = ref({ pageNum: 1, pageSize: 10, activityId: undefined })
const queryParams = ref({ pageNum: 1, pageSize: 10, activityName: undefined, status: undefined })
const form = ref({})
const rules = {
  activityName: [{ required: true, message: "活动名称不能为空", trigger: "blur" }],
  defId: [{ required: true, message: "请选择关联卡项", trigger: "change" }],
  groupPrice: [{ required: true, message: "成团单价必须大于0", trigger: "blur" }],
  groupSize: [{ required: true, message: "成团人数不能为空", trigger: "blur" }]
}

function getList() {
  loading.value = true
  listGroupActivity(queryParams.value).then(response => {
    list.value = response.rows
    total.value = response.total
    loading.value = false
  })
}
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm("queryRef"); handleQuery() }
function reset() {
  form.value = { activityId: undefined, activityName: undefined, defId: undefined, itemName: undefined, groupSize: 3, groupPrice: undefined, startTime: undefined, endTime: undefined, limitPerCustomer: 1, status: "0", remark: undefined }
  proxy.resetForm("formRef")
}
function handleAdd() { reset(); open.value = true; title.value = "新增拼团活动" }
function handleUpdate(row) {
  reset()
  getGroupActivity(row.activityId).then(response => { form.value = response.data; open.value = true; title.value = "修改拼团活动" })
}
function submitForm() {
  proxy.$refs["formRef"].validate(valid => {
    if (!valid) return
    const fn = form.value.activityId ? updateGroupActivity : addGroupActivity
    fn(form.value).then(r => {
      proxy.$modal.msgSuccess(r.msg || "操作成功")
      open.value = false
      getList()
    })
  })
}
function handleDelete(row) {
  proxy.$modal.confirm('确认删除活动"' + row.activityName + '"？').then(() => delGroupActivity(row.activityId))
    .then(() => { getList(); proxy.$modal.msgSuccess("删除成功") }).catch(() => {})
}
function handleCloseExpired() {
  proxy.$modal.confirm("按当前时间结算所有已到期活动，未成团的团将置为失败？").then(() => closeExpiredGroup())
    .then(r => { proxy.$modal.msgSuccess(r.msg || "结算完成"); getList() }).catch(() => {})
}
function openJoin(row) {
  joinActivity.value = row
  joinForm.value = { activityId: row.activityId, customerId: undefined, groupNo: undefined, storeId: undefined }
  joinOpen.value = true
}
function submitJoin() {
  const f = joinForm.value
  if (!f.customerId) return proxy.$modal.msgError("请选择客户")
  const payload = { activityId: f.activityId, customerId: f.customerId }
  if (f.groupNo) payload.groupNo = f.groupNo
  if (f.storeId) payload.storeId = f.storeId
  joinGroup(payload).then(r => {
    proxy.$modal.msgSuccess(r.msg || "参团成功")
    joinOpen.value = false
    getList()
  })
}

function openPublish(row) {
  publishActivityRow.value = row
  publishStoreIds.value = []
  publishOpen.value = true
}
function submitPublish() {
  const payload = { activityId: publishActivityRow.value.activityId, storeIds: publishStoreIds.value }
  publishActivity(payload).then(r => {
    proxy.$modal.msgSuccess(r.msg || "下发成功")
    publishOpen.value = false
    getList()
  })
}
function openStores(row) {
  storeDlgActivity.value = row
  storeQuery.value = { pageNum: 1, pageSize: 10, activityId: row.activityId }
  storeOpen.value = true
  getActivityStores()
}
function getActivityStores() {
  storeLoading.value = true
  listActivityStore(storeQuery.value).then(r => {
    storeRows.value = r.rows || []
    storeTotal.value = r.total || 0
    storeLoading.value = false
  }).catch(() => { storeLoading.value = false })
}
function doConfirm(row, confirmStatus) {
  const tip = confirmStatus === '1' ? '确认该门店执行此活动？' : '确认该门店不执行此活动？（不执行后本店不可参团登记）'
  proxy.$modal.confirm(tip).then(() => confirmActivityStore({ id: row.id, confirmStatus: confirmStatus, priceOverride: confirmStatus === '1' ? row.priceOverride : undefined }))
    .then(() => { proxy.$modal.msgSuccess("已确认"); getActivityStores(); getList() }).catch(() => {})
}
function doConfirmPrice(row) {
  proxy.$modal.prompt("请输入该门店的活动价（元），将覆盖总部价 " + (row.groupPrice != null ? row.groupPrice : storeDlgActivity.value.groupPrice), "改价执行", {
    inputPattern: /^\d+(\.\d{1,2})?$/,
    inputErrorMessage: "请输入正确的金额"
  }).then(({ value }) => confirmActivityStore({ id: row.id, confirmStatus: "1", priceOverride: Number(value) }))
    .then(() => { proxy.$modal.msgSuccess("已改价并确认执行"); getActivityStores() }).catch(() => {})
}

optionCardDef().then(r => defOptions.value = r.data || [])
listStore({ pageNum: 1, pageSize: 200 }).then(r => storeOptions.value = r.rows)
listCustomer({ pageNum: 1, pageSize: 500 }).then(r => customerOptions.value = r.rows)
getList()
</script>
