<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="卡号" prop="cardNo">
        <el-input v-model="queryParams.cardNo" placeholder="请输入卡号" clearable style="width: 180px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="客户姓名" prop="customerName">
        <el-input v-model="queryParams.customerName" placeholder="请输入客户姓名" clearable style="width: 150px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="卡类型" prop="cardType">
        <el-select v-model="queryParams.cardType" placeholder="卡类型" clearable style="width: 130px">
          <el-option v-for="dict in hc_card_type" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="卡状态" prop="cardStatus">
        <el-select v-model="queryParams.cardStatus" placeholder="卡状态" clearable style="width: 130px">
          <el-option v-for="dict in hc_card_status" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="openSell" v-hasPermi="['hc:sellcard:sell']">售卡开卡</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="cardList">
      <el-table-column label="卡号" prop="cardNo" width="180" />
      <el-table-column label="客户" prop="customerName" width="90" />
      <el-table-column label="卡名称" prop="cardName" :show-overflow-tooltip="true" />
      <el-table-column label="类型" width="80">
        <template #default="scope"><dict-tag :options="hc_card_type" :value="scope.row.cardType" /></template>
      </el-table-column>
      <el-table-column label="余额" prop="balance" width="100" align="right" />
      <el-table-column label="剩余本金" prop="remainPrincipal" width="100" align="right" />
      <el-table-column label="剩余次数" prop="remainTimes" width="90" align="center" />
      <el-table-column label="售卡门店" prop="saleStoreName" width="110" :show-overflow-tooltip="true" />
      <el-table-column label="到期日" width="110">
        <template #default="scope">{{ parseTime(scope.row.expireDate, '{y}-{m}-{d}') }}</template>
      </el-table-column>
      <el-table-column label="状态" width="90" align="center">
        <template #default="scope"><dict-tag :options="hc_card_status" :value="scope.row.cardStatus" /></template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="180" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button v-if="scope.row.cardStatus === '1'" link type="primary" icon="Check" @click="openVerify(scope.row)" v-hasPermi="['hc:membercard:verify']">核销</el-button>
          <el-button v-if="scope.row.cardStatus === '1'" link type="primary" icon="RefreshLeft" @click="openRefund(scope.row)" v-hasPermi="['hc:refund:add']">退款</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- 售卡开卡 -->
    <el-dialog title="售卡开卡（收款计入预收，不确认收入）" v-model="sellOpen" width="560px" append-to-body>
      <el-form ref="sellRef" :model="sellForm" :rules="sellRules" label-width="100px">
        <el-form-item label="客户" prop="customerId">
          <el-select v-model="sellForm.customerId" filterable remote :remote-method="searchCustomer" placeholder="输入姓名/手机号搜索" style="width: 100%">
            <el-option v-for="c in customerOptions" :key="c.customerId" :label="c.name + ' / ' + c.phone" :value="c.customerId" />
          </el-select>
        </el-form-item>
        <el-form-item label="售卡门店" prop="storeId">
          <el-select v-model="sellForm.storeId" placeholder="请选择门店" style="width: 100%">
            <el-option v-for="s in storeOptions" :key="s.storeId" :label="s.storeName" :value="s.storeId" />
          </el-select>
        </el-form-item>
        <el-form-item label="卡项" prop="defId">
          <el-select v-model="sellForm.defId" placeholder="请选择卡项" style="width: 100%" @change="onDefChange">
            <el-option v-for="d in defOptions" :key="d.defId" :label="d.defName + '（' + dictLabel(hc_card_type, d.cardType) + ' ¥' + d.price + '）'" :value="d.defId" />
          </el-select>
        </el-form-item>
        <el-form-item label="订单原价" prop="amount">
          <el-input-number v-model="sellForm.amount" :min="0.01" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="优惠券码" prop="couponCode">
          <el-input v-model="sellForm.couponCode" placeholder="可选，录入客户券码（门槛按原价校验，实收=原价-券抵扣）" clearable />
        </el-form-item>
        <el-form-item label="赠送金额" prop="giftAmount">
          <el-input-number v-model="sellForm.giftAmount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="支付方式" prop="payMethod">
          <el-select v-model="sellForm.payMethod" style="width: 100%">
            <el-option label="微信" value="wechat" /><el-option label="支付宝" value="alipay" /><el-option label="现金" value="cash" /><el-option label="银行卡" value="card" />
          </el-select>
        </el-form-item>
        <el-form-item label="销售提成归属" prop="saleTechnicianId">
          <el-select v-model="sellForm.saleTechnicianId" clearable placeholder="可选：参与提成的技师" style="width: 100%">
            <el-option v-for="t in techOptions" :key="t.technicianId" :label="t.techName" :value="t.technicianId" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitSell">确认收款并开卡</el-button>
        <el-button @click="sellOpen = false">取 消</el-button>
      </template>
    </el-dialog>

    <!-- 核销 -->
    <el-dialog title="会员卡核销（核销才确认收入）" v-model="verifyOpen" width="520px" append-to-body>
      <el-descriptions :column="2" border size="small" class="mb8">
        <el-descriptions-item label="卡号">{{ curCard.cardNo }}</el-descriptions-item>
        <el-descriptions-item label="客户">{{ curCard.customerName }}</el-descriptions-item>
        <el-descriptions-item label="余额">{{ curCard.balance }}</el-descriptions-item>
        <el-descriptions-item label="剩余次数">{{ curCard.remainTimes }}</el-descriptions-item>
      </el-descriptions>
      <el-form ref="verifyRef" :model="verifyForm" label-width="100px">
        <el-form-item label="核销门店" prop="storeId">
          <el-select v-model="verifyForm.storeId" style="width: 100%">
            <el-option v-for="s in storeOptions" :key="s.storeId" :label="s.storeName" :value="s.storeId" />
          </el-select>
        </el-form-item>
        <el-form-item label="服务技师" prop="technicianId">
          <el-select v-model="verifyForm.technicianId" style="width: 100%">
            <el-option v-for="t in techOptions" :key="t.technicianId" :label="t.techName" :value="t.technicianId" />
          </el-select>
        </el-form-item>
        <el-form-item label="核销类型" prop="verifyType">
          <el-radio-group v-model="verifyForm.verifyType">
            <el-radio value="1">正常</el-radio><el-radio value="2">加项</el-radio><el-radio value="3">补核销</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="curCard.cardType !== '1'" label="扣减次数" prop="timesDeduct">
          <el-input-number v-model="verifyForm.timesDeduct" :min="1" :max="curCard.remainTimes" />
        </el-form-item>
        <el-form-item v-else label="抵扣金额" prop="amountDeduct">
          <el-input-number v-model="verifyForm.amountDeduct" :min="0.01" :max="curCard.balance" :precision="2" />
        </el-form-item>
        <el-form-item label="项目名称">
          <el-input v-model="verifyForm.itemName" placeholder="默认取卡名称，可改为具体服务项目" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitVerify">确认核销</el-button>
        <el-button @click="verifyOpen = false">取 消</el-button>
      </template>
    </el-dialog>

    <!-- 退款申请 -->
    <el-dialog title="申请退款（赠金作废、剩余次数清零，需财务审批）" v-model="refundOpen" width="480px" append-to-body>
      <el-form ref="refundRef" :model="refundForm" label-width="100px">
        <el-form-item label="退还本金">
          <el-input-number v-model="refundForm.refundPrincipal" :min="0.01" :max="curCard.remainPrincipal || 0" :precision="2" style="width: 100%" />
          <div class="el-form-item__info" style="color: #909399; font-size: 12px;">上限为剩余本金 ¥{{ curCard.remainPrincipal }}，赠金不可退</div>
        </el-form-item>
        <el-form-item label="退款原因">
          <el-input v-model="refundForm.reason" type="textarea" :rows="3" placeholder="必填，留痕" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitRefund">提交审批</el-button>
        <el-button @click="refundOpen = false">取 消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="MemberCard">
import { listCard, sellCard, verifyCard, applyRefund } from "@/api/hc/card"
import { listCustomer } from "@/api/hc/card"
import { listStore, listTechnician, optionCardDef } from "@/api/hc/basic"

const { proxy } = getCurrentInstance()
const { hc_card_type, hc_card_status } = proxy.useDict("hc_card_type", "hc_card_status")

const cardList = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const storeOptions = ref([])
const techOptions = ref([])
const defOptions = ref([])
const customerOptions = ref([])
const sellOpen = ref(false)
const verifyOpen = ref(false)
const refundOpen = ref(false)
const curCard = ref({})

const data = reactive({
  queryParams: { pageNum: 1, pageSize: 10, cardNo: undefined, customerName: undefined, cardType: undefined, cardStatus: undefined },
  sellForm: { amount: undefined, giftAmount: 0, payMethod: "wechat" },
  sellRules: {
    customerId: [{ required: true, message: "请选择客户", trigger: "change" }],
    storeId: [{ required: true, message: "请选择门店", trigger: "change" }],
    defId: [{ required: true, message: "请选择卡项", trigger: "change" }],
    amount: [{ required: true, message: "实收金额必须大于0", trigger: "blur" }]
  },
  verifyForm: { verifyType: "1", timesDeduct: 1 }
})
const { queryParams, sellForm, sellRules, verifyForm } = toRefs(data)

function dictLabel(dict, val) {
  const item = dict.find(d => d.value === val)
  return item ? item.label : val
}
function getList() {
  loading.value = true
  listCard(queryParams.value).then(response => {
    cardList.value = response.rows
    total.value = response.total
    loading.value = false
  })
}
function searchCustomer(kw) {
  if (!kw) return
  listCustomer({ pageNum: 1, pageSize: 20, name: kw }).then(res => { customerOptions.value = res.rows })
}
function openSell() {
  sellForm.value = { amount: undefined, couponCode: undefined, giftAmount: 0, payMethod: "wechat", saleTechnicianId: undefined }
  sellOpen.value = true
}
function onDefChange(defId) {
  const def = defOptions.value.find(d => d.defId === defId)
  if (def) {
    sellForm.value.amount = def.price
    sellForm.value.giftAmount = def.giftAmount || 0
  }
}
function submitSell() {
  proxy.$refs["sellRef"].validate(valid => {
    if (valid) {
      const { saleTechnicianId, ...order } = sellForm.value
      sellCard(order, saleTechnicianId).then(res => {
        proxy.$modal.msgSuccess("开卡成功，卡号：" + res.data.cardNo)
        sellOpen.value = false
        getList()
      })
    }
  })
}
function openVerify(row) {
  curCard.value = row
  verifyForm.value = { cardId: row.cardId, storeId: row.saleStoreId, technicianId: undefined, verifyType: "1", timesDeduct: 1, amountDeduct: undefined, itemName: row.cardName }
  verifyOpen.value = true
}
function submitVerify() {
  verifyCard(verifyForm.value).then(res => {
    proxy.$modal.msgSuccess("核销成功，本次确认收入 ¥" + res.data.confirmAmount)
    verifyOpen.value = false
    getList()
  })
}
function openRefund(row) {
  curCard.value = row
  refundForm.value = { cardId: row.cardId, refundPrincipal: row.remainPrincipal, reason: "" }
  refundOpen.value = true
}
const refundForm = ref({})
function submitRefund() {
  if (!refundForm.value.reason) { proxy.$modal.msgError("请填写退款原因（留痕）"); return }
  applyRefund(refundForm.value).then(() => {
    proxy.$modal.msgSuccess("退款申请已提交，等待财务审批")
    refundOpen.value = false
    getList()
  })
}
getList()
listStore({ pageNum: 1, pageSize: 100, status: "0" }).then(res => { storeOptions.value = res.rows })
listTechnician({ pageNum: 1, pageSize: 200, status: "0" }).then(res => { techOptions.value = res.rows })
optionCardDef().then(res => { defOptions.value = res.data })
</script>
