import request from '@/utils/request'

// 商品/耗材主数据
export function listProduct(query) {
  return request({ url: '/hc/product/list', method: 'get', params: query })
}
export function optionProduct() {
  return request({ url: '/hc/product/options', method: 'get' })
}
export function getProduct(productId) {
  return request({ url: '/hc/product/' + productId, method: 'get' })
}
export function addProduct(data) {
  return request({ url: '/hc/product', method: 'post', data: data })
}
export function updateProduct(data) {
  return request({ url: '/hc/product', method: 'put', data: data })
}
export function delProduct(productIds) {
  return request({ url: '/hc/product/' + productIds, method: 'delete' })
}

// 库存台账 / 批次 / 流水 / 预警
export function listInventory(query) {
  return request({ url: '/hc/inventory/list', method: 'get', params: query })
}
export function listStockBatch(query) {
  return request({ url: '/hc/inventory/batch/list', method: 'get', params: query })
}
export function listInventoryRecord(query) {
  return request({ url: '/hc/inventory/record/list', method: 'get', params: query })
}
export function safetyWarnings(query) {
  return request({ url: '/hc/inventory/safetyWarnings', method: 'get', params: query })
}
export function expiryWarnings(query) {
  return request({ url: '/hc/inventory/expiryWarnings', method: 'get', params: query })
}
export function runStockWarning() {
  return request({ url: '/hc/inventory/stockWarning', method: 'post' })
}
// 零售出库（确认收入与成本）
export function retailOut(data) {
  return request({ url: '/hc/inventory/retail', method: 'post', data: data })
}

// 出入库单据
export function listStockBill(query) {
  return request({ url: '/hc/stockbill/list', method: 'get', params: query })
}
export function getStockBill(billId) {
  return request({ url: '/hc/stockbill/' + billId, method: 'get' })
}
export function addStockBill(data) {
  return request({ url: '/hc/stockbill', method: 'post', data: data })
}
export function updateStockBill(data) {
  return request({ url: '/hc/stockbill', method: 'put', data: data })
}
export function delStockBill(billIds) {
  return request({ url: '/hc/stockbill/' + billIds, method: 'delete' })
}
export function submitStockBill(billId) {
  return request({ url: '/hc/stockbill/submit/' + billId, method: 'post' })
}
export function approveStockBill(billId, approveRemark) {
  return request({ url: '/hc/stockbill/approve/' + billId, method: 'post', params: { approveRemark: approveRemark } })
}
export function rejectStockBill(billId, approveRemark) {
  return request({ url: '/hc/stockbill/reject/' + billId, method: 'post', params: { approveRemark: approveRemark } })
}
export function receiveStockBill(billId) {
  return request({ url: '/hc/stockbill/receive/' + billId, method: 'post' })
}
export function cancelStockBill(billId) {
  return request({ url: '/hc/stockbill/cancel/' + billId, method: 'post' })
}

// 高值耗材追溯
export function listConsumableTrace(query) {
  return request({ url: '/hc/consumabletrace/list', method: 'get', params: query })
}

// M8 损耗报表：报损出库单按 月份+门店+商品 汇总
export function lossReportStock(query) {
  return request({ url: '/hc/stockbill/lossReport', method: 'get', params: query })
}
