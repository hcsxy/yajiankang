<template>
  <div ref="chartRef" :style="{ height: height, width: '100%' }"></div>
</template>

<script setup name="HcChart">
import * as echarts from 'echarts'

const props = defineProps({
  // 完整 ECharts option，由页面 computed 生成；引用变化即整图重绘
  option: { type: Object, default: () => ({}) },
  height: { type: String, default: '300px' }
})

const chartRef = ref(null)
let chart = null
let observer = null

function render() {
  if (!chartRef.value) return
  // 容器宽高为 0（页签未展开/动画中）时不初始化，交由 ResizeObserver 尺寸就绪后重绘
  if (chartRef.value.clientWidth === 0 || chartRef.value.clientHeight === 0) return
  if (!chart) chart = echarts.init(chartRef.value)
  chart.setOption(props.option || {}, true)
}

function resize() {
  if (chart) chart.resize()
}

watch(() => props.option, () => {
  nextTick(render)
})

onMounted(() => {
  nextTick(render)
  window.addEventListener('resize', resize)
  if (window.ResizeObserver) {
    observer = new ResizeObserver(() => { render(); resize() })
    if (chartRef.value) observer.observe(chartRef.value)
  } else {
    setTimeout(() => { render(); resize() }, 350)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resize)
  if (observer) {
    observer.disconnect()
    observer = null
  }
  if (chart) {
    chart.dispose()
    chart = null
  }
})

defineExpose({ render, resize })
</script>
