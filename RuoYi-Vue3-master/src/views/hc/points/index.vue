<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="客户姓名" prop="customerName">
        <el-input v-model="queryParams.customerName" placeholder="客户姓名" clearable style="width: 150px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="变动类型" prop="changeType">
        <el-select v-model="queryParams.changeType" clearable placeholder="类型" style="width: 130px">
          <el-option v-for="d in hc_points_type" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="时间" style="width: 340px">
        <el-date-picker v-model="dateRange" value-format="YYYY-MM-DD" type="daterange" start-placeholder="开始" end-placeholder="结束" style="width: 240px" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row class="mb8">
      <el-button type="success" plain icon="Position" @click="openCheckIn" v-hasPermi="['hc:points:checkin']">到店签到</el-button>
      <el-button type="primary" plain icon="Edit" @click="openAdjust" v-hasPermi="['hc:points:adjust']">积分调整</el-button>
    </el-row>

    <el-table v-loading="loading" :data="list">
      <el-table-column label="流水号" prop="recordId" width="80" />
      <el-table-column label="客户" prop="customerName" width="110" />
      <el-table-column label="变动类型" width="100" align="center">
        <template #default="scope"><dict-tag :options="hc_points_type" :value="scope.row.changeType" /></template>
      </el-table-column>
      <el-table-column label="积分变动" width="100" align="right">
        <template #default="scope">
          <span :style="{ color: scope.row.points >= 0 ? '#67c23a' : '#f56c6c' }">{{ scope.row.points >= 0 ? '+' + scope.row.points : scope.row.points }}</span>
        </template>
      </el-table-column>
      <el-table-column label="变动后余额" prop="balanceAfter" width="100" align="right" />
      <el-table-column label="业务ID" prop="bizId" width="90" align="center">
        <template #default="scope">{{ scope.row.bizId || '-' }}</template>
      </el-table-column>
      <el-table-column label="门店ID" prop="storeId" width="80" align="center">
        <template #default="scope">{{ scope.row.storeId || '-' }}</template>
      </el-table-column>
      <el-table-column label="操作人" prop="createBy" width="100" />
      <el-table-column label="时间" prop="createTime" width="160" />
      <el-table-column label="备注" prop="remark" :show-overflow-tooltip="true" />
    </el-table>
    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- 签到 -->
    <el-dialog title="到店签到" v-model="checkInOpen" width="460px" append-to-body>
      <el-form label-width="90px">
        <el-form-item label="客户" required>
          <el-select v-model="checkInForm.customerId" filterable placeholder="选择客户" style="width: 100%">
            <el-option v-for="c in customerOptions" :key="c.customerId" :label="c.name + '（' + c.customerNo + '）'" :value="c.customerId" />
          </el-select>
        </el-form-item>
        <el-form-item label="门店">
          <el-select v-model="checkInForm.storeId" clearable placeholder="所属门店" style="width: 100%">
            <el-option v-for="s in storeOptions" :key="s.storeId" :label="s.storeName" :value="s.storeId" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer><div class="dialog-footer"><el-button type="primary" @click="submitCheckIn">确 定</el-button><el-button @click="checkInOpen = false">取 消</el-button></div></template>
    </el-dialog>

    <!-- 积分调整 -->
    <el-dialog title="积分调整" v-model="adjustOpen" width="460px" append-to-body>
      <el-form label-width="90px">
        <el-form-item label="客户" required>
          <el-select v-model="adjustForm.customerId" filterable placeholder="选择客户" style="width: 100%">
            <el-option v-for="c in customerOptions" :key="c.customerId" :label="c.name + '（' + c.customerNo + '）'" :value="c.customerId" />
          </el-select>
        </el-form-item>
        <el-form-item label="调整积分" required>
          <el-input-number v-model="adjustForm.points" :min="-100000" :max="100000" placeholder="正数发放/负数扣减" style="width: 100%" />
        </el-form-item>
        <el-form-item label="门店">
          <el-select v-model="adjustForm.storeId" clearable placeholder="所属门店" style="width: 100%">
            <el-option v-for="s in storeOptions" :key="s.storeId" :label="s.storeName" :value="s.storeId" />
          </el-select>
        </el-form-item>
        <el-form-item label="原因"><el-input v-model="adjustForm.remark" type="textarea" placeholder="调整原因（留痕）" /></el-form-item>
      </el-form>
      <template #footer><div class="dialog-footer"><el-button type="primary" @click="submitAdjust">确 定</el-button><el-button @click="adjustOpen = false">取 消</el-button></div></template>
    </el-dialog>
  </div>
</template>

<script setup name="Points">
import { listPoints, checkIn, adjustPoints } from "@/api/hc/member"
import { listCustomer } from "@/api/hc/card"
import { listStore } from "@/api/hc/basic"

const { proxy } = getCurrentInstance()
const { hc_points_type } = proxy.useDict("hc_points_type")
const list = ref([])
const customerOptions = ref([])
const storeOptions = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const dateRange = ref([])
const checkInOpen = ref(false)
const adjustOpen = ref(false)
const checkInForm = ref({})
const adjustForm = ref({})
const queryParams = ref({ pageNum: 1, pageSize: 10, customerName: undefined, changeType: undefined })

function getList() {
  loading.value = true
  const params = proxy.addDateRange({ ...queryParams.value }, dateRange.value)
  listPoints(params).then(response => {
    list.value = response.rows
    total.value = response.total
    loading.value = false
  })
}
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { dateRange.value = []; proxy.resetForm("queryRef"); handleQuery() }
function openCheckIn() { checkInForm.value = { customerId: undefined, storeId: undefined }; checkInOpen.value = true }
function submitCheckIn() {
  if (!checkInForm.value.customerId) return proxy.$modal.msgError("请选择客户")
  checkIn(checkInForm.value).then(r => { proxy.$modal.msgSuccess(r.msg || "签到成功"); checkInOpen.value = false; getList() })
}
function openAdjust() { adjustForm.value = { customerId: undefined, points: undefined, storeId: undefined, remark: undefined }; adjustOpen.value = true }
function submitAdjust() {
  const f = adjustForm.value
  if (!f.customerId) return proxy.$modal.msgError("请选择客户")
  if (!f.points) return proxy.$modal.msgError("调整积分不能为空或0")
  adjustPoints(f).then(() => { proxy.$modal.msgSuccess("调整成功"); adjustOpen.value = false; getList() })
}
listCustomer({ pageNum: 1, pageSize: 500 }).then(r => customerOptions.value = r.rows)
listStore({ pageNum: 1, pageSize: 200 }).then(r => storeOptions.value = r.rows)
getList()
</script>
