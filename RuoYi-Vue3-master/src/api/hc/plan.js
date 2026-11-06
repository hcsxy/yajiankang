import request from '@/utils/request'

// 调理方案
export function listPlan(query) {
  return request({ url: '/hc/plan/list', method: 'get', params: query })
}
export function getPlan(planId) {
  return request({ url: '/hc/plan/' + planId, method: 'get' })
}
export function addPlan(data) {
  return request({ url: '/hc/plan', method: 'post', data: data })
}
export function updatePlan(data) {
  return request({ url: '/hc/plan', method: 'put', data: data })
}
export function confirmPlan(planId) {
  return request({ url: '/hc/plan/confirm/' + planId, method: 'put' })
}
export function adjustPlan(data) {
  return request({ url: '/hc/plan/adjust', method: 'post', data: data })
}
export function reassessDone(planId) {
  return request({ url: '/hc/plan/reassessDone/' + planId, method: 'put' })
}
export function reassessTodo(query) {
  return request({ url: '/hc/plan/reassessTodo', method: 'get', params: query })
}
export function delPlan(ids) {
  return request({ url: '/hc/plan/' + ids, method: 'delete' })
}

// 方案模板
export function listTemplate(query) {
  return request({ url: '/hc/plantemplate/list', method: 'get', params: query })
}
export function optionTemplate() {
  return request({ url: '/hc/plantemplate/optionselect', method: 'get' })
}
export function getTemplate(id) {
  return request({ url: '/hc/plantemplate/' + id, method: 'get' })
}
export function addTemplate(data) {
  return request({ url: '/hc/plantemplate', method: 'post', data: data })
}
export function updateTemplate(data) {
  return request({ url: '/hc/plantemplate', method: 'put', data: data })
}
export function delTemplate(ids) {
  return request({ url: '/hc/plantemplate/' + ids, method: 'delete' })
}
