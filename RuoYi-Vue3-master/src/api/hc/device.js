import request from '@/utils/request'

// 设备档案
export function listDevice(query) {
  return request({ url: '/hc/device/list', method: 'get', params: query })
}
export function deviceOptions() {
  return request({ url: '/hc/device/options', method: 'get' })
}
export function getDevice(deviceId) {
  return request({ url: '/hc/device/' + deviceId, method: 'get' })
}
export function addDevice(data) {
  return request({ url: '/hc/device', method: 'post', data: data })
}
export function updateDevice(data) {
  return request({ url: '/hc/device', method: 'put', data: data })
}
export function delDevice(ids) {
  return request({ url: '/hc/device/' + ids, method: 'delete' })
}

// 扫码与使用登记
export function scanDevice(deviceCode) {
  return request({ url: '/hc/device/scan/' + deviceCode, method: 'get' })
}
export function listDeviceUse(query) {
  return request({ url: '/hc/device/use/list', method: 'get', params: query })
}
export function startDeviceUse(data) {
  return request({ url: '/hc/device/use/start', method: 'post', data: data })
}
export function endDeviceUse(useId, deviceCode) {
  return request({ url: '/hc/device/use/end', method: 'put', params: { useId: useId, deviceCode: deviceCode } })
}

// 维保
export function listMaintain(query) {
  return request({ url: '/hc/device/maintain/list', method: 'get', params: query })
}
export function addMaintain(data) {
  return request({ url: '/hc/device/maintain', method: 'post', data: data })
}
export function delMaintain(ids) {
  return request({ url: '/hc/device/maintain/' + ids, method: 'delete' })
}

// 跨店借用
export function listTransfer(query) {
  return request({ url: '/hc/device/transfer/list', method: 'get', params: query })
}
export function addTransfer(data) {
  return request({ url: '/hc/device/transfer', method: 'post', data: data })
}
export function returnTransfer(transferId) {
  return request({ url: '/hc/device/transfer/return/' + transferId, method: 'put' })
}

// 设备产出
export function deviceOutput(query) {
  return request({ url: '/hc/device/output', method: 'get', params: query })
}
