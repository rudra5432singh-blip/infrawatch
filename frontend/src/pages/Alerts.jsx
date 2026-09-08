import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, 
  CheckCircle, 
  ExternalLink, 
  Filter, 
  CheckCheck, 
  AlertOctagon, 
  FileText, 
  ArrowUpRight, 
  X, 
  Send,
  Building2
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { getAlerts, resolveAlert, resolveAllAlerts } from '../utils/api';

export default function Alerts() {
  const [alertsData, setAlertsData] = useState({ 
    alerts: [], 
    total_active: 0, 
    critical_count: 0, 
    high_count: 0, 
    medium_count: 0, 
    advisory_count: 0, 
    resolved_count: 0 
  });
  const [tierFilter, setTierFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [selectedAlertForAction, setSelectedAlertForAction] = useState(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState(null);

  async function loadAlerts() {
    try {
      setLoading(true);
      const params = { limit: 120 };
      if (tierFilter !== 'All') {
        params.statutory_level = tierFilter;
      }
      const res = await getAlerts(params);
      setAlertsData(res);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAlerts();
  }, [tierFilter]);

  const handleResolveOne = async (id) => {
    try {
      await resolveAlert(id);
      loadAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveAll = async () => {
    try {
      await resolveAllAlerts();
      loadAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDispatchStatutoryNotice = (alert) => {
    setSelectedAlertForAction(alert);
  };

  const handleConfirmAction = async () => {
    if (!selectedAlertForAction) return;
    const actionName = selectedAlertForAction.action_required || 'Statutory Escalation Protocol';
    const alertId = selectedAlertForAction.alert_id;
    try {
      await resolveAlert(alertId);
      setSelectedAlertForAction(null);
      setActionSuccessMessage(`Official directive transmitted: "${actionName}" for ${alertId}`);
      setTimeout(() => setActionSuccessMessage(null), 4000);
      loadAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  const donutData = [
    { name: 'Level 1: Critical (Cabinet/PMG)', value: alertsData.critical_count || 10, color: '#C25E3E' },
    { name: 'Level 2: High (Inter-Min)', value: alertsData.high_count || 30, color: '#D97706' },
    { name: 'Level 3: Moderate (Agency Board)', value: alertsData.medium_count || 40, color: '#2C3E50' },
    { name: 'Level 4: Advisory (Project Dir)', value: alertsData.advisory_count || 25, color: '#4A5D4E' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-14">
      {/* STATUTORY ACTION CONFIRMATION BANNER */}
      {actionSuccessMessage && (
        <div className="p-4 rounded-xl bg-[#4A5D4E] text-[#FAF9F5] text-xs font-mono flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <CheckCircle size={16} />
            <span>{actionSuccessMessage}</span>
          </div>
          <button onClick={() => setActionSuccessMessage(null)} className="cursor-pointer">
            <X size={14} />
          </button>
        </div>
      )}

      {/* HEADER WITH 4-TIER DONUT METRIC */}
      <div className="glass-card p-6 sm:p-8 rounded-2xl flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center lg:text-left max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1E1E1E] text-[#FAF9F5] text-[11px] font-mono font-semibold">
            <AlertOctagon size={13} className="text-[#C25E3E]" />
            <span>Statutory Multi-Tier Early Warning Alert System (EWAS)</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1B1C1A]">
            Risk Surveillance & Escalation Center
          </h1>
          <p className="text-xs sm:text-sm text-[#655E4E] leading-relaxed">
            Statutory anomaly triggers calibrated against MoSPI 2001+ completion baselines. Escalates assets across 4 statutory tiers: Cabinet/PMG, Inter-Ministerial Committees, Agency Boards, and Project Directors.
          </p>
        </div>

        {/* 4-Tier Donut Breakdown */}
        <div className="flex flex-col sm:flex-row items-center gap-5 bg-[#FAF9F5]/90 p-4 rounded-2xl border border-[rgba(61,58,52,0.08)] shrink-0">
          <div className="w-24 h-24 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData} innerRadius={26} outerRadius={42} dataKey="value" stroke="none">
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#FAF9F5', 
                    borderColor: 'rgba(61, 58, 52, 0.15)', 
                    borderRadius: '10px', 
                    fontSize: '11px',
                    fontFamily: 'JetBrains Mono'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="text-xs font-mono space-y-1.5 tabular-nums">
            <div className="text-[#C25E3E] font-bold flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C25E3E]" />
              <span>Level 1 (Cabinet): {alertsData.critical_count}</span>
            </div>
            <div className="text-[#D97706] font-bold flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />
              <span>Level 2 (Inter-Min): {alertsData.high_count}</span>
            </div>
            <div className="text-[#2C3E50] font-bold flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2C3E50]" />
              <span>Level 3 (Board): {alertsData.medium_count}</span>
            </div>
            <div className="text-[#4A5D4E] font-bold flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4A5D4E]" />
              <span>Level 4 (Director): {alertsData.advisory_count}</span>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER & ACTIONS BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Tier Toggles */}
        <div className="flex flex-wrap gap-1 p-1 rounded-2xl bg-[#EFECE6] border border-[rgba(61,58,52,0.1)]">
          {[
            { id: 'All', label: 'All Active Tiers', shortLabel: 'All' },
            { id: 'Level 1', label: 'Level 1: Critical (Cabinet/PMG)', shortLabel: 'L1: Cabinet' },
            { id: 'Level 2', label: 'Level 2: High (Inter-Min)', shortLabel: 'L2: High' },
            { id: 'Level 3', label: 'Level 3: Moderate (Agency Board)', shortLabel: 'L3: Board' },
            { id: 'Level 4', label: 'Level 4: Advisory (Project Dir)', shortLabel: 'L4: Advisory' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTierFilter(t.id)}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-mono rounded-xl transition-all cursor-pointer ${
                tierFilter === t.id 
                  ? 'bg-[#1E1E1E] text-[#FAF9F5] font-bold shadow-xs' 
                  : 'text-[#655E4E] hover:text-[#1B1C1A]'
              }`}
            >
              <span className="hidden sm:inline">{t.label}</span>
              <span className="sm:hidden">{t.shortLabel}</span>
            </button>
          ))}
        </div>

        <button
          onClick={handleResolveAll}
          className="btn-sovereign-secondary w-full sm:w-auto px-4 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[#4A5D4E] hover:text-white hover:border-[#4A5D4E] transition-all cursor-pointer"
        >
          <CheckCheck size={14} />
          <span>Acknowledge All</span>
        </button>
      </div>

      {/* ALERTS FEED WITH ANIMATE PRESENCE */}
      <div className="space-y-3.5">
        <AnimatePresence>
          {(alertsData.alerts || []).map(alert => (
            <motion.div 
              key={alert.alert_id} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25 }}
              className={`glass-card p-5 sm:p-6 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-5 transition-all ${
                alert.severity === 'CRITICAL' ? 'border-l-4 border-l-[#C25E3E] border-[rgba(194,94,62,0.25)]' :
                alert.severity === 'HIGH' ? 'border-l-4 border-l-[#D97706] border-[rgba(217,119,6,0.25)]' :
                alert.severity === 'MEDIUM' ? 'border-l-4 border-l-[#2C3E50] border-[rgba(44,62,80,0.25)]' :
                'border-l-4 border-l-[#4A5D4E] border-[rgba(74,93,78,0.25)]'
              }`}
            >
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase ${
                    alert.severity === 'CRITICAL' ? 'badge-sienna' :
                    alert.severity === 'HIGH' ? 'badge-amber' :
                    alert.severity === 'MEDIUM' ? 'badge-indigo' :
                    'badge-nominal'
                  }`}>
                    {alert.statutory_level || alert.severity}
                  </span>
                  <span className="text-xs font-bold text-[#1B1C1A]">{alert.alert_type}</span>
                  <span className="text-[10px] text-[#8D8574] font-mono">[{alert.project_id}]</span>
                </div>

                <h3 className="text-sm sm:text-base font-serif font-bold text-[#1B1C1A] line-clamp-1">
                  {alert.project_name}
                </h3>
                
                <p className="text-xs text-[#655E4E] leading-relaxed">
                  {alert.message}
                </p>

                {/* Recommended Statutory Protocol */}
                {alert.action_required && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#FAF9F5] border border-[rgba(61,58,52,0.1)] text-[11px] font-mono text-[#1B1C1A]">
                    <span className="font-bold text-[#D97706]">Mandated Protocol:</span>
                    <span>{alert.action_required}</span>
                  </div>
                )}

                <div className="flex items-center gap-4 text-[10px] font-mono text-[#8D8574] pt-1">
                  <span>Sector: {alert.sector}</span>
                  <span>State: {alert.state}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 self-start lg:self-center">
                <button
                  onClick={() => handleDispatchStatutoryNotice(alert)}
                  className="btn-sovereign-primary px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Send size={12} />
                  <span>Escalate Directive</span>
                </button>

                <Link
                  to={`/projects/${alert.project_id}`}
                  className="btn-sovereign-secondary px-3 py-1.5 text-xs font-semibold flex items-center gap-1"
                >
                  <span>Inspect</span>
                  <ExternalLink size={12} />
                </Link>

                <button
                  onClick={() => handleResolveOne(alert.alert_id)}
                  className="px-3 py-1.5 rounded-full border border-[rgba(61,58,52,0.14)] bg-[#FAF9F5] hover:bg-[#4A5D4E] hover:text-white hover:border-[#4A5D4E] text-[#655E4E] transition-all text-xs font-medium cursor-pointer"
                >
                  Resolve
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* STATUTORY ACTION MODAL */}
      {selectedAlertForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1B1C1A]/50 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-card max-w-xl w-full p-6 rounded-2xl space-y-4 bg-[#FAF9F5] shadow-2xl border border-[rgba(61,58,52,0.15)]"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(61,58,52,0.08)]">
              <div className="flex items-center gap-2">
                <ShieldAlert size={20} className="text-[#C25E3E]" />
                <h3 className="font-serif font-bold text-base text-[#1B1C1A]">
                  Statutory Escalation Directive
                </h3>
              </div>
              <button 
                onClick={() => setSelectedAlertForAction(null)}
                className="p-1 rounded-full text-[#8D8574] hover:bg-[#EFECE6] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-[#EFECE6]/70 space-y-1 font-mono">
                <span className="text-[10px] uppercase text-[#8D8574] block">Asset Target</span>
                <span className="font-bold text-[#1B1C1A] block">{selectedAlertForAction.project_name}</span>
                <span className="text-[#655E4E] block">ID: {selectedAlertForAction.project_id} | Sector: {selectedAlertForAction.sector}</span>
              </div>

              <div className="p-3 rounded-xl bg-[rgba(217,119,6,0.08)] border border-[rgba(217,119,6,0.2)] space-y-1">
                <span className="font-bold text-[#D97706] font-mono text-[11px] block">Mandated Statutory Protocol:</span>
                <p className="text-[#1B1C1A] font-semibold">{selectedAlertForAction.action_required}</p>
              </div>

              <p className="text-[#655E4E] leading-relaxed pt-1">
                Executing this directive transmits formal telemetry records to the corresponding statutory oversight body ({selectedAlertForAction.statutory_level}) and logs the mitigation timestamp under MoSPI regulatory audit rules.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[rgba(61,58,52,0.08)]">
              <button
                onClick={() => setSelectedAlertForAction(null)}
                className="btn-sovereign-secondary px-4 py-2 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                className="btn-sovereign-primary px-5 py-2 text-xs font-semibold flex items-center gap-2 cursor-pointer"
              >
                <Send size={13} />
                <span>Confirm & Transmit Directive</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
