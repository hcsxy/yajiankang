import request from '@/utils/request'

// 支付渠道对账
export function listBatch(query) {
  return request({ url: '/hc/reconcile/batch/list', method: 'get', params: query })
}
export function getBatch(batchId) {
  return request({ url: '/hc/reconcile/batch/' + batchId, method: 'get' })
}
export function reconcileSummary(query) {
  return request({ url: '/hc/reconcile/summary', method: 'get', params: query })
}
export function importBatch(data) {
  return request({ url: '/hc/reconcile/batch', method: 'post', data: data })
}
export function delBatch(batchId) {
  return request({ url: '/hc/reconcile/batch/' + batchId, method: 'delete' })
}
export function listRecord(query) {
  return request({ url: '/hc/reconcile/record/list', method: 'get', params: query })
}
export function handleRecord(data) {
  return request({ url: '/hc/reconcile/record/handle', method: 'put', data: data })
}
