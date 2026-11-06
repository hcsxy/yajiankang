import request from '@/utils/request'

// 客户评价
export function listReview(query) {
  return request({ url: '/hc/review/list', method: 'get', params: query })
}
export function reviewSummary(query) {
  return request({ url: '/hc/review/summary', method: 'get', params: query })
}
export function getReview(reviewId) {
  return request({ url: '/hc/review/' + reviewId, method: 'get' })
}
export function addReview(data) {
  return request({ url: '/hc/review', method: 'post', data: data })
}
export function updateReview(data) {
  return request({ url: '/hc/review', method: 'put', data: data })
}
export function replyReview(data) {
  return request({ url: '/hc/review/reply', method: 'put', data: data })
}
export function delReview(ids) {
  return request({ url: '/hc/review/' + ids, method: 'delete' })
}

// 技师绩效
export function listPerformance(query) {
  return request({ url: '/hc/performance/list', method: 'get', params: query })
}
