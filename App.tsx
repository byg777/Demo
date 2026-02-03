import React, { useState, useCallback, useRef } from 'react';
import { ArrowRightLeft, Copy, Download, Sparkles, X, Clipboard, ArrowRight } from 'lucide-react';
import { Language, TranslationState } from './types';
import { translateText } from './services/geminiService';
import { Button } from './components/Button';
import { LanguageSelector } from './components/LanguageSelector';
// We use html2canvas and jspdf from window/cdn in a real scenario, or assume they are installed.
// For this strict code generation, we will use a dynamic import approach or assume availability.
// Using standard library approach for robust PDF generation of unicode characters (rendering as image).
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const App: React.FC = () => {
  const [state, setState] = useState<TranslationState>({
    sourceLang: Language.AUTO,
    targetLang: Language.ENGLISH,
    inputText: '',
    outputText: '',
    isTranslating: false,
    error: null,
  });

  const outputRef = useRef<HTMLDivElement>(null);

  const handleTranslate = useCallback(async () => {
    if (!state.inputText.trim()) return;

    setState(prev => ({ ...prev, isTranslating: true, error: null }));
    try {
      const result = await translateText(state.inputText, state.sourceLang, state.targetLang);
      setState(prev => ({ ...prev, outputText: result, isTranslating: false }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isTranslating: false, 
        error: "Translation failed. Please check your connection and try again." 
      }));
    }
  }, [state.inputText, state.sourceLang, state.targetLang]);

  const handleSwapLanguages = () => {
    if (state.sourceLang === Language.AUTO) {
        setState(prev => ({
            ...prev,
            sourceLang: prev.targetLang,
            targetLang: Language.ENGLISH, // Default fall back
            inputText: prev.outputText,
            outputText: prev.inputText,
        }));
    } else {
        setState(prev => ({
            ...prev,
            sourceLang: prev.targetLang,
            targetLang: prev.sourceLang,
            inputText: prev.outputText,
            outputText: prev.inputText,
        }));
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setState(prev => ({ ...prev, inputText: text }));
    } catch (err) {
      console.error('Failed to read clipboard contents: ', err);
    }
  };

  const handleClear = () => {
    setState(prev => ({ ...prev, inputText: '', outputText: '', error: null }));
  };

  const handleExportPDF = async () => {
    if (!state.outputText || !outputRef.current) return;

    try {
        const element = outputRef.current;
        // Use html2canvas to capture the visual representation to avoid font issues with Chinese characters in jsPDF
        const canvas = await html2canvas(element, {
            scale: 2, // Improve quality
            backgroundColor: '#ffffff',
            logging: false,
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4',
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pdfWidth - 20; // 10mm margin on each side
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.setFontSize(18);
        pdf.text('Translation Result', 10, 15);
        pdf.setFontSize(10);
        pdf.setTextColor(100);
        pdf.text(`Source: ${state.sourceLang} | Target: ${state.targetLang}`, 10, 22);
        
        let yPos = 30;
        
        // If the image is taller than one page, we need complex logic, but for this demo we'll assume it fits 
        // or just scale it. A production app would slice the image.
        if (imgHeight > pdfHeight - 40) {
            // Simple scaling if too big (basic handling)
            const ratio = (pdfHeight - 40) / imgHeight;
            pdf.addImage(imgData, 'PNG', 10, yPos, imgWidth * ratio, (pdfHeight - 40));
        } else {
            pdf.addImage(imgData, 'PNG', 10, yPos, imgWidth, imgHeight);
        }

        pdf.save('gemini-translation.pdf');
    } catch (err) {
        console.error("PDF Export failed:", err);
        alert("Failed to generate PDF");
    }
  };

  const sourceOptions = Object.values(Language);
  const targetOptions = Object.values(Language).filter(l => l !== Language.AUTO);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
                <Sparkles className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Gemini Translator
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <a 
               href="#" 
               className="text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
               onClick={(e) => { e.preventDefault(); alert("Pro features coming soon!"); }}
            >
              History
            </a>
            <div className="h-4 w-px bg-gray-300"></div>
            <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded-full border border-green-200">
                Gemini 3 Flash
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 flex flex-col md:flex-row h-[calc(100vh-12rem)] min-h-[600px]">
            
          {/* Source Section */}
          <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-gray-200 bg-white">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <LanguageSelector 
                  value={state.sourceLang} 
                  options={sourceOptions} 
                  onChange={(l) => setState(prev => ({ ...prev, sourceLang: l }))} 
                />
                <div className="flex items-center gap-1">
                     {state.inputText && (
                        <Button variant="icon" onClick={handleClear} title="Clear text">
                            <X size={18} />
                        </Button>
                    )}
                    <Button variant="icon" onClick={handlePaste} title="Paste from clipboard">
                        <Clipboard size={18} />
                    </Button>
                </div>
            </div>
            <div className="flex-1 relative group">
                <textarea
                    className="w-full h-full p-6 text-lg resize-none focus:outline-none bg-transparent"
                    placeholder="Enter text to translate..."
                    value={state.inputText}
                    onChange={(e) => setState(prev => ({ ...prev, inputText: e.target.value }))}
                    spellCheck="false"
                />
                {/* Translate Button (Mobile/Floating for larger screens) */}
                <div className="absolute bottom-6 right-6 md:right-8 z-20">
                    <Button 
                        onClick={handleTranslate} 
                        isLoading={state.isTranslating}
                        disabled={!state.inputText.trim()}
                        className="rounded-full px-6 shadow-indigo-200 shadow-lg"
                    >
                        {state.isTranslating ? 'Translating...' : 'Translate'}
                        {!state.isTranslating && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Button>
                </div>
            </div>
            <div className="p-3 border-t border-gray-100 text-xs text-gray-400 flex justify-between items-center bg-gray-50">
                 <span>{state.inputText.length} chars</span>
                 {state.inputText && <Button variant="ghost" className="text-xs py-1" onClick={() => handleCopy(state.inputText)}>Copy</Button>}
            </div>
          </div>

          {/* Swap Button (Absolute centered) */}
          <div className="absolute left-1/2 top-[300px] md:top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 hidden md:block">
            <button 
                onClick={handleSwapLanguages}
                className="bg-white border border-gray-200 p-2.5 rounded-full shadow-lg hover:bg-gray-50 hover:text-indigo-600 transition-all hover:scale-110 active:scale-95"
            >
                <ArrowRightLeft size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Target Section */}
          <div className="flex-1 flex flex-col bg-gray-50/30">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                 <LanguageSelector 
                  value={state.targetLang} 
                  options={targetOptions} 
                  onChange={(l) => setState(prev => ({ ...prev, targetLang: l }))} 
                />
                <div className="flex items-center gap-1">
                    <Button 
                        variant="icon" 
                        onClick={handleExportPDF} 
                        disabled={!state.outputText} 
                        title="Export to PDF"
                        className={state.outputText ? "text-indigo-600 bg-indigo-50" : ""}
                    >
                        <Download size={18} />
                    </Button>
                     <Button 
                        variant="icon" 
                        onClick={() => handleCopy(state.outputText)} 
                        disabled={!state.outputText}
                        title="Copy translation"
                     >
                        <Copy size={18} />
                    </Button>
                </div>
            </div>
            <div className="flex-1 relative overflow-auto p-6" ref={outputRef}>
                 {state.isTranslating ? (
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="space-y-4 w-3/4">
                             <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                             <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
                             <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
                        </div>
                    </div>
                 ) : state.error ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-red-500 p-4">
                        <p>{state.error}</p>
                        <Button variant="ghost" onClick={handleTranslate} className="mt-2">Retry</Button>
                    </div>
                 ) : state.outputText ? (
                    <div className="prose max-w-none text-lg text-gray-800 leading-relaxed whitespace-pre-wrap">
                        {state.outputText}
                    </div>
                 ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <div className="mb-4 p-4 bg-white rounded-full shadow-sm">
                             <ArrowRightLeft className="h-8 w-8 text-gray-300" />
                        </div>
                        <p>Translation will appear here</p>
                    </div>
                 )}
            </div>
            {state.outputText && (
                 <div className="p-3 border-t border-gray-100 text-xs text-gray-400 flex justify-end bg-gray-50">
                    <span>Generated by Gemini</span>
                 </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;