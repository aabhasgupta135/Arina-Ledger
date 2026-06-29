import { useState, useRef } from 'react';
import { ArrowLeft, Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { getEntryBalances } from '../lib/storage';

export default function DailyDetails({ record, date, entry, onSaveTransaction, onDeleteTransaction, onBack }) {
  const [txType, setTxType] = useState('CASH_IN');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');

  const { netCash, netCredit } = getEntryBalances(entry);

  const amountRef = useRef(null);
  const categoryRef = useRef(null);
  const descRef = useRef(null);

  const saveTransaction = () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) return;
    
    onSaveTransaction(date, {
      type: txType,
      amount: Number(amount),
      category: category || 'General',
      description
    });

    setAmount('');
    setDescription('');
    setCategory('');
    // keep type same for quick entry
    
    // Auto-focus amount for the next rapid entry
    setTimeout(() => {
      amountRef.current?.focus();
    }, 0);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  const getTxTypeLabel = (type) => {
    switch(type) {
      case 'CASH_IN': return { label: 'Cash Inflow', color: 'var(--success)' };
      case 'CASH_OUT': return { label: 'Cash Outflow', color: 'var(--danger)' };
      case 'CREDIT_IN': return { label: 'Credit Inflow', color: 'var(--primary)' };
      case 'CREDIT_OUT': return { label: 'Credit Outflow', color: 'var(--warning)' };
      default: return { label: 'Unknown', color: 'var(--text-main)' };
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="mb-8" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button className="btn btn-secondary" onClick={onBack} style={{ padding: '8px' }}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: '28px', color: 'var(--text-main)', marginBottom: '4px' }}>
            {new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </h1>
          <p>{record.name}</p>
        </div>
      </div>

      <div className="responsive-grid-2 mb-4" style={{ marginBottom: '32px' }}>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p className="input-label" style={{ marginBottom: '4px' }}>Net Cash Today</p>
            <h2 style={{ fontSize: '28px', margin: 0, color: netCash >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              {formatCurrency(netCash)}
            </h2>
          </div>
        </div>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p className="input-label" style={{ marginBottom: '4px' }}>Net Credit Today</p>
            <h2 style={{ fontSize: '28px', margin: 0, color: netCredit >= 0 ? 'var(--primary)' : 'var(--warning)' }}>
              {formatCurrency(netCredit)}
            </h2>
          </div>
        </div>
      </div>

      <div className="responsive-grid-1-2">
        {/* Form Section */}
        <div className="glass-card" style={{ height: 'fit-content' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            Add Transaction
          </h3>
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="input-group">
              <label className="input-label">Transaction Type</label>
              <select 
                className="input-field" 
                value={txType} 
                onChange={(e) => setTxType(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    amountRef.current?.focus();
                  }
                }}
                style={{ padding: '10px' }}
              >
                <optgroup label="Cash">
                  <option value="CASH_IN">Cash Inflow (+)</option>
                  <option value="CASH_OUT">Cash Outflow (-)</option>
                </optgroup>
                <optgroup label="Credit">
                  <option value="CREDIT_IN">Credit Inflow (+)</option>
                  <option value="CREDIT_OUT">Credit Outflow (-)</option>
                </optgroup>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Amount (₹)</label>
              <input 
                ref={amountRef}
                type="number" 
                className="input-field" 
                placeholder="0.00" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    categoryRef.current?.focus();
                  }
                }}
                required
                min="0"
                step="0.01"
              />
            </div>

            <div className="input-group">
              <label className="input-label">Category</label>
              <input 
                ref={categoryRef}
                type="text" 
                className="input-field" 
                placeholder={txType.includes('CASH') ? "e.g. OPD, Lab, Xray, Physiotherapy, Bank Transaction" : "e.g. IPD, Bank Transfer"} 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    // We DO NOT preventDefault here, so the native datalist option can be selected.
                    // Instead, we use a tiny timeout to move focus AFTER the selection registers.
                    setTimeout(() => descRef.current?.focus(), 10);
                  }
                }}
                list="category-suggestions"
              />
              <datalist id="category-suggestions">
                <option value="OPD" />
                <option value="Lab" />
                <option value="Xray" />
                <option value="Physiotherapy" />
                <option value="IPD" />
                <option value="Bank Transaction" />
              </datalist>
            </div>

            <div className="input-group">
              <label className="input-label">Description / Remarks (Optional)</label>
              <input 
                ref={descRef}
                type="text" 
                className="input-field" 
                placeholder="Brief details..." 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    saveTransaction();
                  }
                }}
              />
            </div>

            <button type="button" onClick={saveTransaction} className="btn btn-primary w-full mt-4" style={{ width: '100%', padding: '12px' }}>
              <Plus size={18} /> Add Entry
            </button>
          </form>
        </div>

        {/* Transactions List */}
        <div className="glass-card">
          <h3 style={{ fontSize: '18px', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            Today's Ledger
          </h3>
          
          {(!entry.transactions || entry.transactions.length === 0) ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <p>No transactions recorded for this date yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Table Header */}
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr auto auto', gap: '16px', padding: '0 12px 8px 12px', borderBottom: '1px solid var(--border)', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
                <div>Type</div>
                <div>Category</div>
                <div>Remarks</div>
                <div style={{ textAlign: 'right' }}>Amount</div>
                <div></div>
              </div>
              
              {/* Table Rows */}
              {[...entry.transactions].sort((a,b) => b.timestamp - a.timestamp).map(t => {
                const typeInfo = getTxTypeLabel(t.type);
                const isPositive = t.type.includes('_IN');
                
                return (
                  <div key={t.id} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr auto auto', gap: '16px', padding: '12px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '110px' }}>
                      {isPositive ? <TrendingUp size={16} color={typeInfo.color} /> : <TrendingDown size={16} color={typeInfo.color} />}
                      <span style={{ fontSize: '12px', fontWeight: 600, color: typeInfo.color }}>{typeInfo.label}</span>
                    </div>
                    <div style={{ fontWeight: 500, fontSize: '14px' }}>{t.category}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t.description}</div>
                    <div style={{ textAlign: 'right', fontWeight: 600, fontSize: '15px' }}>
                      {isPositive ? '+' : '-'}{formatCurrency(t.amount)}
                    </div>
                    <button 
                      className="btn" 
                      style={{ padding: '6px', backgroundColor: 'transparent', color: 'var(--danger)' }}
                      onClick={() => onDeleteTransaction(date, t.id)}
                      title="Delete entry"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
