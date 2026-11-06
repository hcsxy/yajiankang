<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="统一编码" prop="productCode">
        <el-input v-model="queryParams.productCode" placeholder="编码" clearable style="width: 150px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="名称" prop="productName">
        <el-input v-model="queryParams.productName" placeholder="商品/耗材名称" clearable style="width: 160px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="类别" prop="category">
        <el-select v-model="queryParams.category" clearable placeholder="类别" style="width: 130px">
          <el-option v-for="d in hc_product_category" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" clearable placeholder="状态" style="width: 110px">
          <el-option label="启用" value="0" />
          <el-option label="停用" value="1" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="openAdd" v-hasPermi="['hc:product:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete" v-hasPermi="['hc:product:remove']">删除</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="list" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column label="统一编码" prop="productCode" width="130" />
      <el-table-column label="名称" prop="productName" min-width="150" show-overflow-tooltip />
      <el-table-column label="类别" width="100" align="center">
        <template #default="scope"><dict-tag :options="hc_product_category" :value="scope.row.category" /></template>
      </el-table-column>
      <el-table-column label="规格" prop="spec" width="110" show-overflow-tooltip />
      <el-table-column label="单位" prop="unit" width="70" align="center" />
      <el-table-column label="采购价" prop="purchasePrice" width="90" align="right" />
      <el-table-column label="零售价" prop="salePrice" width="90" align="right" />
      <el-table-column label="供应商" prop="supplierName" width="130" show-overflow-tooltip>
        <template #default="scope">{{ scope.row.supplierName || '-' }}</template>
      </el-table-column>
      <el-table-column label="批次管理" width="90" align="center">
        <template #default="scope">
          <el-tag v-if="scope.row.batchManage === '1'" type="warning" size="small">是</el-tag>
          <el-tag v-else type="info" size="small">否</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="保质期(天)" prop="shelfLifeDays" width="95" align="center" />
      <el-table-column label="安全库存" prop="safetyStock" width="90" align="center" />
      <el-table-column label="状态" width="80" align="center">
        <template #default="scope">
          <el-tag v-if="scope.row.status === '0'" type="success" size="small">启用</el-tag>
          <el-tag v-else type="danger" size="small">停用</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="130" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="openEdit(scope.row)" v-hasPermi="['hc:product:edit']">修改</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['hc:product:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="dialogTitle" v-model="open" width="640px" append-to-body>
      <el-form ref="formRef" :model="form" label-width="110px">
        <el-form-item label="名称" required>
          <el-input v-model="form.productName" maxlength="100" placeholder="商品/耗材名称" />
        </el-form-item>
        <el-form-item label="统一编码">
          <el-input v-model="form.productCode" maxlength="30" placeholder="留空按类别自动生成（SP/HC/GZ+6位）" />
        </el-form-item>
        <el-form-item label="类别" required>
          <el-radio-group v-model="form.category">
            <el-radio v-for="d in hc_product_category" :key="d.value" :value="d.value">{{ d.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-row>
          <el-col :span="12">
            <el-form-item label="规格"><el-input v-model="form.spec" maxlength="60" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单位"><el-input v-model="form.unit" maxlength="20" /></el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="采购单价"><el-input-number v-model="form.purchasePrice" :min="0" :precision="2" controls-position="right" style="width: 90%" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="零售单价"><el-input-number v-model="form.salePrice" :min="0" :precision="2" controls-position="right" style="width: 90%" /></el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="供应商"><el-input v-model="form.supplierName" maxlength="100" /></el-form-item>
        <el-row>
          <el-col :span="12">
            <el-form-item label="批次管理">
              <el-switch v-model="form.batchManage" active-value="1" inactive-value="0" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="保质期(天)"><el-input-number v-model="form.shelfLifeDays" :min="0" controls-position="right" style="width: 90%" /></el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="安全库存"><el-input-number v-model="form.safetyStock" :min="0" controls-position="right" style="width: 90%" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-radio-group v-model="form.status">
                <el-radio value="0">启用</el-radio>
                <el-radio value="1">停用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" maxlength="200" /></el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="open = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="HcProduct">
import { listProduct, addProduct, updateProduct, delProduct } from "@/api/hc/inventory"

const { proxy } = getCurrentInstance()
const { hc_product_category } = proxy.useDict("hc_product_category")
const list = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const open = ref(false)
const dialogTitle = ref("")
const ids = ref([])
const multiple = ref(true)
const queryParams = ref({ pageNum: 1, pageSize: 10, productCode: undefined, productName: undefined, category: undefined, status: undefined })
const form = ref({})

function getList() {
  loading.value = true
  listProduct(queryParams.value).then(response => {
    list.value = response.rows
    total.value = response.total
    loading.value = false
  })
}
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm("queryRef"); handleQuery() }
function handleSelectionChange(selection) {
  ids.value = selection.map(i => i.productId)
  multiple.value = !selection.length
}
function openAdd() {
  form.value = { category: "2", unit: "个", status: "0", batchManage: "0", shelfLifeDays: 0, safetyStock: 0, purchasePrice: 0, salePrice: 0 }
  dialogTitle.value = "新增商品/耗材"
  open.value = true
}
function openEdit(row) {
  form.value = { ...row }
  dialogTitle.value = "修改商品/耗材"
  open.value = true
}
function submitForm() {
  if (!form.value.productName) return proxy.$modal.msgError("请填写名称")
  const req = form.value.productId ? updateProduct(form.value) : addProduct(form.value)
  req.then(r => {
    proxy.$modal.msgSuccess(r.msg || "保存成功")
    open.value = false
    getList()
  })
}
function handleDelete(row) {
  const productIds = row && row.productId ? [row.productId] : ids.value
  if (!productIds.length) return proxy.$modal.msgError("请选择要删除的数据")
  proxy.$modal.confirm('是否确认删除选中的 ' + productIds.length + ' 条数据？').then(() => delProduct(productIds))
    .then(() => { getList(); proxy.$modal.msgSuccess("删除成功") }).catch(() => {})
}
getList()
</script>
