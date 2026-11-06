import request from '@/utils/request'

// 消息中心
export function listMessage(query) {
  return request({ url: '/hc/message/list', method: 'get', params: query })
}
export function getMessage(messageId) {
  return request({ url: '/hc/message/' + messageId, method: 'get' })
}
export function sendMessage(data) {
  return request({ url: '/hc/message/send', method: 'post', data: data })
}
export function readMessage(messageIds) {
  return request({ url: '/hc/message/read/' + messageIds, method: 'put' })
}
export function delMessage(messageIds) {
  return request({ url: '/hc/message/' + messageIds, method: 'delete' })
}
