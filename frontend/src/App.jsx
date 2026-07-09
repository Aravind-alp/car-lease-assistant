import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [activeTab, setActiveTab] = useState('details');

  // Chat memory streams
  const [messages, setMessages] = useState([]);
  const [userQuestion, setUserQuestion] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Risk matrix analysis state
  const [strategy, setStrategy] = useState(null);
  const [strategyLoading, setStrategyLoading] = useState(false);

  const fetchHistory = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/v1/contracts');
      setHistoryList(response.data);
    } catch (err) {
      console.error("Failed to sync database history:", err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadStatus(`Staged: ${e.target.files[0].name}`);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Select a contract file first!");

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadStatus('Running automated contract intelligence extraction...');
      setAnalysis(null);
      setStrategy(null);

      const response = await axios.post('http://127.0.0.1:8000/api/v1/upload-contract', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000 
      });
      
      setUploadStatus('Analysis calculated successfully.');
      setAnalysis(response.data.analysis);
      setMessages([
        { sender: 'ai', text: `Document processed. Classified as an automotive ${response.data.analysis.contract_type} agreement. All custom cost vectors are ready for auditing below.` }
      ]);
      fetchHistory();
      setActiveTab('details'); 
    } catch (error) {
      setUploadStatus(`Ingestion fault: ${error.message}`);
    }
  };

  const loadHistoricalContract = async (id) => {
    setUploadStatus('Retrieving context records from PostgreSQL clusters...');
    try {
      const response = await axios.get(`http://127.0.0.1:8000/api/v1/contracts/${id}`);
      setAnalysis(response.data.analysis);
      setStrategy(response.data.strategy || null);
      setMessages([
        { sender: 'ai', text: `Restored workspace session from archive database for: "${response.data.filename}".` }
      ]);
      setUploadStatus(`Workspace context: ${response.data.filename}`);
      setActiveTab('details'); 
    } catch (error) {
      setUploadStatus('Failed to retrieve historical record.');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!userQuestion.trim()) return;

    const query = userQuestion;
    setUserQuestion('');
    setMessages(prev => [...prev, { sender: 'user', text: query }]);
    setChatLoading(true);

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/v1/chat', { question: query });
      setMessages(prev => [...prev, { sender: 'ai', text: response.data.answer }]);
    } catch (error) {
      setMessages(prev => [...prev, { sender: 'ai', text: "Error running streaming framework components." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const generateStrategy = async () => {
    setStrategyLoading(true);
    setStrategy(null);
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/v1/negotiation-strategy');
      setStrategy(response.data.strategy);
    } catch (error) {
      alert("Failed to compile strategic audit report matrix.");
    } finally {
      setStrategyLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif', color: '#0f172a', background: '#fafafa', overflow: 'hidden' }}>
      
      {/* --- STANDARD VALID CSS INJECTION LAYER --- */}
      <style>{`
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 20px; }
        
        .nav-tab-btn {
          width: 100%; text-align: left; background: transparent; border: none;
          color: #94a3b8; padding: 12px; border-radius: 8px; cursor: pointer;
          font-size: 0.875rem; font-weight: 600; display: flex; align-items: center;
          gap: 12px; transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .nav-tab-btn.active { background: #2563eb; color: #fff; box-shadow: 0 4px 12px rgba(37,99,235,0.2); }
        .nav-tab-btn:hover:not(.active) { background: #1e293b; color: #f8fafc; }

        .history-btn {
          width: 100%; text-align: left; background: transparent; border: none;
          color: #64748b; padding: 10px 12px; border-radius: 6px; cursor: pointer;
          font-size: 0.825rem; font-weight: 500; display: flex; align-items: center;
          gap: 10px; transition: all 0.1s ease; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;
        }
        .history-btn:hover { background: #111827; color: #cbd5e1; }
        
        .upload-card {
          width: 100%; background: #fff; padding: 30px; border-radius: 12px;
          border: 1px dashed #e2e8f0; cursor: pointer; text-align: center;
          transition: all 0.2s ease; box-shadow: 0 1px 2px 0 rgba(0,0,0,0.02); box-sizing: border-box;
        }
        .upload-card:hover { border-color: #2563eb; background: #fbfbfe; }
        
        .primary-action-btn {
          padding: 12px 24px; background: #2563eb; color: #fff; border: none;
          border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.9rem;
          box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05); transition: all 0.15s ease;
        }
        .primary-action-btn:hover { background: #1d4ed8; }

        .playbook-trigger-btn {
          padding: 12px 20px; background: #1e293b; color: #fff; border: none;
          border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.85rem;
          transition: all 0.15s ease; flex-shrink: 0;
        }
        .playbook-trigger-btn:hover { background: #0f172a; }

        .dashboard-metric-box {
          border: 1px solid #e2e8f0; padding: 24px; border-radius: 12px;
          background: #fff; box-shadow: 0 1px 3px 0 rgba(0,0,0,0.01); box-sizing: border-box;
        }
        .flag-pill {
          display: inline-block; padding: 4px 8px; font-weight: 700; font-size: 0.75rem;
          border-radius: 4px; text-transform: uppercase; margin-left: auto;
        }
        .grid-half { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; width: 100%; box-sizing: border-box; }
        .flex-col { display: flex; flex-direction: column; gap: 24px; width: 100%; box-sizing: border-box; }
        
        @keyframes viewSlide { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .tab-view-animation { animation: viewSlide 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; height: 100%; display: flex; flex-direction: column; width: 100%; box-sizing: border-box; }
      `}</style>

      {/* --- SIDEBAR WORKSPACE WITH HALF-AND-HALF SPLIT LAYOUT --- */}
      <div style={{ width: '260px', background: '#0b0f19', padding: '24px', display: 'flex', flexDirection: 'column', borderRight: '1px solid #1e293b', height: '100%', boxSizing: 'border-box', flexShrink: 0 }}>
        
        {/* Brand Header */}
        <div style={{ display: 'flex', alignment: 'center', gap: '8px', marginBottom: '28px' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
          <span style={{ color: '#fff', fontSize: '0.95rem', fontWeight: '700', letterSpacing: '-0.02em' }}>SignSmart</span>
        </div>
        
        {/* UPPER HALF: WORKSPACE MENU OPTIONS */}
        <div style={{ textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.075em', color: '#475569', marginBottom: '10px' }}>Workspace Option</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '32px' }}>
          <button onClick={() => setActiveTab('details')} className={`nav-tab-btn ${activeTab === 'details' ? 'active' : ''}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
            Document Details
          </button>
          
          <button 
            onClick={() => setActiveTab('chat')} 
            className={`nav-tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
            disabled={!analysis}
            style={{ opacity: !analysis ? 0.4 : 1, cursor: !analysis ? 'not-allowed' : 'pointer' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            Chat Bot Panel
          </button>
        </div>

        {/* LOWER HALF: DATABASE RUNTIME HISTORY SECTIONS */}
        <div style={{ textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.075em', color: '#475569', marginBottom: '10px', borderTop: '1px solid #1e293b', paddingTop: '20px' }}>Document History</div>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {historyList.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: '#334155', fontStyle: 'italic', paddingLeft: '12px' }}>No records found</p>
          ) : (
            historyList.map((item) => (
              <button key={item.id} onClick={() => loadHistoricalContract(item.id)} className="history-btn">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                {item.filename}
              </button>
            ))
          )}
        </div>
      </div>

      {/* --- MASTER RUNTIME VIEWSPACE --- */}
      <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* VIEW ARCHETYPE A: COMPLIANCE EXTRACTION MATRIX PANEL */}
        {activeTab === 'details' && (
          <div className="tab-view-animation" style={{ padding: '40px 60px', overflowY: 'auto', width: '100%', boxSizing: 'border-box' }}>
            
            <div style={{ marginBottom: '32px' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '700', letterSpacing: '-0.03em', margin: '0 0 4px 0', color: '#0f172a' }}>Document Compliance Audit</h1>
              <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>Understand agreement metrics, verify hidden clauses, and evaluate financial parameter boundaries.</p>
            </div>

            <div className="upload-card" onClick={() => document.getElementById('fileInRef').click()}>
              <input type="file" id="fileInRef" accept=".pdf" onChange={handleFileChange} style={{ display: 'none' }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignTemplate: 'center', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                </div>
                <div>
                  <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#2563eb' }}>Click to append contract file</span>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '3px', margin: 0 }}>Target format constraints: Standard readable contract PDF documents</p>
                </div>
              </div>
            </div>

            {uploadStatus && (
              <div style={{ marginTop: '16px', padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.825rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                {uploadStatus}
              </div>
            )}

            {file && !analysis && (
              <button onClick={handleUpload} className="primary-action-btn" style={{ width: '100%', marginTop: '16px' }}>
                Execute Review Analysis Ingestion
              </button>
            )}

            {analysis && (
              <div style={{ marginTop: '32px', width: '100%' }} className="flex-col">
                
                {/* Header Banner */}
                <div className="grid-half">
                  <div className="dashboard-metric-box" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '10px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: '800', color: '#166534', border: '1px solid #bbf7d0' }}>
                      {analysis.contract_fairness_score}
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 2px 0', fontSize: '0.875rem', fontWeight: '600', color: '#0f172a' }}>Fairness Index Grade</h4>
                      <p style={{ margin: 0, fontSize: '0.775rem', color: '#64748b' }}>Detected Framework Category: <strong style={{color: '#2563eb'}}>{analysis.contract_type} AGREEMENT</strong></p>
                    </div>
                  </div>
                  
                  <div className="dashboard-metric-box" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    <div>
                      <h4 style={{ margin: '0 0 2px 0', fontSize: '0.875rem', fontWeight: '600', color: '#0f172a' }}>Strategic Risk Assessment</h4>
                      <p style={{ margin: 0, fontSize: '0.775rem', color: '#64748b' }}>Analyze pros, cons, liabilities, and negotiable structures.</p>
                    </div>
                    <button onClick={generateStrategy} disabled={strategyLoading} className="playbook-trigger-btn">
                      {strategyLoading ? 'Compiling Metrics...' : 'Run Analysis'}
                    </button>
                  </div>
                </div>

                {/* SAAS PROS / CONS RISK DECK COMPONENT */}
                {strategy && (
                  <div className="grid-half tab-view-animation">
                    {/* Favorable items card */}
                    <div className="dashboard-metric-box" style={{ borderColor: '#86efac', background: '#fcfdfd' }}>
                      <h3 style={{ margin: '0 0 12px 0', fontSize: '0.875rem', color: '#166534', fontWeight: '700', borderBottom: '1px solid #dcfce7', paddingBottom: '6px' }}>🟢 Favorable Conditions (Pros)</h3>
                      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.825rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {strategy.pros.map((item, i) => <li key={i}>{item}</li>)}
                      </ul>
                    </div>

                    {/* Unfavorable items card */}
                    <div className="dashboard-metric-box" style={{ borderColor: '#fde047' }}>
                      <h3 style={{ margin: '0 0 12px 0', fontSize: '0.875rem', color: '#854d0e', fontWeight: '700', borderBottom: '1px solid #fef9c3', paddingBottom: '6px' }}>🟡 Disadvantageous Flags (Cons)</h3>
                      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.825rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {strategy.cons.map((item, i) => <li key={i}>{item}</li>)}
                      </ul>
                    </div>

                    {/* Critical Risks card */}
                    <div className="dashboard-metric-box" style={{ borderColor: '#fca5a5', gridColumn: 'span 2' }}>
                      <h3 style={{ margin: '0 0 12px 0', fontSize: '0.875rem', color: '#991b1b', fontWeight: '700', borderBottom: '1px solid #fee2e2', paddingBottom: '6px' }}>🔴 Critical Hazard Vulnerabilities & Risks</h3>
                      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.825rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {strategy.critical_risks.map((item, i) => <li key={i}><strong style={{color: '#b91c1c'}}>Risk factor:</strong> {item}</li>)}
                      </ul>
                    </div>

                    {/* Points of Negotiation Card */}
                    <div className="dashboard-metric-box" style={{ borderColor: '#bfdbfe', gridColumn: 'span 2', background: '#f8fafc' }}>
                      <h3 style={{ margin: '0 0 12px 0', fontSize: '0.875rem', color: '#1e40af', fontWeight: '700', borderBottom: '1px solid #dbeafe', paddingBottom: '6px' }}>🔵 Target Negotiable Items</h3>
                      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.825rem', color: '#1e293b', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {strategy.negotiable_points.map((item, i) => <li key={i} style={{fontWeight: '500'}}>{item}</li>)}
                      </ul>
                    </div>
                  </div>
                )}

                {/* DYNAMIC TRACK VIEW A: CAR LOAN ALLOCATIONS */}
                {analysis.contract_type === 'LOAN' && analysis.loan_pillars && (
                  <div className="flex-col">
                    <div className="grid-half">
                      <div className="dashboard-metric-box">
                        <h3 style={{ marginTop: '0', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#2563eb', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', marginBottom: '14px' }}>The Cost Pillars</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.825rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Financed Amount:</span><span style={{ fontWeight: '600' }}>{analysis.loan_pillars.financed_amount ? `$${analysis.loan_pillars.financed_amount.toLocaleString()}` : 'Not specified'}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Annual Percentage Rate (APR):</span><span style={{ fontWeight: '600' }}>{analysis.loan_pillars.apr ? `${analysis.loan_pillars.apr}%` : 'Not specified'}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Finance Charge Balance:</span><span style={{ fontWeight: '600' }}>{analysis.loan_pillars.finance_charge ? `$${analysis.loan_pillars.finance_charge.toLocaleString()}` : 'Not specified'}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Total of Payments:</span><span style={{ fontWeight: '600' }}>{analysis.loan_pillars.total_of_payments ? `$${analysis.loan_pillars.total_of_payments.toLocaleString()}` : 'Not specified'}</span></div>
                          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '8px', marginTop: '4px' }}><span style={{ color: '#64748b', display: 'block', marginBottom: '2px' }}>Amortization Schedule Calculation:</span><p style={{margin:0, fontWeight:'500'}}>{analysis.loan_pillars.amortization_schedule || 'Standard tracking balance'}</p></div>
                        </div>
                      </div>

                      <div className="dashboard-metric-box">
                        <h3 style={{ marginTop: '0', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#b45309', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', marginBottom: '14px' }}>Hidden Trapdoors & Fees</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.825rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Origination Fee Matrix:</span><span style={{ fontWeight: '600' }}>{analysis.loan_trapdoors?.origination_fees ? `$${analysis.loan_trapdoors.origination_fees}` : '$0.00'}</span></div>
                          <div style={{ display: 'flex', alignItems: 'center' }}><span style={{ color: '#64748b' }}>Rule of 78s Interest Application:</span>{analysis.loan_trapdoors?.rule_of_78s ? <span className="flag-pill" style={{background: '#fef2f2', color: '#ef4444'}}>HIGH RISK PRESENT</span> : <span className="flag-pill" style={{background: '#f0fdf4', color: '#166534'}}>ABSENT</span>}</div>
                          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}><span style={{ color: '#64748b', fontWeight: '600' }}>Prepayment Penalty Clause:</span><p style={{ margin: 0, color: '#475569', lineHeight: '1.4' }}>{analysis.loan_trapdoors?.prepayment_penalty_clause || 'Omitted from file summary.'}</p></div>
                          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}><span style={{ color: '#64748b', fontWeight: '600' }}>Force-Placed Insurance Authority:</span><p style={{ margin: 0, color: '#475569', lineHeight: '1.4' }}>{analysis.loan_trapdoors?.force_placed_insurance || 'Omitted from file summary.'}</p></div>
                        </div>
                      </div>
                    </div>

                    <div className="dashboard-metric-box">
                      <h3 style={{ marginTop: '0', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#dc2626', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', marginBottom: '14px' }}>Trigger Events & Default Terms</h3>
                      <div className="grid-half" style={{ fontSize: '0.825rem' }}>
                        <div>
                          <span style={{ color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '2px' }}>Default Operational Definition:</span>
                          <p style={{ margin: 0, color: '#334155', lineHeight: '1.4' }}>{analysis.loan_triggers?.default_definition || 'Omitted.'}</p>
                        </div>
                        <div>
                          <span style={{ color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '2px' }}>Acceleration Balance Clause:</span>
                          <p style={{ margin: 0, color: '#334155', lineHeight: '1.4' }}>{analysis.loan_triggers?.acceleration_clause || 'Omitted.'}</p>
                        </div>
                        <div>
                          <span style={{ color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '2px' }}>Repossession Execution Rights:</span>
                          <p style={{ margin: 0, color: '#334155', lineHeight: '1.4' }}>{analysis.loan_triggers?.repossession_rights || 'Omitted.'}</p>
                        </div>
                        <div>
                          <span style={{ color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '2px' }}>Right to Cure Grace Period:</span>
                          <p style={{ margin: 0, color: '#334155', lineHeight: '1.4' }}>{analysis.loan_triggers?.right_to_cure || 'Omitted.'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* DYNAMIC TRACK VIEW B: VEHICLE LEASE AGREEMENTS */}
                {analysis.contract_type === 'LEASE' && analysis.lease_pillars && (
                  <div className="flex-col">
                    <div className="grid-half">
                      <div className="dashboard-metric-box">
                        <h3 style={{ marginTop: '0', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#2563eb', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', marginBottom: '14px' }}>The Cost Pillars</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.825rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Gross Capitalized Cost:</span><span style={{ fontWeight: '600' }}>{analysis.lease_pillars.gross_capitalized_cost ? `$${analysis.lease_pillars.gross_capitalized_cost.toLocaleString()}` : 'Not specified'}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Capitalized Cost Reduction:</span><span style={{ fontWeight: '600' }}>{analysis.lease_pillars.capitalized_cost_reduction ? `$${analysis.lease_pillars.capitalized_cost_reduction.toLocaleString()}` : 'Not specified'}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Adjusted Capitalized Cost:</span><span style={{ fontWeight: '600' }}>{analysis.lease_pillars.adjusted_capitalized_cost ? `$${analysis.lease_pillars.adjusted_capitalized_cost.toLocaleString()}` : 'Not specified'}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Residual Value Target:</span><span style={{ fontWeight: '600' }}>{analysis.lease_pillars.residual_value ? `$${analysis.lease_pillars.residual_value.toLocaleString()}` : 'Not specified'}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}><span style={{ color: '#64748b' }}>Money Factor Decimal Yield:</span><span style={{ fontWeight: '600', color: '#1e40af' }}>{analysis.lease_pillars.money_factor || 'Not specified'}</span></div>
                        </div>
                      </div>

                      <div className="dashboard-metric-box">
                        <h3 style={{ marginTop: '0', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#b45309', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', marginBottom: '14px' }}>Hidden Trapdoors & Fees</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.825rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Mileage Allowance parameters:</span><span style={{ fontWeight: '600' }}>{analysis.lease_trapdoors?.mileage_allowance || 'Not specified'}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Overage Fee Rate Matrix:</span><span style={{ fontWeight: '600', color: '#ef4444' }}>{analysis.lease_trapdoors?.overage_fee_rate || 'Not specified'}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Disposition Turn-In Charge:</span><span style={{ fontWeight: '600' }}>{analysis.lease_trapdoors?.disposition_fee ? `$${analysis.lease_trapdoors.disposition_fee}` : '$0.00'}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Purchase Option Admin Fee:</span><span style={{ fontWeight: '600' }}>{analysis.lease_trapdoors?.purchase_option_fee ? `$${analysis.lease_trapdoors.purchase_option_fee}` : '$0.00'}</span></div>
                          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}><span style={{ color: '#64748b', fontWeight: '600' }}>Excessive Wear Assessment Standards:</span><p style={{ margin: 0, color: '#475569', lineHeight: '1.4' }}>{analysis.lease_trapdoors?.excessive_wear_standards || 'Omitted from file.'}</p></div>
                        </div>
                      </div>
                    </div>

                    <div className="dashboard-metric-box">
                      <h3 style={{ marginTop: '0', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#dc2626', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', marginBottom: '14px' }}>Trigger Events & Liability Execution</h3>
                      <div className="grid-half" style={{ fontSize: '0.825rem' }}>
                        <div>
                          <span style={{ color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '2px' }}>Early Termination Liability Formula:</span>
                          <div style={{ background: '#fffafb', padding: '10px', borderRadius: '6px', borderLeft: '3px solid #ef4444', color: '#991b1b', lineHeight: '1.4' }}>{analysis.lease_triggers?.early_termination_liability || 'Omitted.'}</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div><span style={{ color: '#64748b', fontWeight: '600' }}>Gap Insurance Provision Rule:</span><p style={{ margin: 0, color: '#334155' }}>{analysis.lease_triggers?.gap_insurance_provision || 'Not specified.'}</p></div>
                          <div><span style={{ color: '#64748b', fontWeight: '600' }}>Default Realization Guidelines:</span><p style={{ margin: 0, color: '#334155' }}>{analysis.lease_triggers?.default_realization || 'Not specified.'}</p></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SHARED COMMON LEGAL MATRICES CARD */}
                <div className="dashboard-metric-box">
                  <h3 style={{ marginTop: '0', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', marginBottom: '14px' }}>Legal Protection Shields & Waivers</h3>
                  <div className="grid-half" style={{ fontSize: '0.825rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div><span style={{ color: '#64748b', fontWeight: '600' }}>Binding Arbitration Clause:</span><p style={{ margin: 0, color: '#334155', lineHeight: '1.4' }}>{analysis.legal_shields.binding_arbitration || 'Absent from framework.'}</p></div>
                      <div><span style={{ color: '#64748b', fontWeight: '600' }}>Class Action Waiver Constraint:</span><p style={{ margin: 0, color: '#334155', lineHeight: '1.4' }}>{analysis.legal_shields.class_action_waiver || 'Absent from framework.'}</p></div>
                      <div><span style={{ color: '#64748b', fontWeight: '600' }}>Lessee Indemnification Framework:</span><p style={{ margin: 0, color: '#334155', lineHeight: '1.4' }}>{analysis.legal_shields.lessee_indemnification || 'None flagged.'}</p></div>
                      <div><span style={{ color: '#64748b', fontWeight: '600' }}>Subleasing Assignment Restriction:</span><p style={{ margin: 0, color: '#334155', lineHeight: '1.4' }}>{analysis.legal_shields.subleasing_restriction || 'None flagged.'}</p></div>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Governing State Jurisdiction Law:</span>
                      <p style={{ margin: 0, color: '#1e40af', background: '#eff6ff', padding: '12px', borderRadius: '6px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>📍 {analysis.legal_shields.governing_law || 'Local Execution Bench'}</p>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* VIEW ARCHETYPE B: FIXED FOOTER HIGH-FIDELITY CHATBOT TERMINAL */}
        {activeTab === 'chat' && (
          <div className="tab-view-animation" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
            
            <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb' }}></div>
              <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0f172a' }}>Audit Chat Context Vector Stream</span>
            </div>

            {/* Scrollable Message history stream */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#fcfcfd', boxSizing: 'border-box' }}>
              {messages.map((msg, index) => (
                <div key={index} style={{
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  background: msg.sender === 'user' ? '#2563eb' : '#fff',
                  color: msg.sender === 'user' ? '#fff' : '#0f172a',
                  padding: '12px 16px',
                  borderRadius: msg.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  maxWidth: '70%',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                  border: msg.sender === 'user' ? 'none' : '1px solid #e2e8f0',
                  whiteSpace: 'pre-wrap',
                  fontSize: '0.875rem',
                  lineHeight: '1.5'
                }}>
                  <strong style={{ fontSize: '0.675rem', display: 'block', marginBottom: '4px', opacity: 0.7, letterSpacing: '0.025em' }}>
                    {msg.sender === 'user' ? 'WORKSPACE USER' : 'COMPLIANCE INSPECTOR'}
                  </strong>
                  {msg.text}
                </div>
              ))}
              {chatLoading && (
                <div style={{ alignSelf: 'flex-start', background: '#e2e8f0', padding: '10px 14px', borderRadius: '12px', color: '#475569', fontSize: '0.825rem', fontWeight: '500' }}>
                  Iterating file context matrices...
                </div>
              )}
            </div>

            {/* FIXED FOOTER CONTROL INPUT AT THE EXACT BOTTOM VIEWPORT POINT */}
            <div style={{ padding: '24px 40px', background: '#fff', borderTop: '1px solid #e2e8f0', boxSizing: 'border-box', flexShrink: 0 }}>
              <form onSubmit={handleSendMessage} style={{ display: 'flex', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                <input 
                  type="text" 
                  placeholder="Inquire regarding specific checklist items, penalty structures, or protection parameters..." 
                  value={userQuestion}
                  onChange={(e) => setUserQuestion(e.target.value)}
                  disabled={chatLoading}
                  style={{ flex: 1, padding: '16px 20px', border: 'none', outline: 'none', fontSize: '0.875rem', color: '#0f172a' }}
                />
                <button type="submit" disabled={chatLoading} style={{ padding: '0 24px', background: '#0b0f19', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>
                  Execute Request
                </button>
              </form>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default App;