import React, { useState, useEffect } from 'react';
import { BarChart3, ShieldCheck, Zap, TrendingUp, Layers } from 'lucide-react';
import { getBenchmarks, getStatsSector } from '../utils/api';

export default function Benchmarks() {
  const [benchmarks, setBenchmarks] = useState(null);
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [bRes, sRes] = await Promise.all([
          getBenchmarks(),
          getStatsSector()
        ]);
        setBenchmarks(bRes);
        setSectors(sRes);
      } catch (err) {
        console.error('Failed to load benchmarks:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const costXgb = benchmarks?.cost_overrun_model?.xgboost || { accuracy: 0.9662, precision: 0.9104, recall: 0.9104, f1: 0.9104, roc_auc: 0.9853 };
  const costLr = benchmarks?.cost_overrun_model?.logistic_regression_baseline || { accuracy: 0.9465, precision: 0.9286, recall: 0.7761, f1: 0.8455, roc_auc: 0.9766 };

  const timeXgb = benchmarks?.time_overrun_model?.xgboost || { accuracy: 0.5577, precision: 0.5849, recall: 0.6425, f1: 0.6123, roc_auc: 0.5463 };
  const timeLr = benchmarks?.time_overrun_model?.logistic_regression_baseline || { accuracy: 0.5352, precision: 0.5470, recall: 0.8446, f1: 0.6640, roc_auc: 0.4870 };

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-12">
      {/* HEADER */}
      <div className="glass-card p-5 sm:p-7 rounded-2xl">
        <h1 className="font-serif text-xl sm:text-2xl font-bold text-[#1B1C1A] flex items-center gap-2.5">
          <BarChart3 size={22} className="text-[#D97706]" />
          Model Benchmarks & Sector Scorecard
        </h1>
        <p className="text-xs text-[#8D8574] mt-1.5">
          Comparative empirical evaluation: Supervised Gradient Boosting (XGBoost) vs Baseline (Logistic Regression) across CUF project corpora
        </p>
      </div>

      {/* SECTION 1: MODEL COMPARISON CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        {/* Cost Overrun Benchmark */}
        <div className="glass-card p-5 sm:p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[rgba(61,58,52,0.08)]">
            <h2 className="font-serif text-sm sm:text-base font-bold text-[#1B1C1A] flex items-center gap-2">
              <Zap size={16} className="text-[#D97706]" />
              Model 1: Cost Overrun Classifier
            </h2>
            <span className="badge-nominal text-[10px] sm:text-xs font-mono font-bold px-2.5 py-0.5 rounded-full">
              +1.97% Delta
            </span>
          </div>

          <div className="overflow-x-auto -mx-5 sm:mx-0">
            <table className="w-full text-left text-xs font-mono min-w-[320px] sm:min-w-full">
              <thead className="bg-[#FAF9F5]/80 text-[#655E4E] font-semibold">
                <tr>
                  <th className="py-2.5 px-3.5">Metric</th>
                  <th className="py-2.5 px-3.5 text-[#1E1E1E] font-bold bg-[rgba(217,119,6,0.08)] rounded-t-lg">XGBoost</th>
                  <th className="py-2.5 px-3.5 text-[#8D8574]">Logistic Reg</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(61,58,52,0.06)] tabular-nums">
                <tr>
                  <td className="py-2.5 px-3.5 font-sans font-medium text-[#1B1C1A]">Accuracy</td>
                  <td className="py-2.5 px-3.5 text-[#2D3A30] font-bold bg-[rgba(217,119,6,0.04)]">{(costXgb.accuracy * 100).toFixed(2)}%</td>
                  <td className="py-2.5 px-3.5 text-[#655E4E]">{(costLr.accuracy * 100).toFixed(2)}%</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3.5 font-sans font-medium text-[#1B1C1A]">Precision</td>
                  <td className="py-2.5 px-3.5 text-[#2D3A30] font-bold bg-[rgba(217,119,6,0.04)]">{(costXgb.precision * 100).toFixed(2)}%</td>
                  <td className="py-2.5 px-3.5 text-[#655E4E]">{(costLr.precision * 100).toFixed(2)}%</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3.5 font-sans font-medium text-[#1B1C1A]">Recall</td>
                  <td className="py-2.5 px-3.5 text-[#2D3A30] font-bold bg-[rgba(217,119,6,0.04)]">{(costXgb.recall * 100).toFixed(2)}%</td>
                  <td className="py-2.5 px-3.5 text-[#655E4E]">{(costLr.recall * 100).toFixed(2)}%</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3.5 font-sans font-medium text-[#1B1C1A]">F1-Score</td>
                  <td className="py-2.5 px-3.5 text-[#2D3A30] font-bold bg-[rgba(217,119,6,0.04)]">{(costXgb.f1 * 100).toFixed(2)}%</td>
                  <td className="py-2.5 px-3.5 text-[#655E4E]">{(costLr.f1 * 100).toFixed(2)}%</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3.5 font-sans font-medium text-[#1B1C1A]">ROC-AUC</td>
                  <td className="py-2.5 px-3.5 text-[#2D3A30] font-bold bg-[rgba(217,119,6,0.04)] rounded-b-lg">{costXgb.roc_auc.toFixed(4)}</td>
                  <td className="py-2.5 px-3.5 text-[#655E4E]">{costLr.roc_auc.toFixed(4)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Time Overrun Benchmark */}
        <div className="glass-card p-5 sm:p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[rgba(61,58,52,0.08)]">
            <h2 className="font-serif text-sm sm:text-base font-bold text-[#1B1C1A] flex items-center gap-2">
              <Zap size={16} className="text-[#2C3E50]" />
              Model 2: Schedule Delay Classifier
            </h2>
            <span className="badge-nominal text-[10px] sm:text-xs font-mono font-bold px-2.5 py-0.5 rounded-full">
              +2.25% Delta
            </span>
          </div>

          <div className="overflow-x-auto -mx-5 sm:mx-0">
            <table className="w-full text-left text-xs font-mono min-w-[320px] sm:min-w-full">
              <thead className="bg-[#FAF9F5]/80 text-[#655E4E] font-semibold">
                <tr>
                  <th className="py-2.5 px-3.5">Metric</th>
                  <th className="py-2.5 px-3.5 text-[#1E1E1E] font-bold bg-[rgba(44,62,80,0.08)] rounded-t-lg">XGBoost</th>
                  <th className="py-2.5 px-3.5 text-[#8D8574]">Logistic Reg</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(61,58,52,0.06)] tabular-nums">
                <tr>
                  <td className="py-2.5 px-3.5 font-sans font-medium text-[#1B1C1A]">Accuracy</td>
                  <td className="py-2.5 px-3.5 text-[#2D3A30] font-bold bg-[rgba(44,62,80,0.04)]">{(timeXgb.accuracy * 100).toFixed(2)}%</td>
                  <td className="py-2.5 px-3.5 text-[#655E4E]">{(timeLr.accuracy * 100).toFixed(2)}%</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3.5 font-sans font-medium text-[#1B1C1A]">Precision</td>
                  <td className="py-2.5 px-3.5 text-[#2D3A30] font-bold bg-[rgba(44,62,80,0.04)]">{(timeXgb.precision * 100).toFixed(2)}%</td>
                  <td className="py-2.5 px-3.5 text-[#655E4E]">{(timeLr.precision * 100).toFixed(2)}%</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3.5 font-sans font-medium text-[#1B1C1A]">Recall</td>
                  <td className="py-2.5 px-3.5 text-[#2D3A30] font-bold bg-[rgba(44,62,80,0.04)]">{(timeXgb.recall * 100).toFixed(2)}%</td>
                  <td className="py-2.5 px-3.5 text-[#655E4E]">{(timeLr.recall * 100).toFixed(2)}%</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3.5 font-sans font-medium text-[#1B1C1A]">F1-Score</td>
                  <td className="py-2.5 px-3.5 text-[#2D3A30] font-bold bg-[rgba(44,62,80,0.04)]">{(timeXgb.f1 * 100).toFixed(2)}%</td>
                  <td className="py-2.5 px-3.5 text-[#655E4E]">{(timeLr.f1 * 100).toFixed(2)}%</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3.5 font-sans font-medium text-[#1B1C1A]">ROC-AUC</td>
                  <td className="py-2.5 px-3.5 text-[#2D3A30] font-bold bg-[rgba(44,62,80,0.04)] rounded-b-lg">{timeXgb.roc_auc.toFixed(4)}</td>
                  <td className="py-2.5 px-3.5 text-[#655E4E]">{timeLr.roc_auc.toFixed(4)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SECTION 2: SECTOR BENCHMARK TABLE */}
      <div className="glass-card p-5 sm:p-7 rounded-2xl space-y-4">
        <h2 className="font-serif text-base sm:text-lg font-bold text-[#1B1C1A]">Cross-Sector Comparison Table</h2>
        <div className="overflow-x-auto -mx-5 sm:mx-0">
          <table className="w-full text-left text-xs min-w-[580px] sm:min-w-full">
            <thead className="bg-[#FAF9F5]/80 text-[#655E4E] font-semibold border-b border-[rgba(61,58,52,0.08)]">
              <tr>
                <th className="py-3 px-4">Sector Name</th>
                <th className="py-3 px-4 font-mono">Projects</th>
                <th className="py-3 px-4 font-mono">Cost Overrun</th>
                <th className="py-3 px-4 font-mono">Time Delay</th>
                <th className="py-3 px-4 font-mono">Risk Index</th>
                <th className="py-3 px-4 font-mono">Sanctioned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(61,58,52,0.06)] font-mono tabular-nums">
              {sectors.map(s => (
                <tr key={s.sector} className="hover:bg-[rgba(239,236,230,0.5)] transition-colors">
                  <td className="py-3 px-4 font-sans font-bold text-[#1B1C1A] truncate max-w-[170px]">{s.sector}</td>
                  <td className="py-3 px-4">{s.project_count}</td>
                  <td className="py-3 px-4 text-[#D97706] font-bold">+{s.avg_cost_overrun}%</td>
                  <td className="py-3 px-4 text-[#2C3E50] font-bold">+{s.avg_time_overrun}%</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                      s.avg_risk_score >= 60 ? 'badge-sienna' :
                      s.avg_risk_score >= 40 ? 'badge-amber' :
                      'badge-nominal'
                    }`}>
                      {s.avg_risk_score}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#1B1C1A]">Rs. {s.total_sanctioned.toLocaleString()} Cr</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
