import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, 
  ReferenceLine, CartesianGrid 
} from 'recharts';
import { 
  CheckCircle2, Clock, AlertTriangle, Building2, Briefcase, 
  Search, ArrowRight, Sparkles, Filter, ChevronRight, Layers,
  BarChart3, RefreshCw, Printer, ShieldCheck, CheckSquare,
  Users, ExternalLink, Activity
} from 'lucide-react';
import { Applicant, InterviewQuestion } from '../types';

interface QuestionnaireCompletionDashboardProps {
  applicants: Applicant[];
  activeConsultor?: { id: string; name: string; email: string } | null;
  onSelectApplicant: (applicant: Applicant) => void;
  onNavigateToInterview: (applicant: Applicant) => void;
  onNavigateToPreBrief?: (applicant: Applicant) => void;
}

// Standard functional departments if not explicitly set
const DEFAULT_DEPARTMENTS = [
  'Dirección General & Estrategia',
  'Operaciones & Cadena de Suministro',
  'Tecnología & Transformación Digital',
  'Finanzas, Riesgos & Control',
  'Comercial & Desarrollo de Negocios',
  'Capital Humano & Cultura'
];

export default function QuestionnaireCompletionDashboard({
  applicants,
  activeConsultor,
  onSelectApplicant,
  onNavigateToInterview,
  onNavigateToPreBrief
}: QuestionnaireCompletionDashboardProps) {
  const [viewMode, setViewMode] = useState<'companies' | 'departments' | 'dimensions'>('companies');
  const [metricType, setMetricType] = useState<'interview_pct' | 'interview_count' | 'prebrief_pct'>('interview_pct');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'in_progress' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'pct_desc' | 'pct_asc' | 'name_asc'>('pct_desc');

  // Helper: Determine if a question meets full validation (score + client comments >=15 + consultant notes >=15)
  const isQuestionFullyAnswered = (q: InterviewQuestion): boolean => {
    const hasValidScore = typeof q.score === 'number' && !isNaN(Number(q.score)) && Number(q.score) >= 1 && Number(q.score) <= 5;
    const hasValidRespuesta = typeof q.respuesta === 'string' && q.respuesta.trim().length >= 15;
    const hasValidNotas = typeof q.notas === 'string' && q.notas.trim().length >= 15;
    return Boolean(hasValidScore && hasValidRespuesta && hasValidNotas);
  };

  // Helper: Compute completion metrics for an individual applicant
  const getApplicantMetrics = (a: Applicant) => {
    let totalQuestions = 60;
    let fullyAnswered = 0;
    let scoredOnly = 0;

    // Dimension level counts
    const dimensionCounts: Record<string, { total: number; answered: number; name: string }> = {
      ALI: { total: 10, answered: 0, name: 'Alineación Estratégica' },
      PRI: { total: 10, answered: 0, name: 'Priorización de Portafolio' },
      GOB: { total: 10, answered: 0, name: 'Gobernanza & Decisiones' },
      DIS: { total: 10, answered: 0, name: 'Disciplina de Ejecución' },
      CAP: { total: 10, answered: 0, name: 'Capacidad Organizacional' },
      VIS: { total: 10, answered: 0, name: 'Visibilidad & Control' }
    };

    if (a.interview?.bloques && a.interview.bloques.length > 0) {
      totalQuestions = 0;
      a.interview.bloques.forEach((block, bIdx) => {
        const dimKey = Object.keys(dimensionCounts)[bIdx] || `DIM_${bIdx + 1}`;
        if (!dimensionCounts[dimKey]) {
          dimensionCounts[dimKey] = { total: 0, answered: 0, name: block.nombreBloque };
        }
        (block.preguntas || []).forEach((q) => {
          totalQuestions++;
          dimensionCounts[dimKey].total++;
          if (typeof q.score === 'number' && q.score >= 1 && q.score <= 5) {
            scoredOnly++;
          }
          if (isQuestionFullyAnswered(q)) {
            fullyAnswered++;
            dimensionCounts[dimKey].answered++;
          }
        });
      });
    }

    if (totalQuestions === 0) totalQuestions = 60;

    const interviewPct = Math.round((fullyAnswered / totalQuestions) * 100);
    const isInterviewComplete = a.interview?.estado === 'completada' || a.interview?.estado === 'completado' || (fullyAnswered >= 60 && totalQuestions === 60);

    // Pre-Brief progress
    let preBriefPct = 0;
    if (a.hasCompletedB && a.scoreA > 0) {
      preBriefPct = 100;
    } else if (a.scoreA > 0) {
      preBriefPct = 50;
    } else if (a.answersA && Object.keys(a.answersA).length > 0) {
      preBriefPct = 25;
    }

    // Inferred or explicit department
    const dept = a.department || DEFAULT_DEPARTMENTS[Math.abs((a.companyName.charCodeAt(0) || 0) + (a.companyName.charCodeAt(1) || 0)) % DEFAULT_DEPARTMENTS.length];

    return {
      totalQuestions,
      fullyAnswered,
      scoredOnly,
      interviewPct,
      isInterviewComplete,
      preBriefPct,
      department: dept,
      dimensionCounts
    };
  };

  // Enriched applicants list with calculated metrics
  const enrichedApplicants = useMemo(() => {
    return applicants.map(a => ({
      ...a,
      metrics: getApplicantMetrics(a)
    }));
  }, [applicants]);

  // Overall Global Statistics
  const globalStats = useMemo(() => {
    const total = enrichedApplicants.length;
    if (total === 0) {
      return { total: 0, completedCount: 0, inProgressCount: 0, pendingCount: 0, avgInterviewPct: 0, avgPreBriefPct: 0 };
    }

    const completedCount = enrichedApplicants.filter(a => a.metrics.interviewPct === 100).length;
    const inProgressCount = enrichedApplicants.filter(a => a.metrics.interviewPct > 0 && a.metrics.interviewPct < 100).length;
    const pendingCount = enrichedApplicants.filter(a => a.metrics.interviewPct === 0).length;
    const totalInterviewPct = enrichedApplicants.reduce((acc, a) => acc + a.metrics.interviewPct, 0);
    const totalPreBriefPct = enrichedApplicants.reduce((acc, a) => acc + a.metrics.preBriefPct, 0);

    return {
      total,
      completedCount,
      inProgressCount,
      pendingCount,
      avgInterviewPct: Math.round(totalInterviewPct / total),
      avgPreBriefPct: Math.round(totalPreBriefPct / total)
    };
  }, [enrichedApplicants]);

  // Unique departments list
  const departmentsList = useMemo(() => {
    const set = new Set<string>();
    enrichedApplicants.forEach(a => set.add(a.metrics.department));
    return Array.from(set);
  }, [enrichedApplicants]);

  // Filtered applicants
  const filteredApplicants = useMemo(() => {
    return enrichedApplicants.filter(a => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = a.companyName.toLowerCase().includes(q);
        const matchSponsor = a.sponsorName?.toLowerCase().includes(q);
        const matchDept = a.metrics.department.toLowerCase().includes(q);
        if (!matchName && !matchSponsor && !matchDept) return false;
      }

      // Department filter
      if (selectedDepartmentFilter !== 'all' && a.metrics.department !== selectedDepartmentFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === 'completed' && a.metrics.interviewPct < 100) return false;
      if (statusFilter === 'in_progress' && (a.metrics.interviewPct === 0 || a.metrics.interviewPct === 100)) return false;
      if (statusFilter === 'pending' && a.metrics.interviewPct > 0) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'pct_desc') return b.metrics.interviewPct - a.metrics.interviewPct;
      if (sortBy === 'pct_asc') return a.metrics.interviewPct - b.metrics.interviewPct;
      return a.companyName.localeCompare(b.companyName);
    });
  }, [enrichedApplicants, searchQuery, selectedDepartmentFilter, statusFilter, sortBy]);

  // Chart Data: By Company
  const companyChartData = useMemo(() => {
    return filteredApplicants.map(a => {
      let value = a.metrics.interviewPct;
      if (metricType === 'interview_count') value = a.metrics.fullyAnswered;
      if (metricType === 'prebrief_pct') value = a.metrics.preBriefPct;

      return {
        id: a.id,
        name: a.companyName.length > 20 ? `${a.companyName.substring(0, 18)}...` : a.companyName,
        fullName: a.companyName,
        department: a.metrics.department,
        sponsor: a.sponsorName,
        value,
        interviewPct: a.metrics.interviewPct,
        fullyAnswered: a.metrics.fullyAnswered,
        totalQuestions: a.metrics.totalQuestions,
        preBriefPct: a.metrics.preBriefPct,
        status: a.metrics.interviewPct === 100 ? 'Completado' : a.metrics.interviewPct > 0 ? 'En Progreso' : 'Pendiente',
        rawApplicant: a
      };
    });
  }, [filteredApplicants, metricType]);

  // Chart Data: By Department
  const departmentChartData = useMemo(() => {
    const deptMap: Record<string, { total: number; interviewPctSum: number; fullyAnsweredSum: number; preBriefPctSum: number; companies: string[] }> = {};

    enrichedApplicants.forEach(a => {
      const d = a.metrics.department;
      if (!deptMap[d]) {
        deptMap[d] = { total: 0, interviewPctSum: 0, fullyAnsweredSum: 0, preBriefPctSum: 0, companies: [] };
      }
      deptMap[d].total++;
      deptMap[d].interviewPctSum += a.metrics.interviewPct;
      deptMap[d].fullyAnsweredSum += a.metrics.fullyAnswered;
      deptMap[d].preBriefPctSum += a.metrics.preBriefPct;
      deptMap[d].companies.push(a.companyName);
    });

    return Object.entries(deptMap).map(([dept, data]) => {
      const avgInterviewPct = Math.round(data.interviewPctSum / (data.total || 1));
      const avgAnswered = Math.round(data.fullyAnsweredSum / (data.total || 1));
      const avgPreBrief = Math.round(data.preBriefPctSum / (data.total || 1));

      let value = avgInterviewPct;
      if (metricType === 'interview_count') value = avgAnswered;
      if (metricType === 'prebrief_pct') value = avgPreBrief;

      return {
        name: dept.length > 22 ? `${dept.substring(0, 20)}...` : dept,
        fullName: dept,
        value,
        avgInterviewPct,
        avgAnswered,
        avgPreBrief,
        totalCompanies: data.total,
        companies: data.companies
      };
    }).sort((a, b) => b.value - a.value);
  }, [enrichedApplicants, metricType]);

  // Chart Data: By Dimension CSEA across portfolio
  const dimensionChartData = useMemo(() => {
    const dimAgg: Record<string, { code: string; name: string; totalQuestions: number; answeredCount: number }> = {
      ALI: { code: 'ALI', name: 'Alineación Estratégica', totalQuestions: 0, answeredCount: 0 },
      PRI: { code: 'PRI', name: 'Priorización Portafolio', totalQuestions: 0, answeredCount: 0 },
      GOB: { code: 'GOB', name: 'Gobernanza & Decisión', totalQuestions: 0, answeredCount: 0 },
      DIS: { code: 'DIS', name: 'Disciplina Ejecución', totalQuestions: 0, answeredCount: 0 },
      CAP: { code: 'CAP', name: 'Capacidad Organizacional', totalQuestions: 0, answeredCount: 0 },
      VIS: { code: 'VIS', name: 'Visibilidad & Control', totalQuestions: 0, answeredCount: 0 }
    };

    filteredApplicants.forEach(a => {
      Object.entries(a.metrics.dimensionCounts).forEach(([k, v]) => {
        if (dimAgg[k]) {
          dimAgg[k].totalQuestions += v.total;
          dimAgg[k].answeredCount += v.answered;
        }
      });
    });

    return Object.values(dimAgg).map(d => {
      const pct = d.totalQuestions > 0 ? Math.round((d.answeredCount / d.totalQuestions) * 100) : 0;
      return {
        code: d.code,
        name: d.name,
        fullName: `${d.code} · ${d.name}`,
        value: metricType === 'interview_count' ? d.answeredCount : pct,
        pct,
        answeredCount: d.answeredCount,
        totalQuestions: d.totalQuestions
      };
    });
  }, [filteredApplicants, metricType]);

  // Color helper based on completion percentage
  const getBarColor = (pct: number) => {
    if (pct === 100) return '#10b981'; // Emerald 500
    if (pct >= 70) return '#3b82f6';  // Blue 500
    if (pct >= 30) return '#f59e0b';  // Amber 500
    return '#94a3b8';                 // Slate 400
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner & Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-500/10 rounded-xl text-amber-500 border border-amber-500/20">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              Dashboard de Completitud en Tiempo Real
            </h2>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">
            Monitoreo comparativo del avance de captura de los 60 reactivos oficiales CSEA v4.0 (con validación de puntuación, comentarios y notas $\ge 15$ caracteres) y etapa de Pre-Brief entre organizaciones y departamentos.
          </p>
        </div>

        {/* Global summary pill badge */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="px-4 py-2 bg-slate-900 text-white rounded-xl border border-slate-800 text-right">
            <span className="text-[9px] font-mono uppercase text-amber-400 block font-bold tracking-wider">
              Avance Global CSEA
            </span>
            <span className="text-sm font-black font-mono">
              {globalStats.avgInterviewPct}% Completado
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Avance Ponderado 60Q */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Avance Global 60Q</span>
            <Activity className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-slate-900">
              {globalStats.avgInterviewPct}%
            </span>
            <span className="text-[11px] text-slate-500 font-medium">promedio</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-amber-500 to-amber-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${globalStats.avgInterviewPct}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400">
            {globalStats.total} empresas evaluadas en cartera
          </p>
        </div>

        {/* Card 2: Cuestionarios Completos 100% */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Completados 100%</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-emerald-700">
              {globalStats.completedCount}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              de {globalStats.total}
            </span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${globalStats.total > 0 ? (globalStats.completedCount / globalStats.total) * 100 : 0}%` }}
            />
          </div>
          <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 inline" />
            <span>Listos para Reporte Ejecutivo</span>
          </p>
        </div>

        {/* Card 3: En Captura Activa */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">En Captura Activa</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-blue-600">
              {globalStats.inProgressCount}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              en progreso
            </span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${globalStats.total > 0 ? (globalStats.inProgressCount / globalStats.total) * 100 : 0}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400">
            Entrevista iniciada con reactivos pendientes
          </p>
        </div>

        {/* Card 4: Pre-Briefs Validados */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Pre-Briefs Validados</span>
            <Sparkles className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-purple-700">
              {globalStats.avgPreBriefPct}%
            </span>
            <span className="text-[11px] text-slate-500 font-medium">promedio</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-purple-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${globalStats.avgPreBriefPct}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400">
            Gate A y Formulario B completados
          </p>
        </div>
      </div>

      {/* Control Bar: View Modes, Metrics, Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* View Modes Segments */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('companies')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'companies'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Por Empresa</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('departments')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'departments'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Por Departamento / Área</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('dimensions')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'dimensions'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Por Dimensión CSEA</span>
            </button>
          </div>

          {/* Metric Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Métrica:
            </span>
            <select
              value={metricType}
              onChange={(e) => setMetricType(e.target.value as any)}
              className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
            >
              <option value="interview_pct">% Completitud 60Q (Score + Comentarios + Notas)</option>
              <option value="interview_count">Reactivos Validados (0 a 60)</option>
              <option value="prebrief_pct">% Avance Pre-Brief (Gate A + B)</option>
            </select>
          </div>

        </div>

        {/* Secondary Filters Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Search Box */}
          <div className="relative min-w-[220px] flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por empresa, patrocinador o departamento..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder-slate-400"
            />
          </div>

          {/* Department Dropdown Filter */}
          {viewMode === 'companies' && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-[11px] font-semibold">Departamento:</span>
              <select
                value={selectedDepartmentFilter}
                onChange={(e) => setSelectedDepartmentFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 font-medium focus:outline-none cursor-pointer"
              >
                <option value="all">Todos los Departamentos</option>
                {departmentsList.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          )}

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                statusFilter === 'all' ? 'bg-white shadow-2xs text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Todas ({enrichedApplicants.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('completed')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                statusFilter === 'completed' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              100% Listas ({globalStats.completedCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('in_progress')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                statusFilter === 'in_progress' ? 'bg-blue-50 text-blue-800 border border-blue-200 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              En Captura ({globalStats.inProgressCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                statusFilter === 'pending' ? 'bg-slate-200 text-slate-800 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Pendientes ({globalStats.pendingCount})
            </button>
          </div>
        </div>
      </div>

      {/* Main Bar Chart Viewport */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <span>
                {viewMode === 'companies' && 'Comparativa de Avance de Cuestionarios por Empresa'}
                {viewMode === 'departments' && 'Comparativa Consolidada por Departamento / Área'}
                {viewMode === 'dimensions' && 'Avance de Captura en las 6 Dimensiones Metodológicas CSEA'}
              </span>
              <span className="text-[11px] font-mono text-slate-400 font-normal">
                ({viewMode === 'companies' ? `${companyChartData.length} organizaciones` : viewMode === 'departments' ? `${departmentChartData.length} áreas` : '6 bloques oficiales'})
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">
              {metricType === 'interview_pct' && 'Muestra el porcentaje exacto de los 60 reactivos con calificación, evidencias del cliente y notas del consultor.'}
              {metricType === 'interview_count' && 'Muestra la cantidad absoluta de reactivos validados (0 a 60 reactivos).'}
              {metricType === 'prebrief_pct' && 'Muestra el porcentaje de avance en el Formulario Gate A y Formulario B.'}
            </p>
          </div>

          {/* Color Legend */}
          <div className="flex items-center gap-3 text-[11px] text-slate-600">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
              <span>100% Acreditado</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
              <span>$\ge$ 70% Muy Avanzado</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
              <span>30% - 69% En Progreso</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-slate-400" />
              <span>&lt; 30% Pendiente</span>
            </span>
          </div>
        </div>

        {/* RECHARTS BAR CHART CONTAINER */}
        <div className="w-full h-84 sm:h-96">
          {viewMode === 'companies' && companyChartData.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-2">
              <Building2 className="w-10 h-10 text-slate-300" />
              <p className="text-xs font-semibold">No se encontraron empresas con los filtros aplicados.</p>
            </div>
          ) : viewMode === 'companies' ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={companyChartData}
                margin={{ top: 20, right: 30, left: 10, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                  interval={0}
                  angle={companyChartData.length > 5 ? -25 : 0}
                  textAnchor={companyChartData.length > 5 ? 'end' : 'middle'}
                  height={50}
                />
                <YAxis 
                  domain={[0, metricType === 'interview_count' ? 60 : 100]}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickFormatter={(val) => metricType === 'interview_count' ? `${val} Q` : `${val}%`}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs space-y-1.5 max-w-xs">
                          <p className="font-bold text-amber-400 text-sm">{data.fullName}</p>
                          <p className="text-[11px] text-slate-300 flex items-center gap-1">
                            <Briefcase className="w-3 h-3 text-slate-400" />
                            <span>{data.department}</span>
                          </p>
                          <div className="pt-1.5 border-t border-slate-800 space-y-1 text-[11px]">
                            <div className="flex justify-between gap-3">
                              <span className="text-slate-400">Completitud 60Q:</span>
                              <strong className="text-emerald-400 font-mono">{data.interviewPct}% ({data.fullyAnswered}/{data.totalQuestions})</strong>
                            </div>
                            <div className="flex justify-between gap-3">
                              <span className="text-slate-400">Pre-Brief Gate A+B:</span>
                              <strong className="text-purple-400 font-mono">{data.preBriefPct}%</strong>
                            </div>
                            <div className="flex justify-between gap-3">
                              <span className="text-slate-400">Estado:</span>
                              <span className="font-bold">{data.status}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {metricType !== 'interview_count' && (
                  <ReferenceLine y={100} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Meta 100%', fill: '#059669', fontSize: 10, position: 'top' }} />
                )}
                {metricType === 'interview_count' && (
                  <ReferenceLine y={60} stroke="#10b981" strokeDasharray="3 3" label={{ value: '60 Reactivos', fill: '#059669', fontSize: 10, position: 'top' }} />
                )}
                <Bar 
                  dataKey="value" 
                  radius={[6, 6, 0, 0]}
                  onClick={(entry: any) => {
                    const target = entry?.rawApplicant || (typeof entry?.index === 'number' ? companyChartData[entry.index]?.rawApplicant : null);
                    if (target) onNavigateToInterview(target);
                  }}
                  className="cursor-pointer"
                >
                  {companyChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={getBarColor(metricType === 'interview_count' ? Math.round((entry.value / 60) * 100) : entry.value)} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : viewMode === 'departments' ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={departmentChartData}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 140, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis 
                  type="number" 
                  domain={[0, metricType === 'interview_count' ? 60 : 100]}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickFormatter={(val) => metricType === 'interview_count' ? `${val} Q` : `${val}%`}
                />
                <YAxis 
                  dataKey="fullName" 
                  type="category" 
                  tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }}
                  width={130}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs space-y-1.5 max-w-xs">
                          <p className="font-bold text-amber-400 text-sm">{data.fullName}</p>
                          <p className="text-[11px] text-slate-300">
                            {data.totalCompanies} organización(es) asignadas
                          </p>
                          <div className="pt-1.5 border-t border-slate-800 space-y-1 text-[11px]">
                            <div className="flex justify-between gap-3">
                              <span className="text-slate-400">Promedio 60Q:</span>
                              <strong className="text-emerald-400 font-mono">{data.avgInterviewPct}% ({data.avgAnswered}/60)</strong>
                            </div>
                            <div className="flex justify-between gap-3">
                              <span className="text-slate-400">Pre-Brief:</span>
                              <strong className="text-purple-400 font-mono">{data.avgPreBrief}%</strong>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {metricType !== 'interview_count' && (
                  <ReferenceLine x={100} stroke="#10b981" strokeDasharray="3 3" />
                )}
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {departmentChartData.map((entry, index) => (
                    <Cell 
                      key={`dept-cell-${index}`} 
                      fill={getBarColor(metricType === 'interview_count' ? Math.round((entry.value / 60) * 100) : entry.value)} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dimensionChartData}
                margin={{ top: 20, right: 30, left: 10, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="code" 
                  tick={{ fontSize: 11, fill: '#1e293b', fontWeight: 700 }}
                />
                <YAxis 
                  domain={[0, metricType === 'interview_count' ? 'dataMax + 10' : 100]}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickFormatter={(val) => metricType === 'interview_count' ? `${val} Q` : `${val}%`}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs space-y-1.5 max-w-xs">
                          <p className="font-bold text-amber-400 text-sm">{data.fullName}</p>
                          <div className="pt-1.5 border-t border-slate-800 space-y-1 text-[11px]">
                            <div className="flex justify-between gap-3">
                              <span className="text-slate-400">Completitud del Bloque:</span>
                              <strong className="text-emerald-400 font-mono">{data.pct}%</strong>
                            </div>
                            <div className="flex justify-between gap-3">
                              <span className="text-slate-400">Reactivos Validados:</span>
                              <span className="font-mono text-slate-200">{data.answeredCount} de {data.totalQuestions}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {dimensionChartData.map((entry, index) => (
                    <Cell 
                      key={`dim-cell-${index}`} 
                      fill={getBarColor(entry.pct)} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Detailed Companies Tracking Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
          <div>
            <h3 className="font-black text-slate-900 text-sm">
              Tabla de Auditoría y Estado de Reactivos por Empresa
            </h3>
            <p className="text-[11px] text-slate-500">
              Desglose detallado de reactivos completados (puntuación + comentarios $\ge 15$ + notas $\ge 15$) con acceso directo a la entrevista.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500">
            {filteredApplicants.length} de {applicants.length} empresas listadas
          </span>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Empresa & Patrocinador</th>
                <th className="px-4 py-3">Departamento / Área</th>
                <th className="px-4 py-3 text-center">Pre-Brief Gate A+B</th>
                <th className="px-4 py-3">Avance Entrevista (60 Reactivos)</th>
                <th className="px-4 py-3 text-center">Estado de Acreditación</th>
                <th className="px-5 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredApplicants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400 text-xs">
                    No hay empresas coincidentes con los criterios de búsqueda y filtros.
                  </td>
                </tr>
              ) : (
                filteredApplicants.map((a) => {
                  const m = a.metrics;
                  return (
                    <tr 
                      key={a.id} 
                      className="hover:bg-slate-50/80 transition cursor-pointer"
                      onClick={() => onSelectApplicant(a)}
                    >
                      {/* Empresa */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-200">
                            {a.companyName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 leading-tight">
                              {a.companyName}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {a.sponsorName || 'Sin patrocinador registrado'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Departamento */}
                      <td className="px-4 py-3.5">
                        <span className="text-[11px] font-medium text-slate-700 bg-slate-100/80 px-2 py-0.5 rounded-md border border-slate-200/60 inline-block">
                          {m.department}
                        </span>
                      </td>

                      {/* Pre-Brief */}
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          m.preBriefPct === 100
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : m.preBriefPct > 0
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {m.preBriefPct === 100 && <CheckCircle2 className="w-3 h-3 text-purple-600" />}
                          <span>{m.preBriefPct}%</span>
                        </span>
                      </td>

                      {/* Entrevista 60Q Progress */}
                      <td className="px-4 py-3.5 min-w-[200px]">
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-bold text-slate-700 font-mono">
                              {m.fullyAnswered} / {m.totalQuestions} reactivos
                            </span>
                            <span className={`font-mono font-bold ${
                              m.interviewPct === 100 ? 'text-emerald-700' : m.interviewPct >= 50 ? 'text-amber-700' : 'text-slate-500'
                            }`}>
                              {m.interviewPct}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                m.interviewPct === 100
                                  ? 'bg-emerald-500'
                                  : m.interviewPct >= 50
                                  ? 'bg-amber-500'
                                  : 'bg-slate-400'
                              }`}
                              style={{ width: `${m.interviewPct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="px-4 py-3.5 text-center">
                        {m.interviewPct === 100 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>100% Validado</span>
                          </span>
                        ) : m.interviewPct > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3" />
                            <span>En Captura</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            <span>Pendiente</span>
                          </span>
                        )}
                      </td>

                      {/* Acción */}
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigateToInterview(a);
                          }}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                          title="Abrir la entrevista de 60 reactivos"
                        >
                          <span>Entrevista</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
