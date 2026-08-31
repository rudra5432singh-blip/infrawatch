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
      <div className="intel-card p-4 sm:p-6 rounded-xl bg-white">
        <h1 className="text-lg sm:text-xl font-bold text-[#0F172A] flex items-center gap-2">
          <BarChart3 size={20} className="text-indigo-600" />
          Model Benchmarks & Sector Scorecard
        </h1>
        <p className="text-xs text-[#64748B] mt-1">
          Comparative empirical evaluation: Supervised Gradient Boosting (XGBoost) vs Baseline (Logistic Regression)
        </p>
      </div>

      {/* SECTION 1: MODEL COMPARISON CARD */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Cost Overrun Benchmark */}
        <div className="intel-card p-4 sm:p-6 rounded-xl space-y-3 sm:space-y-4 bg-white">
          <div className="flex items-center justify-between pb-2.5 border-b border-[#E2E8F0]">
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Zap size={15} className="text-amber-600" />
              Model 1: Cost Overrun Classifier
            </h2>
            <span className="text-[10px] sm:text-xs font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              +1.97% Delta
            </span>
          </div>

          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-left text-xs font-mono min-w-[320px] sm:min-w-full">
              <thead className="bg-slate-50 text-[#475569] font-semibold">
                <tr>
                  <th className="py-2 px-3">Metric</th>
                  <th className="py-2 px-3 text-indigo-700 font-bold bg-indigo-50/50">XGBoost</th>
                  <th className="py-2 px-3 text-[#64748B]">Logistic Reg</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2 px-3 font-sans font-medium text-slate-900">Accuracy</td>
                  <td className="py-2 px-3 text-emerald-700 font-bold bg-indigo-50/30">{(costXgb.accuracy * 100).toFixed(2)}%</td>
                  <td className="py-2 px-3 text-slate-600">{(costLr.accuracy * 100).toFixed(2)}%</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-sans font-medium text-slate-900">Precision</td>
                  <td className="py-2 px-3 text-emerald-700 font-bold bg-indigo-50/30">{(costXgb.precision * 100).toFixed(2)}%</td>
                  <td className="py-2 px-3 text-slate-600">{(costLr.precision * 100).toFixed(2)}%</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-sans font-medium text-slate-900">Recall</td>
                  <td className="py-2 px-3 text-emerald-700 font-bold bg-indigo-50/30">{(costXgb.recall * 100).toFixed(2)}%</td>
                  <td className="py-2 px-3 text-slate-600">{(costLr.recall * 100).toFixed(2)}%</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-sans font-medium text-slate-900">F1-Score</td>
                  <td className="py-2 px-3 text-emerald-700 font-bold bg-indigo-50/30">{(costXgb.f1 * 100).toFixed(2)}%</td>
                  <td className="py-2 px-3 text-slate-600">{(costLr.f1 * 100).toFixed(2)}%</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-sans font-medium text-slate-900">ROC-AUC</td>
                  <td className="py-2 px-3 text-emerald-700 font-bold bg-indigo-50/30">{costXgb.roc_auc.toFixed(4)}</td>
                  <td className="py-2 px-3 text-slate-600">{costLr.roc_auc.toFixed(4)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Time Overrun Benchmark */}
        <div className="intel-card p-4 sm:p-6 rounded-xl space-y-3 sm:space-y-4 bg-white">
          <div className="flex items-center justify-between pb-2.5 border-b border-[#E2E8F0]">
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Zap size={15} className="text-indigo-600" />
              Model 2: Schedule Delay Classifier
            </h2>
            <span className="text-[10px] sm:text-xs font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              +2.25% Delta
            </span>
          </div>

          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-left text-xs font-mono min-w-[320px] sm:min-w-full">
              <thead className="bg-slate-50 text-[#475569] font-semibold">
                <tr>
                  <th className="py-2 px-3">Metric</th>
                  <th className="py-2 px-3 text-indigo-700 font-bold bg-indigo-50/50">XGBoost</th>
                  <th className="py-2 px-3 text-[#64748B]">Logistic Reg</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2 px-3 font-sans font-medium text-slate-900">Accuracy</td>
                  <td className="py-2 px-3 text-emerald-700 font-bold bg-indigo-50/30">{(timeXgb.accuracy * 100).toFixed(2)}%</td>
                  <td className="py-2 px-3 text-slate-600">{(timeLr.accuracy * 100).toFixed(2)}%</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-sans font-medium text-slate-900">Precision</td>
                  <td className="py-2 px-3 text-emerald-700 font-bold bg-indigo-50/30">{(timeXgb.precision * 100).toFixed(2)}%</td>
                  <td className="py-2 px-3 text-slate-600">{(timeLr.precision * 100).toFixed(2)}%</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-sans font-medium text-slate-900">Recall</td>
                  <td className="py-2 px-3 text-emerald-700 font-bold bg-indigo-50/30">{(timeXgb.recall * 100).toFixed(2)}%</td>
                  <td className="py-2 px-3 text-slate-600">{(timeLr.recall * 100).toFixed(2)}%</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-sans font-medium text-slate-900">F1-Score</td>
                  <td className="py-2 px-3 text-emerald-700 font-bold bg-indigo-50/30">{(timeXgb.f1 * 100).toFixed(2)}%</td>
                  <td className="py-2 px-3 text-slate-600">{(timeLr.f1 * 100).toFixed(2)}%</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-sans font-medium text-slate-900">ROC-AUC</td>
                  <td className="py-2 px-3 text-emerald-700 font-bold bg-indigo-50/30">{timeXgb.roc_auc.toFixed(4)}</td>
                  <td className="py-2 px-3 text-slate-600">{timeLr.roc_auc.toFixed(4)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SECTION 2: SECTOR BENCHMARK TABLE */}
      <div className="intel-card p-4 sm:p-6 rounded-xl space-y-4 bg-white">
        <h2 className="text-sm sm:text-base font-bold text-[#0F172A]">Cross-Sector Comparison Table</h2>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-left text-xs min-w-[580px] sm:min-w-full">
            <thead className="bg-slate-50 text-[#475569] font-semibold border-b border-[#E2E8F0]">
              <tr>
                <th className="py-2.5 px-3 sm:px-4">Sector Name</th>
                <th className="py-2.5 px-3 sm:px-4 font-mono">Projects</th>
                <th className="py-2.5 px-3 sm:px-4 font-mono">Cost Overrun</th>
                <th className="py-2.5 px-3 sm:px-4 font-mono">Time Delay</th>
                <th className="py-2.5 px-3 sm:px-4 font-mono">Risk Index</th>
                <th className="py-2.5 px-3 sm:px-4 font-mono">Sanctioned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {sectors.map(s => (
                <tr key={s.sector} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 sm:px-4 font-sans font-bold text-slate-900 truncate max-w-[150px]">{s.sector}</td>
                  <td className="py-2.5 px-3 sm:px-4">{s.project_count}</td>
                  <td className="py-2.5 px-3 sm:px-4 text-amber-600 font-bold">+{s.avg_cost_overrun}%</td>
                  <td className="py-2.5 px-3 sm:px-4 text-indigo-600 font-bold">+{s.avg_time_overrun}%</td>
                  <td className="py-2.5 px-3 sm:px-4">
                    <span className={`px-2 py-0.5 rounded font-bold ${s.avg_risk_score >= 60 ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'text-slate-800'}`}>
                      {s.avg_risk_score}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 sm:px-4">Rs. {s.total_sanctioned.toLocaleString()} Cr</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
