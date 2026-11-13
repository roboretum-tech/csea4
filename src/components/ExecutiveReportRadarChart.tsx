import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  Legend
} from 'recharts';

export interface DimensionScoreItem {
  name: string;
  score: number;
  max: number;
}

interface ExecutiveReportRadarChartProps {
  dimensions: DimensionScoreItem[];
  globalIndex: number;
  companyName?: string;
  benchmarkScore?: number;
  className?: string;
  showDetails?: boolean;
}

const DIMENSION_META: Record<string, { code: string; short: string; weight: number }> = {
  'alineacion': { code: 'ALI', short: 'Alineación Estratégica', weight: 0.20 },
  'priorizacion': { code: 'PRI', short: 'Priorización y Portafolio', weight: 0.20 },
  'gobernanza': { code: 'GOB', short: 'Gobernanza y Decisiones', weight: 0.20 },
  'disciplina': { code: 'DIS', short: 'Disciplina de Ejecución', weight: 0.15 },
  'capacidad': { code: 'CAP', short: 'Capacidad Organizacional', weight: 0.15 },
  'visibilidad': { code: 'VIS', short: 'Visibilidad y Control', weight: 0.10 }
};

function normalizeStr(str?: string): string {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function getRelativeReading(score: number): { label: string; color: string; bg: string } {
  if (score >= 4.0) return { label: 'Fortaleza relativa', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' };
  if (score >= 3.0) return { label: 'Capacidad en desarrollo', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' };
  if (score >= 2.0) return { label: 'Requiere fortalecimiento', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' };
  return { label: 'Brecha relevante', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' };
}

export const ExecutiveReportRadarChart: React.FC<ExecutiveReportRadarChartProps> = ({
  dimensions,
  globalIndex,
  companyName = 'la Organización',
  benchmarkScore = 4.0,
  className = '',
  showDetails = true
}) => {
  const radarData = useMemo(() => {
    // Standard ordered dimensions list (ALI, PRI, GOB, DIS, CAP, VIS)
    const order = [
      { key: 'alineacion', fallbackCode: 'ALI', label: 'ALI: Alineación', fullName: 'Alineación Estratégica', weight: 0.20 },
      { key: 'priorizacion', fallbackCode: 'PRI', label: 'PRI: Priorización', fullName: 'Priorización y Gestión del Portafolio', weight: 0.20 },
      { key: 'gobernanza', fallbackCode: 'GOB', label: 'GOB: Gobernanza', fullName: 'Gobernanza y Toma de Decisiones', weight: 0.20 },
      { key: 'disciplina', fallbackCode: 'DIS', label: 'DIS: Disciplina', fullName: 'Disciplina de Ejecución', weight: 0.15 },
      { key: 'capacidad', fallbackCode: 'CAP', label: 'CAP: Capacidad', fullName: 'Capacidad Organizacional', weight: 0.15 },
      { key: 'visibilidad', fallbackCode: 'VIS', label: 'VIS: Visibilidad', fullName: 'Visibilidad y Control Ejecutivo', weight: 0.10 }
    ];

    return order.map((dimInfo, idx) => {
      // Find matching item in dimensions prop
      const match = dimensions.find(d => {
        const normName = normalizeStr(d.name);
        return normName.includes(dimInfo.key) || normName.includes(dimInfo.fallbackCode.toLowerCase());
      }) || dimensions[idx];

      const rawScore = match && typeof match.score === 'number' ? match.score : 0;
      const score = Math.round(rawScore * 10) / 10;
      const reading = getRelativeReading(score);

      return {
        dimension: dimInfo.label,
        fullName: dimInfo.fullName,
        code: dimInfo.fallbackCode,
        score,
        benchmark: benchmarkScore,
        maxScore: 5.0,
        weight: Math.round(dimInfo.weight * 100),
        reading: reading.label,
        readingColor: reading.color,
        readingBg: reading.bg
      };
    });
  }, [dimensions, benchmarkScore]);

  return (
    <div className={`bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden ${className}`}>
      {/* Chart Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50/80 to-white">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
            <h4 className="font-sans font-black text-slate-900 text-sm tracking-tight">
              Radar de Madurez por Dimensión — CSEA v4.0
            </h4>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluación integral de las 6 dimensiones estratégicas para <strong className="text-slate-800">{companyName}</strong>
          </p>
        </div>

        {/* Global Index Indicator & Legend */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[11px] font-mono font-bold">
            <span className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/80">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs"></span>
              <span>Puntuación Actual</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/80">
              <span className="w-2.5 h-0.5 bg-slate-400"></span>
              <span>Meta ({benchmarkScore.toFixed(1)})</span>
            </span>
          </div>
          <div className="px-3 py-1 bg-slate-950 text-white rounded-lg text-center shrink-0 border border-slate-800 shadow-xs">
            <span className="text-[9px] text-amber-400 font-mono block uppercase leading-none">Índice Global</span>
            <span className="text-sm font-black text-amber-400 font-mono">{globalIndex}%</span>
          </div>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="p-4 grid lg:grid-cols-12 gap-6 items-center">
        {/* Radar Graphic Container */}
        <div className="lg:col-span-7 h-72 sm:h-80 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="72%" data={radarData}>
              <PolarGrid stroke="#cbd5e1" strokeDasharray="3 3" />
              <PolarAngleAxis
                dataKey="dimension"
                tick={{ fontSize: 11, fill: '#1e293b', fontWeight: 800, fontFamily: 'inherit' }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 5]}
                tickCount={6}
                tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }}
                stroke="#94a3b8"
              />
              
              {/* Benchmark Reference Target (4.0) */}
              <Radar
                name={`Meta CSEA (${benchmarkScore.toFixed(1)})`}
                dataKey="benchmark"
                stroke="#94a3b8"
                fill="#94a3b8"
                fillOpacity={0.12}
                strokeDasharray="4 4"
                strokeWidth={1.5}
              />

              {/* Actual Assessment Score */}
              <Radar
                name={`${companyName}`}
                dataKey="score"
                stroke="#D9822B"
                fill="#D9822B"
                fillOpacity={0.42}
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#D9822B', stroke: '#fff', strokeWidth: 1.5 }}
                activeDot={{ r: 6, fill: '#b45309', stroke: '#fff', strokeWidth: 2 }}
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-950/95 backdrop-blur-md text-white p-3 rounded-xl shadow-2xl border border-slate-800 text-xs space-y-1.5 min-w-[200px]">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                          <span className="font-mono font-bold text-amber-400 text-[10px]">[{data.code}]</span>
                          <span className="font-mono text-[10px] text-slate-400">Peso: {data.weight}%</span>
                        </div>
                        <p className="font-black text-white text-xs">{data.fullName}</p>
                        <div className="pt-1 space-y-1 font-mono text-[11px]">
                          <div className="flex justify-between items-center text-slate-300">
                            <span>Resultado Obtenido:</span>
                            <strong className="text-amber-400 text-sm font-black">{data.score.toFixed(1)} / 5.0</strong>
                          </div>
                          <div className="flex justify-between items-center text-slate-400 text-[10px]">
                            <span>Meta CSEA:</span>
                            <span>{data.benchmark.toFixed(1)} / 5.0</span>
                          </div>
                          <div className="flex justify-between items-center text-slate-300 text-[10px] pt-0.5 border-t border-slate-800/80">
                            <span>Diagnóstico:</span>
                            <span className="font-sans font-bold text-amber-300">{data.reading}</span>
                          </div>
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

        {/* Dimension Breakdown Side Cards */}
        {showDetails && (
          <div className="lg:col-span-5 space-y-2 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6">
            <div className="flex items-center justify-between pb-1">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-500">
                Puntuación por Dimensión (Escala 1–5)
              </span>
              <span className="text-[10px] font-mono text-slate-400">Ponderado</span>
            </div>

            <div className="grid gap-2">
              {radarData.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-lg border border-slate-200/70 hover:border-amber-400/50 transition-all bg-slate-50/50 hover:bg-white text-xs flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-md bg-slate-900 text-amber-400 font-mono text-[10px] font-extrabold flex items-center justify-center shrink-0">
                      {item.code}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 text-[11px] truncate group-hover:text-slate-950">
                        {item.fullName}
                      </p>
                      <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-semibold border ${item.readingBg} ${item.readingColor}`}>
                        {item.reading}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono font-black text-slate-900 text-xs">
                      {item.score.toFixed(1)} <span className="text-[10px] text-slate-400 font-normal">/ 5</span>
                    </div>
                    <span className="text-[9px] font-mono text-slate-500">
                      Peso {item.weight}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[10px] text-slate-400 text-center italic pt-1">
              Escala metodológica CSEA v4.0: 1.0 (Deficiente) a 5.0 (Optimizado institucional).
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExecutiveReportRadarChart;
