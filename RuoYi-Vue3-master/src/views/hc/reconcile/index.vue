<template>
  <div class="app-container">
    <el-row :gutter="16" class="mb8">
      <el-col :span="4"><div class="kpi"><div class="kpi-label">对账批次</div><div class="kpi-value">{{ stat.batch_count || 0 }}</div><div class="kpi-sub">待处理 {{ stat.pending_batch || 0 }} 批</div></div></el-col>
      <el-col :span="4"><div class="kpi"><div class="kpi-label">账单流水笔数</div><div class="kpi-value">{{ stat.total_count || 0 }}</div><div class="kpi-sub">逐笔比对</div></div></el-col>
      <el-col :span="4"><div class="kpi"><div class="kpi-label">账单金额合计</div><div class="kpi-value">{{ money(stat.total_amount) }}</div><div class="kpi-sub">元</div></div></el-col>
      <el-col :span="4"><div class="kpi kpi-danger"><div class="kpi-label">差异笔数</div><div class="kpi-value">{{ stat.diff_count || 0 }}</div><div class="kpi-sub">本地无单/金额不符等</div></div></el-col>
      <el-col :span="4"><div class="kpi kpi-danger"><div class="kpi-label">差异金额</div><div class="kpi-value">{{ money(stat.diff_amount) }}</div><div class="kpi-sub">渠道 - 本地</div></div></el-col>
      <el-col :span="4"><div class="kpi kpi-success"><div class="kpi-label">已匹配笔数</div><div class="kpi-value">{{ matchCount }}</div><div class="kpi-sub">匹配率 {{ matchRate }}</div></div></el-col>
    </el-row>

    <el-tabs v-model="tab">
      <!-- 批次 -->
      <el-tab-pane label="对账批次" name="batch">
        <el-form :model="batchQuery" ref="batchQueryRef" :inline="true">
          <el-form-item label="批次号" prop="batchNo">
            <el-input v-model="batchQuery.batchNo" placeholder="批次号" clearable style="width: 160px" @keyup.enter="handleBatchQuery" />
          </el-form-item>
          <el-form-item label="渠道" prop="channel">
            <el-select v-model="batchQuery.channel" clearable placeholder="全部" style="width: 120px">
              <el-option v-for="d in hc_pay_channel" :key="d.value" :label="d.label" :value="d.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="对账状态" prop="reconcileStatus">
            <el-select v-model="batchQuery.reconcileStatus" clearable placeholder="全部" style="width: 120px">
              <el-option v-for="d in hc_reconcile_status" :key="d.value" :label="d.label" :value="d.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="账单日期">
            <el-date-picker v-model="batchRange" type="daterange" value-format="YYYY-MM-DD" start-placeholder="开始" end-placeholder="结束" style="width: 240px" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="handleBatchQuery">搜索</el-button>
            <el-button icon="Refresh" @click="resetBatchQuery">重置</el-button>
          </el-form-item>
        </el-form>
        <el-row class="mb8">
          <el-button type="primary" plain icon="Upload" @click="openImport" v-hasPermi="['hc:reconcile:add']">导入渠道账单</el-button>
          <el-alert title="导入后系统按商户订单号与本地售卡订单逐笔比对：查无此单或订单已退款/取消记「本地无单」，金额不一致记「金额不符」，交易号重复记「重复入账」，账单日内本地已付但账单缺失记「渠道无单」。" type="info" :closable="false" style="width: 820px" />
        </el-row>
        <el-table v-loading="batchLoading" :data="batchList">
          <el-table-column label="批次号" prop="batchNo" width="180" />
          <el-table-column label="渠道" width="90" align="center">
            <template #default="scope"><dict-tag :options="hc_pay_channel" :value="scope.row.channel" /></template>
          </el-table-column>
          <el-table-column label="账单日期" prop="billDate" width="110" align="center" />
          <el-table-column label="来源文件" prop="fileName" :show-overflow-tooltip="true">
            <template #default="scope">{{ scope.row.fileName || '手工录入' }}</template>
          </el-table-column>
          <el-table-column label="流水笔数" prop="totalCount" width="90" align="center" />
          <el-table-column label="账单金额" width="110" align="right">
            <template #default="scope">{{ money(scope.row.totalAmount) }}</template>
          </el-table-column>
          <el-table-column label="匹配笔数" prop="matchedCount" width="90" align="center" />
          <el-table-column label="差异笔数" width="90" align="center">
            <template #default="scope"><span :class="scope.row.diffCount > 0 ? 'text-danger' : ''">{{ scope.row.diffCount }}</span></template>
          </el-table-column>
          <el-table-column label="差异金额" width="110" align="right">
            <template #default="scope">{{ money(scope.row.diffAmount) }}</template>
          </el-table-column>
          <el-table-column label="对账状态" width="90" align="center">
            <template #default="scope"><dict-tag :options="hc_reconcile_status" :value="scope.row.reconcileStatus" /></template>
          </el-table-column>
          <el-table-column label="对账人" prop="handler" width="90" />
          <el-table-column label="导入时间" prop="createTime" width="160" />
          <el-table-column label="操作" align="center" width="150" class-name="small-padding fixed-width">
            <template #default="scope">
              <el-button link type="primary" icon="Tickets" @click="viewDiff(scope.row)" v-hasPermi="['hc:reconcile:list']">差异明细</el-button>
              <el-button link type="danger" icon="Delete" @click="handleDelBatch(scope.row)" v-hasPermi="['hc:reconcile:remove']">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <pagination v-show="batchTotal > 0" :total="batchTotal" v-model:page="batchQuery.pageNum" v-model:limit="batchQuery.pageSize" @pagination="getBatchList" />
      </el-tab-pane>

      <!-- 差异明细 -->
      <el-tab-pane label="逐笔明细" name="record">
        <el-form :model="recQuery" ref="recQueryRef" :inline="true">
          <el-form-item label="所属批次" prop="batchId">
            <el-select v-model="recQuery.batchId" clearable filterable placeholder="全部批次" style="width: 200px">
              <el-option v-for="b in batchList" :key="b.batchId" :label="b.batchNo + '（' + b.billDate + '）'" :value="b.batchId" />
            </el-select>
          </el-form-item>
          <el-form-item label="渠道" prop="channel">
            <el-select v-model="recQuery.channel" clearable placeholder="全部" style="width: 120px">
              <el-option v-for="d in hc_pay_channel" :key="d.value" :label="d.label" :value="d.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="渠道交易号" prop="channelTradeNo">
            <el-input v-model="recQuery.channelTradeNo" placeholder="交易号" clearable style="width: 160px" @keyup.enter="handleRecQuery" />
          </el-form-item>
          <el-form-item label="商户订单号" prop="localOrderNo">
            <el-input v-model="recQuery.localOrderNo" placeholder="本地订单号" clearable style="width: 160px" @keyup.enter="handleRecQuery" />
          </el-form-item>
          <el-form-item label="差异类型" prop="diffType">
            <el-select v-model="recQuery.diffType" clearable placeholder="全部" style="width: 130px">
              <el-option v-for="d in hc_diff_type" :key="d.value" :label="d.label" :value="d.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="处理状态" prop="handleStatus">
            <el-select v-model="recQuery.handleStatus" clearable placeholder="全部" style="width: 120px">
              <el-option v-for="d in hc_handle_status" :key="d.value" :label="d.label" :value="d.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="只看差异">
            <el-switch v-model="recQuery.diffOnly" active-value="1" inactive-value="" @change="handleRecQuery" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="handleRecQuery">搜索</el-button>
            <el-button icon="Refresh" @click="resetRecQuery">重置</el-button>
          </el-form-item>
        </el-form>
        <el-table v-loading="recLoading" :data="recList">
          <el-table-column label="批次" prop="batchId" width="80" align="center" />
          <el-table-column label="渠道" width="85" align="center">
            <template #default="scope"><dict-tag :options="hc_pay_channel" :value="scope.row.channel" /></template>
          </el-table-column>
          <el-table-column label="渠道交易号" prop="channelTradeNo" width="180" :show-overflow-tooltip="true" />
          <el-table-column label="商户订单号" prop="localOrderNo" width="170" :show-overflow-tooltip="true">
            <template #default="scope">{{ scope.row.localOrderNo || '-' }}</template>
          </el-table-column>
          <el-table-column label="渠道金额" width="100" align="right">
            <template #default="scope">{{ money(scope.row.tradeAmount) }}</template>
          </el-table-column>
          <el-table-column label="本地金额" width="100" align="right">
            <template #default="scope">{{ scope.row.localAmount == null ? '-' : money(scope.row.localAmount) }}</template>
          </el-table-column>
          <el-table-column label="比对结果" width="90" align="center">
            <template #default="scope"><el-tag :type="scope.row.matchStatus === '1' ? 'success' : 'danger'">{{ scope.row.matchStatus === '1' ? '一致' : '差异' }}</el-tag></template>
          </el-table-column>
          <el-table-column label="差异类型" width="100" align="center">
            <template #default="scope"><dict-tag v-if="scope.row.diffType" :options="hc_diff_type" :value="scope.row.diffType" /><span v-else>-</span></template>
          </el-table-column>
          <el-table-column label="差异金额" width="100" align="right">
            <template #default="scope"><span :class="Number(scope.row.diffAmount) !== 0 ? 'text-danger' : ''">{{ money(scope.row.diffAmount) }}</span></template>
          </el-table-column>
          <el-table-column label="交易时间" prop="tradeTime" width="160" />
          <el-table-column label="处理状态" width="90" align="center">
            <template #default="scope">
              <dict-tag v-if="scope.row.matchStatus === '2'" :options="hc_handle_status" :value="scope.row.handleStatus" />
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="处理人" prop="handler" width="90">
            <template #default="scope">{{ scope.row.handler || '-' }}</template>
          </el-table-column>
          <el-table-column label="处理说明" prop="handleRemark" :show-overflow-tooltip="true">
            <template #default="scope">{{ scope.row.handleRemark || '-' }}</template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="100" class-name="small-padding fixed-width">
            <template #default="scope">
              <el-button link type="primary" icon="Setting" :disabled="scope.row.matchStatus !== '2' || scope.row.handleStatus !== '0'" @click="openHandle(scope.row)" v-hasPermi="['hc:reconcile:handle']">处理</el-button>
            </template>
          </el-table-column>
        </el-table>
        <pagination v-show="recTotal > 0" :total="recTotal" v-model:page="recQuery.pageNum" v-model:limit="recQuery.pageSize" @pagination="getRecList" />
      </el-tab-pane>
    </el-tabs>

    <!-- 账单导入 -->
    <el-dialog title="导入渠道账单" v-model="importOpen" width="860px" append-to-body>
      <el-form ref="importRef" :model="importForm" :rules="importRules" label-width="100px">
        <el-row>
          <el-col :span="8">
            <el-form-item label="对账渠道" prop="channel">
              <el-select v-model="importForm.channel" style="width: 100%">
                <el-option v-for="d in hc_pay_channel" :key="d.value" :label="d.label" :value="d.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="账单日期" prop="billDate">
              <el-date-picker v-model="importForm.billDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="来源文件" prop="fileName">
              <el-input v-model="importForm.fileName" placeholder="如 wechat_20261031.csv" maxlength="100" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="账单内容">
          <el-input v-model="jsonText" type="textarea" :rows="5" placeholder='粘贴渠道账单 JSON 数组，例如：[{"channelTradeNo":"4200123456","localOrderNo":"SC20261031001","amount":2800,"tradeTime":"2026-10-31 10:20:00"}]' />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" plain icon="Document" @click="parseJson">解析账单</el-button>
          <el-button plain icon="Plus" @click="addRow">手工加一行</el-button>
          <span class="tip-text">localOrderNo 为本地售卡订单号；未填或本地查无此单将判为「本地无单」差异。</span>
        </el-form-item>
        <el-form-item label="流水预览">
          <el-table :data="importForm.items" size="small" max-height="240" border>
            <el-table-column label="渠道交易号" width="200">
              <template #default="scope"><el-input v-model="scope.row.channelTradeNo" size="small" placeholder="必填" /></template>
            </el-table-column>
            <el-table-column label="商户订单号" width="200">
              <template #default="scope"><el-input v-model="scope.row.localOrderNo" size="small" placeholder="本地订单号" /></template>
            </el-table-column>
            <el-table-column label="金额" width="130">
              <template #default="scope"><el-input v-model="scope.row.amount" size="small" placeholder="金额" /></template>
            </el-table-column>
            <el-table-column label="交易时间" width="200">
              <template #default="scope"><el-input v-model="scope.row.tradeTime" size="small" placeholder="yyyy-MM-dd HH:mm:ss" /></template>
            </el-table-column>
            <el-table-column label="操作" width="70" align="center">
              <template #default="scope"><el-button link type="danger" icon="Delete" @click="removeRow(scope.$index)" /></template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!importForm.items.length" description="尚未解析账单流水" :image-size="50" />
        </el-form-item>
        <el-form-item label="备注" prop="remark"><el-input v-model="importForm.remark" maxlength="200" /></el-form-item>
      </el-form>
      <template #footer><div class="dialog-footer"><el-button type="primary" :disabled="!importForm.items.length" @click="submitImport">导入并比对</el-button><el-button @click="importOpen = false">取 消</el-button></div></template>
    </el-dialog>

    <!-- 差异处理 -->
    <el-dialog title="对账差异处理" v-model="handleOpen" width="520px" append-to-body>
      <el-descriptions :column="1" border size="small" class="mb8">
        <el-descriptions-item label="渠道交易号">{{ handleForm.channelTradeNo }}</el-descriptions-item>
        <el-descriptions-item label="商户订单号">{{ handleForm.localOrderNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="渠道 / 本地金额">{{ money(handleForm.tradeAmount) }} / {{ handleForm.localAmount == null ? '-' : money(handleForm.localAmount) }}</el-descriptions-item>
        <el-descriptions-item label="差异类型"><dict-tag :options="hc_diff_type" :value="handleForm.diffType" /></el-descriptions-item>
        <el-descriptions-item label="差异金额">{{ money(handleForm.diffAmount) }}</el-descriptions-item>
      </el-descriptions>
      <el-form ref="handleRef" :model="handleForm" :rules="handleRules" label-width="90px">
        <el-form-item label="处理结果" prop="handleStatus">
          <el-radio-group v-model="handleForm.handleStatus">
            <el-radio value="1">已处理</el-radio><el-radio value="2">已忽略</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="处理说明" prop="handleRemark">
          <el-input v-model="handleForm.handleRemark" type="textarea" :rows="3" maxlength="200" placeholder="如：已联系渠道补单 / 现金冲抵，差额确认为手续费" />
        </el-form-item>
      </el-form>
      <template #footer><div class="dialog-footer"><el-button type="primary" @click="submitHandle">确 定</el-button><el-button @click="handleOpen = false">取 消</el-button></div></template>
    </el-dialog>
  </div>
</template>

<script setup name="Reconcile">
import { listBatch, reconcileSummary, importBatch, delBatch, listRecord, handleRecord } from "@/api/hc/reconcile"

const { proxy } = getCurrentInstance()
const { hc_pay_channel, hc_reconcile_status, hc_diff_type, hc_handle_status } =
  proxy.useDict("hc_pay_channel", "hc_reconcile_status", "hc_diff_type", "hc_handle_status")

const tab = ref("batch")
const stat = ref({})

function money(v) {
  return v == null ? '0.00' : Number(v).toFixed(2)
}
const matchCount = computed(() => Math.max((Number(stat.value.total_count) || 0) - (Number(stat.value.diff_count) || 0), 0))
const matchRate = computed(() => {
  const t = Number(stat.value.total_count) || 0
  return t === 0 ? '-' : (matchCount.value * 100 / t).toFixed(1) + '%'
})

/* ---------------- 批次 ---------------- */
const batchList = ref([])
const batchTotal = ref(0)
const batchLoading = ref(false)
const batchRange = ref([])
const batchQuery = ref({ pageNum: 1, pageSize: 10, batchNo: undefined, channel: undefined, reconcileStatus: undefined })

function getBatchList() {
  batchLoading.value = true
  const params = proxy.addDateRange({ ...batchQuery.value }, batchRange.value)
  listBatch(params).then(r => {
    batchList.value = r.rows
    batchTotal.value = r.total
    batchLoading.value = false
  })
  reconcileSummary(params).then(r => { stat.value = r.data || {} })
}
function handleBatchQuery() { batchQuery.value.pageNum = 1; getBatchList() }
function resetBatchQuery() { batchRange.value = []; proxy.resetForm("batchQueryRef"); handleBatchQuery() }
function viewDiff(row) {
  recQuery.value.batchId = row.batchId
  recQuery.value.diffOnly = "1"
  tab.value = "record"
  handleRecQuery()
}
function handleDelBatch(row) {
  proxy.$modal.confirm('确认删除批次【' + row.batchNo + '】？批次下全部逐笔明细将一并删除（存在未处理差异时不允许删除）。')
    .then(() => delBatch(row.batchId))
    .then(() => { getBatchList(); getRecList(); proxy.$modal.msgSuccess("删除成功") }).catch(() => {})
}

/* ---------------- 导入 ---------------- */
const importOpen = ref(false)
const jsonText = ref("")
const importForm = ref({ channel: "1", billDate: undefined, fileName: undefined, remark: undefined, items: [] })
const importRules = {
  channel: [{ required: true, message: "请选择对账渠道", trigger: "change" }],
  billDate: [{ required: true, message: "请选择账单日期", trigger: "change" }]
}
function openImport() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  const m = d.getMonth() + 1, day = d.getDate()
  importForm.value = {
    channel: "1",
    billDate: d.getFullYear() + '-' + (m < 10 ? '0' + m : m) + '-' + (day < 10 ? '0' + day : day),
    fileName: undefined, remark: undefined, items: []
  }
  jsonText.value = ""
  importOpen.value = true
}
function parseJson() {
  const txt = (jsonText.value || '').trim()
  if (!txt) {
    proxy.$modal.msgWarning("请先粘贴渠道账单内容")
    return
  }
  let arr
  try {
    arr = JSON.parse(txt)
  } catch (e) {
    proxy.$modal.msgError("账单内容不是合法的 JSON，请检查引号与括号")
    return
  }
  if (!Array.isArray(arr)) {
    arr = Array.isArray(arr.items) ? arr.items : null
  }
  if (!Array.isArray(arr) || !arr.length) {
    proxy.$modal.msgError("未解析到账单流水，需要 JSON 数组")
    return
  }
  importForm.value.items = arr.filter(x => x && (x.channelTradeNo || x.trade_no)).map(x => ({
    channelTradeNo: String(x.channelTradeNo || x.trade_no || ''),
    localOrderNo: x.localOrderNo != null ? String(x.localOrderNo) : (x.out_trade_no != null ? String(x.out_trade_no) : ''),
    amount: x.amount != null ? String(x.amount) : (x.total_amount != null ? String(x.total_amount) : '0'),
    tradeTime: x.tradeTime || x.time_end || ''
  }))
  proxy.$modal.msgSuccess("已解析 " + importForm.value.items.length + " 笔流水，请核对后导入")
}
function addRow() {
  importForm.value.items.push({ channelTradeNo: '', localOrderNo: '', amount: '', tradeTime: '' })
}
function removeRow(index) {
  importForm.value.items.splice(index, 1)
}
function submitImport() {
  proxy.$refs["importRef"].validate(valid => {
    if (!valid) return
    const items = importForm.value.items.filter(x => x.channelTradeNo && String(x.channelTradeNo).trim())
    if (!items.length) {
      proxy.$modal.msgWarning("至少需要一条包含渠道交易号的流水")
      return
    }
    const body = {
      channel: importForm.value.channel,
      billDate: importForm.value.billDate,
      fileName: importForm.value.fileName,
      remark: importForm.value.remark,
      items: items.map(x => ({
        channelTradeNo: String(x.channelTradeNo).trim(),
        localOrderNo: x.localOrderNo ? String(x.localOrderNo).trim() : '',
        amount: Number(x.amount) || 0,
        tradeTime: x.tradeTime && String(x.tradeTime).trim() ? String(x.tradeTime).trim() : undefined
      }))
    }
    importBatch(body).then(r => {
      const b = r.data || {}
      importOpen.value = false
      proxy.$modal.msgSuccess('导入完成：共 ' + (b.totalCount || 0) + ' 笔，差异 ' + (b.diffCount || 0) + ' 笔')
      getBatchList()
      recQuery.value.batchId = b.batchId
      tab.value = "record"
      getRecList()
    })
  })
}

/* ---------------- 逐笔明细 ---------------- */
const recList = ref([])
const recTotal = ref(0)
const recLoading = ref(false)
const recQuery = ref({ pageNum: 1, pageSize: 10, batchId: undefined, channel: undefined, channelTradeNo: undefined, localOrderNo: undefined, diffType: undefined, handleStatus: undefined, diffOnly: "1" })

function getRecList() {
  recLoading.value = true
  listRecord({ ...recQuery.value }).then(r => {
    recList.value = r.rows
    recTotal.value = r.total
    recLoading.value = false
  })
}
function handleRecQuery() { recQuery.value.pageNum = 1; getRecList() }
function resetRecQuery() { recQuery.value.diffOnly = ""; proxy.resetForm("recQueryRef"); handleRecQuery() }

const handleOpen = ref(false)
const handleForm = ref({})
const handleRules = {
  handleStatus: [{ required: true, message: "请选择处理结果", trigger: "change" }],
  handleRemark: [{ required: true, message: "处理说明不能为空", trigger: "blur" }]
}
function openHandle(row) {
  handleForm.value = { ...row }
  handleOpen.value = true
}
function submitHandle() {
  proxy.$refs["handleRef"].validate(valid => {
    if (!valid) return
    handleRecord({ recordId: handleForm.value.recordId, handleStatus: handleForm.value.handleStatus, handleRemark: handleForm.value.handleRemark })
      .then(() => {
        proxy.$modal.msgSuccess("差异已处理")
        handleOpen.value = false
        getRecList()
        getBatchList()
      })
  })
}

getBatchList()
getRecList()
</script>

<style scoped>
.kpi { background: #fff; border: 1px solid #ebeef5; border-radius: 6px; padding: 12px 14px; }
.kpi-label { font-size: 12px; color: #909399; }
.kpi-value { font-size: 22px; font-weight: 600; color: #303133; margin-top: 4px; }
.kpi-sub { font-size: 12px; color: #606266; margin-top: 2px; }
.kpi-danger .kpi-value { color: #f56c6c; }
.kpi-success .kpi-value { color: #67c23a; }
.text-danger { color: #f56c6c; }
.tip-text { font-size: 12px; color: #909399; margin-left: 10px; }
</style>
