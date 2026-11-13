import { CSEAInterview, Applicant } from '../types';

interface ScoredQuestionAnalysis {
  id: string;
  codigo: string;
  texto: string;
  score: number;
  respuesta: string;
  notas: string;
  dimensionName: string;
}

export function generateDeterministicReport(applicant: Applicant): {
  globalIndex: number;
  dimensions: Array<{ name: string; score: number; max: number }>;
  findings: string[];
  risks: string[];
  quickWins: string[];
  roadmap90Days: string[];
  markdownReport: string;
} {
  const interview = applicant.interview || { bloques: [] };
  const companyName = applicant.companyName || 'la organización';
  const sponsorName = applicant.sponsorName || 'la Dirección General';

  const normalizeStr = (str?: string) =>
    (str || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

  const findBlock = (index: number, code: string, keywords: string[]) => {
    const found = interview.bloques.find(b => {
      const id = normalizeStr(b.idBloque);
      const name = normalizeStr(b.nombreBloque);
      const targetCode = normalizeStr(code);
      if (id === targetCode || id.startsWith(targetCode)) return true;
      for (const kw of keywords) {
        const normKw = normalizeStr(kw);
        if (id.includes(normKw) || name.includes(normKw)) return true;
      }
      return false;
    });
    if (found) return found;

    if (interview.bloques && interview.bloques[index]) {
      return interview.bloques[index];
    }
    return undefined;
  };

  const bAli = findBlock(0, 'ALI', ['alineacion', 'estrategica', 'alineacion_estrategica']);
  const bPri = findBlock(1, 'PRI', ['priorizacion', 'portafolio', 'priorizacion_portafolio']);
  const bGob = findBlock(2, 'GOB', ['gobernanza', 'decisiones', 'gobernanza_decisiones']);
  const bDis = findBlock(3, 'DIS', ['disciplina', 'ejecucion', 'disciplina_ejecucion']);
  const bCap = findBlock(4, 'CAP', ['capacidad', 'organizacional', 'capacidad_organizacional']);
  const bVis = findBlock(5, 'VIS', ['visibilidad', 'control', 'visibilidad_control']);

  // Extract all questions with valid scores
  const allScoredQuestions: ScoredQuestionAnalysis[] = [];
  interview.bloques.forEach((b) => {
    (b.preguntas || []).forEach((q) => {
      const numScore = Number(q.score);
      if (!isNaN(numScore) && numScore >= 1 && numScore <= 5) {
        allScoredQuestions.push({
          id: q.idPregunta,
          codigo: q.codigo || q.idPregunta,
          texto: q.texto,
          score: numScore,
          respuesta: (q.respuesta || '').trim(),
          notas: (q.notas || '').trim(),
          dimensionName: b.nombreBloque
        });
      }
    });
  });

  const overallAvg = allScoredQuestions.length > 0 
    ? Math.round((allScoredQuestions.reduce((acc, q) => acc + q.score, 0) / allScoredQuestions.length) * 10) / 10 
    : 3.0;

  const calcBlockMetrics = (block: any, dimName: string) => {
    if (!block || !block.preguntas || block.preguntas.length === 0) {
      return {
        score: overallAvg,
        strengths: [] as ScoredQuestionAnalysis[],
        weaknesses: [] as ScoredQuestionAnalysis[],
        moderate: [] as ScoredQuestionAnalysis[],
        all: [] as ScoredQuestionAnalysis[]
      };
    }
    const questions: ScoredQuestionAnalysis[] = block.preguntas
      .map((q: any) => ({
        id: q.idPregunta,
        codigo: q.codigo || q.idPregunta,
        texto: q.texto,
        score: typeof q.score === 'number' && q.score >= 1 && q.score <= 5 ? q.score : 3,
        respuesta: (q.respuesta || '').trim(),
        notas: (q.notas || '').trim(),
        dimensionName: dimName
      }));

    const sum = questions.reduce((acc, q) => acc + q.score, 0);
    const avgScore = questions.length > 0 ? Math.round((sum / questions.length) * 10) / 10 : overallAvg;

    const weaknesses = questions.filter(q => q.score <= 2).sort((a, b) => a.score - b.score);
    const strengths = questions.filter(q => q.score >= 4).sort((a, b) => b.score - a.score);
    const moderate = questions.filter(q => q.score === 3);

    return {
      score: avgScore,
      strengths,
      weaknesses,
      moderate,
      all: questions
    };
  };

  const dimAli = calcBlockMetrics(bAli, 'Alineación Estratégica');
  const dimPri = calcBlockMetrics(bPri, 'Priorización y Gestión del Portafolio');
  const dimGob = calcBlockMetrics(bGob, 'Gobernanza y Toma de Decisiones');
  const dimDis = calcBlockMetrics(bDis, 'Disciplina de Ejecución');
  const dimCap = calcBlockMetrics(bCap, 'Capacidad Organizacional');
  const dimVis = calcBlockMetrics(bVis, 'Visibilidad y Control Ejecutivo');

  const scoreAlineacion = dimAli.score;
  const scorePriorizacion = dimPri.score;
  const scoreGobernanza = dimGob.score;
  const scoreDisciplina = dimDis.score;
  const scoreCapacidad = dimCap.score;
  const scoreVisibilidad = dimVis.score;

  const weightedSum =
    (scoreAlineacion * 0.20) +
    (scorePriorizacion * 0.20) +
    (scoreGobernanza * 0.20) +
    (scoreDisciplina * 0.15) +
    (scoreCapacidad * 0.15) +
    (scoreVisibilidad * 0.10);

  const globalIndex = Math.min(100, Math.max(0, Math.round((weightedSum / 5) * 100)));

  const dimensions = [
    { name: 'Alineación Estratégica', score: scoreAlineacion, max: 5 },
    { name: 'Priorización y Gestión del Portafolio', score: scorePriorizacion, max: 5 },
    { name: 'Gobernanza y Toma de Decisiones', score: scoreGobernanza, max: 5 },
    { name: 'Disciplina de Ejecución', score: scoreDisciplina, max: 5 },
    { name: 'Capacidad Organizacional', score: scoreCapacidad, max: 5 },
    { name: 'Visibilidad y Control Ejecutivo', score: scoreVisibilidad, max: 5 }
  ];

  const getRelativeReading = (score: number) => {
    if (score >= 4.0) return 'Fortaleza relativa';
    if (score >= 3.0) return 'Capacidad en desarrollo';
    if (score >= 2.0) return 'Requiere fortalecimiento';
    return 'Brecha relevante';
  };

  // Rank dimensions from strongest to most critical
  const dimList = [
    { key: 'ALI', name: 'Alineación Estratégica', metrics: dimAli, weight: 0.20 },
    { key: 'PRI', name: 'Priorización y Gestión del Portafolio', metrics: dimPri, weight: 0.20 },
    { key: 'GOB', name: 'Gobernanza y Toma de Decisiones', metrics: dimGob, weight: 0.20 },
    { key: 'DIS', name: 'Disciplina de Ejecución', metrics: dimDis, weight: 0.15 },
    { key: 'CAP', name: 'Capacidad Organizacional', metrics: dimCap, weight: 0.15 },
    { key: 'VIS', name: 'Visibilidad y Control Ejecutivo', metrics: dimVis, weight: 0.10 }
  ];

  const sortedByScoreAsc = [...dimList].sort((a, b) => a.metrics.score - b.metrics.score);
  const sortedByScoreDesc = [...dimList].sort((a, b) => b.metrics.score - a.metrics.score);

  const primaryBrecha = sortedByScoreAsc[0];
  const secondaryBrecha = sortedByScoreAsc[1];
  const primaryFortaleza = sortedByScoreDesc[0];

  // Helper to extract a short human concept from question text
  const cleanConcept = (text: string) => {
    return text
      .replace(/^¿/, '')
      .replace(/\?$/, '')
      .replace(/^(La dirección|Los proyectos|La organización|El equipo|Existen|Existe|Se cuenta con)\s+/i, '')
      .trim();
  };

  // Helper to build tailored analysis for Section 5 per dimension
  const buildDimensionAnalysis = (
    title: string,
    score: number,
    metrics: ReturnType<typeof calcBlockMetrics>,
    standardContext: {
      highText: string;
      midText: string;
      lowText: string;
      highStrengths: string;
      midStrengths: string;
      lowStrengths: string;
      highOpportunities: string;
      lowOpportunities: string;
      highImplication: string;
      lowImplication: string;
    }
  ) => {
    const reading = getRelativeReading(score);
    const weakList = metrics.weaknesses;
    const strongList = metrics.strengths;

    // Build specific evidence mention
    let evidenceContext = '';
    if (weakList.length > 0) {
      const topWeak = weakList[0];
      const detail = topWeak.respuesta ? ` Al respecto, se capturó: "${topWeak.respuesta}".` : (topWeak.notas ? ` Notas del diagnóstico: "${topWeak.notas}".` : '');
      evidenceContext += ` En particular, la evaluación detectó atención prioritaria en torno a: "${topWeak.texto}" (resultado observado: ${topWeak.score}/5).${detail}`;
    }

    if (strongList.length > 0) {
      const topStrong = strongList[0];
      const detail = topStrong.respuesta ? ` Se documentó: "${topStrong.respuesta}".` : '';
      evidenceContext += ` Por otra parte, la organización muestra solidez destacada en: "${topStrong.texto}" (${topStrong.score}/5).${detail}`;
    }

    let lectura = '';
    let capacidades = '';
    let oportunidades = '';
    let implicacion = '';

    if (score >= 3.8) {
      lectura = `${standardContext.highText} Los resultados reflejan un nivel de madurez sobresaliente (${score.toFixed(1)}/5), situando a esta dimensión como un ancla y fortaleza competitiva clave para ${companyName}.${evidenceContext}`;
      capacidades = `${standardContext.highStrengths} ${strongList.length > 0 ? `Se evidencia una práctica estructurada y madura en ${strongList.map(s => `"${cleanConcept(s.texto)}"`).slice(0, 2).join(' y ')}.` : ''}`;
      oportunidades = `${standardContext.highOpportunities} ${weakList.length > 0 ? `Preservar la disciplina actual mientras se atiende de forma preventiva: ${weakList.map(w => cleanConcept(w.texto)).join(', ')}.` : 'Mantener la consistencia del estándar ante futuros crecimientos organizacionales.'}`;
      implicacion = standardContext.highImplication;
    } else if (score >= 2.8) {
      lectura = `${standardContext.midText} Con una puntuación de ${score.toFixed(1)}/5, ${companyName} presenta capacidades en desarrollo con avances visibles pero adopción heterogénea entre áreas.${evidenceContext}`;
      capacidades = `${standardContext.midStrengths} ${strongList.length > 0 ? `Se observan prácticas consistentes en ${strongList.map(s => `"${cleanConcept(s.texto)}"`).join(', ')}.` : 'Existe disposición directiva y compromiso de los líderes para avanzar hacia mayor formalidad.'}`;
      oportunidades = `${standardContext.lowOpportunities} ${weakList.length > 0 ? `Resulta prioritario institucionalizar criterios homogéneos respecto a: ${weakList.map(w => cleanConcept(w.texto)).slice(0, 3).join(', ')}.` : 'Cerrar la brecha entre la definición conceptual y la aplicación operativa cotidiana.'}`;
      implicacion = standardContext.lowImplication;
    } else {
      lectura = `${standardContext.lowText} Con un resultado de ${score.toFixed(1)}/5, esta dimensión se posiciona como una de las brechas más críticas en el sistema de ejecución de ${companyName}.${evidenceContext}`;
      capacidades = `${standardContext.lowStrengths} ${strongList.length > 0 ? `A pesar de la brecha global, se rescata avance puntual en: ${strongList.map(s => `"${cleanConcept(s.texto)}"`).join(', ')}.` : 'Existe conciencia compartida en el liderazgo sobre la urgencia de fortalecer este pilar.'}`;
      oportunidades = `Atender con máxima urgencia las condiciones señaladas en la evaluación: ${weakList.map(w => cleanConcept(w.texto)).slice(0, 3).join('; ') || 'formalizar el marco operativo institucional'}.`;
      implicacion = `${standardContext.lowImplication} Mantener esta condición expone a ${companyName} a fricciones operativas sostenidas y compromete la predictibilidad de sus iniciativas.`;
    }

    return `### ${title}\n- **Resultado:** ${score.toFixed(1)} / 5 (${reading})\n- **Lectura Consultiva:** ${lectura}\n- **Capacidades Observadas:** ${capacidades}\n- **Oportunidades de Fortalecimiento:** ${oportunidades}\n- **Implicación Ejecutiva:** ${implicacion}\n`;
  };

  // Compile Top 5 Critical Findings from lowest scoring questions
  const criticalQuestions = [...allScoredQuestions]
    .sort((a, b) => a.score - b.score);

  const topWeaknesses = criticalQuestions.slice(0, 5);
  const topStrengths = [...allScoredQuestions]
    .filter(q => q.score >= 4)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  // Generate dynamic 5 Findings (Section 6)
  const findingsBlocks = topWeaknesses.map((q, idx) => {
    const concept = cleanConcept(q.texto);
    const userQuote = q.respuesta ? ` Durante la sesión se documentó: "${q.respuesta}".` : '';
    const userNotes = q.notas ? ` Nota consultiva capturada: "${q.notas}".` : '';
    
    return {
      num: idx + 1,
      title: `Hallazgo ${idx + 1}: Vulnerabilidad en ${concept} (${q.dimensionName})`,
      evidencia: `El reactivo "${q.texto}" obtuvo una calificación de ${q.score}/5 en la evaluación de ${companyName}.${userQuote}${userNotes}`,
      interpretacion: `La información disponible sugiere que ${companyName} no cuenta aún con un mecanismo institucionalizado y homogéneo para ${concept.toLowerCase()}, dependiendo principalmente de criterios intuitivos o esfuerzos individuales.`,
      implicacion: `Existe exposición potencial a desalineación operativa, retrabajos o demoras en los compromisos estratégicos vinculados a esta práctica.`
    };
  });

  // Dynamic quick wins (Section 1)
  const dynamicQuickWins = topWeaknesses.slice(0, 3).map((w, idx) => {
    const horizon = idx === 0 ? 'Días 1–15' : 'Días 15–30';
    return `Establecer acuerdo marco para regular "${cleanConcept(w.texto)}" (${w.dimensionName}, ${horizon})`;
  });

  // Dynamic findings summary list (Section 1)
  const dynamicFindingsSummary = findingsBlocks.slice(0, 3).map(f => f.title.replace(/^Hallazgo \d+:\s*/, ''));

  // Dynamic risks summary list
  const dynamicRisksSummary = topWeaknesses.slice(0, 3).map(w => 
    `Exposición a demoras y sobrecostos por falta de control en "${cleanConcept(w.texto)}" (${w.dimensionName})`
  );

  // Build Section 6 text
  const section6Text = findingsBlocks.map(f => 
`### ${f.title}
- **Evidencia:** ${f.evidencia}
- **Interpretación:** ${f.interpretacion}
- **Implicación:** ${f.implicacion}
`).join('\n');

  // Build Section 7 text (Recomendaciones)
  const section7Text = findingsBlocks.map((f, idx) => {
    const w = topWeaknesses[idx];
    const concept = cleanConcept(w.texto);
    return `### Recomendación ${idx + 1}: Institucionalizar el estándar de ${concept}
- **Propósito:** Diseñar e implantar una directriz oficial clara que elimine la discrecionalidad en ${concept.toLowerCase()} dentro de ${companyName}.
- **Resultado buscado:** Homogeneidad operativa, trazabilidad directiva y reducción de la variabilidad en la entrega de proyectos estratégicos.
`;
  }).join('\n');

  // Build Section 8 text (Matriz de Acciones 8 columnas)
  const section8Rows = topWeaknesses.map((w, idx) => {
    const concept = cleanConcept(w.texto);
    const horizon = idx < 2 ? '0–30 días' : (idx < 4 ? '31–60 días' : '61–90 días');
    const priority = idx < 2 ? 'Alta' : 'Media';
    const resp = idx === 0 ? 'Dirección General' : (idx === 1 ? 'Líder de Transformación' : 'Patrocinadores de Iniciativa');
    return `| ${idx + 1} | Diseñar protocolo para ${concept.substring(0, 35)}... | Formalizar directriz institucional | ${priority} | ${horizon} | ${resp} | Guía operativa adoptada | ${w.dimensionName} |`;
  }).join('\n');

  // Build Section 9 text (Riesgos y Exposiciones 5 columnas)
  const section9Rows = topWeaknesses.map((w, idx) => {
    const concept = cleanConcept(w.texto);
    const attention = w.score <= 1 ? 'Crítico' : (w.score === 2 ? 'Alto' : 'Medio');
    return `| Brecha en ${concept.substring(0, 30)}... | Evaluación de reactivo en nivel ${w.score}/5 sin criterio homogéneo | ${attention} | Inconsistencia en la ejecución y dispersión de recursos | Formalizar directriz y foros de control para ${concept.toLowerCase()} |`;
  }).join('\n');

  // Build Section 11 text (Prioridades de Transformación 7 columnas)
  const section11Rows = topWeaknesses.map((w, idx) => {
    const concept = cleanConcept(w.texto);
    const imp = idx < 2 ? 'Alto' : 'Medio';
    const urg = idx < 2 ? 'Alta' : 'Media';
    const esf = idx % 2 === 0 ? 'Medio' : 'Bajo';
    return `| ${idx + 1}. Regular ${concept.substring(0, 25)}... | ${w.dimensionName} | ${imp} | ${urg} | Diagnóstico CSEA | ${esf} | Impacta directamente el nivel de madurez institucional |`;
  }).join('\n');

  // Build Section 12 text (Acciones Inmediatas)
  const section12Text = topWeaknesses.slice(0, 3).map((w, idx) => {
    const concept = cleanConcept(w.texto);
    const horizon = idx === 0 ? 'Días 1 a 15' : (idx === 1 ? 'Días 15 a 30' : 'Días 30 a 45');
    return `### Acción Inmediata ${idx + 1}: Intervención prioritaria en ${concept}
- **Qué hacer:** Convocar a sesión ejecutiva para definir el criterio mínimo aceptable respecto a "${w.texto}".
- **Por qué ahora:** Porque representa una de las brechas más severas detectadas en la evaluación de ${companyName} (${w.score}/5).
- **Resultado inicial esperado:** Criterio explícito acordado y comunicado a los líderes de proyecto.
- **Qué habilita:** Prevenir fricciones operativas y habilitar consistencia en la dimensión de ${w.dimensionName}.
- **Horizonte:** ${horizon}.
`;
  }).join('\n');

  // Build Section 13 text (Justificación de Negocio 5 columnas)
  const section13Rows = topWeaknesses.map((w, idx) => {
    const concept = cleanConcept(w.texto);
    return `| Desempeño incipiente en ${concept.substring(0, 25)}... | Establecer protocolo estandarizado | ${w.dimensionName} | Mayor certidumbre y predictibilidad en la cartera | Tasa de adopción del estándar de ${concept.toLowerCase()} |`;
  }).join('\n');

  // Dynamic Executive Thesis (Section 19)
  const finalThesis = `Para ${companyName}, consolidar su ventaja competitiva exige apalancar su fortaleza en ${primaryFortaleza.name.toLowerCase()} (${primaryFortaleza.metrics.score.toFixed(1)}/5) para subsanar con rigor metodológico la exposición detectada en ${primaryBrecha.name.toLowerCase()} (${primaryBrecha.metrics.score.toFixed(1)}/5), transformando la intención estratégica en resultados operativos medibles.`;

  // Dynamic Strengths bullets (Section 1)
  const dynamicStrengthsList = topStrengths.length > 0 
    ? topStrengths.map(s => `- **${cleanConcept(s.texto)} (${s.dimensionName}):** Evaluado con calificación sólida de ${s.score}/5, lo que evidencia capacidad instalada para sostener los compromisos clave.`).join('\n')
    : `- **Compromiso del liderazgo y visión:** Evaluado positivamente con disposición directiva para coordinar esfuerzos y orientar al equipo hacia las metas institucionales.\n- **Capacidad de respuesta operativa:** Disposición para atender demandas prioritarias del negocio con flexibilidad.\n- **Identificación de iniciativas clave:** Se reconocen los proyectos primordiales para la continuidad de la organización.`;

  // Dynamic Opportunities bullets (Section 1)
  const dynamicOpportunitiesList = topWeaknesses.slice(0, 3).map(w => 
    `- **${cleanConcept(w.texto)} (${w.dimensionName}):** Requiere atención prioritaria al obtener un resultado observado de ${w.score}/5 en la evaluación formal.`
  ).join('\n');

  const markdownReport = `# CAPRICORN STRATEGIC EXECUTION ASSESSMENT® — REPORTE EJECUTIVO DE EVALUACIÓN

**Organización evaluada:** ${companyName}  
**Patrocinador directivo:** ${sponsorName}  
**Capricorn Consulting**  
**Confidencial**

---

## 1. RESUMEN EJECUTIVO

### 1.1 Lectura Ejecutiva
La evaluación de capacidades de ejecución estratégica realizada para **${companyName}** refleja un Índice Global de **${globalIndex} / 100**, lo que sitúa a la organización en una etapa de madurez en desarrollo. La información disponible indica que la organización cuenta con una fortaleza relativa destacada en **${primaryFortaleza.name}** (${primaryFortaleza.metrics.score.toFixed(1)} / 5); no obstante, el sistema de ejecución presenta su brecha principal en **${primaryBrecha.name}** (${primaryBrecha.metrics.score.toFixed(1)} / 5)${secondaryBrecha ? `, secundada por **${secondaryBrecha.name}** (${secondaryBrecha.metrics.score.toFixed(1)} / 5)` : ''}.

Los resultados sugieren que el ritmo de incorporación de demandas operativas y proyectos supera la capacidad instalada para planearlos, secuenciarlos y monitorearlos con rigor metódico. Para consolidar el crecimiento y asegurar que las prioridades estratégicas se materialicen en resultados tangibles, resulta prioritario transitar de un modelo de gestión basado en la reacción emergente hacia un sistema institucional de ejecución disciplinada.

### 1.2 Principales Fortalezas
${dynamicStrengthsList}

### 1.3 Principales Oportunidades de Fortalecimiento
${dynamicOpportunitiesList}

### 1.4 Implicación para la Organización
La permanencia de iniciativas sin una justificación estratégica homogénea y sin una medición rigurosa de capacidad disponible puede incrementar la exposición a saturación de recursos críticos y demoras en los tiempos de entrega. Asimismo, las brechas observadas en ${primaryBrecha.name.toLowerCase()} limitan la capacidad de la Dirección para anticipar desvíos oportunamente.

Fortalecer estas capacidades permitirá proteger la capacidad disponible de los equipos de ${companyName}, mejorar la predictibilidad de las entregas y asegurar que los recursos de la organización se concentren en las iniciativas con mayor retorno estratégico.

### 1.5 Prioridades de Transformación
1. **Atender la brecha primordial en ${primaryBrecha.name}:** Formalizar criterios y mecanismos institucionales para resolver las vulnerabilidades detectadas en esta dimensión.
2. **Establecer un registro único y oficial de iniciativas:** Consolidar la visibilidad total de los proyectos activos y su demanda real de capacidad disponible.
3. **Formalizar el ritual de gobierno y seguimiento ejecutivo:** Establecer foros periódicos de decisión basados en indicadores de avance objetivos.

---

## 2. CONTEXTO Y ALCANCE DE LA EVALUACIÓN

### 2.1 Objetivo de la Evaluación
Proporcionar a la Dirección de **${companyName}** un diagnóstico integral e independiente sobre la madurez de sus capacidades para transformar prioridades estratégicas en resultados operativos medibles, identificando fortalezas, brechas y una ruta estructurada de fortalecimiento institucional.

### 2.2 Contexto de la Evaluación
En un entorno competitivo y dinámico, la capacidad de ejecutar con disciplina y velocidad representa una ventaja competitiva fundamental. La presente evaluación analiza la coherencia y efectividad del sistema de ejecución de la organización a través de seis dimensiones clave bajo la metodología CSEA v4.0.

### 2.3 Alcance
La evaluación abarca los procesos, mecanismos de gobierno, herramientas de visibilidad y dinámicas organizacionales involucradas en la planeación y entrega del portafolio de iniciativas estratégicas de ${companyName}.

### 2.4 Fuentes de Información
- Resultados del assessment CSEA de la organización
- Respuestas y comentarios capturados

### 2.5 Consideraciones de Interpretación
Los hallazgos e interpretaciones contenidos en este reporte reflejan la información capturada durante el proceso de evaluación. Las oportunidades señaladas deben interpretarse como hipótesis consultivas para orientar las decisiones de fortalecimiento institucional del liderazgo.

---

## 3. MARCO DE EVALUACIÓN CSEA

| Dimensión | Pregunta ejecutiva |
| --- | --- |
| Alineación Estratégica | ¿Existe una conexión clara entre estrategia, prioridades, iniciativas y resultados? |
| Priorización y Gestión del Portafolio | ¿La organización decide de manera disciplinada qué ejecutar, acelerar, secuenciar, pausar o detener? |
| Gobernanza y Toma de Decisiones | ¿Existen autoridad, mecanismos y seguimiento suficientes para tomar decisiones oportunamente? |
| Disciplina de Ejecución | ¿Las iniciativas se planean, gestionan y controlan consistentemente? |
| Capacidad Organizacional | ¿Existe capacidad suficiente para ejecutar las prioridades definidas? |
| Visibilidad y Control Ejecutivo | ¿La Dirección dispone de información confiable y oportuna para dirigir la ejecución? |

---

## 4. RESULTADOS EJECUTIVOS

### 4.1 Índice Global
El Índice Global de Ejecución Estratégica de **${companyName}** es de **${globalIndex} / 100**. Este resultado sintetiza la ponderación metodológica de las seis dimensiones evaluadas.

### 4.2 Resultados por Dimensión

| Dimensión | Resultado | Lectura relativa |
| --- | --- | --- |
| Alineación Estratégica | ${scoreAlineacion.toFixed(1)} / 5 | ${getRelativeReading(scoreAlineacion)} |
| Priorización y Gestión del Portafolio | ${scorePriorizacion.toFixed(1)} / 5 | ${getRelativeReading(scorePriorizacion)} |
| Gobernanza y Toma de Decisiones | ${scoreGobernanza.toFixed(1)} / 5 | ${getRelativeReading(scoreGobernanza)} |
| Disciplina de Ejecución | ${scoreDisciplina.toFixed(1)} / 5 | ${getRelativeReading(scoreDisciplina)} |
| Capacidad Organizacional | ${scoreCapacidad.toFixed(1)} / 5 | ${getRelativeReading(scoreCapacidad)} |
| Visibilidad y Control Ejecutivo | ${scoreVisibilidad.toFixed(1)} / 5 | ${getRelativeReading(scoreVisibilidad)} |

### 4.3 Perfil de Madurez
El perfil dimensional muestra que ${companyName} destaca principalmente en **${primaryFortaleza.name}** con un resultado de ${primaryFortaleza.metrics.score.toFixed(1)}/5 (${getRelativeReading(primaryFortaleza.metrics.score)}), mientras que su mayor desafío institucional radica en **${primaryBrecha.name}** con un resultado de ${primaryBrecha.metrics.score.toFixed(1)}/5 (${getRelativeReading(primaryBrecha.metrics.score)}).

### 4.4 Lectura de la Distribución
La dispersión entre la dimensión más fuerte (${primaryFortaleza.metrics.score.toFixed(1)}/5) y la más vulnerable (${primaryBrecha.metrics.score.toFixed(1)}/5) evidencia una asimetría metodológica en la organización: las capacidades individuales y el compromiso logran avances en ciertas áreas, pero la falta de estándares integrados en ${primaryBrecha.name.toLowerCase()} genera cuellos de botella que comprometen la efectividad global del sistema.

---

## 5. ANÁLISIS POR DIMENSIÓN

${buildDimensionAnalysis('5.1 Alineación Estratégica', scoreAlineacion, dimAli, {
  highText: 'La organización demuestra un entendimiento nítido de sus objetivos de negocio.',
  midText: 'La evidencia disponible sugiere que si bien los objetivos generales son conocidos por el equipo directivo, la vinculación explícita con cada entregable requiere mayor consistencia.',
  lowText: 'Se observa una desconexión sustantiva entre la formulación de metas y los proyectos en ejecución.',
  highStrengths: 'Claridad conceptual en las metas del negocio y consistencia en los casos de negocio.',
  midStrengths: 'Disposición directiva para alinear metas y apertura para clarificar el rumbo.',
  lowStrengths: 'Reconocimiento explícito del liderazgo sobre la necesidad urgente de foco estratégico.',
  highOpportunities: 'Monitorear la vigencia de los casos de negocio durante todo el ciclo de vida de los proyectos.',
  lowOpportunities: 'Establecer casos de negocio estandarizados que justifiquen cada proyecto antes de su aprobación formal.',
  highImplication: 'Permite maximizar el retorno de inversión de cada iniciativa estratégica aprobada.',
  lowImplication: 'La falta de justificación explícita de valor propicia la asignación de recursos a iniciativas con bajo impacto estratégico.'
})}

${buildDimensionAnalysis('5.2 Priorización y Gestión del Portafolio', scorePriorizacion, dimPri, {
  highText: 'Existe un proceso ordenado y riguroso para balancear la cartera y autorizar iniciativas.',
  midText: 'Los resultados indican una tendencia a incorporar iniciativas de manera continua sin una evaluación exhaustiva de la capacidad disponible para absorberlas.',
  lowText: 'La cartera de proyectos opera sin filtros de selección claros, acumulando iniciativas por urgencias coyunturales.',
  highStrengths: 'Mecanismos disciplinados de aprobación y capacidad para descartar proyectos no alineados.',
  midStrengths: 'Disposición para atender requerimientos críticos y adaptarse a necesidades del mercado.',
  lowStrengths: 'Capacidad de respuesta ágil ante requerimientos inmediatos del entorno.',
  highOpportunities: 'Automatizar el seguimiento de capacidad en tiempo real para autorizaciones dinámicas.',
  lowOpportunities: 'Implementar criterios formales de priorización y revisiones periódicas para pausar o cancelar proyectos sin tracción.',
  highImplication: 'Concentra la energía organizacional en los proyectos con mayor valor presente y futuro.',
  lowImplication: 'La dispersión del esfuerzo en múltiples proyectos simultáneos reduce la velocidad de entrega de las iniciativas prioritarias.'
})}

${buildDimensionAnalysis('5.3 Gobernanza y Toma de Decisiones', scoreGobernanza, dimGob, {
  highText: 'La toma de decisiones cuenta con foros formalizados, derechos claros y trazabilidad continua.',
  midText: 'Se observa una estructura de decisión que en ocasiones depende de canales informales, lo que puede demorar la resolución de bloqueos y cambios de alcance.',
  lowText: 'Los mecanismos de gobierno están fragmentados o centralizados en exceso, generando demoras en la resolución de desviaciones.',
  highStrengths: 'Roles de gobierno definidos y rituales periódicos de supervisión de cartera.',
  midStrengths: 'Accesibilidad de los líderes para atender temas críticos de forma directa.',
  lowStrengths: 'Disponibilidad de la Dirección General para intervenir en situaciones críticas.',
  highOpportunities: 'Delegar niveles intermedios de decisión para descongestionar la agenda directiva.',
  lowOpportunities: 'Formalizar foros periódicos de gobierno con derechos de decisión claramente delimitados.',
  highImplication: 'Habilita una resolución ágil de impedimentos y reduce la fricción entre áreas funcionales.',
  lowImplication: 'La ausencia de mecanismos de decisión ágiles puede generar incertidumbre en los equipos de proyecto.'
})}

${buildDimensionAnalysis('5.4 Disciplina de Ejecución', scoreDisciplina, dimDis, {
  highText: 'Los proyectos se planean y controlan bajo estándares metodológicos homogéneos y líneas base claras.',
  midText: 'La planeación operativa tiende a ser heterogénea, con variabilidad en el uso de metodologías y definición de líneas base.',
  lowText: 'Predomina la improvisación en la gestión de proyectos, careciendo de cronogramas integrados y administración preventiva de riesgos.',
  highStrengths: 'Estandarización metodológica y disciplina consistente en el seguimiento de hitos.',
  midStrengths: 'Capacidad de entrega basada en la dedicación individual de los líderes de proyecto.',
  lowStrengths: 'Flexibilidad de los equipos para sortear obstáculos imprevistos sobre la marcha.',
  highOpportunities: 'Evolucionar hacia prácticas avanzadas de gestión de valor ganado y optimización de flujos.',
  lowOpportunities: 'Estandarizar un marco mínimo común de gestión de proyectos que incluya cronogramas y gestión de riesgos.',
  highImplication: 'Garantiza predictibilidad en fechas de entrega y costos asociados a los proyectos.',
  lowImplication: 'La variabilidad metodológica limita la predictibilidad y dificulta la consolidación de avances a nivel corporativo.'
})}

${buildDimensionAnalysis('5.5 Capacidad Organizacional', scoreCapacidad, dimCap, {
  highText: 'La asignación de recursos y perfiles críticos está equilibrada con la demanda de la cartera.',
  midText: 'La información recopilada señala una alta concentración de responsabilidades en recursos clave, lo que genera puntos únicos de dependencia.',
  lowText: 'Existe una severa sobrecarga en los talentos estratégicos, comprometiendo la calidad de entrega y la estabilidad operativa.',
  highStrengths: 'Planeación de capacidad institucionalizada y gestión proactiva de competencias críticas.',
  midStrengths: 'Alto compromiso y sentido de pertenencia en el talento clave de la organización.',
  lowStrengths: 'Voluntad del personal clave para absorber sobrecargas en momentos de alta exigencia.',
  highOpportunities: 'Diseñar planes de sucesión y transferencia técnica para perfiles clave.',
  lowOpportunities: 'Mapear la demanda de capacidad de los proyectos frente a la disponibilidad real de los perfiles críticos.',
  highImplication: 'Protege el bienestar del talento y previene cuellos de botella en entregas complejas.',
  lowImplication: 'La sobrecarga sostenida de recursos estratégicos incrementa la exposición a cuellos de botella operativos.'
})}

${buildDimensionAnalysis('5.6 Visibilidad y Control Ejecutivo', scoreVisibilidad, dimVis, {
  highText: 'La Dirección dispone de tableros ejecutivos integrados con información confiable y en tiempo real.',
  midText: 'La Dirección no cuenta actualmente con un tablero ejecutivo consolidado que muestre el estado de salud, riesgos y desvíos de la cartera en tiempo real.',
  lowText: 'La visibilidad del avance es opaca o fragmentada en reportes individuales aislados y desactualizados.',
  highStrengths: 'Disponibilidad de métricas oportunas y semaforización ejecutiva confiable.',
  midStrengths: 'Generación de reportes operativos individuales a nivel de área.',
  lowStrengths: 'Existencia de reportes financieros periódicos sobre presupuesto global.',
  highOpportunities: 'Integrar analítica predictiva de desvíos en el tablero directivo.',
  lowOpportunities: 'Implementar un tablero ejecutivo con criterios claros de semaforización e indicadores de avance.',
  highImplication: 'Permite tomar decisiones preventivas antes de que las desviaciones impacten el negocio.',
  lowImplication: 'La falta de visibilidad agregada dificulta la anticipación de riesgos y la toma oportuna de decisiones correctivas.'
})}

---

## 6. HALLAZGOS ESTRATÉGICOS

${section6Text}

---

## 7. RECOMENDACIONES ESTRATÉGICAS

${section7Text}

---

## 8. MATRIZ DE ACCIONES

| # | Acción prioritaria | Objetivo | Prioridad | Horizonte | Responsable sugerido | Resultado esperado | Capacidad que habilita |
| --- | --- | --- | --- | --- | --- | --- | --- |
${section8Rows}

---

## 9. RIESGOS Y EXPOSICIONES PARA LA EJECUCIÓN

| Riesgo o exposición | Condición que lo genera | Nivel de atención | Implicación potencial | Respuesta recomendada |
| --- | --- | --- | --- | --- |
${section9Rows}

---

## 10. HOJA DE RUTA DE TRANSFORMACIÓN

### Fase 1: 0–30 días (Visibilidad y Racionalización)
- **Objetivo:** Obtener visibilidad total del portafolio actual de ${companyName} y mitigar las brechas más agudas en ${primaryBrecha.name}.
- **Acciones principales:** Levantar el inventario exhaustivo de proyectos activos; establecer criterios de priorización; acordar el catálogo oficial de iniciativas.
- **Entregables clave:** Registro único oficial de iniciativas; matriz de priorización aprobada por la Dirección.
- **Cambio esperado:** Claridad sobre cuántos proyectos existen en ${companyName} y cuál es su grado de alineación real.
- **Criterio de avance:** 100% de los proyectos activos registrados con patrocinador formal y líder asignado.

### Fase 2: 31–60 días (Gobernanza y Estándar)
- **Objetivo:** Establecer mecanismos formales de decisión y estandarizar la planeación operativa.
- **Acciones principales:** Iniciar sesiones periódicas de gobierno de cartera; desplegar la plantilla mínima común de planeación; definir líneas base de proyectos críticos.
- **Entregables clave:** Calendario de sesiones de gobierno operando; planes de proyecto estandarizados con alcance y fechas compromiso.
- **Cambio esperado:** Decisiones colegiadas y seguimiento sistemático de compromisos institucionales.
- **Criterio de avance:** Realización consistente de las sesiones de revisión de cartera programadas.

### Fase 3: 61–90 días (Control y Disciplina)
- **Objetivo:** Consolidar el monitoreo ejecutivo y la gestión proactiva de riesgos y desviaciones.
- **Acciones principales:** Implementar el tablero ejecutivo consolidado; capacitar a los líderes en gestión de riesgos; balancear la carga de recursos críticos.
- **Entregables clave:** Tablero ejecutivo en funcionamiento; reporte mensual de estado del portafolio para la Dirección General.
- **Cambio esperado:** Identificación oportuna de bloqueos y mayor predictibilidad en los tiempos de entrega.
- **Criterio de avance:** Reporte ejecutivo disponible y actualizado para la toma de decisiones C-Level.

### Fase 4: 90+ días (Sostenibilidad y Mejora Continua)
- **Objetivo:** Institucionalizar la cultura de ejecución estratégica como práctica habitual y autónoma en ${companyName}.
- **Acciones principales:** Evaluar la efectividad del modelo de ejecución; ajustar criterios según resultados de negocio; reevaluar madurez CSEA.
- **Entregables clave:** Evaluación de beneficios obtenidos; ciclo anual de planeación y cartera integrado.
- **Cambio esperado:** Sistema institucional de ejecución operando con autonomía y disciplina continua.
- **Criterio de avance:** Cumplimiento sistemático de las fechas de compromiso establecidas en la cartera.

---

## 11. PRIORIDADES DE TRANSFORMACIÓN

| Prioridad | Capacidad | Impacto | Urgencia | Dependencia | Esfuerzo relativo | Justificación |
| --- | --- | --- | --- | --- | --- | --- |
${section11Rows}

---

## 12. ACCIONES INMEDIATAS

${section12Text}

---

## 13. JUSTIFICACIÓN DE NEGOCIO DE LAS INTERVENCIONES

| Condición actual | Cambio requerido | Capacidad habilitada | Beneficio esperado | Indicador sugerido |
| --- | --- | --- | --- | --- |
${section13Rows}

---

## 14. REQUERIMIENTOS PARA LA TRANSFORMACIÓN

| Habilitador | Qué se requiere | Situación inicial | Decisión necesaria |
| --- | --- | --- | --- |
| Patrocinio directivo | Respaldo explícito a los nuevos foros y filtros | Apoyo verbal informal | Mandato directivo formal para cumplir el proceso de cartera |
| Rol de coordinación | Asignar un responsable del seguimiento de cartera | Responsabilidad distribuida | Designar formalmente al líder del sistema de ejecución |
| Disciplina metodológica | Adopción de formatos estándar y actualización puntual | Prácticas heterogéneas | Establecer como obligatoria la actualización de estatus |
| Herramientas simples | Plantillas compartidas y tablero de visualización | Hojas de cálculo aisladas | Adoptar una herramienta centralizada accesible para todos |

---

## 15. MODELO OBJETIVO DE EJECUCIÓN ESTRATÉGICA

| Capacidad | Situación actual | Modelo objetivo |
| --- | --- | --- |
| Alineación | Desconexión parcial entre prioridades y entregables | Iniciativas vinculadas explícitamente a casos de negocio estratégicos |
| Priorización | Incorporación continua sin balance de carga | Cartera balanceada con base en valor y capacidad disponible |
| Gobernanza | Decisiones centralizadas e informales | Foros estructurados con derechos de decisión claramente delimitados |
| Disciplina | Métodos de gestión heterogéneos | Estándar común con líneas base y gestión proactiva de riesgos |
| Capacidad | Asignación basada en disponibilidad aparente | Planeación de capacidad que previene la sobrecarga de perfiles críticos |
| Visibilidad | Información dispersa y reactiva | Tablero ejecutivo consolidado con indicadores de avance objetivos |

---

## 16. MODELO DE GOBERNANZA DE LA EJECUCIÓN

### 16.1 Niveles de Decisión de la Cartera

| Nivel de gobierno | Participantes | Frecuencia | Responsabilidad principal |
| --- | --- | --- | --- |
| Comité de Dirección | Dirección General y Directores de Área | Mensual | Aprobar prioridades, balancear cartera y resolver cambios mayores |
| Revisión Operativa | Líder de Transformación y Líderes de Proyecto | Quincenal | Monitorear avances, gestionar dependencias y remover bloqueos |
| Equipo de Proyecto | Líder de Proyecto y Especialistas | Semanal | Ejecutar entregables, actualizar planes y gestionar riesgos locales |

### 16.2 Marco de Derechos de Decisión

| Pregunta de derecho de decisión | Instancia responsable | Rol de soporte | Criterio de gobierno |
| --- | --- | --- | --- |
| ¿Qué iniciativa se aprueba, pausa o cancela? | Comité de Dirección | Líder de Transformación | Contribución estratégica y capacidad disponible |
| ¿Cómo se resuelven conflictos de recursos entre proyectos? | Comité de Dirección | Líderes de Área | Prioridad institucional de la iniciativa |
| ¿Cuándo se autoriza un cambio en la línea base de tiempo/costo? | Patrocinador / Comité | Líder de Proyecto | Justificación técnica y evaluación de impacto |
| ¿Cómo se gestionan los desvíos operativos menores? | Líder de Proyecto | Equipo técnico | Tolerancia acordada en el plan de proyecto |
| ¿Quién valida la entrega final de beneficios? | Patrocinador de la Iniciativa | Dirección General | Criterios de aceptación definidos en el caso de negocio |

---

## 17. MODELO DE MEDICIÓN Y SEGUIMIENTO

1. **Nivel de Adopción:** Medir el porcentaje de proyectos de ${companyName} que utilizan las plantillas estándar, cuentan con línea base formal y actualizan su estatus dentro de los plazos establecidos.
2. **Nivel de Efectividad:** Monitorear la tasa de cumplimiento de compromisos (hitos en tiempo y costo), así como la reducción en los tiempos de resolución de bloqueos.
3. **Nivel de Evolución:** Evaluar periódicamente la madurez de los procesos de planeación y la efectividad de las sesiones de gobierno.
4. **Nivel de Reevaluación:** Aplicar el assessment CSEA semestral o anualmente para cuantificar el incremento en el Índice Global de Ejecución y ajustar la estrategia de fortalecimiento.

---

## 18. ACTIVACIÓN DE LA TRANSFORMACIÓN

La secuencia recomendada para activar la transformación en ${companyName} contempla cinco pasos progresivos:

1. **Validar:** Presentar los hallazgos de este diagnóstico al equipo directivo para generar consenso sobre las prioridades identificadas.
2. **Definir:** Acordar el catálogo oficial de prioridades del negocio y los criterios de evaluación de proyectos.
3. **Habilitar:** Capacitar a los líderes de proyecto en el uso de las herramientas mínimas de planeación y control.
4. **Establecer:** Poner en marcha los foros periódicos de gobierno y el tablero ejecutivo consolidado.
5. **Movilizar:** Mantener el ritmo de seguimiento y reconocer los avances logrados en disciplina de ejecución.

**Decisiones clave requeridas por el liderazgo:**
- Aprobar formalmente el inicio del programa de fortalecimiento de ejecución.
- Designar al responsable institucional de la gestión de la cartera.
- Respaldar el cumplimiento de los foros de gobierno establecidos.

---

## 19. CONCLUSIÓN EJECUTIVA

### 19.1 Conclusión Central
**${companyName}** cuenta con el talento, la visión y la energía necesarios para alcanzar sus metas de negocio; no obstante, la efectividad de su ejecución se encuentra condicionada por brechas concentradas principalmente en **${primaryBrecha.name}** (${primaryBrecha.metrics.score.toFixed(1)}/5). Fortalecer estas capacidades no implica burocratizar la operación, sino dotar a la organización de la claridad y disciplina indispensables para enfocar su energía colectiva.

### 19.2 Oportunidad
La implementación de las recomendaciones planteadas permitirá a ${companyName} proteger su capacidad instalada, acelerar la entrega de las iniciativas más valiosas y construir una base sólida para sostener el crecimiento futuro con predictibilidad y control.

### 19.3 Imperativo de Transformación
Continuar operando con mecanismos informales incrementa la exposición a sobrecarga operativa y dispersión estratégica. La transición hacia una gestión profesional de cartera representa una decisión prioritaria para el comité directivo.

### 19.4 Decisión para el Liderazgo
Corresponde a la Dirección General y su equipo de liderazgo asumir el patrocinio activo de esta transformación, estableciendo las reglas del juego y modelando la disciplina requerida para su adopción exitosa.

### 19.5 Perspectiva Final
La disciplina de ejecución es el puente que transforma las aspiraciones estratégicas en valor concreto para la organización y sus grupos de interés.

***${finalThesis}***
`;

  return {
    globalIndex,
    dimensions,
    findings: dynamicFindingsSummary,
    risks: dynamicRisksSummary,
    quickWins: dynamicQuickWins,
    roadmap90Days: [
      `Mes 1 (Días 1–30): Visibilidad y Racionalización — Inventario oficial y directriz en ${primaryBrecha.name}`,
      `Mes 2 (Días 31–60): Gobernanza y Estándar — Foros de decisión quincenales y líneas base formalizadas`,
      `Mes 3 (Días 61–90): Control y Disciplina — Despliegue del tablero ejecutivo y reporte mensual consolidado`
    ],
    markdownReport
  };
}
