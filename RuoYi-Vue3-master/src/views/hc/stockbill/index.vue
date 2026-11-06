<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="单据号" prop="billNo">
        <el-input v-model="queryParams.billNo" placeholder="单据号" clearable style="width: 170px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="类型" prop="billType">
        <el-select v-model="queryParams.billType" clearable placeholder="单据类型" style="width: 130px">
          <el-option v-for="d in hc_stock_bill_type" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" clearable placeholder="单据状态" style="width: 130px">
          <el-option v-for="d in hc_stock_bill_status" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="门店" prop="storeId">
        <el-select v-model="queryParams.storeId" clearable placeholder="门店" style="width: 150px">
          <el-option v-for="s in stores" :key="s.storeId" :label="s.storeName" :value="s.storeId" />
        </el-select>
      </el-form-item>
      <el-form-item label="创建时间" style="width: 340px">
        <el-date-picker v-model="dateRange" value-format="YYYY-MM-DD" type="daterange" range-separator="-" start-placeholder="开始" end-placeholder="结束" style="width: 240px" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="openAdd" v-hasPermi="['hc:stockbill:add']">新增单据</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain icon="Remove" @click="openLoss" v-hasPermi="['hc:stockbill:add']">报损申请</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="info" plain icon="DataAnalysis" @click="openLossReport" v-hasPermi="['hc:stockbill:loss']">损耗报表</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['hc:stockbill:export']">导出</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete" v-hasPermi="['hc:stockbill:remove']">删除</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="list" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column label="单据号" prop="billNo" width="180" />
      <el-table-column label="类型" width="100" align="center">
        <template #default="scope"><dict-tag :options="hc_stock_bill_type" :value="scope.row.billType" /></template>
      </el-table-column>
      <el-table-column label="状态" width="110" align="center">
        <template #default="scope"><dict-tag :options="hc_stock_bill_status" :value="scope.row.status" /></template>
      </el-table-column>
      <el-table-column label="门店/调出门店" prop="storeName" width="140" show-overflow-tooltip />
      <el-table-column label="调入门店" width="130" show-overflow-tooltip>
        <template #default="scope">{{ scope.row.toStoreName || '-' }}</template>
      </el-table-column>
      <el-table-column label="关联客户" width="110">
        <template #default="scope">{{ scope.row.customerName || '-' }}</template>
      </el-table-column>
      <el-table-column label="单据金额" prop="totalAmount" width="100" align="right" />
      <el-table-column label="成本金额" prop="costAmount" width="100" align="right" />
      <el-table-column label="申请人" prop="applyBy" width="100" />
      <el-table-column label="申请时间" prop="applyTime" width="160" />
      <el-table-column label="审批人" width="100">
        <template #default="scope">{{ scope.row.approveBy || '-' }}</template>
      </el-table-column>
      <el-table-column label="收货人" width="100">
        <template #default="scope">{{ scope.row.receiveBy || '-' }}</template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="320" fixed="right" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="View" @click="openDetail(scope.row)" v-hasPermi="['hc:stockbill:query']">详情</el-button>
          <el-button v-if="editable(scope.row)" link type="primary" icon="Edit" @click="openEdit(scope.row)" v-hasPermi="['hc:stockbill:edit']">修改</el-button>
          <el-button v-if="editable(scope.row)" link type="warning" icon="Upload" @click="handleSubmit(scope.row)" v-hasPermi="['hc:stockbill:edit']">提交</el-button>
          <el-button v-if="scope.row.status === '1'" link type="success" icon="Select" @click="handleApprove(scope.row)" v-hasPermi="['hc:stockbill:approve']">审批</el-button>
          <el-button v-if="scope.row.status === '1'" link type="danger" icon="Close" @click="handleReject(scope.row)" v-hasPermi="['hc:stockbill:approve']">驳回</el-button>
          <el-button v-if="receivable(scope.row)" link type="success" icon="Box" @click="handleReceive(scope.row)" v-hasPermi="['hc:stockbill:receive']">收货/完成</el-button>
          <el-button v-if="cancellable(scope.row)" link type="info" icon="CircleClose" @click="handleCancel(scope.row)" v-hasPermi="['hc:stockbill:edit']">作废</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- 新增/修改单据 -->
    <el-dialog :title="dialogTitle" v-model="open" width="1000px" append-to-body>
      <el-form :model="form" label-width="100px">
        <el-row>
          <el-col :span="8">
            <el-form-item label="单据类型" required>
              <el-select v-model="form.billType" placeholder="类型" style="width: 100%" :disabled="!!form.billId" @change="onTypeChange">
                <el-option v-for="d in billTypes" :key="d.value" :label="d.label" :value="d.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="form.billType === '4' ? '调出门店' : '所属门店'" required>
              <el-select v-model="form.storeId" placeholder="门店" style="width: 100%">
                <el-option v-for="s in stores" :key="s.storeId" :label="s.storeName" :value="s.storeId" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8" v-if="form.billType === '4'">
            <el-form-item label="调入门店" required>
              <el-select v-model="form.toStoreId" placeholder="调入门店" style="width: 100%">
                <el-option v-for="s in stores" :key="s.storeId" :label="s.storeName" :value="s.storeId" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="8" v-if="form.billType === '2'">
            <el-form-item label="关联客户">
              <el-select v-model="form.customerId" filterable remote clearable reserve-keyword placeholder="姓名/手机号搜索"
                :remote-method="searchCustomer" :loading="customerLoading" style="width: 100%">
                <el-option v-for="c in customers" :key="c.customerId" :label="c.name + ' / ' + (c.phone || '')" :value="c.customerId" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="16" v-if="form.billType === '7'">
            <el-form-item label="报损原因" required>
              <el-select v-model="form.lossReason" filterable allow-create default-first-option placeholder="破损/过期/变质/丢失等" style="width: 100%">
                <el-option label="有效期届满" value="有效期届满" />
                <el-option label="运输/搬运破损" value="运输/搬运破损" />
                <el-option label="存储不当变质" value="存储不当变质" />
                <el-option label="生产/操作损耗" value="生产/操作损耗" />
                <el-option label="盘亏丢失" value="盘亏丢失" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="16">
            <el-form-item label="备注"><el-input v-model="form.remark" maxlength="200" /></el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <el-table :data="form.items" size="small" border>
        <el-table-column label="商品/耗材" min-width="220">
          <template #default="scope">
            <el-select v-model="scope.row.productId" filterable placeholder="选择商品" style="width: 100%" @change="v => onItemProduct(v, scope.row)">
              <el-option v-for="p in products" :key="p.productId" :label="p.productCode + ' ' + p.productName" :value="p.productId" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="批号" width="140">
          <template #default="scope"><el-input v-model="scope.row.batchNo" size="small" :placeholder="needBatch() ? '批次管理必填' : '可空'" /></template>
        </el-table-column>
        <el-table-column label="生产日期" width="150" v-if="isIn()">
          <template #default="scope"><el-date-picker v-model="scope.row.productionDate" type="date" value-format="YYYY-MM-DD" size="small" style="width: 140px" /></template>
        </el-table-column>
        <el-table-column label="有效期至" width="150" v-if="isIn()">
          <template #default="scope"><el-date-picker v-model="scope.row.expireDate" type="date" value-format="YYYY-MM-DD" size="small" style="width: 140px" placeholder="缺省按保质期" /></template>
        </el-table-column>
        <el-table-column :label="form.billType === '3' ? '实盘数量' : '数量'" width="120" align="center">
          <template #default="scope"><el-input-number v-model="scope.row.quantity" :min="0" controls-position="right" size="small" style="width: 105px" /></template>
        </el-table-column>
        <el-table-column label="成本单价" width="130" align="center" v-if="!isCheck()">
          <template #default="scope"><el-input-number v-model="scope.row.costPrice" :min="0" :precision="2" controls-position="right" size="small" style="width: 115px" /></template>
        </el-table-column>
        <el-table-column label="当前库存" width="90" align="center">
          <template #default="scope">{{ scope.row.currentQty == null ? '-' : scope.row.currentQty }}</template>
        </el-table-column>
        <el-table-column label="操作" width="60" align="center">
          <template #default="scope"><el-button link type="danger" size="small" @click="form.items.splice(scope.$index, 1)">删除</el-button></template>
        </el-table-column>
      </el-table>
      <el-button link type="primary" icon="Plus" style="margin-top: 8px" @click="addItem">添加行</el-button>

      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">保存草稿</el-button>
          <el-button type="success" @click="submitForm(true)">保存并提交</el-button>
          <el-button @click="open = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 详情 -->
    <el-dialog title="单据详情" v-model="detailOpen" width="1000px" append-to-body>
      <el-descriptions :column="3" border size="small">
        <el-descriptions-item label="单据号">{{ detail.billNo }}</el-descriptions-item>
        <el-descriptions-item label="类型">{{ typeLabel(detail.billType) }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ statusLabel(detail.status) }}</el-descriptions-item>
        <el-descriptions-item label="门店">{{ detail.storeName }}</el-descriptions-item>
        <el-descriptions-item label="调入门店">{{ detail.toStoreName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="客户">{{ detail.customerName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="报损原因">{{ detail.lossReason || '-' }}</el-descriptions-item>
        <el-descriptions-item label="单据金额">{{ detail.totalAmount }}</el-descriptions-item>
        <el-descriptions-item label="成本金额">{{ detail.costAmount }}</el-descriptions-item>
        <el-descriptions-item label="申请人">{{ detail.applyBy || '-' }}</el-descriptions-item>
        <el-descriptions-item label="申请时间">{{ detail.applyTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="审批人">{{ detail.approveBy || '-' }}</el-descriptions-item>
        <el-descriptions-item label="审批时间">{{ detail.approveTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="收货人">{{ detail.receiveBy || '-' }}</el-descriptions-item>
        <el-descriptions-item label="收货时间">{{ detail.receiveTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ detail.remark || '-' }}</el-descriptions-item>
        <el-descriptions-item label="审批意见" :span="3">{{ detail.approveRemark || '-' }}</el-descriptions-item>
      </el-descriptions>
      <el-table :data="detail.items || []" size="small" border style="margin-top: 12px">
        <el-table-column label="编码" prop="productCode" width="120" />
        <el-table-column label="名称" prop="productName" min-width="150" show-overflow-tooltip />
        <el-table-column label="批号" prop="batchNo" width="130">
          <template #default="scope">{{ scope.row.batchNo || '-' }}</template>
        </el-table-column>
        <el-table-column label="有效期至" prop="expireDate" width="110">
          <template #default="scope">{{ scope.row.expireDate || '-' }}</template>
        </el-table-column>
        <el-table-column label="数量" prop="quantity" width="80" align="right" />
        <el-table-column label="单位" prop="unit" width="70" align="center" />
        <el-table-column label="成本单价" prop="costPrice" width="95" align="right" />
        <el-table-column label="当前库存" prop="currentQty" width="90" align="center" />
        <el-table-column label="备注" prop="remark" min-width="120" show-overflow-tooltip />
      </el-table>
      <template #footer>
        <div class="dialog-footer"><el-button @click="detailOpen = false">关 闭</el-button></div>
      </template>
    </el-dialog>

    <!-- M8 损耗报表 -->
    <el-dialog title="损耗报表（已完成的报损出库）" v-model="lossOpen" width="1000px" append-to-body>
      <el-form :inline="true" size="small">
        <el-form-item label="门店">
          <el-select v-model="lossQuery.storeId" clearable placeholder="门店" style="width: 150px">
            <el-option v-for="s in stores" :key="s.storeId" :label="s.storeName" :value="s.storeId" />
          </el-select>
        </el-form-item>
        <el-form-item label="商品名称">
          <el-input v-model="lossQuery.productName" placeholder="商品名称" clearable style="width: 150px" @keyup.enter="getLossReport" />
        </el-form-item>
        <el-form-item label="报损日期">
          <el-date-picker v-model="lossRange" value-format="YYYY-MM-DD" type="daterange" range-separator="-" start-placeholder="开始" end-placeholder="结束" style="width: 240px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="getLossReport">查询</el-button>
        </el-form-item>
      </el-form>
      <el-descriptions :column="4" border size="small" style="margin-bottom: 10px">
        <el-descriptions-item label="报损单数">{{ lossSummary.billCount || 0 }}</el-descriptions-item>
        <el-descriptions-item label="明细行">{{ lossSummary.itemCount || 0 }}</el-descriptions-item>
        <el-descriptions-item label="报损数量">{{ lossSummary.lossQty || 0 }}</el-descriptions-item>
        <el-descriptions-item label="损耗成本（元）">{{ lossSummary.lossAmount || 0 }}</el-descriptions-item>
      </el-descriptions>
      <el-table :data="lossRows" size="small" border max-height="420" v-loading="lossLoading">
        <el-table-column label="月份" prop="statMonth" width="90" />
        <el-table-column label="门店" prop="storeName" min-width="130" show-overflow-tooltip />
        <el-table-column label="商品编码" prop="productCode" width="120" />
        <el-table-column label="商品名称" prop="productName" min-width="150" show-overflow-tooltip />
        <el-table-column label="单位" prop="unit" width="70" align="center" />
        <el-table-column label="报损数量" prop="lossQty" width="100" align="right" />
        <el-table-column label="损耗成本" prop="lossAmount" width="110" align="right" />
      </el-table>
      <template #footer>
        <div class="dialog-footer"><el-button @click="lossOpen = false">关 闭</el-button></div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="HcStockBill">
import { listStockBill, getStockBill, addStockBill, updateStockBill, delStockBill, submitStockBill, approveStockBill, rejectStockBill, receiveStockBill, cancelStockBill, optionProduct, lossReportStock } from "@/api/hc/inventory"
import { listStore } from "@/api/hc/basic"
import { listCustomer } from "@/api/hc/card"

const { proxy } = getCurrentInstance()
const { hc_stock_bill_type, hc_stock_bill_status } = proxy.useDict("hc_stock_bill_type", "hc_stock_bill_status")

const list = ref([])
const loading = ref(false)
const showSearch = ref(true)
const total = ref(0)
const dateRange = ref([])
const stores = ref([])
const products = ref([])
const customers = ref([])
const customerLoading = ref(false)
const ids = ref([])
const multiple = ref(true)
const open = ref(false)
const detailOpen = ref(false)
const dialogTitle = ref("")
const detail = ref({})
const queryParams = ref({ pageNum: 1, pageSize: 10, billNo: undefined, billType: undefined, status: undefined, storeId: undefined })
const form = ref({ items: [] })
// M8 损耗报表
const lossOpen = ref(false)
const lossLoading = ref(false)
const lossRows = ref([])
const lossSummary = ref({})
const lossRange = ref([])
const lossQuery = ref({ storeId: undefined, productName: undefined })

// 单据类型：1采购入库 2领用出库 3盘点 4调拨 6退库入库（零售走库存页）
const billTypes = computed(() => (hc_stock_bill_type.value || []).filter(d => d.value !== "5"))

function isIn() { return form.value.billType === "1" || form.value.billType === "6" }
function isCheck() { return form.value.billType === "3" }
function needBatch() { return isIn() || form.value.billType === "2" || form.value.billType === "7" }
function editable(row) { return row.status === "0" || row.status === "4" }
function receivable(row) { return row.status === "2" }
function cancellable(row) {
  if (row.status === "2") return row.billType === "4"
  return row.status === "0" || row.status === "1" || row.status === "4"
}
function typeLabel(v) { const d = (hc_stock_bill_type.value || []).find(i => i.value === v); return d ? d.label : v }
function statusLabel(v) { const d = (hc_stock_bill_status.value || []).find(i => i.value === v); return d ? d.label : v }

function getList() {
  loading.value = true
  listStockBill(proxy.addDateRange(queryParams.value, dateRange.value)).then(r => {
    list.value = r.rows
    total.value = r.total
  }).finally(() => loading.value = false)
}
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { dateRange.value = []; proxy.resetForm("queryRef"); handleQuery() }
function handleSelectionChange(selection) {
  ids.value = selection.map(i => i.billId)
  multiple.value = !selection.length
}
function searchCustomer(keyword) {
  if (!keyword) return
  customerLoading.value = true
  listCustomer({ pageNum: 1, pageSize: 20, name: keyword }).then(r => { customers.value = r.rows || [] }).finally(() => customerLoading.value = false)
}
function loadProducts() {
  if (!products.value.length) optionProduct().then(r => { products.value = r.data || [] })
}
function openAdd() {
  form.value = { billType: "1", storeId: undefined, toStoreId: undefined, customerId: undefined, lossReason: undefined, remark: undefined, items: [] }
  addItem()
  dialogTitle.value = "新增出入库单"
  loadProducts()
  open.value = true
}
/** M8 报损出库申请 */
function openLoss() {
  form.value = { billType: "7", storeId: undefined, toStoreId: undefined, customerId: undefined, lossReason: undefined, remark: undefined, items: [] }
  addItem()
  dialogTitle.value = "新增报损单（确认后扣减库存并计入损耗）"
  loadProducts()
  open.value = true
}
function openEdit(row) {
  getStockBill(row.billId).then(r => {
    const d = r.data || {}
    d.items = (d.items || []).map(i => ({ ...i }))
    form.value = d
    dialogTitle.value = "修改单据 " + d.billNo
    loadProducts()
    open.value = true
  })
}
function openDetail(row) {
  getStockBill(row.billId).then(r => { detail.value = r.data || {}; detailOpen.value = true })
}
function onTypeChange() {
  form.value.toStoreId = undefined
  form.value.items = []
  addItem()
}
function addItem() {
  if (!form.value.items) form.value.items = []
  form.value.items.push({ productId: undefined, batchNo: undefined, quantity: 1, costPrice: undefined, salePrice: undefined })
}
function onItemProduct(productId, row) {
  const p = products.value.find(i => i.productId === productId)
  if (p) {
    row.productCode = p.productCode
    row.productName = p.productName
    row.unit = p.unit
    row.batchManage = p.batchManage
    if (p.purchasePrice != null) row.costPrice = p.purchasePrice
    if (p.salePrice != null) row.salePrice = p.salePrice
  }
}
function validForm() {
  const f = form.value
  if (!f.billType) return "请选择单据类型"
  if (!f.storeId) return "请选择门店"
  if (f.billType === "4" && (!f.toStoreId || f.toStoreId === f.storeId)) return "调拨需选择且调入门店不能等于调出门店"
  if (f.billType === "7" && !f.lossReason) return "报损出库必须填写报损原因"
  const items = f.items || []
  if (!items.length) return "请至少添加一行明细"
  for (const it of items) {
    if (!it.productId) return "明细存在未选择的商品"
    if (it.quantity == null || it.quantity < 0) return "【" + it.productName + "】数量不正确"
    if (f.billType !== "3" && it.quantity <= 0) return "【" + it.productName + "】数量必须大于0"
    if (needBatch() && it.batchManage === "1" && !it.batchNo) return "【" + it.productName + "】为批次管理商品，请填写批号"
  }
  return null
}
function submitForm(thenSubmit) {
  const err = validForm()
  if (err) return proxy.$modal.msgError(err)
  const req = form.value.billId ? updateStockBill(form.value) : addStockBill(form.value)
  req.then(r => {
    const billId = form.value.billId || r.billId
    proxy.$modal.msgSuccess("保存成功")
    open.value = false
    if (thenSubmit && billId) return submitStockBill(billId)
  }).then(() => getList())
}
function handleSubmit(row) {
  proxy.$modal.confirm('确认提交单据【' + row.billNo + '】进入审批？').then(() => submitStockBill(row.billId))
    .then(() => { getList(); proxy.$modal.msgSuccess("已提交") }).catch(() => {})
}
function handleApprove(row) {
  proxy.$modal.prompt('审批通过 - 请输入审批意见（可留空）').then(({ value }) => approveStockBill(row.billId, value))
    .then(() => { getList(); proxy.$modal.msgSuccess("审批通过，调拨单已扣减调出门店并进入在途") }).catch(() => {})
}
function handleReject(row) {
  proxy.$modal.prompt('审批驳回 - 请输入驳回原因').then(({ value }) => rejectStockBill(row.billId, value))
    .then(() => { getList(); proxy.$modal.msgSuccess("已驳回") }).catch(() => {})
}
function handleReceive(row) {
  const tip = row.billType === "3" ? '确认按实盘数量完成盘点差异调整？'
    : (row.billType === "7" ? '确认报损出库？将按批次扣除库存并计入损耗报表。' : '确认收货/完成该单据并变动库存？')
  proxy.$modal.confirm(tip).then(() => receiveStockBill(row.billId))
    .then(() => { getList(); proxy.$modal.msgSuccess("已完成") }).catch(() => {})
}
function handleCancel(row) {
  proxy.$modal.confirm('确认作废单据【' + row.billNo + '】？在途调拨将回补调出门店').then(() => cancelStockBill(row.billId))
    .then(() => { getList(); proxy.$modal.msgSuccess("已作废") }).catch(() => {})
}
function handleDelete(row) {
  const billIds = row && row.billId ? [row.billId] : ids.value
  if (!billIds.length) return proxy.$modal.msgError("请选择要删除的数据")
  proxy.$modal.confirm('仅草稿/已驳回单据可删除，是否确认删除选中的 ' + billIds.length + ' 条？').then(() => delStockBill(billIds))
    .then(() => { getList(); proxy.$modal.msgSuccess("删除成功") }).catch(() => {})
}
function handleExport() {
  proxy.download("hc/stockbill/export", { ...proxy.addDateRange(queryParams.value, dateRange.value) }, `stockBill_${new Date().getTime()}.xlsx`)
}
function openLossReport() {
  lossOpen.value = true
  getLossReport()
}
function getLossReport() {
  lossLoading.value = true
  const q = proxy.addDateRange({ storeId: lossQuery.value.storeId, params: {} }, lossRange.value)
  q.params.productName = lossQuery.value.productName
  lossReportStock(q).then(r => {
    lossRows.value = r.rows || []
    lossSummary.value = r.summary || {}
  }).finally(() => lossLoading.value = false)
}

listStore({ pageNum: 1, pageSize: 200 }).then(r => { stores.value = r.rows || [] })
getList()
</script>
