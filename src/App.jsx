import { useState, useEffect } from 'react';
import Welcome from './pages/Welcome';
import RecordDashboard from './pages/RecordDashboard';
import DailyDetails from './pages/DailyDetails';
import { loadRecords, saveRecords } from './lib/storage';

function App() {
  const [records, setRecords] = useState([]);
  const [activeRecordId, setActiveRecordId] = useState(null);
  const [activeDate, setActiveDate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecords().then(data => {
      setRecords(data || []);
      setLoading(false);
    });
  }, []);

  const handleSaveRecords = async (newRecords) => {
    setRecords(newRecords);
    await saveRecords(newRecords);
  };

  const createRecord = async (name) => {
    const newRecord = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString(),
      entries: []
    };
    const updated = [...records, newRecord];
    await handleSaveRecords(updated);
    setActiveRecordId(newRecord.id);
  };

  const activeRecord = records.find(r => r.id === activeRecordId);
  const activeEntry = activeRecord?.entries.find(e => e.date === activeDate);

  const saveTransaction = async (date, transactionData) => {
    const updatedRecords = records.map(r => {
      if (r.id !== activeRecordId) return r;
      
      let entryExists = false;
      const updatedEntries = r.entries.map(entry => {
        if (entry.date === date) {
          entryExists = true;
          // If transaction has an ID, update it, otherwise add new
          const existingTxIndex = entry.transactions.findIndex(t => t.id === transactionData.id);
          let newTransactions = [...entry.transactions];
          
          if (existingTxIndex >= 0) {
            newTransactions[existingTxIndex] = transactionData;
          } else {
            newTransactions.push({ ...transactionData, id: crypto.randomUUID(), timestamp: Date.now() });
          }
          return { ...entry, transactions: newTransactions };
        }
        return entry;
      });

      if (!entryExists) {
        updatedEntries.push({
          date,
          transactions: [{ ...transactionData, id: crypto.randomUUID(), timestamp: Date.now() }]
        });
      }

      // Sort entries by date descending
      updatedEntries.sort((a, b) => b.date.localeCompare(a.date));

      return { ...r, entries: updatedEntries };
    });

    await handleSaveRecords(updatedRecords);
  };

  const deleteTransaction = async (date, transactionId) => {
    const updatedRecords = records.map(r => {
      if (r.id !== activeRecordId) return r;
      const updatedEntries = r.entries.map(entry => {
        if (entry.date === date) {
          return { ...entry, transactions: entry.transactions.filter(t => t.id !== transactionId) };
        }
        return entry;
      });
      return { ...r, entries: updatedEntries };
    });
    await handleSaveRecords(updatedRecords);
  };

  const setExcelPath = async () => {
    const { selectExcelPath } = await import('./lib/storage');
    const filePath = await selectExcelPath(activeRecord.name);
    if (filePath) {
      const updatedRecords = records.map(r => {
        if (r.id === activeRecordId) {
          return { ...r, excelExportPath: filePath };
        }
        return r;
      });
      await handleSaveRecords(updatedRecords);
    }
  };

  const handleImportRecord = async (importedRecord, finalName) => {
    // Generate new UUID to prevent ID collisions with existing local records
    const newRecord = {
      ...importedRecord,
      id: crypto.randomUUID(),
      name: finalName,
      excelExportPath: null // Ensure no lingering paths
    };
    
    const updated = [...records, newRecord];
    await handleSaveRecords(updated);
    setActiveRecordId(newRecord.id);
  };

  const handleDeleteRecord = async (idToDelete) => {
    setActiveRecordId(null);
    setActiveDate(null);
    const updated = records.filter(r => r.id !== idToDelete);
    await handleSaveRecords(updated);
  };

  if (loading) return <div className="flex items-center justify-center" style={{ height: '100vh' }}>Loading...</div>;

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      {activeRecordId && (
        <div className="sidebar animate-fade-in">
          <div className="mb-4">
            <h2 style={{ fontSize: '18px', color: 'var(--primary)' }}>Arina Ledger</h2>
          </div>
          <button 
            className={`btn ${!activeDate ? 'btn-primary' : 'btn-secondary'} mb-4`} 
            onClick={() => setActiveDate(null)}
            style={{ justifyContent: 'flex-start' }}
          >
            Dashboard
          </button>
          
          <div className="mt-4">
            <p className="input-label mb-4" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recent Dates</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activeRecord?.entries.slice(0, 10).map(entry => (
                <button
                  key={entry.date}
                  className={`btn ${activeDate === entry.date ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ justifyContent: 'flex-start', fontSize: '13px', padding: '8px 12px' }}
                  onClick={() => setActiveDate(entry.date)}
                >
                  {entry.date}
                </button>
              ))}
            </div>
          </div>
          
          <div style={{ marginTop: 'auto' }}>
            <button 
              className="btn btn-secondary w-full" 
              onClick={() => { setActiveRecordId(null); setActiveDate(null); }}
              style={{ width: '100%' }}
            >
              Switch Record
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="main-content">
        {!activeRecordId ? (
          <Welcome 
            records={records} 
            onCreateRecord={createRecord} 
            onSelectRecord={id => setActiveRecordId(id)} 
            onImportRecord={handleImportRecord}
          />
        ) : !activeDate ? (
          <RecordDashboard 
            record={activeRecord} 
            onSelectDate={date => setActiveDate(date)} 
            onSetExcelPath={setExcelPath}
            onDeleteRecord={() => handleDeleteRecord(activeRecord.id)}
          />
        ) : (
          <DailyDetails 
            record={activeRecord}
            date={activeDate}
            entry={activeEntry || { date: activeDate, transactions: [] }}
            onSaveTransaction={saveTransaction}
            onDeleteTransaction={deleteTransaction}
            onBack={() => setActiveDate(null)}
          />
        )}
      </div>
    </div>
  );
}

export default App;
