<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="老客姓名" prop="refCustomerName">
        <el-input v-model="queryParams.refCustomerName" placeholder="老客姓名" clearable style="width: 140px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="新客姓名" prop="newCustomerName">
        <el-input v-model="queryParams.newCustomerName" placeholder="新客姓名" clearable style="width: 140px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" clearable placeholder="状态" style="width: 110px">
          <el-option v-for="d in hc_referral_status" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="创建时间" style="width: 340px">
        <el-date-picker v-model="dateRange" value-format="YYYY-MM-DD" type="daterange" start-placeholder="开始" end-placeholder="结束" style="width: 240px" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5"><el-button type="primary" plain icon="Plus" @click="openBind" v-hasPermi="['hc:referral:bind']">绑定关系</el-button></el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="list">
      <el-table-column label="记录号" prop="referralId" width="80" />
      <el-table-column label="老客" prop="refCustomerName" width="120" />
      <el-table-column label="新客" prop="newCustomerName" width="120" />
      <el-table-column label="渠道" prop="channelName" width="130">
        <template #default="scope">{{ scope.row.channelName || '-' }}</template>
      </el-table-column>
      <el-table-column label="状态" width="90" align="center">
        <template #default="scope"><dict-tag :options="hc_referral_status" :value="scope.row.status" /></template>
      </el-table-column>
      <el-table-column label="奖励类型" width="100" align="center">
        <template #default="scope"><dict-tag :options="hc_reward_type" :value="scope.row.rewardType" /></template>
      </el-table-column>
      <el-table-column label="奖励值" prop="rewardValue" width="100" align="right" />
      <el-table-column label="首单ID" prop="firstOrderId" width="90" align="center">
        <template #default="scope">{{ scope.row.firstOrderId || '-' }}</template>
      </el-table-column>
      <el-table-column label="奖励卡ID" prop="rewardCardId" width="100" align="center">
        <template #default="scope">{{ scope.row.rewardCardId || '-' }}</template>
      </el-table-column>
      <el-table-column label="奖励时间" prop="rewardTime" width="160">
        <template #default="scope">{{ scope.row.rewardTime || '-' }}</template>
      </el-table-column>
      <el-table-column label="创建时间" prop="createTime" width="160" />
      <el-table-column label="备注" prop="remark" :show-overflow-tooltip="true" />
      <el-table-column label="操作" align="center" width="120" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button v-if="scope.row.status === '0'" link type="success" icon="Money" @click="handleReward(scope.row)" v-hasPermi="['hc:referral:reward']">奖励重发</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog title="绑定介绍关系" v-model="bindOpen" width="520px" append-to-body>
      <el-form label-width="100px">
        <el-form-item label="新客" required>
          <el-select v-model="bindForm.newCustomerId" filterable placeholder="选择新客" style="width: 100%">
            <el-option v-for="c in customerOptions" :key="c.customerId" :label="c.name + '（' + c.phone + '）'" :value="c.customerId" />
          </el-select>
        </el-form-item>
        <el-form-item label="老客手机号" required>
          <el-input v-model="bindForm.refPhone" maxlength="11" placeholder="请输入老客手机号，系统按手机号匹配老客档案" />
        </el-form-item>
        <el-form-item label="渠道">
          <el-select v-model="bindForm.channelCode" clearable filterable placeholder="可选，关联渠道码" style="width: 100%">
            <el-option v-for="ch in channelOptions" :key="ch.channelId" :label="ch.channelName + '（' + ch.channelCode + '）'" :value="ch.channelCode" />
          </el-select>
        </el-form-item>
        <el-form-item label="门店">
          <el-select v-model="bindForm.storeId" clearable placeholder="默认当前门店" style="width: 100%">
            <el-option v-for="s in storeOptions" :key="s.storeId" :label="s.storeName" :value="s.storeId" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer><div class="dialog-footer"><el-button type="primary" @click="submitBind">确 定</el-button><el-button @click="bindOpen = false">取 消</el-button></div></template>
    </el-dialog>
  </div>
</template>

<script setup name="HcReferral">
import { listReferral, bindReferral, rewardReferral, listChannel } from "@/api/hc/growth"
import { listStore } from "@/api/hc/basic"
import { listCustomer } from "@/api/hc/card"

const { proxy } = getCurrentInstance()
const { hc_referral_status, hc_reward_type } = proxy.useDict("hc_referral_status", "hc_reward_type")
const list = ref([])
const customerOptions = ref([])
const channelOptions = ref([])
const storeOptions = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const dateRange = ref([])
const bindOpen = ref(false)
const bindForm = ref({})
const queryParams = ref({ pageNum: 1, pageSize: 10, refCustomerName: undefined, newCustomerName: undefined, status: undefined })

function getList() {
  loading.value = true
  const params = proxy.addDateRange({ ...queryParams.value }, dateRange.value)
  listReferral(params).then(response => {
    list.value = response.rows
    total.value = response.total
    loading.value = false
  })
}
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { dateRange.value = []; proxy.resetForm("queryRef"); handleQuery() }
function openBind() {
  bindForm.value = { newCustomerId: undefined, refPhone: undefined, channelCode: undefined, storeId: undefined }
  bindOpen.value = true
}
function submitBind() {
  const f = bindForm.value
  if (!f.newCustomerId) return proxy.$modal.msgError("请选择新客")
  if (!f.refPhone) return proxy.$modal.msgError("请填写老客手机号")
  const params = { newCustomerId: f.newCustomerId, refPhone: f.refPhone }
  if (f.channelCode) params.channelCode = f.channelCode
  if (f.storeId) params.storeId = f.storeId
  bindReferral(params).then(r => {
    proxy.$modal.msgSuccess(r.msg || "绑定成功")
    bindOpen.value = false
    getList()
  })
}
function handleReward(row) {
  proxy.$modal.confirm("确认重发老客奖励？新客需已完成首单。").then(() => rewardReferral(row.referralId))
    .then(r => { proxy.$modal.msgSuccess(r.msg || "奖励已发放"); getList() }).catch(() => {})
}

listCustomer({ pageNum: 1, pageSize: 500 }).then(r => customerOptions.value = r.rows)
listChannel({ pageNum: 1, pageSize: 200 }).then(r => channelOptions.value = r.rows)
listStore({ pageNum: 1, pageSize: 200 }).then(r => storeOptions.value = r.rows)
getList()
</script>
