// 项目类型
export type ProjectType = 'project1' | 'project2';
export type StatusType = 'normal' | 'warning' | 'error' | 'offline';

// 项目信息
export interface Project {
  id: string;
  name: string;
  type: ProjectType;
  location?: string;
  commissionDate?: string;
  ratedCapacity?: number;
  ratedPower?: number;
  stackCount: number;
  bankCount: number;
  status: StatusType;
}

// 项目汇总数据
export interface ProjectSummary {
  projectId: string;
  totalVoltage: number;
  totalCurrent: number;
  avgSoc: number;
  avgSoh: number;
  totalChargeEnergy: number;
  totalDischargeEnergy: number;
  power: number;
  alertCount: number;
  lastUpdateTime: string;
}

// Stack数据 (项目2)
export interface StackData {
  devInstCode: string;
  datetime: string;
  stackVol: number;
  stackCur: number;
  stackSoc: number;
  stackSoh: number;
  stackState: string;
  chargeEQ: number;
  dischargeEQ: number;
  chargeEQAdd: number;
  dischargeEQAdd: number;
  sglVolDiff: number;
  sglMaxVol: number;
  sglMinVol: number;
  sglTempDiff: number;
  sglMaxTemp: number;
  sglMinTemp: number;
  bankSocDiff: number;
  bankSocMax: number;
  bankSocMin: number;
  bankVolDiff: number;
  bankVolMax: number;
  bankVolMin: number;
  allowMaxChargePower: number;
  allowMaxDischargePower: number;
  allowMaxChargeCurrent: number;
  allowMaxDischargeCurrent: number;
  maxBankSocNo: number;
  minBankSocNo: number;
  sglMaxVolBankNo: number;
  sglMaxVolNoInBank: number;
  sglMinVolBankNo: number;
  sglMinVolNoInBank: number;
  installBankNum: number;
  bankNumInStack: number;
}

// Bank数据
export interface BankData {
  bankId: string;
  groupNo?: number;
  datetime: string;
  bankVol: number;
  bankCur: number;
  bankSoc: number;
  bankSoh: number;
  envTemp?: number;
  bankState?: string;
  chgDchgState?: number;
  posRes?: number;
  negRes?: number;
  chargeEQ: number;
  dischargeEQ: number;
  chargeEQAdd: number;
  dischargeEQAdd: number;
  sglChargeEQ?: number;
  sglDischargeEQ?: number;
  allowMaxChargePower?: number;
  allowMaxDischargePower?: number;
  allowMaxChargeCurrent?: number;
  allowMaxDischargeCurrent?: number;
  sglAvgVol?: number;
  sglMaxVol: number;
  sglMinVol: number;
  sglAvgTemp?: number;
  sglMaxTemp: number;
  sglMinTemp: number;
  sglAvgSoc?: number;
  sglMaxSoc?: number;
  sglMinSoc?: number;
  sglAvgRes?: number;
  sglMaxRes?: number;
  sglMinRes?: number;
  sglMaxVolNo: number;
  sglMinVolNo: number;
  sglMaxTempNo: number;
  sglMinTempNo: number;
  cellNumInBank?: number;
  tempNumInBank?: number;
  packNumInBank?: number;
}

// 单体数据
export interface CellData {
  cellId: number;
  voltage: number | null;
  temperature: number | null;
  soc: number | null;
  soh: number | null;
}

// 单体数据集合
export interface CellDataSet {
  bankId: string;
  datetime: string;
  voltages: (number | null)[];
  temperatures: (number | null)[];
  socs: (number | null)[];
  sohs: (number | null)[];
}

// 充放电状态
export const ChargingState = {
  Standby: 2,
  Charging: 3,
  Discharging: 4,
} as const;

export type ChargingStateType = typeof ChargingState[keyof typeof ChargingState];

// 统计数据
export interface Statistics {
  avg: number;
  max: number;
  min: number;
  diff: number;
  stdDev: number;
  maxIndex: number;
  minIndex: number;
}
