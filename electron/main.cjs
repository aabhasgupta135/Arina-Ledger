const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = process.env.NODE_ENV === 'development';
const appDataPath = app.getPath('userData');
const recordsPath = path.join(appDataPath, 'hospital_records.json');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, '../public/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

async function exportRecordToExcel(record) {
  if (!record.excelExportPath) return;

  try {
    const ExcelJS = require('exceljs');
    let totalCash = 0;
    let totalCredit = 0;
    
    // Sort entries chronologically (oldest to newest)
    const sortedEntries = [...(record.entries || [])].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate global totals
    sortedEntries.forEach(entry => {
      entry.transactions?.forEach(t => {
        const amount = Number(t.amount);
        if (t.type === 'CASH_IN') totalCash += amount;
        if (t.type === 'CASH_OUT') totalCash -= amount;
        if (t.type === 'CREDIT_IN') totalCredit += amount;
        if (t.type === 'CREDIT_OUT') totalCredit -= amount;
      });
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Ledger', {
      views: [{ showGridLines: false }]
    });

    // Styling configurations
    const headerFont = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    const subHeaderFont = { name: 'Arial', size: 12, bold: true };
    const textFont = { name: 'Arial', size: 11 };
    
    // Title
    const titleRow = sheet.addRow(['Arina Ledger Record', record.name]);
    titleRow.font = headerFont;
    titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    titleRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    
    sheet.addRow([]);

    // Global Totals
    const cashRow = sheet.addRow(['Total Cash in Hand:', `₹${totalCash.toFixed(2)}`]);
    cashRow.getCell(1).font = subHeaderFont;
    cashRow.getCell(2).font = { ...subHeaderFont, color: { argb: totalCash >= 0 ? 'FF10B981' : 'FFEF4444' } };
    
    const creditRow = sheet.addRow(['Total Net Credit:', `₹${totalCredit.toFixed(2)}`]);
    creditRow.getCell(1).font = subHeaderFont;
    creditRow.getCell(2).font = { ...subHeaderFont, color: { argb: totalCredit >= 0 ? 'FF3B82F6' : 'FFF59E0B' } };

    sheet.addRow([]);

    // Loop through entries (dates)
    sortedEntries.forEach(entry => {
      // Date Header
      const dateRow = sheet.addRow([`Date: ${entry.date}`]);
      dateRow.font = { ...subHeaderFont, color: { argb: 'FFFFFFFF' } };
      dateRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
      sheet.mergeCells(`A${dateRow.number}:D${dateRow.number}`);

      // Table Headers
      const tableHeader = sheet.addRow(['Type', 'Category', 'Description', 'Amount']);
      tableHeader.font = { bold: true };
      tableHeader.eachCell(cell => {
        cell.border = { bottom: { style: 'thin' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      });

      let dailyCash = 0;
      let dailyCredit = 0;

      const sortedTxs = [...(entry.transactions || [])].sort((a,b) => a.timestamp - b.timestamp);
      
      if (sortedTxs.length === 0) {
        sheet.addRow(['No transactions']);
      }

      sortedTxs.forEach(t => {
        const amount = Number(t.amount);
        if (t.type === 'CASH_IN') dailyCash += amount;
        if (t.type === 'CASH_OUT') dailyCash -= amount;
        if (t.type === 'CREDIT_IN') dailyCredit += amount;
        if (t.type === 'CREDIT_OUT') dailyCredit -= amount;

        const isPositive = t.type.includes('_IN');
        const sign = isPositive ? '+' : '-';
        const typeStr = t.type.replace('_', ' ');

        const txRow = sheet.addRow([
          typeStr,
          t.category,
          t.description,
          `${sign}₹${amount.toFixed(2)}`
        ]);
        
        txRow.font = textFont;
        // Color the amount
        txRow.getCell(4).font = { color: { argb: isPositive ? 'FF10B981' : 'FFEF4444' } };
        txRow.getCell(4).alignment = { horizontal: 'right' };
      });

      // Daily Subtotals
      const subRow1 = sheet.addRow(['', '', 'Net Cash:', `₹${dailyCash.toFixed(2)}`]);
      subRow1.getCell(3).font = { bold: true };
      subRow1.getCell(4).font = { bold: true, color: { argb: dailyCash >= 0 ? 'FF10B981' : 'FFEF4444' } };
      subRow1.getCell(4).alignment = { horizontal: 'right' };

      const subRow2 = sheet.addRow(['', '', 'Net Credit:', `₹${dailyCredit.toFixed(2)}`]);
      subRow2.getCell(3).font = { bold: true };
      subRow2.getCell(4).font = { bold: true, color: { argb: dailyCredit >= 0 ? 'FF3B82F6' : 'FFF59E0B' } };
      subRow2.getCell(4).alignment = { horizontal: 'right' };

      sheet.addRow([]); // Spacing before next date
    });

    // Set Column Widths
    sheet.getColumn(1).width = 20; // Type
    sheet.getColumn(2).width = 25; // Category
    sheet.getColumn(3).width = 40; // Description
    sheet.getColumn(4).width = 20; // Amount

    await workbook.xlsx.writeFile(record.excelExportPath);
  } catch (err) {
    console.error('Failed to export to excel for record:', record.name, err);
  }
}

// Setup IPC handlers
ipcMain.handle('get-records', async () => {
  try {
    if (fs.existsSync(recordsPath)) {
      const data = await fs.promises.readFile(recordsPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to read records:', error);
  }
  return [];
});

ipcMain.handle('save-records', async (event, records) => {
  try {
    fs.writeFileSync(recordsPath, JSON.stringify(records, null, 2), 'utf8');
    
    // Auto-sync any records with an excel export path
    records.forEach(record => {
      if (record.excelExportPath) {
        exportRecordToExcel(record);
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to save records:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('select-excel-path', async (event, defaultName) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Select Excel Sync Location',
    defaultPath: `${defaultName}.xlsx`,
    filters: [
      { name: 'Excel Workbook', extensions: ['xlsx'] }
    ]
  });
  
  if (!result.canceled && result.filePath) {
    return result.filePath;
  }
  return null;
});

ipcMain.handle('force-export-excel', async (event, record) => {
  try {
    if (record && record.excelExportPath) {
      await exportRecordToExcel(record);
      return { success: true };
    }
    return { success: false, error: 'No export path configured' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('export-record-file', async (event, record) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Export Shared Record',
      defaultPath: `${record.name}.hrec`,
      filters: [{ name: 'Arina Record', extensions: ['hrec'] }]
    });
    
    if (!result.canceled && result.filePath) {
      // Strip out local settings
      const exportData = { ...record };
      delete exportData.excelExportPath;
      
      fs.writeFileSync(result.filePath, JSON.stringify(exportData, null, 2), 'utf8');
      return { success: true, filePath: result.filePath };
    }
    return { success: false, canceled: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('import-record-file', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Import Shared Record',
      properties: ['openFile'],
      filters: [{ name: 'Arina Record', extensions: ['hrec'] }]
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const data = fs.readFileSync(result.filePaths[0], 'utf8');
      const record = JSON.parse(data);
      
      // Basic validation
      if (!record.id || !record.name || !Array.isArray(record.entries)) {
        return { success: false, error: 'Invalid record file format.' };
      }
      
      return { success: true, record };
    }
    return { success: false, canceled: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
