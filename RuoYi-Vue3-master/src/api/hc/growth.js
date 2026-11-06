import request from '@/utils/request'

// 获客渠道码
export function listChannel(query) {
  return request({ url: '/hc/channel/list', method: 'get', params: query })
}
export function getChannel(channelId) {
  return request({ url: '/hc/channel/' + channelId, method: 'get' })
}
export function addChannel(data) {
  return request({ url: '/hc/channel', method: 'post', data: data })
}
export function updateChannel(data) {
  return request({ url: '/hc/channel', method: 'put', data: data })
}
export function delChannel(channelIds) {
  return request({ url: '/hc/channel/' + channelIds, method: 'delete' })
}
// 带参推广链接（可带老客手机号）
export function buildChannelLink(channelCode, refPhone) {
  return request({ url: '/hc/channel/link/' + channelCode, method: 'get', params: { refPhone: refPhone } })
}
// 扫码访问上报
export function reportChannelVisit(data) {
  return request({ url: '/hc/channel/visit', method: 'post', data: data })
}
// 渠道统计漏斗
export function channelStats(query) {
  return request({ url: '/hc/channel/stats', method: 'get', params: query })
}
export function listChannelVisit(query) {
  return request({ url: '/hc/channel/visits', method: 'get', params: query })
}

// 升单任务
export function listUpgradeTask(query) {
  return request({ url: '/hc/upgradetask/list', method: 'get', params: query })
}
export function getUpgradeTask(taskId) {
  return request({ url: '/hc/upgradetask/' + taskId, method: 'get' })
}
export function handleUpgradeTask(data) {
  return request({ url: '/hc/upgradetask/handle', method: 'put', data: data })
}
export function assignUpgradeTask(data) {
  return request({ url: '/hc/upgradetask/assign', method: 'put', data: data })
}

// 拼团活动
export function listGroupActivity(query) {
  return request({ url: '/hc/group/activity/list', method: 'get', params: query })
}
export function getGroupActivity(activityId) {
  return request({ url: '/hc/group/activity/' + activityId, method: 'get' })
}
export function addGroupActivity(data) {
  return request({ url: '/hc/group/activity', method: 'post', data: data })
}
export function updateGroupActivity(data) {
  return request({ url: '/hc/group/activity', method: 'put', data: data })
}
export function delGroupActivity(activityIds) {
  return request({ url: '/hc/group/activity/' + activityIds, method: 'delete' })
}
export function joinGroup(data) {
  return request({ url: '/hc/group/join', method: 'post', data: data })
}
export function closeExpiredGroup() {
  return request({ url: '/hc/group/closeExpired', method: 'post' })
}

// M8 活动下发 → 门店确认执行
export function listActivityStore(query) {
  return request({ url: '/hc/group/activityStores', method: 'get', params: query })
}
export function publishActivity(data) {
  return request({ url: '/hc/group/publish', method: 'post', data: data })
}
export function confirmActivityStore(data) {
  return request({ url: '/hc/group/confirmStore', method: 'put', data: data })
}

// 拼团记录
export function listGroupRecord(query) {
  return request({ url: '/hc/grouprecord/list', method: 'get', params: query })
}
export function getGroupRecord(recordId) {
  return request({ url: '/hc/grouprecord/' + recordId, method: 'get' })
}
export function cancelGroupJoin(recordId) {
  return request({ url: '/hc/grouprecord/cancel/' + recordId, method: 'put' })
}

// 老带新
export function listReferral(query) {
  return request({ url: '/hc/referral/list', method: 'get', params: query })
}
export function getReferral(referralId) {
  return request({ url: '/hc/referral/' + referralId, method: 'get' })
}
export function bindReferral(query) {
  return request({ url: '/hc/referral/bind', method: 'post', params: query })
}
export function rewardReferral(referralId) {
  return request({ url: '/hc/referral/reward/' + referralId, method: 'put' })
}
