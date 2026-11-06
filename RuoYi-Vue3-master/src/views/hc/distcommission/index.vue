<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="分销员" prop="distributorName">
        <el-input v-model="queryParams.distributorName" placeholder="分销员姓名" clearable style="width: 140px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="订单号" prop="orderNo">
        <el-input v-model="queryParams.orderNo" placeholder="订单号" clearable style="width: 160px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="成交门店" prop="storeId">
        <el-select v-model="queryParams.storeId" clearable filterable placeholder="门店" style="width: 150px">
          <el-option v-for="s in storeOptions" :key="s.storeId" :label="s.storeName" :value="s.storeId" />
        </el-select>
      </el-form-item>
      <el-form-item label="卡项类型" prop="cardType">
        <el-select v-model="queryParams.cardType" clearable placeholder="类型" style="width: 120px">
          <el-option v-for="c in cardTypes" :key="c.value" :label="c.label" :value="c.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="结算状态" prop="settleStatus">
        <el-select v-model="queryParams.settleStatus" clearable placeholder="状态" style="width: 110px">
          <el-option label="待结算" value="0" /><el-option label="已结算" value="1" /><el-option label="已作废" value="2" />
        </el-select>
      </el-form-item>
      <el-form-item label="计佣日期">
        <el-date-picker v-model="dateRange" type="daterange" value-format="YYYY-MM-DD" start-placeholder="开始" end-placeholder="结束" style="width: 240px" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="16" class="mb8">
      <el-col :span="4"><div class="summary-card"><div class="label">计佣笔数</div><div class="value">{{ summary.commissionCount || 0 }}</div></div></el-col>
      <el-col :span="5"><div class="summary-card"><div class="label">计费基数合计</div><div class="value">{{ summary.baseAmount || 0 }}</div></div></el-col>
      <el-col :span="5"><div class="summary-card"><div class="label">应计佣金</div><div class="value">{{ summary.totalAmount || 0 }}</div></div></el-col>
      <el-col :span="5"><div class="summary-card"><div class="label">待结算</div><div class="value warn">{{ summary.pendingAmount || 0 }}</div></div></el-col>
      <el-col :span="4"><div class="summary-card"><div class="label">已结算 / 已作废</div><div class="value">{{ summary.settledAmount || 0 }} / {{ summary.voidedAmount || 0 }}</div></div></el-col>
    </el-row>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['hc:distCommission:add']">手工补录</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="Check" :disabled="pendingSelected === 0" @click="handleSettle" v-hasPermi="['hc:distCommission:settle']">批量结算</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete" v-hasPermi="['hc:distCommission:remove']">删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['hc:distCommission:export']">导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <el-alert title="售卡收款时按邀请码/客户归属自动计佣（幂等）；退款审批通过后自动冲减作废；结算仅对「待结算」记录生效" type="info" :closable="false" class="mb8" />

    <el-table v-loading="loading" :data="list" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="分销员" prop="distributorName" width="100" />
      <el-table-column label="订单号" prop="orderNo" width="160" :show-overflow-tooltip="true" />
      <el-table-column label="成交客户" prop="customerName" width="100" />
      <el-table-column label="成交门店" prop="storeName" width="120" :show-overflow-tooltip="true" />
      <el-table-column label="门店类型" width="100" align="center">
        <template #default="scope">{{ storeTypeLabel(scope.row.storeType) }}</template>
      </el-table-column>
      <el-table-column label="卡项类型" width="100" align="center">
        <template #default="scope">{{ cardTypeLabel(scope.row.cardType) }}</template>
      </el-table-column>
      <el-table-column label="计费基数" prop="baseAmount" width="100" align="right" />
      <el-table-column label="方式" width="80" align="center">
        <template #default="scope">{{ scope.row.calcType === '2' ? '固定' : '比例' }}</template>
      </el-table-column>
      <el-table-column label="比例%" prop="rate" width="80" align="right" />
      <el-table-column label="佣金金额" prop="commissionAmount" width="100" align="right" />
      <el-table-column label="状态" width="90" align="center">
        <template #default="scope">
          <el-tag :type="statusTag(scope.row.settleStatus)">{{ statusLabel(scope.row.settleStatus) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="结算单号" prop="settleNo" width="160" :show-overflow-tooltip="true" />
      <el-table-column label="计佣时间" width="160">
        <template #default="scope">{{ parseTime(scope.row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="180" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-if="scope.row.settleStatus === '0'" v-hasPermi="['hc:distCommission:edit']">修改</el-button>
          <el-button link type="primary" icon="Coin" @click="handleSettle(scope.row)" v-if="scope.row.settleStatus === '0'" v-hasPermi="['hc:distCommission:settle']">结算</el-button>
          <el-button link type="danger" icon="RefreshLeft" @click="handleVoid(scope.row)" v-if="scope.row.settleStatus !== '2'" v-hasPermi="['hc:distCommission:remove']">作废</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="title" v-model="open" width="620px" append-to-body>
      <el-form ref="commissionRef" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="分销员" prop="distributorId">
              <el-select v-model="form.distributorId" filterable placeholder="分销员" style="width: 100%" @change="onDistributorChange">
                <el-option v-for="d in distributorOptions" :key="d.distributorId" :label="d.name + '（' + d.inviteCode + '）'" :value="d.distributorId" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="关联订单" prop="orderId">
              <el-input v-model="form.orderId" placeholder="订单ID（补录必填，需未计佣）" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="订单号" prop="orderNo"><el-input v-model="form.orderNo" placeholder="订单号" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="成交门店" prop="storeId">
              <el-select v-model="form.storeId" clearable filterable placeholder="门店" style="width: 100%">
                <el-option v-for="s in storeOptions" :key="s.storeId" :label="s.storeName" :value="s.storeId" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="门店类型" prop="storeType">
              <el-select v-model="form.storeType" clearable placeholder="类型" style="width: 100%">
                <el-option v-for="s in storeTypes" :key="s.value" :label="s.label" :value="s.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="卡项类型" prop="cardType">
              <el-select v-model="form.cardType" clearable placeholder="类型" style="width: 100%">
                <el-option v-for="c in cardTypes" :key="c.value" :label="c.label" :value="c.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="计费基数" prop="baseAmount">
              <el-input-number v-model="form.baseAmount" :min="0" :precision="2" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="计算方式" prop="calcType">
              <el-radio-group v-model="form.calcType">
                <el-radio value="1">按比例</el-radio>
                <el-radio value="2">固定金额</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="比例%" prop="rate">
              <el-input-number v-model="form.rate" :min="0" :max="100" :precision="2" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="佣金金额" prop="commissionAmount">
              <el-input-number v-model="form.commissionAmount" :min="0" :precision="2" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注" prop="remark"><el-input v-model="form.remark" type="textarea" placeholder="补录原因" /></el-form-item>
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

<script setup name="DistCommission">
import { listDistCommission, distCommissionSummary, getDistCommission, addDistCommission, updateDistCommission,
  settleDistCommission, voidDistCommissionByOrder, delDistCommission, listDistributor } from "@/api/hc/distribution"
import { listStore } from "@/api/hc/basic"

const { proxy } = getCurrentInstance()
const cardTypes = [
  { value: "1", label: "储值卡" }, { value: "2", label: "次卡" }, { value: "3", label: "疗程卡" },
  { value: "4", label: "期限卡" }, { value: "5", label: "单次项目" }
]
const storeTypes = [
  { value: "1", label: "直营店" }, { value: "2", label: "加盟店" },
  { value: "3", label: "联营店" }, { value: "4", label: "合作调理点" }
]
const list = ref([])
const summary = ref({})
const storeOptions = ref([])
const distributorOptions = ref([])
const loading = ref(true)
const showSearch = ref(true)
const multiple = ref(true)
const pendingSelected = ref(0)
const total = ref(0)
const title = ref("")
const open = ref(false)
const dateRange = ref([])
const ids = ref([])
const queryParams = ref({
  pageNum: 1, pageSize: 10, distributorName: undefined, orderNo: undefined, storeId: undefined,
  cardType: undefined, settleStatus: undefined
})
const data = {
  form: {},
  rules: {
    distributorId: [{ required: true, message: "分销员不能为空", trigger: "change" }],
    orderId: [{ required: true, message: "关联订单不能为空", trigger: "blur" }],
    commissionAmount: [{ required: true, message: "佣金金额不能为空", trigger: "blur" }]
  }
}
const { form, rules } = toRefs(data)

function cardTypeLabel(v) { const d = cardTypes.find(o => o.value === v); return d ? d.label : "" }
function storeTypeLabel(v) { const d = storeTypes.find(o => o.value === v); return d ? d.label : "" }
function statusLabel(v) { return { "0": "待结算", "1": "已结算", "2": "已作废" }[v] || v }
function statusTag(v) { return { "0": "warning", "1": "success", "2": "info" }[v] || "info" }

function getList() {
  loading.value = true
  const params = proxy.addDateRange(queryParams.value, dateRange.value)
  listDistCommission(params).then(response => {
    list.value = response.rows
    total.value = response.total
    loading.value = false
  })
  distCommissionSummary(params).then(response => { summary.value = response.data || {} })
}
function cancel() { open.value = false; reset() }
function reset() {
  form.value = { commissionId: undefined, distributorId: undefined, distributorName: undefined, orderId: undefined,
    orderNo: undefined, storeId: undefined, storeType: undefined, cardType: undefined, calcType: "1", rate: undefined,
    baseAmount: undefined, commissionAmount: undefined, remark: undefined }
  proxy.resetForm("commissionRef")
}
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { dateRange.value = []; proxy.resetForm("queryRef"); handleQuery() }
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.commissionId)
  multiple.value = !selection.length
  pendingSelected.value = selection.filter(item => item.settleStatus === '0').length
}
function onDistributorChange(distributorId) {
  const d = distributorOptions.value.find(o => o.distributorId === distributorId)
  if (d) {
    form.value.distributorName = d.name
    if (form.value.rate == null && d.rate != null) form.value.rate = d.rate
    if (form.value.baseAmount != null && form.value.rate != null && form.value.calcType === '1') {
      form.value.commissionAmount = Number((form.value.baseAmount * form.value.rate / 100).toFixed(2))
    }
  }
}
function handleAdd() {
  reset()
  title.value = "手工补录分销佣金"
  open.value = true
}
function handleUpdate(row) {
  reset()
  getDistCommission(row.commissionId).then(response => {
    form.value = response.data
    title.value = "修改分销佣金"
    open.value = true
  })
}
function submitForm() {
  proxy.$refs["commissionRef"].validate(valid => {
    if (valid) {
      if (form.value.commissionId != undefined) {
        updateDistCommission(form.value).then(() => { proxy.$modal.msgSuccess("修改成功"); open.value = false; getList() })
      } else {
        addDistCommission(form.value).then(() => { proxy.$modal.msgSuccess("补录成功"); open.value = false; getList() })
      }
    }
  })
}
function handleSettle(row) {
  const commissionIds = row.commissionId ? [row.commissionId] : ids.value.filter(id => {
    const r = list.value.find(item => item.commissionId === id)
    return r && r.settleStatus === '0'
  })
  if (!commissionIds.length) {
    proxy.$modal.msgWarning("请先勾选待结算的佣金记录")
    return
  }
  proxy.$modal.confirm('确认结算所选 ' + commissionIds.length + ' 笔待结算佣金？结算后不可修改。').then(function () {
    return settleDistCommission(commissionIds.join(","))
  }).then(() => { getList(); proxy.$modal.msgSuccess("结算成功") }).catch(() => {})
}
function handleVoid(row) {
  proxy.$modal.confirm('确认作废订单【' + row.orderNo + '】的分销佣金？将同步冲减分销员累计佣金。').then(function () {
    return voidDistCommissionByOrder(row.orderId)
  }).then(() => { getList(); proxy.$modal.msgSuccess("已作废") }).catch(() => {})
}
function handleDelete(row) {
  const commissionIds = row.commissionId || ids.value
  proxy.$modal.confirm('是否确认删除选中的佣金记录？').then(function () {
    return delDistCommission(commissionIds)
  }).then(() => { getList(); proxy.$modal.msgSuccess("删除成功") }).catch(() => {})
}
function handleExport() {
  proxy.download("hc/distCommission/export", { ...queryParams.value }, `distCommission_${new Date().getTime()}.xlsx`)
}
listStore({ pageNum: 1, pageSize: 200, status: "0" }).then(response => { storeOptions.value = response.rows || [] })
listDistributor({ pageNum: 1, pageSize: 500, status: "0" }).then(response => { distributorOptions.value = response.rows || [] })
getList()
</script>

<style scoped>
.summary-card { background: #f5f7fa; border-radius: 4px; padding: 10px 14px; }
.summary-card .label { font-size: 12px; color: #909399; }
.summary-card .value { font-size: 18px; font-weight: 600; color: #303133; margin-top: 4px; }
.summary-card .value.warn { color: #e6a23c; }
</style>
