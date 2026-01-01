"use client";
import { useState } from 'react';

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAudit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        body: JSON.stringify({ repoUrl: url }),
      });
      if (res.ok) alert("GATES EMPIRE: Audit Complete. XP added to Profile.");
      else alert("GATES EMPIRE: Error. Are you logged in?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh', padding: '50px', fontFamily: 'monospace' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ color: '#22c55e', fontSize: '2.5rem', letterSpacing: '2px' }}>GATES EMPIRE // SYSTEM_ACTIVE</h1>
        <p style={{ color: '#666', marginBottom: '40px' }}>Proof of Work Protocol // Secure Meritocracy</p>
        
        <div style={{ background: '#111', border: '1px solid #22c55e', padding: '40px', borderRadius: '10px', boxShadow: '0 0 20px rgba(34, 197, 94, 0.1)' }}>
          <h3 style={{ marginBottom: '20px', color: '#fff' }}>Submit Repository for AI Audit</h3>
          <input 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            type="text" 
            placeholder="Paste GitHub URL..." 
            style={{ width: '100%', padding: '15px', background: '#000', border: '1px solid #333', color: '#fff', marginBottom: '20px', outline: 'none' }}
          />
          <button 
            onClick={handleAudit}
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '15px', 
              background: loading ? '#666' : '#22c55e', 
              color: '#000', 
              fontWeight: 'bold', 
              border: 'none', 
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            {loading ? "ANALYZING_GATES_CODE..." : "INITIATE EMPIRE VERIFICATION"}
          </button>
        </div>
        
        <div style={{ marginTop: '30px', color: '#444', fontSize: '0.8rem' }}>
          GATES_OS_v1.0.4: <span style={{ color: '#22c55e' }}>ONLINE_AND_PROTECTED</span>
        </div>
      </div>
    </main>
  );
}