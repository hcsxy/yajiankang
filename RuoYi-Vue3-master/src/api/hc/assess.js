import request from '@/utils/request'

// 健康评估/体质辨识
export function listAssess(query) {
  return request({ url: '/hc/assessment/list', method: 'get', params: query })
}
export function getAssess(assessmentId) {
  return request({ url: '/hc/assessment/' + assessmentId, method: 'get' })
}
export function addAssess(data) {
  return request({ url: '/hc/assessment', method: 'post', data: data })
}
export function updateAssess(data) {
  return request({ url: '/hc/assessment', method: 'put', data: data })
}
export function delAssess(ids) {
  return request({ url: '/hc/assessment/' + ids, method: 'delete' })
}
// 客户评估轨迹（初评+历次复评对比）
export function trackAssess(customerId) {
  return request({ url: '/hc/assessment/track/' + customerId, method: 'get' })
}
