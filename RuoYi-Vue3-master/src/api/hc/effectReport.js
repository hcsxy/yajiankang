import request from '@/utils/request'

// 效果报告与续费（M6）
export function listReport(query) {
  return request({ url: '/hc/effectReport/list', method: 'get', params: query })
}
export function reportSummary(query) {
  return request({ url: '/hc/effectReport/summary', method: 'get', params: query })
}
export function getEffectReport(customerId, assessmentId) {
  return request({ url: '/hc/effectReport/' + customerId, method: 'get', params: { assessmentId: assessmentId } })
}
export function listSuggestTemplates(constitution) {
  return request({ url: '/hc/effectReport/templates', method: 'get', params: { constitution: constitution } })
}
export function renewPlan(data) {
  return request({ url: '/hc/effectReport/renew', method: 'post', data: data })
}
export function pushReport(assessmentId) {
  return request({ url: '/hc/effectReport/push/' + assessmentId, method: 'put' })
}
