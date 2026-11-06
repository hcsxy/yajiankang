<template>
  <div class="app-container">
    <el-tabs v-model="tab">
      <!-- 分账规则 -->
      <el-tab-pane label="分账规则" name="rule">
        <el-form :model="ruleQuery" ref="ruleQueryRef" :inline="true">
          <el-form-item label="业务类型" prop="bizType">
            <el-select v-model="ruleQuery.bizType" clearable placeholder="全部" style="width: 130px">
              <el-option v-for="d in hc_split_biz_type" :key="d.value" :label="d.label" :value="d.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="参与方" prop="partyType">
            <el-select v-model="ruleQuery.partyType" clearable placeholder="全部" style="width: 130px">
              <el-option v-for="d in hc_split_party" :key="d.value" :label="d.label" :value="d.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-select v-model="ruleQuery.status" clearable placeholder="全部" style="width: 110px">
              <el-option label="启用" value="0" /><el-option label="停用" value="1" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="handleRuleQuery">搜索</el-button>
            <el-button icon="Refresh" @click="resetRuleQuery">重置</el-button>
          </el-form-item>
        </el-form>
        <el-row class="mb8">
          <el-button type="primary" plain icon="Plus" @click="handleRuleAdd" v-hasPermi="['hc:splitRule:add']">新增规则</el-button>
          <el-alert title="同一业务类型下，每个参与方只取一条命中规则（指定门店优先、优先级取值大者）；各方分账合计不超过分账基数，差额作为总部留存。" type="info" :closable="false" style="width: 760px" />
        </el-row>
        <el-table v-loading="ruleLoading" :data="ruleList">
          <el-table-column label="规则名称" prop="ruleName" :show-overflow-tooltip="true" />
          <el-table-column label="业务类型" width="100" align="center">
            <template #default="scope"><dict-tag :options="hc_split_biz_type" :value="scope.row.bizType" /></template>
          </el-table-column>
          <el-table-column label="参与方" width="90" align="center">
            <template #default="scope"><dict-tag :options="hc_split_party" :value="scope.row.partyType" /></template>
          </el-table-column>
          <el-table-column label="限定门店" prop="storeName" width="120" :show-overflow-tooltip="true">
            <template #default="scope">{{ scope.row.storeName || '全部门店' }}</template>
          </el-table-column>
          <el-table-column label="门店类型" width="90" align="center">
            <template #default="scope">{{ storeTypeLabel(scope.row.storeType) }}</template>
          </el-table-column>
          <el-table-column label="计算方式" width="90" align="center">
            <template #default="scope">{{ scope.row.calcType === '2' ? '固定额' : '按比例' }}</template>
          </el-table-column>
          <el-table-column label="比例" width="80" align="right">
            <template #default="scope">{{ scope.row.calcType === '1' ? percent(scope.row.rate) : '-' }}</template>
          </el-table-column>
          <el-table-column label="固定额" width="90" align="right">
            <template #default="scope">{{ scope.row.calcType === '2' ? money(scope.row.fixAmount) : '-' }}</template>
          </el-table-column>
          <el-table-column label="优先级" prop="priority" width="70" align="center" />
          <el-table-column label="生效期" width="200" align="center">
            <template #default="scope">{{ scope.row.effectiveStart || '不限' }} ~ {{ scope.row.effectiveEnd || '不限' }}</template>
          </el-table-column>
          <el-table-column label="状态" width="70" align="center">
            <template #default="scope"><el-tag :type="scope.row.status === '0' ? 'success' : 'info'">{{ scope.row.status === '0' ? '启用' : '停用' }}</el-tag></template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="130" class-name="small-padding fixed-width">
            <template #default="scope">
              <el-button link type="primary" icon="Edit" @click="handleRuleUpdate(scope.row)" v-hasPermi="['hc:splitRule:edit']">修改</el-button>
              <el-button link type="danger" icon="Delete" @click="handleRuleDelete(scope.row)" v-hasPermi="['hc:splitRule:remove']">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <pagination v-show="ruleTotal > 0" :total="ruleTotal" v-model:page="ruleQuery.pageNum" v-model:limit="ruleQuery.pageSize" @pagination="getRuleList" />
      </el-tab-pane>

      <!-- 分账单 -->
      <el-tab-pane label="分账单" name="bill">
        <el-form :model="billQuery" ref="billQueryRef" :inline="true">
          <el-form-item label="业务类型" prop="bizType">
            <el-select v-model="billQuery.bizType" clearable placeholder="全部" style="width: 130px">
              <el-option v-for="d in hc_split_biz_type" :key="d.value" :label="d.label" :value="d.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="客户" prop="customerName">
            <el-input v-model="billQuery.customerName" placeholder="客户姓名" clearable style="width: 130px" @keyup.enter="handleBillQuery" />
          </el-form-item>
          <el-form-item label="状态" prop="splitStatus">
            <el-select v-model="billQuery.splitStatus" clearable placeholder="全部" style="width: 120px">
              <el-option v-for="d in hc_split_status" :key="d.value" :label="d.label" :value="d.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="跨店" prop="crossStore">
            <el-select v-model="billQuery.crossStore" clearable placeholder="全部" style="width: 100px">
              <el-option label="是" value="1" /><el-option label="否" value="0" />
            </el-select>
          </el-form-item>
          <el-form-item label="分账日期">
            <el-date-picker v-model="billRange" type="daterange" value-format="YYYY-MM-DD" start-placeholder="开始" end-placeholder="结束" style="width: 240px" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="handleBillQuery">搜索</el-button>
            <el-button icon="Refresh" @click="resetBillQuery">重置</el-button>
          </el-form-item>
        </el-form>
        <el-table v-loading="billLoading" :data="billList">
          <el-table-column label="分账单号" prop="splitNo" width="170" />
          <el-table-column label="业务类型" width="100" align="center">
            <template #default="scope"><dict-tag :options="hc_split_biz_type" :value="scope.row.bizType" /></template>
          </el-table-column>
          <el-table-column label="业务单号" prop="bizNo" width="170" :show-overflow-tooltip="true" />
          <el-table-column label="客户" prop="customerName" width="100" />
          <el-table-column label="项目/卡项" prop="itemName" width="150" :show-overflow-tooltip="true" />
          <el-table-column label="售卡店" prop="saleStoreName" width="110" :show-overflow-tooltip="true" />
          <el-table-column label="核销店" prop="verifyStoreName" width="110" :show-overflow-tooltip="true" />
          <el-table-column label="技师" prop="technicianName" width="90" />
          <el-table-column label="跨店" width="70" align="center">
            <template #default="scope"><el-tag v-if="scope.row.crossStore === '1'" type="warning">跨店</el-tag><span v-else>-</span></template>
          </el-table-column>
          <el-table-column label="分账基数" width="100" align="right">
            <template #default="scope">{{ money(scope.row.baseAmount) }}</template>
          </el-table-column>
          <el-table-column label="各方合计" width="100" align="right">
            <template #default="scope">{{ money(scope.row.splitTotal) }}</template>
          </el-table-column>
          <el-table-column label="总部留存" width="100" align="right">
            <template #default="scope">{{ money(scope.row.retainAmount) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="90" align="center">
            <template #default="scope"><dict-tag :options="hc_split_status" :value="scope.row.splitStatus" /></template>
          </el-table-column>
          <el-table-column label="分账时间" width="160">
            <template #default="scope">{{ scope.row.splitTime }}</template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="180" class-name="small-padding fixed-width">
            <template #default="scope">
              <el-button link type="primary" icon="View" @click="openBill(scope.row)" v-hasPermi="['hc:splitBill:query']">明细</el-button>
              <el-button link type="primary" icon="Refresh" :disabled="scope.row.splitStatus !== '0'" @click="handleRecalc(scope.row)" v-hasPermi="['hc:splitBill:edit']">重算</el-button>
              <el-button link type="danger" icon="CircleClose" :disabled="scope.row.splitStatus === '2'" @click="handleVoid(scope.row)" v-hasPermi="['hc:splitBill:edit']">作废</el-button>
            </template>
          </el-table-column>
        </el-table>
        <pagination v-show="billTotal > 0" :total="billTotal" v-model:page="billQuery.pageNum" v-model:limit="billQuery.pageSize" @pagination="getBillList" />
      </el-tab-pane>

      <!-- 结算单 -->
      <el-tab-pane label="结算单" name="settle">
        <el-form :model="settleQuery" ref="settleQueryRef" :inline="true">
          <el-form-item label="参与方" prop="partyType">
            <el-select v-model="settleQuery.partyType" clearable placeholder="全部" style="width: 130px">
              <el-option v-for="d in hc_split_party" :key="d.value" :label="d.label" :value="d.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态" prop="settleStatus">
            <el-select v-model="settleQuery.settleStatus" clearable placeholder="全部" style="width: 120px">
              <el-option v-for="d in hc_settle_status" :key="d.value" :label="d.label" :value="d.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="结算期间">
            <el-date-picker v-model="settleRange" type="daterange" value-format="YYYY-MM-DD" start-placeholder="开始" end-placeholder="结束" style="width: 240px" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="handleSettleQuery">搜索</el-button>
            <el-button icon="Refresh" @click="resetSettleQuery">重置</el-button>
            <el-button type="warning" plain icon="Tickets" @click="openPreview" v-hasPermi="['hc:settlement:add']">待结算预览</el-button>
          </el-form-item>
        </el-form>
        <el-table v-loading="settleLoading" :data="settleList">
          <el-table-column label="结算单号" prop="settleNo" width="170" />
          <el-table-column label="结算期间" width="200" align="center">
            <template #default="scope">{{ scope.row.periodBegin }} ~ {{ scope.row.periodEnd }}</template>
          </el-table-column>
          <el-table-column label="参与方" width="90" align="center">
            <template #default="scope"><dict-tag :options="hc_split_party" :value="scope.row.partyType" /></template>
          </el-table-column>
          <el-table-column label="参与方名称" prop="partyName" width="140" :show-overflow-tooltip="true" />
          <el-table-column label="明细笔数" prop="detailCount" width="90" align="center" />
          <el-table-column label="分账单数" prop="billCount" width="90" align="center" />
          <el-table-column label="结算金额" width="110" align="right">
            <template #default="scope">{{ money(scope.row.totalAmount) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="90" align="center">
            <template #default="scope"><dict-tag :options="hc_settle_status" :value="scope.row.settleStatus" /></template>
          </el-table-column>
          <el-table-column label="结算人" prop="settleBy" width="90" />
          <el-table-column label="结算时间" width="160">
            <template #default="scope">{{ scope.row.settleTime || '-' }}</template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="170" class-name="small-padding fixed-width">
            <template #default="scope">
              <el-button link type="primary" icon="Select" :disabled="scope.row.settleStatus !== '0'" @click="handleConfirm(scope.row)" v-hasPermi="['hc:settlement:edit']">确认</el-button>
              <el-button link type="warning" icon="RefreshLeft" :disabled="scope.row.settleStatus !== '1'" @click="handleCancel(scope.row)" v-hasPermi="['hc:settlement:edit']">撤销</el-button>
              <el-button link type="danger" icon="Delete" :disabled="scope.row.settleStatus !== '0'" @click="handleSettleDelete(scope.row)" v-hasPermi="['hc:settlement:remove']">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <pagination v-show="settleTotal > 0" :total="settleTotal" v-model:page="settleQuery.pageNum" v-model:limit="settleQuery.pageSize" @pagination="getSettleList" />
      </el-tab-pane>
    </el-tabs>

    <!-- 规则表单 -->
    <el-dialog :title="ruleTitle" v-model="ruleOpen" width="620px" append-to-body>
      <el-form ref="ruleFormRef" :model="ruleForm" :rules="ruleRules" label-width="100px">
        <el-form-item label="规则名称" prop="ruleName"><el-input v-model="ruleForm.ruleName" maxlength="100" /></el-form-item>
        <el-row>
          <el-col :span="12"><el-form-item label="业务类型" prop="bizType">
            <el-select v-model="ruleForm.bizType" style="width: 100%">
              <el-option v-for="d in hc_split_biz_type" :key="d.value" :label="d.label" :value="d.value" />
            </el-select>
          </el-form-item></el-col>
          <el-col :span="12"><el-form-item label="参与方" prop="partyType">
            <el-select v-model="ruleForm.partyType" style="width: 100%">
              <el-option v-for="d in hc_split_party" :key="d.value" :label="d.label" :value="d.value" />
            </el-select>
          </el-form-item></el-col>
        </el-row>
        <el-row>
          <el-col :span="12"><el-form-item label="限定门店" prop="storeId">
            <el-select v-model="ruleForm.storeId" clearable placeholder="全部门店" style="width: 100%">
              <el-option v-for="s in storeOptions" :key="s.storeId" :label="s.storeName" :value="s.storeId" />
            </el-select>
          </el-form-item></el-col>
          <el-col :span="12"><el-form-item label="门店类型" prop="storeType">
            <el-select v-model="ruleForm.storeType" clearable placeholder="不限类型" style="width: 100%">
              <el-option v-for="d in hc_store_type" :key="d.value" :label="d.label" :value="d.value" />
            </el-select>
          </el-form-item></el-col>
        </el-row>
        <el-row>
          <el-col :span="12"><el-form-item label="计算方式" prop="calcType">
            <el-radio-group v-model="ruleForm.calcType"><el-radio value="1">按比例</el-radio><el-radio value="2">固定额</el-radio></el-radio-group>
          </el-form-item></el-col>
          <el-col :span="12"><el-form-item v-if="ruleForm.calcType === '1'" label="分账比例" prop="rate">
            <el-input-number v-model="ruleForm.rate" :min="0" :max="1" :step="0.05" :precision="4" style="width: 100%" />
          </el-form-item>
          <el-form-item v-else label="固定金额" prop="fixAmount">
            <el-input-number v-model="ruleForm.fixAmount" :min="0" :precision="2" style="width: 100%" />
          </el-form-item></el-col>
        </el-row>
        <el-row>
          <el-col :span="12"><el-form-item label="优先级" prop="priority"><el-input-number v-model="ruleForm.priority" :min="0" :max="9999" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="状态" prop="status">
            <el-radio-group v-model="ruleForm.status"><el-radio value="0">启用</el-radio><el-radio value="1">停用</el-radio></el-radio-group>
          </el-form-item></el-col>
        </el-row>
        <el-form-item label="生效开始" prop="effectiveStart">
          <el-date-picker v-model="ruleForm.effectiveStart" type="date" value-format="YYYY-MM-DD" placeholder="不限" style="width: 100%" />
        </el-form-item>
        <el-form-item label="生效结束" prop="effectiveEnd">
          <el-date-picker v-model="ruleForm.effectiveEnd" type="date" value-format="YYYY-MM-DD" placeholder="不限" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注" prop="remark"><el-input v-model="ruleForm.remark" type="textarea" :rows="2" maxlength="300" /></el-form-item>
      </el-form>
      <template #footer><div class="dialog-footer"><el-button type="primary" @click="submitRule">确 定</el-button><el-button @click="ruleOpen = false">取 消</el-button></div></template>
    </el-dialog>

    <!-- 分账单明细 -->
    <el-dialog title="分账单明细" v-model="billOpen" width="820px" append-to-body>
      <el-descriptions :column="3" border size="small" class="mb8">
        <el-descriptions-item label="分账单号">{{ detail.splitNo }}</el-descriptions-item>
        <el-descriptions-item label="业务单号">{{ detail.bizNo }}</el-descriptions-item>
        <el-descriptions-item label="客户">{{ detail.customerName }}</el-descriptions-item>
        <el-descriptions-item label="项目">{{ detail.itemName }}</el-descriptions-item>
        <el-descriptions-item label="分账基数">{{ money(detail.baseAmount) }}</el-descriptions-item>
        <el-descriptions-item label="各方合计">{{ money(detail.splitTotal) }}</el-descriptions-item>
        <el-descriptions-item label="总部留存">{{ money(detail.retainAmount) }}</el-descriptions-item>
        <el-descriptions-item label="状态"><dict-tag :options="hc_split_status" :value="detail.splitStatus" /></el-descriptions-item>
        <el-descriptions-item label="结算单">{{ detail.settleNo || '未结算' }}</el-descriptions-item>
      </el-descriptions>
      <el-table :data="detail.details || []" size="small">
        <el-table-column label="参与方" width="100" align="center">
          <template #default="scope"><dict-tag :options="hc_split_party" :value="scope.row.partyType" /></template>
        </el-table-column>
        <el-table-column label="参与方名称" prop="partyName" :show-overflow-tooltip="true" />
        <el-table-column label="计算方式" width="90" align="center">
          <template #default="scope">{{ scope.row.calcType === '2' ? '固定额' : '按比例' }}</template>
        </el-table-column>
        <el-table-column label="比例" width="80" align="right">
          <template #default="scope">{{ scope.row.calcType === '1' ? percent(scope.row.rate) : '-' }}</template>
        </el-table-column>
        <el-table-column label="基数" width="100" align="right">
          <template #default="scope">{{ money(scope.row.baseAmount) }}</template>
        </el-table-column>
        <el-table-column label="分账金额" width="110" align="right">
          <template #default="scope">{{ money(scope.row.splitAmount) }}</template>
        </el-table-column>
        <el-table-column label="结算状态" width="100" align="center">
          <template #default="scope"><el-tag :type="scope.row.settleStatus === '1' ? 'success' : 'warning'">{{ scope.row.settleStatus === '1' ? '已结算' : '待结算' }}</el-tag></template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 待结算预览 -->
    <el-dialog title="待结算参与方预览" v-model="previewOpen" width="760px" append-to-body>
      <el-form :inline="true" class="mb8">
        <el-form-item label="结算期间">
          <el-date-picker v-model="previewRange" type="daterange" value-format="YYYY-MM-DD" start-placeholder="开始" end-placeholder="结束" style="width: 260px" />
        </el-form-item>
        <el-form-item><el-button type="primary" icon="Search" @click="getPreview">查询</el-button></el-form-item>
      </el-form>
      <el-table :data="previewList" size="small" v-loading="previewLoading">
        <el-table-column label="参与方" width="100" align="center">
          <template #default="scope"><dict-tag :options="hc_split_party" :value="scope.row.partyType" /></template>
        </el-table-column>
        <el-table-column label="参与方名称" prop="partyName" :show-overflow-tooltip="true" />
        <el-table-column label="明细笔数" prop="detailCount" width="90" align="center" />
        <el-table-column label="分账单数" prop="billCount" width="90" align="center" />
        <el-table-column label="待结算金额" width="120" align="right">
          <template #default="scope">{{ money(scope.row.totalAmount) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="130" align="center">
          <template #default="scope">
            <el-button link type="primary" icon="Plus" @click="handleGenerate(scope.row)" v-hasPermi="['hc:settlement:add']">生成结算单</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!previewLoading && !previewList.length" description="该期间内没有待结算的分账明细" :image-size="60" />
    </el-dialog>
  </div>
</template>

<script setup name="Split">
import {
  listSplitRule, addSplitRule, updateSplitRule, delSplitRule,
  listSplitBill, getSplitBill, recalcSplit, voidSplit,
  listSettlement, previewSettlement, addSettlement, confirmSettlement, cancelSettlement, delSettlement
} from "@/api/hc/split"
import { listStore } from "@/api/hc/basic"

const { proxy } = getCurrentInstance()
const { hc_split_biz_type, hc_split_party, hc_split_status, hc_settle_status, hc_store_type } =
  proxy.useDict("hc_split_biz_type", "hc_split_party", "hc_split_status", "hc_settle_status", "hc_store_type")

const tab = ref("rule")
const storeOptions = ref([])

/* ---------------- 公共格式化 ---------------- */
function money(v) {
  return v == null ? '0.00' : Number(v).toFixed(2)
}
function percent(v) {
  return v == null ? '-' : (Number(v) * 100).toFixed(2) + '%'
}
function storeTypeLabel(v) {
  if (!v) return '不限'
  const d = hc_store_type.value.find(x => x.value === v)
  return d ? d.label : v
}

/* ---------------- 分账规则 ---------------- */
const ruleList = ref([])
const ruleTotal = ref(0)
const ruleLoading = ref(false)
const ruleOpen = ref(false)
const ruleTitle = ref("")
const ruleQuery = ref({ pageNum: 1, pageSize: 10, bizType: undefined, partyType: undefined, status: undefined })
const ruleForm = ref({})
const ruleRules = {
  ruleName: [{ required: true, message: "规则名称不能为空", trigger: "blur" }],
  bizType: [{ required: true, message: "请选择业务类型", trigger: "change" }],
  partyType: [{ required: true, message: "请选择参与方", trigger: "change" }]
}

function getRuleList() {
  ruleLoading.value = true
  listSplitRule(ruleQuery.value).then(r => {
    ruleList.value = r.rows
    ruleTotal.value = r.total
    ruleLoading.value = false
  })
}
function handleRuleQuery() { ruleQuery.value.pageNum = 1; getRuleList() }
function resetRuleQuery() { proxy.resetForm("ruleQueryRef"); handleRuleQuery() }
function resetRuleForm() {
  ruleForm.value = { ruleId: undefined, ruleName: undefined, bizType: "2", partyType: undefined, storeId: undefined, storeType: undefined, calcType: "1", rate: 0.1, fixAmount: 0, priority: 0, effectiveStart: undefined, effectiveEnd: undefined, status: "0", remark: undefined }
  proxy.resetForm("ruleFormRef")
}
function handleRuleAdd() { resetRuleForm(); ruleOpen.value = true; ruleTitle.value = "新增分账规则" }
function handleRuleUpdate(row) {
  resetRuleForm()
  ruleForm.value = { ...row, rate: Number(row.rate) || 0, fixAmount: Number(row.fixAmount) || 0, priority: Number(row.priority) || 0 }
  ruleOpen.value = true
  ruleTitle.value = "修改分账规则"
}
function submitRule() {
  proxy.$refs["ruleFormRef"].validate(valid => {
    if (!valid) return
    const fn = ruleForm.value.ruleId ? updateSplitRule : addSplitRule
    fn(ruleForm.value).then(() => {
      proxy.$modal.msgSuccess("操作成功")
      ruleOpen.value = false
      getRuleList()
    })
  })
}
function handleRuleDelete(row) {
  proxy.$modal.confirm('确认删除规则【' + row.ruleName + '】？已生成的分账单不受影响。').then(() => delSplitRule(row.ruleId))
    .then(() => { getRuleList(); proxy.$modal.msgSuccess("删除成功") }).catch(() => {})
}

/* ---------------- 分账单 ---------------- */
const billList = ref([])
const billTotal = ref(0)
const billLoading = ref(false)
const billOpen = ref(false)
const detail = ref({})
const billRange = ref([])
const billQuery = ref({ pageNum: 1, pageSize: 10, bizType: undefined, customerName: undefined, splitStatus: undefined, crossStore: undefined })

function getBillList() {
  billLoading.value = true
  const params = proxy.addDateRange({ ...billQuery.value }, billRange.value)
  listSplitBill(params).then(r => {
    billList.value = r.rows
    billTotal.value = r.total
    billLoading.value = false
  })
}
function handleBillQuery() { billQuery.value.pageNum = 1; getBillList() }
function resetBillQuery() { billRange.value = []; proxy.resetForm("billQueryRef"); handleBillQuery() }
function openBill(row) {
  getSplitBill(row.splitId).then(r => {
    detail.value = r.data || {}
    billOpen.value = true
  })
}
function handleRecalc(row) {
  proxy.$modal.confirm('按当前生效规则重算分账单【' + row.splitNo + '】？').then(() => recalcSplit({ bizType: row.bizType, bizId: row.bizId }))
    .then(() => { getBillList(); proxy.$modal.msgSuccess("重算成功") }).catch(() => {})
}
function handleVoid(row) {
  proxy.$modal.prompt('请输入作废原因（将留痕）：').then(({ value }) => {
    if (!value || !value.trim()) {
      proxy.$modal.msgWarning("作废原因不能为空")
      return
    }
    return voidSplit({ bizType: row.bizType, bizId: row.bizId, remark: value.trim() })
      .then(() => { getBillList(); proxy.$modal.msgSuccess("已作废") })
  }).catch(() => {})
}

/* ---------------- 结算单 ---------------- */
const settleList = ref([])
const settleTotal = ref(0)
const settleLoading = ref(false)
const settleRange = ref([])
const settleQuery = ref({ pageNum: 1, pageSize: 10, partyType: undefined, settleStatus: undefined })
const previewOpen = ref(false)
const previewLoading = ref(false)
const previewList = ref([])
const previewRange = ref([])

function getSettleList() {
  settleLoading.value = true
  const params = proxy.addDateRange({ ...settleQuery.value }, settleRange.value)
  listSettlement(params).then(r => {
    settleList.value = r.rows
    settleTotal.value = r.total
    settleLoading.value = false
  })
}
function handleSettleQuery() { settleQuery.value.pageNum = 1; getSettleList() }
function resetSettleQuery() { settleRange.value = []; proxy.resetForm("settleQueryRef"); handleSettleQuery() }
function openPreview() {
  const now = new Date()
  const first = new Date(now.getFullYear(), now.getMonth(), 1)
  previewRange.value = [fmtDate(first), fmtDate(now)]
  previewOpen.value = true
  getPreview()
}
function fmtDate(d) {
  const m = d.getMonth() + 1
  const day = d.getDate()
  return d.getFullYear() + '-' + (m < 10 ? '0' + m : m) + '-' + (day < 10 ? '0' + day : day)
}
function getPreview() {
  if (!previewRange.value || previewRange.value.length !== 2) {
    proxy.$modal.msgWarning("请选择结算期间")
    return
  }
  previewLoading.value = true
  previewSettlement({ beginTime: previewRange.value[0], endTime: previewRange.value[1] }).then(r => {
    previewList.value = r.data || []
    previewLoading.value = false
  })
}
function handleGenerate(row) {
  const body = {
    partyType: row.partyType,
    partyId: row.partyId,
    periodBegin: previewRange.value[0],
    periodEnd: previewRange.value[1]
  }
  addSettlement(body).then(r => {
    proxy.$modal.msgSuccess("结算单已生成：" + (r.data && r.data.settleNo ? r.data.settleNo : ''))
    getPreview()
    getSettleList()
  })
}
function handleConfirm(row) {
  proxy.$modal.confirm('确认结算单【' + row.settleNo + '】？确认后各方明细与分账单将置为已结算。').then(() => confirmSettlement(row.settleId))
    .then(() => { getSettleList(); getBillList(); proxy.$modal.msgSuccess("结算已确认") }).catch(() => {})
}
function handleCancel(row) {
  proxy.$modal.confirm('撤销结算单【' + row.settleNo + '】？关联明细将回到待结算。').then(() => cancelSettlement(row.settleId))
    .then(() => { getSettleList(); getBillList(); proxy.$modal.msgSuccess("结算已撤销") }).catch(() => {})
}
function handleSettleDelete(row) {
  proxy.$modal.confirm('确认删除待确认结算单【' + row.settleNo + '】？').then(() => delSettlement(row.settleId))
    .then(() => { getSettleList(); proxy.$modal.msgSuccess("删除成功") }).catch(() => {})
}

listStore({ pageNum: 1, pageSize: 200 }).then(r => storeOptions.value = r.rows)
getRuleList()
getBillList()
getSettleList()
</script>

<style scoped>
.tip-text { font-size: 12px; color: #909399; margin-left: 8px; }
</style>
