import request from '@/utils/request'

// 门店列表
export function listStore(query) {
  return request({ url: '/hc/store/list', method: 'get', params: query })
}
export function getStore(storeId) {
  return request({ url: '/hc/store/' + storeId, method: 'get' })
}
export function addStore(data) {
  return request({ url: '/hc/store', method: 'post', data: data })
}
export function updateStore(data) {
  return request({ url: '/hc/store', method: 'put', data: data })
}
export function delStore(storeId) {
  return request({ url: '/hc/store/' + storeId, method: 'delete' })
}

// 技师列表（含下拉）
export function listTechnician(query) {
  return request({ url: '/hc/technician/list', method: 'get', params: query })
}
export function optionTechnician() {
  return request({ url: '/hc/technician/optionselect', method: 'get' })
}
export function getTechnician(id) {
  return request({ url: '/hc/technician/' + id, method: 'get' })
}
export function addTechnician(data) {
  return request({ url: '/hc/technician', method: 'post', data: data })
}
export function updateTechnician(data) {
  return request({ url: '/hc/technician', method: 'put', data: data })
}
export function delTechnician(id) {
  return request({ url: '/hc/technician/' + id, method: 'delete' })
}

// 卡项定义
export function listCardDef(query) {
  return request({ url: '/hc/carddef/list', method: 'get', params: query })
}
export function optionCardDef() {
  return request({ url: '/hc/carddef/optionselect', method: 'get' })
}
export function getCardDef(id) {
  return request({ url: '/hc/carddef/' + id, method: 'get' })
}
export function addCardDef(data) {
  return request({ url: '/hc/carddef', method: 'post', data: data })
}
export function updateCardDef(data) {
  return request({ url: '/hc/carddef', method: 'put', data: data })
}
export function delCardDef(id) {
  return request({ url: '/hc/carddef/' + id, method: 'delete' })
}
