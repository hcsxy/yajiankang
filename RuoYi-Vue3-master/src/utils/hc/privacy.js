/**
 * 敏感信息前端校验辅助
 *
 * 后端对无“敏感信息明文”权限的账号返回脱敏值（如 138****8000），
 * 编辑表单原样回显后仍会提交，后端会自动忽略带掩码的字段；
 * 因此前端校验需要放行掩码值，只校验完整号码。
 */

/** 是否为脱敏掩码值 */
export function isMasked(value) {
  return typeof value === 'string' && value.indexOf('*') >= 0
}

/**
 * 生成校验器：允许掩码值原样通过，否则按正则校验
 * @param {RegExp} regexp 明文格式正则
 */
export function plainOrMasked(regexp) {
  return (rule, value, callback) => {
    if (!value) return callback()
    if (isMasked(value) || regexp.test(value)) return callback()
    callback(new Error(rule.message))
  }
}

export default { isMasked, plainOrMasked }
