<template>
  <div class="app-container">
    <el-tabs v-model="activeTab" @tab-change="onTabChange">
      <!-- 设备台账 -->
      <el-tab-pane label="设备台账" name="device">
        <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
          <el-form-item label="设备编码" prop="deviceCode">
            <el-input v-model="queryParams.deviceCode" placeholder="编码" clearable style="width: 140px" @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="设备名称" prop="deviceName">
            <el-input v-model="queryParams.deviceName" placeholder="名称" clearable style="width: 140px" @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="类型" prop="deviceType">
            <el-select v-model="queryParams.deviceType" clearable placeholder="类型" style="width: 120px">
              <el-option v-for="d in hc_device_type" :key="d.value" :label="d.label" :value="d.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态" prop="deviceStatus">
            <el-select v-model="queryParams.deviceStatus" clearable placeholder="状态" style="width: 120px">
              <el-option v-for="d in hc_device_status" :key="d.value" :label="d.label" :value="d.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
            <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>

        <el-row class="mb8">
          <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['hc:device:add']">新增设备</el-button>
          <el-button type="success" plain icon="FullScreen" @click="openScan" v-hasPermi="['hc:device:use']">扫码使用</el-button>
          <el-alert title="设备编码自动生成 SB+6位（一设备一码），二维码内容默认同设备编码；折旧按直线法、净值不低于残值" type="info" :closable="false" style="width: 640px" />
        </el-row>

        <el-table v-loading="loading" :data="list">
          <el-table-column label="设备编码" prop="deviceCode" width="120" />
          <el-table-column label="设备名称" prop="deviceName" min-width="140" :show-overflow-tooltip="true" />
          <el-table-column label="型号" prop="model" width="110" :show-overflow-tooltip="true" />
          <el-table-column label="类型" width="90" align="center">
            <template #default="scope">{{ typeLabel(scope.row.deviceType) }}</template>
          </el-table-column>
          <el-table-column label="归属门店" prop="storeName" width="120" :show-overflow-tooltip="true" />
          <el-table-column label="采购金额" prop="purchaseAmount" width="100" align="right" />
          <el-table-column label="净值" prop="netValue" width="100" align="right" />
          <el-table-column label="下次校准" width="110" align="center">
            <template #default="scope">{{ parseTime(scope.row.nextCalibrateDate, '{y}-{m}-{d}') }}</template>
          </el-table-column>
          <el-table-column label="状态" width="90" align="center">
            <template #default="scope">
              <el-tag :type="statusTag(scope.row.deviceStatus)">{{ statusLabel(scope.row.deviceStatus) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="300" align="center" class-name="small-padding fixed-width">
            <template #default="scope">
              <el-button v-if="scope.row.deviceStatus === '0' || scope.row.deviceStatus === '2'" link type="success" icon="VideoPlay" @click="handleStartUse(scope.row)" v-hasPermi="['hc:device:use']">开始使用</el-button>
              <el-button link type="primary" icon="Tools" @click="openMaintain(scope.row)" v-hasPermi="['hc:device:maintain']">维保</el-button>
              <el-button v-if="scope.row.deviceStatus === '0'" link type="warning" icon="Share" @click="openTransfer(scope.row)" v-hasPermi="['hc:device:transfer']">借出</el-button>
              <el-button v-if="scope.row.deviceStatus === '2'" link type="warning" icon="RefreshLeft" @click="handleReturn(scope.row)" v-hasPermi="['hc:device:transfer']">归还</el-button>
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['hc:device:edit']">修改</el-button>
              <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['hc:device:remove']">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
      </el-tab-pane>

      <!-- 使用登记 -->
      <el-tab-pane label="使用登记" name="use">
        <el-form :model="useQuery" :inline="true">
          <el-form-item label="设备编码">
            <el-input v-model="useQuery.deviceCode" placeholder="编码" clearable style="width: 140px" />
          </el-form-item>
          <el-form-item label="技师">
            <el-input v-model="useQuery.technicianName" placeholder="技师" clearable style="width: 120px" />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="useQuery.useStatus" clearable placeholder="状态" style="width: 120px">
              <el-option label="使用中" value="0" /><el-option label="已结束" value="1" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="getUseList">搜索</el-button>
          </el-form-item>
        </el-form>
        <el-table v-loading="useLoading" :data="useList">
          <el-table-column label="设备编码" prop="deviceCode" width="120" />
          <el-table-column label="设备名称" prop="deviceName" min-width="140" :show-overflow-tooltip="true" />
          <el-table-column label="门店" prop="storeName" width="110" :show-overflow-tooltip="true" />
          <el-table-column label="技师" prop="technicianName" width="90" />
          <el-table-column label="客户" prop="customerName" width="90" />
          <el-table-column label="开始时间" width="150">
            <template #default="scope">{{ parseTime(scope.row.startTime) }}</template>
          </el-table-column>
          <el-table-column label="结束时间" width="150">
            <template #default="scope">{{ parseTime(scope.row.endTime) }}</template>
          </el-table-column>
          <el-table-column label="时长(分钟)" prop="durationMin" width="95" align="center" />
          <el-table-column label="计费" width="120" align="center">
            <template #default="scope">{{ scope.row.chargeType === '2' ? '单独计费 ' + scope.row.amount : '含项目内' }}</template>
          </el-table-column>
          <el-table-column label="状态" width="90" align="center">
            <template #default="scope">
              <el-tag :type="scope.row.useStatus === '0' ? 'warning' : 'success'">{{ scope.row.useStatus === '0' ? '使用中' : '已结束' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="110" align="center">
            <template #default="scope">
              <el-button v-if="scope.row.useStatus === '0'" link type="danger" icon="SwitchButton" @click="handleEndUse(scope.row)" v-hasPermi="['hc:device:use']">结束使用</el-button>
            </template>
          </el-table-column>
        </el-table>
        <pagination v-show="useTotal > 0" :total="useTotal" v-model:page="useQuery.pageNum" v-model:limit="useQuery.pageSize" @pagination="getUseList" />
      </el-tab-pane>

      <!-- 维保记录 -->
      <el-tab-pane label="维保记录" name="maintain">
        <el-row class="mb8">
          <el-alert title="校准登记后按校准周期（诊断类12个月/治疗类6个月）自动推算下次校准到期日，到期由定时任务推送预警" type="info" :closable="false" style="width: 640px" />
        </el-row>
        <el-table v-loading="maintainLoading" :data="maintainList">
          <el-table-column label="设备编码" prop="deviceCode" width="120" />
          <el-table-column label="设备名称" prop="deviceName" min-width="140" :show-overflow-tooltip="true" />
          <el-table-column label="类型" width="90" align="center">
            <template #default="scope">{{ maintainLabel(scope.row.maintainType) }}</template>
          </el-table-column>
          <el-table-column label="维保日期" width="110" align="center">
            <template #default="scope">{{ parseTime(scope.row.maintainDate, '{y}-{m}-{d}') }}</template>
          </el-table-column>
          <el-table-column label="下次到期" width="110" align="center">
            <template #default="scope">{{ parseTime(scope.row.nextDate, '{y}-{m}-{d}') }}</template>
          </el-table-column>
          <el-table-column label="费用" prop="cost" width="90" align="right" />
          <el-table-column label="服务方" prop="provider" width="130" :show-overflow-tooltip="true" />
          <el-table-column label="结果" prop="result" min-width="160" :show-overflow-tooltip="true" />
          <el-table-column label="登记人" prop="operator" width="100" />
        </el-table>
        <pagination v-show="maintainTotal > 0" :total="maintainTotal" v-model:page="maintainQuery.pageNum" v-model:limit="maintainQuery.pageSize" @pagination="getMaintainList" />
      </el-tab-pane>

      <!-- 借用记录 -->
      <el-tab-pane label="跨店借用" name="transfer">
        <el-table v-loading="transferLoading" :data="transferList">
          <el-table-column label="借用单号" prop="transferNo" width="190" />
          <el-table-column label="设备编码" prop="deviceCode" width="120" />
          <el-table-column label="设备名称" prop="deviceName" min-width="140" :show-overflow-tooltip="true" />
          <el-table-column label="借出" prop="fromStoreName" width="110" />
          <el-table-column label="借入" prop="toStoreName" width="110" />
          <el-table-column label="借用人" prop="borrowUser" width="100" />
          <el-table-column label="借出时间" width="150">
            <template #default="scope">{{ parseTime(scope.row.borrowTime) }}</template>
          </el-table-column>
          <el-table-column label="预计归还" width="110" align="center">
            <template #default="scope">{{ parseTime(scope.row.expectReturnDate, '{y}-{m}-{d}') }}</template>
          </el-table-column>
          <el-table-column label="实际归还" width="150">
            <template #default="scope">{{ parseTime(scope.row.returnTime) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="90" align="center">
            <template #default="scope">
              <el-tag :type="scope.row.transferStatus === '0' ? 'warning' : 'success'">{{ scope.row.transferStatus === '0' ? '借出中' : '已归还' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" align="center">
            <template #default="scope">
              <el-button v-if="scope.row.transferStatus === '0'" link type="primary" icon="RefreshLeft" @click="handleReturnTransfer(scope.row)" v-hasPermi="['hc:device:transfer']">归还</el-button>
            </template>
          </el-table-column>
        </el-table>
        <pagination v-show="transferTotal > 0" :total="transferTotal" v-model:page="transferQuery.pageNum" v-model:limit="transferQuery.pageSize" @pagination="getTransferList" />
      </el-tab-pane>

      <!-- 产出统计 -->
      <el-tab-pane label="产出统计" name="output">
        <el-form :inline="true">
          <el-form-item label="统计区间">
            <el-date-picker v-model="outputRange" type="daterange" value-format="YYYY-MM-DD" start-placeholder="开始" end-placeholder="结束" style="width: 260px" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="getOutput">统计</el-button>
          </el-form-item>
        </el-form>
        <el-table v-loading="outputLoading" :data="outputList">
          <el-table-column label="设备编码" prop="deviceCode" width="120" />
          <el-table-column label="设备名称" prop="deviceName" min-width="160" :show-overflow-tooltip="true" />
          <el-table-column label="门店" prop="storeName" width="120" />
          <el-table-column label="使用次数" prop="useCount" width="100" align="center" />
          <el-table-column label="累计时长(分钟)" prop="totalMinutes" width="130" align="center" />
          <el-table-column label="计费金额" prop="totalAmount" width="110" align="right" />
          <el-table-column label="采购金额" prop="purchaseAmount" width="110" align="right" />
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- 设备新增/修改 -->
    <el-dialog :title="title" v-model="open" width="720px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="设备编码" prop="deviceCode">
              <el-input v-model="form.deviceCode" placeholder="留空自动生成 SB+6位" :disabled="!!form.deviceId" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设备名称" prop="deviceName">
              <el-input v-model="form.deviceName" placeholder="设备名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="型号" prop="model"><el-input v-model="form.model" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="类型" prop="deviceType">
              <el-select v-model="form.deviceType" style="width: 100%" @change="onTypeChange">
                <el-option v-for="d in hc_device_type" :key="d.value" :label="d.label" :value="d.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="归属门店" prop="storeId">
              <el-select v-model="form.storeId" style="width: 100%">
                <el-option v-for="s in storeOptions" :key="s.storeId" :label="s.storeName" :value="s.storeId" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="采购日期" prop="purchaseDate">
              <el-date-picker v-model="form.purchaseDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="采购金额" prop="purchaseAmount"><el-input-number v-model="form.purchaseAmount" :min="0" :precision="2" style="width: 100%" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="保修到期" prop="warrantyEnd">
              <el-date-picker v-model="form.warrantyEnd" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="校准周期(月)" prop="calibrateCycle"><el-input-number v-model="form.calibrateCycle" :min="0" :max="60" style="width: 100%" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最近校准日" prop="lastCalibrateDate">
              <el-date-picker v-model="form.lastCalibrateDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="折旧月数" prop="depreciationMonths"><el-input-number v-model="form.depreciationMonths" :min="0" :max="240" style="width: 100%" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="残值率" prop="residualRate"><el-input-number v-model="form.residualRate" :min="0" :max="1" :step="0.01" :precision="4" style="width: 100%" /></el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="状态" prop="deviceStatus">
              <el-select v-model="form.deviceStatus" style="width: 100%">
                <el-option v-for="d in hc_device_status" :key="d.value" :label="d.label" :value="d.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="二维码内容" prop="qrCode"><el-input v-model="form.qrCode" placeholder="留空同设备编码" /></el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注" prop="remark"><el-input v-model="form.remark" type="textarea" /></el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer"><el-button type="primary" @click="submitForm">确 定</el-button><el-button @click="open = false">取 消</el-button></div>
      </template>
    </el-dialog>

    <!-- 扫码/开始使用 -->
    <el-dialog title="设备使用登记" v-model="useOpen" width="560px" append-to-body>
      <el-form ref="useFormRef" :model="useForm" :rules="useRules" label-width="100px">
        <el-form-item label="设备编码" prop="deviceCode">
          <el-input v-model="useForm.deviceCode" placeholder="扫码或输入设备编码" @blur="doScan" />
        </el-form-item>
        <el-form-item label="设备名称">
          <el-input v-model="useForm.deviceName" disabled />
        </el-form-item>
        <el-form-item label="使用技师">
          <el-select v-model="useForm.technicianId" clearable filterable style="width: 100%" @change="onTechChange">
            <el-option v-for="t in techOptions" :key="t.technicianId" :label="t.techName" :value="t.technicianId" />
          </el-select>
        </el-form-item>
        <el-form-item label="客户">
          <el-select v-model="useForm.customerId" clearable filterable remote :remote-method="searchCustomer" style="width: 100%" @change="onCustomerChange">
            <el-option v-for="c in customerOptions" :key="c.customerId" :label="c.name + '（' + (c.phone || '') + '）'" :value="c.customerId" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联订单">
          <el-input v-model="useForm.orderId" placeholder="订单ID（可空）" />
        </el-form-item>
        <el-form-item label="计费方式">
          <el-radio-group v-model="useForm.chargeType">
            <el-radio value="1">包含在项目内</el-radio>
            <el-radio value="2">单独计费</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="useForm.chargeType === '2'" label="计费金额">
          <el-input-number v-model="useForm.amount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注"><el-input v-model="useForm.remark" type="textarea" /></el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer"><el-button type="primary" @click="submitUse">开始使用</el-button><el-button @click="useOpen = false">取 消</el-button></div>
      </template>
    </el-dialog>

    <!-- 维保登记 -->
    <el-dialog title="设备维保登记" v-model="maintainOpen" width="600px" append-to-body>
      <el-form ref="maintainFormRef" :model="maintainForm" :rules="maintainRules" label-width="100px">
        <el-form-item label="设备"><el-input :model-value="maintainForm.deviceCode + ' ' + (maintainForm.deviceName || '')" disabled /></el-form-item>
        <el-form-item label="维保类型" prop="maintainType">
          <el-select v-model="maintainForm.maintainType" style="width: 100%">
            <el-option v-for="d in hc_maintain_type" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="维保日期" prop="maintainDate">
          <el-date-picker v-model="maintainForm.maintainDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="下次到期">
          <el-date-picker v-model="maintainForm.nextDate" type="date" value-format="YYYY-MM-DD" placeholder="校准留空则按周期推算" style="width: 100%" />
        </el-form-item>
        <el-form-item label="费用"><el-input-number v-model="maintainForm.cost" :min="0" :precision="2" style="width: 100%" /></el-form-item>
        <el-form-item label="服务方"><el-input v-model="maintainForm.provider" /></el-form-item>
        <el-form-item label="维保结果"><el-input v-model="maintainForm.result" type="textarea" /></el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer"><el-button type="primary" @click="submitMaintain">确 定</el-button><el-button @click="maintainOpen = false">取 消</el-button></div>
      </template>
    </el-dialog>

    <!-- 借出 -->
    <el-dialog title="设备跨店借用" v-model="transferOpen" width="560px" append-to-body>
      <el-form ref="transferFormRef" :model="transferForm" :rules="transferRules" label-width="100px">
        <el-form-item label="设备"><el-input :model-value="transferForm.deviceCode + ' ' + (transferForm.deviceName || '')" disabled /></el-form-item>
        <el-form-item label="借入门店" prop="toStoreId">
          <el-select v-model="transferForm.toStoreId" style="width: 100%">
            <el-option v-for="s in storeOptions" :key="s.storeId" :label="s.storeName" :value="s.storeId" />
          </el-select>
        </el-form-item>
        <el-form-item label="借用人"><el-input v-model="transferForm.borrowUser" placeholder="默认当前登录人" /></el-form-item>
        <el-form-item label="预计归还">
          <el-date-picker v-model="transferForm.expectReturnDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注"><el-input v-model="transferForm.remark" type="textarea" /></el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer"><el-button type="primary" @click="submitTransfer">确 定</el-button><el-button @click="transferOpen = false">取 消</el-button></div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Device">
import { listDevice, addDevice, updateDevice, delDevice, scanDevice, listDeviceUse, startDeviceUse, endDeviceUse, listMaintain, addMaintain, listTransfer, addTransfer, returnTransfer, deviceOutput } from "@/api/hc/device"
import { listStore, listTechnician } from "@/api/hc/basic"
import { listCustomer } from "@/api/hc/card"

const { proxy } = getCurrentInstance()
const { hc_device_type, hc_device_status, hc_maintain_type } = proxy.useDict("hc_device_type", "hc_device_status", "hc_maintain_type")

const activeTab = ref("device")
const showSearch = ref(true)
const loading = ref(true)
const list = ref([])
const total = ref(0)
const title = ref("")
const open = ref(false)
const storeOptions = ref([])
const techOptions = ref([])
const customerOptions = ref([])
const queryParams = ref({ pageNum: 1, pageSize: 10, deviceCode: undefined, deviceName: undefined, deviceType: undefined, deviceStatus: undefined })
const form = ref({})

const useOpen = ref(false)
const useLoading = ref(false)
const useList = ref([])
const useTotal = ref(0)
const useQuery = ref({ pageNum: 1, pageSize: 10, deviceCode: undefined, technicianName: undefined, useStatus: undefined })
const useForm = ref({})

const maintainOpen = ref(false)
const maintainLoading = ref(false)
const maintainList = ref([])
const maintainTotal = ref(0)
const maintainQuery = ref({ pageNum: 1, pageSize: 10 })
const maintainForm = ref({})

const transferOpen = ref(false)
const transferLoading = ref(false)
const transferList = ref([])
const transferTotal = ref(0)
const transferQuery = ref({ pageNum: 1, pageSize: 10 })
const transferForm = ref({})

const outputLoading = ref(false)
const outputList = ref([])
const outputRange = ref([])

const rules = {
  deviceName: [{ required: true, message: "设备名称不能为空", trigger: "blur" }],
  deviceType: [{ required: true, message: "请选择类型", trigger: "change" }],
  storeId: [{ required: true, message: "请选择归属门店", trigger: "change" }]
}
const useRules = {
  deviceCode: [{ required: true, message: "请扫码或输入设备编码", trigger: "blur" }]
}
const maintainRules = {
  maintainType: [{ required: true, message: "请选择维保类型", trigger: "change" }],
  maintainDate: [{ required: true, message: "请选择维保日期", trigger: "change" }]
}
const transferRules = {
  toStoreId: [{ required: true, message: "请选择借入门店", trigger: "change" }]
}

function typeLabel(v) {
  const d = hc_device_type.value.find(x => x.value === v)
  return d ? d.label : v
}
function statusLabel(v) {
  const d = hc_device_status.value.find(x => x.value === v)
  return d ? d.label : v
}
function statusTag(v) {
  return { "0": "success", "1": "warning", "2": "primary", "3": "info", "4": "danger" }[v] || "info"
}
function maintainLabel(v) {
  const d = hc_maintain_type.value.find(x => x.value === v)
  return d ? d.label : v
}

function getList() {
  loading.value = true
  listDevice(queryParams.value).then(r => {
    list.value = r.rows
    total.value = r.total
    loading.value = false
  })
}
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm("queryRef"); handleQuery() }
function reset() {
  form.value = { deviceId: undefined, deviceCode: undefined, deviceName: undefined, model: undefined, deviceType: "2", storeId: undefined, purchaseDate: undefined, purchaseAmount: 0, warrantyEnd: undefined, calibrateCycle: 6, lastCalibrateDate: undefined, depreciationMonths: 60, residualRate: 0.05, deviceStatus: "0", qrCode: undefined, remark: undefined }
  proxy.resetForm("formRef")
}
function onTypeChange(v) {
  form.value.calibrateCycle = v === "1" ? 12 : 6
}
function handleAdd() { reset(); open.value = true; title.value = "新增设备" }
function handleUpdate(row) {
  reset()
  form.value = { ...row }
  open.value = true
  title.value = "修改设备"
}
function submitForm() {
  proxy.$refs["formRef"].validate(valid => {
    if (!valid) return
    const fn = form.value.deviceId ? updateDevice : addDevice
    fn(form.value).then(() => {
      proxy.$modal.msgSuccess("操作成功")
      open.value = false
      getList()
    })
  })
}
function handleDelete(row) {
  proxy.$modal.confirm('确认删除设备"' + row.deviceCode + '"？').then(() => delDevice(row.deviceId))
    .then(() => { getList(); proxy.$modal.msgSuccess("删除成功") }).catch(() => {})
}

// ===== 使用登记 =====
function getUseList() {
  useLoading.value = true
  listDeviceUse(useQuery.value).then(r => {
    useList.value = r.rows
    useTotal.value = r.total
    useLoading.value = false
  })
}
function openScan() {
  useForm.value = { chargeType: "1", amount: 0, scanType: "1" }
  searchCustomer("")
  useOpen.value = true
}
function handleStartUse(row) {
  useForm.value = { deviceId: row.deviceId, deviceCode: row.deviceCode, deviceName: row.deviceName, storeId: row.storeId, chargeType: "1", amount: 0, scanType: "1" }
  searchCustomer("")
  useOpen.value = true
}
function doScan() {
  const code = useForm.value.deviceCode
  if (!code) return
  scanDevice(code).then(r => {
    const d = r.data.device
    useForm.value.deviceId = d.deviceId
    useForm.value.deviceName = d.deviceName
    useForm.value.storeId = d.storeId
    if (r.data.activeUse) proxy.$modal.msgWarning("该设备正在使用中")
  }).catch(() => {})
}
function onTechChange(id) {
  const t = techOptions.value.find(x => x.technicianId === id)
  useForm.value.technicianName = t ? t.techName : undefined
}
function onCustomerChange(id) {
  const c = customerOptions.value.find(x => x.customerId === id)
  useForm.value.customerName = c ? c.name : undefined
}
function searchCustomer(kw) {
  listCustomer({ pageNum: 1, pageSize: 20, name: kw }).then(r => customerOptions.value = r.rows)
}
function submitUse() {
  proxy.$refs["useFormRef"].validate(valid => {
    if (!valid) return
    if (useForm.value.chargeType === "2" && !(useForm.value.amount > 0)) {
      proxy.$modal.msgError("单独计费必须填写计费金额")
      return
    }
    startDeviceUse(useForm.value).then(() => {
      proxy.$modal.msgSuccess("已开始使用")
      useOpen.value = false
      getList()
      if (activeTab.value === "use") getUseList()
    })
  })
}
function handleEndUse(row) {
  proxy.$modal.confirm('确认结束设备"' + row.deviceCode + '"的使用？').then(() => endDeviceUse(row.useId))
    .then(() => { getUseList(); getList(); proxy.$modal.msgSuccess("已结束使用") }).catch(() => {})
}

// ===== 维保 =====
function getMaintainList() {
  maintainLoading.value = true
  listMaintain(maintainQuery.value).then(r => {
    maintainList.value = r.rows
    maintainTotal.value = r.total
    maintainLoading.value = false
  })
}
function openMaintain(row) {
  maintainForm.value = { deviceId: row.deviceId, deviceCode: row.deviceCode, deviceName: row.deviceName, storeId: row.storeId, maintainType: "1", maintainDate: proxy.parseTime(new Date(), "{y}-{m}-{d}"), cost: 0 }
  maintainOpen.value = true
}
function submitMaintain() {
  proxy.$refs["maintainFormRef"].validate(valid => {
    if (!valid) return
    addMaintain(maintainForm.value).then(() => {
      proxy.$modal.msgSuccess("维保登记成功")
      maintainOpen.value = false
      getMaintainList()
      getList()
    })
  })
}

// ===== 借用 =====
function getTransferList() {
  transferLoading.value = true
  listTransfer(transferQuery.value).then(r => {
    transferList.value = r.rows
    transferTotal.value = r.total
    transferLoading.value = false
  })
}
function openTransfer(row) {
  transferForm.value = { deviceId: row.deviceId, deviceCode: row.deviceCode, deviceName: row.deviceName, toStoreId: undefined }
  transferOpen.value = true
}
function submitTransfer() {
  proxy.$refs["transferFormRef"].validate(valid => {
    if (!valid) return
    addTransfer(transferForm.value).then(() => {
      proxy.$modal.msgSuccess("借出成功")
      transferOpen.value = false
      getTransferList()
      getList()
    })
  })
}
function handleReturn(row) {
  proxy.$modal.confirm('确认设备"' + row.deviceCode + '"已归还？').then(() => {
    return listTransfer({ pageNum: 1, pageSize: 1, deviceId: row.deviceId, transferStatus: "0" }).then(r => {
      const t = r.rows && r.rows[0]
      if (!t) throw new Error("no active transfer")
      return returnTransfer(t.transferId)
    })
  }).then(() => { getList(); getTransferList(); proxy.$modal.msgSuccess("已归还") }).catch(() => {})
}
function handleReturnTransfer(row) {
  proxy.$modal.confirm('确认借用单"' + row.transferNo + '"已归还？').then(() => returnTransfer(row.transferId))
    .then(() => { getTransferList(); getList(); proxy.$modal.msgSuccess("已归还") }).catch(() => {})
}

// ===== 产出 =====
function getOutput() {
  outputLoading.value = true
  const params = {}
  if (outputRange.value && outputRange.value.length === 2) {
    params.beginTime = outputRange.value[0]
    params.endTime = outputRange.value[1]
  }
  deviceOutput(params).then(r => {
    outputList.value = r.data || []
    outputLoading.value = false
  })
}

function onTabChange(name) {
  if (name === "device") getList()
  if (name === "use") getUseList()
  if (name === "maintain") getMaintainList()
  if (name === "transfer") getTransferList()
  if (name === "output") getOutput()
}

listStore({ pageNum: 1, pageSize: 200 }).then(r => storeOptions.value = r.rows)
listTechnician({ pageNum: 1, pageSize: 500, status: "0" }).then(r => techOptions.value = r.rows)
getList()
</script>
