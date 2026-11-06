import request from '@/utils/request'

// 客户档案
export function listCustomer(query) {
  return request({ url: '/hc/customer/list', method: 'get', params: query })
}
export function getCustomer(customerId) {
  return request({ url: '/hc/customer/' + customerId, method: 'get' })
}
export function addCustomer(data) {
  return request({ url: '/hc/customer', method: 'post', data: data })
}
export function updateCustomer(data) {
  return request({ url: '/hc/customer', method: 'put', data: data })
}
export function delCustomer(customerId) {
  return request({ url: '/hc/customer/' + customerId, method: 'delete' })
}

// 会员卡与核心业务链
export function listCard(query) {
  return request({ url: '/hc/membercard/list', method: 'get', params: query })
}
export function getCard(cardId) {
  return request({ url: '/hc/membercard/' + cardId, method: 'get' })
}
export function usableCard(customerId) {
  return request({ url: '/hc/membercard/usable/' + customerId, method: 'get' })
}
// 售卡开卡（订单+开卡+预收+提成一体）
export function sellCard(data, saleTechnicianId) {
  return request({ url: '/hc/membercard/sell', method: 'post', params: { saleTechnicianId }, data: data })
}
// 核销
export function verifyCard(data) {
  return request({ url: '/hc/membercard/verify', method: 'post', data: data })
}
// 撤销核销（必须留痕原因）
export function revertVerify(verifyId, reason) {
  return request({ url: '/hc/membercard/revert/' + verifyId, method: 'put', params: { reason } })
}
// 申请退款
export function applyRefund(data) {
  return request({ url: '/hc/membercard/refund', method: 'post', data: data })
}

// 退款管理
export function listRefund(query) {
  return request({ url: '/hc/refund/list', method: 'get', params: query })
}
export function auditRefund(refundId, pass) {
  return request({ url: '/hc/refund/audit/' + refundId, method: 'put', params: { pass } })
}
