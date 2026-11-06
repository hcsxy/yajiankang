import request from '@/utils/request'

// 发票台账
export function listInvoice(query) {
  return request({ url: '/hc/invoice/list', method: 'get', params: query })
}
export function invoiceSummary(query) {
  return request({ url: '/hc/invoice/summary', method: 'get', params: query })
}
export function getInvoice(invoiceId) {
  return request({ url: '/hc/invoice/' + invoiceId, method: 'get' })
}
export function addInvoice(data) {
  return request({ url: '/hc/invoice', method: 'post', data: data })
}
export function issueInvoice(data) {
  return request({ url: '/hc/invoice/issue', method: 'put', data: data })
}
export function redInvoice(data) {
  return request({ url: '/hc/invoice/red', method: 'put', data: data })
}
export function cancelInvoice(invoiceId) {
  return request({ url: '/hc/invoice/cancel/' + invoiceId, method: 'put' })
}
export function delInvoice(ids) {
  return request({ url: '/hc/invoice/' + ids, method: 'delete' })
}
