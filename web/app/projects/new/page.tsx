"use client";
import { useState } from "react";
import { Send, Terminal } from "lucide-react";

export default function SubmitProject() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("analyzing");
    
    // Logic to send to our API will go here
    setTimeout(() => setStatus("done"), 2000);
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 font-mono">
      <div className="max-w-2xl mx-auto border border-zinc-800 p-6 rounded-lg bg-zinc-900/50">
        <h1 className="text-2xl mb-4 flex items-center gap-2">
          <Terminal className="text-green-500" /> New Proof of Work
        </h1>
        <p className="text-zinc-400 mb-6">Submit a GitHub repository URL to be audited by the Forge Oracle.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="https://github.com/username/repo"
            className="w-full bg-black border border-zinc-700 p-3 rounded text-green-400 focus:outline-none focus:border-green-500"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button 
            type="submit"
            disabled={status === "analyzing"}
            className="w-full bg-green-600 hover:bg-green-500 text-black font-bold py-3 rounded transition-all flex items-center justify-center gap-2"
          >
            {status === "analyzing" ? "AI AUDITOR SCANNING..." : <><Send size={18} /> Submit for Verification</>}
          </button>
        </form>
      </div>
    </div>
  );
}
