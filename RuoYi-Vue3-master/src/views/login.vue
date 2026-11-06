<template>
  <div class="login">
    <!-- 科技背景：渐变底 + 网格 + 光晕 + 粒子 + 扫描线 -->
    <div class="tech-bg">
      <div class="grid-layer"></div>
      <span class="glow glow-a"></span>
      <span class="glow glow-b"></span>
      <span class="glow glow-c"></span>
      <div class="particles">
        <span v-for="n in 14" :key="n" class="dot" :class="'d' + n"></span>
      </div>
      <div class="scan-line"></div>
    </div>

    <el-form ref="loginRef" :model="loginForm" :rules="loginRules" class="login-form">
      <!-- 品牌区 -->
      <div class="brand">
        <div class="logo-ring">
          <img src="@/assets/logo/logo.png" class="logo-img" alt="logo" />
        </div>
        <h3 class="title">{{ title }}</h3>
        <p class="subtitle">SMART HEALTHCARE · 智慧调理管理平台</p>
      </div>

      <el-form-item prop="username">
        <el-input
          v-model="loginForm.username"
          type="text"
          size="large"
          auto-complete="off"
          placeholder="账号"
        >
          <template #prefix><svg-icon icon-class="user" class="el-input__icon input-icon" /></template>
        </el-input>
      </el-form-item>
      <el-form-item prop="password">
        <el-input
          v-model="loginForm.password"
          type="password"
          size="large"
          auto-complete="off"
          placeholder="密码"
          show-password
          @keyup.enter="handleLogin"
        >
          <template #prefix><svg-icon icon-class="password" class="el-input__icon input-icon" /></template>
        </el-input>
      </el-form-item>
      <el-form-item prop="code" v-if="captchaEnabled">
        <el-input
          v-model="loginForm.code"
          size="large"
          auto-complete="off"
          placeholder="验证码"
          style="width: 63%"
          @keyup.enter="handleLogin"
        >
          <template #prefix><svg-icon icon-class="validCode" class="el-input__icon input-icon" /></template>
        </el-input>
        <div class="login-code">
          <img :src="codeUrl" @click="getCode" class="login-code-img"/>
        </div>
      </el-form-item>
      <el-checkbox v-model="loginForm.rememberMe" class="remember-check">记住密码</el-checkbox>
      <el-form-item style="width:100%;">
        <el-button
          :loading="loading"
          size="large"
          type="primary"
          class="login-btn"
          @click.prevent="handleLogin"
        >
          <span v-if="!loading">登 录</span>
          <span v-else>登 录 中...</span>
        </el-button>
        <div style="float: right;" v-if="register">
          <router-link class="link-type reg-link" :to="'/register'">立即注册</router-link>
        </div>
      </el-form-item>
    </el-form>
    <!--  底部  -->
    <div class="el-login-footer">
      <span>{{ footerContent }}</span>
    </div>
  </div>
</template>

<script setup>
import { getCodeImg } from "@/api/login"
import Cookies from "js-cookie"
import { encrypt, decrypt } from "@/utils/jsencrypt"
import useUserStore from '@/store/modules/user'
import defaultSettings from '@/settings'

const title = import.meta.env.VITE_APP_TITLE
const footerContent = defaultSettings.footerContent
const userStore = useUserStore()
const route = useRoute()
const router = useRouter()
const { proxy } = getCurrentInstance()

const loginForm = ref({
  username: "admin",
  password: "admin123",
  rememberMe: false,
  code: "",
  uuid: ""
})

const loginRules = {
  username: [{ required: true, trigger: "blur", message: "请输入您的账号" }],
  password: [{ required: true, trigger: "blur", message: "请输入您的密码" }],
  code: [{ required: true, trigger: "change", message: "请输入验证码" }]
}

const codeUrl = ref("")
const loading = ref(false)
// 验证码开关
const captchaEnabled = ref(true)
// 注册开关
const register = ref(false)
const redirect = ref(undefined)

watch(route, (newRoute) => {
    redirect.value = newRoute.query && newRoute.query.redirect
}, { immediate: true })

function handleLogin() {
  proxy.$refs.loginRef.validate(valid => {
    if (valid) {
      loading.value = true
      // 勾选了需要记住密码设置在 cookie 中设置记住用户名和密码
      if (loginForm.value.rememberMe) {
        Cookies.set("username", loginForm.value.username, { expires: 30 })
        Cookies.set("password", encrypt(loginForm.value.password), { expires: 30 })
        Cookies.set("rememberMe", loginForm.value.rememberMe, { expires: 30 })
      } else {
        // 否则移除
        Cookies.remove("username")
        Cookies.remove("password")
        Cookies.remove("rememberMe")
      }
      // 调用action的登录方法
      userStore.login(loginForm.value).then(() => {
        const query = route.query
        const otherQueryParams = Object.keys(query).reduce((acc, cur) => {
          if (cur !== "redirect") {
            acc[cur] = query[cur]
          }
          return acc
        }, {})
        router.push({ path: redirect.value || "/", query: otherQueryParams })
      }).catch(() => {
        loading.value = false
        // 重新获取验证码
        if (captchaEnabled.value) {
          getCode()
        }
      })
    }
  })
}

function getCode() {
  getCodeImg().then(res => {
    captchaEnabled.value = res.captchaEnabled === undefined ? true : res.captchaEnabled
    if (captchaEnabled.value) {
      codeUrl.value = "data:image/gif;base64," + res.img
      loginForm.value.uuid = res.uuid
    }
  })
}

function getCookie() {
  const username = Cookies.get("username")
  const password = Cookies.get("password")
  const rememberMe = Cookies.get("rememberMe")
  loginForm.value = {
    username: username === undefined ? loginForm.value.username : username,
    password: password === undefined ? loginForm.value.password : decrypt(password),
    rememberMe: rememberMe === undefined ? false : Boolean(rememberMe)
  }
}

getCode()
getCookie()
</script>

<style lang='scss' scoped>
$accent: #3ba9ff;
$accent2: #4dd0ff;
$text-main: #e6f2ff;

.login {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  overflow: hidden;
  background: linear-gradient(150deg, #050b1a 0%, #0a1c3a 50%, #061325 100%);
}

/* ===== 科技背景层 ===== */
.tech-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}
.grid-layer {
  position: absolute;
  inset: -2px;
  background-image:
    linear-gradient(rgba(59, 169, 255, 0.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(59, 169, 255, 0.07) 1px, transparent 1px);
  background-size: 46px 46px;
  mask-image: radial-gradient(circle at 50% 45%, #000 30%, transparent 85%);
  -webkit-mask-image: radial-gradient(circle at 50% 45%, #000 30%, transparent 85%);
  animation: gridMove 22s linear infinite;
}
@keyframes gridMove {
  from { background-position: 0 0, 0 0; }
  to { background-position: 46px 46px, 46px 46px; }
}
.glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  opacity: 0.8;
}
.glow-a {
  width: 520px; height: 520px; top: -160px; left: -120px;
  background: radial-gradient(circle, rgba(30, 111, 255, 0.5), transparent 70%);
  animation: breathe 9s ease-in-out infinite;
}
.glow-b {
  width: 480px; height: 480px; bottom: -180px; right: -100px;
  background: radial-gradient(circle, rgba(77, 208, 255, 0.35), transparent 70%);
  animation: breathe 11s ease-in-out infinite reverse;
}
.glow-c {
  width: 360px; height: 360px; top: 40%; right: 22%;
  background: radial-gradient(circle, rgba(90, 140, 255, 0.28), transparent 70%);
  animation: breathe 13s ease-in-out infinite;
}
@keyframes breathe {
  0%, 100% { opacity: 0.55; transform: scale(1); }
  50% { opacity: 0.95; transform: scale(1.18); }
}
.particles .dot {
  position: absolute;
  bottom: -20px;
  width: 6px; height: 6px;
  border-radius: 50%;
  background: rgba(120, 200, 255, 0.75);
  box-shadow: 0 0 10px rgba(120, 200, 255, 0.9);
  animation: rise linear infinite;
}
.d1 { left: 8%;  animation-duration: 12s; animation-delay: 0s;   }
.d2 { left: 16%; width: 4px; height: 4px; animation-duration: 15s; animation-delay: 2s; }
.d3 { left: 26%; animation-duration: 11s; animation-delay: 4s;   }
.d4 { left: 34%; width: 5px; height: 5px; animation-duration: 14s; animation-delay: 1s; }
.d5 { left: 45%; animation-duration: 13s; animation-delay: 5s;   }
.d6 { left: 53%; width: 3px; height: 3px; animation-duration: 16s; animation-delay: 3s; }
.d7 { left: 62%; animation-duration: 12s; animation-delay: 6s;   }
.d8 { left: 70%; width: 5px; height: 5px; animation-duration: 15s; animation-delay: 0.5s; }
.d9 { left: 78%; animation-duration: 10s; animation-delay: 2.5s; }
.d10 { left: 85%; width: 4px; height: 4px; animation-duration: 17s; animation-delay: 4.5s; }
.d11 { left: 22%; animation-duration: 13s; animation-delay: 7s;  }
.d12 { left: 40%; width: 3px; height: 3px; animation-duration: 18s; animation-delay: 1.5s; }
.d13 { left: 58%; animation-duration: 14s; animation-delay: 3.5s; }
.d14 { left: 90%; width: 5px; height: 5px; animation-duration: 12s; animation-delay: 5.5s; }
@keyframes rise {
  0%   { transform: translateY(0); opacity: 0; }
  10%  { opacity: 1; }
  90%  { opacity: 0.6; }
  100% { transform: translateY(-108vh); opacity: 0; }
}
.scan-line {
  position: absolute;
  left: 0; right: 0; top: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(77, 208, 255, 0.6), transparent);
  animation: scan 7s ease-in-out infinite;
}
@keyframes scan {
  0%, 100% { transform: translateY(0); opacity: 0; }
  10% { opacity: 0.8; }
  50% { transform: translateY(100vh); opacity: 0.3; }
  90% { opacity: 0; }
}

/* ===== 登录卡片（毛玻璃）===== */
.title {
  margin: 4px auto 0 auto;
  text-align: center;
  color: $text-main;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 3px;
  text-shadow: 0 0 18px rgba(77, 208, 255, 0.55);
}
.brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 26px;
}
.logo-ring {
  width: 72px;
  height: 72px;
  border-radius: 20px;
  padding: 3px;
  background: conic-gradient(from 180deg, rgba(77, 208, 255, 0.9), rgba(30, 111, 255, 0.85), rgba(120, 180, 255, 0.9), rgba(77, 208, 255, 0.9));
  box-shadow: 0 0 30px rgba(59, 169, 255, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: logoPulse 3.6s ease-in-out infinite;
}
@keyframes logoPulse {
  0%, 100% { box-shadow: 0 0 22px rgba(59, 169, 255, 0.45); }
  50%      { box-shadow: 0 0 40px rgba(77, 208, 255, 0.8); }
}
.logo-img {
  width: 60px;
  height: 60px;
  border-radius: 15px;
  padding: 4px;
  box-sizing: border-box;
  background: transparent;
  object-fit: contain;
}
.subtitle {
  margin: 12px 0 0;
  font-size: 12px;
  letter-spacing: 2px;
  color: rgba(150, 200, 240, 0.7);
}

.login-form {
  position: relative;
  z-index: 1;
  width: 420px;
  padding: 38px 32px 12px;
  border-radius: 18px;
  background: rgba(13, 33, 63, 0.55);
  border: 1px solid rgba(90, 160, 255, 0.25);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45), inset 0 0 30px rgba(59, 169, 255, 0.05);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  animation: cardIn 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
}
@keyframes cardIn {
  from { opacity: 0; transform: translateY(28px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.login-form :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.06);
  box-shadow: 0 0 0 1px rgba(90, 160, 255, 0.22) inset;
  border-radius: 10px;
  transition: all 0.2s;
}
.login-form :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px rgba(77, 208, 255, 0.5) inset;
}
.login-form :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px $accent2 inset, 0 0 14px rgba(77, 208, 255, 0.35);
  background: rgba(255, 255, 255, 0.1);
}
.login-form :deep(.el-input__inner) {
  color: $text-main;
}
.login-form :deep(.el-input__prefix) {
  color: rgba(120, 200, 255, 0.85);
}
.login-form :deep(.el-input__suffix) {
  color: rgba(150, 200, 240, 0.7);
}
.login-form :deep(.el-input__suffix:hover) {
  color: $accent2;
}
.login-form .el-input {
  height: 42px;
  input { height: 42px; }
}
.input-icon {
  height: 39px;
  width: 14px;
  margin-left: 0px;
}

.remember-check {
  margin: 0 0 22px 0;
  :deep(.el-checkbox__label) { color: rgba(180, 215, 245, 0.8); }
  :deep(.el-checkbox__inner) {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(90, 160, 255, 0.4);
  }
  :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
    background: $accent; border-color: $accent;
  }
}

/* ===== 登录按钮 + 加载效果 ===== */
.login-btn {
  width: 100%;
  height: 44px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 4px;
  color: #041224;
  background: linear-gradient(135deg, #4dd0ff 0%, #3ba9ff 45%, #1e6fff 100%);
  box-shadow: 0 8px 24px rgba(30, 111, 255, 0.45);
  position: relative;
  overflow: hidden;
  transition: all 0.2s;
  :deep(span) { display: inline-flex; align-items: center; justify-content: center; }
}
.login-btn:hover {
  box-shadow: 0 10px 30px rgba(59, 169, 255, 0.7);
  transform: translateY(-1px);
}
.login-btn::after {
  content: "";
  position: absolute;
  top: 0; left: -60%;
  width: 40%; height: 100%;
  background: linear-gradient(120deg, transparent, rgba(255, 255, 255, 0.55), transparent);
  transform: skewX(-20deg);
  animation: shine 3s ease-in-out infinite;
}
@keyframes shine {
  0% { left: -60%; }
  60%, 100% { left: 130%; }
}

.reg-link { color: $accent2; }

.login-tip {
  font-size: 13px;
  text-align: center;
  color: rgba(150, 190, 225, 0.6);
}
.login-code {
  width: 33%;
  height: 42px;
  float: right;
  img { cursor: pointer; vertical-align: middle; border-radius: 8px; }
}
.el-login-footer {
  height: 40px;
  line-height: 40px;
  position: fixed;
  bottom: 0;
  width: 100%;
  text-align: center;
  color: rgba(160, 200, 235, 0.55);
  font-family: Arial;
  font-size: 12px;
  letter-spacing: 1px;
  z-index: 1;
}
.login-code-img {
  height: 42px;
  padding-left: 12px;
}

@media (max-width: 520px) {
  .login-form { width: 90%; padding: 30px 20px 8px; }
}
</style>
