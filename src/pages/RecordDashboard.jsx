import { useState } from 'react';
import { Calendar, DollarSign, CreditCard, Settings, FileSpreadsheet, RefreshCw, Download, Trash2, AlertTriangle } from 'lucide-react';
import { getRecordBalances, forceExportExcel, exportRecordToFile } from '../lib/storage';

export default function RecordDashboard({ record, onSelectDate, onSetExcelPath, onDeleteRecord }) {
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const { totalCash, totalCredit } = getRecordBalances(record);

  const handleOpenDate = (e) => {
    e.preventDefault();
    if (newDate) {
      onSelectDate(newDate);
    }
  };

  const handleForceSync = async () => {
    setIsSyncing(true);
    await forceExportExcel(record);
    setTimeout(() => setIsSyncing(false), 800);
  };

  const handleExportShare = async () => {
    const result = await exportRecordToFile(record);
    if (result && result.success) {
      alert(`Record exported successfully to:\n${result.filePath}`);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="mb-8" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '28px', color: 'var(--text-main)', marginBottom: '4px' }}>{record.name}</h1>
          <p>Created on {new Date(record.createdAt).toLocaleDateString()}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={handleExportShare} title="Export / Share this Record">
            <Download size={18} />
            Share Record
          </button>
          {record.excelExportPath && (
            <button className="btn btn-secondary" onClick={handleForceSync} disabled={isSyncing} title="Force manually sync Excel sheet">
              <RefreshCw size={18} className={isSyncing ? "animate-spin" : ""} />
            </button>
          )}
          <button className="btn btn-secondary" onClick={onSetExcelPath} title={record.excelExportPath ? `Syncing to: ${record.excelExportPath}` : 'Set Excel Sync Location'}>
            <FileSpreadsheet size={18} style={{ color: record.excelExportPath ? 'var(--success)' : 'inherit' }} />
            {record.excelExportPath ? 'Excel Sync Active' : 'Enable Excel Sync'}
          </button>
        </div>
      </div>

      <div className="responsive-grid-2 mb-4" style={{ marginBottom: '32px' }}>
        {/* Cash Card */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px', borderLeft: '4px solid var(--success)' }}>
          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: '50%' }}>
            <DollarSign size={32} className="text-success" />
          </div>
          <div>
            <p className="input-label" style={{ marginBottom: '4px' }}>Total Cash in Hand</p>
            <h2 style={{ fontSize: '32px', margin: 0 }}>{formatCurrency(totalCash)}</h2>
          </div>
        </div>

        {/* Credit Card */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ backgroundColor: 'rgba(37, 99, 235, 0.1)', padding: '16px', borderRadius: '50%' }}>
            <CreditCard size={32} style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <p className="input-label" style={{ marginBottom: '4px' }}>Total Net Credit</p>
            <h2 style={{ fontSize: '32px', margin: 0 }}>{formatCurrency(totalCredit)}</h2>
          </div>
        </div>
      </div>

      <div className="glass-card mb-4">
        <h3 style={{ fontSize: '18px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
          Open Specific Date
        </h3>
        <form onSubmit={handleOpenDate} style={{ display: 'flex', gap: '12px' }}>
          <input 
            type="date" 
            className="input-field" 
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary">Open Date Ledger</button>
        </form>
      </div>

      <div className="glass-card">
        <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Recent Dates Activity</h3>
        {record.entries?.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '24px', fontStyle: 'italic', color: 'var(--text-muted)' }}>
            No entries recorded yet. Open a date above to get started.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {record.entries?.map(entry => {
              // Quick calc for preview
              let cashIn = 0, cashOut = 0;
              entry.transactions?.forEach(t => {
                if (t.type === 'CASH_IN') cashIn += Number(t.amount);
                if (t.type === 'CASH_OUT') cashOut += Number(t.amount);
              });
              
              return (
                <div key={entry.date} className="btn-secondary" style={{ padding: '16px', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Calendar size={20} className="text-muted" />
                    <span style={{ fontWeight: 600, fontSize: '16px' }}>{new Date(entry.date).toLocaleDateString()}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '24px', textAlign: 'right' }}>
                    <div>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Transactions</span>
                      <p style={{ fontWeight: 500 }}>{entry.transactions?.length || 0}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Net Cash</span>
                      <p style={{ fontWeight: 600, color: (cashIn - cashOut) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                        {formatCurrency(cashIn - cashOut)}
                      </p>
                    </div>
                    <button className="btn btn-primary" onClick={() => onSelectDate(entry.date)}>View</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ marginTop: '60px', borderTop: '1px solid var(--border)', paddingTop: '40px', paddingBottom: '20px' }}>
        <h3 style={{ fontSize: '18px', color: 'var(--danger)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={20} />
          Danger Zone
        </h3>
        <div className="glass-card" style={{ border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <p style={{ marginBottom: '16px', color: 'var(--text-muted)' }}>
            Once you delete a record, there is no going back. All financial data, dates, and transactions will be permanently erased.
          </p>
          <button 
            className="btn" 
            style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid var(--danger)' }}
            onClick={() => setShowDeleteModal(true)}
          >
            <Trash2 size={18} style={{ marginRight: '8px' }} />
            Delete this Record
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-card animate-fade-in" style={{ maxWidth: '500px', width: '100%', border: '1px solid var(--danger)' }}>
            <h3 style={{ fontSize: '20px', color: 'var(--danger)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={24} />
              Absolute Warning
            </h3>
            <p style={{ marginBottom: '16px' }}>
              You are about to permanently delete the <strong>{record.name}</strong> ledger. This action is irreversible.
            </p>
            <p style={{ marginBottom: '24px', color: 'var(--text-muted)' }}>
              Please type <strong>{record.name}</strong> to confirm deletion.
            </p>
            
            <input 
              type="text" 
              className="input-field" 
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type record name..."
              style={{ marginBottom: '20px' }}
            />
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1 }}
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}
              >
                Cancel
              </button>
              <button 
                className="btn" 
                style={{ flex: 1, backgroundColor: 'var(--danger)', color: 'white', opacity: deleteConfirmText === record.name ? 1 : 0.5, cursor: deleteConfirmText === record.name ? 'pointer' : 'not-allowed' }}
                disabled={deleteConfirmText !== record.name}
                onClick={() => { if (deleteConfirmText === record.name) onDeleteRecord(); }}
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
