import React, { useState } from 'react';
import { InventoryItem } from '../types';
import { analyzeInventory } from '../services/geminiService';
import { Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AIInsightsProps {
  items: InventoryItem[];
}

const AIInsights: React.FC<AIInsightsProps> = ({ items }) => {
  const [analysis, setAnalysis] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const result = await analyzeInventory(items);
      setAnalysis(result);
      setHasFetched(true);
    } catch (e) {
      setAnalysis("Error analyzing inventory. Please check your API key.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-purple-100 rounded-full text-purple-600 mb-4">
            <Sparkles size={32} />
          </div>
          <h2 className="text-3xl font-bold text-slate-800">Smart Inventory Assistant</h2>
          <p className="text-slate-500 mt-2">Use Gemini AI to analyze your stock levels and uncover insights.</p>
        </header>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex flex-col items-center">
            {!hasFetched && !loading && (
              <div className="text-center py-10">
                <p className="text-slate-600 mb-6 max-w-lg mx-auto">
                  Click the button below to generate a comprehensive report on your current inventory status, including restocking suggestions and value distribution analysis.
                </p>
                <button
                  onClick={handleAnalyze}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-purple-200 transition-all transform hover:scale-105 flex items-center mx-auto"
                >
                  <Sparkles size={20} className="mr-2" />
                  Generate Analysis
                </button>
              </div>
            )}

            {loading && (
              <div className="text-center py-12">
                <RefreshCw size={40} className="animate-spin text-purple-600 mx-auto mb-4" />
                <p className="text-slate-600 font-medium">Gemini is analyzing your data...</p>
              </div>
            )}

            {hasFetched && !loading && (
              <div className="w-full">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-slate-800 flex items-center">
                    <AlertCircle size={20} className="mr-2 text-purple-500" />
                    Analysis Report
                  </h3>
                  <button
                    onClick={handleAnalyze}
                    className="text-sm text-purple-600 hover:text-purple-800 font-medium flex items-center"
                  >
                    <RefreshCw size={14} className="mr-1" />
                    Refresh
                  </button>
                </div>
                <div className="prose prose-slate prose-purple max-w-none bg-slate-50 p-6 rounded-xl border border-slate-100">
                  <ReactMarkdown>{analysis}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
          <div className="bg-slate-50 p-4 text-center text-xs text-slate-400">
            Powered by Google Gemini 2.5 Flash
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInsights;