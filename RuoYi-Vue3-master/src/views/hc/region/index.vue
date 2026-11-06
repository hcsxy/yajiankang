<template>
  <div class="app-container">
    <el-form :model="queryParams" :inline="true" v-show="showSearch" ref="queryRef">
      <el-form-item label="区域名称" prop="regionName">
        <el-input v-model="queryParams.regionName" placeholder="区域名称" clearable style="width: 160px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="层级" prop="regionLevel">
        <el-select v-model="queryParams.regionLevel" clearable placeholder="层级" style="width: 120px">
          <el-option v-for="d in levelOptions" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" clearable placeholder="状态" style="width: 100px">
          <el-option label="正常" value="0" /><el-option label="停用" value="1" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['hc:region:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="info" plain icon="Sort" @click="toggleExpandAll">展开/折叠</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-if="refreshTable" v-loading="loading" :data="regionList" row-key="regionId" :default-expand-all="isExpandAll"
      :tree-props="{ children: 'children', hasChildren: 'hasChildren' }">
      <el-table-column prop="regionName" label="区域名称" width="240" :show-overflow-tooltip="true" />
      <el-table-column prop="regionCode" label="区域编码" width="140" />
      <el-table-column prop="regionLevel" label="层级" width="90" align="center">
        <template #default="scope">{{ levelLabel(scope.row.regionLevel) }}</template>
      </el-table-column>
      <el-table-column prop="storeCount" label="门店数" width="80" align="center" />
      <el-table-column prop="leaderName" label="负责人" width="110" />
      <el-table-column prop="leaderPhone" label="联系电话" width="130" />
      <el-table-column prop="orderNum" label="排序" width="70" align="center" />
      <el-table-column prop="status" label="状态" width="80" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.status === '0' ? 'success' : 'info'">{{ scope.row.status === '0' ? '正常' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="180" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['hc:region:edit']">修改</el-button>
          <el-button link type="primary" icon="Plus" @click="handleAdd(scope.row)" v-hasPermi="['hc:region:add']">新增</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['hc:region:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog :title="title" v-model="open" width="620px" append-to-body>
      <el-form ref="regionRef" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="24">
            <el-form-item label="上级区域" prop="parentId">
              <el-select v-model="form.parentId" clearable placeholder="不选则为顶级区域" style="width: 100%">
                <el-option v-for="item in flatList" :key="item.regionId" :label="item.levelName" :value="item.regionId" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="区域名称" prop="regionName">
              <el-input v-model="form.regionName" placeholder="如：华东大区 / 杭州市" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="区域编码" prop="regionCode">
              <el-input v-model="form.regionCode" placeholder="唯一编码，如 HD / HZ" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="层级" prop="regionLevel">
              <el-select v-model="form.regionLevel" placeholder="层级" style="width: 100%">
                <el-option v-for="d in levelOptions" :key="d.value" :label="d.label" :value="d.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="显示顺序" prop="orderNum">
              <el-input-number v-model="form.orderNum" controls-position="right" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="负责人" prop="leaderName">
              <el-input v-model="form.leaderName" placeholder="区域负责人" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="leaderPhone">
              <el-input v-model="form.leaderPhone" maxlength="11" placeholder="负责人电话" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio value="0">正常</el-radio>
                <el-radio value="1">停用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" type="textarea" placeholder="备注" />
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

<script setup name="Region">
import { regionTree, getRegion, addRegion, updateRegion, delRegion } from "@/api/hc/distribution"

const { proxy } = getCurrentInstance()
const levelOptions = [
  { value: "1", label: "省/直辖市" }, { value: "2", label: "市" },
  { value: "3", label: "商圈" }, { value: "4", label: "片区" }
]
const regionList = ref([])
const flatList = ref([])
const loading = ref(true)
const showSearch = ref(true)
const title = ref("")
const open = ref(false)
const isExpandAll = ref(true)
const refreshTable = ref(true)
const queryParams = ref({ regionName: undefined, regionLevel: undefined, status: undefined })
const data = {
  form: {},
  rules: {
    regionName: [{ required: true, message: "区域名称不能为空", trigger: "blur" }],
    regionCode: [{ required: true, message: "区域编码不能为空", trigger: "blur" }],
    regionLevel: [{ required: true, message: "层级不能为空", trigger: "change" }]
  }
}
const { form, rules } = toRefs(data)

function levelLabel(v) {
  const d = levelOptions.find(o => o.value === v)
  return d ? d.label : v
}
/** 平铺列表（父级下拉用，带层级前缀） */
function flatten(rows, prefix) {
  const out = []
  rows.forEach(r => {
    const node = { regionId: r.regionId, levelName: prefix + r.regionName, parentId: r.parentId }
    out.push(node)
    if (r.children && r.children.length) {
      out.push.apply(out, flatten(r.children, prefix + "　┗ "))
    }
  })
  return out
}
function getList() {
  loading.value = true
  regionTree(queryParams.value).then(response => {
    const rows = response.data || []
    regionList.value = rows
    flatList.value = flatten(rows, "")
    loading.value = false
  })
}
function cancel() { open.value = false; reset() }
function reset() {
  form.value = { regionId: undefined, parentId: undefined, regionName: undefined, regionCode: undefined,
    regionLevel: "2", orderNum: 0, leaderName: undefined, leaderPhone: undefined, status: "0", remark: undefined }
  proxy.resetForm("regionRef")
}
function handleQuery() { getList() }
function resetQuery() { proxy.resetForm("queryRef"); handleQuery() }
function toggleExpandAll() { refreshTable.value = false; isExpandAll.value = !isExpandAll.value; refreshTable.value = true }
function handleAdd(row) {
  reset()
  if (row && row.regionId) {
    form.value.parentId = row.regionId
    const parent = flatList.value.find(f => f.regionId === row.regionId)
    form.value.regionLevel = parent && row.regionLevel === "1" ? "2" : (Number(row.regionLevel) < 4 ? String(Number(row.regionLevel) + 1) : row.regionLevel)
  }
  title.value = "添加区域"
  open.value = true
}
function handleUpdate(row) {
  reset()
  getRegion(row.regionId).then(response => {
    form.value = response.data
    title.value = "修改区域"
    open.value = true
  })
}
function submitForm() {
  proxy.$refs["regionRef"].validate(valid => {
    if (valid) {
      if (form.value.regionId != undefined) {
        updateRegion(form.value).then(() => { proxy.$modal.msgSuccess("修改成功"); open.value = false; getList() })
      } else {
        addRegion(form.value).then(() => { proxy.$modal.msgSuccess("新增成功"); open.value = false; getList() })
      }
    }
  })
}
function handleDelete(row) {
  proxy.$modal.confirm('是否确认删除区域【' + row.regionName + '】？').then(function () {
    return delRegion(row.regionId)
  }).then(() => { getList(); proxy.$modal.msgSuccess("删除成功") }).catch(() => {})
}
getList()
</script>
