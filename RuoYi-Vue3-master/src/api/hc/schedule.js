import request from '@/utils/request'

// 技师排班
export function listSchedule(query) {
  return request({ url: '/hc/schedule/list', method: 'get', params: query })
}
export function getSchedule(scheduleId) {
  return request({ url: '/hc/schedule/' + scheduleId, method: 'get' })
}
export function addSchedule(data) {
  return request({ url: '/hc/schedule', method: 'post', data: data })
}
export function updateSchedule(data) {
  return request({ url: '/hc/schedule', method: 'put', data: data })
}
export function delSchedule(ids) {
  return request({ url: '/hc/schedule/' + ids, method: 'delete' })
}
// 批量周排班：data 为班次模板，params 携带区间与星期
export function batchSchedule(data, params) {
  return request({ url: '/hc/schedule/batch', method: 'post', data: data, params: params })
}
