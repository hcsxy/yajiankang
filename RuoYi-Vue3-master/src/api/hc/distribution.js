import request from '@/utils/request'

// ==================== 区域管理 ====================
export function listRegion(query) {
  return request({ url: '/hc/region/list', method: 'get', params: query })
}
export function regionTree(query) {
  return request({ url: '/hc/region/tree', method: 'get', params: query })
}
export function regionOptions() {
  return request({ url: '/hc/region/optionSelect', method: 'get' })
}
export function getRegion(regionId) {
  return request({ url: '/hc/region/' + regionId, method: 'get' })
}
export function addRegion(data) {
  return request({ url: '/hc/region', method: 'post', data: data })
}
export function updateRegion(data) {
  return request({ url: '/hc/region', method: 'put', data: data })
}
export function delRegion(ids) {
  return request({ url: '/hc/region/' + ids, method: 'delete' })
}

// ==================== 分销员 ====================
export function listDistributor(query) {
  return request({ url: '/hc/distributor/list', method: 'get', params: query })
}
export function getDistributor(distributorId) {
  return request({ url: '/hc/distributor/' + distributorId, method: 'get' })
}
export function getDistributorByCode(inviteCode) {
  return request({ url: '/hc/distributor/code/' + inviteCode, method: 'get' })
}
export function addDistributor(data) {
  return request({ url: '/hc/distributor', method: 'post', data: data })
}
export function updateDistributor(data) {
  return request({ url: '/hc/distributor', method: 'put', data: data })
}
export function delDistributor(ids) {
  return request({ url: '/hc/distributor/' + ids, method: 'delete' })
}

// ==================== 分销佣金规则 ====================
export function listDistRule(query) {
  return request({ url: '/hc/distRule/list', method: 'get', params: query })
}
export function getDistRule(ruleId) {
  return request({ url: '/hc/distRule/' + ruleId, method: 'get' })
}
export function matchDistRule(query) {
  return request({ url: '/hc/distRule/match', method: 'get', params: query })
}
export function addDistRule(data) {
  return request({ url: '/hc/distRule', method: 'post', data: data })
}
export function updateDistRule(data) {
  return request({ url: '/hc/distRule', method: 'put', data: data })
}
export function delDistRule(ids) {
  return request({ url: '/hc/distRule/' + ids, method: 'delete' })
}

// ==================== 分销佣金 ====================
export function listDistCommission(query) {
  return request({ url: '/hc/distCommission/list', method: 'get', params: query })
}
export function distCommissionSummary(query) {
  return request({ url: '/hc/distCommission/summary', method: 'get', params: query })
}
export function getDistCommission(commissionId) {
  return request({ url: '/hc/distCommission/' + commissionId, method: 'get' })
}
export function addDistCommission(data) {
  return request({ url: '/hc/distCommission', method: 'post', data: data })
}
export function updateDistCommission(data) {
  return request({ url: '/hc/distCommission', method: 'put', data: data })
}
export function settleDistCommission(ids) {
  return request({ url: '/hc/distCommission/settle/' + ids, method: 'put' })
}
export function voidDistCommissionByOrder(orderId) {
  return request({ url: '/hc/distCommission/voidOrder/' + orderId, method: 'delete' })
}
export function delDistCommission(ids) {
  return request({ url: '/hc/distCommission/' + ids, method: 'delete' })
}
