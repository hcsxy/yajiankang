<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="渠道编码" prop="channelCode">
        <el-input v-model="queryParams.channelCode" placeholder="渠道编码" clearable style="width: 150px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="渠道名称" prop="channelName">
        <el-input v-model="queryParams.channelName" placeholder="渠道名称" clearable style="width: 150px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="渠道类型" prop="channelType">
        <el-select v-model="queryParams.channelType" clearable placeholder="类型" style="width: 130px">
          <el-option v-for="d in hc_channel_type" :key="d.value" :label="d.label" :value="d.value" />
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

    <el-row class="mb8">
      <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['hc:channel:add']">新增渠道</el-button>
    </el-row>

    <el-table v-loading="loading" :data="list">
      <el-table-column label="渠道编码" prop="channelCode" width="130" />
      <el-table-column label="渠道名称" prop="channelName" width="150" show-overflow-tooltip />
      <el-table-column label="渠道类型" width="110" align="center">
        <template #default="scope"><dict-tag :options="hc_channel_type" :value="scope.row.channelType" /></template>
      </el-table-column>
      <el-table-column label="归属门店" prop="storeName" width="130">
        <template #default="scope">{{ scope.row.storeName || '总部通用' }}</template>
      </el-table-column>
      <el-table-column label="渠道成本(元)" prop="costAmount" width="120" align="right" />
      <el-table-column label="状态" width="80" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.status === '0' ? 'success' : 'info'">{{ scope.row.status === '0' ? '启用' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="带参链接" prop="linkUrl" show-overflow-tooltip />
      <el-table-column label="操作" align="center" width="220" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="CopyDocument" @click="handleCopy(scope.row)">复制链接</el-button>
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['hc:channel:edit']">修改</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['hc:channel:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="title" v-model="open" width="600px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-row>
          <el-col :span="12"><el-form-item label="渠道编码" prop="channelCode"><el-input v-model="form.channelCode" maxlength="32" placeholder="如 MT001" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="渠道名称" prop="channelName"><el-input v-model="form.channelName" maxlength="100" /></el-form-item></el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="渠道类型" prop="channelType">
              <el-select v-model="form.channelType" placeholder="请选择" style="width: 100%">
                <el-option v-for="d in hc_channel_type" :key="d.value" :label="d.label" :value="d.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="归属门店" prop="storeId">
              <el-select v-model="form.storeId" clearable placeholder="不选为总部通用" style="width: 100%">
                <el-option v-for="s in storeOptions" :key="s.storeId" :label="s.storeName" :value="s.storeId" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12"><el-form-item label="渠道成本(元)" prop="costAmount"><el-input-number v-model="form.costAmount" :min="0" :precision="2" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="form.status"><el-radio value="0">启用</el-radio><el-radio value="1">停用</el-radio></el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注" prop="remark"><el-input v-model="form.remark" type="textarea" /></el-form-item>
      </el-form>
      <template #footer><div class="dialog-footer"><el-button type="primary" @click="submitForm">确 定</el-button><el-button @click="open = false">取 消</el-button></div></template>
    </el-dialog>
  </div>
</template>

<script setup name="HcChannel">
import { listChannel, getChannel, addChannel, updateChannel, delChannel, buildChannelLink } from "@/api/hc/growth"
import { listStore } from "@/api/hc/basic"

const { proxy } = getCurrentInstance()
const { hc_channel_type } = proxy.useDict("hc_channel_type")
const list = ref([])
const storeOptions = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const title = ref("")
const open = ref(false)
const queryParams = ref({ pageNum: 1, pageSize: 10, channelCode: undefined, channelName: undefined, channelType: undefined, status: undefined })
const form = ref({})
const rules = {
  channelCode: [{ required: true, message: "渠道编码不能为空", trigger: "blur" }],
  channelName: [{ required: true, message: "渠道名称不能为空", trigger: "blur" }],
  channelType: [{ required: true, message: "渠道类型不能为空", trigger: "change" }]
}

function getList() {
  loading.value = true
  listChannel(queryParams.value).then(response => {
    list.value = response.rows
    total.value = response.total
    loading.value = false
  })
}
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm("queryRef"); handleQuery() }
function reset() {
  form.value = { channelId: undefined, channelCode: undefined, channelName: undefined, channelType: "9", storeId: undefined, costAmount: 0, status: "0", remark: undefined }
  proxy.resetForm("formRef")
}
function handleAdd() { reset(); open.value = true; title.value = "新增渠道码" }
function handleUpdate(row) {
  reset()
  getChannel(row.channelId).then(response => { form.value = response.data; open.value = true; title.value = "修改渠道码" })
}
function submitForm() {
  proxy.$refs["formRef"].validate(valid => {
    if (!valid) return
    const fn = form.value.channelId ? updateChannel : addChannel
    fn(form.value).then(r => {
      proxy.$modal.msgSuccess(r.msg || "操作成功")
      if (r.linkUrl) proxy.$modal.alert("带参链接已生成：\n" + r.linkUrl, "推广链接")
      open.value = false
      getList()
    })
  })
}
function handleDelete(row) {
  proxy.$modal.confirm('确认删除渠道码"' + row.channelName + '"？').then(() => delChannel(row.channelId))
    .then(() => { getList(); proxy.$modal.msgSuccess("删除成功") }).catch(() => {})
}
function handleCopy(row) {
  buildChannelLink(row.channelCode).then(r => {
    const link = r.linkUrl
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).then(() => proxy.$modal.msgSuccess("已复制带参链接：" + link))
    } else {
      proxy.$modal.alert(link, "带参链接")
    }
  })
}

listStore({ pageNum: 1, pageSize: 200 }).then(r => storeOptions.value = r.rows)
getList()
</script>
