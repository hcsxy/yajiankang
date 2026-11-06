import request from '@/utils/request'

// 积分流水
export function listPoints(query) {
  return request({ url: '/hc/points/list', method: 'get', params: query })
}
export function getPoints(recordId) {
  return request({ url: '/hc/points/' + recordId, method: 'get' })
}
export function checkIn(data) {
  return request({ url: '/hc/points/checkIn', method: 'post', data: data })
}
export function adjustPoints(data) {
  return request({ url: '/hc/points/adjust', method: 'post', data: data })
}
export function referralPoints(data) {
  return request({ url: '/hc/points/referral', method: 'post', data: data })
}

// 会员等级规则
export function listLevelRule(query) {
  return request({ url: '/hc/levelrule/list', method: 'get', params: query })
}
export function getLevelRule(ruleId) {
  return request({ url: '/hc/levelrule/' + ruleId, method: 'get' })
}
export function addLevelRule(data) {
  return request({ url: '/hc/levelrule', method: 'post', data: data })
}
export function updateLevelRule(data) {
  return request({ url: '/hc/levelrule', method: 'put', data: data })
}
export function delLevelRule(ruleId) {
  return request({ url: '/hc/levelrule/' + ruleId, method: 'delete' })
}
export function refreshLevel() {
  return request({ url: '/hc/levelrule/refresh', method: 'post' })
}
