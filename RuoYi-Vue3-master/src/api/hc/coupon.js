import request from '@/utils/request'

// 优惠券定义
export function listCoupon(query) {
  return request({ url: '/hc/coupon/list', method: 'get', params: query })
}
export function getCoupon(couponId) {
  return request({ url: '/hc/coupon/' + couponId, method: 'get' })
}
export function addCoupon(data) {
  return request({ url: '/hc/coupon', method: 'post', data: data })
}
export function updateCoupon(data) {
  return request({ url: '/hc/coupon', method: 'put', data: data })
}
export function delCoupon(couponId) {
  return request({ url: '/hc/coupon/' + couponId, method: 'delete' })
}
export function sendableCoupons() {
  return request({ url: '/hc/coupon/sendable', method: 'get' })
}
// data: [{couponId, customerId, sendStoreId}]
export function sendCoupon(data) {
  return request({ url: '/hc/coupon/send', method: 'post', data: data })
}

// 领券记录
export function listCouponRecord(query) {
  return request({ url: '/hc/couponrecord/list', method: 'get', params: query })
}
export function getCouponRecord(recordId) {
  return request({ url: '/hc/couponrecord/' + recordId, method: 'get' })
}
export function usableCoupons(customerId) {
  return request({ url: '/hc/couponrecord/usable/' + customerId, method: 'get' })
}
export function invalidCouponRecord(recordId) {
  return request({ url: '/hc/couponrecord/invalid/' + recordId, method: 'put' })
}
