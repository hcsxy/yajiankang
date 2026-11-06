<template>
  <div class="app-container">
    <!-- 评分汇总 -->
    <el-row :gutter="16" class="mb8">
      <el-col :span="4"><el-card shadow="never"><div class="kpi-label">评价总数</div><div class="kpi-value">{{ summary.total || 0 }}</div></el-card></el-col>
      <el-col :span="4"><el-card shadow="never"><div class="kpi-label">好评数</div><div class="kpi-value ok">{{ summary.goodCount || 0 }}</div></el-card></el-col>
      <el-col :span="4"><el-card shadow="never"><div class="kpi-label">投诉/差评</div><div class="kpi-value danger">{{ summary.badCount || 0 }}</div></el-card></el-col>
      <el-col :span="4"><el-card shadow="never"><div class="kpi-label">待处理</div><div class="kpi-value warn">{{ summary.pendingCount || 0 }}</div></el-card></el-col>
      <el-col :span="4"><el-card shadow="never"><div class="kpi-label">平均总分</div><div class="kpi-value">{{ summary.avgScore || 0 }}</div></el-card></el-col>
      <el-col :span="4"><el-card shadow="never"><div class="kpi-label">服务/效果均分</div><div class="kpi-value">{{ summary.avgService || 0 }} / {{ summary.avgEffect || 0 }}</div></el-card></el-col>
    </el-row>

    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="客户" prop="customerName">
        <el-input v-model="queryParams.customerName" placeholder="客户姓名" clearable style="width: 130px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="技师" prop="technicianId">
        <el-select v-model="queryParams.technicianId" clearable filterable placeholder="技师" style="width: 140px">
          <el-option v-for="t in techOptions" :key="t.technicianId" :label="t.techName" :value="t.technicianId" />
        </el-select>
      </el-form-item>
      <el-form-item label="类型" prop="reviewType">
        <el-select v-model="queryParams.reviewType" clearable placeholder="类型" style="width: 110px">
          <el-option v-for="d in hc_review_type" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="处理状态" prop="handleStatus">
        <el-select v-model="queryParams.handleStatus" clearable placeholder="状态" style="width: 120px">
          <el-option v-for="d in hc_review_status" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="评价日期">
        <el-date-picker v-model="dateRange" type="daterange" value-format="YYYY-MM-DD" start-placeholder="开始" end-placeholder="结束" style="width: 240px" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row class="mb8">
      <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['hc:review:add']">录入评价</el-button>
      <el-button type="warning" plain icon="Bell" @click="filterPending">只看待处理</el-button>
      <el-alert title="一条核销仅可评价一次；好评自动闭环，投诉/建议需商家回复处理" type="info" :closable="false" style="width: 520px" />
    </el-row>

    <el-table v-loading="loading" :data="list">
      <el-table-column label="客户" prop="customerName" width="100" />
      <el-table-column label="技师" prop="technicianName" width="100" />
      <el-table-column label="门店" prop="storeName" width="120" :show-overflow-tooltip="true" />
      <el-table-column label="评分" width="170" align="center">
        <template #default="scope">
          <el-rate :model-value="Number(scope.row.score) || 0" disabled />
        </template>
      </el-table-column>
      <el-table-column label="服务/效果" width="95" align="center">
        <template #default="scope">{{ scope.row.scoreService || '-' }} / {{ scope.row.scoreEffect || '-' }}</template>
      </el-table-column>
      <el-table-column label="类型" width="90" align="center">
        <template #default="scope">
          <el-tag :type="typeTag(scope.row.reviewType)">{{ typeLabel(scope.row.reviewType) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="评价内容" prop="content" min-width="180" :show-overflow-tooltip="true" />
      <el-table-column label="回复" prop="reply" min-width="150" :show-overflow-tooltip="true" />
      <el-table-column label="处理状态" width="100" align="center">
        <template #default="scope">
          <el-tag :type="statusTag(scope.row.handleStatus)">{{ statusLabel(scope.row.handleStatus) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="评价时间" width="150" align="center">
        <template #default="scope">{{ parseTime(scope.row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="180" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="ChatDotRound" @click="openReply(scope.row)" v-hasPermi="['hc:review:reply']">回复</el-button>
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['hc:review:edit']">修改</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['hc:review:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- 评价录入/修改 -->
    <el-dialog :title="title" v-model="open" width="620px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="客户" prop="customerId">
          <el-select v-model="form.customerId" filterable remote :remote-method="searchCustomer" style="width: 100%" @change="onCustomerChange">
            <el-option v-for="c in customerOptions" :key="c.customerId" :label="c.name + '（' + (c.phone || '') + '）'" :value="c.customerId" />
          </el-select>
        </el-form-item>
        <el-row>
          <el-col :span="12">
            <el-form-item label="门店" prop="storeId">
              <el-select v-model="form.storeId" style="width: 100%">
                <el-option v-for="s in storeOptions" :key="s.storeId" :label="s.storeName" :value="s.storeId" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="技师" prop="technicianId">
              <el-select v-model="form.technicianId" clearable filterable style="width: 100%" @change="onTechChange">
                <el-option v-for="t in techOptions" :key="t.technicianId" :label="t.techName" :value="t.technicianId" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="核销单ID" prop="verifyId">
          <el-input v-model="form.verifyId" placeholder="关联核销记录ID（可空，一单一评）" />
        </el-form-item>
        <el-form-item label="总体评分" prop="score">
          <el-rate v-model="form.score" :max="5" show-score />
          <span class="tip-text">≤2 分默认归为投诉</span>
        </el-form-item>
        <el-row>
          <el-col :span="12">
            <el-form-item label="服务评分"><el-rate v-model="form.scoreService" :max="5" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="效果评分"><el-rate v-model="form.scoreEffect" :max="5" /></el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="评价类型" prop="reviewType">
          <el-select v-model="form.reviewType" clearable style="width: 100%">
            <el-option v-for="d in hc_review_type" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="评价内容"><el-input v-model="form.content" type="textarea" :rows="3" /></el-form-item>
        <el-form-item label="匿名">
          <el-switch v-model="form.anonymous" active-value="1" inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer"><el-button type="primary" @click="submitForm">确 定</el-button><el-button @click="open = false">取 消</el-button></div>
      </template>
    </el-dialog>

    <!-- 回复 -->
    <el-dialog title="评价回复" v-model="replyOpen" width="560px" append-to-body>
      <el-descriptions :column="1" border class="mb8">
        <el-descriptions-item label="客户">{{ replyForm.customerName }}</el-descriptions-item>
        <el-descriptions-item label="评分">{{ replyForm.score }}</el-descriptions-item>
        <el-descriptions-item label="内容">{{ replyForm.content }}</el-descriptions-item>
      </el-descriptions>
      <el-form ref="replyFormRef" :model="replyForm" :rules="replyRules" label-width="90px">
        <el-form-item label="回复内容" prop="reply">
          <el-input v-model="replyForm.reply" type="textarea" :rows="4" placeholder="请输入回复内容" />
        </el-form-item>
        <el-form-item label="处理状态" prop="handleStatus">
          <el-select v-model="replyForm.handleStatus" style="width: 100%">
            <el-option label="已回复" value="1" /><el-option label="已处理" value="2" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer"><el-button type="primary" @click="submitReply">提交回复</el-button><el-button @click="replyOpen = false">取 消</el-button></div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Review">
import { listReview, reviewSummary, addReview, updateReview, replyReview, delReview } from "@/api/hc/review"
import { listStore, listTechnician } from "@/api/hc/basic"
import { listCustomer } from "@/api/hc/card"

const { proxy } = getCurrentInstance()
const { hc_review_type, hc_review_status } = proxy.useDict("hc_review_type", "hc_review_status")

const list = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const summary = ref({})
const title = ref("")
const open = ref(false)
const replyOpen = ref(false)
const storeOptions = ref([])
const techOptions = ref([])
const customerOptions = ref([])
const dateRange = ref([])
const queryParams = ref({ pageNum: 1, pageSize: 10, customerName: undefined, technicianId: undefined, reviewType: undefined, handleStatus: undefined })
const form = ref({})
const replyForm = ref({})

const rules = {
  customerId: [{ required: true, message: "请选择客户", trigger: "change" }],
  storeId: [{ required: true, message: "请选择门店", trigger: "change" }],
  score: [{ required: true, message: "请选择总体评分", trigger: "change" }]
}
const replyRules = {
  reply: [{ required: true, message: "回复内容不能为空", trigger: "blur" }]
}

function typeLabel(v) {
  const d = hc_review_type.value.find(x => x.value === v)
  return d ? d.label : v
}
function typeTag(v) {
  return { "1": "success", "2": "danger", "3": "warning" }[v] || "info"
}
function statusLabel(v) {
  const d = hc_review_status.value.find(x => x.value === v)
  return d ? d.label : v
}
function statusTag(v) {
  return { "0": "warning", "1": "primary", "2": "success" }[v] || "info"
}

function getList() {
  loading.value = true
  const params = proxy.addDateRange({ ...queryParams.value }, dateRange.value)
  listReview(params).then(r => {
    list.value = r.rows
    total.value = r.total
    loading.value = false
  })
  reviewSummary(params).then(r => summary.value = r.data || {})
}
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() {
  dateRange.value = []
  proxy.resetForm("queryRef")
  handleQuery()
}
function filterPending() {
  queryParams.value.handleStatus = "0"
  handleQuery()
}

function searchCustomer(kw) {
  listCustomer({ pageNum: 1, pageSize: 20, name: kw }).then(r => customerOptions.value = r.rows)
}
function onCustomerChange(id) {
  const c = customerOptions.value.find(x => x.customerId === id)
  form.value.customerName = c ? c.name : undefined
}
function onTechChange(id) {
  const t = techOptions.value.find(x => x.technicianId === id)
  form.value.technicianName = t ? t.techName : undefined
}

function reset() {
  form.value = { reviewId: undefined, customerId: undefined, customerName: undefined, storeId: undefined, technicianId: undefined, technicianName: undefined, verifyId: undefined, score: 5, scoreService: 5, scoreEffect: 5, reviewType: undefined, content: undefined, anonymous: "0" }
  proxy.resetForm("formRef")
}
function handleAdd() { reset(); searchCustomer(""); open.value = true; title.value = "录入评价" }
function handleUpdate(row) {
  reset()
  form.value = { ...row, score: Number(row.score) || 5, anonymous: row.anonymous || "0" }
  customerOptions.value = [{ customerId: row.customerId, name: row.customerName, phone: "" }]
  open.value = true
  title.value = "修改评价"
}
function submitForm() {
  proxy.$refs["formRef"].validate(valid => {
    if (!valid) return
    const fn = form.value.reviewId ? updateReview : addReview
    fn(form.value).then(() => {
      proxy.$modal.msgSuccess("操作成功")
      open.value = false
      getList()
    })
  })
}
function handleDelete(row) {
  proxy.$modal.confirm('确认删除该评价记录？').then(() => delReview(row.reviewId))
    .then(() => { getList(); proxy.$modal.msgSuccess("删除成功") }).catch(() => {})
}

function openReply(row) {
  replyForm.value = { reviewId: row.reviewId, customerName: row.customerName, score: row.score, content: row.content, reply: row.reply || undefined, handleStatus: "1" }
  proxy.resetForm("replyFormRef")
  replyOpen.value = true
}
function submitReply() {
  proxy.$refs["replyFormRef"].validate(valid => {
    if (!valid) return
    replyReview({ reviewId: replyForm.value.reviewId, reply: replyForm.value.reply, handleStatus: replyForm.value.handleStatus }).then(() => {
      proxy.$modal.msgSuccess("回复成功")
      replyOpen.value = false
      getList()
    })
  })
}

listStore({ pageNum: 1, pageSize: 200 }).then(r => storeOptions.value = r.rows)
listTechnician({ pageNum: 1, pageSize: 500, status: "0" }).then(r => techOptions.value = r.rows)
getList()
</script>

<style scoped>
.kpi-label { font-size: 13px; color: #909399; margin-bottom: 8px; }
.kpi-value { font-size: 22px; font-weight: 600; }
.kpi-value.ok { color: #67c23a; }
.kpi-value.warn { color: #e6a23c; }
.kpi-value.danger { color: #f56c6c; }
.tip-text { font-size: 12px; color: #909399; margin-left: 8px; }
</style>
