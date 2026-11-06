import request from '@/utils/request'

// 分账规则
export function listSplitRule(query) {
  return request({ url: '/hc/splitRule/list', method: 'get', params: query })
}
export function getSplitRule(ruleId) {
  return request({ url: '/hc/splitRule/' + ruleId, method: 'get' })
}
export function addSplitRule(data) {
  return request({ url: '/hc/splitRule', method: 'post', data: data })
}
export function updateSplitRule(data) {
  return request({ url: '/hc/splitRule', method: 'put', data: data })
}
export function delSplitRule(ids) {
  return request({ url: '/hc/splitRule/' + ids, method: 'delete' })
}

// 分账单
export function listSplitBill(query) {
  return request({ url: '/hc/splitBill/list', method: 'get', params: query })
}
export function getSplitBill(splitId) {
  return request({ url: '/hc/splitBill/' + splitId, method: 'get' })
}
export function recalcSplit(data) {
  return request({ url: '/hc/splitBill/recalc', method: 'put', data: data })
}
export function voidSplit(data) {
  return request({ url: '/hc/splitBill/void', method: 'put', data: data })
}
export function delSplitBill(ids) {
  return request({ url: '/hc/splitBill/' + ids, method: 'delete' })
}

// 分账结算单
export function listSettlement(query) {
  return request({ url: '/hc/settlement/list', method: 'get', params: query })
}
export function getSettlement(settleId) {
  return request({ url: '/hc/settlement/' + settleId, method: 'get' })
}
export function previewSettlement(query) {
  return request({ url: '/hc/settlement/preview', method: 'get', params: query })
}
export function addSettlement(data) {
  return request({ url: '/hc/settlement', method: 'post', data: data })
}
export function confirmSettlement(settleId) {
  return request({ url: '/hc/settlement/confirm/' + settleId, method: 'put' })
}
export function cancelSettlement(settleId) {
  return request({ url: '/hc/settlement/cancel/' + settleId, method: 'put' })
}
export function delSettlement(ids) {
  return request({ url: '/hc/settlement/' + ids, method: 'delete' })
}
