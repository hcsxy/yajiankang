<template>
  <div class="app-container">
    <!-- 开票统计 -->
    <el-row :gutter="16" class="mb8">
      <el-col :span="4"><div class="kpi"><div class="kpi-label">待开票笔数</div><div class="kpi-value">{{ stat.pending_count || 0 }}</div><div class="kpi-sub">{{ money(stat.pending_amount) }} 元</div></div></el-col>
      <el-col :span="4"><div class="kpi"><div class="kpi-label">已开票笔数</div><div class="kpi-value">{{ stat.issued_count || 0 }}</div><div class="kpi-sub">{{ money(stat.issued_amount) }} 元</div></div></el-col>
      <el-col :span="4"><div class="kpi"><div class="kpi-label">累计申请笔数</div><div class="kpi-value">{{ stat.total || 0 }}</div><div class="kpi-sub">已开 {{ stat.issued_count || 0 }} 笔</div></div></el-col>
      <el-col :span="4"><div class="kpi kpi-danger"><div class="kpi-label">红冲金额</div><div class="kpi-value">{{ money(stat.red_amount) }}</div><div class="kpi-sub">负数计入</div></div></el-col>
      <el-col :span="4"><div class="kpi kpi-success"><div class="kpi-label">实际开票净额</div><div class="kpi-value">{{ money(stat.net_amount) }}</div><div class="kpi-sub">已开 - 红冲</div></div></el-col>
      <el-col :span="4"><div class="kpi"><div class="kpi-label">税额合计</div><div class="kpi-value">{{ money(stat.tax_amount) }}</div><div class="kpi-sub">价税分离口径</div></div></el-col>
    </el-row>

    <el-form :model="queryParams" ref="queryRef" :inline="true">
      <el-form-item label="申请单号" prop="invoiceNo">
        <el-input v-model="queryParams.invoiceNo" placeholder="申请单号" clearable style="width: 160px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="发票号码" prop="invoiceCode">
        <el-input v-model="queryParams.invoiceCode" placeholder="发票号码" clearable style="width: 150px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="客户" prop="customerName">
        <el-input v-model="queryParams.customerName" placeholder="客户姓名" clearable style="width: 120px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="发票类型" prop="invoiceType">
        <el-select v-model="queryParams.invoiceType" clearable placeholder="全部" style="width: 130px">
          <el-option v-for="d in hc_invoice_type" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="关联业务" prop="bizType">
        <el-select v-model="queryParams.bizType" clearable placeholder="全部" style="width: 130px">
          <el-option v-for="d in bizOptions" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="invoiceStatus">
        <el-select v-model="queryParams.invoiceStatus" clearable placeholder="全部" style="width: 120px">
          <el-option v-for="d in hc_invoice_status" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="申请日期">
        <el-date-picker v-model="dateRange" type="daterange" value-format="YYYY-MM-DD" start-placeholder="开始" end-placeholder="结束" style="width: 240px" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row class="mb8">
      <el-button type="primary" plain icon="Plus" @click="handleApply" v-hasPermi="['hc:invoice:add']">开票申请</el-button>
      <el-button type="danger" plain icon="Delete" :disabled="!ids.length" @click="handleDelete()" v-hasPermi="['hc:invoice:remove']">删除</el-button>
      <el-alert title="充值开票对应售卡订单实付、消费开票对应核销确认收入，同一业务单据累计开票不得超过其可开金额；红冲将生成负数发票并回写原票状态。" type="info" :closable="false" style="width: 820px" />
    </el-row>

    <el-table v-loading="loading" :data="list" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="50" :selectable="row => row.invoiceStatus === '0' || row.invoiceStatus === '3'" />
      <el-table-column label="申请单号" prop="invoiceNo" width="170" />
      <el-table-column label="发票号码" prop="invoiceCode" width="140" :show-overflow-tooltip="true">
        <template #default="scope">{{ scope.row.invoiceCode || '-' }}</template>
      </el-table-column>
      <el-table-column label="发票类型" width="100" align="center">
        <template #default="scope"><dict-tag :options="hc_invoice_type" :value="scope.row.invoiceType" /></template>
      </el-table-column>
      <el-table-column label="关联业务" width="100" align="center">
        <template #default="scope">{{ bizLabel(scope.row.bizType) }}</template>
      </el-table-column>
      <el-table-column label="客户" prop="customerName" width="90">
        <template #default="scope">{{ scope.row.customerName || '-' }}</template>
      </el-table-column>
      <el-table-column label="发票抬头" :show-overflow-tooltip="true">
        <template #default="scope">
          <div>{{ scope.row.invoiceTitle }}</div>
          <div class="sub-text">{{ scope.row.titleType === '2' ? '企业' : '个人' }}{{ scope.row.taxNo ? '｜' + scope.row.taxNo : '' }}</div>
        </template>
      </el-table-column>
      <el-table-column label="票种" width="130" align="center">
        <template #default="scope"><dict-tag :options="hc_invoice_kind" :value="scope.row.invoiceKind" /></template>
      </el-table-column>
      <el-table-column label="开票金额" width="110" align="right">
        <template #default="scope"><span :class="Number(scope.row.amount) < 0 ? 'text-danger' : ''">{{ money(scope.row.amount) }}</span></template>
      </el-table-column>
      <el-table-column label="税率" width="70" align="right">
        <template #default="scope">{{ scope.row.taxRate == null ? '-' : percent(scope.row.taxRate) }}</template>
      </el-table-column>
      <el-table-column label="税额" width="90" align="right">
        <template #default="scope">{{ money(scope.row.taxAmount) }}</template>
      </el-table-column>
      <el-table-column label="开票日期" width="110" align="center">
        <template #default="scope">{{ scope.row.invoiceDate || '-' }}</template>
      </el-table-column>
      <el-table-column label="状态" width="90" align="center">
        <template #default="scope"><dict-tag :options="hc_invoice_status" :value="scope.row.invoiceStatus" /></template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="230" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="View" @click="openDetail(scope.row)" v-hasPermi="['hc:invoice:query']">详情</el-button>
          <el-button link type="primary" icon="Select" :disabled="scope.row.invoiceStatus !== '0'" @click="openIssue(scope.row)" v-hasPermi="['hc:invoice:issue']">开票</el-button>
          <el-button link type="warning" icon="RefreshLeft" :disabled="scope.row.invoiceStatus !== '1' || scope.row.invoiceType === '3'" @click="openRed(scope.row)" v-hasPermi="['hc:invoice:red']">红冲</el-button>
          <el-button link type="danger" icon="CircleClose" :disabled="scope.row.invoiceStatus !== '0'" @click="handleCancel(scope.row)" v-hasPermi="['hc:invoice:edit']">作废</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- 开票申请 -->
    <el-dialog title="开票申请" v-model="applyOpen" width="640px" append-to-body>
      <el-form ref="applyRef" :model="applyForm" :rules="applyRules" label-width="105px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="关联业务" prop="bizType">
              <el-select v-model="applyForm.bizType" style="width: 100%" @change="onBizChange">
                <el-option v-for="d in bizOptions" :key="d.value" :label="d.label" :value="d.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发票类型" prop="invoiceType">
              <el-select v-model="applyForm.invoiceType" style="width: 100%">
                <el-option v-for="d in hc_invoice_type.filter(x => x.value !== '3')" :key="d.value" :label="d.label" :value="d.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item v-if="applyForm.bizType === '1' || applyForm.bizType === '2'" label="业务单据">
          <el-select v-model="applyForm.bizId" filterable clearable placeholder="从近期单据中选择（可不选）" style="width: 100%" @change="onDocChange">
            <el-option v-for="d in docList" :key="d.id" :label="d.label" :value="d.id" />
          </el-select>
          <div class="tip-text">未加载到单据时可由客户姓名检索后手工填写业务单据ID</div>
        </el-form-item>
        <el-form-item v-if="applyForm.bizType === '1' || applyForm.bizType === '2'" label="单据ID" prop="bizIdInput">
          <el-input v-model="applyForm.bizIdInput" placeholder="业务单据ID（订单ID / 核销ID）" style="width: 220px" @input="syncBizId" />
        </el-form-item>
        <el-row>
          <el-col :span="12"><el-form-item label="客户ID" prop="customerId"><el-input v-model="applyForm.customerId" placeholder="客户ID" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="客户姓名" prop="customerName"><el-input v-model="applyForm.customerName" placeholder="客户姓名" maxlength="50" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="抬头类型" prop="titleType">
          <el-radio-group v-model="applyForm.titleType">
            <el-radio value="1">个人</el-radio><el-radio value="2">企业</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="发票抬头" prop="invoiceTitle">
          <el-input v-model="applyForm.invoiceTitle" placeholder="发票上显示的抬头" maxlength="100" />
        </el-form-item>
        <el-row>
          <el-col :span="12">
            <el-form-item v-if="applyForm.titleType === '2'" label="纳税人识别号" prop="taxNo">
              <el-input v-model="applyForm.taxNo" placeholder="15~20位" maxlength="30" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="票种" prop="invoiceKind">
              <el-select v-model="applyForm.invoiceKind" style="width: 100%">
                <el-option v-for="d in hc_invoice_kind" :key="d.value" :label="d.label" :value="d.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="开票金额" prop="amount">
              <el-input-number v-model="applyForm.amount" :min="0.01" :precision="2" :step="100" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="税率" prop="taxRate">
              <el-input-number v-model="applyForm.taxRate" :min="0" :max="0.2" :step="0.01" :precision="4" style="width: 100%" />
              <div class="tip-text">税额 = 金额 /(1+税率)×税率，估算 {{ money(taxPreview) }}</div>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注" prop="remark"><el-input v-model="applyForm.remark" type="textarea" :rows="2" maxlength="300" /></el-form-item>
      </el-form>
      <template #footer><div class="dialog-footer"><el-button type="primary" @click="submitApply">确 定</el-button><el-button @click="applyOpen = false">取 消</el-button></div></template>
    </el-dialog>

    <!-- 确认开票 -->
    <el-dialog title="确认开票" v-model="issueOpen" width="460px" append-to-body>
      <el-form ref="issueRef" :model="issueForm" :rules="issueRules" label-width="100px">
        <el-form-item label="申请单号">{{ issueForm.invoiceNo }}</el-form-item>
        <el-form-item label="抬头">{{ issueForm.invoiceTitle }}</el-form-item>
        <el-form-item label="金额">{{ money(issueForm.amount) }} 元</el-form-item>
        <el-form-item label="发票号码" prop="invoiceCode"><el-input v-model="issueForm.invoiceCode" placeholder="实际发票号码" maxlength="30" /></el-form-item>
        <el-form-item label="开票日期" prop="invoiceDate">
          <el-date-picker v-model="issueForm.invoiceDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer><div class="dialog-footer"><el-button type="primary" @click="submitIssue">确 定</el-button><el-button @click="issueOpen = false">取 消</el-button></div></template>
    </el-dialog>

    <!-- 红冲 -->
    <el-dialog title="发票红冲" v-model="redOpen" width="480px" append-to-body>
      <el-form ref="redRef" :model="redForm" :rules="redRules" label-width="100px">
        <el-form-item label="原发票">{{ redForm.invoiceNo }}（{{ redForm.invoiceCode }}）</el-form-item>
        <el-form-item label="原金额">{{ money(redForm.amount) }} 元</el-form-item>
        <el-form-item label="红冲原因" prop="redReason"><el-input v-model="redForm.redReason" type="textarea" :rows="2" placeholder="必填，将留痕" maxlength="200" /></el-form-item>
        <el-form-item label="红冲票号" prop="invoiceCode"><el-input v-model="redForm.invoiceCode" placeholder="留空自动生成 HC-原票号" maxlength="30" /></el-form-item>
      </el-form>
      <template #footer><div class="dialog-footer"><el-button type="primary" @click="submitRed">确 定</el-button><el-button @click="redOpen = false">取 消</el-button></div></template>
    </el-dialog>

    <!-- 详情 -->
    <el-drawer title="发票详情" v-model="detailOpen" size="480px">
      <el-descriptions :column="1" border size="small">
        <el-descriptions-item label="申请单号">{{ detail.invoiceNo }}</el-descriptions-item>
        <el-descriptions-item label="发票号码">{{ detail.invoiceCode || '未开具' }}</el-descriptions-item>
        <el-descriptions-item label="发票类型"><dict-tag :options="hc_invoice_type" :value="detail.invoiceType" /></el-descriptions-item>
        <el-descriptions-item label="关联业务">{{ bizLabel(detail.bizType) }}（单据ID：{{ detail.bizId || '-' }}）</el-descriptions-item>
        <el-descriptions-item label="客户">{{ detail.customerName || '-' }}（ID：{{ detail.customerId || '-' }}）</el-descriptions-item>
        <el-descriptions-item label="抬头类型">{{ detail.titleType === '2' ? '企业' : '个人' }}</el-descriptions-item>
        <el-descriptions-item label="发票抬头">{{ detail.invoiceTitle }}</el-descriptions-item>
        <el-descriptions-item label="纳税人识别号">{{ detail.taxNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="票种"><dict-tag :options="hc_invoice_kind" :value="detail.invoiceKind" /></el-descriptions-item>
        <el-descriptions-item label="开票金额">{{ money(detail.amount) }}</el-descriptions-item>
        <el-descriptions-item label="税率 / 税额">{{ percent(detail.taxRate) }} / {{ money(detail.taxAmount) }}</el-descriptions-item>
        <el-descriptions-item label="开票日期">{{ detail.invoiceDate || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态"><dict-tag :options="hc_invoice_status" :value="detail.invoiceStatus" /></el-descriptions-item>
        <el-descriptions-item label="红冲原因">{{ detail.redReason || '-' }}</el-descriptions-item>
        <el-descriptions-item label="红冲时间">{{ detail.redTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="开票人">{{ detail.issueBy || '-' }} {{ detail.issueTime || '' }}</el-descriptions-item>
        <el-descriptions-item label="申请人">{{ detail.createBy }} {{ detail.createTime }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ detail.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-drawer>
  </div>
</template>

<script setup name="Invoice">
import { listInvoice, invoiceSummary, getInvoice, addInvoice, issueInvoice, redInvoice, cancelInvoice, delInvoice } from "@/api/hc/invoice"
import { listOrder, listVerification } from "@/api/hc/ledger"

const { proxy } = getCurrentInstance()
const { hc_invoice_type, hc_invoice_status, hc_invoice_kind } = proxy.useDict("hc_invoice_type", "hc_invoice_status", "hc_invoice_kind")

const bizOptions = [
  { value: "1", label: "售卡充值" },
  { value: "2", label: "核销消费" },
  { value: "3", label: "零售" },
  { value: "4", label: "其他" }
]

const list = ref([])
const total = ref(0)
const loading = ref(false)
const ids = ref([])
const dateRange = ref([])
const stat = ref({})
const queryParams = ref({ pageNum: 1, pageSize: 10, invoiceNo: undefined, invoiceCode: undefined, customerName: undefined, invoiceType: undefined, bizType: undefined, invoiceStatus: undefined })

function money(v) {
  return v == null ? '0.00' : Number(v).toFixed(2)
}
function percent(v) {
  return v == null || v === '' ? '-' : (Number(v) * 100).toFixed(2) + '%'
}
function bizLabel(v) {
  const d = bizOptions.find(x => x.value === v)
  return d ? d.label : (v || '-')
}

function getList() {
  loading.value = true
  const params = proxy.addDateRange({ ...queryParams.value }, dateRange.value)
  listInvoice(params).then(r => {
    list.value = r.rows
    total.value = r.total
    loading.value = false
  })
  invoiceSummary(params).then(r => { stat.value = r.data || {} })
}
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { dateRange.value = []; proxy.resetForm("queryRef"); handleQuery() }
function handleSelectionChange(selection) { ids.value = selection.map(item => item.invoiceId) }

/* ---------------- 开票申请 ---------------- */
const applyOpen = ref(false)
const applyForm = ref({})
const docList = ref([])
const applyRules = {
  bizType: [{ required: true, message: "请选择关联业务", trigger: "change" }],
  invoiceType: [{ required: true, message: "请选择发票类型", trigger: "change" }],
  invoiceTitle: [{ required: true, message: "发票抬头不能为空", trigger: "blur" }],
  amount: [{ required: true, message: "开票金额不能为空", trigger: "blur" }],
  taxNo: [{ validator: (rule, value, callback) => {
    if (applyForm.value.titleType === '2' && !value) callback(new Error("企业抬头必须填写纳税人识别号"))
    else callback()
  }, trigger: "blur" }]
}
const taxPreview = computed(() => {
  const a = Number(applyForm.value.amount) || 0
  const r = Number(applyForm.value.taxRate) || 0
  return a > 0 ? (a / (1 + r) * r).toFixed(2) : '0.00'
})

function handleApply() {
  applyForm.value = {
    bizType: "2", invoiceType: "2", bizId: undefined, bizIdInput: undefined,
    customerId: undefined, customerName: undefined, titleType: "1", invoiceTitle: undefined,
    taxNo: undefined, invoiceKind: "1", amount: undefined, taxRate: 0.06, remark: undefined
  }
  docList.value = []
  applyOpen.value = true
  loadDocs()
}
function onBizChange(val) {
  applyForm.value.bizId = undefined
  applyForm.value.bizIdInput = undefined
  applyForm.value.invoiceType = val === "1" ? "1" : "2"
  docList.value = []
  loadDocs()
}
function loadDocs() {
  const t = applyForm.value.bizType
  if (t !== "1" && t !== "2") return
  const req = t === "1" ? listOrder({ pageNum: 1, pageSize: 50 }) : listVerification({ pageNum: 1, pageSize: 50 })
  req.then(r => {
    const rows = r.rows || []
    docList.value = rows.map(o => t === "1"
      ? { id: o.orderId, label: o.orderNo + '｜' + (o.customerName || '') + '｜' + money(o.amount) + '元｜' + (o.itemName || ''), raw: o, amount: o.amount }
      : { id: o.verifyId, label: o.verifyNo + '｜' + (o.customerName || '') + '｜' + money(o.confirmAmount) + '元｜' + (o.itemName || ''), raw: o, amount: o.confirmAmount })
  }).catch(() => { docList.value = [] })
}
function onDocChange(val) {
  const d = docList.value.find(x => x.id === val)
  if (!d) return
  applyForm.value.bizIdInput = String(val)
  applyForm.value.customerId = d.raw.customerId
  applyForm.value.customerName = d.raw.customerName
  if (d.amount != null) applyForm.value.amount = Number(d.amount)
}
function syncBizId(v) {
  applyForm.value.bizId = v ? Number(v) : undefined
}
function submitApply() {
  proxy.$refs["applyRef"].validate(valid => {
    if (!valid) return
    const f = applyForm.value
    const body = {
      bizType: f.bizType,
      bizId: f.bizId || f.bizIdInput || undefined,
      orderId: f.bizType === "1" ? (f.bizId || f.bizIdInput || undefined) : undefined,
      verifyId: f.bizType === "2" ? (f.bizId || f.bizIdInput || undefined) : undefined,
      invoiceType: f.invoiceType,
      customerId: f.customerId || undefined,
      customerName: f.customerName,
      titleType: f.titleType,
      invoiceTitle: f.invoiceTitle,
      taxNo: f.taxNo,
      invoiceKind: f.invoiceKind,
      amount: f.amount,
      taxRate: f.taxRate,
      remark: f.remark
    }
    if (body.bizId === '') body.bizId = undefined
    addInvoice(body).then(() => {
      proxy.$modal.msgSuccess("开票申请已提交，等待开具")
      applyOpen.value = false
      getList()
    })
  })
}

/* ---------------- 确认开票 ---------------- */
const issueOpen = ref(false)
const issueForm = ref({})
const issueRules = { invoiceCode: [{ required: true, message: "请录入发票号码", trigger: "blur" }] }
function today() {
  const d = new Date()
  const m = d.getMonth() + 1, day = d.getDate()
  return d.getFullYear() + '-' + (m < 10 ? '0' + m : m) + '-' + (day < 10 ? '0' + day : day)
}
function openIssue(row) {
  issueForm.value = { invoiceId: row.invoiceId, invoiceNo: row.invoiceNo, invoiceTitle: row.invoiceTitle, amount: row.amount, invoiceCode: undefined, invoiceDate: today() }
  issueOpen.value = true
}
function submitIssue() {
  proxy.$refs["issueRef"].validate(valid => {
    if (!valid) return
    issueInvoice({ invoiceId: issueForm.value.invoiceId, invoiceCode: issueForm.value.invoiceCode, invoiceDate: issueForm.value.invoiceDate })
      .then(() => { proxy.$modal.msgSuccess("已开票"); issueOpen.value = false; getList() })
  })
}

/* ---------------- 红冲 ---------------- */
const redOpen = ref(false)
const redForm = ref({})
const redRules = { redReason: [{ required: true, message: "红冲原因不能为空", trigger: "blur" }] }
function openRed(row) {
  redForm.value = { invoiceId: row.invoiceId, invoiceNo: row.invoiceNo, invoiceCode: row.invoiceCode, amount: row.amount, redReason: undefined }
  redOpen.value = true
}
function submitRed() {
  proxy.$refs["redRef"].validate(valid => {
    if (!valid) return
    redInvoice({ invoiceId: redForm.value.invoiceId, redReason: redForm.value.redReason, invoiceCode: redForm.value.invoiceCode })
      .then(() => { proxy.$modal.msgSuccess("红冲完成"); redOpen.value = false; getList() })
  })
}

/* ---------------- 详情 / 作废 / 删除 ---------------- */
const detailOpen = ref(false)
const detail = ref({})
function openDetail(row) {
  getInvoice(row.invoiceId).then(r => {
    detail.value = r.data || row
    detailOpen.value = true
  })
}
function handleCancel(row) {
  proxy.$modal.confirm('确认作废申请单【' + row.invoiceNo + '】？').then(() => cancelInvoice(row.invoiceId))
    .then(() => { getList(); proxy.$modal.msgSuccess("已作废") }).catch(() => {})
}
function handleDelete() {
  proxy.$modal.confirm('确认删除选中的 ' + ids.value.length + ' 条发票记录？仅待开/已作废可删除。').then(() => delInvoice(ids.value))
    .then(() => { getList(); proxy.$modal.msgSuccess("删除成功") }).catch(() => {})
}

getList()
</script>

<style scoped>
.kpi { background: #fff; border: 1px solid #ebeef5; border-radius: 6px; padding: 12px 14px; }
.kpi-label { font-size: 12px; color: #909399; }
.kpi-value { font-size: 22px; font-weight: 600; color: #303133; margin-top: 4px; }
.kpi-sub { font-size: 12px; color: #606266; margin-top: 2px; }
.kpi-danger .kpi-value { color: #f56c6c; }
.kpi-success .kpi-value { color: #67c23a; }
.sub-text { font-size: 12px; color: #909399; }
.text-danger { color: #f56c6c; }
.tip-text { font-size: 12px; color: #909399; line-height: 18px; }
</style>
