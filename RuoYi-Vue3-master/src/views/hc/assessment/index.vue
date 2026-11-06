<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="客户姓名" prop="customerName">
        <el-input v-model="queryParams.customerName" placeholder="客户姓名" clearable style="width: 150px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="评估类型" prop="assessType">
        <el-select v-model="queryParams.assessType" clearable placeholder="类型" style="width: 120px">
          <el-option label="初评" value="1" /><el-option label="复评" value="2" />
        </el-select>
      </el-form-item>
      <el-form-item label="体质" prop="constitution">
        <el-select v-model="queryParams.constitution" clearable placeholder="体质" style="width: 130px">
          <el-option v-for="d in hc_constitution" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row class="mb8">
      <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['hc:assessment:add']">新增评估</el-button>
      <el-button type="danger" plain icon="Delete" :disabled="!multiple.length" @click="handleDelete()" v-hasPermi="['hc:assessment:remove']">删除</el-button>
      <el-alert title="复评自动关联该客户最近一次初评并生成对比结论；复评完成后自动将客户“待复评”方案标记为已复评" type="info" :closable="false" class="mb8" style="width: 560px" />
    </el-row>

    <el-table v-loading="loading" :data="list" @selection-change="v => multiple = v">
      <el-table-column type="selection" width="50" />
      <el-table-column label="评估ID" prop="assessmentId" width="80" />
      <el-table-column label="客户" prop="customerName" width="100" />
      <el-table-column label="类型" width="70" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.assessType === '1' ? '' : 'warning'">{{ scope.row.assessType === '1' ? '初评' : '复评' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="采集方式" width="90" align="center">
        <template #default="scope">{{ ['手动录入', '问卷量表', '设备回传'][Number(scope.row.assessWay) - 1] || '-' }}</template>
      </el-table-column>
      <el-table-column label="辨识体质" width="90" align="center">
        <template #default="scope"><dict-tag :options="hc_constitution" :value="scope.row.constitution" /></template>
      </el-table-column>
      <el-table-column label="疲劳" prop="fatigueScore" width="60" align="center" />
      <el-table-column label="睡眠" prop="sleepScore" width="60" align="center" />
      <el-table-column label="颈肩" prop="neckScore" width="60" align="center" />
      <el-table-column label="评估结论" prop="summary" :show-overflow-tooltip="true" />
      <el-table-column label="对比结论" prop="compareResult" :show-overflow-tooltip="true" />
      <el-table-column label="评估人" prop="assessorName" width="90" />
      <el-table-column label="评估时间" width="160">
        <template #default="scope">{{ parseTime(scope.row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="200" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="DataAnalysis" @click="openTrack(scope.row)" v-hasPermi="['hc:assessment:list']">轨迹</el-button>
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['hc:assessment:edit']">修改</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['hc:assessment:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="title" v-model="open" width="640px" append-to-body @opened="renderFormRadar">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="12"><el-form-item label="客户" prop="customerId">
            <el-select v-model="form.customerId" filterable remote :remote-method="searchCustomer" placeholder="输入姓名/手机号搜索" style="width: 100%" :disabled="!!form.assessmentId">
              <el-option v-for="c in customerOptions" :key="c.customerId" :label="c.name + '（' + (c.phone || '') + '）'" :value="c.customerId" />
            </el-select>
          </el-form-item></el-col>
          <el-col :span="12"><el-form-item label="评估类型" prop="assessType">
            <el-radio-group v-model="form.assessType"><el-radio value="1">初评</el-radio><el-radio value="2">复评</el-radio></el-radio-group>
          </el-form-item></el-col>
        </el-row>
        <el-row>
          <el-col :span="12"><el-form-item label="采集方式" prop="assessWay">
            <el-select v-model="form.assessWay" style="width: 100%">
              <el-option label="手动录入" value="1" /><el-option label="问卷量表" value="2" /><el-option label="设备回传" value="3" />
            </el-select>
          </el-form-item></el-col>
          <el-col :span="12"><el-form-item label="辨识体质" prop="constitution">
            <el-select v-model="form.constitution" clearable style="width: 100%">
              <el-option v-for="d in hc_constitution" :key="d.value" :label="d.label" :value="d.value" />
            </el-select>
          </el-form-item></el-col>
        </el-row>
        <el-row>
          <el-col :span="8"><el-form-item label="疲劳评分" prop="fatigueScore"><el-input-number v-model="form.fatigueScore" :min="0" :max="100" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="睡眠评分" prop="sleepScore"><el-input-number v-model="form.sleepScore" :min="0" :max="100" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="颈肩评分" prop="neckScore"><el-input-number v-model="form.neckScore" :min="0" :max="100" style="width: 100%" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="评估人" prop="assessorName"><el-input v-model="form.assessorName" maxlength="30" /></el-form-item>
        <el-form-item label="雷达预览">
          <hc-radar ref="formRadarRef" :names="radarNames" :series="formSeries" height="260px" />
          <div class="tip-text">评分越高表示症状越重，复评分值下降即为改善</div>
        </el-form-item>
        <el-form-item label="评估结论" prop="summary"><el-input v-model="form.summary" type="textarea" :rows="2" maxlength="500" /></el-form-item>
        <el-form-item label="对比结论" prop="compareResult" v-if="form.assessType === '2'"><el-input v-model="form.compareResult" type="textarea" :rows="2" maxlength="500" placeholder="复评与初评的改善/恶化对比" /></el-form-item>
      </el-form>
      <template #footer><div class="dialog-footer"><el-button type="primary" @click="submitForm">确 定</el-button><el-button @click="open = false">取 消</el-button></div></template>
    </el-dialog>

    <!-- 评估轨迹与效果对比 -->
    <el-drawer title="客户评估轨迹" v-model="trackOpen" size="55%" append-to-body @opened="renderTrack">
      <div v-if="trackList.length">
        <el-row class="mb8">
          <el-col :span="24">
            <el-card shadow="never">
              <template #header><span>初评 vs 最近复评</span></template>
              <hc-radar ref="trackRadarRef" :names="radarNames" :series="trackSeries" />
            </el-card>
          </el-col>
        </el-row>
        <el-table :data="trackList" size="small">
          <el-table-column label="类型" width="70" align="center">
            <template #default="scope"><el-tag :type="scope.row.assessType === '1' ? '' : 'warning'">{{ scope.row.assessType === '1' ? '初评' : '复评' }}</el-tag></template>
          </el-table-column>
          <el-table-column label="疲劳" prop="fatigueScore" width="60" align="center" />
          <el-table-column label="睡眠" prop="sleepScore" width="60" align="center" />
          <el-table-column label="颈肩" prop="neckScore" width="60" align="center" />
          <el-table-column label="体质" width="90" align="center">
            <template #default="scope"><dict-tag :options="hc_constitution" :value="scope.row.constitution" /></template>
          </el-table-column>
          <el-table-column label="对比结论" prop="compareResult" :show-overflow-tooltip="true" />
          <el-table-column label="评估时间" width="150">
            <template #default="scope">{{ parseTime(scope.row.createTime) }}</template>
          </el-table-column>
        </el-table>
      </div>
      <el-empty v-else description="该客户暂无评估记录" />
    </el-drawer>
  </div>
</template>

<script setup name="Assessment">
import { listAssess, getAssess, addAssess, updateAssess, delAssess, trackAssess } from "@/api/hc/assess"
import { listCustomer } from "@/api/hc/card"
import HcRadar from "@/components/HcRadar/index.vue"

const { proxy } = getCurrentInstance()
const { hc_constitution } = proxy.useDict("hc_constitution")
const list = ref([])
const customerOptions = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const title = ref("")
const open = ref(false)
const multiple = ref([])
const queryParams = ref({ pageNum: 1, pageSize: 10, customerName: undefined, assessType: undefined, constitution: undefined })
const form = ref({})
const trackOpen = ref(false)
const trackList = ref([])
const formRadarRef = ref(null)
const trackRadarRef = ref(null)
const radarNames = ['疲劳', '睡眠质量', '颈肩腰腿']

// 录入弹窗：实时雷达（未填项以0展示）
const formSeries = computed(() => [{
  name: form.value.assessType === '2' ? '复评' : '初评',
  data: [Number(form.value.fatigueScore) || 0, Number(form.value.sleepScore) || 0, Number(form.value.neckScore) || 0]
}])

// 轨迹：初评 vs 最近一次复评
const trackSeries = computed(() => {
  const arr = []
  const first = trackList.value.find(r => r.assessType === '1') || trackList.value[0]
  const last = [...trackList.value].reverse().find(r => r.assessType === '2')
  if (first) arr.push({ name: first === last ? '本次评估' : '初评', data: [first.fatigueScore || 0, first.sleepScore || 0, first.neckScore || 0] })
  if (last && last !== first) arr.push({ name: '最近复评', data: [last.fatigueScore || 0, last.sleepScore || 0, last.neckScore || 0] })
  return arr
})
const rules = {
  customerId: [{ required: true, message: "客户不能为空", trigger: "change" }],
  assessType: [{ required: true, message: "评估类型不能为空", trigger: "change" }]
}

function searchCustomer(kw) {
  listCustomer({ pageNum: 1, pageSize: 20, name: kw, phone: /^[0-9]*$/.test(kw || '') ? kw : undefined }).then(r => customerOptions.value = r.rows)
}
function getList() {
  loading.value = true
  listAssess(queryParams.value).then(response => {
    list.value = response.rows
    total.value = response.total
    loading.value = false
  })
}
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm("queryRef"); handleQuery() }
function reset() { form.value = { assessmentId: undefined, customerId: undefined, assessType: "1", assessWay: "1", constitution: undefined, fatigueScore: undefined, sleepScore: undefined, neckScore: undefined, assessorName: undefined, summary: undefined, compareResult: undefined }; proxy.resetForm("formRef") }
function handleAdd() { reset(); searchCustomer(''); open.value = true; title.value = "新增健康评估" }
function handleUpdate(row) {
  reset()
  getAssess(row.assessmentId).then(response => {
    form.value = response.data
    customerOptions.value = [{ customerId: form.value.customerId, name: form.value.customerName, phone: '' }]
    open.value = true; title.value = "修改健康评估"
  })
}
function submitForm() {
  proxy.$refs["formRef"].validate(valid => {
    if (!valid) return
    const fn = form.value.assessmentId ? updateAssess : addAssess
    fn(form.value).then(() => {
      proxy.$modal.msgSuccess("操作成功"); open.value = false; getList()
    })
  })
}
function handleDelete(row) {
  const ids = row.assessmentId || multiple.value.map(r => r.assessmentId)
  if (!ids || !ids.length) return
  proxy.$modal.confirm('确认删除所选评估记录？').then(() => delAssess(ids)).then(() => { getList(); proxy.$modal.msgSuccess("删除成功") }).catch(() => {})
}
function renderFormRadar() {
  nextTick(() => formRadarRef.value && formRadarRef.value.render())
}
function renderTrack() {
  nextTick(() => trackRadarRef.value && trackRadarRef.value.render())
}
function openTrack(row) {
  trackAssess(row.customerId).then(r => {
    trackList.value = r.data || []
    trackOpen.value = true
  })
}
getList()
</script>

<style scoped>
.tip-text { font-size: 12px; color: #909399; margin-left: 8px; }
</style>
