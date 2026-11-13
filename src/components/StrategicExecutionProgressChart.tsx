import { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell, 
  ReferenceLine, 
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  Target, 
  ShieldAlert, 
  Users, 
  Award, 
  Layers, 
  Compass, 
  CheckCircle2,
  ChevronRight,
  Sparkles,
  BarChart2
} from 'lucide-react';
import { Applicant } from '../types';

interface StrategicExecutionProgressChartProps {
  applicants: Applicant[];
  onSelectApplicant?: (applicant: Applicant) => void;
  selectedApplicantId?: string | null;
}

// 6 Official CSEA Dimensions with their weights and standard codes
const CSEA_DIMENSIONS_CONFIG = [
  { id: 'ali', code: 'ALI', name: 'Alineación Estratégica', weight: 0.20, color: '#D9822B' },
  { id: 'pri', code: 'PRI', name: 'Priorización de Portafolio', weight: 0.20, color: '#2563EB' },
  { id: 'gob', code: 'GOB', name: 'Gobernanza y Decisiones', weight: 0.20, color: '#0D9488' },
  { id: 'dis', code: 'DIS', name: 'Disciplina de Ejecución', weight: 0.15, color: '#7C3AED' },
  { id: 'cap', code: 'CAP', name: 'Capacidad Organizacional', weight: 0.15, color: '#EA580C' },
  { id: 'vis', code: 'VIS', name: 'Visibilidad y Control', weight: 0.10, color: '#059669' },
];

export default function StrategicExecutionProgressChart({
  applicants,
  onSelectApplicant,
  selectedApplicantId
}: StrategicExecutionProgressChartProps) {
  const [activeView, setActiveView] = useState<'dimensions' | 'clients' | 'stages'>('dimensions');

  // Filter out any invalid items
  const activeClients = useMemo(() => {
    return applicants.filter(a => a && a.id && a.companyName && a.companyName.trim().length > 0);
  }, [applicants]);

  // Calculate detailed execution metrics for each client
  const clientExecutionMetrics = useMemo(() => {
    return activeClients.map(client => {
      const interview = client.interview;
      // Count how many interview questions have actually been scored
      const totalQuestionsScored = interview?.bloques?.reduce((acc, b) => {
        return acc + (b.preguntas?.filter(q => typeof q.score === 'number' && q.score > 0).length || 0);
      }, 0) || 0;

      // Count how many Form B questions have actually been answered
      const answeredBCount = client.hasCompletedB && client.answersB 
        ? Object.values(client.answersB).filter(v => typeof v === 'number' && v > 0).length 
        : 0;

      const hasReport = !!(client.executiveReport && typeof client.executiveReport.globalIndex === 'number');

      // 1. Calculate score for each of the 6 dimensions (scale 0.0 to 5.0)
      const dimScores: Record<string, number> = {
        ali: 0,
        pri: 0,
        gob: 0,
        dis: 0,
        cap: 0,
        vis: 0,
      };

      if (hasReport && client.executiveReport?.dimensions) {
        client.executiveReport.dimensions.forEach(d => {
          const name = d.name.toLowerCase();
          const score = typeof d.score === 'number' ? d.score : 0;
          if (name.includes('alineacion') || name.includes('ali')) dimScores.ali = score;
          else if (name.includes('priorizacion') || name.includes('pri')) dimScores.pri = score;
          else if (name.includes('gobernanza') || name.includes('gob')) dimScores.gob = score;
          else if (name.includes('disciplina') || name.includes('dis')) dimScores.dis = score;
          else if (name.includes('capacidad') || name.includes('cap')) dimScores.cap = score;
          else if (name.includes('visibilidad') || name.includes('vis')) dimScores.vis = score;
        });
      } else if (totalQuestionsScored > 0 && interview && interview.bloques) {
        interview.bloques.forEach(bloque => {
          const bId = (bloque.idBloque || bloque.nombreBloque || '').toLowerCase();
          const scored = (bloque.preguntas || []).filter(q => typeof q.score === 'number' && q.score > 0);
          const blockAvg = scored.length > 0 
            ? scored.reduce((acc, q) => acc + (q.score || 0), 0) / scored.length 
            : 0;

          if (bId.includes('alineacion') || bId.includes('ali')) dimScores.ali = Math.round(blockAvg * 10) / 10;
          else if (bId.includes('priorizacion') || bId.includes('pri')) dimScores.pri = Math.round(blockAvg * 10) / 10;
          else if (bId.includes('gobernanza') || bId.includes('gob')) dimScores.gob = Math.round(blockAvg * 10) / 10;
          else if (bId.includes('disciplina') || bId.includes('dis')) dimScores.dis = Math.round(blockAvg * 10) / 10;
          else if (bId.includes('capacidad') || bId.includes('cap')) dimScores.cap = Math.round(blockAvg * 10) / 10;
          else if (bId.includes('visibilidad') || bId.includes('vis')) dimScores.vis = Math.round(blockAvg * 10) / 10;
        });
      } else if (answeredBCount > 0 && client.answersB) {
        const vals = Object.values(client.answersB).map(Number).filter(v => !isNaN(v) && v > 0);
        const avgB = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
        Object.keys(dimScores).forEach(k => { dimScores[k] = Math.round(avgB * 10) / 10; });
      }

      // Calculate weighted execution index (0 to 100%)
      let executionPercent = 0;
      if (hasReport) {
        executionPercent = client.executiveReport!.globalIndex;
      } else if (totalQuestionsScored > 0) {
        const weightedScore = 
          (dimScores.ali * 0.20) +
          (dimScores.pri * 0.20) +
          (dimScores.gob * 0.20) +
          (dimScores.dis * 0.15) +
          (dimScores.cap * 0.15) +
          (dimScores.vis * 0.10);
        executionPercent = Math.min(100, Math.max(0, Math.round((weightedScore / 5) * 100)));
      } else if (answeredBCount > 0) {
        const sumB = Object.values(client.answersB).reduce((acc, v) => acc + (Number(v) || 0), 0);
        executionPercent = Math.min(100, Math.max(0, Math.round((sumB / (answeredBCount * 5)) * 100)));
      } else {
        // Cuestionario no contestado: Progreso es exactamente 0%
        executionPercent = 0;
      }

      // Calculate lifecycle stage
      let stageName = '1. Registro (Sin cuestionario)';
      let stageProgress = 0;
      const totalQuestionsCount = interview?.bloques?.reduce((acc, b) => acc + (b.preguntas?.length || 0), 0) || 60;
      const areAll6BlocksDone = interview?.bloques && interview.bloques.length === 6 && interview.bloques.every(b => b.preguntas?.length > 0 && b.preguntas.every(q => (typeof q.score === 'number' && q.score >= 1) || q.respondida || (q.respuesta && q.respuesta.trim().length > 0)));
      const isInterviewFinished = interview && (interview.estado === 'completada' || interview.estado === 'completado' || areAll6BlocksDone || totalQuestionsScored >= totalQuestionsCount);

      if (hasReport && client.executiveReport?.markdownReport) {
        stageName = '4. Reporte & Road Map';
        stageProgress = 100;
      } else if (isInterviewFinished) {
        stageName = '3. Entrevista CSEA Finalizada';
        stageProgress = 75;
      } else if (totalQuestionsScored > 0) {
        stageName = `2. Entrevista en Curso (${totalQuestionsScored}/${totalQuestionsCount})`;
        stageProgress = Math.min(74, Math.round((totalQuestionsScored / totalQuestionsCount) * 50) + 25);
      } else if (answeredBCount > 0) {
        stageName = '2. Pre-Assessment (Form B)';
        stageProgress = 25;
      }

      return {
        id: client.id,
        companyName: client.companyName,
        sponsorName: client.sponsorName || 'Director General',
        executionPercent,
        dimScores,
        stageName,
        stageProgress,
        raw: client
      };
    });
  }, [activeClients]);

  // Aggregate Portfolio Statistics
  const portfolioStats = useMemo(() => {
    if (clientExecutionMetrics.length === 0) {
      return {
        avgGlobalPercent: 0,
        dimensionAverages: CSEA_DIMENSIONS_CONFIG.map(d => ({
          ...d,
          avgScore: 0,
          avgPercent: 0,
          targetScore: 4.0,
          targetPercent: 80,
          radarLabel: `${d.code} (0)`
        })),
        leaderDimension: null,
        gapDimension: null,
        stageDistribution: []
      };
    }

    const totalClients = clientExecutionMetrics.length;
    const evaluatedClients = clientExecutionMetrics.filter(c => 
      c.executionPercent > 0 || c.stageProgress >= 25 || Object.values(c.dimScores).some(s => s > 0)
    );
    const evaluatedCount = evaluatedClients.length;

    const avgGlobalPercent = evaluatedCount > 0
      ? Math.round(evaluatedClients.reduce((acc, c) => acc + c.executionPercent, 0) / evaluatedCount)
      : 0;

    // Calculate average score per dimension across evaluated active clients
    const dimensionAverages = CSEA_DIMENSIONS_CONFIG.map(dim => {
      const sum = evaluatedClients.reduce((acc, c) => acc + (c.dimScores[dim.id] || 0), 0);
      const avgScore = evaluatedCount > 0 ? Math.round((sum / evaluatedCount) * 10) / 10 : 0;
      const avgPercent = Math.round((avgScore / 5) * 100);
      return {
        ...dim,
        avgScore,
        avgPercent,
        targetScore: 4.0,
        targetPercent: 80,
        radarLabel: `${dim.code} (${avgScore})`
      };
    });

    // Identify leader and gap dimensions (only if there are scored dimensions)
    const scoredDims = dimensionAverages.filter(d => d.avgScore > 0);
    const sortedDims = [...dimensionAverages].sort((a, b) => b.avgScore - a.avgScore);
    const leaderDimension = scoredDims.length > 0 ? sortedDims[0] : null;
    const gapDimension = scoredDims.length > 0 ? sortedDims[sortedDims.length - 1] : null;

    // Execution Stages Distribution
    const stagesCounts: Record<string, number> = {
      'Formulario A (Admisión)': 0,
      'Pre-Assessment (Form B)': 0,
      'Entrevista CSEA (30 reactivos)': 0,
      'Reporte Ejecutivo & Road Map': 0,
    };

    clientExecutionMetrics.forEach(c => {
      if (c.stageProgress === 100) stagesCounts['Reporte Ejecutivo & Road Map']++;
      else if (c.stageProgress >= 50) stagesCounts['Entrevista CSEA (30 reactivos)']++;
      else if (c.stageProgress >= 25) stagesCounts['Pre-Assessment (Form B)']++;
      else stagesCounts['Formulario A (Admisión)']++;
    });

    const stageDistribution = Object.entries(stagesCounts).map(([stage, count]) => ({
      stage,
      clientes: count,
      porcentaje: Math.round((count / totalClients) * 100)
    }));

    return {
      avgGlobalPercent,
      dimensionAverages,
      leaderDimension,
      gapDimension,
      stageDistribution
    };
  }, [clientExecutionMetrics]);

  // Sorted list of clients for the comparative bar chart
  const sortedClientsData = useMemo(() => {
    return [...clientExecutionMetrics]
      .sort((a, b) => b.executionPercent - a.executionPercent)
      .slice(0, 15); // Top 15 active clients for clarity
  }, [clientExecutionMetrics]);

  if (activeClients.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-3">
          <BarChart2 className="w-6 h-6" />
        </div>
        <h4 className="font-sans font-black text-slate-800 text-sm">
          Sin Clientes Activos Registrados
        </h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
          Registre su primera organización en el portal para visualizar las métricas consolidadas de ejecución estratégica CSEA v4.0.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
      {/* Header with Title and Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 rounded-xl shadow-sm">
            <TrendingUp className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-sans font-black text-slate-900 text-base tracking-tight">
                Progreso Promedio de Ejecución Estratégica
              </h3>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                Recharts Analytics
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Consolidado de desempeño metodológico en los {activeClients.length} clientes activos
            </p>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveView('dimensions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeView === 'dimensions'
                ? 'bg-slate-950 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>6 Dimensiones</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('clients')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeView === 'clients'
                ? 'bg-slate-950 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Por Cliente</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('stages')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeView === 'stages'
                ? 'bg-slate-950 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Etapas</span>
          </button>
        </div>
      </div>

      {/* 4 Executive KPI Badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* KPI 1: Global Average Execution Progress */}
        <div className="p-3.5 rounded-xl bg-slate-950 text-white border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-amber-400 font-bold tracking-wider">
              Índice Global
            </span>
            <Target className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="my-1.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black font-mono text-white">
                {portfolioStats.avgGlobalPercent}%
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">
                / 100% Meta
              </span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${portfolioStats.avgGlobalPercent}%` }}
              />
            </div>
          </div>
          <span className="text-[9px] text-slate-400 truncate">
            {portfolioStats.avgGlobalPercent >= 70 
              ? 'Nivel Alto / Optimización' 
              : portfolioStats.avgGlobalPercent >= 35 
              ? 'Nivel Medio / Controlado' 
              : portfolioStats.avgGlobalPercent > 0 
              ? 'Nivel Reactivo / Incipiente' 
              : 'Sin cuestionario contestado (0%)'}
          </span>
        </div>

        {/* KPI 2: Leader Dimension */}
        <div className={`p-3.5 rounded-xl flex flex-col justify-between border ${
          portfolioStats.leaderDimension 
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' 
            : 'bg-slate-50 border-slate-200 text-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-mono uppercase font-bold tracking-wider ${
              portfolioStats.leaderDimension ? 'text-emerald-700' : 'text-slate-500'
            }`}>
              Dimensión Líder
            </span>
            <Award className={`w-3.5 h-3.5 ${portfolioStats.leaderDimension ? 'text-emerald-600' : 'text-slate-400'}`} />
          </div>
          <div className="my-1">
            <span className={`text-base font-black font-sans block truncate ${
              portfolioStats.leaderDimension ? 'text-emerald-900' : 'text-slate-700'
            }`}>
              {portfolioStats.leaderDimension?.name || 'Pendiente de Inicio'}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-xs font-mono font-black ${
                portfolioStats.leaderDimension ? 'text-emerald-700' : 'text-slate-500'
              }`}>
                {portfolioStats.leaderDimension ? `${portfolioStats.leaderDimension.avgScore} / 5.0` : '0 / 5.0'}
              </span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                portfolioStats.leaderDimension 
                  ? 'bg-emerald-200/80 text-emerald-800' 
                  : 'bg-slate-200 text-slate-600'
              }`}>
                {portfolioStats.leaderDimension ? `${portfolioStats.leaderDimension.avgPercent}%` : '0%'}
              </span>
            </div>
          </div>
          <span className={`text-[9px] font-medium ${portfolioStats.leaderDimension ? 'text-emerald-700' : 'text-slate-500'}`}>
            {portfolioStats.leaderDimension ? 'Mayor madurez en portafolio' : 'Cuestionario pendiente'}
          </span>
        </div>

        {/* KPI 3: Priority Gap Dimension */}
        <div className={`p-3.5 rounded-xl flex flex-col justify-between border ${
          portfolioStats.gapDimension 
            ? 'bg-rose-50/70 border-rose-200 text-rose-950' 
            : 'bg-slate-50 border-slate-200 text-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-mono uppercase font-bold tracking-wider ${
              portfolioStats.gapDimension ? 'text-rose-700' : 'text-slate-500'
            }`}>
              Brecha Prioritaria
            </span>
            <ShieldAlert className={`w-3.5 h-3.5 ${portfolioStats.gapDimension ? 'text-rose-600' : 'text-slate-400'}`} />
          </div>
          <div className="my-1">
            <span className={`text-base font-black font-sans block truncate ${
              portfolioStats.gapDimension ? 'text-rose-900' : 'text-slate-700'
            }`}>
              {portfolioStats.gapDimension?.name || 'Pendiente de Inicio'}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-xs font-mono font-black ${
                portfolioStats.gapDimension ? 'text-rose-700' : 'text-slate-500'
              }`}>
                {portfolioStats.gapDimension ? `${portfolioStats.gapDimension.avgScore} / 5.0` : '0 / 5.0'}
              </span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                portfolioStats.gapDimension 
                  ? 'bg-rose-200/80 text-rose-800' 
                  : 'bg-slate-200 text-slate-600'
              }`}>
                {portfolioStats.gapDimension ? `${portfolioStats.gapDimension.avgPercent}%` : '0%'}
              </span>
            </div>
          </div>
          <span className={`text-[9px] font-medium ${portfolioStats.gapDimension ? 'text-rose-700' : 'text-slate-500'}`}>
            {portfolioStats.gapDimension ? 'Foco urgente de intervención' : 'Cuestionario pendiente'}
          </span>
        </div>

        {/* KPI 4: Active Clients Under Assessment */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-500 font-bold tracking-wider">
              Clientes Activos
            </span>
            <Users className="w-3.5 h-3.5 text-slate-600" />
          </div>
          <div className="my-1">
            <span className="text-2xl font-black font-mono text-slate-900">
              {activeClients.length}
            </span>
            <p className="text-[10px] text-slate-500 font-medium">
              Empresas en diagnóstico
            </p>
          </div>
          <span className="text-[9px] text-slate-500">100% aislados a su cuenta</span>
        </div>
      </div>

      {/* VIEW 1: 6 CSEA DIMENSIONS RADAR & BAR CHARTS */}
      {activeView === 'dimensions' && (
        <div className="grid lg:grid-cols-12 gap-5 pt-1">
          {/* Radar Chart (Recharts) */}
          <div className="lg:col-span-6 bg-slate-50 rounded-xl border border-slate-200/80 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Radar de Madurez por Dimensión
                </h4>
                <p className="text-[10px] text-slate-500">
                  Promedio Actual vs Meta de Excelencia CSEA (4.0 pts)
                </p>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-mono font-bold">
                <span className="flex items-center gap-1 text-amber-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Promedio
                </span>
                <span className="flex items-center gap-1 text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span> Meta (4.0)
                </span>
              </div>
            </div>

            <div className="h-64 w-full my-auto">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart 
                  cx="50%" 
                  cy="50%" 
                  outerRadius="75%" 
                  data={portfolioStats.dimensionAverages}
                >
                  <PolarGrid stroke="#cbd5e1" strokeDasharray="3 3" />
                  <PolarAngleAxis 
                    dataKey="radarLabel" 
                    tick={{ fontSize: 10, fill: '#1e293b', fontWeight: 700 }}
                  />
                  <PolarRadiusAxis 
                    angle={30} 
                    domain={[0, 5]} 
                    tick={{ fontSize: 9, fill: '#64748b' }} 
                    stroke="#94a3b8"
                  />
                  {/* Benchmark target line */}
                  <Radar
                    name="Meta CSEA"
                    dataKey="targetScore"
                    stroke="#94a3b8"
                    fill="#94a3b8"
                    fillOpacity={0.12}
                    strokeDasharray="4 4"
                  />
                  {/* Actual average line */}
                  <Radar
                    name="Promedio Portafolio"
                    dataKey="avgScore"
                    stroke="#D9822B"
                    fill="#D9822B"
                    fillOpacity={0.45}
                    strokeWidth={2.5}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-950 text-white p-2.5 rounded-xl shadow-xl border border-slate-800 text-xs space-y-1">
                            <p className="font-extrabold text-amber-400">{d.name} ({d.code})</p>
                            <div className="text-[11px] font-mono space-y-0.5">
                              <p className="text-slate-300">Puntaje promedio: <strong className="text-white">{d.avgScore} / 5.0</strong></p>
                              <p className="text-slate-300">Progreso de ejecución: <strong className="text-amber-400">{d.avgPercent}%</strong></p>
                              <p className="text-slate-400">Ponderación oficial: {Math.round(d.weight * 100)}%</p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            
            <p className="text-[10px] text-slate-400 text-center italic">
              Escala de reactivos CSEA: 1 (Deficiente) a 5 (Optimizado y Sistemático).
            </p>
          </div>

          {/* Bar Chart by Dimension (Recharts) */}
          <div className="lg:col-span-6 bg-slate-50 rounded-xl border border-slate-200/80 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Progreso Promedio por Dimensión (%)
                </h4>
                <p className="text-[10px] text-slate-500">
                  Porcentaje de avance respecto a la meta de ejecución
                </p>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                Benchmark: 80%
              </span>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={portfolioStats.dimensionAverages}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis 
                    type="number" 
                    domain={[0, 100]} 
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                    unit="%"
                  />
                  <YAxis 
                    type="category" 
                    dataKey="code" 
                    tick={{ fontSize: 11, fontWeight: 800, fill: '#0f172a' }} 
                    width={40}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload;
                        return (
                          <div className="bg-slate-950 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs space-y-1">
                            <p className="font-extrabold text-amber-400">{item.name}</p>
                            <p className="text-slate-300 font-mono text-xs">
                              Promedio: <span className="font-bold text-white">{item.avgPercent}%</span> ({item.avgScore} / 5.0)
                            </p>
                            <p className="text-[10px] text-slate-400">Ponderación en CSEA: {item.weight * 100}%</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  {/* Reference line at 80% benchmark */}
                  <ReferenceLine x={80} stroke="#059669" strokeDasharray="3 3" label={{ value: 'Meta 80%', fill: '#059669', fontSize: 9, position: 'top' }} />
                  <Bar dataKey="avgPercent" radius={[0, 6, 6, 0]}>
                    {portfolioStats.dimensionAverages.map((entry) => (
                      <Cell 
                        key={entry.code} 
                        fill={entry.avgPercent >= 70 ? '#10b981' : entry.avgPercent >= 50 ? '#D9822B' : '#f43f5e'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Dimension Breakdown Table Pills */}
            <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-200/80">
              {portfolioStats.dimensionAverages.map(d => (
                <div key={d.code} className="bg-white p-1.5 rounded-lg border border-slate-200/80 flex items-center justify-between text-[10px]">
                  <span className="font-bold text-slate-700">{d.code}</span>
                  <span className="font-mono font-extrabold text-slate-900">{d.avgPercent}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: CLIENT COMPARISON HORIZONTAL BAR CHART */}
      {activeView === 'clients' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <p className="font-bold text-slate-800">Comparativa de Ejecución Estratégica por Cliente</p>
              <p className="text-[11px] text-slate-500">Muestra el índice ponderado (%) de cada organización evaluada frente a la media general</p>
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span>Línea punteada: Promedio General ({portfolioStats.avgGlobalPercent}%)</span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sortedClientsData}
                margin={{ top: 10, right: 30, left: 10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="companyName" 
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  tick={{ fontSize: 10, fill: '#334155', fontWeight: 600 }}
                  height={50}
                />
                <YAxis 
                  domain={[0, 100]} 
                  unit="%" 
                  tick={{ fontSize: 10, fill: '#64748b' }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const c = payload[0].payload;
                      return (
                        <div className="bg-slate-950 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs space-y-1.5 max-w-xs">
                          <p className="font-extrabold text-amber-400 text-sm">{c.companyName}</p>
                          <p className="text-slate-300 text-[11px]">Patrocinador: <strong>{c.sponsorName}</strong></p>
                          <p className="text-slate-300 text-[11px]">Etapa: <strong>{c.stageName}</strong></p>
                          <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between font-mono text-xs">
                            <span className="text-slate-400">Progreso de Ejecución:</span>
                            <span className="font-extrabold text-emerald-400 text-sm">{c.executionPercent}%</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine 
                  y={portfolioStats.avgGlobalPercent} 
                  stroke="#D9822B" 
                  strokeWidth={2}
                  strokeDasharray="4 4" 
                  label={{ value: `Media: ${portfolioStats.avgGlobalPercent}%`, fill: '#D9822B', fontSize: 10, position: 'right' }} 
                />
                <Bar 
                  dataKey="executionPercent" 
                  radius={[6, 6, 0, 0]}
                  cursor="pointer"
                  onClick={(entry: any) => {
                    const clientRaw = entry?.raw || entry?.payload?.raw;
                    if (clientRaw && onSelectApplicant) {
                      onSelectApplicant(clientRaw);
                    }
                  }}
                >
                  {sortedClientsData.map((client) => {
                    const isSelected = selectedApplicantId === client.id;
                    const fillColor = client.executionPercent >= 70 
                      ? '#10b981' 
                      : client.executionPercent >= 45 
                      ? '#D9822B' 
                      : '#f43f5e';
                    return (
                      <Cell 
                        key={client.id} 
                        fill={fillColor}
                        stroke={isSelected ? '#0f172a' : 'transparent'}
                        strokeWidth={isSelected ? 2 : 0}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* VIEW 3: EXECUTION STAGES AREA & DISTRIBUTION */}
      {activeView === 'stages' && (
        <div className="grid lg:grid-cols-12 gap-5 pt-1">
          {/* Area Chart: Progression by Stage */}
          <div className="lg:col-span-7 bg-slate-50 rounded-xl border border-slate-200/80 p-4 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Avance en el Ciclo de Evaluación CSEA
              </h4>
              <p className="text-[10px] text-slate-500">
                Distribución de organizaciones en las 4 fases de consultoría estratégica
              </p>
            </div>

            <div className="h-60 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={portfolioStats.stageDistribution}
                  margin={{ top: 10, right: 20, left: -10, bottom: 25 }}
                >
                  <defs>
                    <linearGradient id="colorStage" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D9822B" stopOpacity={0.7}/>
                      <stop offset="95%" stopColor="#D9822B" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="stage" 
                    tick={{ fontSize: 9, fill: '#334155', fontWeight: 600 }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-950 text-white p-2.5 rounded-xl shadow-xl border border-slate-800 text-xs space-y-1">
                            <p className="font-extrabold text-amber-400">{d.stage}</p>
                            <p className="text-slate-300 font-mono">Clientes: <strong className="text-white">{d.clientes}</strong> ({d.porcentaje}%)</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="clientes" 
                    stroke="#D9822B" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#colorStage)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cards for each stage */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-2.5">
            {portfolioStats.stageDistribution.map((item, idx) => (
              <div 
                key={item.stage}
                className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between shadow-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center font-mono font-black text-xs">
                    {idx + 1}
                  </div>
                  <div>
                    <h5 className="font-sans font-bold text-slate-900 text-xs">
                      {item.stage}
                    </h5>
                    <p className="text-[10px] text-slate-500">
                      {item.clientes} organizaciones registradas
                    </p>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="text-sm font-black text-slate-900">
                    {item.porcentaje}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Insight Banner */}
      <div className="bg-slate-900 text-slate-300 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="text-slate-300 text-[11px] leading-relaxed">
            {portfolioStats.avgGlobalPercent === 0 ? (
              <>
                <strong>Estado Inicial CSEA:</strong> El portafolio activo se encuentra al <strong>0% de avance</strong> debido a que las organizaciones registradas aún no han contestado el cuestionario de entrevista estratégica CSEA (30 reactivos). Inicie la evaluación para comenzar a registrar el progreso.
              </>
            ) : (
              <>
                <strong>Lectura Estratégica CSEA:</strong> El portafolio activo promedia un <strong>{portfolioStats.avgGlobalPercent}%</strong> de avance de ejecución. La prioridad inmediata de consultoría se ubica en fortalecer <strong>{portfolioStats.gapDimension?.name || 'las capacidades organizacionales'}</strong>.
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
