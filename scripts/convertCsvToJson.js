const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const iconv = require('iconv-lite');

// 转换项目1数据 (GBK编码)
async function convertProject1Data() {
  const project1Path = path.join(__dirname, '../../项目1');
  const outputPath = path.join(__dirname, '../src/data');
  
  // 确保输出目录存在
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  const sites = ['2#', '14#', '15#'];
  const allProjectData = {};

  for (const site of sites) {
    const sitePath = path.join(project1Path, site);
    if (!fs.existsSync(sitePath)) continue;

    const siteData = {
      siteId: site,
      siteName: `项目1-${site}站`,
      banks: {}
    };

    // 读取该站点的所有Bank文件
    const files = fs.readdirSync(sitePath).filter(f => f.endsWith('.csv'));
    
    for (const file of files) {
      const bankId = file.match(/Bank(\d+)/)?.[1];
      if (!bankId) continue;

      console.log(`转换 ${site}/${file}...`);
      
      try {
        const filePath = path.join(sitePath, file);
        const fileBuffer = fs.readFileSync(filePath);
        const csvContent = iconv.decode(fileBuffer, 'gbk');
        
        const bankData = await parseBankCsv(csvContent, `Bank${bankId.padStart(2, '0')}`);
        siteData.banks[`Bank${bankId.padStart(2, '0')}`] = bankData;
      } catch (error) {
        console.error(`转换 ${file} 失败:`, error.message);
      }
    }

    allProjectData[site] = siteData;
  }

  // 保存转换后的数据
  fs.writeFileSync(
    path.join(outputPath, 'project1-data.json'),
    JSON.stringify(allProjectData, null, 2)
  );

  console.log('项目1数据转换完成！');
}

// 转换项目2数据 (UTF-8编码)
async function convertProject2Data() {
  const project2Path = path.join(__dirname, '../../项目2');
  const outputPath = path.join(__dirname, '../src/data');
  
  const groups = ['group1', 'group2', 'group3', 'group4'];
  const project2Data = {
    projectId: 'project2',
    projectName: '项目2-Stack1',
    groups: {}
  };

  for (const group of groups) {
    const groupPath = path.join(project2Path, group);
    if (!fs.existsSync(groupPath)) continue;

    console.log(`转换 ${group}...`);
    
    const groupData = {
      groupId: group,
      groupName: group.toUpperCase(),
      data: {}
    };

    // 读取电压数据
    const voltagePath = path.join(groupPath, 'voltage');
    if (fs.existsSync(voltagePath)) {
      const voltageFiles = fs.readdirSync(voltagePath).filter(f => f.endsWith('.csv'));
      if (voltageFiles.length > 0) {
        const voltageData = await parseProject2Csv(path.join(voltagePath, voltageFiles[0]));
        groupData.data.voltage = voltageData;
      }
    }

    // 读取温度数据
    const tempPath = path.join(groupPath, 'temperature');
    if (fs.existsSync(tempPath)) {
      const tempFiles = fs.readdirSync(tempPath).filter(f => f.endsWith('.csv'));
      if (tempFiles.length > 0) {
        const tempData = await parseProject2Csv(path.join(tempPath, tempFiles[0]));
        groupData.data.temperature = tempData;
      }
    }

    // 读取SOC数据
    const socPath = path.join(groupPath, 'soc');
    if (fs.existsSync(socPath)) {
      const socFiles = fs.readdirSync(socPath).filter(f => f.endsWith('.csv'));
      if (socFiles.length > 0) {
        const socData = await parseProject2Csv(path.join(socPath, socFiles[0]));
        groupData.data.soc = socData;
      }
    }

    project2Data.groups[group] = groupData;
  }

  // 保存转换后的数据
  fs.writeFileSync(
    path.join(outputPath, 'project2-data.json'),
    JSON.stringify(project2Data, null, 2)
  );

  console.log('项目2数据转换完成！');
}

// 解析项目1的Bank CSV数据
function parseBankCsv(csvContent, bankId) {
  return new Promise((resolve, reject) => {
    const results = [];
    const lines = csvContent.split('\n');
    
    if (lines.length < 2) {
      resolve({ bankId, data: [] });
      return;
    }

    // 解析表头
    const headers = lines[0].split(',');
    
    // 解析数据行 (只取前几行作为示例)
    for (let i = 1; i < Math.min(lines.length, 6); i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(',');
      const record = {};
      
      // 基础信息
      record.datetime = values[0] || '';
      record.bankVol = parseFloat(values[1]) || 0;
      record.bankCur = parseFloat(values[2]) || 0;
      record.bankSoc = parseFloat(values[3]) || 0;
      record.bankSoh = parseFloat(values[4]) || 0;
      
      // 电压数据 (V1-V400)
      record.voltages = [];
      for (let v = 38; v < 438 && v < values.length; v++) {
        const voltage = values[v];
        record.voltages.push(voltage === '-' ? null : parseFloat(voltage));
      }
      
      // 温度数据 (T1-T400)
      record.temperatures = [];
      for (let t = 438; t < 838 && t < values.length; t++) {
        const temp = values[t];
        record.temperatures.push(temp === '-' ? null : parseFloat(temp));
      }
      
      // SOC数据 (SOC1-SOC400)
      record.socs = [];
      for (let s = 838; s < 1238 && s < values.length; s++) {
        const soc = values[s];
        record.socs.push(soc === '-' ? null : parseFloat(soc));
      }
      
      // SOH数据 (SOH1-SOH400)
      record.sohs = [];
      for (let h = 1238; h < 1638 && h < values.length; h++) {
        const soh = values[h];
        record.sohs.push(soh === '-' ? null : parseFloat(soh));
      }
      
      results.push(record);
    }
    
    resolve({
      bankId,
      cellCount: 240, // 实际电芯数量
      data: results
    });
  });
}

// 解析项目2的CSV数据
function parseProject2Csv(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        // 清理数据中的引号
        const cleanRow = {};
        Object.keys(row).forEach(key => {
          cleanRow[key] = row[key].replace(/'/g, '');
        });
        results.push(cleanRow);
      })
      .on('end', () => {
        resolve(results.slice(0, 5)); // 只取前5条记录作为示例
      })
      .on('error', reject);
  });
}

// 主函数
async function main() {
  console.log('开始转换CSV数据到JSON...');
  
  try {
    await convertProject1Data();
    await convertProject2Data();
    console.log('所有数据转换完成！');
  } catch (error) {
    console.error('转换失败:', error);
  }
}

if (require.main === module) {
  main();
}