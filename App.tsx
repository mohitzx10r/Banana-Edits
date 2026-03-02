
import React, { useState, useRef, useEffect } from 'react';
import { geminiService } from './services/gemini';
import { ImageState, EditHistory } from './types';
import Layout from './components/Layout';
import PWAInstallBanner from './components/PWAInstallBanner';

const App: React.FC = () => {
  const [state, setState] = useState<ImageState>({
    original: null,
    originalBase64: null,
    edited: null,
    isProcessing: false,
    error: null
  });
  const [prompt, setPrompt] = useState('');
  const [history, setHistory] = useState<EditHistory[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up Blob URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (state.original) URL.revokeObjectURL(state.original);
      if (state.edited) URL.revokeObjectURL(state.edited);
    };
  }, [state.original, state.edited]);

  // Utility to resize and compress image before processing
  const resizeImage = (file: File): Promise<{ url: string; base64: string }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const tempUrl = URL.createObjectURL(file);
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_DIM = 1536; // Limit dimension to ~1.5K for optimal AI performance
          
          if (width > MAX_DIM || height > MAX_DIM) {
            const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas context failed');
          
          ctx.drawImage(img, 0, 0, width, height);
          
          // Export as JPEG with 0.85 quality for good balance of size/quality
          const base64 = canvas.toDataURL('image/jpeg', 0.85);
          
          canvas.toBlob((blob) => {
            URL.revokeObjectURL(tempUrl);
            if (!blob) throw new Error('Blob creation failed');
            resolve({ 
              url: URL.createObjectURL(blob), 
              base64 
            });
          }, 'image/jpeg', 0.85);
        } catch (e) {
          URL.revokeObjectURL(tempUrl);
          reject(e);
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(tempUrl);
        reject(new Error('Image load failed'));
      };
      
      img.src = tempUrl;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setState(prev => ({ 
      ...prev, 
      isProcessing: true, 
      processingStage: 'optimizing',
      error: null 
    }));

    try {
      const { url, base64 } = await resizeImage(file);
      
      setState({
        original: url,
        originalBase64: base64,
        edited: null,
        isProcessing: false,
        error: null
      });
      setPrompt('');
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        isProcessing: false, 
        error: "Failed to load image. Please try another file." 
      }));
    }
  };

  const handleEdit = async () => {
    if (!state.originalBase64 || !prompt.trim()) return;

    setState(prev => ({ 
      ...prev, 
      isProcessing: true, 
      processingStage: 'generating',
      error: null 
    }));
    
    try {
      const { editedImage } = await geminiService.editImage(state.originalBase64, prompt);
      
      // Convert response base64 to Blob URL for display performance
      const res = await fetch(editedImage);
      const blob = await res.blob();
      const editedUrl = URL.createObjectURL(blob);

      setState(prev => ({
        ...prev,
        edited: editedUrl,
        isProcessing: false
      }));

      // Note: Storing blob URL in history means it only lasts for the session. 
      // For persistent history, we'd need to store base64 or IndexedDB.
      setHistory(prev => [
        { prompt, imageUrl: editedUrl, timestamp: Date.now() },
        ...prev.slice(0, 9)
      ]);
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: err.message || "Something went wrong while editing."
      }));
    }
  };

  const resetEditor = () => {
    setState({
      original: null,
      originalBase64: null,
      edited: null,
      isProcessing: false,
      error: null
    });
    setPrompt('');
  };

  const downloadImage = () => {
    const link = document.createElement('a');
    link.href = state.edited || state.original || '';
    link.download = `banana-edit-${Date.now()}.jpg`;
    link.click();
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Editor Canvas Area */}
          <div className="lg:col-span-8 space-y-6">
            <div className="relative group">
              {!state.original ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square md:aspect-video rounded-3xl border-2 border-dashed border-slate-700 bg-slate-900/30 flex flex-col items-center justify-center p-8 text-center cursor-pointer hover:border-amber-500/50 hover:bg-slate-900/50 transition-all duration-300"
                >
                  {state.isProcessing ? (
                     <div className="flex flex-col items-center">
                        <i className="fas fa-circle-notch animate-spin text-3xl text-amber-500 mb-4"></i>
                        <p className="text-amber-500 font-bold">Optimizing Image...</p>
                     </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <i className="fas fa-cloud-arrow-up text-3xl text-amber-500"></i>
                      </div>
                      <h2 className="text-xl font-bold mb-2">Upload your image</h2>
                      <p className="text-slate-500 max-w-xs">JPG, PNG or WEBP. Large images are automatically optimized.</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="relative rounded-3xl overflow-hidden glass-effect p-2 min-h-[300px] flex items-center justify-center bg-black/20">
                  <img 
                    src={state.edited || state.original} 
                    alt="Current work" 
                    className={`max-w-full max-h-[70vh] rounded-2xl transition-all duration-500 object-contain ${state.isProcessing ? 'blur-sm scale-[0.98] opacity-60' : 'blur-0 scale-100 opacity-100'}`}
                  />
                  
                  {state.isProcessing && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                      <div className="bg-slate-950/80 backdrop-blur-md p-6 rounded-2xl border border-amber-500/20 shadow-2xl flex flex-col items-center">
                        <div className="relative w-16 h-16 mb-4">
                          <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
                          <div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <i className="fas fa-wand-magic-sparkles text-amber-500 animate-pulse"></i>
                          </div>
                        </div>
                        <p className="text-amber-500 font-bold tracking-wider text-sm uppercase animate-pulse">
                          {state.processingStage === 'optimizing' ? 'Optimizing Upload...' : 'Gemini Creating...'}
                        </p>
                      </div>
                      
                      {/* Scanning Laser Effect */}
                      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                        <div className="w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent absolute top-0 shadow-[0_0_20px_rgba(245,158,11,0.5)] animate-scan"></div>
                      </div>
                    </div>
                  )}

                  <div className="absolute top-6 right-6 flex gap-2 z-20">
                    <button 
                      onClick={resetEditor}
                      disabled={state.isProcessing}
                      className="w-10 h-10 rounded-full glass-effect flex items-center justify-center text-slate-300 hover:bg-red-500 hover:text-white transition-all shadow-xl disabled:opacity-50"
                    >
                      <i className="fas fa-trash-can"></i>
                    </button>
                    {(state.original || state.edited) && !state.isProcessing && (
                      <button 
                        onClick={downloadImage}
                        className="w-10 h-10 rounded-full glass-effect flex items-center justify-center text-slate-300 hover:bg-amber-500 hover:text-slate-950 transition-all shadow-xl"
                      >
                        <i className="fas fa-download"></i>
                      </button>
                    )}
                  </div>

                  {state.edited && !state.isProcessing && (
                    <div className="absolute bottom-6 left-6 right-6 glass-effect p-3 rounded-xl flex items-center justify-between animate-slide-up z-20">
                      <span className="text-xs font-bold text-amber-500 uppercase flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                        AI Enhanced
                      </span>
                      <button 
                        onClick={() => {
                            // Revert to original by clearing edited state
                            setState(prev => ({ ...prev, edited: null }));
                        }}
                        className="text-xs text-slate-400 hover:text-white font-medium underline"
                      >
                        Revert to Original
                      </button>
                    </div>
                  )}
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*" 
              />
            </div>

            {/* Prompt Controls */}
            <div className="glass-effect p-6 rounded-3xl space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-400 flex items-center gap-2">
                  <i className="fas fa-comment-dots text-amber-500"></i>
                  Magic Prompt
                </label>
                <div className="relative">
                  <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="E.g., 'Add a vintage polaroid filter', 'Remove the objects from the table', 'Make the sky sunset pink'"
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-4 pr-12 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all resize-none min-h-[100px]"
                    disabled={!state.original || state.isProcessing}
                  />
                  <div className="absolute bottom-4 right-4 flex gap-2">
                    <button 
                      onClick={handleEdit}
                      disabled={!state.original || !prompt.trim() || state.isProcessing}
                      className="px-6 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2"
                    >
                      {state.isProcessing ? (
                        <>
                          <i className="fas fa-circle-notch animate-spin"></i>
                          Processing
                        </>
                      ) : (
                        <>
                          <i className="fas fa-wand-magic-sparkles"></i>
                          Generate
                        </>
                      )}
                    </button>
                  </div>
                </div>
                {state.error && (
                  <p className="text-red-400 text-sm mt-2 flex items-center gap-2">
                    <i className="fas fa-circle-exclamation"></i>
                    {state.error}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar / Options Area */}
          <div className="lg:col-span-4 space-y-6">
            <section className="glass-effect p-6 rounded-3xl h-full">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <i className="fas fa-sparkles text-amber-500"></i>
                Popular Presets
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: 'fa-camera-retro', label: 'Retro Film', prompt: 'Apply a warm 70s retro film aesthetic with slight grain' },
                  { icon: 'fa-sun', label: 'Golden Hour', prompt: 'Change the lighting to golden hour sunset glow' },
                  { icon: 'fa-mountain', label: 'Sharpen', prompt: 'Enhance details and sharpen the overall image' },
                  { icon: 'fa-ghost', label: 'Clean BG', prompt: 'Remove distracting elements from the background' },
                  { icon: 'fa-palette', label: 'Neon Vibes', prompt: 'Add vibrant cyberpunk neon colors' },
                  { icon: 'fa-droplet', label: 'B&W Art', prompt: 'Convert to high-contrast artistic black and white' }
                ].map((item, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setPrompt(item.prompt)}
                    className="p-3 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-amber-500/30 hover:bg-slate-800 transition-all text-left flex flex-col items-start gap-2 group"
                    disabled={!state.original || state.isProcessing}
                  >
                    <i className={`fas ${item.icon} text-slate-500 group-hover:text-amber-500 transition-colors`}></i>
                    <span className="text-xs font-semibold text-slate-300">{item.label}</span>
                  </button>
                ))}
              </div>

              {history.length > 0 && (
                <div className="mt-8 pt-8 border-t border-slate-800">
                  <h3 className="font-bold text-lg mb-4 flex items-center justify-between">
                    <span>Recent History</span>
                    <button 
                        onClick={() => {
                            // Cleanup history blob URLs
                            history.forEach(h => URL.revokeObjectURL(h.imageUrl));
                            setHistory([]);
                        }} 
                        className="text-xs text-amber-500 font-bold hover:underline"
                    >
                        Clear All
                    </button>
                  </h3>
                  <div className="space-y-3">
                    {history.map((item, idx) => (
                      <div key={idx} className="flex gap-3 p-2 rounded-xl bg-slate-900/30 border border-slate-800/50">
                        <img src={item.imageUrl} className="w-12 h-12 rounded-lg object-cover" alt="History" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-300 truncate font-medium">{item.prompt}</p>
                          <p className="text-[10px] text-slate-600 mt-1 uppercase font-bold tracking-tighter">
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
      
      <PWAInstallBanner />

      <style>{`
        @keyframes bounce-in {
          0% { transform: scale(0.9); opacity: 0; }
          70% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes scan {
            0% { top: 0; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
        }
        .animate-bounce-in { animation: bounce-in 0.5s ease-out forwards; }
        .animate-slide-up { animation: slide-up 0.4s ease-out forwards; }
        .animate-scan { animation: scan 2s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </Layout>
  );
};

export default App;
