'use client'

import { useState, useRef, useEffect } from 'react'
import { LayoutGrid, MessageSquare, FileText, BarChart3, Database, ChevronRight, CornerDownLeft, UploadCloud, File, X, ChevronLeft } from 'lucide-react'

export default function Page() {
  const [messages, setMessages] = useState<{id: string, role: string, content: string}[]>([])
  const [localInput, setLocalInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('assistant')
  const [isBooting, setIsBooting] = useState(true)
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Drag & Drop State
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])

  useEffect(() => {
    const timer = setTimeout(() => setIsBooting(false), 1500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  // --- NEW: Read File Contents before submitting ---
  const readUploadedFiles = async (): Promise<string> => {
    if (uploadedFiles.length === 0) return "";
    
    const readPromises = uploadedFiles.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(`--- DATA FROM ${file.name} ---\n${e.target?.result}\n\n`);
        reader.readAsText(file); // Only reads raw text/CSV
      });
    });

    const fileContentsArray = await Promise.all(readPromises);
    return fileContentsArray.join("");
  }

  const manualSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!localInput.trim()) return;

    setActiveTab('assistant'); 
    
    const userMsg = { id: Date.now().toString(), role: 'user', content: localInput };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLocalInput('');
    setIsLoading(true);

    try {
      // 1. Grab any text from files dropped in the UI
      const extractedFileContext = await readUploadedFiles();

      // 2. Send the chat history AND the file data to the backend
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: newMessages,
          fileContext: extractedFileContext // The dynamic data payload
        }),
      });

      if (!response.ok) throw new Error(`Server Error: ${response.status}`);
      if (!response.body) throw new Error("No response body");

      const aiMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: aiMsgId, role: 'assistant', content: '' }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        aiText += decoder.decode(value, { stream: true });
        setMessages(prev => prev.map(msg => 
          msg.id === aiMsgId ? { ...msg, content: aiText } : msg
        ));
      }
    } catch (error: any) {
      console.error("API Error:", error);
      alert("Connection failed. Check terminal.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setUploadedFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  }
  const removeFile = (idxToRemove: number) => {
    setUploadedFiles(prev => prev.filter((_, idx) => idx !== idxToRemove));
  }

  const navItems = [
    { id: 'dashboard', icon: LayoutGrid, label: 'Overview' },
    { id: 'assistant', icon: MessageSquare, label: 'Research Assistant' },
    { id: 'reports', icon: FileText, label: 'Generated Reports' },
    { id: 'metrics', icon: BarChart3, label: 'Quantitative Metrics' },
    { id: 'data', icon: Database, label: 'Data Sources' },
  ]

  const frictionData = [
    { label: 'Checkout Crash (Mobile)', value: 85 },
    { label: 'Password Reset Loop', value: 42 },
    { label: 'Cart Empty Error', value: 28 },
    { label: 'Slow Image Loading', value: 15 },
  ]

  if (isBooting) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0a0a0a] text-zinc-100 antialiased" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div className="flex flex-col items-center gap-6 animate-pulse">
          <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.1)]">
            <span className="text-2xl font-black text-zinc-900 tracking-tighter">C360</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-sm tracking-[0.4em] text-zinc-400 uppercase font-medium">Cust 360</h1>
            <p className="text-[10px] text-amber-500 tracking-widest uppercase">System Initialization...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-zinc-100 antialiased selection:bg-amber-500/30 animate-in fade-in duration-700 relative" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      <aside className={`${isSidebarExpanded ? 'w-64' : 'w-20'} bg-[#111111] flex flex-col py-6 gap-8 border-r border-zinc-800/60 z-20 transition-all duration-300 ease-in-out relative`}>
        <div className={`flex items-center px-5 ${isSidebarExpanded ? 'justify-start' : 'justify-center'} h-10`}>
          <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm relative group cursor-default">
            <span className="text-sm font-black text-zinc-900 tracking-tighter">C360</span>
            {!isSidebarExpanded && (
              <div className="absolute left-14 bg-zinc-800 text-zinc-100 text-[10px] font-semibold tracking-wider uppercase px-3 py-1.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">Cust 360</div>
            )}
          </div>
          {isSidebarExpanded && (
            <div className="ml-4 flex flex-col overflow-hidden whitespace-nowrap animate-in fade-in duration-300">
              <span className="text-sm font-bold text-zinc-200 uppercase tracking-widest">Cust 360</span>
              <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-medium">Workspace</span>
            </div>
          )}
        </div>

        <nav className="flex flex-col gap-4 flex-1 w-full px-4">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full h-12 rounded-xl flex items-center ${isSidebarExpanded ? 'justify-start px-4' : 'justify-center'} transition-all duration-200 group relative ${isActive ? 'bg-zinc-800/80 text-amber-500 shadow-inner' : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300'}`} title={!isSidebarExpanded ? item.label : undefined}>
                {isActive && <div className="absolute left-0 w-1 h-6 bg-amber-500 rounded-r-full transition-all duration-300"></div>}
                <div className="flex items-center gap-4">
                  <IconComponent className="w-5 h-5 flex-shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                  {isSidebarExpanded && <span className="text-sm font-medium whitespace-nowrap overflow-hidden transition-opacity">{item.label}</span>}
                </div>
              </button>
            )
          })}
        </nav>

        <div className={`mt-auto flex ${isSidebarExpanded ? 'flex-row px-5 justify-between' : 'flex-col items-center gap-4'} w-full pb-2`}>
          <div className="w-10 h-10 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer hover:border-zinc-400 transition-colors">
            <span className="text-xs font-semibold text-zinc-300">UX</span>
          </div>
          <button onClick={() => setIsSidebarExpanded(!isSidebarExpanded)} className="w-10 h-10 flex items-center justify-center rounded-xl text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors">
            <ChevronLeft className={`w-5 h-5 transition-transform duration-300 ${!isSidebarExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </aside>

      <div className="flex flex-col flex-1 overflow-hidden relative bg-[#0a0a0a]">
        <header className="px-10 py-5 z-10 border-b border-zinc-800/60 bg-[#0a0a0a]/80 backdrop-blur-md flex-shrink-0 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs tracking-wider">
              <span className="text-zinc-500 font-medium uppercase tracking-widest hidden sm:inline-block">Cust 360</span>
              <ChevronRight className="w-3 h-3 text-zinc-700 hidden sm:inline-block" />
              <span className="text-zinc-500 font-medium uppercase tracking-widest hidden sm:inline-block">Workspace</span>
              <ChevronRight className="w-3 h-3 text-zinc-700 hidden sm:inline-block" />
              <span className="text-zinc-100 font-bold uppercase tracking-widest">{navItems.find(i => i.id === activeTab)?.label}</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-semibold bg-zinc-900 px-4 py-2 rounded-full border border-zinc-800 shadow-sm">
              <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
              <span className={isLoading ? 'text-amber-500 uppercase tracking-widest' : 'text-zinc-400 uppercase tracking-widest'}>{isLoading ? 'Processing...' : 'System Active'}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto scroll-smooth relative flex flex-col pb-12 transition-all duration-300">
          
          {activeTab === 'dashboard' && (
            <div className="max-w-6xl mx-auto w-full p-10 flex flex-col gap-8 animate-in fade-in duration-300">
              <div>
                <h1 className="text-4xl font-semibold text-zinc-100 tracking-tight mb-2">Research Overview</h1>
                <p className="text-zinc-500 text-sm">Indexed from 6,000+ Appbot qualitative reviews.</p>
              </div>
              <div className="grid grid-cols-4 gap-5">
                {[{ label: 'Total App Reviews', value: '6,247' }, { label: 'Identified Friction Points', value: '142' }, { label: 'Avg Sentiment Score', value: '3.2 / 5' }, { label: 'Data Freshness', value: '2 hrs ago' }].map((stat, i) => (
                  <div key={i} className="group bg-[#111111] border border-zinc-800/60 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-zinc-600">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-semibold mb-3">{stat.label}</p>
                    <p className="text-3xl font-light text-zinc-100 tracking-tight">{stat.value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-[#111111] border border-zinc-800/60 rounded-2xl p-8 mt-4 hover:border-zinc-700 transition-colors">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-medium text-zinc-200">Top Frequency Friction Points</h3>
                  <button onClick={() => setActiveTab('assistant')} className="text-xs text-amber-500 hover:text-amber-400 font-medium tracking-wide flex items-center gap-1">Ask AI to analyze <ChevronRight className="w-3 h-3" /></button>
                </div>
                <div className="space-y-6">
                  {frictionData.map((item, i) => (
                    <div key={i} className="flex flex-col gap-2">
                      <div className="flex justify-between text-sm"><span className="text-zinc-400">{item.label}</span><span className="text-zinc-500 font-mono">{item.value}%</span></div>
                      <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden"><div className="h-full bg-amber-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${item.value}%` }}></div></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="max-w-4xl mx-auto w-full p-10 flex flex-col gap-8 animate-in fade-in duration-300 h-full">
              <div>
                <h1 className="text-4xl font-semibold text-zinc-100 tracking-tight mb-2">Data Sources</h1>
                <p className="text-zinc-500 text-sm">Upload CSV or TXT exports to index them into the AI workspace.</p>
              </div>
              <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} className={`flex-1 min-h-[300px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all duration-300 ${isDragging ? 'border-amber-500 bg-amber-500/5 scale-[1.01]' : 'border-zinc-800 bg-[#111111]/50 hover:border-zinc-600'}`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 transition-colors duration-300 ${isDragging ? 'bg-amber-500/20 text-amber-500' : 'bg-zinc-800/80 text-zinc-400'}`}><UploadCloud className="w-8 h-8" /></div>
                <h3 className="text-xl font-medium text-zinc-200 mb-2">{isDragging ? 'Drop files here' : 'Drag & drop files'}</h3>
                <p className="text-zinc-500 text-sm mb-6 text-center max-w-sm">Support for CSV, TXT, and raw data exports. Files are processed securely in your local environment.</p>
              </div>
              {uploadedFiles.length > 0 && (
                <div className="bg-[#111111] border border-zinc-800/60 rounded-2xl p-6 mt-2 animate-in slide-in-from-bottom-4 duration-300">
                  <h4 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-4">Indexed Files</h4>
                  <div className="space-y-3">
                    {uploadedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl group hover:border-zinc-700 transition-colors">
                        <div className="flex items-center gap-4">
                          <File className="w-5 h-5 text-amber-500" />
                          <div className="flex flex-col"><span className="text-sm font-medium text-zinc-200">{file.name}</span><span className="text-[11px] text-zinc-500 uppercase tracking-wider">{(file.size / 1024).toFixed(1)} KB</span></div>
                        </div>
                        <button onClick={() => removeFile(idx)} className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"><X className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'assistant' && (
            <div className="flex flex-col h-full max-w-4xl mx-auto w-full animate-in fade-in duration-300">
              <div className="flex-1 overflow-y-auto p-10 space-y-8">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-50 select-none">
                    <MessageSquare className="w-12 h-12 text-zinc-700 mb-4" />
                    <h2 className="text-xl font-medium text-zinc-400 mb-2">How can I help with your research?</h2>
                    <p className="text-sm text-zinc-600 max-w-md">I have analyzed the Appbot data. Ask me about sentiment trends, specific friction points, or feature requests.</p>
                  </div>
                ) : (
                  messages.map(m => (
                    <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {m.role === 'assistant' && <div className="w-8 h-8 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center mr-4 flex-shrink-0 mt-1"><span className="text-[10px] font-bold text-zinc-400">AI</span></div>}
                      <div className={`max-w-[85%] px-6 py-5 ${m.role === 'user' ? 'bg-zinc-200 text-zinc-950 rounded-2xl rounded-tr-sm font-medium shadow-md' : 'bg-transparent text-zinc-300 border-l-2 border-amber-500 pl-6 py-2'}`}>
                        <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{m.content}</p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-6 bg-[#0a0a0a] border-t border-zinc-800/60 z-10">
                <form onSubmit={manualSubmit} className="relative group">
                  <input type="text" value={localInput} onChange={(e) => setLocalInput(e.target.value)} placeholder="Message your research agent..." className="w-full bg-[#111111] border border-zinc-700 rounded-2xl pl-5 pr-14 py-4 outline-none text-zinc-100 placeholder-zinc-500 text-[15px] shadow-sm transition-all focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50" autoComplete="off" />
                  <button type="submit" disabled={!localInput.trim() || isLoading} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-zinc-800 text-zinc-400 rounded-xl hover:bg-amber-500 hover:text-zinc-950 disabled:opacity-50 transition-colors"><CornerDownLeft className="w-4 h-4" strokeWidth={2.5} /></button>
                </form>
                <p className="text-center text-[10px] text-zinc-600 mt-3 font-medium uppercase tracking-widest">Cust 360 AI responses are generated based on indexed data</p>
              </div>
            </div>
          )}

          {['reports', 'metrics'].includes(activeTab) && (
            <div className="h-full flex flex-col items-center justify-center text-zinc-600 animate-in fade-in">
              <p className="text-sm uppercase tracking-widest font-semibold">Module in Development</p>
            </div>
          )}

        </main>
      </div>

      <div className="fixed bottom-3 right-5 text-[9px] text-zinc-500/50 uppercase tracking-[0.3em] font-semibold pointer-events-none z-50 select-none mix-blend-screen">Made by RRR for ADL</div>
    </div>
  )
}