<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="客户姓名" prop="customerName">
        <el-input v-model="queryParams.customerName" placeholder="客户姓名" clearable style="width: 150px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="门店" prop="storeId">
        <el-select v-model="queryParams.storeId" clearable placeholder="全部门店" style="width: 150px">
          <el-option v-for="s in storeOptions" :key="s.storeId" :label="s.storeName" :value="s.storeId" />
        </el-select>
      </el-form-item>
      <el-form-item label="体质" prop="constitution">
        <el-select v-model="queryParams.constitution" clearable placeholder="体质" style="width: 130px">
          <el-option v-for="d in hc_constitution" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="复评日期">
        <el-date-picker v-model="dateRange" type="daterange" value-format="YYYY-MM-DD" start-placeholder="开始" end-placeholder="结束" style="width: 250px" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="16" class="mb8">
      <el-col :span="6"><el-card shadow="hover"><div class="kpi-label">效果报告数</div><div class="kpi-value">{{ summary.reportCount || 0 }}</div></el-card></el-col>
      <el-col :span="6"><el-card shadow="hover"><div class="kpi-label">平均改善率</div><div class="kpi-value" :class="rateClass(summary.avgImproveRate)">{{ rateText(summary.avgImproveRate) }}</div></el-card></el-col>
      <el-col :span="6"><el-card shadow="hover"><div class="kpi-label">已生成续费方案</div><div class="kpi-value ok">{{ summary.renewCount || 0 }}</div></el-card></el-col>
      <el-col :span="6"><el-card shadow="hover"><div class="kpi-label">覆盖客户数</div><div class="kpi-value">{{ summary.customerCount || 0 }}</div></el-card></el-col>
    </el-row>

    <el-alert title="报告以复评为载体自动生成：复评保存时自动对比初评并沉淀雷达数据；评分口径为分值越高症状越重，故分值下降即为改善。" type="info" :closable="false" class="mb8" />

    <el-table v-loading="loading" :data="list">
      <el-table-column label="客户" prop="customerName" width="100" />
      <el-table-column label="门店" prop="storeName" width="120" :show-overflow-tooltip="true" />
      <el-table-column label="体质" width="90" align="center">
        <template #default="scope"><dict-tag :options="hc_constitution" :value="scope.row.constitution" /></template>
      </el-table-column>
      <el-table-column label="疲劳（初→复）" width="130" align="center">
        <template #default="scope">{{ pair(scope.row.preFatigueScore, scope.row.fatigueScore) }}</template>
      </el-table-column>
      <el-table-column label="睡眠（初→复）" width="130" align="center">
        <template #default="scope">{{ pair(scope.row.preSleepScore, scope.row.sleepScore) }}</template>
      </el-table-column>
      <el-table-column label="颈肩（初→复）" width="130" align="center">
        <template #default="scope">{{ pair(scope.row.preNeckScore, scope.row.neckScore) }}</template>
      </el-table-column>
      <el-table-column label="改善率" width="90" align="center">
        <template #default="scope"><span :class="rateClass(scope.row.improveRate)">{{ rateText(scope.row.improveRate) }}</span></template>
      </el-table-column>
      <el-table-column label="对比结论" prop="compareResult" :show-overflow-tooltip="true" />
      <el-table-column label="续费方案" width="90" align="center">
        <template #default="scope">
          <el-tag v-if="scope.row.renewPlanId" type="success">已生成</el-tag>
          <el-tag v-else type="info">未生成</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="复评时间" width="160">
        <template #default="scope">{{ parseTime(scope.row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="170" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="View" @click="openReport(scope.row)" v-hasPermi="['hc:effectReport:query']">报告</el-button>
          <el-button link type="primary" icon="Promotion" @click="handlePush(scope.row)" v-hasPermi="['hc:effectReport:push']">推送</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- 效果报告详情 -->
    <el-drawer title="调理效果报告" v-model="open" size="60%" append-to-body>
      <div v-if="report.customerId">
        <el-descriptions :column="3" border class="mb8">
          <el-descriptions-item label="客户">{{ report.customerName }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ report.phone }}</el-descriptions-item>
          <el-descriptions-item label="体质">{{ report.constitutionLabel || '未辨识' }}</el-descriptions-item>
          <el-descriptions-item label="评估门店">{{ report.storeName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="评估次数">{{ report.assessCount || 0 }} 次</el-descriptions-item>
          <el-descriptions-item label="综合改善率">
            <span :class="rateClass(report.improveRate)">{{ rateText(report.improveRate) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="期间服务次数">{{ report.serviceCount || 0 }} 次</el-descriptions-item>
          <el-descriptions-item label="期间确认收入">{{ money(report.serviceAmount) }}</el-descriptions-item>
          <el-descriptions-item label="方案进度">
            {{ report.planName || '暂无方案' }}
            <span class="tip-text" v-if="report.planTotalQty">已用 {{ report.planUsedQty || 0 }}/{{ report.planTotalQty }} 次</span>
          </el-descriptions-item>
        </el-descriptions>

        <el-row :gutter="16" class="mb8">
          <el-col :span="12">
            <el-card shadow="never">
              <template #header><span>初评 vs 复评 雷达对比</span></template>
              <hc-radar :names="report.radarNames || []" :series="radarSeries" />
              <div class="tip-text" v-if="!report.initial">该客户尚无初评，仅展示本次评估</div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card shadow="never">
              <template #header><span>指标对比明细</span></template>
              <el-table :data="report.items || []" size="small">
                <el-table-column label="指标" prop="name" />
                <el-table-column label="初评" prop="before" width="70" align="center" />
                <el-table-column label="复评" prop="after" width="70" align="center" />
                <el-table-column label="变化" prop="delta" width="70" align="center" />
                <el-table-column label="改善率" width="90" align="center">
                  <template #default="scope"><span :class="rateClass(scope.row.rate)">{{ rateText(scope.row.rate) }}</span></template>
                </el-table-column>
                <el-table-column label="趋势" width="80" align="center">
                  <template #default="scope">
                    <el-tag :type="trendTag(scope.row.trend)">{{ trendLabel(scope.row.trend) }}</el-tag>
                  </template>
                </el-table-column>
              </el-table>
              <div class="compare-box">{{ (report.latest && report.latest.compareResult) || '暂无对比结论' }}</div>
            </el-card>
          </el-col>
        </el-row>

        <el-card shadow="never">
          <template #header>
            <span>续费方案建议</span>
            <span class="tip-text">按体质匹配启用中的方案模板，一键生成草稿后可在“调理方案”中确认收费</span>
            <el-tag v-if="report.renewPlanId" type="success" style="margin-left: 10px">已生成方案ID：{{ report.renewPlanId }}</el-tag>
          </template>
          <el-table :data="report.suggestions || []" size="small">
            <el-table-column label="模板名称" prop="templateName" :show-overflow-tooltip="true" />
            <el-table-column label="适用体质" prop="suitConstitution" width="150" :show-overflow-tooltip="true" />
            <el-table-column label="调理周期" prop="cycleDays" width="90" align="center">
              <template #default="scope">{{ scope.row.cycleDays }} 天</template>
            </el-table-column>
            <el-table-column label="基准总价" width="110" align="right">
              <template #default="scope">{{ money(scope.row.totalPrice) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="130" align="center">
              <template #default="scope">
                <el-button link type="primary" icon="Plus" :disabled="!!report.renewPlanId"
                  @click="openRenew(scope.row)" v-hasPermi="['hc:effectReport:renew']">生成草稿</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!(report.suggestions && report.suggestions.length)" description="暂无匹配体质的启用方案模板" :image-size="60" />
        </el-card>
      </div>
    </el-drawer>

    <!-- 续费方案草稿 -->
    <el-dialog title="生成续费方案草稿" v-model="renewOpen" width="560px" append-to-body>
      <el-form ref="renewFormRef" :model="renewForm" :rules="renewRules" label-width="100px">
        <el-form-item label="客户"><el-input :value="report.customerName" disabled /></el-form-item>
        <el-form-item label="方案模板" prop="templateId">
          <el-select v-model="renewForm.templateId" filterable style="width: 100%">
            <el-option v-for="t in templateOptions" :key="t.templateId" :label="t.templateName + '（' + t.cycleDays + '天/' + money(t.totalPrice) + '）'" :value="t.templateId" />
          </el-select>
        </el-form-item>
        <el-form-item label="方案名称" prop="planName">
          <el-input v-model="renewForm.planName" maxlength="100" placeholder="留空则按模板名+（续费）" />
        </el-form-item>
        <el-form-item label="调理周期" prop="cycleDays">
          <el-input-number v-model="renewForm.cycleDays" :min="1" :max="365" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="renewForm.remark" type="textarea" :rows="2" maxlength="300" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitRenew">生成草稿</el-button>
          <el-button @click="renewOpen = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="EffectReport">
import { listReport, reportSummary, getEffectReport, renewPlan, pushReport } from "@/api/hc/effectReport"
import { optionTemplate } from "@/api/hc/plan"
import { listStore } from "@/api/hc/basic"
import HcRadar from "@/components/HcRadar/index.vue"

const { proxy } = getCurrentInstance()
const { hc_constitution } = proxy.useDict("hc_constitution")

const list = ref([])
const summary = ref({})
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const open = ref(false)
const renewOpen = ref(false)
const report = ref({})
const storeOptions = ref([])
const templateOptions = ref([])
const dateRange = ref([])
const queryParams = ref({ pageNum: 1, pageSize: 10, customerName: undefined, storeId: undefined, constitution: undefined })
const renewForm = ref({})
const renewRules = {
  templateId: [{ required: true, message: "请选择方案模板", trigger: "change" }]
}

function money(v) {
  return v == null ? '0.00' : Number(v).toFixed(2)
}
function rateText(v) {
  if (v == null || v === '') return '-'
  const n = Number(v)
  return (n > 0 ? '+' : '') + n.toFixed(1) + '%'
}
function rateClass(v) {
  if (v == null || v === '') return ''
  const n = Number(v)
  return n > 0 ? 'ok' : (n < 0 ? 'danger' : '')
}
function pair(before, after) {
  if (after == null) return '-'
  return (before == null ? '-' : before) + ' → ' + after
}
function trendLabel(v) {
  return { improve: '改善', flat: '持平', worse: '恶化' }[v] || '-'
}
function trendTag(v) {
  return { improve: 'success', flat: 'info', worse: 'danger' }[v] || 'info'
}

const radarSeries = computed(() => {
  const arr = []
  if (report.value.radarInitial && report.value.radarInitial.length) {
    arr.push({ name: '初评', data: report.value.radarInitial })
  }
  if (report.value.radarLatest && report.value.radarLatest.length) {
    arr.push({ name: '复评', data: report.value.radarLatest })
  }
  return arr
})

function buildParams() {
  return proxy.addDateRange({ ...queryParams.value }, dateRange.value)
}
function getList() {
  loading.value = true
  const params = buildParams()
  listReport(params).then(r => {
    list.value = r.rows
    total.value = r.total
    loading.value = false
  })
  reportSummary(params).then(r => summary.value = r.data || {})
}
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() {
  dateRange.value = []
  proxy.resetForm("queryRef")
  handleQuery()
}

function openReport(row) {
  getEffectReport(row.customerId, row.assessmentId).then(r => {
    report.value = r.data || {}
    open.value = true
  })
}
function handlePush(row) {
  proxy.$modal.confirm('确认向客户推送该效果报告（站内信）？').then(() => pushReport(row.assessmentId))
    .then(() => { proxy.$modal.msgSuccess("推送成功") }).catch(() => {})
}

function openRenew(tpl) {
  renewForm.value = {
    customerId: report.value.customerId,
    assessmentId: report.value.latest ? report.value.latest.assessmentId : undefined,
    templateId: tpl.templateId,
    planName: undefined,
    cycleDays: tpl.cycleDays,
    remark: undefined
  }
  optionTemplate().then(r => {
    templateOptions.value = r.data || []
    renewOpen.value = true
  })
}
function submitRenew() {
  proxy.$refs["renewFormRef"].validate(valid => {
    if (!valid) return
    renewPlan(renewForm.value).then(r => {
      proxy.$modal.msgSuccess("续费方案草稿已生成，方案ID：" + r.data)
      renewOpen.value = false
      if (report.value.customerId) {
        getEffectReport(report.value.customerId, report.value.latest ? report.value.latest.assessmentId : undefined).then(res => report.value = res.data || {})
      }
      getList()
    })
  })
}

listStore({ pageNum: 1, pageSize: 200 }).then(r => storeOptions.value = r.rows)
getList()
</script>

<style scoped>
.kpi-label { font-size: 13px; color: #909399; margin-bottom: 8px; }
.kpi-value { font-size: 22px; font-weight: 600; }
.kpi-value.ok { color: #67c23a; }
.kpi-value.danger { color: #f56c6c; }
.tip-text { font-size: 12px; color: #909399; margin-left: 8px; }
.ok { color: #67c23a; }
.danger { color: #f56c6c; }
.compare-box { font-size: 13px; color: #606266; line-height: 1.7; margin-top: 8px; }
</style>
