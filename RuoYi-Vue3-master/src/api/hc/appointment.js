import request from '@/utils/request'

// 预约管理
export function listAppointment(query) {
  return request({ url: '/hc/appointment/list', method: 'get', params: query })
}
export function getAppointment(appointId) {
  return request({ url: '/hc/appointment/' + appointId, method: 'get' })
}
export function addAppointment(data) {
  return request({ url: '/hc/appointment', method: 'post', data: data })
}
export function updateAppointment(data) {
  return request({ url: '/hc/appointment', method: 'put', data: data })
}
export function delAppointment(ids) {
  return request({ url: '/hc/appointment/' + ids, method: 'delete' })
}
