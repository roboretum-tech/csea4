import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, User, Mail, Phone, Calendar, Clock, CheckCircle2, 
  AlertTriangle, XCircle, ArrowRight, ArrowLeft, Filter, Search, 
  LayoutGrid, Table, Share2, Sparkles, MessageSquareText, FileText, 
  ChevronRight, MoreVertical, Edit3, Save, ExternalLink, RefreshCw,
  TrendingUp, BarChart2, BarChart3, ShieldAlert, CheckSquare, Eye, Briefcase
} from 'lucide-react';
import { Applicant, CrmStage } from '../types';
import { safeFetchJson } from '../utils/apiClient';

interface CompanyCrmPipelineProps {
  applicants: Applicant[];
  activeConsultor: { id: string; name: string; email: string } | null;
  onUpdateApplicant: (updated: Applicant) => void;
  onSelectApplicant: (applicant: Applicant) => void;
  onNavigateTab: (tab: 'brief' | 'interview' | 'report') => void;
  onOpenShareModal: () => void;
  onNavigateToDashboard?: () => void;
}

export const CRM_STAGES: {
  id: CrmStage;
  label: string;
  shortLabel: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  description: string;
}[] = [
  {
    id: 'pre_brief_pending',
    label: '1. Pre-Brief Pendiente',
    shortLabel: 'Pre-Brief Pendiente',
    color: 'bg-slate-100 text-slate-700',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-700',
    borderColor: 'border-slate-300',
    description: 'Postulación Gate A registrada; formulario B pendiente.'
  },
  {
    id: 'pre_brief_completed',
    label: '2. Pre-Brief Completado',
    shortLabel: 'Pre-Brief Listo',
    color: 'bg-amber-100 text-amber-900',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    borderColor: 'border-amber-400',
    description: 'Pre-Brief completado con brief de contexto listo.'
  },
  {
    id: 'interview_in_progress',
    label: '3. Entrevista 60Q en Curso',
    shortLabel: '60Q en Curso',
    color: 'bg-blue-100 text-blue-900',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-800',
    borderColor: 'border-blue-400',
    description: 'Entrevista de 90 min iniciada (1 a 59 reactivos evaluados).'
  },
  {
    id: 'interview_completed',
    label: '4. Entrevista 60Q Completa',
    shortLabel: '60Q Completa',
    color: 'bg-indigo-100 text-indigo-900',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-800',
    borderColor: 'border-indigo-400',
    description: 'Los 6 bloques y 60 reactivos evaluados al 100%.'
  },
  {
    id: 'report_generated',
    label: '5. Reporte Generado',
    shortLabel: 'Reporte Emitido',
    color: 'bg-emerald-100 text-emerald-900',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    borderColor: 'border-emerald-500',
    description: 'Reporte Ejecutivo CSEA v4.0 emitido y calibrado.'
  },
  {
    id: 'closed_in_execution',
    label: '6. En Acompañamiento',
    shortLabel: 'En Acompañamiento',
    color: 'bg-purple-100 text-purple-900',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-800',
    borderColor: 'border-purple-400',
    description: 'Cliente activo en implementación y gobernanza.'
  }
];

export function getDerivedStage(applicant: Applicant): CrmStage {
  if (applicant.crmStage) {
    return applicant.crmStage;
  }
  // Auto-derivation if not explicitly set
  if (applicant.executiveReport) {
    return 'report_generated';
  }
  const interview = applicant.interview;
  if (interview && interview.bloques) {
    const scoredCount = interview.bloques.reduce(
      (acc, b) => acc + (b.preguntas?.filter(q => typeof q.score === 'number' && q.score >= 1 && q.score <= 5).length || 0),
      0
    );
    if (scoredCount >= 60 || interview.estado === 'completada' || interview.estado === 'completado') {
      return 'interview_completed';
    }
    if (scoredCount > 0) {
      return 'interview_in_progress';
    }
  }
  if (applicant.hasCompletedB || (applicant.answersB && Object.keys(applicant.answersB).length > 0)) {
    return 'pre_brief_completed';
  }
  return 'pre_brief_pending';
}

export default function CompanyCrmPipeline({
  applicants,
  activeConsultor,
  onUpdateApplicant,
  onSelectApplicant,
  onNavigateTab,
  onOpenShareModal,
  onNavigateToDashboard
}: CompanyCrmPipelineProps) {
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGateA, setFilterGateA] = useState<'all' | 'Aceptación Inmediata' | 'Aceptación Condicional' | 'Rechazado'>('all');
  const [filterStage, setFilterStage] = useState<'all' | CrmStage>('all');
  const [savingId, setSavingId] = useState<string | null>(null);

  // Quick Notes & Follow-up modal state
  const [editingApplicant, setEditingApplicant] = useState<Applicant | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editFollowUp, setEditFollowUp] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Filtered applicants
  const filteredApplicants = useMemo(() => {
    return applicants.filter(app => {
      // Text search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchName = app.companyName.toLowerCase().includes(query);
        const matchSponsor = (app.sponsorName || '').toLowerCase().includes(query);
        const matchEmail = (app.email || '').toLowerCase().includes(query);
        const matchNotes = (app.crmNotes || app.consultorNotes || '').toLowerCase().includes(query);
        if (!matchName && !matchSponsor && !matchEmail && !matchNotes) {
          return false;
        }
      }

      // Gate A filter
      if (filterGateA !== 'all' && app.statusA !== filterGateA) {
        return false;
      }

      // Stage filter
      if (filterStage !== 'all') {
        const currentStage = getDerivedStage(app);
        if (currentStage !== filterStage) {
          return false;
        }
      }

      return true;
    });
  }, [applicants, searchTerm, filterGateA, filterStage]);

  // Grouped by stage for Kanban
  const applicantsByStage = useMemo(() => {
    const map: Record<CrmStage, Applicant[]> = {
      pre_brief_pending: [],
      pre_brief_completed: [],
      interview_in_progress: [],
      interview_completed: [],
      report_generated: [],
      closed_in_execution: []
    };

    filteredApplicants.forEach(app => {
      const stage = getDerivedStage(app);
      if (map[stage]) {
        map[stage].push(app);
      } else {
        map.pre_brief_pending.push(app);
      }
    });

    return map;
  }, [filteredApplicants]);

  // Overall pipeline metrics
  const metrics = useMemo(() => {
    const total = applicants.length;
    const completedPreBrief = applicants.filter(a => a.hasCompletedB || (a.answersB && Object.keys(a.answersB).length > 0)).length;
    const withReports = applicants.filter(a => !!a.executiveReport).length;
    const inExecution = applicants.filter(a => getDerivedStage(a) === 'closed_in_execution').length;

    const conversionRate = total > 0 ? Math.round((withReports / total) * 100) : 0;

    return {
      total,
      completedPreBrief,
      withReports,
      inExecution,
      conversionRate
    };
  }, [applicants]);

  // Handle stage change API call
  const handleUpdateStage = async (applicant: Applicant, newStage: CrmStage) => {
    setSavingId(applicant.id);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (activeConsultor?.id) headers['x-consultor-id'] = activeConsultor.id;
      if (activeConsultor?.email) headers['x-consultor-email'] = activeConsultor.email;

      const { ok, data, error } = await safeFetchJson<{ success: boolean; applicant: Applicant; error?: string }>(
        `/api/applicants/${applicant.id}/crm`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            crmStage: newStage
          })
        }
      );

      if (ok && data?.applicant) {
        onUpdateApplicant(data.applicant);
      } else {
        console.error('Error updating stage:', error);
      }
    } catch (err) {
      console.error('Error updating stage:', err);
    } finally {
      setSavingId(null);
    }
  };

  // Open Notes & Follow-up modal
  const handleOpenNotesModal = (applicant: Applicant) => {
    setEditingApplicant(applicant);
    setEditNotes(applicant.crmNotes || applicant.consultorNotes || '');
    setEditFollowUp(applicant.crmNextFollowUp || '');
  };

  // Save Notes & Follow-up
  const handleSaveNotes = async () => {
    if (!editingApplicant) return;
    setSavingNotes(true);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (activeConsultor?.id) headers['x-consultor-id'] = activeConsultor.id;
      if (activeConsultor?.email) headers['x-consultor-email'] = activeConsultor.email;

      const { ok, data, error } = await safeFetchJson<{ success: boolean; applicant: Applicant; error?: string }>(
        `/api/applicants/${editingApplicant.id}/crm`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            crmNotes: editNotes,
            crmNextFollowUp: editFollowUp || null
          })
        }
      );

      if (ok && data?.applicant) {
        onUpdateApplicant(data.applicant);
        setEditingApplicant(null);
      } else {
        console.error('Error updating CRM notes:', error);
      }
    } catch (err) {
      console.error('Error updating CRM notes:', err);
    } finally {
      setSavingNotes(false);
    }
  };

  // Quick navigation helper
  const handleJumpToInterview = (applicant: Applicant) => {
    onSelectApplicant(applicant);
    onNavigateTab('interview');
  };

  const handleJumpToReport = (applicant: Applicant) => {
    onSelectApplicant(applicant);
    onNavigateTab('report');
  };

  const handleJumpToBrief = (applicant: Applicant) => {
    onSelectApplicant(applicant);
    onNavigateTab('brief');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Metrics Overview */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight flex items-center gap-2 text-white">
                  CRM de Seguimiento de Empresas
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    CSEA Pipeline
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Trazabilidad integral desde el Pre-Brief inicial hasta la ejecución estratégica y gobernanza.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onNavigateToDashboard && (
              <button
                id="crm-go-to-dashboard-btn"
                type="button"
                onClick={onNavigateToDashboard}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs rounded-xl transition border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                title="Ver gráficos comparativos de completitud"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Dashboard de Avance</span>
              </button>
            )}

            <button
              id="crm-share-pre-brief-btn"
              type="button"
              onClick={onOpenShareModal}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl transition shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Compartir Enlace Pre-Brief + QR</span>
            </button>

            {/* View Mode Switcher */}
            <div className="bg-slate-800 p-1 rounded-xl flex items-center border border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'kanban'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Vista Tablero Kanban por Etapas"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Kanban</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Vista Tabla Interactiva CRM"
              >
                <Table className="w-3.5 h-3.5" />
                <span>Tabla</span>
              </button>
            </div>
          </div>
        </div>

        {/* Pipeline KPI Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
              Empresas en Cartera
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black font-mono text-white">
                {metrics.total}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">totales</span>
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] font-mono uppercase text-amber-400 font-bold block">
              Pre-Brief Listos
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black font-mono text-amber-300">
                {metrics.completedPreBrief}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Form B completado</span>
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] font-mono uppercase text-blue-400 font-bold block">
              Reportes Emitidos
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black font-mono text-blue-300">
                {metrics.withReports}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">evaluaciones 1-5</span>
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] font-mono uppercase text-purple-400 font-bold block">
              En Acompañamiento
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black font-mono text-purple-300">
                {metrics.inExecution}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">ejecución activa</span>
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold block">
              Conversión CSEA
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black font-mono text-emerald-300">
                {metrics.conversionRate}%
              </span>
              <span className="text-[10px] text-slate-500 font-medium">brief a reporte</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por empresa, patrocinador, notas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              Limpiar
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Gate A Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gate A:</span>
            <select
              value={filterGateA}
              onChange={(e) => setFilterGateA(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none"
            >
              <option value="all">Todos los estados</option>
              <option value="Aceptación Inmediata">Aceptación Inmediata</option>
              <option value="Aceptación Condicional">Aceptación Condicional</option>
              <option value="Rechazado">Rechazado</option>
            </select>
          </div>

          {/* Stage Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Etapa:</span>
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none"
            >
              <option value="all">Todas las etapas</option>
              {CRM_STAGES.map(s => (
                <option key={s.id} value={s.id}>{s.shortLabel}</option>
              ))}
            </select>
          </div>

          <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200">
            {filteredApplicants.length} resultados
          </span>
        </div>
      </div>

      {/* VIEW MODE 1: KANBAN BOARD */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-start">
          {CRM_STAGES.map(stage => {
            const list = applicantsByStage[stage.id] || [];
            return (
              <div
                key={stage.id}
                className="bg-slate-100/80 rounded-2xl p-3 border border-slate-200/90 flex flex-col min-h-[580px] shadow-2xs"
              >
                {/* Column Header */}
                <div className="mb-3 pb-2 border-b border-slate-200">
                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${stage.badgeBg} ${stage.badgeText}`}>
                      {stage.shortLabel}
                    </span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200 shadow-2xs">
                      {list.length}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                    {stage.description}
                  </p>
                </div>

                {/* Column Cards */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {list.length === 0 ? (
                    <div className="h-40 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center p-3 text-center">
                      <p className="text-[11px] text-slate-400 font-medium">
                        Sin empresas en esta etapa
                      </p>
                    </div>
                  ) : (
                    list.map(app => {
                      const interview = app.interview;
                      const scoredCount = interview?.bloques?.reduce(
                        (acc, b) => acc + (b.preguntas?.filter(q => typeof q.score === 'number' && q.score >= 1 && q.score <= 5).length || 0),
                        0
                      ) || 0;
                      const hasReport = !!app.executiveReport;
                      const globalScore = app.executiveReport?.globalIndex;

                      return (
                        <div
                          key={app.id}
                          className="bg-white rounded-xl p-3.5 border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all space-y-2.5 relative group"
                        >
                          {/* Card Top: Company Name + Gate A Badge */}
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="min-w-0">
                              <h4 className="font-sans font-bold text-xs text-slate-900 leading-tight truncate">
                                {app.companyName}
                              </h4>
                              <p className="text-[10px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                                <User className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                <span>{app.sponsorName || 'Sin patrocinador'}</span>
                              </p>
                            </div>

                            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 ${
                              app.statusA === 'Aceptación Inmediata'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : app.statusA === 'Aceptación Condicional'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                              {app.percentA}%
                            </span>
                          </div>

                          {/* Quick Stats: Pre-Brief & 60Q */}
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-[10px] space-y-1 font-mono">
                            <div className="flex justify-between items-center text-slate-600">
                              <span className="flex items-center gap-1">
                                <FileText className="w-3 h-3 text-amber-500" />
                                Pre-Brief (B):
                              </span>
                              <span className={app.hasCompletedB ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                                {app.hasCompletedB ? 'Completado' : 'Pendiente'}
                              </span>
                            </div>

                            <div className="flex justify-between items-center text-slate-600">
                              <span className="flex items-center gap-1">
                                <MessageSquareText className="w-3 h-3 text-blue-500" />
                                Entrevista 60Q:
                              </span>
                              <span className={`font-bold ${scoredCount >= 60 ? 'text-emerald-700' : scoredCount > 0 ? 'text-blue-700' : 'text-slate-400'}`}>
                                {scoredCount}/60
                              </span>
                            </div>

                            {hasReport && (
                              <div className="flex justify-between items-center text-emerald-800 bg-emerald-50/80 px-1 py-0.5 rounded font-bold">
                                <span>Índice CSEA:</span>
                                <span>{globalScore} / 5.0</span>
                              </div>
                            )}
                          </div>

                          {/* Follow-up date indicator */}
                          {app.crmNextFollowUp && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-600 bg-amber-50/70 border border-amber-200/60 px-2 py-1 rounded-md">
                              <Calendar className="w-3 h-3 text-amber-600 shrink-0" />
                              <span className="font-semibold truncate">
                                Seguimiento: {app.crmNextFollowUp}
                              </span>
                            </div>
                          )}

                          {/* Notes snippet */}
                          {app.crmNotes && (
                            <p className="text-[10px] text-slate-500 italic line-clamp-2 bg-slate-50 p-1.5 rounded border border-slate-100">
                              "{app.crmNotes}"
                            </p>
                          )}

                          {/* Card Actions Footer */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-[10px]">
                            {/* Stage Selector Dropdown */}
                            <select
                              disabled={savingId === app.id}
                              value={stage.id}
                              onChange={(e) => handleUpdateStage(app, e.target.value as CrmStage)}
                              className="text-[9px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md px-1.5 py-1 border border-slate-200 cursor-pointer disabled:opacity-50"
                              title="Cambiar etapa en el CRM"
                            >
                              {CRM_STAGES.map(s => (
                                <option key={s.id} value={s.id}>{s.shortLabel}</option>
                              ))}
                            </select>

                            <div className="flex items-center gap-1">
                              {/* Open Notes Modal */}
                              <button
                                type="button"
                                onClick={() => handleOpenNotesModal(app)}
                                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                                title="Editar notas y fecha de seguimiento"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* Jump to Interview */}
                              <button
                                type="button"
                                onClick={() => handleJumpToInterview(app)}
                                className="p-1 rounded text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition cursor-pointer"
                                title="Abrir Entrevista CSEA (60 reactivos)"
                              >
                                <MessageSquareText className="w-3.5 h-3.5" />
                              </button>

                              {/* Jump to Report if exists */}
                              {hasReport && (
                                <button
                                type="button"
                                onClick={() => handleJumpToReport(app)}
                                className="p-1 rounded text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition cursor-pointer"
                                title="Ver Reporte Ejecutivo CSEA"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* VIEW MODE 2: INTERACTIVE TABLE */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-bold border-b border-slate-800">
                  <th className="p-3">Empresa & Patrocinador</th>
                  <th className="p-3">Contacto</th>
                  <th className="p-3">Gate A</th>
                  <th className="p-3">Etapa en el CRM</th>
                  <th className="p-3">Pre-Brief (B)</th>
                  <th className="p-3">Entrevista 60Q</th>
                  <th className="p-3">Índice CSEA</th>
                  <th className="p-3">Próximo Seguimiento</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApplicants.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      No se encontraron empresas con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredApplicants.map(app => {
                    const currentStage = getDerivedStage(app);
                    const stageConfig = CRM_STAGES.find(s => s.id === currentStage);
                    const interview = app.interview;
                    const scoredCount = interview?.bloques?.reduce(
                      (acc, b) => acc + (b.preguntas?.filter(q => typeof q.score === 'number' && q.score >= 1 && q.score <= 5).length || 0),
                      0
                    ) || 0;
                    const hasReport = !!app.executiveReport;

                    return (
                      <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Company & Sponsor */}
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{app.companyName}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <User className="w-3 h-3 text-slate-400" />
                            <span>{app.sponsorName || 'Sin patrocinador'}</span>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="p-3">
                          <div className="text-slate-700 font-mono text-[11px]">{app.email}</div>
                          {app.phone && (
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{app.phone}</div>
                          )}
                        </td>

                        {/* Gate A */}
                        <td className="p-3">
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md inline-block ${
                            app.statusA === 'Aceptación Inmediata'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : app.statusA === 'Aceptación Condicional'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {app.percentA}% · {app.statusA}
                          </span>
                        </td>

                        {/* CRM Stage Selector */}
                        <td className="p-3">
                          <select
                            disabled={savingId === app.id}
                            value={currentStage}
                            onChange={(e) => handleUpdateStage(app, e.target.value as CrmStage)}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-500"
                          >
                            {CRM_STAGES.map(s => (
                              <option key={s.id} value={s.id}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Pre-Brief B */}
                        <td className="p-3">
                          {app.hasCompletedB ? (
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Listo
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 inline-block">
                              Pendiente
                            </span>
                          )}
                        </td>

                        {/* Interview 60Q */}
                        <td className="p-3">
                          <div className="flex items-center gap-1.5 font-mono text-xs">
                            <span className={`font-bold ${
                              scoredCount >= 60 ? 'text-emerald-700' : scoredCount > 0 ? 'text-blue-700' : 'text-slate-400'
                            }`}>
                              {scoredCount} / 60
                            </span>
                            {scoredCount >= 60 && (
                              <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                            )}
                          </div>
                        </td>

                        {/* CSEA Score */}
                        <td className="p-3">
                          {hasReport ? (
                            <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-xs">
                              {app.executiveReport?.globalIndex} / 5.0
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">—</span>
                          )}
                        </td>

                        {/* Next follow-up */}
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="date"
                              defaultValue={app.crmNextFollowUp || ''}
                              onBlur={(e) => {
                                if (e.target.value !== (app.crmNextFollowUp || '')) {
                                  // Update follow up date
                                  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
                                  if (activeConsultor?.id) headers['x-consultor-id'] = activeConsultor.id;
                                  if (activeConsultor?.email) headers['x-consultor-email'] = activeConsultor.email;
                                  safeFetchJson<{ success: boolean; applicant: Applicant }>(`/api/applicants/${app.id}/crm`, {
                                    method: 'POST',
                                    headers,
                                    body: JSON.stringify({ crmNextFollowUp: e.target.value || null })
                                  }).then(({ ok, data }) => {
                                    if (ok && data?.applicant) onUpdateApplicant(data.applicant);
                                  });
                                }
                              }}
                              className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-[11px] font-mono text-slate-700"
                            />
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenNotesModal(app)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition flex items-center gap-1 cursor-pointer"
                              title="Ver / editar notas"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Notas</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleJumpToInterview(app)}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg text-xs transition flex items-center gap-1 cursor-pointer border border-blue-200"
                              title="Abrir entrevista de 60 reactivos"
                            >
                              <MessageSquareText className="w-3 h-3" />
                              <span>60Q</span>
                            </button>

                            {hasReport && (
                              <button
                                type="button"
                                onClick={() => handleJumpToReport(app)}
                                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition flex items-center gap-1 cursor-pointer shadow-xs"
                                title="Ver reporte ejecutivo"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Reporte</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* QUICK NOTES & FOLLOW-UP MODAL */}
      <AnimatePresence>
        {editingApplicant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col"
            >
              <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Edit3 className="w-4 h-4 text-amber-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Seguimiento CRM · {editingApplicant.companyName}
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      Patrocinador: {editingApplicant.sponsorName || 'No indicado'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingApplicant(null)}
                  className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Próxima Fecha de Seguimiento / Reunión
                  </label>
                  <input
                    type="date"
                    value={editFollowUp}
                    onChange={(e) => setEditFollowUp(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bitácora y Notas del Consultor
                  </label>
                  <textarea
                    rows={6}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Registra avances, compromisos del patrocinador, fecha de la sesión de 90 minutos, acuerdos clave..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed font-sans resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setEditingApplicant(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  disabled={savingNotes}
                  onClick={handleSaveNotes}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingNotes ? 'Guardando...' : 'Guardar Seguimiento'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
