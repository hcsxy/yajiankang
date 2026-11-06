<template>
  <div class="pos-wrap">
    <!-- 背景装饰层 -->
    <div class="tech-bg">
      <div class="grid-layer"></div>
      <span class="glow glow-a"></span>
      <span class="glow glow-b"></span>
    </div>

    <!-- 收银台顶栏 -->
    <div class="pos-topbar">
      <div class="tb-left">
        <span class="tb-badge"><el-icon><CreditCard /></el-icon> POS 收银台</span>
        <span class="tb-mode">{{ activeTab === 'sell' ? '售卡开卡' : '到店结账 · 核销' }}</span>
      </div>
      <div class="tb-right">
        <span v-if="customer.name" class="tb-cust"><el-icon><User /></el-icon> {{ customer.name }} · {{ customer.phone }}</span>
        <span v-else class="tb-cust idle"><el-icon><User /></el-icon> 未选择客户</span>
        <span class="tb-time">{{ clockText }}</span>
      </div>
    </div>

    <div class="pos-container">
      <!-- 左侧：客户与卡券 -->
      <div class="pos-left">
        <div class="pos-panel">
          <div class="panel-title"><el-icon><Search /></el-icon> 客户检索</div>
          <el-input
            v-model="keyword"
            placeholder="输入姓名 / 手机号后回车"
            clearable
            class="search-input"
            @keyup.enter="searchCustomer"
          >
            <template #append>
              <el-button @click="searchCustomer" :loading="custLoading">查找</el-button>
            </template>
          </el-input>
          <div v-if="customer.name" class="customer-box">
            <div class="cust-line">
              <span class="cust-avatar">{{ (customer.name || '').charAt(0) }}</span>
              <div class="cust-info">
                <div class="cust-head">
                  <span class="cust-name">{{ customer.name }}</span>
                  <el-tag size="small" effect="dark" class="lv-tag">Lv{{ customer.memberLevel || 1 }}</el-tag>
                </div>
                <div class="cust-sub">{{ customer.customerNo }} · {{ customer.phone }}</div>
              </div>
            </div>
            <div class="cust-stats">
              <div class="cs-item"><span class="cs-val">¥{{ customer.totalAmount || 0 }}</span><span class="cs-label">累计消费</span></div>
              <div class="cs-split"></div>
              <div class="cs-item"><span class="cs-val">{{ customer.points || 0 }}</span><span class="cs-label">积分</span></div>
            </div>
          </div>
          <div v-else class="cust-empty">请先检索并选择客户</div>
        </div>

        <div class="pos-panel">
          <div class="panel-title"><el-icon><CreditCard /></el-icon> 可用会员卡</div>
          <div v-loading="cardLoading">
            <div v-if="!customer.customerId" class="cust-empty">选择客户后自动加载</div>
            <div v-else-if="cards.length === 0" class="cust-empty">暂无可用卡</div>
            <div
              v-for="c in cards"
              :key="c.cardId"
              class="card-item"
              :class="{ active: settleForm.cardId === c.cardId }"
              @click="pickCard(c)"
            >
              <div class="ci-head">
                <span class="ci-name">{{ c.cardName }}</span>
                <el-tag size="small" effect="plain" :type="cardTagType(c.cardType)">{{ cardTypeName(c.cardType) }}</el-tag>
              </div>
              <div class="ci-body">
                <span v-if="c.cardType === '1' || c.cardType === '3'" class="ci-val">¥{{ c.balance }}</span>
                <span v-else-if="c.cardType === '2'" class="ci-val">{{ c.remainTimes }} 次</span>
                <span v-else class="ci-val">{{ statusText(c.cardStatus) }}</span>
                <span class="ci-no">{{ c.cardNo }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="pos-panel">
          <div class="panel-title"><el-icon><Ticket /></el-icon> 可用优惠券</div>
          <div v-if="coupons.length === 0" class="cust-empty">暂无可用券</div>
          <el-scrollbar v-else max-height="140px">
            <div v-for="cp in coupons" :key="cp.recordId" class="coupon-item">
              <span class="cp-amt">¥{{ cp.discountAmount }}</span>
              <span class="cp-name">{{ cp.name }}</span>
              <span class="cp-code">{{ cp.couponCode }}</span>
            </div>
          </el-scrollbar>
        </div>
      </div>

      <!-- 右侧：收银操作 -->
      <div class="pos-right">
        <div class="pos-stage">
          <el-tabs v-model="activeTab" class="pos-tabs">
            <!-- 售卡开卡 -->
            <el-tab-pane label="售卡开卡" name="sell">
              <el-form ref="sellRef" :model="sellForm" :rules="sellRules" label-width="96px" class="pos-form">
                <el-form-item label="客户" prop="customerId">
                  <span v-if="customer.name" class="ok-text">{{ customer.name }} / {{ customer.phone }}</span>
                  <span v-else class="warn-text">请先在左侧检索客户</span>
                </el-form-item>
                <el-form-item label="售卡门店" prop="storeId">
                  <el-select v-model="sellForm.storeId" placeholder="请选择门店" style="width: 100%">
                    <el-option v-for="s in storeOptions" :key="s.storeId" :label="s.storeName" :value="s.storeId" />
                  </el-select>
                </el-form-item>
                <el-form-item label="卡项" prop="defId">
                  <el-select v-model="sellForm.defId" placeholder="请选择卡项" style="width: 100%" @change="onDefChange">
                    <el-option
                      v-for="d in defOptions"
                      :key="d.defId"
                      :label="d.defName + '（' + d.price + '）'"
                      :value="d.defId"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item label="订单原价" prop="amount">
                  <el-input-number v-model="sellForm.amount" :min="0.01" :precision="2" style="width: 100%" />
                </el-form-item>
                <el-form-item label="优惠券码" prop="couponCode">
                  <el-input v-model="sellForm.couponCode" placeholder="可选，实收=原价-券抵扣" clearable :disabled="combinePay" />
                </el-form-item>
                <el-form-item label="赠送金额" prop="giftAmount">
                  <el-input-number v-model="sellForm.giftAmount" :min="0" :precision="2" style="width: 100%" />
                </el-form-item>
                <el-form-item label="收款方式">
                  <el-switch v-model="combinePay" active-text="组合收款" inactive-text="单渠道" inline-prompt />
                  <span v-if="combinePay" class="tip-text">多通道拆分，各渠道合计必须等于订单金额；微信/支付宝走沙箱网关即时到账</span>
                </el-form-item>
                <el-form-item v-if="!combinePay" label="支付方式" prop="payMethod">
                  <el-radio-group v-model="sellForm.payMethod" class="pay-tiles">
                    <el-radio-button value="wechat"><el-icon><ChatDotRound /></el-icon> 微信</el-radio-button>
                    <el-radio-button value="alipay"><el-icon><Wallet /></el-icon> 支付宝</el-radio-button>
                    <el-radio-button value="cash"><el-icon><Money /></el-icon> 现金</el-radio-button>
                    <el-radio-button value="bankcard"><el-icon><Postcard /></el-icon> 银行卡</el-radio-button>
                  </el-radio-group>
                </el-form-item>
                <el-form-item v-if="combinePay" label="收款拆分">
                  <el-table :data="payRows" size="small" class="split-table" style="width:100%">
                    <el-table-column label="渠道" width="150">
                      <template #default="s">
                        <el-select v-model="s.row.channel" size="small" style="width:130px">
                          <el-option v-for="c in payChannels" :key="c.value" :label="c.label" :value="c.value" />
                        </el-select>
                      </template>
                    </el-table-column>
                    <el-table-column label="金额" width="170">
                      <template #default="s">
                        <el-input-number v-model="s.row.amount" :min="0.01" :precision="2" size="small" style="width:150px" />
                      </template>
                    </el-table-column>
                    <el-table-column label="操作" align="center">
                      <template #default="s">
                        <el-button link type="danger" icon="Delete" :disabled="payRows.length <= 1" @click="payRows.splice(s.$index, 1)">删</el-button>
                        <el-button link type="primary" @click="fillRemain(s.row)">填剩余</el-button>
                      </template>
                    </el-table-column>
                  </el-table>
                  <div class="pay-sum" :class="{ bad: !combineOk }">
                    合计 ¥{{ combineSum.toFixed(2) }} / 应收 ¥{{ (sellForm.amount || 0).toFixed(2) }}
                    <el-button link type="primary" icon="Plus" @click="payRows.push({ channel: 'cash', amount: undefined })">加渠道</el-button>
                  </div>
                </el-form-item>
                <el-form-item label="销售技师" prop="saleTechnicianId">
                  <el-select v-model="sellForm.saleTechnicianId" clearable placeholder="可选：参与提成" style="width: 100%">
                    <el-option v-for="t in techOptions" :key="t.technicianId" :label="t.techName" :value="t.technicianId" />
                  </el-select>
                </el-form-item>

                <!-- 结算小票 -->
                <div class="settle-bar">
                  <div class="sb-rows">
                    <div class="sb-item"><span>订单原价</span><b>¥{{ (sellForm.amount || 0).toFixed(2) }}</b></div>
                    <div class="sb-item"><span>赠送金额</span><b>¥{{ (sellForm.giftAmount || 0).toFixed(2) }}</b></div>
                    <div class="sb-item" v-if="combinePay"><span>收款拆分</span><b>{{ payRows.length }} 个渠道</b></div>
                  </div>
                  <div class="sb-total">
                    <span>应收合计</span>
                    <b class="amt">¥{{ (sellForm.amount || 0).toFixed(2) }}</b>
                  </div>
                </div>

                <el-form-item>
                  <el-button type="primary" class="submit-btn" icon="Check" @click="submitSell" :disabled="!customer.customerId">确认收款并开卡</el-button>
                  <el-button class="ghost-btn" icon="Refresh" @click="resetSell">重置</el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>

            <!-- 到店结账（核销） -->
            <el-tab-pane label="到店结账" name="settle">
              <el-form ref="settleRef" :model="settleForm" :rules="settleRules" label-width="96px" class="pos-form">
                <el-form-item label="使用卡" prop="cardId">
                  <span v-if="curCard.cardNo" class="ok-text">{{ curCard.cardName }}（{{ curCard.cardNo }}）</span>
                  <span v-else class="warn-text">请在左侧点选一张可用会员卡</span>
                </el-form-item>
                <el-form-item label="核销门店" prop="storeId">
                  <el-select v-model="settleForm.storeId" placeholder="请选择门店" style="width: 100%">
                    <el-option v-for="s in storeOptions" :key="s.storeId" :label="s.storeName" :value="s.storeId" />
                  </el-select>
                </el-form-item>
                <el-form-item label="服务技师" prop="technicianId">
                  <el-select v-model="settleForm.technicianId" placeholder="请选择技师" style="width: 100%">
                    <el-option v-for="t in techOptions" :key="t.technicianId" :label="t.techName" :value="t.technicianId" />
                  </el-select>
                </el-form-item>
                <el-form-item label="核销类型" prop="verifyType">
                  <el-radio-group v-model="settleForm.verifyType">
                    <el-radio value="1">正常</el-radio>
                    <el-radio value="2">加项</el-radio>
                    <el-radio value="3">补核销</el-radio>
                  </el-radio-group>
                </el-form-item>
                <el-form-item v-if="curCard.cardType !== '1'" label="扣减次数" prop="timesDeduct">
                  <el-input-number v-model="settleForm.timesDeduct" :min="1" :max="curCard.remainTimes || 1" />
                </el-form-item>
                <el-form-item v-else label="抵扣金额" prop="amountDeduct">
                  <el-input-number v-model="settleForm.amountDeduct" :min="0.01" :max="curCard.balance || 0" :precision="2" style="width: 180px" />
                </el-form-item>
                <el-form-item label="项目名称">
                  <el-input v-model="settleForm.itemName" placeholder="默认取卡名称" />
                </el-form-item>

                <!-- 结算小票 -->
                <div class="settle-bar">
                  <div class="sb-rows">
                    <div class="sb-item"><span>卡类型</span><b>{{ cardTypeName(curCard.cardType) }}</b></div>
                    <div class="sb-item" v-if="curCard.cardType === '1' || curCard.cardType === '3'"><span>卡内余额</span><b>¥{{ curCard.balance || 0 }}</b></div>
                    <div class="sb-item" v-else-if="curCard.cardType === '2'"><span>剩余次数</span><b>{{ curCard.remainTimes || 0 }} 次</b></div>
                    <div class="sb-item"><span>本次核销</span><b>{{ curCard.cardType === '1' ? ('¥' + (settleForm.amountDeduct || 0)) : ((settleForm.timesDeduct || 0) + ' 次') }}</b></div>
                  </div>
                  <div class="sb-total">
                    <span>确认收入</span>
                    <b class="amt">{{ curCard.cardType === '1' ? ('¥' + (settleForm.amountDeduct || 0).toFixed(2)) : (settleForm.timesDeduct + ' 次') }}</b>
                  </div>
                </div>

                <el-form-item>
                  <el-button type="primary" class="submit-btn" icon="Check" @click="submitSettle" :disabled="!curCard.cardId">确认核销收款</el-button>
                  <el-button class="ghost-btn" icon="Refresh" @click="resetSettle">重置</el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>
          </el-tabs>
        </div>

        <!-- 本日小票流水 -->
        <div class="ticket-box">
          <div class="ticket-head">
            <span class="th-title"><el-icon><Tickets /></el-icon> 本日收银流水（本地）</span>
            <el-button link type="danger" icon="Delete" @click="tickets = []">清空</el-button>
          </div>
          <el-table :data="tickets" size="small" max-height="220" class="ticket-table" empty-text="今日暂无收银记录">
            <el-table-column label="时间" prop="time" width="100" />
            <el-table-column label="类型" width="80">
              <template #default="scope">
                <el-tag size="small" :type="scope.row.type === 'sell' ? 'success' : 'warning'" effect="dark">{{ scope.row.type === 'sell' ? '售卡' : '核销' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="客户" prop="customer" width="100" />
            <el-table-column label="项目" prop="item" :show-overflow-tooltip="true" />
            <el-table-column label="金额" prop="amount" width="110" align="right">
              <template #default="scope"><span class="tk-amt">{{ scope.row.amount }}</span></template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup name="Pos">
import { listCustomer, usableCard, sellCard, verifyCard } from "@/api/hc/card"
import { usableCoupons } from "@/api/hc/coupon"
import { listStore, optionTechnician, optionCardDef } from "@/api/hc/basic"

const { proxy } = getCurrentInstance()

const activeTab = ref("sell")
const keyword = ref("")
const custLoading = ref(false)
const cardLoading = ref(false)
const customer = ref({})
const cards = ref([])
const coupons = ref([])
const storeOptions = ref([])
const techOptions = ref([])
const defOptions = ref([])
const curCard = ref({})
const tickets = ref([])

// 收银台实时时钟
const now = ref(new Date())
const clockTimer = setInterval(() => { now.value = new Date() }, 1000)
const clockText = computed(() => {
  const d = now.value
  const p = n => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
})
onBeforeUnmount(() => clearInterval(clockTimer))

// M13 组合收款
const combinePay = ref(false)
const payChannels = [
  { value: "wechat", label: "微信" },
  { value: "alipay", label: "支付宝" },
  { value: "cash", label: "现金" },
  { value: "bankcard", label: "银行卡" }
]
const payRows = ref([{ channel: "wechat", amount: undefined }])
const combineSum = computed(() => payRows.value.reduce((a, b) => a + (Number(b.amount) || 0), 0))
const combineOk = computed(() => payRows.value.every(r => r.channel && Number(r.amount) > 0)
  && Math.round(combineSum.value * 100) === Math.round((Number(sellForm.value.amount) || 0) * 100))
function fillRemain(row) {
  const remain = (Number(sellForm.value.amount) || 0) - payRows.value.filter(r => r !== row).reduce((a, b) => a + (Number(b.amount) || 0), 0)
  row.amount = remain > 0 ? Number(remain.toFixed(2)) : 0
}

const data = reactive({
  sellForm: { amount: undefined, giftAmount: 0, payMethod: "wechat", couponCode: undefined, saleTechnicianId: undefined },
  sellRules: {
    customerId: [{ required: true, message: "请先检索客户", trigger: "change" }],
    storeId: [{ required: true, message: "请选择门店", trigger: "change" }],
    defId: [{ required: true, message: "请选择卡项", trigger: "change" }],
    amount: [{ required: true, message: "金额必须大于0", trigger: "blur" }]
  },
  settleForm: { cardId: undefined, storeId: undefined, technicianId: undefined, verifyType: "1", timesDeduct: 1, amountDeduct: undefined, itemName: undefined },
  settleRules: {
    cardId: [{ required: true, message: "请选择卡", trigger: "change" }],
    storeId: [{ required: true, message: "请选择门店", trigger: "change" }],
    technicianId: [{ required: true, message: "请选择技师", trigger: "change" }]
  }
})
const { sellForm, sellRules, settleForm, settleRules } = toRefs(data)

function cardTypeName(t) {
  return { "1": "储值卡", "2": "次卡", "3": "疗程卡", "4": "期限卡", "5": "单次卡" }[t] || "会员卡"
}
function cardTagType(t) {
  return { "1": "success", "2": "warning", "3": "primary", "4": "info", "5": "danger" }[t] || "info"
}
function statusText(s) {
  return { "0": "正常", "1": "冻结", "2": "已用完", "3": "已过期", "4": "已退卡" }[s] || ""
}
function nowStr() {
  const d = new Date()
  return d.toTimeString().substring(0, 8)
}

function searchCustomer() {
  if (!keyword.value) {
    proxy.$modal.msgError("请输入姓名或手机号")
    return
  }
  custLoading.value = true
  const q = { pageNum: 1, pageSize: 20 }
  if (/^\d+$/.test(keyword.value)) q.phone = keyword.value
  else q.name = keyword.value
  listCustomer(q).then(res => {
    custLoading.value = false
    const rows = res.rows || []
    if (rows.length === 1) {
      selectCustomer(rows[0])
    } else if (rows.length > 1) {
      selectCustomer(rows[0])
      proxy.$modal.msg("匹配到 " + rows.length + " 位客户，已选中第一位：" + rows[0].name)
    } else {
      proxy.$modal.msgWarning("未找到客户")
    }
  }).catch(() => { custLoading.value = false })
}

function selectCustomer(c) {
  customer.value = c
  sellForm.value.customerId = c.customerId
  settleForm.value.customerId = c.customerId
  curCard.value = {}
  loadUsable(c.customerId)
}

function loadUsable(customerId) {
  cardLoading.value = true
  usableCard(customerId).then(res => {
    cards.value = res.data || []
    cardLoading.value = false
  }).catch(() => { cardLoading.value = false; cards.value = [] })
  usableCoupons(customerId).then(res => {
    coupons.value = res.data || res.rows || []
  }).catch(() => { coupons.value = [] })
}

function pickCard(c) {
  curCard.value = c
  settleForm.value.cardId = c.cardId
  settleForm.value.storeId = c.saleStoreId || settleForm.value.storeId
  settleForm.value.itemName = c.cardName
  settleForm.value.timesDeduct = 1
  settleForm.value.amountDeduct = undefined
  activeTab.value = "settle"
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
    if (!valid) return
    if (combinePay.value && !combineOk.value) {
      proxy.$modal.msgError("组合收款各渠道合计必须等于订单金额")
      return
    }
    const { saleTechnicianId, ...order } = sellForm.value
    if (combinePay.value) {
      order.payMethod = "combine"
      order.payDetails = payRows.value.map(r => ({ channel: r.channel, amount: r.amount }))
    } else {
      order.payDetails = undefined
    }
    sellCard(order, saleTechnicianId).then(res => {
      const recv = order.amount
      const detail = combinePay.value ? "（" + payRows.value.map(r => r.channel + " ¥" + r.amount).join(" + ") + "）" : ""
      tickets.value.unshift({ time: nowStr(), type: "sell", customer: customer.value.name, item: "开卡 " + res.data.cardNo + detail, amount: "¥" + recv })
      proxy.$modal.msgSuccess("开卡成功，卡号：" + res.data.cardNo)
      resetSell()
      loadUsable(customer.value.customerId)
    })
  })
}

function submitSettle() {
  proxy.$refs["settleRef"].validate(valid => {
    if (!valid) return
    verifyCard(settleForm.value).then(res => {
      const amt = curCard.value.cardType === "1" ? ("¥" + settleForm.value.amountDeduct) : (settleForm.value.timesDeduct + " 次")
      tickets.value.unshift({ time: nowStr(), type: "settle", customer: customer.value.name, item: settleForm.value.itemName || curCard.value.cardName, amount: amt })
      proxy.$modal.msgSuccess("核销成功，本次确认收入 ¥" + res.data.confirmAmount)
      resetSettle()
      loadUsable(customer.value.customerId)
    })
  })
}

function resetSell() {
  sellForm.value = {
    customerId: customer.value.customerId,
    storeId: sellForm.value.storeId,
    defId: undefined,
    amount: undefined,
    giftAmount: 0,
    payMethod: "wechat",
    couponCode: undefined,
    saleTechnicianId: undefined
  }
  proxy.$refs["sellRef"] && proxy.$refs["sellRef"].clearValidate()
  payRows.value = [{ channel: "wechat", amount: undefined }]
}
function resetSettle() {
  settleForm.value = {
    customerId: customer.value.customerId,
    cardId: undefined,
    storeId: settleForm.value.storeId,
    technicianId: undefined,
    verifyType: "1",
    timesDeduct: 1,
    amountDeduct: undefined,
    itemName: undefined
  }
  curCard.value = {}
  proxy.$refs["settleRef"] && proxy.$refs["settleRef"].clearValidate()
}

listStore({ pageNum: 1, pageSize: 100, status: "0" }).then(res => { storeOptions.value = res.rows })
optionTechnician().then(res => { techOptions.value = res.data || res.rows || [] })
optionCardDef().then(res => { defOptions.value = res.data || [] })
</script>

<style lang="scss" scoped>
$accent: #3ba9ff;
$accent2: #4dd0ff;
$panel: rgba(13, 33, 63, 0.55);
$line: rgba(90, 160, 255, 0.22);
$text: #e6f2ff;
$sub: #8fb0d8;

.pos-wrap {
  position: relative;
  min-height: calc(100vh - 84px);
  margin: -20px;
  padding: 16px 20px 26px;
  background: linear-gradient(150deg, #050b1a, #0a1c3a 50%, #061325);
  color: $text;
  overflow-x: hidden;
}

/* ---------- 背景装饰 ---------- */
.tech-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;

  .grid-layer {
    position: absolute;
    inset: -40px;
    background-image:
      linear-gradient(rgba(59, 169, 255, 0.06) 1px, transparent 1px),
      linear-gradient(90deg, rgba(59, 169, 255, 0.06) 1px, transparent 1px);
    background-size: 42px 42px;
    animation: gridMove 18s linear infinite;
  }
  .glow {
    position: absolute;
    border-radius: 50%;
    filter: blur(90px);
    animation: breathe 7s ease-in-out infinite;
  }
  .glow-a { width: 420px; height: 420px; top: -140px; right: -80px; background: rgba(59, 169, 255, 0.16); }
  .glow-b { width: 360px; height: 360px; bottom: -120px; left: -100px; background: rgba(77, 208, 255, 0.1); animation-delay: 2.5s; }
}
@keyframes gridMove { from { transform: translateY(0); } to { transform: translateY(42px); } }
@keyframes breathe { 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } }

/* ---------- 顶栏 ---------- */
.pos-topbar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  padding: 12px 18px;
  margin-bottom: 16px;
  border: 1px solid $line;
  border-radius: 12px;
  background: $panel;
  backdrop-filter: blur(12px);

  .tb-left { display: flex; align-items: center; gap: 14px; }
  .tb-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 1px;
    background: linear-gradient(90deg, $text, $accent2);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  .tb-mode {
    padding: 4px 12px;
    font-size: 13px;
    border-radius: 20px;
    color: $accent2;
    background: rgba(59, 169, 255, 0.14);
    border: 1px solid rgba(77, 208, 255, 0.35);
  }
  .tb-right { display: flex; align-items: center; gap: 18px; font-size: 13px; }
  .tb-cust { display: inline-flex; align-items: center; gap: 6px; color: $text;
    &.idle { color: #6d8bb5; }
  }
  .tb-time { color: $accent2; font-variant-numeric: tabular-nums; letter-spacing: 0.5px; }
}

/* ---------- 主体布局 ---------- */
.pos-container {
  position: relative;
  display: flex;
  gap: 16px;
  align-items: flex-start;
}
.pos-left {
  width: 340px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.pos-right {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pos-panel {
  background: $panel;
  border: 1px solid $line;
  border-radius: 12px;
  padding: 14px 16px;
  backdrop-filter: blur(10px);
}
.panel-title {
  font-weight: 600;
  font-size: 14px;
  color: $text;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding-left: 10px;
  position: relative;
  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 14px;
    border-radius: 2px;
    background: linear-gradient(180deg, $accent2, $accent);
    box-shadow: 0 0 8px rgba(77, 208, 255, 0.7);
  }
}

/* ---------- 客户 ---------- */
.customer-box { margin-top: 12px; }
.cust-line { display: flex; align-items: center; gap: 10px; }
.cust-avatar {
  width: 40px; height: 40px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%;
  font-size: 18px; font-weight: 700; color: #041224;
  background: linear-gradient(135deg, $accent2, $accent);
  box-shadow: 0 0 14px rgba(59, 169, 255, 0.4);
}
.cust-info { flex: 1; min-width: 0; }
.cust-head { display: flex; align-items: center; gap: 8px; }
.cust-name { font-size: 16px; font-weight: 600; color: $text; }
.lv-tag { background: rgba(77, 208, 255, 0.2); border-color: transparent; color: $accent2; }
.cust-sub { font-size: 12px; color: $sub; margin-top: 4px; }
.cust-stats {
  display: flex; align-items: center; margin-top: 12px;
  padding: 10px 0 2px; border-top: 1px dashed $line;
  .cs-item { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; }
  .cs-val { font-size: 17px; font-weight: 700; color: $accent2; }
  .cs-label { font-size: 12px; color: $sub; }
  .cs-split { width: 1px; height: 28px; background: $line; }
}
.cust-empty {
  color: #5f7fa8; font-size: 13px; text-align: center; padding: 18px 0;
}

/* ---------- 会员卡 ---------- */
.card-item {
  border: 1px solid $line;
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 8px;
  cursor: pointer;
  background: rgba(8, 22, 44, 0.5);
  transition: all 0.2s;

  &:hover { border-color: rgba(77, 208, 255, 0.6); transform: translateX(2px); }
  &.active {
    border-color: $accent2;
    background: rgba(59, 169, 255, 0.14);
    box-shadow: 0 0 12px rgba(59, 169, 255, 0.3);
  }
}
.ci-head { display: flex; justify-content: space-between; align-items: center; }
.ci-name { font-size: 14px; font-weight: 500; color: $text; }
.ci-body { display: flex; justify-content: space-between; align-items: center; margin-top: 6px; }
.ci-val { font-size: 15px; font-weight: 600; color: #f5a623; }
.ci-no { font-size: 12px; color: $sub; }

/* ---------- 优惠券 ---------- */
.coupon-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 0; border-bottom: 1px dashed $line; font-size: 13px;
}
.cp-amt { color: #ff8f95; font-weight: 700; }
.cp-name { flex: 1; color: $text; }
.cp-code { color: $sub; font-size: 12px; }

/* ---------- 右侧舞台 ---------- */
.pos-stage {
  background: $panel;
  border: 1px solid $line;
  border-radius: 12px;
  padding: 6px 18px 16px;
  backdrop-filter: blur(10px);
}
.pos-form { padding: 6px 4px; }
.ok-text { color: $accent2; }
.warn-text { color: #f5a623; }
.tip-text { margin-left: 12px; font-size: 12px; color: $sub; }

/* 支付方式磁贴 */
:deep(.pay-tiles) {
  display: flex; gap: 10px; flex-wrap: wrap;
  .el-radio-button {
    .el-radio-button__inner {
      display: inline-flex; align-items: center; gap: 6px;
      background: rgba(8, 22, 44, 0.6);
      border: 1px solid $line; border-radius: 8px;
      color: $sub; padding: 9px 18px;
      box-shadow: none !important;
      transition: all 0.2s;
    }
    .el-radio-button__inner:hover { color: $accent2; border-color: rgba(77, 208, 255, 0.5); }
  }
  .el-radio-button__original-radio:checked + .el-radio-button__inner {
    background: linear-gradient(135deg, $accent2, $accent);
    border-color: $accent; color: #041224; font-weight: 600;
    box-shadow: 0 0 14px rgba(77, 208, 255, 0.5) !important;
  }
}

/* 组合收款拆分表 */
:deep(.split-table) {
  .el-table, .el-table__expanded-cell { background: transparent; }
  --el-table-border-color: #{$line};
  --el-table-header-bg-color: rgba(59, 169, 255, 0.1);
  --el-table-tr-bg-color: transparent;
  --el-table-text-color: #{$text};
  --el-table-header-text-color: #{$sub};
  --el-table-row-hover-bg-color: rgba(59, 169, 255, 0.1);
  background: transparent;
}
.pay-sum {
  margin-top: 8px; font-size: 12px; color: #5ee6a8;
  &.bad { color: #ff8f95; }
}

/* 结算小票汇总条 */
.settle-bar {
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  margin: 6px 0 16px; padding: 14px 18px;
  border: 1px solid rgba(77, 208, 255, 0.35);
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(59, 169, 255, 0.12), rgba(13, 33, 63, 0.5));
  .sb-rows { display: flex; flex-wrap: wrap; gap: 8px 24px; }
  .sb-item {
    display: flex; flex-direction: column; gap: 3px;
    span { font-size: 12px; color: $sub; }
    b { font-size: 15px; font-weight: 600; color: $text; }
  }
  .sb-total {
    display: flex; flex-direction: column; align-items: flex-end; gap: 3px;
    span { font-size: 12px; color: $sub; }
    .amt {
      font-size: 26px; font-weight: 800; letter-spacing: 0.5px;
      background: linear-gradient(90deg, #f5a623, #ffd27a);
      -webkit-background-clip: text; background-clip: text; color: transparent;
    }
  }
}

/* 提交按钮 */
.submit-btn {
  min-width: 180px;
  background: linear-gradient(135deg, $accent2, $accent 45%, #1e6fff);
  border: none; color: #041224; font-weight: 700; letter-spacing: 1px;
  box-shadow: 0 0 18px rgba(59, 169, 255, 0.4);
  &:hover { filter: brightness(1.08); box-shadow: 0 0 26px rgba(77, 208, 255, 0.6); }
  &.is-disabled { filter: grayscale(0.4) brightness(0.8); box-shadow: none; }
}
.ghost-btn {
  background: rgba(8, 22, 44, 0.6); border: 1px solid $line; color: $sub;
  &:hover { color: $accent2; border-color: rgba(77, 208, 255, 0.5); }
}

/* ---------- 流水票据 ---------- */
.ticket-box {
  background: $panel;
  border: 1px solid $line;
  border-radius: 12px;
  padding: 12px 16px 16px;
  backdrop-filter: blur(10px);
}
.ticket-head {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;
  .th-title { display: inline-flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 600; color: $text; }
}
.tk-amt { color: #f5a623; font-weight: 600; }
:deep(.ticket-table) {
  .el-table, .el-table__expanded-cell { background: transparent; }
  --el-table-border-color: #{$line};
  --el-table-header-bg-color: rgba(59, 169, 255, 0.1);
  --el-table-tr-bg-color: transparent;
  --el-table-bg-color: transparent;
  --el-table-text-color: #{$text};
  --el-table-header-text-color: #{$sub};
  --el-table-row-hover-bg-color: rgba(59, 169, 255, 0.1);
  background: transparent;
  .el-table__empty-text { color: #5f7fa8; }
}

/* ---------- 表单控件深色化 ---------- */
:deep(.el-form-item__label) { color: $sub; }
:deep(.el-input__wrapper),
:deep(.el-select__wrapper) {
  background: rgba(8, 22, 44, 0.6);
  box-shadow: 0 0 0 1px $line inset;
}
:deep(.el-input__wrapper.is-focus),
:deep(.el-select__wrapper.is-focused) {
  box-shadow: 0 0 0 1px $accent2 inset, 0 0 12px rgba(77, 208, 255, 0.3);
}
:deep(.el-input__inner),
:deep(.el-select__placeholder),
:deep(.el-radio__label) { color: $text; }
:deep(.el-input.is-disabled .el-input__wrapper) { background: rgba(8, 22, 44, 0.35); }
:deep(.el-tabs__item) { color: $sub; font-size: 15px; &.is-active { color: $accent2; } }
:deep(.el-tabs__nav-wrap::after) { background: $line; }
:deep(.el-tabs__active-bar) { background: linear-gradient(90deg, $accent2, $accent); }
:deep(.search-input .el-input-group__append .el-button) {
  background: rgba(59, 169, 255, 0.18); border-color: $line; color: $accent2;
}
</style>
