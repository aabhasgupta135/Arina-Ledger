// Utility to handle data storage
// Falls back to localStorage if not running in Electron

const IS_ELECTRON = !!window.electronAPI;

export const loadRecords = async () => {
  if (IS_ELECTRON) {
    return await window.electronAPI.getRecords();
  } else {
    const data = localStorage.getItem('hospital_records');
    return data ? JSON.parse(data) : [];
  }
};

export const saveRecords = async (records) => {
  if (IS_ELECTRON) {
    const result = await window.electronAPI.saveRecords(records);
    if (!result.success) throw new Error(result.error);
  } else {
    localStorage.setItem('hospital_records', JSON.stringify(records));
  }
};

export const selectExcelPath = async (defaultName) => {
  if (IS_ELECTRON) {
    return await window.electronAPI.selectExcelPath(defaultName);
  }
  return null;
};

export const forceExportExcel = async (record) => {
  if (IS_ELECTRON) {
    return await window.electronAPI.forceExportExcel(record);
  }
  return { success: false };
};

export const exportRecordToFile = async (record) => {
  if (IS_ELECTRON) {
    return await window.electronAPI.exportRecordFile(record);
  }
  return { success: false };
};

export const importRecordFromFile = async () => {
  if (IS_ELECTRON) {
    return await window.electronAPI.importRecordFile();
  }
  return { success: false };
};

// Data structures:
// Record: { id: string, name: string, createdAt: string, entries: Entry[] }
// Entry: { date: string (YYYY-MM-DD), transactions: Transaction[] }
// Transaction: { id: string, type: 'CASH_IN' | 'CASH_OUT' | 'CREDIT_IN' | 'CREDIT_OUT', amount: number, category: string, description: string, timestamp: number }

export const getRecordBalances = (record) => {
  let totalCash = 0;
  let totalCredit = 0;

  record.entries?.forEach(entry => {
    entry.transactions?.forEach(t => {
      const amount = Number(t.amount);
      if (t.type === 'CASH_IN') totalCash += amount;
      if (t.type === 'CASH_OUT') totalCash -= amount;
      if (t.type === 'CREDIT_IN') totalCredit += amount;
      if (t.type === 'CREDIT_OUT') totalCredit -= amount;
    });
  });

  return { totalCash, totalCredit };
};

export const getEntryBalances = (entry) => {
  let netCash = 0;
  let netCredit = 0;

  entry.transactions?.forEach(t => {
    const amount = Number(t.amount);
    if (t.type === 'CASH_IN') netCash += amount;
    if (t.type === 'CASH_OUT') netCash -= amount;
    if (t.type === 'CREDIT_IN') netCredit += amount;
    if (t.type === 'CREDIT_OUT') netCredit -= amount;
  });

  return { netCash, netCredit };
};
