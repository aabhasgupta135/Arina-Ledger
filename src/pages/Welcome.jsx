import { useState } from 'react';
import { PlusCircle, FileText, Upload } from 'lucide-react';
import { importRecordFromFile } from '../lib/storage';

export default function Welcome({ records, onCreateRecord, onSelectRecord, onImportRecord }) {
  const [newRecordName, setNewRecordName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  // Import Collision State
  const [pendingImport, setPendingImport] = useState(null);
  const [renameInput, setRenameInput] = useState('');

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newRecordName.trim()) return;
    onCreateRecord(newRecordName);
  };

  const handleImportClick = async () => {
    const result = await importRecordFromFile();
    if (result && result.success && result.record) {
      const incomingName = result.record.name;
      const collision = records.some(r => r.name.toLowerCase() === incomingName.toLowerCase());
      
      if (collision) {
        setPendingImport(result.record);
        setRenameInput(`${incomingName} (Imported)`);
      } else {
        onImportRecord(result.record, incomingName);
      }
    } else if (result && !result.canceled) {
      alert("Error importing file: " + (result.error || "Unknown error"));
    }
  };

  const handleRenameSubmit = (e) => {
    e.preventDefault();
    if (!renameInput.trim()) return;
    
    const collision = records.some(r => r.name.toLowerCase() === renameInput.trim().toLowerCase());
    if (collision) {
      alert("That name is also taken! Please choose a unique name.");
      return;
    }

    onImportRecord(pendingImport, renameInput.trim());
    setPendingImport(null);
    setRenameInput('');
  };

  if (pendingImport) {
    return (
      <div className="animate-fade-in" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div className="glass-card" style={{ maxWidth: '500px', width: '100%' }}>
          <h3 style={{ fontSize: '20px', marginBottom: '16px', color: 'var(--text-main)' }}>Name Conflict Detected</h3>
          <p style={{ marginBottom: '20px' }}>
            You are importing <strong>{pendingImport.name}</strong>, but a record with that name already exists. Please provide a new name to save this shared record.
          </p>
          <form onSubmit={handleRenameSubmit}>
            <div className="input-group">
              <label className="input-label">New Record Name</label>
              <input 
                autoFocus
                type="text" 
                className="input-field" 
                value={renameInput}
                onChange={(e) => setRenameInput(e.target.value)}
              />
            </div>
            <div className="flex gap-2 mt-6">
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Record</button>
              <button type="button" className="btn btn-secondary" onClick={() => setPendingImport(null)}>Cancel Import</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ maxWidth: '600px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img src="./icon.png" alt="Arina Ledger Logo" style={{ width: '80px', height: '80px', marginBottom: '16px', borderRadius: '16px' }} />
          <h1 style={{ fontSize: '32px', color: 'var(--primary)', marginBottom: '8px' }}>Arina Ledger</h1>
          <p>Select an existing ledger, import a shared one, or create a new one.</p>
        </div>

        <div className="glass-card mb-4" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '18px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            Open a Record
          </h3>
          
          {records.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '24px 0', fontStyle: 'italic' }}>No previous records found.</p>
          ) : (
            <div style={{ display: 'grid', gap: '12px', maxHeight: '300px', overflowY: 'auto' }}>
              {records.map(record => (
                <button 
                  key={record.id}
                  className="btn btn-secondary" 
                  style={{ justifyContent: 'flex-start', padding: '16px', fontSize: '16px' }}
                  onClick={() => onSelectRecord(record.id)}
                >
                  <FileText size={20} style={{ color: 'var(--primary)', marginRight: '12px' }} />
                  {record.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card">
          {!isCreating ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '14px', fontSize: '16px' }}
                onClick={() => setIsCreating(true)}
              >
                <PlusCircle size={20} />
                Create New Record
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ width: '100%', padding: '14px', fontSize: '16px' }}
                onClick={handleImportClick}
              >
                <Upload size={20} />
                Import Shared Record (.hrec)
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreate} className="animate-fade-in">
              <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>New Record Details</h3>
              <div className="input-group">
                <label className="input-label">Record Name (e.g. Fiscal Year 2026)</label>
                <input 
                  autoFocus
                  type="text" 
                  className="input-field" 
                  placeholder="Enter record name..." 
                  value={newRecordName}
                  onChange={(e) => setNewRecordName(e.target.value)}
                />
              </div>
              <div className="flex gap-2 mt-4">
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Create</button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreating(false)}>Cancel</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
