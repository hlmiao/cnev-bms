// 计算平均值
export const calculateMean = (values: number[]): number => {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
};

// 计算标准差
export const calculateStdDev = (values: number[]): number => {
  if (values.length === 0) return 0;
  const mean = calculateMean(values);
  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
  return Math.sqrt(calculateMean(squaredDiffs));
};

// 计算最大值
export const calculateMax = (values: number[]): number => {
  if (values.length === 0) return 0;
  return Math.max(...values);
};

// 计算最小值
export const calculateMin = (values: number[]): number => {
  if (values.length === 0) return 0;
  return Math.min(...values);
};

// 检测离群值
export const detectOutliers = (
  values: (number | null)[],
  threshold: number = 2
): number[] => {
  const validValues = values.filter((v): v is number => v !== null && !isNaN(v));
  const mean = calculateMean(validValues);
  const stdDev = calculateStdDev(validValues);

  const outlierIndices: number[] = [];
  values.forEach((v, i) => {
    if (v !== null && Math.abs(v - mean) > threshold * stdDev) {
      outlierIndices.push(i);
    }
  });

  return outlierIndices;
};

// 计算一致性评分 (0-100)
export const calculateConsistencyScore = (values: number[]): number => {
  if (values.length === 0) return 0;
  const stdDev = calculateStdDev(values);
  const mean = calculateMean(values);
  if (mean === 0) return 100;
  
  // 变异系数 (CV) 越小，一致性越好
  const cv = stdDev / mean;
  // 将CV转换为0-100的评分
  const score = Math.max(0, Math.min(100, 100 - cv * 1000));
  return Math.round(score);
};

// 计算统计信息
export const calculateStatistics = (values: (number | null)[]) => {
  const validValues = values.filter((v): v is number => v !== null && !isNaN(v));
  
  if (validValues.length === 0) {
    return {
      avg: 0,
      max: 0,
      min: 0,
      diff: 0,
      stdDev: 0,
      count: 0,
      validCount: 0,
    };
  }

  const avg = calculateMean(validValues);
  const max = calculateMax(validValues);
  const min = calculateMin(validValues);
  const stdDev = calculateStdDev(validValues);

  return {
    avg,
    max,
    min,
    diff: max - min,
    stdDev,
    count: values.length,
    validCount: validValues.length,
  };
};
