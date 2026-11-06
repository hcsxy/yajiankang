<template>
  <div ref="chartRef" :style="{ height: height, width: '100%' }"></div>
</template>

<script setup name="HcRadar">
import * as echarts from 'echarts'

const props = defineProps({
  // 指标名称数组，如 ['疲劳','睡眠质量','颈肩腰腿']
  names: { type: Array, default: () => [] },
  // 数据系列 [{ name: '初评', data: [78, 60, 50] }]
  series: { type: Array, default: () => [] },
  // 指标满分（评分均为 0-100，分值越高症状越重）
  max: { type: Number, default: 100 },
  height: { type: String, default: '320px' }
})

const chartRef = ref(null)
let chart = null
let observer = null

function render() {
  if (!chartRef.value) return
  if (chartRef.value.clientWidth === 0 || chartRef.value.clientHeight === 0) return
  if (!chart) chart = echarts.init(chartRef.value)
  const dims = (props.names || []).map(n => ({ name: n, max: props.max }))
  chart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, data: (props.series || []).map(s => s.name) },
    radar: { indicator: dims, radius: '65%' },
    series: [{
      type: 'radar',
      symbolSize: 5,
      areaStyle: { opacity: 0.15 },
      data: (props.series || []).filter(s => s.data && s.data.length === dims.length).map(s => ({
        name: s.name,
        value: s.data,
        lineStyle: { width: 2 }
      }))
    }]
  }, true)
}

function resize() {
  if (chart) chart.resize()
}

watch(() => [props.names, props.series], () => {
  nextTick(render)
}, { deep: true })

onMounted(() => {
  nextTick(render)
  window.addEventListener('resize', resize)
  // 弹窗/抽屉展开动画期间容器宽度为 0，尺寸就绪后重绘，避免雷达图空白
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
