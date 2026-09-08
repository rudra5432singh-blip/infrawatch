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
          <div className="w-10 h-10 border-2 border-[#1E1E1E] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-[#8D8574]">Retrieving sovereign asset intelligence stream...</p>
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
          className="btn-sovereign-secondary inline-flex items-center gap-2 px-4 py-1.5 text-xs font-mono font-semibold transition-all"
        >
          <ArrowLeft size={14} /> <span>Back to Surveillance</span>
        </Link>
        <span className="text-[11px] font-mono text-[#655E4E] bg-[#EFECE6] border border-[rgba(61,58,52,0.1)] px-3 py-1 rounded-full font-semibold">
          Asset ID: {project.project_id}
        </span>
      </div>

      {/* HEADER HERO SECTION */}
      <div className="glass-card p-5 sm:p-7 md:p-8 rounded-2xl relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Project Identity */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#1E1E1E] text-[#FAF9F5] border border-white/10">
                {project.sector}
              </span>
              <span className="px-3 py-0.5 rounded-full text-[11px] font-mono text-[#3D3A34] bg-[#EFECE6] border border-[rgba(61,58,52,0.1)]">
                {project.state} ({project.district})
              </span>
              <span className="px-3 py-0.5 rounded-full text-[11px] font-mono text-[#655E4E] bg-[#FAF9F5] border border-[rgba(61,58,52,0.1)]">
                Agency: {project.implementing_agency}
              </span>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-normal text-[#1B1C1A] tracking-tight leading-snug">
              {project.project_name}
            </h1>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs text-[#8D8574] font-mono">
              <div>
                <span className="block text-[10px] uppercase text-[#8D8574]">Sanction Date</span>
                <span className="text-[#1B1C1A] font-bold truncate block">{project.start_date || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase text-[#8D8574]">Planned Commission</span>
                <span className="text-[#1B1C1A] font-bold truncate block">{project.expected_end_date || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase text-[#8D8574]">Sanctioned Cost</span>
                <span className="text-[#1B1C1A] font-bold tabular-nums">Rs. {project.sanctioned_cost} Cr</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase text-[#8D8574]">Revised Cost</span>
                <span className="text-[#D97706] font-bold tabular-nums">Rs. {project.revised_cost} Cr</span>
              </div>
            </div>
          </div>

          {/* SVG Circular Risk Score Gauge */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center p-5 rounded-2xl bg-[#FAF9F5]/80 border border-[rgba(61,58,52,0.08)]">
            <div className="relative flex items-center justify-center">
              <svg width="130" height="130" className="transform -rotate-90">
                <circle
                  cx="65"
                  cy="65"
                  r={radius}
                  stroke="rgba(61, 58, 52, 0.08)"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="65"
                  cy="65"
                  r={radius}
                  stroke={project.risk_score >= 65 ? '#C25E3E' : project.risk_score >= 35 ? '#D97706' : '#4A5D4E'}
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeOffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[#1B1C1A] tabular-nums">
                  {project.risk_score}
                </span>
                <span className="text-[9px] sm:text-[10px] uppercase tracking-wider font-bold text-[#8D8574]">
                  {project.risk_category} Risk
                </span>
              </div>
            </div>

            {/* Probability Meters */}
            <div className="grid grid-cols-2 gap-3 w-full mt-3 pt-3 border-t border-[rgba(61,58,52,0.08)] text-center font-mono">
              <div>
                <span className="text-[10px] text-[#8D8574] block font-semibold">Cost Drift</span>
                <span className="text-xs sm:text-sm font-bold text-[#D97706] tabular-nums">
                  {Math.round((predictions?.cost_overrun_probability || 0.2) * 100)}%
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#8D8574] block font-semibold">Schedule Slippage</span>
                <span className="text-xs sm:text-sm font-bold text-[#2C3E50] tabular-nums">
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
          <div className="glass-card p-5 sm:p-6 rounded-2xl space-y-5">
            <h2 className="font-serif text-base sm:text-lg font-bold text-[#1B1C1A] flex items-center gap-2">
              <FileText size={17} className="text-[#D97706]" />
              Operational & Fiscal Telemetry
            </h2>

            {/* Cost Progress Stacked Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#655E4E]">Budget Utilization</span>
                <span className="text-[#1B1C1A] font-bold tabular-nums">
                  Rs. {project.actual_expenditure} / {project.revised_cost} Cr
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-[#EFECE6] border border-[rgba(61,58,52,0.08)] overflow-hidden flex">
                <div 
                  className="bg-[#1E1E1E] h-full transition-all duration-700" 
                  style={{ width: `${Math.min(100, (project.actual_expenditure / project.revised_cost) * 100)}%` }}
                />
              </div>
            </div>

            {/* Physical vs Financial Progress */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-xl bg-[#FAF9F5]/80 border border-[rgba(61,58,52,0.08)] space-y-1">
                <span className="text-[11px] text-[#8D8574] block font-semibold">Physical Progress</span>
                <span className="text-lg sm:text-xl font-bold font-mono text-[#4A5D4E] tabular-nums">
                  {project.physical_progress}%
                </span>
                <div className="w-full h-1.5 rounded-full bg-[#EFECE6] overflow-hidden">
                  <div className="bg-[#4A5D4E] h-full" style={{ width: `${project.physical_progress}%` }} />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF9F5]/80 border border-[rgba(61,58,52,0.08)] space-y-1">
                <span className="text-[11px] text-[#8D8574] block font-semibold">Financial Progress</span>
                <span className="text-lg sm:text-xl font-bold font-mono text-[#D97706] tabular-nums">
                  {project.financial_progress}%
                </span>
                <div className="w-full h-1.5 rounded-full bg-[#EFECE6] overflow-hidden">
                  <div className="bg-[#D97706] h-full" style={{ width: `${project.financial_progress}%` }} />
                </div>
              </div>
            </div>

            {/* Clearances Grid */}
            <div className="pt-1">
              <h3 className="text-xs font-bold text-[#8D8574] uppercase tracking-wider mb-2.5">
                Key Statutory & Execution Parameters
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-[#FAF9F5]/90 border border-[rgba(61,58,52,0.08)] flex justify-between items-center">
                  <span className="text-[#8D8574]">Land Acq:</span>
                  <span className={project.land_acquisition_status === 'Complete' ? 'text-[#2D3A30] font-bold' : 'text-[#D97706] font-bold'}>
                    {project.land_acquisition_status}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#FAF9F5]/90 border border-[rgba(61,58,52,0.08)] flex justify-between items-center">
                  <span className="text-[#8D8574]">Env Clear:</span>
                  <span className={project.environment_clearance === 'Obtained' ? 'text-[#2D3A30] font-bold' : 'text-[#D97706] font-bold'}>
                    {project.environment_clearance}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#FAF9F5]/90 border border-[rgba(61,58,52,0.08)] flex justify-between items-center">
                  <span className="text-[#8D8574]">Revisions:</span>
                  <span className={project.revision_count > 1 ? 'text-[#C25E3E] font-bold' : 'text-[#1B1C1A]'}>
                    {project.revision_count} Rounds
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#FAF9F5]/90 border border-[rgba(61,58,52,0.08)] flex justify-between items-center">
                  <span className="text-[#8D8574]">Extensions:</span>
                  <span className={project.no_of_extensions > 0 ? 'text-[#D97706] font-bold' : 'text-[#1B1C1A]'}>
                    {project.no_of_extensions} Granted
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#FAF9F5]/90 border border-[rgba(61,58,52,0.08)] flex justify-between items-center">
                  <span className="text-[#8D8574]">Quality Audit:</span>
                  <span className="text-[#1E1E1E] font-bold">{project.inspection_score}/10</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#FAF9F5]/90 border border-[rgba(61,58,52,0.08)] flex justify-between items-center">
                  <span className="text-[#8D8574]">Contractor:</span>
                  <span className="text-[#1B1C1A] font-semibold truncate max-w-[110px]" title={project.contractor_name}>
                    {project.contractor_name}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: AI Analysis & SHAP (Level 2: The Monolith Card) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="monolith-card p-5 sm:p-6 rounded-2xl space-y-5">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/10">
              <div>
                <h2 className="font-serif text-base sm:text-lg font-bold text-[#FAF9F5] flex items-center gap-2">
                  <Sparkles size={17} className="text-[#D97706]" />
                  SHAP Explainability Attribution
                </h2>
                <p className="text-xs text-[#A39D8F]">TreeExplainer root-cause attribution</p>
              </div>

              <button
                onClick={handleRunAnalysis}
                disabled={analyzing}
                className="btn-sovereign-primary px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 border border-white/20 hover:border-white/40 shadow-sm shrink-0"
              >
                {analyzing ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Sparkles size={13} className="text-[#D97706]" />}
                <span>{analyzing ? 'Evaluating...' : 'Run Analysis'}</span>
              </button>
            </div>

            {/* AI Summary Text (Newsreader Italic Commentary) */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-[#EFECE6] leading-relaxed">
              <span className="font-serif font-semibold text-[#D97706] mr-1.5 not-italic">AI Forensic Evaluation:</span>
              <span className="font-serif italic">
                "{shapData?.summary || 'Project displays nominal baseline execution patterns with standard operational tolerances.'}"
              </span>
            </div>

            {/* SHAP Factor Impact Bars */}
            <div className="space-y-3 pt-1">
              <h3 className="text-xs font-bold text-[#A39D8F] uppercase tracking-wider">
                Top 5 Risk Determination Drivers
              </h3>
              
              <div className="space-y-2.5">
                {(shapData?.top_drivers || []).map((d) => (
                  <div key={d.feature} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-[#FAF9F5] truncate pr-2">{d.label}</span>
                      <span className={`font-mono font-bold shrink-0 ${d.direction === 'increases_risk' ? 'text-[#C25E3E]' : 'text-[#4A5D4E]'}`}>
                        {d.direction === 'increases_risk' ? `+${d.impact}% Risk` : `-${d.impact}% Stabilizer`}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ${d.direction === 'increases_risk' ? 'bg-[#C25E3E]' : 'bg-[#4A5D4E]'}`}
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
      <div className="glass-card p-5 sm:p-6 rounded-2xl space-y-4">
        <h2 className="font-serif text-base sm:text-lg font-bold text-[#1B1C1A] flex items-center gap-2">
          <AlertTriangle size={17} className="text-[#D97706]" />
          Active Warnings for Project [{project.project_id}]
        </h2>

        {alerts.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[#FAF9F5]/70 border border-[rgba(61,58,52,0.08)] text-center text-xs text-[#8D8574]">
            <CheckCircle size={24} className="text-[#4A5D4E] mx-auto mb-2" />
            No active unresolved alerts recorded for this asset.
          </div>
        ) : (
          <div className="space-y-2.5">
            {alerts.map(a => (
              <div 
                key={a.alert_id} 
                className={`p-3.5 rounded-xl bg-[#FAF9F5]/70 backdrop-blur-xs border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  a.severity === 'CRITICAL' ? 'border-l-4 border-l-[#C25E3E] border-[rgba(194,94,62,0.2)]' :
                  a.severity === 'HIGH' ? 'border-l-4 border-l-[#D97706] border-[rgba(217,119,6,0.2)]' :
                  'border-l-4 border-l-[#2C3E50] border-[rgba(44,62,80,0.2)]'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                      a.severity === 'CRITICAL' ? 'badge-sienna' :
                      a.severity === 'HIGH' ? 'badge-amber' :
                      'badge-indigo'
                    }`}>
                      {a.severity}
                    </span>
                    <span className="text-xs font-bold text-[#1B1C1A]">{a.alert_type}</span>
                  </div>
                  <p className="text-xs text-[#655E4E]">{a.message}</p>
                </div>

                <button
                  onClick={() => handleResolve(a.alert_id)}
                  className="btn-sovereign-secondary px-3.5 py-1 text-xs font-semibold self-start sm:self-auto shrink-0 hover:bg-[#4A5D4E] hover:text-white hover:border-[#4A5D4E] transition-all"
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
