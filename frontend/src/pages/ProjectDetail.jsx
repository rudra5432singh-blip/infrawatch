import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Sparkles, 
  AlertTriangle, 
  Building2, 
  MapPin, 
  Calendar, 
  Clock, 
  DollarSign, 
  FileText,
  Activity,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { getProjectDetail, runProjectPredict, runProjectExplain, getAlerts, resolveAlert } from '../utils/api';

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [shapData, setShapData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    async function loadProject() {
      try {
        setLoading(true);
        const [projRes, predRes, shapRes, alRes] = await Promise.all([
          getProjectDetail(id),
          runProjectPredict(id),
          runProjectExplain(id),
          getAlerts({ limit: 20 })
        ]);
        setProject(projRes);
        setPredictions(predRes.predictions);
        setShapData(shapRes.explanation);
        
        const projAlerts = (alRes.alerts || []).filter(a => a.project_id === id);
        setAlerts(projAlerts);
      } catch (err) {
        console.error('Failed to load project detail:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProject();
  }, [id]);

  const handleRunAnalysis = async () => {
    setAnalyzing(true);
    try {
      const [predRes, shapRes] = await Promise.all([
        runProjectPredict(id),
        runProjectExplain(id)
      ]);
      setPredictions(predRes.predictions);
      setShapData(shapRes.explanation);
    } catch (err) {
      console.error('Analysis failed:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleResolve = async (alertId) => {
    try {
      await resolveAlert(alertId);
      setAlerts(alerts.filter(a => a.alert_id !== alertId));
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    }
  };

  if (loading || !project) {
    return (
      <div className="flex items-center justify-center h-72 sm:h-96">
        <div className="text-center space-y-3">
          <div className="w-9 h-9 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-[#64748B]">Retrieving project intelligence stream...</p>
        </div>
      </div>
    );
  }

  const radius = 55;
  const circumference = 2 * Math.PI * radius;
  const riskVal = project.risk_score || 50;
  const strokeOffset = circumference - (riskVal / 100) * circumference;

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-12">
      {/* Back Button & Top Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link 
          to="/" 
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[#64748B] hover:text-[#0F172A] font-semibold transition-colors"
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
        <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded font-semibold">
          Asset ID: {project.project_id}
        </span>
      </div>

      {/* HEADER HERO SECTION */}
      <div className="intel-card p-4 sm:p-6 md:p-8 rounded-2xl relative overflow-hidden bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Project Identity */}
          <div className="lg:col-span-8 space-y-3 sm:space-y-4">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {project.sector}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono text-slate-700 bg-slate-100 border border-slate-200">
                {project.state} ({project.district})
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono text-slate-700 bg-slate-100 border border-slate-200">
                Agency: {project.implementing_agency}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#0F172A] tracking-tight leading-snug">
              {project.project_name}
            </h1>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs text-[#64748B] font-mono">
              <div>
                <span className="block text-[10px] uppercase text-[#64748B]">Sanction Date</span>
                <span className="text-slate-900 font-bold truncate block">{project.start_date || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase text-[#64748B]">Planned Commission</span>
                <span className="text-slate-900 font-bold truncate block">{project.expected_end_date || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase text-[#64748B]">Sanctioned Cost</span>
                <span className="text-slate-900 font-bold">Rs. {project.sanctioned_cost} Cr</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase text-[#64748B]">Revised Cost</span>
                <span className="text-amber-600 font-bold">Rs. {project.revised_cost} Cr</span>
              </div>
            </div>
          </div>

          {/* SVG Circular Risk Score Gauge */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="relative flex items-center justify-center">
              <svg width="130" height="130" className="transform -rotate-90">
                <circle
                  cx="65"
                  cy="65"
                  r={radius}
                  stroke="#E2E8F0"
                  strokeWidth="9"
                  fill="transparent"
                />
                <circle
                  cx="65"
                  cy="65"
                  r={radius}
                  stroke={project.risk_score >= 65 ? '#E11D48' : project.risk_score >= 35 ? '#D97706' : '#059669'}
                  strokeWidth="9"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeOffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[#0F172A]">
                  {project.risk_score}
                </span>
                <span className="text-[9px] sm:text-[10px] uppercase tracking-wider font-bold text-[#64748B]">
                  {project.risk_category} Risk
                </span>
              </div>
            </div>

            {/* Probability Meters */}
            <div className="grid grid-cols-2 gap-3 w-full mt-3 pt-2.5 border-t border-slate-200 text-center font-mono">
              <div>
                <span className="text-[10px] text-[#64748B] block font-semibold">Cost Overrun</span>
                <span className="text-xs sm:text-sm font-bold text-amber-600">
                  {Math.round((predictions?.cost_overrun_probability || 0.2) * 100)}%
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#64748B] block font-semibold">Time Overrun</span>
                <span className="text-xs sm:text-sm font-bold text-indigo-600">
                  {Math.round((predictions?.time_overrun_probability || 0.3) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MIDDLE SECTION — TWO COLUMNS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Project Info & Parameters */}
        <div className="lg:col-span-6 space-y-6">
          <div className="intel-card p-4 sm:p-6 rounded-xl space-y-4 sm:space-y-5">
            <h2 className="text-sm sm:text-base font-bold text-[#0F172A] flex items-center gap-2">
              <FileText size={17} className="text-indigo-600" />
              Operational & Financial Indicators
            </h2>

            {/* Cost Progress Stacked Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#64748B]">Budget Utilization</span>
                <span className="text-slate-900 font-bold">
                  Rs. {project.actual_expenditure} / {project.revised_cost} Cr
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex">
                <div 
                  className="bg-indigo-600 h-full transition-all" 
                  style={{ width: `${Math.min(100, (project.actual_expenditure / project.revised_cost) * 100)}%` }}
                />
              </div>
            </div>

            {/* Physical vs Financial Progress */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[11px] text-[#64748B] block font-semibold">Physical Progress</span>
                <span className="text-lg sm:text-xl font-bold font-mono text-emerald-600">
                  {project.physical_progress}%
                </span>
                <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                  <div className="bg-emerald-500 h-full" style={{ width: `${project.physical_progress}%` }} />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[11px] text-[#64748B] block font-semibold">Financial Progress</span>
                <span className="text-lg sm:text-xl font-bold font-mono text-amber-600">
                  {project.financial_progress}%
                </span>
                <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                  <div className="bg-amber-500 h-full" style={{ width: `${project.financial_progress}%` }} />
                </div>
              </div>
            </div>

            {/* Clearances Grid */}
            <div className="pt-1">
              <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2.5">
                Key CUF Statutory & Execution Metrics
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 rounded bg-slate-50 border border-slate-200 flex justify-between">
                  <span className="text-[#64748B]">Land Acq:</span>
                  <span className={project.land_acquisition_status === 'Complete' ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                    {project.land_acquisition_status}
                  </span>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-200 flex justify-between">
                  <span className="text-[#64748B]">Env Clear:</span>
                  <span className={project.environment_clearance === 'Obtained' ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                    {project.environment_clearance}
                  </span>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-200 flex justify-between">
                  <span className="text-[#64748B]">Revisions:</span>
                  <span className={project.revision_count > 1 ? 'text-rose-700 font-bold' : 'text-slate-900'}>
                    {project.revision_count} Rounds
                  </span>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-200 flex justify-between">
                  <span className="text-[#64748B]">Extensions:</span>
                  <span className={project.no_of_extensions > 0 ? 'text-amber-700 font-bold' : 'text-slate-900'}>
                    {project.no_of_extensions} Granted
                  </span>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-200 flex justify-between">
                  <span className="text-[#64748B]">Quality:</span>
                  <span className="text-indigo-700 font-bold">{project.inspection_score}/10</span>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-200 flex justify-between">
                  <span className="text-[#64748B]">Contractor:</span>
                  <span className="text-slate-900 font-semibold truncate max-w-[110px]" title={project.contractor_name}>
                    {project.contractor_name}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: AI Analysis & SHAP */}
        <div className="lg:col-span-6 space-y-6">
          <div className="intel-card p-4 sm:p-6 rounded-xl space-y-4 sm:space-y-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-[#0F172A] flex items-center gap-1.5">
                  <Sparkles size={17} className="text-indigo-600" />
                  SHAP Explainability Attribution
                </h2>
                <p className="text-xs text-[#64748B]">TreeExplainer root-cause weights</p>
              </div>

              <button
                onClick={handleRunAnalysis}
                disabled={analyzing}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 transition-colors shadow-sm shrink-0"
              >
                {analyzing ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Sparkles size={13} />}
                <span>{analyzing ? 'Evaluating...' : 'Run Analysis'}</span>
              </button>
            </div>

            {/* AI Summary Text */}
            <div className="p-3 rounded-lg bg-indigo-50/80 border border-indigo-100 text-xs text-slate-800 leading-relaxed font-medium">
              <span className="font-bold text-indigo-700 mr-1">AI Interpretation:</span>
              {shapData?.summary || 'Project displays nominal baseline execution patterns with standard operational tolerances.'}
            </div>

            {/* SHAP Factor Impact Bars */}
            <div className="space-y-2.5 pt-1">
              <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                Top 5 Risk Determination Drivers
              </h3>
              
              <div className="space-y-2">
                {(shapData?.top_drivers || []).map((d) => (
                  <div key={d.feature} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-900 truncate pr-2">{d.label}</span>
                      <span className={`font-mono font-bold shrink-0 ${d.direction === 'increases_risk' ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {d.direction === 'increases_risk' ? `+${d.impact}% Risk` : `-${d.impact}% Stabilizer`}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ${d.direction === 'increases_risk' ? 'bg-rose-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(100, Math.max(10, d.impact * 1.5))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: ACTIVE ALERTS */}
      <div className="intel-card p-4 sm:p-6 rounded-xl space-y-4">
        <h2 className="text-sm sm:text-base font-bold text-[#0F172A] flex items-center gap-2">
          <AlertTriangle size={17} className="text-amber-600" />
          Active Warnings for Project [{project.project_id}]
        </h2>

        {alerts.length === 0 ? (
          <div className="p-4 sm:p-6 rounded-lg bg-slate-50 border border-slate-200 text-center text-xs text-[#64748B]">
            <CheckCircle size={22} className="text-emerald-600 mx-auto mb-1.5" />
            No active unresolved alerts recorded for this asset.
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map(a => (
              <div key={a.alert_id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      a.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800' :
                      a.severity === 'HIGH' ? 'bg-amber-100 text-amber-800' :
                      'bg-indigo-100 text-indigo-800'
                    }`}>
                      {a.severity}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{a.alert_type}</span>
                  </div>
                  <p className="text-xs text-[#475569]">{a.message}</p>
                </div>

                <button
                  onClick={() => handleResolve(a.alert_id)}
                  className="px-3 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-600 hover:text-white transition-colors text-xs font-semibold self-start sm:self-auto shrink-0"
                >
                  Resolve
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
