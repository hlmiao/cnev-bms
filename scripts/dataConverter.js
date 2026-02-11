const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const iconv = require('iconv-lite');

// 配置
const CONFIG = {
  // 采样配置 - 减少数据量
  SAMPLE_SIZE: 5, // 每个文件只取前5条记录
  CELL_LIMIT: 240, // 限制电芯数量
  
  // 输出路径
  OUTPUT_DIR: path.join(__dirname, '../src/data'),
  
  // 项目路径
  PROJECT1_PATH: path.join(__dirname, '../../项目1'),
  PROJECT2_PATH: path.join(__dirname, '../../项目2'),
};

// 主转换函数
async function convertAllData() {
  console.log('🔄 开始数据转换...');
  
  // 确保输出目录存在
  if (!fs.existsSync(CONFIG.OUTPUT_DIR)) {
    fs.mkdirSync(CONFIG.OUTPUT_DIR, { recursive: true });
  }

  try {
    // 1. 转换项目1数据
    console.log('📊 转换项目1数据...');
    const project1Data = await convertProject1Data();
    
    // 2. 转换项目2数据
    console.log('📊 转换项目2数据...');
    const project2Data = await convertProject2Data();
    
    // 3. 生成汇总数据
    console.log('📊 生成汇总数据...');
    const summaryData = generateSummaryData(project1Data, project2Data);
    
    // 4. 保存所有数据
    await saveAllData(project1Data, project2Data, summaryData);
    
    console.log('✅ 数据转换完成！');
    console.log(`📁 输出目录: ${CONFIG.OUTPUT_DIR}`);
    
  } catch (error) {
    console.error('❌ 转换失败:', error);
  }
}

// 转换项目1数据
async function convertProject1Data() {
  const sites = ['2#', '14#', '15#'];
  const project1Data = {
    projectId: 'project1',
    projectName: '项目1储能站',
    sites: {}
  };

  for (const site of sites) {
    const sitePath = path.join(CONFIG.PROJECT1_PATH, site);
    if (!fs.existsSync(sitePath)) continue;

    console.log(`  处理站点: ${site}`);
    
    const siteData = {
      siteId: site,
      siteName: `项目1-${site}站`,
      banks: {}
    };

    // 只处理前3个Bank作为示例
    const files = fs.readdirSync(sitePath)
      .filter(f => f.endsWith('.csv'))
      .slice(0, 3);
    
    for (const file of files) {
      const bankId = file.match(/Bank(\d+)/)?.[1];
      if (!bankId) continue;

      console.log(`    转换: ${file}`);
      
      try {
        const bankData = await parseProject1Bank(sitePath, file, bankId);
        siteData.banks[`Bank${bankId.padStart(2, '0')}`] = bankData;
      } catch (error) {
        console.error(`    ❌ ${file} 转换失败:`, error.message);
      }
    }

    project1Data.sites[site] = siteData;
  }

  return project1Data;
}

// 解析项目1的Bank数据（优化后的UTF-8格式）
async function parseProject1Bank(sitePath, filename, bankId) {
  const filePath = path.join(sitePath, filename);
  
  return new Promise((resolve, reject) => {
    const records = [];
    
    fs.createReadStream(filePath, { encoding: 'utf8' })
      .pipe(csv())
      .on('data', (row) => {
        // 解析优化后的CSV数据
        const record = {
          datetime: row['时间'] || '',
          bankVol: parseFloat(row['总电压']) || 0,
          bankCur: parseFloat(row['总电流']) || 0,
          bankSoc: parseFloat(row['SOC']) || 0,
          bankSoh: parseFloat(row['SOH']) || 0,
          
          // 极值信息
          sglMaxVol: parseFloat(row['单体Vmax']) || 0,
          sglMinVol: parseFloat(row['单体Vmin']) || 0,
          sglMaxTemp: parseFloat(row['单体Tmax']) || 0,
          sglMinTemp: parseFloat(row['单体Tmin']) || 0,
          
          // 绝缘电阻
          posRes: parseFloat(row['绝缘电阻+']) || 0,
          negRes: parseFloat(row['绝缘电阻-']) || 0,
          
          // 能量统计
          chargeEQ: parseFloat(row['累计充电电量']) || 0,
          dischargeEQ: parseFloat(row['累计放电电量']) || 0,
          
          // 提取电压数据 (V1-V400)
          voltages: extractCellDataFromRow(row, 'V', 400),
          
          // 提取温度数据 (T1-T400)
          temperatures: extractCellDataFromRow(row, 'T', 400),
          
          // 提取SOC数据 (SOC1-SOC400)
          socs: extractCellDataFromRow(row, 'SOC', 400),
          
          // 提取SOH数据 (SOH1-SOH400)
          sohs: extractCellDataFromRow(row, 'SOH', 400),
        };
        
        records.push(record);
      })
      .on('end', () => {
        resolve({
          bankId: `Bank${bankId.padStart(2, '0')}`,
          cellCount: 240, // 实际有效电芯数量
          tempCount: 120, // 实际有效温度点数量
          dataCount: Math.min(records.length, CONFIG.SAMPLE_SIZE),
          data: records.slice(0, CONFIG.SAMPLE_SIZE)
        });
      })
      .on('error', reject);
  });
}

// 提取单体数据
function extractCellData(values, startIndex, count) {
  const data = [];
  for (let i = 0; i < count && (startIndex + i) < values.length; i++) {
    const value = values[startIndex + i];
    if (value === '-' || value === '' || value === undefined) {
      data.push(null);
    } else {
      const numValue = parseFloat(value);
      data.push(isNaN(numValue) ? null : numValue);
    }
  }
  return data;
}

// 转换项目2数据
async function convertProject2Data() {
  const project2Data = {
    projectId: 'project2',
    projectName: '项目2储能站',
    stack: {},
    groups: {}
  };

  // 1. 转换Stack数据
  console.log('  处理Stack数据...');
  const stackData = await parseProject2Stack();
  project2Data.stack = stackData;

  // 2. 转换Group数据 (只处理前2个Group)
  const groups = ['group1', 'group2'];
  
  for (const group of groups) {
    console.log(`  处理: ${group}`);
    
    try {
      const groupData = await parseProject2Group(group);
      project2Data.groups[group] = groupData;
    } catch (error) {
      console.error(`  ❌ ${group} 转换失败:`, error.message);
    }
  }

  return project2Data;
}

// 解析项目2的Stack数据
async function parseProject2Stack() {
  const stackPath = path.join(CONFIG.PROJECT2_PATH, 'stack');
  const files = fs.readdirSync(stackPath).filter(f => f.endsWith('.csv'));
  
  if (files.length === 0) {
    throw new Error('未找到Stack数据文件');
  }

  // 取第一个文件作为示例
  const filePath = path.join(stackPath, files[0]);
  const records = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        // 清理引号
        const cleanRow = {};
        Object.keys(row).forEach(key => {
          cleanRow[key] = row[key].replace(/'/g, '');
        });
        records.push(cleanRow);
      })
      .on('end', () => {
        resolve({
          dataType: 'stack',
          dataCount: Math.min(records.length, CONFIG.SAMPLE_SIZE),
          data: records.slice(0, CONFIG.SAMPLE_SIZE)
        });
      })
      .on('error', reject);
  });
}

// 解析项目2的Group数据
async function parseProject2Group(groupName) {
  const groupPath = path.join(CONFIG.PROJECT2_PATH, groupName);
  const groupData = {
    groupId: groupName,
    groupName: groupName.toUpperCase(),
    cellCount: 216,
    data: {}
  };

  // 读取各类型数据
  const dataTypes = ['voltage', 'temperature', 'soc'];
  
  for (const dataType of dataTypes) {
    const typePath = path.join(groupPath, dataType);
    if (!fs.existsSync(typePath)) continue;

    const files = fs.readdirSync(typePath).filter(f => f.endsWith('.csv'));
    if (files.length === 0) continue;

    // 取第一个文件
    const filePath = path.join(typePath, files[0]);
    
    try {
      const typeData = await parseProject2TypeData(filePath);
      groupData.data[dataType] = typeData;
    } catch (error) {
      console.error(`    ❌ ${dataType} 数据解析失败:`, error.message);
    }
  }

  return groupData;
}

// 解析项目2的具体类型数据
function parseProject2TypeData(filePath) {
  return new Promise((resolve, reject) => {
    const records = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        // 清理引号并转换数据
        const cleanRow = {};
        Object.keys(row).forEach(key => {
          let value = row[key].replace(/'/g, '');
          
          // 尝试转换数值
          if (key.startsWith('vol') || key.startsWith('temp') || key.startsWith('soc')) {
            const numValue = parseFloat(value);
            cleanRow[key] = isNaN(numValue) ? null : numValue;
          } else {
            cleanRow[key] = value;
          }
        });
        records.push(cleanRow);
      })
      .on('end', () => {
        resolve({
          dataCount: Math.min(records.length, CONFIG.SAMPLE_SIZE),
          data: records.slice(0, CONFIG.SAMPLE_SIZE)
        });
      })
      .on('error', reject);
  });
}

// 生成汇总数据
function generateSummaryData(project1Data, project2Data) {
  // 统计项目1
  let project1Banks = 0;
  let project1Cells = 0;
  
  Object.values(project1Data.sites).forEach(site => {
    project1Banks += Object.keys(site.banks).length;
    Object.values(site.banks).forEach(bank => {
      project1Cells += bank.cellCount || 0;
    });
  });

  // 统计项目2
  const project2Groups = Object.keys(project2Data.groups).length;
  const project2Cells = project2Groups * 216; // 每个Group 216个电芯

  return {
    totalProjects: 2,
    totalSites: Object.keys(project1Data.sites).length,
    totalBanks: project1Banks,
    totalGroups: project2Groups,
    totalCells: project1Cells + project2Cells,
    
    project1: {
      sites: Object.keys(project1Data.sites).length,
      banks: project1Banks,
      cells: project1Cells
    },
    
    project2: {
      groups: project2Groups,
      cells: project2Cells
    },
    
    // 模拟的汇总指标
    avgSoc: 85.2,
    avgSoh: 92.5,
    totalPower: 125.6,
    activeAlerts: 8,
    
    lastUpdate: new Date().toISOString()
  };
}

// 保存所有数据
async function saveAllData(project1Data, project2Data, summaryData) {
  // 保存项目1数据
  fs.writeFileSync(
    path.join(CONFIG.OUTPUT_DIR, 'project1-data.json'),
    JSON.stringify(project1Data, null, 2)
  );

  // 保存项目2数据
  fs.writeFileSync(
    path.join(CONFIG.OUTPUT_DIR, 'project2-data.json'),
    JSON.stringify(project2Data, null, 2)
  );

  // 保存汇总数据
  fs.writeFileSync(
    path.join(CONFIG.OUTPUT_DIR, 'summary-data.json'),
    JSON.stringify(summaryData, null, 2)
  );

  // 生成简化的演示数据
  const demoData = {
    projects: [
      {
        id: 'project1-2',
        name: '项目1-2#站',
        type: 'project1',
        bankCount: Object.keys(project1Data.sites['2#']?.banks || {}).length,
        status: 'normal'
      },
      {
        id: 'project1-14',
        name: '项目1-14#站', 
        type: 'project1',
        bankCount: Object.keys(project1Data.sites['14#']?.banks || {}).length,
        status: 'normal'
      },
      {
        id: 'project2',
        name: '项目2储能站',
        type: 'project2',
        bankCount: Object.keys(project2Data.groups).length,
        status: 'normal'
      }
    ],
    summary: summaryData
  };

  fs.writeFileSync(
    path.join(CONFIG.OUTPUT_DIR, 'demo-data.json'),
    JSON.stringify(demoData, null, 2)
  );

  console.log('📁 已生成文件:');
  console.log('  - project1-data.json (项目1数据)');
  console.log('  - project2-data.json (项目2数据)');
  console.log('  - summary-data.json (汇总数据)');
  console.log('  - demo-data.json (演示数据)');
}

// 运行转换
if (require.main === module) {
  convertAllData();
}

module.exports = { convertAllData };

// 从CSV行对象中提取单体数据（优化后的格式）
function extractCellDataFromRow(row, prefix, maxCount) {
  const data = [];
  for (let i = 1; i <= maxCount; i++) {
    const fieldName = `${prefix}${i}`;
    const value = row[fieldName];
    
    if (value === '-' || value === '' || value === undefined || value === null) {
      data.push(null);
    } else {
      const numValue = parseFloat(value);
      data.push(isNaN(numValue) ? null : numValue);
    }
  }
  
  // 只返回前240个有效数据（实际电芯数量）
  return data.slice(0, 240);
}