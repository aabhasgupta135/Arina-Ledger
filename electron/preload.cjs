const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getRecords: () => ipcRenderer.invoke('get-records'),
  saveRecords: (records) => ipcRenderer.invoke('save-records', records),
  selectExcelPath: (defaultName) => ipcRenderer.invoke('select-excel-path', defaultName),
  forceExportExcel: (record) => ipcRenderer.invoke('force-export-excel', record),
  exportRecordFile: (record) => ipcRenderer.invoke('export-record-file', record),
  importRecordFile: () => ipcRenderer.invoke('import-record-file')
});
