import request from '@/utils/request'

// 财务看板汇总
export function financeSummary(query) {
  return request({ url: '/hc/report/financeSummary', method: 'get', params: query })
}
// 门店维度业绩
export function storePerformance(query) {
  return request({ url: '/hc/report/storePerformance', method: 'get', params: query })
}
// 技师维度提成汇总
export function technicianCommission(query) {
  return request({ url: '/hc/report/technicianCommission', method: 'get', params: query })
}
// 按项目汇总确认收入
export function revenueByItem(query) {
  return request({ url: '/hc/report/revenueByItem', method: 'get', params: query })
}
