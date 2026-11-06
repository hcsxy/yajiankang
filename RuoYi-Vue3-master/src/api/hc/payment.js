import request from '@/utils/request'

// 支付流水列表（多渠道/组合收款）
export function listPayment(query) {
  return request({ url: '/hc/payment/list', method: 'get', params: query })
}
export function getPayment(paymentId) {
  return request({ url: '/hc/payment/' + paymentId, method: 'get' })
}
// 按订单号查收款明细
export function listPaymentByOrder(orderNo) {
  return request({ url: '/hc/payment/order/' + orderNo, method: 'get' })
}
// 单笔流水退款
export function refundPayment(paymentId) {
  return request({ url: '/hc/payment/refund/' + paymentId, method: 'put' })
}
