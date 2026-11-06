import request from '@/utils/request'

// 总部经营板
export function boardTotal(query) {
  return request({ url: '/hc/board/total', method: 'get', params: query })
}

// 门店运营板
export function boardStore(query) {
  return request({ url: '/hc/board/store', method: 'get', params: query })
}

// 财务资金板
export function boardFinance(query) {
  return request({ url: '/hc/board/finance', method: 'get', params: query })
}
