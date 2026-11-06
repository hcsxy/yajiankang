<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="门店编码" prop="storeCode">
        <el-input v-model="queryParams.storeCode" placeholder="请输入门店编码" clearable style="width: 200px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="门店名称" prop="storeName">
        <el-input v-model="queryParams.storeName" placeholder="请输入门店名称" clearable style="width: 200px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['hc:store:add']">新增</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="storeList">
      <el-table-column label="编码" prop="storeCode" width="110" />
      <el-table-column label="门店名称" prop="storeName" :show-overflow-tooltip="true" />
      <el-table-column label="类型" prop="storeType" width="90">
        <template #default="scope">
          <dict-tag :options="hc_store_type" :value="scope.row.storeType" />
        </template>
      </el-table-column>
      <el-table-column label="区域" width="110">
        <template #default="scope">{{ scope.row.regionName || scope.row.region }}</template>
      </el-table-column>
      <el-table-column label="地址" prop="address" :show-overflow-tooltip="true" />
      <el-table-column label="店长" prop="managerName" width="90" />
      <el-table-column label="价格系数" prop="priceRate" width="90" />
      <el-table-column label="状态" align="center" width="80">
        <template #default="scope">
          <el-switch v-model="scope.row.status" active-value="0" inactive-value="1" @change="handleStatusChange(scope.row)"></el-switch>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="150" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['hc:store:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['hc:store:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="title" v-model="open" width="600px" append-to-body>
      <el-form ref="storeRef" :model="form" :rules="rules" label-width="90px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="门店编码" prop="storeCode">
              <el-input v-model="form.storeCode" placeholder="请输入门店编码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="门店名称" prop="storeName">
              <el-input v-model="form.storeName" placeholder="请输入门店名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="类型" prop="storeType">
              <el-select v-model="form.storeType" placeholder="请选择">
                <el-option v-for="dict in hc_store_type" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属区域" prop="regionId">
              <el-select v-model="form.regionId" clearable filterable placeholder="选择区域（M8 区域数据权限）" @change="onRegionChange">
                <el-option v-for="r in regionOptions" :key="r.regionId" :label="r.regionName" :value="r.regionId" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="区域简称" prop="region">
              <el-input v-model="form.region" placeholder="如：华东（历史文本，选择区域后自动回填）" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="地址" prop="address">
          <el-input v-model="form.address" placeholder="请输入地址" />
        </el-form-item>
        <el-row>
          <el-col :span="12">
            <el-form-item label="店长" prop="managerName">
              <el-input v-model="form.managerName" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="价格系数" prop="priceRate">
              <el-input-number v-model="form.priceRate" :min="0.1" :max="3" :precision="2" :step="0.1" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="phone">
              <el-input v-model="form.phone" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio value="0">启用</el-radio>
                <el-radio value="1">停用</el-radio>
              </el-radio-group>
            </el-form-item>
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

<script setup name="Store">
import { listStore, getStore, addStore, updateStore, delStore } from "@/api/hc/basic"
import { regionOptions as listRegionOption } from "@/api/hc/distribution"

const { proxy } = getCurrentInstance()
const { hc_store_type } = proxy.useDict("hc_store_type")

const storeList = ref([])
const regionOptions = ref([])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const title = ref("")
const total = ref(0)
const data = reactive({
  form: {},
  queryParams: { pageNum: 1, pageSize: 10, storeCode: undefined, storeName: undefined },
  rules: {
    storeCode: [{ required: true, message: "门店编码不能为空", trigger: "blur" }],
    storeName: [{ required: true, message: "门店名称不能为空", trigger: "blur" }]
  }
})
const { queryParams, form, rules } = toRefs(data)

function getList() {
  loading.value = true
  listStore(queryParams.value).then(response => {
    storeList.value = response.rows
    total.value = response.total
    loading.value = false
  })
}
function cancel() { open.value = false; reset() }
function reset() {
  form.value = { storeId: undefined, storeCode: undefined, storeName: undefined, storeType: "1", regionId: undefined, region: undefined, address: undefined, managerName: undefined, phone: undefined, priceRate: 1.0, status: "0" }
  proxy.resetForm("storeRef")
}
/** 选择区域后回填区域简称，保留历史报表口径 */
function onRegionChange(regionId) {
  const r = regionOptions.value.find(item => item.regionId === regionId)
  if (r) form.value.region = r.regionName
}
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm("queryRef"); handleQuery() }
function handleAdd() { reset(); open.value = true; title.value = "新增门店" }
function handleUpdate(row) {
  reset()
  getStore(row.storeId).then(response => { form.value = response.data; open.value = true; title.value = "修改门店" })
}
function handleStatusChange(row) {
  updateStore({ storeId: row.storeId, status: row.status }).then(() => proxy.$modal.msgSuccess("修改成功")).catch(() => { row.status = row.status === "0" ? "1" : "0" })
}
function submitForm() {
  proxy.$refs["storeRef"].validate(valid => {
    if (valid) {
      if (form.value.storeId != undefined) {
        updateStore(form.value).then(() => { proxy.$modal.msgSuccess("修改成功"); open.value = false; getList() })
      } else {
        addStore(form.value).then(() => { proxy.$modal.msgSuccess("新增成功"); open.value = false; getList() })
      }
    }
  })
}
function handleDelete(row) {
  proxy.$modal.confirm('是否确认删除门店"' + row.storeName + '"？').then(function () {
    return delStore(row.storeId)
  }).then(() => { getList(); proxy.$modal.msgSuccess("删除成功") }).catch(() => {})
}
listRegionOption().then(res => { regionOptions.value = res.data || [] })
getList()
</script>
