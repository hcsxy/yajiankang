<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="规则名称" prop="ruleName">
        <el-input v-model="queryParams.ruleName" placeholder="规则名称" clearable style="width: 160px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="订单类型" prop="bizType">
        <el-select v-model="queryParams.bizType" clearable placeholder="订单类型" style="width: 130px">
          <el-option label="售卡" value="1" /><el-option label="方案" value="2" /><el-option label="单次零售" value="3" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" clearable placeholder="状态" style="width: 100px">
          <el-option label="启用" value="0" /><el-option label="停用" value="1" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['hc:distRule:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete" v-hasPermi="['hc:distRule:remove']">删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="Operation" @click="openMatch">规则试算</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <el-alert title="命中规则时按优先级（数字越小越优先）取第一条；比例留空则取分销员专属比例；条件字段留空表示不限" type="info" :closable="false" class="mb8" />

    <el-table v-loading="loading" :data="list" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="规则名称" prop="ruleName" width="160" :show-overflow-tooltip="true" />
      <el-table-column label="订单类型" width="100" align="center">
        <template #default="scope">{{ bizTypeLabel(scope.row.bizType) }}</template>
      </el-table-column>
      <el-table-column label="卡项类型" width="100" align="center">
        <template #default="scope">{{ cardTypeLabel(scope.row.cardType) }}</template>
      </el-table-column>
      <el-table-column label="门店类型" width="110" align="center">
        <template #default="scope">{{ storeTypeLabel(scope.row.storeType) }}</template>
      </el-table-column>
      <el-table-column label="金额区间" width="150" align="center">
        <template #default="scope">{{ fmt(scope.row.minAmount) }} ~ {{ fmt(scope.row.maxAmount) }}</template>
      </el-table-column>
      <el-table-column label="计算方式" width="90" align="center">
        <template #default="scope">{{ scope.row.calcType === "2" ? "固定金额" : "按比例" }}</template>
      </el-table-column>
      <el-table-column label="比例%" prop="rate" width="80" align="right" />
      <el-table-column label="固定佣金" prop="fixAmount" width="100" align="right" />
      <el-table-column label="优先级" prop="priority" width="80" align="center" />
      <el-table-column label="状态" width="80" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.status === '0' ? 'success' : 'info'">{{ scope.row.status === '0' ? '启用' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="140" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['hc:distRule:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['hc:distRule:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="title" v-model="open" width="680px" append-to-body>
      <el-form ref="ruleRef" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="24">
            <el-form-item label="规则名称" prop="ruleName"><el-input v-model="form.ruleName" placeholder="如：加盟店储值卡分销 3%" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="订单类型" prop="bizType">
              <el-select v-model="form.bizType" clearable placeholder="留空不限" style="width: 100%">
                <el-option label="售卡" value="1" /><el-option label="方案" value="2" /><el-option label="单次零售" value="3" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="卡项类型" prop="cardType">
              <el-select v-model="form.cardType" clearable placeholder="留空不限" style="width: 100%">
                <el-option v-for="c in cardTypes" :key="c.value" :label="c.label" :value="c.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="门店类型" prop="storeType">
              <el-select v-model="form.storeType" clearable placeholder="留空不限" style="width: 100%">
                <el-option v-for="s in storeTypes" :key="s.value" :label="s.label" :value="s.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="指定卡项" prop="defId">
              <el-select v-model="form.defId" clearable filterable placeholder="留空不限" style="width: 100%">
                <el-option v-for="d in defOptions" :key="d.defId" :label="d.defName" :value="d.defId" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="金额下限" prop="minAmount">
              <el-input-number v-model="form.minAmount" :min="0" :precision="2" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="金额上限" prop="maxAmount">
              <el-input-number v-model="form.maxAmount" :min="0" :precision="2" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="计算方式" prop="calcType">
              <el-radio-group v-model="form.calcType">
                <el-radio value="1">按比例</el-radio>
                <el-radio value="2">固定金额</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="form.calcType === '1'">
            <el-form-item label="佣金比例%" prop="rate">
              <el-input-number v-model="form.rate" :min="0" :max="100" :precision="2" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="form.calcType === '2'">
            <el-form-item label="固定佣金" prop="fixAmount">
              <el-input-number v-model="form.fixAmount" :min="0" :precision="2" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="优先级" prop="priority">
              <el-input-number v-model="form.priority" :min="1" controls-position="right" style="width: 100%" />
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
          <el-col :span="24">
            <el-form-item label="备注" prop="remark"><el-input v-model="form.remark" type="textarea" placeholder="备注" /></el-form-item>
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

    <el-dialog title="佣金规则试算" v-model="matchOpen" width="480px" append-to-body>
      <el-form :model="matchForm" label-width="100px">
        <el-form-item label="订单类型">
          <el-select v-model="matchForm.bizType" clearable placeholder="留空不限" style="width: 100%">
            <el-option label="售卡" value="1" /><el-option label="方案" value="2" /><el-option label="单次零售" value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="卡项类型">
          <el-select v-model="matchForm.cardType" clearable placeholder="留空不限" style="width: 100%">
            <el-option v-for="c in cardTypes" :key="c.value" :label="c.label" :value="c.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="门店类型">
          <el-select v-model="matchForm.storeType" clearable placeholder="留空不限" style="width: 100%">
            <el-option v-for="s in storeTypes" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="订单金额">
          <el-input-number v-model="matchForm.amount" :min="0.01" :precision="2" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="matchLoading" @click="doMatch">试 算</el-button>
        </el-form-item>
      </el-form>
        <el-descriptions v-if="matchResult && matchResult.ruleId" :column="1" border>
          <el-descriptions-item label="命中规则">{{ matchResult.ruleName }}</el-descriptions-item>
          <el-descriptions-item label="计算方式">{{ matchResult.calcType === '2' ? '固定金额' : '按比例' }}</el-descriptions-item>
          <el-descriptions-item label="比例/固定值">{{ matchResult.calcType === '2' ? fmt(matchResult.fixAmount) + ' 元' : fmt(matchResult.rate) + '%' }}</el-descriptions-item>
          <el-descriptions-item label="预计佣金">{{ expectCommission }} 元</el-descriptions-item>
        </el-descriptions>
        <el-alert v-else-if="matchResult" title="未命中任何规则：若分销员未配置专属比例，则该订单不自动计佣" type="warning" :closable="false" />
    </el-dialog>
  </div>
</template>

<script setup name="DistRule">
import { listDistRule, getDistRule, addDistRule, updateDistRule, delDistRule, matchDistRule } from "@/api/hc/distribution"
import { listCardDef } from "@/api/hc/basic"

const { proxy } = getCurrentInstance()
const cardTypes = [
  { value: "1", label: "储值卡" }, { value: "2", label: "次卡" }, { value: "3", label: "疗程卡" },
  { value: "4", label: "期限卡" }, { value: "5", label: "单次项目" }
]
const storeTypes = [
  { value: "1", label: "直营店" }, { value: "2", label: "加盟店" },
  { value: "3", label: "联营店" }, { value: "4", label: "合作调理点" }
]
const list = ref([])
const defOptions = ref([])
const loading = ref(true)
const showSearch = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref("")
const open = ref(false)
const matchOpen = ref(false)
const matchLoading = ref(false)
const matchResult = ref(null)
const ids = ref([])
const queryParams = ref({ pageNum: 1, pageSize: 10, ruleName: undefined, bizType: undefined, status: undefined })
const matchForm = ref({ bizType: "1", cardType: undefined, storeType: undefined, defId: undefined, amount: 1000 })
const data = {
  form: {},
  rules: {
    ruleName: [{ required: true, message: "规则名称不能为空", trigger: "blur" }],
    calcType: [{ required: true, message: "计算方式不能为空", trigger: "change" }]
  }
}
const { form, rules } = toRefs(data)

const expectCommission = computed(() => {
  const r = matchResult.value
  if (!r || !r.ruleId) return '-'
  const base = Number(matchForm.value.amount || 0)
  if (r.calcType === '2') return Number(r.fixAmount || 0).toFixed(2)
  return (base * Number(r.rate || 0) / 100).toFixed(2)
})

function fmt(v) { return v == null || v === "" ? "不限" : v }
function bizTypeLabel(v) { return v == null || v === "" ? "不限" : { "1": "售卡", "2": "方案", "3": "单次零售" }[v] }
function cardTypeLabel(v) { const d = cardTypes.find(o => o.value === v); return d ? d.label : "不限" }
function storeTypeLabel(v) { const d = storeTypes.find(o => o.value === v); return d ? d.label : "不限" }

function getList() {
  loading.value = true
  listDistRule(queryParams.value).then(response => {
    list.value = response.rows
    total.value = response.total
    loading.value = false
  })
}
function cancel() { open.value = false; reset() }
function reset() {
  form.value = { ruleId: undefined, ruleName: undefined, bizType: undefined, cardType: undefined, storeType: undefined,
    defId: undefined, minAmount: undefined, maxAmount: undefined, calcType: "1", rate: undefined, fixAmount: undefined,
    priority: 10, status: "0", remark: undefined }
  proxy.resetForm("ruleRef")
}
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm("queryRef"); handleQuery() }
function handleSelectionChange(selection) { ids.value = selection.map(item => item.ruleId); multiple.value = !selection.length }
function handleAdd() { reset(); title.value = "添加佣金规则"; open.value = true }
function handleUpdate(row) {
  reset()
  getDistRule(row.ruleId).then(response => {
    form.value = response.data
    title.value = "修改佣金规则"
    open.value = true
  })
}
function submitForm() {
  proxy.$refs["ruleRef"].validate(valid => {
    if (valid) {
      if (form.value.ruleId != undefined) {
        updateDistRule(form.value).then(() => { proxy.$modal.msgSuccess("修改成功"); open.value = false; getList() })
      } else {
        addDistRule(form.value).then(() => { proxy.$modal.msgSuccess("新增成功"); open.value = false; getList() })
      }
    }
  })
}
function handleDelete(row) {
  const ruleIds = row.ruleId || ids.value
  proxy.$modal.confirm('是否确认删除选中的佣金规则？').then(function () {
    return delDistRule(ruleIds)
  }).then(() => { getList(); proxy.$modal.msgSuccess("删除成功") }).catch(() => {})
}
function openMatch() { matchResult.value = null; matchOpen.value = true }
function doMatch() {
  matchLoading.value = true
  // 后端试算入参：金额区间下限即计费基数
  matchDistRule({
    bizType: matchForm.value.bizType, cardType: matchForm.value.cardType,
    storeType: matchForm.value.storeType, defId: matchForm.value.defId,
    minAmount: matchForm.value.amount
  }).then(response => {
    matchResult.value = response.data || {}
    matchLoading.value = false
  }).catch(() => { matchLoading.value = false })
}
listCardDef({ pageNum: 1, pageSize: 200, status: "0" }).then(response => { defOptions.value = response.rows || [] })
getList()
</script>
