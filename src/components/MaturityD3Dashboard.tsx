import { useRef, useState, useEffect } from 'react';
import * as d3 from 'd3';
import { Applicant } from '../types';
import { motion } from 'motion/react';
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle2, Award } from 'lucide-react';

interface MaturityD3DashboardProps {
  applicants: Applicant[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

export function calculateMaturity(a: Applicant): { 
  score: number; 
  level: 'Bajo' | 'Medio' | 'Alto' | 'Sin Evaluar'; 
  levelLabel: string;
  isEvaluated: boolean;
} {
  let score = 0;
  let isEvaluated = false;

  const totalInterviewScored = a.interview?.bloques?.reduce((acc, b) => {
    return acc + (b.preguntas?.filter(q => typeof q.score === 'number' && q.score > 0).length || 0);
  }, 0) || 0;

  if (a.executiveReport && typeof a.executiveReport.globalIndex === 'number') {
    score = a.executiveReport.globalIndex;
    isEvaluated = true;
  } else if (totalInterviewScored > 0) {
    const totalPoints = a.interview!.bloques.reduce((acc, b) => {
      return acc + (b.preguntas?.filter(q => typeof q.score === 'number' && q.score > 0).reduce((s, q) => s + (q.score || 0), 0) || 0);
    }, 0);
    const avg = totalPoints / totalInterviewScored;
    score = Math.min(100, Math.max(0, Math.round((avg / 5) * 100)));
    isEvaluated = true;
  } else if (a.hasCompletedB && a.answersB && Object.keys(a.answersB).length > 0) {
    const answeredCountB = Object.keys(a.answersB).length;
    const sumB = Object.values(a.answersB).reduce((acc, val) => acc + (Number(val) || 0), 0);
    score = Math.max(0, Math.min(100, Math.round((sumB / (answeredCountB * 5)) * 100)));
    isEvaluated = true;
  } else {
    // No questionnaire or interview has been evaluated yet
    score = 0;
    isEvaluated = false;
  }

  if (!isEvaluated) {
    return {
      score: 0,
      level: 'Sin Evaluar',
      levelLabel: 'Sin evaluar (Pendiente de Diagnóstico)',
      isEvaluated: false
    };
  }

  let level: 'Bajo' | 'Medio' | 'Alto' = 'Bajo';
  let levelLabel = 'Reactiva / Incipiente (<35%)';
  
  if (score >= 70) {
    level = 'Alto';
    levelLabel = 'Optimización Alta (>=70%)';
  } else if (score >= 35) {
    level = 'Medio';
    levelLabel = 'Controlada y Estándar (35%-69%)';
  } else {
    level = 'Bajo';
    levelLabel = 'Reactiva / Incipiente (<35%)';
  }

  return { score, level, levelLabel, isEvaluated: true };
}

export default function MaturityD3Dashboard({ applicants, selectedCategory, onSelectCategory }: MaturityD3DashboardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Compute portfolio stats
  const totalProjects = applicants.length;
  
  const applicantsWithMaturity = applicants.map(a => ({
    ...a,
    maturity: calculateMaturity(a)
  }));

  const evaluatedApplicants = applicantsWithMaturity.filter(a => a.maturity.isEvaluated);
  const evaluatedCount = evaluatedApplicants.length;

  const sinEvaluarCount = applicantsWithMaturity.filter(a => a.maturity.level === 'Sin Evaluar').length;
  const bajoCount = applicantsWithMaturity.filter(a => a.maturity.level === 'Bajo').length;
  const medioCount = applicantsWithMaturity.filter(a => a.maturity.level === 'Medio').length;
  const altoCount = applicantsWithMaturity.filter(a => a.maturity.level === 'Alto').length;

  // Average score calculated strictly over organizations with actual evaluation data
  const averageScore = evaluatedCount > 0
    ? Math.round(evaluatedApplicants.reduce((sum, a) => sum + a.maturity.score, 0) / evaluatedCount)
    : 0;

  // Render D3 Donut Chart with fixed viewBox coordinate space (260x260)
  useEffect(() => {
    if (!svgRef.current || totalProjects === 0) return;

    const width = 260;
    const height = 260;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const data = [
      { label: 'Alto', value: altoCount, color: '#34d399', hoverColor: '#10b981', desc: 'Optimización Alta (>=70%)' },
      { label: 'Medio', value: medioCount, color: '#fbbf24', hoverColor: '#f59e0b', desc: 'Controlada y Estándar (35%-69%)' },
      { label: 'Bajo', value: bajoCount, color: '#f87171', hoverColor: '#ef4444', desc: 'Reactiva / Incipiente (<35%)' },
      { label: 'Sin Evaluar', value: sinEvaluarCount, color: '#94a3b8', hoverColor: '#64748b', desc: 'Sin Evaluar (Pendiente de Diagnóstico)' }
    ].filter(d => d.value > 0);

    // Coordinate space: Center (130, 130), Radius 96 leaves 34px margin all around so hover (+8) never clips
    const radius = 96;
    const innerRadius = 58;

    const pie = d3.pie<any>()
      .value(d => d.value)
      .sort(null);

    const arc = d3.arc<any>()
      .innerRadius(innerRadius)
      .outerRadius(radius)
      .cornerRadius(6)
      .padAngle(0.04);

    const arcHover = d3.arc<any>()
      .innerRadius(innerRadius - 4)
      .outerRadius(radius + 8)
      .cornerRadius(6)
      .padAngle(0.04);

    const g = svg.append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    // Center text group
    const centerTextGroup = g.append('g')
      .attr('text-anchor', 'middle');

    const centerLabel = centerTextGroup.append('text')
      .attr('dy', '-6px')
      .style('font-family', 'Inter, system-ui, sans-serif')
      .style('font-size', '10px')
      .style('font-weight', '700')
      .style('fill', '#94a3b8')
      .style('text-transform', 'uppercase')
      .style('letter-spacing', '0.06em')
      .text(selectedCategory ? `Filtro: ${selectedCategory}` : 'Cartera');

    const centerValue = centerTextGroup.append('text')
      .attr('dy', '15px')
      .style('font-family', 'Inter, system-ui, sans-serif')
      .style('font-size', '17px')
      .style('font-weight', '800')
      .style('fill', '#0f172a')
      .text(
        selectedCategory 
          ? `${applicantsWithMaturity.filter(a => a.maturity.level === selectedCategory).length} Proyectos`
          : `${totalProjects} Proyectos`
      );

    const slices = g.selectAll('path')
      .data(pie(data))
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', d => {
        // Highlight active or hovered categories
        if (selectedCategory && d.data.label !== selectedCategory) {
          return '#e2e8f0'; // Gray out other categories
        }
        return d.data.color;
      })
      .style('cursor', 'pointer')
      .style('transition', 'fill 0.2s ease, opacity 0.2s ease')
      .attr('id', d => `d3-slice-${d.data.label.toLowerCase().replace(/\s+/g, '_')}`);

    // Entry animation
    slices.transition()
      .duration(650)
      .attrTween('d', function(d) {
        const interpolate = d3.interpolate({ startAngle: d.startAngle, endAngle: d.startAngle }, d);
        return function(t) {
          return arc(interpolate(t)) || '';
        };
      });

    // Interactivity
    slices.on('mouseover', function(event, d) {
      if (selectedCategory && d.data.label !== selectedCategory) return;
      
      d3.select(this)
        .transition()
        .duration(150)
        .attr('d', arcHover)
        .attr('fill', d.data.hoverColor);

      const percent = totalProjects > 0 ? Math.round((d.data.value / totalProjects) * 100) : 0;
      centerLabel.text(d.data.label.toUpperCase());
      centerValue.text(`${d.data.value} (${percent}%)`);
      setHoveredCategory(d.data.label);
    })
    .on('mouseout', function(event, d) {
      d3.select(this)
        .transition()
        .duration(150)
        .attr('d', arc)
        .attr('fill', () => {
          if (selectedCategory && d.data.label !== selectedCategory) {
            return '#e2e8f0';
          }
          return d.data.color;
        });

      centerLabel.text(selectedCategory ? `Filtro: ${selectedCategory}` : 'Cartera');
      centerValue.text(
        selectedCategory 
          ? `${applicantsWithMaturity.filter(a => a.maturity.level === selectedCategory).length} Proyectos`
          : `${totalProjects} Proyectos`
      );
      setHoveredCategory(null);
    })
    .on('click', function(event, d) {
      if (selectedCategory === d.data.label) {
        onSelectCategory(null);
      } else {
        onSelectCategory(d.data.label);
      }
    });

  }, [totalProjects, bajoCount, medioCount, altoCount, sinEvaluarCount, selectedCategory]);

  return (
    <div id="maturity-d3-dashboard-root" className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
      
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-500/10 text-amber-600 rounded">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h2 className="font-sans text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
              Análisis de Cartera: Madurez CSEA 3.2
            </h2>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Distribución operativa agregada de todas las empresas diagnosticadas en el portafolio.
          </p>
        </div>
        {selectedCategory && (
          <button
            onClick={() => onSelectCategory(null)}
            className="px-2.5 py-1 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition uppercase tracking-wider cursor-pointer self-start sm:self-auto"
          >
            Quitar Filtro ×
          </button>
        )}
      </div>

      {totalProjects === 0 ? (
        <div className="text-center py-10 text-slate-400 text-xs flex flex-col items-center justify-center space-y-2">
          <TrendingUp className="w-10 h-10 text-slate-300" />
          <p className="font-semibold">No hay suficientes datos para graficar</p>
          <p className="text-[10px] text-slate-400">Los proyectos registrados aparecerán distribuidos aquí según su nivel.</p>
        </div>
      ) : (
        /* Preservation of 3-child DOM structure for CSS selectors 1-7 */
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          
          {/* Key Metric cards (Child 1) */}
          <div className="col-span-12 space-y-2.5">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-slate-50 border border-slate-200/80 p-2.5 rounded-xl text-center space-y-0.5">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total Clientes</p>
                <p className="text-xl font-black text-slate-900 leading-tight">{totalProjects}</p>
                <p className="text-[9px] text-slate-500">En cartera</p>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 p-2.5 rounded-xl text-center space-y-0.5">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Madurez Promedio</p>
                <p className="text-xl font-black text-amber-500 leading-tight">{averageScore}%</p>
                <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden max-w-[60px] mx-auto mt-0.5">
                  <div className="bg-amber-500 h-full" style={{ width: `${averageScore}%` }}></div>
                </div>
                <p className="text-[8px] text-slate-400 font-mono">{evaluatedCount} de {totalProjects} evaluadas</p>
              </div>
            </div>

            {/* Quick breakdown visual bar */}
            <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-2 text-xs text-slate-600 space-y-1.5">
              <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                <span>Distribución del Portafolio</span>
                <span>{evaluatedCount} evaluadas ({totalProjects > 0 ? Math.round((evaluatedCount/totalProjects)*100) : 0}%)</span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden flex">
                <div style={{ width: `${totalProjects > 0 ? (altoCount/totalProjects)*100 : 0}%` }} className="bg-emerald-400 h-full transition-all" title={`Alta: ${altoCount}`} />
                <div style={{ width: `${totalProjects > 0 ? (medioCount/totalProjects)*100 : 0}%` }} className="bg-amber-400 h-full transition-all" title={`Media: ${medioCount}`} />
                <div style={{ width: `${totalProjects > 0 ? (bajoCount/totalProjects)*100 : 0}%` }} className="bg-rose-400 h-full transition-all" title={`Baja: ${bajoCount}`} />
                <div style={{ width: `${totalProjects > 0 ? (sinEvaluarCount/totalProjects)*100 : 0}%` }} className="bg-slate-400 h-full transition-all" title={`Sin Evaluar: ${sinEvaluarCount}`} />
              </div>
            </div>
          </div>

          {/* D3 Donut visualization (Child 2) */}
          <div className="col-span-12 sm:col-span-6 flex justify-center items-center py-1 min-w-0" ref={containerRef}>
            <svg
              ref={svgRef}
              viewBox="0 0 260 260"
              preserveAspectRatio="xMidYMid meet"
              className="w-full max-w-[210px] aspect-square overflow-visible mx-auto block drop-shadow-xs"
            />
          </div>

          {/* Dynamic interactive legend and categorization (Child 3) */}
          <div className="col-span-12 sm:col-span-6 space-y-1.5">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Haga clic para filtrar listado:
            </h4>
            
            {[
              {
                label: 'Alto',
                title: 'Optimización Alta (>=70%)',
                count: altoCount,
                color: 'emerald',
                borderColor: 'border-emerald-200',
                activeBg: 'bg-emerald-500/10 text-emerald-800 border-emerald-400 shadow-xs',
                inactiveBg: 'bg-white hover:bg-emerald-50/50 border-slate-200 text-slate-700',
                desc: 'Procesos claros y alineamiento metodológico.',
                icon: Award,
              },
              {
                label: 'Medio',
                title: 'Madurez Media (35%-69%)',
                count: medioCount,
                color: 'amber',
                borderColor: 'border-amber-200',
                activeBg: 'bg-amber-500/10 text-amber-800 border-amber-400 shadow-xs',
                inactiveBg: 'bg-white hover:bg-amber-50/50 border-slate-200 text-slate-700',
                desc: 'Control estándar pero silos funcionales.',
                icon: CheckCircle2,
              },
              {
                label: 'Bajo',
                title: 'Reactiva / Bajo (<35%)',
                count: bajoCount,
                color: 'red',
                borderColor: 'border-red-200',
                activeBg: 'bg-rose-500/10 text-rose-800 border-rose-400 shadow-xs',
                inactiveBg: 'bg-white hover:bg-rose-50/50 border-slate-200 text-slate-700',
                desc: 'Operación bajo urgencias cotidianas.',
                icon: AlertTriangle,
              },
              {
                label: 'Sin Evaluar',
                title: 'Sin Evaluar (Pendiente)',
                count: sinEvaluarCount,
                color: 'slate',
                borderColor: 'border-slate-200',
                activeBg: 'bg-slate-900 text-white border-slate-800 shadow-xs',
                inactiveBg: 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700',
                desc: 'Organizaciones registradas sin diagnóstico aún.',
                icon: TrendingUp,
              }
            ].map((item) => {
              const isSelected = selectedCategory === item.label;
              const isHovered = hoveredCategory === item.label;
              const IconComp = item.icon;
              
              return (
                <button
                  type="button"
                  key={item.label}
                  onClick={() => onSelectCategory(isSelected ? null : item.label)}
                  className={`w-full p-2 text-left rounded-lg border text-xs transition-all flex items-start gap-2 cursor-pointer ${
                    isSelected ? item.activeBg : item.inactiveBg
                  } ${isHovered ? 'ring-2 ring-slate-400/25 scale-[1.01]' : ''}`}
                >
                  <IconComp className={`w-4 h-4 mt-0.5 shrink-0 ${
                    item.color === 'emerald' ? 'text-emerald-500' : item.color === 'amber' ? 'text-amber-500' : item.color === 'red' ? 'text-rose-500' : 'text-slate-400'
                  }`} />
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="flex items-center justify-between font-bold text-slate-950">
                      <span className="font-semibold text-slate-900 truncate text-[11px]">{item.title}</span>
                      <span className={`px-1.5 py-0.2 rounded-full font-mono text-[9px] ${
                        item.color === 'emerald' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : item.color === 'amber' 
                          ? 'bg-amber-100 text-amber-800' 
                          : item.color === 'red' 
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {item.count}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight font-normal truncate">
                      {item.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

        </div>
      )}

    </div>
  );
}
