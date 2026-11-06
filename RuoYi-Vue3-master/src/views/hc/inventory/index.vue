<template>
  <div class="app-container">
    <el-tabs v-model="tab" @tab-change="onTabChange">
      <!-- 库存台账 -->
      <el-tab-pane label="库存台账" name="stock">
        <el-form :model="stockQuery" :inline="true">
          <el-form-item label="门店">
            <el-select v-model="stockQuery.storeId" clearable placeholder="门店" style="width: 160px">
              <el-option v-for="s in stores" :key="s.storeId" :label="s.storeName" :value="s.storeId" />
            </el-select>
          </el-form-item>
          <el-form-item label="编码"><el-input v-model="stockQuery.productCode" clearable style="width: 140px" placeholder="商品编码" /></el-form-item>
          <el-form-item label="名称"><el-input v-model="stockQuery.productName" clearable style="width: 150px" placeholder="商品名称" /></el-form-item>
          <el-form-item label="类别">
            <el-select v-model="stockQuery.category" clearable placeholder="类别" style="width: 130px">
              <el-option v-for="d in hc_product_category" :key="d.value" :label="d.label" :value="d.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="loadStock">搜索</el-button>
            <el-button type="danger" plain icon="ShoppingCart" @click="openRetail" v-hasPermi="['hc:inventory:retail']">零售出库</el-button>
          </el-form-item>
        </el-form>
        <el-table v-loading="loading" :data="stockList">
          <el-table-column label="门店" prop="storeName" width="130" />
          <el-table-column label="编码" prop="productCode" width="130" />
          <el-table-column label="名称" prop="productName" min-width="150" show-overflow-tooltip />
          <el-table-column label="类别" width="100" align="center">
            <template #default="scope"><dict-tag :options="hc_product_category" :value="scope.row.category" /></template>
          </el-table-column>
          <el-table-column label="规格" prop="spec" width="110" show-overflow-tooltip />
          <el-table-column label="单位" prop="unit" width="70" align="center" />
          <el-table-column label="库存数量" prop="quantity" width="100" align="right">
            <template #default="scope">
              <span :style="{ color: warnColor(scope.row) }">{{ scope.row.quantity }}</span>
            </template>
          </el-table-column>
          <el-table-column label="安全库存" prop="safetyStock" width="90" align="center" />
          <el-table-column label="平均成本" prop="avgCost" width="100" align="right" />
          <el-table-column label="零售价" prop="salePrice" width="90" align="right" />
          <el-table-column label="最近变动" prop="updateTime" width="160" />
        </el-table>
        <pagination v-show="stockTotal > 0" :total="stockTotal" v-model:page="stockQuery.pageNum" v-model:limit="stockQuery.pageSize" @pagination="loadStock" />
      </el-tab-pane>

      <!-- 批次与效期 -->
      <el-tab-pane label="批次效期" name="batch">
        <el-form :model="batchQuery" :inline="true">
          <el-form-item label="门店">
            <el-select v-model="batchQuery.storeId" clearable placeholder="门店" style="width: 160px">
              <el-option v-for="s in stores" :key="s.storeId" :label="s.storeName" :value="s.storeId" />
            </el-select>
          </el-form-item>
          <el-form-item label="批号"><el-input v-model="batchQuery.batchNo" clearable style="width: 140px" /></el-form-item>
          <el-form-item label="名称"><el-input v-model="batchQuery.productName" clearable style="width: 150px" /></el-form-item>
          <el-form-item><el-button type="primary" icon="Search" @click="loadBatch">搜索</el-button></el-form-item>
        </el-form>
        <el-table v-loading="loading" :data="batchList">
          <el-table-column label="门店" prop="storeName" width="130" />
          <el-table-column label="编码" prop="productCode" width="130" />
          <el-table-column label="名称" prop="productName" min-width="140" show-overflow-tooltip />
          <el-table-column label="批号" prop="batchNo" width="150" />
          <el-table-column label="生产日期" prop="productionDate" width="110" />
          <el-table-column label="有效期至" prop="expireDate" width="110" />
          <el-table-column label="剩余天数" width="100" align="center">
            <template #default="scope">
              <el-tag v-if="scope.row.expireDays === null || scope.row.expireDays === undefined" type="info" size="small">不限</el-tag>
              <el-tag v-else :type="scope.row.expireDays < 0 ? 'danger' : (scope.row.expireDays <= 30 ? 'warning' : 'success')" size="small">{{ scope.row.expireDays }} 天</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="批次数量" prop="quantity" width="100" align="right" />
          <el-table-column label="成本价" prop="costPrice" width="90" align="right" />
          <el-table-column label="供应商" prop="supplierName" min-width="120" show-overflow-tooltip />
        </el-table>
        <pagination v-show="batchTotal > 0" :total="batchTotal" v-model:page="batchQuery.pageNum" v-model:limit="batchQuery.pageSize" @pagination="loadBatch" />
      </el-tab-pane>

      <!-- 出入库流水 -->
      <el-tab-pane label="出入库流水" name="record">
        <el-form :model="recordQuery" :inline="true">
          <el-form-item label="门店">
            <el-select v-model="recordQuery.storeId" clearable placeholder="门店" style="width: 160px">
              <el-option v-for="s in stores" :key="s.storeId" :label="s.storeName" :value="s.storeId" />
            </el-select>
          </el-form-item>
          <el-form-item label="业务类型">
            <el-select v-model="recordQuery.billType" clearable placeholder="类型" style="width: 140px">
              <el-option v-for="d in hc_stock_bill_type" :key="d.value" :label="d.label" :value="d.value" />
              <el-option label="核销耗材" value="7" />
              <el-option label="撤销回补" value="8" />
            </el-select>
          </el-form-item>
          <el-form-item label="方向">
            <el-select v-model="recordQuery.direction" clearable placeholder="方向" style="width: 100px">
              <el-option v-for="d in hc_inventory_dir" :key="d.value" :label="d.label" :value="d.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="名称"><el-input v-model="recordQuery.productName" clearable style="width: 150px" /></el-form-item>
          <el-form-item><el-button type="primary" icon="Search" @click="loadRecord">搜索</el-button></el-form-item>
        </el-form>
        <el-table v-loading="loading" :data="recordList">
          <el-table-column label="时间" prop="createTime" width="160" />
          <el-table-column label="门店" prop="storeName" width="120" />
          <el-table-column label="商品" prop="productName" min-width="140" show-overflow-tooltip />
          <el-table-column label="批号" prop="batchNo" width="130" />
          <el-table-column label="业务" width="110" align="center">
            <template #default="scope">
              <span v-if="scope.row.billType === '7'">核销耗材</span>
              <span v-else-if="scope.row.billType === '8'">撤销回补</span>
              <dict-tag v-else :options="hc_stock_bill_type" :value="scope.row.billType" />
            </template>
          </el-table-column>
          <el-table-column label="方向" width="80" align="center">
            <template #default="scope"><dict-tag :options="hc_inventory_dir" :value="scope.row.direction" /></template>
          </el-table-column>
          <el-table-column label="数量" prop="quantity" width="80" align="right" />
          <el-table-column label="变动前" prop="beforeQty" width="80" align="right" />
          <el-table-column label="变动后" prop="afterQty" width="80" align="right" />
          <el-table-column label="成本单价" prop="costPrice" width="95" align="right" />
          <el-table-column label="成本金额" prop="amount" width="95" align="right" />
          <el-table-column label="客户" prop="customerName" width="100">
            <template #default="scope">{{ scope.row.customerName || '-' }}</template>
          </el-table-column>
          <el-table-column label="操作人" prop="operator" width="100" />
          <el-table-column label="备注" prop="remark" min-width="140" show-overflow-tooltip />
        </el-table>
        <pagination v-show="recordTotal > 0" :total="recordTotal" v-model:page="recordQuery.pageNum" v-model:limit="recordQuery.pageSize" @pagination="loadRecord" />
      </el-tab-pane>

      <!-- 库存预警 -->
      <el-tab-pane label="库存预警" name="warn">
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button type="primary" plain icon="Refresh" @click="handleScan" v-hasPermi="['hc:inventory:query']">执行预警扫描（推送站内信）</el-button>
          </el-col>
          <el-col :span="6"><span style="color:#909399">近效期天数取参数 hc.stock.expiry.warn.days</span></el-col>
        </el-row>
        <el-divider content-position="left">安全库存不足（{{ safetyList.length }} 项）</el-divider>
        <el-table :data="safetyList" size="small">
          <el-table-column label="门店" prop="storeName" width="140" />
          <el-table-column label="编码" prop="productCode" width="130" />
          <el-table-column label="名称" prop="productName" min-width="150" />
          <el-table-column label="当前库存" prop="quantity" width="100" align="right" />
          <el-table-column label="安全库存" prop="safetyStock" width="100" align="right" />
          <el-table-column label="缺口" width="100" align="right">
            <template #default="scope"><span style="color:#f56c6c">{{ (scope.row.safetyStock || 0) - (scope.row.quantity || 0) }}</span></template>
          </el-table-column>
          <el-table-column label="单位" prop="unit" width="80" />
        </el-table>
        <el-divider content-position="left">近效期/已过期批次（{{ expiryList.length }} 批）</el-divider>
        <el-table :data="expiryList" size="small">
          <el-table-column label="门店" prop="storeName" width="140" />
          <el-table-column label="名称" prop="productName" min-width="150" />
          <el-table-column label="批号" prop="batchNo" width="140" />
          <el-table-column label="有效期至" prop="expireDate" width="120" />
          <el-table-column label="剩余天数" prop="expireDays" width="100" align="right" />
          <el-table-column label="批次数量" prop="quantity" width="100" align="right" />
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- 零售出库 -->
    <el-dialog title="零售出库（确认收入与成本）" v-model="retailOpen" width="880px" append-to-body>
      <el-form :model="retailForm" label-width="90px">
        <el-row>
          <el-col :span="8">
            <el-form-item label="门店" required>
              <el-select v-model="retailForm.storeId" placeholder="门店" style="width: 100%">
                <el-option v-for="s in stores" :key="s.storeId" :label="s.storeName" :value="s.storeId" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="客户" required>
              <el-select v-model="retailForm.customerId" filterable remote clearable reserve-keyword placeholder="输入姓名/手机号搜索"
                :remote-method="searchCustomer" :loading="customerLoading" style="width: 100%">
                <el-option v-for="c in customers" :key="c.customerId" :label="c.name + ' / ' + (c.phone || '')" :value="c.customerId" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="备注"><el-input v-model="retailForm.remark" maxlength="100" /></el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <el-table :data="retailForm.items" size="small" border>
        <el-table-column label="商品/耗材" min-width="230">
          <template #default="scope">
            <el-select v-model="scope.row.productId" filterable placeholder="选择商品" style="width: 100%" @change="v => onRetailProduct(v, scope.row)">
              <el-option v-for="p in products" :key="p.productId" :label="p.productCode + ' ' + p.productName" :value="p.productId" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="批号" width="140">
          <template #default="scope"><el-input v-model="scope.row.batchNo" placeholder="批次管理必填" /></template>
        </el-table-column>
        <el-table-column label="数量" width="130" align="center">
          <template #default="scope"><el-input-number v-model="scope.row.quantity" :min="1" controls-position="right" style="width: 110px" /></template>
        </el-table-column>
        <el-table-column label="零售价" width="140" align="center">
          <template #default="scope"><el-input-number v-model="scope.row.salePrice" :min="0" :precision="2" controls-position="right" style="width: 120px" /></template>
        </el-table-column>
        <el-table-column label="成本价" width="140" align="center">
          <template #default="scope"><el-input-number v-model="scope.row.costPrice" :min="0" :precision="2" controls-position="right" style="width: 120px" /></template>
        </el-table-column>
        <el-table-column label="操作" width="70" align="center">
          <template #default="scope"><el-button link type="danger" @click="retailForm.items.splice(scope.$index, 1)">删除</el-button></template>
        </el-table-column>
      </el-table>
      <el-button link type="primary" icon="Plus" style="margin-top: 8px" @click="retailForm.items.push({ quantity: 1 })">添加行</el-button>
      <div style="margin-top: 8px; color: #606266">销售额合计：{{ retailSaleTotal }}　成本合计：{{ retailCostTotal }}</div>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitRetail">确 定</el-button>
          <el-button @click="retailOpen = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="HcInventory">
import { listInventory, listStockBatch, listInventoryRecord, safetyWarnings, expiryWarnings, runStockWarning, retailOut, optionProduct } from "@/api/hc/inventory"
import { listStore } from "@/api/hc/basic"
import { listCustomer } from "@/api/hc/card"

const { proxy } = getCurrentInstance()
const { hc_product_category, hc_stock_bill_type, hc_inventory_dir } = proxy.useDict("hc_product_category", "hc_stock_bill_type", "hc_inventory_dir")

const tab = ref("stock")
const loading = ref(false)
const stores = ref([])
const products = ref([])
const customers = ref([])
const customerLoading = ref(false)

const stockList = ref([])
const stockTotal = ref(0)
const stockQuery = ref({ pageNum: 1, pageSize: 10, storeId: undefined, productCode: undefined, productName: undefined, category: undefined })

const batchList = ref([])
const batchTotal = ref(0)
const batchQuery = ref({ pageNum: 1, pageSize: 10, storeId: undefined, batchNo: undefined, productName: undefined })

const recordList = ref([])
const recordTotal = ref(0)
const recordQuery = ref({ pageNum: 1, pageSize: 10, storeId: undefined, billType: undefined, direction: undefined, productName: undefined })

const safetyList = ref([])
const expiryList = ref([])

const retailOpen = ref(false)
const retailForm = ref({ storeId: undefined, customerId: undefined, remark: undefined, items: [] })
const retailSaleTotal = computed(() => retailForm.value.items.reduce((s, i) => s + (i.quantity || 0) * (i.salePrice || 0), 0).toFixed(2))
const retailCostTotal = computed(() => retailForm.value.items.reduce((s, i) => s + (i.quantity || 0) * (i.costPrice || 0), 0).toFixed(2))

function warnColor(row) {
  return row.safetyStock > 0 && row.quantity < row.safetyStock ? "#f56c6c" : ""
}
function loadStock() {
  loading.value = true
  listInventory(stockQuery.value).then(r => { stockList.value = r.rows; stockTotal.value = r.total }).finally(() => loading.value = false)
}
function loadBatch() {
  loading.value = true
  listStockBatch(batchQuery.value).then(r => { batchList.value = r.rows; batchTotal.value = r.total }).finally(() => loading.value = false)
}
function loadRecord() {
  loading.value = true
  listInventoryRecord(recordQuery.value).then(r => { recordList.value = r.rows; recordTotal.value = r.total }).finally(() => loading.value = false)
}
function loadWarn() {
  loading.value = true
  Promise.all([safetyWarnings({}), expiryWarnings({})])
    .then(([a, b]) => { safetyList.value = a.data || []; expiryList.value = b.data || [] })
    .finally(() => loading.value = false)
}
function onTabChange(name) {
  if (name === "stock") loadStock()
  else if (name === "batch") loadBatch()
  else if (name === "record") loadRecord()
  else loadWarn()
}
function handleScan() {
  runStockWarning().then(r => { proxy.$modal.msgSuccess(r.msg || "扫描完成"); loadWarn() })
}
function searchCustomer(keyword) {
  if (!keyword) return
  customerLoading.value = true
  listCustomer({ pageNum: 1, pageSize: 20, name: keyword }).then(r => { customers.value = r.rows || [] }).finally(() => customerLoading.value = false)
}
function openRetail() {
  retailForm.value = { storeId: stockQuery.value.storeId, customerId: undefined, remark: undefined, items: [{ quantity: 1 }] }
  if (!products.value.length) optionProduct().then(r => { products.value = r.data || [] })
  retailOpen.value = true
}
function onRetailProduct(productId, row) {
  const p = products.value.find(i => i.productId === productId)
  if (p) {
    if (p.salePrice != null) row.salePrice = p.salePrice
    if (p.purchasePrice != null) row.costPrice = p.purchasePrice
  }
}
function submitRetail() {
  const f = retailForm.value
  if (!f.storeId) return proxy.$modal.msgError("请选择门店")
  if (!f.customerId) return proxy.$modal.msgError("请选择客户（零售收入需归属客户）")
  const items = (f.items || []).filter(i => i.productId && i.quantity > 0)
  if (!items.length) return proxy.$modal.msgError("请添加出库商品")
  retailOut({ storeId: f.storeId, customerId: f.customerId, remark: f.remark, items: items }).then(r => {
    proxy.$modal.msgSuccess("零售出库成功，收入 " + r.totalAmount + " 成本 " + r.costAmount)
    retailOpen.value = false
    loadStock()
    loadRecord()
  })
}

listStore({ pageNum: 1, pageSize: 200 }).then(r => { stores.value = r.rows || [] })
optionProduct().then(r => { products.value = r.data || [] })
loadStock()
</script>
