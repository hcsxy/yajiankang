<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="消息类型" prop="msgType">
        <el-select v-model="queryParams.msgType" clearable placeholder="类型" style="width: 130px">
          <el-option v-for="d in hc_msg_type" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="接收人" prop="receiverName">
        <el-input v-model="queryParams.receiverName" placeholder="接收人名称" clearable style="width: 150px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="渠道" prop="channel">
        <el-select v-model="queryParams.channel" clearable placeholder="渠道" style="width: 130px">
          <el-option v-for="d in hc_msg_channel" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="已读" prop="readFlag">
        <el-select v-model="queryParams.readFlag" clearable placeholder="状态" style="width: 110px">
          <el-option label="未读" value="0" /><el-option label="已读" value="1" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row class="mb8">
      <el-button type="primary" plain icon="Promotion" @click="openSend" v-hasPermi="['hc:message:send']">发送消息</el-button>
      <el-button type="success" plain icon="Check" :disabled="!multiple.length" @click="handleRead()" v-hasPermi="['hc:message:list']">标记已读</el-button>
      <el-button type="danger" plain icon="Delete" :disabled="!multiple.length" @click="handleDelete()" v-hasPermi="['hc:message:send']">删除</el-button>
    </el-row>

    <el-table v-loading="loading" :data="list" @selection-change="v => multiple = v">
      <el-table-column type="selection" width="50" />
      <el-table-column label="ID" prop="messageId" width="70" />
      <el-table-column label="类型" width="100" align="center">
        <template #default="scope"><dict-tag :options="hc_msg_type" :value="scope.row.msgType" /></template>
      </el-table-column>
      <el-table-column label="接收人" width="140">
        <template #default="scope">{{ scope.row.receiverName }}<el-tag size="small" style="margin-left: 4px">{{ receiverLabel(scope.row.receiverType) }}</el-tag></template>
      </el-table-column>
      <el-table-column label="标题" prop="title" width="160" :show-overflow-tooltip="true" />
      <el-table-column label="内容" prop="content" :show-overflow-tooltip="true" />
      <el-table-column label="渠道" width="100" align="center">
        <template #default="scope"><dict-tag :options="hc_msg_channel" :value="scope.row.channel" /></template>
      </el-table-column>
      <el-table-column label="发送状态" width="90" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.sendStatus === '1' ? 'success' : scope.row.sendStatus === '2' ? 'danger' : 'info'">
            {{ scope.row.sendStatus === '1' ? '已发送' : scope.row.sendStatus === '2' ? '失败' : '待发送' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="已读" width="70" align="center">
        <template #default="scope">{{ scope.row.readFlag === '1' ? '已读' : '未读' }}</template>
      </el-table-column>
      <el-table-column label="发送时间" prop="sendTime" width="150" />
    </el-table>
    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- 手动发送 -->
    <el-dialog title="发送消息" v-model="sendOpen" width="560px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="消息类型" prop="msgType">
          <el-select v-model="form.msgType" style="width: 100%">
            <el-option v-for="d in hc_msg_type" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="接收人类型" prop="receiverType">
          <el-radio-group v-model="form.receiverType">
            <el-radio value="1">客户</el-radio><el-radio value="2">员工/门店</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="接收人" prop="receiverId">
          <el-select v-if="form.receiverType === '1'" v-model="form.receiverId" filterable placeholder="选择客户" style="width: 100%" @change="onCustomerChange">
            <el-option v-for="c in customerOptions" :key="c.customerId" :label="c.name + '（' + c.customerNo + '）'" :value="c.customerId" />
          </el-select>
          <el-select v-else v-model="form.receiverId" filterable placeholder="选择门店" style="width: 100%" @change="onStoreChange">
            <el-option v-for="s in storeOptions" :key="s.storeId" :label="s.storeName" :value="s.storeId" />
          </el-select>
        </el-form-item>
        <el-form-item label="渠道" prop="channel">
          <el-select v-model="form.channel" style="width: 100%">
            <el-option v-for="d in hc_msg_channel" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="标题" prop="title"><el-input v-model="form.title" maxlength="100" /></el-form-item>
        <el-form-item label="内容" prop="content"><el-input v-model="form.content" type="textarea" :rows="4" /></el-form-item>
      </el-form>
      <template #footer><div class="dialog-footer"><el-button type="primary" @click="submitSend">发 送</el-button><el-button @click="sendOpen = false">取 消</el-button></div></template>
    </el-dialog>
  </div>
</template>

<script setup name="Message">
import { listMessage, sendMessage, readMessage, delMessage } from "@/api/hc/message"
import { listCustomer } from "@/api/hc/card"
import { listStore } from "@/api/hc/basic"

const { proxy } = getCurrentInstance()
const { hc_msg_type, hc_msg_channel, hc_receiver_type } = proxy.useDict("hc_msg_type", "hc_msg_channel", "hc_receiver_type")
const list = ref([])
const customerOptions = ref([])
const storeOptions = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const sendOpen = ref(false)
const multiple = ref([])
const queryParams = ref({ pageNum: 1, pageSize: 10, msgType: undefined, receiverName: undefined, channel: undefined, readFlag: undefined })
const form = ref({})
const rules = {
  msgType: [{ required: true, message: "消息类型不能为空", trigger: "change" }],
  title: [{ required: true, message: "标题不能为空", trigger: "blur" }],
  content: [{ required: true, message: "内容不能为空", trigger: "blur" }]
}

function receiverLabel(v) {
  const d = (hc_receiver_type.value || []).find(x => x.value === v)
  return d ? d.label : v
}
function getList() {
  loading.value = true
  listMessage(queryParams.value).then(response => {
    list.value = response.rows
    total.value = response.total
    loading.value = false
  })
}
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm("queryRef"); handleQuery() }
function openSend() {
  form.value = { msgType: "9", receiverType: "1", receiverId: undefined, receiverName: undefined, channel: "1", title: undefined, content: undefined }
  proxy.resetForm("formRef")
  sendOpen.value = true
}
function onCustomerChange(id) {
  const c = customerOptions.value.find(x => x.customerId === id)
  form.value.receiverName = c ? c.name : undefined
}
function onStoreChange(id) {
  const s = storeOptions.value.find(x => x.storeId === id)
  form.value.receiverName = s ? s.storeName : undefined
}
function submitSend() {
  proxy.$refs["formRef"].validate(valid => {
    if (!valid) return
    if (!form.value.receiverId) return proxy.$modal.msgError("请选择接收人")
    sendMessage(form.value).then(r => { proxy.$modal.msgSuccess(r.msg || "发送成功"); sendOpen.value = false; getList() })
  })
}
function handleRead() {
  readMessage(multiple.value.map(r => r.messageId).join(",")).then(() => { getList(); proxy.$modal.msgSuccess("已标记已读") })
}
function handleDelete() {
  proxy.$modal.confirm('确认删除所选消息？').then(() => delMessage(multiple.value.map(r => r.messageId).join(","))).then(() => {
    getList(); proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}
listCustomer({ pageNum: 1, pageSize: 500 }).then(r => customerOptions.value = r.rows)
listStore({ pageNum: 1, pageSize: 200 }).then(r => storeOptions.value = r.rows)
getList()
</script>
