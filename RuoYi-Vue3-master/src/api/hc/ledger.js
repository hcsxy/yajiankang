import request from '@/utils/request'

// 售卡订单
export function listOrder(query) {
  return request({ url: '/hc/ledger/order/list', method: 'get', params: query })
}
// 核销流水
export function listVerification(query) {
  return request({ url: '/hc/ledger/verification/list', method: 'get', params: query })
}
// 收入确认流水
export function listRevenue(query) {
  return request({ url: '/hc/ledger/revenue/list', method: 'get', params: query })
}
// 预收台账
export function listLedger(query) {
  return request({ url: '/hc/ledger/prepaid/list', method: 'get', params: query })
}
// 技师提成
export function listCommission(query) {
  return request({ url: '/hc/ledger/commission/list', method: 'get', params: query })
}
// 提成批量结算
export function settleCommission(ids) {
  return request({ url: '/hc/ledger/commission/settle', method: 'post', data: ids })
}

// 提成规则
export function listRule(query) {
  return request({ url: '/hc/commissionrule/list', method: 'get', params: query })
}
export function getRule(ruleId) {
  return request({ url: '/hc/commissionrule/' + ruleId, method: 'get' })
}
export function addRule(data) {
  return request({ url: '/hc/commissionrule', method: 'post', data: data })
}
export function updateRule(data) {
  return request({ url: '/hc/commissionrule', method: 'put', data: data })
}
export function delRule(ids) {
  return request({ url: '/hc/commissionrule/' + ids, method: 'delete' })
}
