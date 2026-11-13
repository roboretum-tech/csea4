import { useState, useEffect, useRef, FormEvent } from 'react';
import { motion } from 'motion/react';
import { 
  Building2, User, Mail, Phone, ArrowRight, ClipboardCheck, 
  Calendar, CheckCircle2, AlertTriangle, XCircle, Clock, FileText, Shield
 } from 'lucide-react';
import { Applicant } from '../types';
import { CapricornIcon } from './CapricornLogo';
import { safeFetchJson } from '../utils/apiClient';

interface ClientPortalProps {
  onSuccessSubmission: (applicant: Applicant) => void;
}

export default function ClientPortal({ onSuccessSubmission }: ClientPortalProps) {
  const [screen, setScreen] = useState<'landing' | 'disclaimer' | 'formA' | 'resultA' | 'formB' | 'scheduler' | 'completed'>('landing');
  const [loading, setLoading] = useState(false);
  const [applicant, setApplicant] = useState<Applicant | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false);
  const [referringConsultor, setReferringConsultor] = useState<{ id: string; email: string; name: string } | null>(null);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const cId = params.get('consultorId');
        const cEmail = params.get('consultorEmail');
        const cName = params.get('consultorName');
        if (cId || cEmail || cName) {
          setReferringConsultor({
            id: cId || '',
            email: cEmail || '',
            name: cName || ''
          });
        }
      }
    } catch {
      // Ignored
    }
  }, []);

  // Form A Inputs
  const [companyName, setCompanyName] = useState('');
  const [sponsorName, setSponsorName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [answersA, setAnswersA] = useState<Record<string, number>>({});

  // Form B Inputs
  const [answersB, setAnswersB] = useState<Record<string, number>>({});

  const companyInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (screen === 'formA') {
      const timer = setTimeout(() => {
        companyInputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [screen]);

  // Scheduler Inputs
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const formAQues = [
    {
      id: 'q1',
      label: '1. Número de iniciativas clave actuales (Proyectos estratégicos simultáneos):',
      gate: 'Mínimo 3 iniciativas requeridas',
      options: [
        { label: 'Menos de 3 iniciativas', value: 1, isGateViolation: true },
        { label: 'Entre 3 y 5 iniciativas', value: 2, isGateViolation: false },
        { label: 'Entre 6 y 10 iniciativas', value: 3, isGateViolation: false },
        { label: 'Entre 11 y 20 iniciativas', value: 4, isGateViolation: false },
        { label: 'Más de 20 iniciativas', value: 5, isGateViolation: false },
      ]
    },
    {
      id: 'q2',
      label: '2. Nivel del Patrocinador de este diagnóstico (Quién respalda la iniciativa):',
      gate: 'Nivel mínimo: Gerente de área o proyecto o superior',
      options: [
        { label: 'Ninguno designado oficialmente', value: 1, isGateViolation: true },
        { label: 'Gerente de área o proyecto', value: 2, isGateViolation: false },
        { label: 'Director de área o funcional', value: 3, isGateViolation: false },
        { label: 'Director divisional / Vicepresidente', value: 4, isGateViolation: false },
        { label: 'Director General / Propietario / CEO', value: 5, isGateViolation: false },
      ]
    },
    {
      id: 'q3',
      label: '3. Disponibilidad de tiempo para el diagnóstico (Entrevista y revisión):',
      gate: 'Requiere disponibilidad suficiente (1-2 horas)',
      options: [
        { label: 'Ninguna disponibilidad actualmente', value: 1, isGateViolation: true },
        { label: 'Limitada (menos de 30 minutos)', value: 2, isGateViolation: true },
        { label: 'Moderada (aproximadamente 1 hora)', value: 3, isGateViolation: true },
        { label: 'Suficiente (de 1 a 2 horas)', value: 4, isGateViolation: false },
        { label: 'Total y prioritaria', value: 5, isGateViolation: false },
      ]
    },
    {
      id: 'q4',
      label: '4. Motivación principal para aplicar al programa CSEA:',
      gate: 'Requiere dolor u oportunidad real en proyectos estratégicos',
      options: [
        { label: 'Curiosidad meramente teórica', value: 1, isGateViolation: true },
        { label: 'Queremos comparar nuestras metodologías actuales', value: 2, isGateViolation: true },
        { label: 'Tenemos algunos proyectos críticos con retrasos notables', value: 3, isGateViolation: false },
        { label: 'Queremos entender a fondo por qué fallan nuestros proyectos', value: 4, isGateViolation: false },
        { label: 'Deseamos fortalecer la ejecución antes de enfrentar crisis operativas', value: 5, isGateViolation: false },
      ]
    },
    {
      id: 'q5',
      label: '5. Intención real de implementar mejoras organizacionales resultantes:',
      gate: 'Se busca compromiso de evaluación o implementación',
      options: [
        { label: 'No tenemos intención de implementar cambios', value: 1, isGateViolation: true },
        { label: 'Únicamente deseamos obtener el reporte ejecutivo gratuito', value: 2, isGateViolation: true },
        { label: 'Depende del resultado del diagnóstico y costo-beneficio', value: 3, isGateViolation: false },
        { label: 'Lo evaluaremos muy seriamente en el comité de dirección', value: 4, isGateViolation: false },
        { label: 'Aceptamos y nos comprometemos a implementar mejoras necesarias', value: 5, isGateViolation: false },
      ]
    }
  ];

  const formBQues = [
    {
      id: 'q1',
      label: '1. Prioridad de Iniciativas',
      desc: '¿Cómo se priorizan actualmente los proyectos en la empresa?',
      options: [
        { text: 'Todos los proyectos se consideran de alta prioridad simultáneamente (Sin priorización)', val: 1 },
        { text: 'Cada gerencia o área decide sus prioridades de forma aislada', val: 2 },
        { text: 'Se prioriza según la urgencia del día a día o el cliente más ruidoso', val: 3 },
        { text: 'Revisión periódica por la dirección con algunos criterios de negocio', val: 4 },
        { text: 'Proceso formal, cuantitativo y claro para toda la organización', val: 5 },
      ]
    },
    {
      id: 'q2',
      label: '2. Retrasos Frecuentes',
      desc: '¿Qué porcentaje de proyectos estratégicos van con retraso o fuera de presupuesto?',
      options: [
        { text: 'Más del 60% de los proyectos estratégicos (Crítico)', val: 1 },
        { text: 'Entre el 41% y el 60% de los proyectos', val: 2 },
        { text: 'Entre el 26% y el 40% de los proyectos', val: 3 },
        { text: 'Entre el 10% y el 25% de los proyectos', val: 4 },
        { text: 'Menos del 10% de los proyectos (Óptimo)', val: 5 },
      ]
    },
    {
      id: 'q3',
      label: '3. Visibilidad Ejecutiva',
      desc: '¿Cuál es el nivel de información consolidada que tiene la dirección sobre el estado de los proyectos?',
      options: [
        { text: 'Sin ninguna visibilidad formal consolidada (Inexistente)', val: 1 },
        { text: 'Información parcial, dispersa o de difícil acceso', val: 2 },
        { text: 'Informes mensuales en comités de resultados', val: 3 },
        { text: 'Reportes unificados semanales estructurados', val: 4 },
        { text: 'Tableros de control automatizados en tiempo real', val: 5 },
      ]
    },
    {
      id: 'q4',
      label: '4. Estandarización y Metodología',
      desc: '¿Existe una metodología o marco común institucionalizado para la gestión de proyectos?',
      options: [
        { text: 'No existe ningún marco metodológico ni herramientas compartidas', val: 1 },
        { text: 'Cada líder de proyecto gestiona a su modo y criterio personal', val: 2 },
        { text: 'Algunas áreas de la empresa utilizan herramientas ágiles o formales', val: 3 },
        { text: 'Metodología institucional utilizada en la mayoría de áreas', val: 4 },
        { text: 'PMO madura con procesos estándar y plantillas obligatorias', val: 5 },
      ]
    },
    {
      id: 'q5',
      label: '5. Gestión de Cambios',
      desc: '¿Con qué frecuencia cambian las prioridades de los proyectos durante la fase de ejecución?',
      options: [
        { text: 'En constante cambio; rara vez un proyecto termina como inició (Caos)', val: 1 },
        { text: 'Frecuentemente, lo que interrumpe el ritmo del equipo', val: 2 },
        { text: 'Algunas veces a mitad de camino según nuevas demandas directivas', val: 3 },
        { text: 'Ocasionalmente tras un análisis formal de impacto', val: 4 },
        { text: 'Casi nunca, respetamos los alcances iniciales definidos (Estabilidad)', val: 5 },
      ]
    },
    {
      id: 'q6',
      label: '6. Detección de Desviaciones',
      desc: 'Cuando un proyecto crítico se desvía en tiempo o costo, típicamente se detecta:',
      options: [
        { text: 'Cuando casi es demasiado tarde para rescatar el proyecto', val: 1 },
        { text: 'Cuando el impacto negativo ya afectó la operación o al cliente', val: 2 },
        { text: 'Cuando ya existe un retraso notable que compromete la entrega', val: 3 },
        { text: 'En revisiones de avance mensuales estructuradas', val: 4 },
        { text: 'A tiempo de forma proactiva y se corrige de inmediato', val: 5 },
      ]
    },
    {
      id: 'q7',
      label: '7. Conflictos por Recursos Compartidos',
      desc: '¿Con qué frecuencia compiten los proyectos simultáneos por el mismo personal clave?',
      options: [
        { text: 'Siempre; es el principal dolor y causa constante de parálisis', val: 1 },
        { text: 'Frecuentemente; los especialistas clave están sobrecargados', val: 2 },
        { text: 'Regularmente, lo que genera retrasos moderados en hitos', val: 3 },
        { text: 'Ocasionalmente sin mayores impactos en la productividad', val: 4 },
        { text: 'Casi nunca; la asignación es planificada y respetada', val: 5 },
      ]
    },
    {
      id: 'q8',
      label: '8. Patrocinio y Gobernanza',
      desc: '¿Con qué frecuencia se realizan reuniones de revisión formal de proyectos con sus patrocinadores ejecutivos?',
      options: [
        { text: 'Nunca formalmente; no hay canales estructurados de gobernanza', val: 1 },
        { text: 'Esporádicamente, sólo si ocurre una crisis o problema grave', val: 2 },
        { text: 'Cada trimestre o semestre de forma institucionalizada', val: 3 },
        { text: 'Mensual entre patrocinadores y líderes operativos de proyecto', val: 4 },
        { text: 'Comité ejecutivo mensual formal con métricas claras', val: 5 },
      ]
    },
    {
      id: 'q9',
      label: '9. Gestión de Riesgos',
      desc: '¿Cómo evalúan y mitigan los riesgos asociados a los proyectos estratégicos?',
      options: [
        { text: 'No existe identificación formal de riesgos en ningún proyecto', val: 1 },
        { text: 'Cuando ocurre una falla catastrófica se actúa reactivamente', val: 2 },
        { text: 'Al identificar un problema visible se genera una solución informal', val: 3 },
        { text: 'Revisiones periódicas de riesgos críticos al inicio de fases', val: 4 },
        { text: 'Gestión proactiva y continua con matriz de riesgos actualizada', val: 5 },
      ]
    },
    {
      id: 'q10',
      label: '10. Flexibilidad al Cambio y Cultura',
      desc: '¿Qué tan receptiva y abierta es la cultura organizacional a la adopción de nuevas herramientas y metodologías?',
      options: [
        { text: 'Resistencia total; alta fricción y rechazo a nuevos procesos', val: 1 },
        { text: 'Resistencia moderada; los equipos prefieren su forma tradicional', val: 2 },
        { text: 'Cambio lento con muchas dudas y necesidad de constante apoyo', val: 3 },
        { text: 'Se adopta con esfuerzo, pero con excelente liderazgo de cambio', val: 4 },
        { text: 'Muy receptiva; adopción rápida y ágil de mejores prácticas', val: 5 },
      ]
    }
  ];

  const availableSlots = [
    'Lunes, 14 de Julio - 09:00 AM (CDMX)',
    'Lunes, 14 de Julio - 11:30 AM (CDMX)',
    'Martes, 15 de Julio - 10:00 AM (CDMX)',
    'Martes, 15 de Julio - 04:00 PM (CDMX)',
    'Miércoles, 16 de Julio - 09:00 AM (CDMX)',
    'Miércoles, 16 de Julio - 01:00 PM (CDMX)',
    'Jueves, 17 de Julio - 11:00 AM (CDMX)',
    'Jueves, 17 de Julio - 03:00 PM (CDMX)',
  ];

  const handleApplyA = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!companyName || !sponsorName || !email) {
      setError('Por favor complete todos los datos generales.');
      return;
    }

    // Check that all Form A questions are answered
    const unansweredA = formAQues.filter(q => answersA[q.id] === undefined);
    if (unansweredA.length > 0) {
      setError('Por favor responda todas las preguntas de validación antes de continuar.');
      return;
    }

    setLoading(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (referringConsultor?.id) headers['x-consultor-id'] = referringConsultor.id;
      if (referringConsultor?.email) headers['x-consultor-email'] = referringConsultor.email;

      const { ok, data, error: fetchErr } = await safeFetchJson<{ success: boolean; applicant: Applicant; error?: string }>('/api/applicants', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          companyName,
          sponsorName,
          email,
          phone,
          answersA,
          consultorId: referringConsultor?.id || undefined,
          consultorEmail: referringConsultor?.email || undefined,
          assignedConsultor: referringConsultor?.name || undefined
        })
      });
      if (ok && data?.success) {
        setApplicant(data.applicant);
        onSuccessSubmission(data.applicant);
        setScreen('resultA');
      } else {
        setError(fetchErr || data?.error || 'Error al enviar la postulación.');
      }
    } catch (err: any) {
      console.error(err);
      setError('Error al enviar la postulación: ' + (err?.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const handleApplyB = async () => {
    if (!applicant) return;
    setError(null);

    // Check that all Form B questions are answered
    const unansweredB = formBQues.filter(q => answersB[q.id] === undefined);
    if (unansweredB.length > 0) {
      setError('Por favor responda todas las preguntas de autoevaluación (Pre-Assessment) antes de finalizar.');
      return;
    }

    setLoading(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const resolvedCId = referringConsultor?.id || applicant.consultorId;
      const resolvedCEmail = referringConsultor?.email || applicant.consultorEmail;
      if (resolvedCId) headers['x-consultor-id'] = resolvedCId;
      if (resolvedCEmail) headers['x-consultor-email'] = resolvedCEmail;

      const { ok, data, error: fetchErr } = await safeFetchJson<{ success: boolean; applicant: Applicant; error?: string }>(`/api/applicants/${applicant.id}/submitB`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ answersB })
      });
      if (ok && data?.success) {
        setApplicant(data.applicant);
        onSuccessSubmission(data.applicant);
        setScreen('scheduler');
      } else {
        setError(fetchErr || data?.error || 'Error al enviar el Pre-Assessment.');
      }
    } catch (err: any) {
      console.error(err);
      setError('Error al enviar el Pre-Assessment: ' + (err?.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async () => {
    if (!applicant || !selectedSlot) return;
    setError(null);
    setLoading(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const resolvedCId = referringConsultor?.id || applicant.consultorId;
      const resolvedCEmail = referringConsultor?.email || applicant.consultorEmail;
      if (resolvedCId) headers['x-consultor-id'] = resolvedCId;
      if (resolvedCEmail) headers['x-consultor-email'] = resolvedCEmail;

      const { ok, data, error: fetchErr } = await safeFetchJson<{ success: boolean; applicant: Applicant; error?: string }>(`/api/applicants/${applicant.id}/schedule`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ scheduledTime: selectedSlot })
      });
      if (ok && data?.success) {
        setApplicant(data.applicant);
        onSuccessSubmission(data.applicant);
        setScreen('completed');
      } else {
        setError(fetchErr || data?.error || 'Error al agendar la sesión.');
      }
    } catch (err: any) {
      console.error(err);
      setError('Error al agendar la sesión: ' + (err?.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="client-portal-root" className="py-8 px-4 max-w-4xl mx-auto space-y-6">
      {error && (
        <div className="bg-rose-50 border border-rose-150 text-rose-800 p-4 rounded-xl text-xs font-bold flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button 
            onClick={() => setError(null)}
            className="text-rose-500 hover:text-rose-700 text-[10px] font-bold uppercase tracking-wider shrink-0"
          >
            Cerrar
          </button>
        </div>
      )}

      {screen === 'landing' && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
        >
          {/* Hero Banner */}
          <div className="bg-slate-950 text-white p-8 md:p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.15),transparent_40%)]" />
            <div className="relative z-10 max-w-2xl">
              {referringConsultor && (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-amber-500/50 mb-3 text-xs text-amber-300 font-sans shadow-sm">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>Invitación Exclusiva de <strong>{referringConsultor.name || 'Consultor Estratégico'}</strong></span>
                </div>
              )}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 mb-4">
                <CapricornIcon className="w-4 h-4" color="#D9822B" />
                <span className="font-extrabold text-[11px] text-amber-400 tracking-wider uppercase font-sans">
                  CAPRICORN CONSULTING · CSEA 3.2
                </span>
              </div>
              <h1 className="font-sans text-3xl md:text-4xl font-extrabold tracking-tight text-slate-100">
                ¿Su empresa crece más rápido de lo que ejecuta sus proyectos estratégicos?
              </h1>
              <p className="font-sans text-slate-300 mt-4 leading-relaxed text-sm md:text-base">
                El Programa <span className="text-amber-400 font-semibold">CSEA 3.2</span> de <span className="font-semibold text-white">Capricorn Consulting</span> selecciona empresas con múltiples iniciativas críticas para diagnosticar las causas raíz de sus retrasos, saturación de personal y falta de priorización.
              </p>
            </div>
          </div>

          {/* Value Proposition */}
          <div className="p-8 md:p-12 space-y-8">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-2">
                <div className="text-amber-500 font-bold text-lg">01. Selección Estricta</div>
                <h3 className="font-sans font-semibold text-slate-800 text-sm">Admisión Selectiva</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Evaluamos que su empresa cuente con la estructura y patrocinio necesario para aprovechar al máximo este diagnóstico avanzado.
                </p>
              </div>
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-2">
                <div className="text-amber-500 font-bold text-lg">02. Pre-Assessment</div>
                <h3 className="font-sans font-semibold text-slate-800 text-sm">Dimensiones Clave</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Medimos la madurez operativa de su ejecución estratégica en gobernanza, visibilidad, recursos compartidos y metodología.
                </p>
              </div>
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-2">
                <div className="text-amber-500 font-bold text-lg">03. Reporte Final</div>
                <h3 className="font-sans font-semibold text-slate-800 text-sm">Entregable de Valor</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Generamos un reporte integral impulsado por Inteligencia Artificial con recomendaciones, "quick wins" y un roadmap para 90 días.
                </p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1">
                <h4 className="font-sans font-bold text-slate-900 text-base">¿Listo para ordenar su ejecución operativa?</h4>
                <p className="text-xs text-slate-500">Toma aproximadamente 4 minutos completar la fase inicial.</p>
              </div>
              <button
                id="start-csea-btn"
                onClick={() => setScreen('disclaimer')}
                className="w-full md:w-auto px-6 py-3 bg-amber-500 text-slate-950 font-bold text-sm rounded-lg hover:bg-amber-400 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                Comenzar Registro <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {screen === 'disclaimer' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-slate-950 text-white p-6 md:p-8 flex items-center gap-4 border-b border-slate-800">
            <div className="p-3 bg-slate-900 rounded-xl border border-amber-500/30 shrink-0">
              <CapricornIcon className="w-6 h-6" color="#D9822B" />
            </div>
            <div>
              <h2 className="font-sans text-lg md:text-xl font-extrabold tracking-tight text-slate-100">
                DESCARGO DE RESPONSABILIDADES
              </h2>
              <p className="text-[10px] md:text-xs font-mono text-amber-400 font-bold uppercase tracking-widest mt-0.5">
                CAPRICORN CONSULTING · CSEA 3.2
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 md:p-10 space-y-6">
            <div className="space-y-4 text-xs md:text-sm text-slate-600 leading-relaxed">
              <p>
                El presente assessment es una herramienta de diagnóstico desarrollada por <strong className="text-slate-900">Capricorn Consulting</strong> con el objetivo de obtener una visión general del estado actual de la infraestructura de TI, aplicaciones, procesos y prácticas relacionadas dentro de la organización participante.
              </p>
              
              <p>
                La información proporcionada por los participantes será utilizada únicamente con fines de análisis y generación de recomendaciones estratégicas. Los resultados derivados de este assessment representan una evaluación basada en la información proporcionada durante el proceso y no constituyen una auditoría formal ni garantizan la detección de todos los riesgos, deficiencias o áreas de mejora existentes.
              </p>

              <p>
                <strong className="text-slate-900">Capricorn Consulting</strong> no asume responsabilidad por decisiones operativas, técnicas o estratégicas que se tomen basadas parcial o totalmente en los resultados de este assessment. Se recomienda que cualquier decisión crítica sea evaluada adicionalmente mediante análisis técnicos más profundos o asesoría especializada.
              </p>
            </div>

            {/* Acceptances Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 md:p-6 space-y-3.5">
              <h4 className="font-sans font-bold text-slate-800 text-xs md:text-sm uppercase tracking-wider">
                La participación implica la aceptación de que:
              </h4>
              <ul className="space-y-3 text-xs md:text-sm text-slate-600">
                <li className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold shrink-0 mt-0.5">
                    1
                  </span>
                  <span>La información proporcionada es veraz y completa según el conocimiento de los participantes.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold shrink-0 mt-0.5">
                    2
                  </span>
                  <span>Los resultados representan únicamente un diagnóstico orientativo.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold shrink-0 mt-0.5">
                    3
                  </span>
                  <span>La información recopilada podrá ser utilizada de forma agregada y anonimizada con fines de mejora metodológica.</span>
                </li>
              </ul>
            </div>

            <p className="text-xs md:text-sm text-slate-600 leading-relaxed italic border-l-2 border-amber-400 pl-3">
              Capricorn Consulting se compromete a tratar toda la información proporcionada con estricta confidencialidad y a utilizarla exclusivamente para los fines del assessment.
            </p>

            {/* Checkbox and Buttons */}
            <div className="border-t border-slate-100 pt-6 space-y-4">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={acceptedDisclaimer}
                  onChange={(e) => setAcceptedDisclaimer(e.target.checked)}
                  className="mt-1 rounded border-slate-300 text-amber-500 focus:ring-amber-500 cursor-pointer h-4 w-4"
                />
                <span className="text-xs md:text-sm text-slate-600 select-none group-hover:text-slate-950 transition">
                  He leído, comprendido y acepto en su totalidad el descargo de responsabilidades para iniciar este assessment de madurez.
                </span>
              </label>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setScreen('landing')}
                  className="w-full sm:w-auto px-5 py-2.5 text-slate-600 hover:text-slate-900 font-semibold text-xs rounded-lg transition-all text-center cursor-pointer"
                >
                  Regresar
                </button>
                <button
                  type="button"
                  disabled={!acceptedDisclaimer}
                  onClick={() => setScreen('formA')}
                  className="w-full sm:w-auto px-6 py-2.5 bg-amber-500 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-lg hover:bg-amber-400 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Aceptar y Continuar</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Footer */}
            <div className="text-center pt-2 border-t border-slate-100 text-[10px] text-slate-400">
              © Capricorn Consulting. Todos los derechos reservados.
            </div>
          </div>
        </motion.div>
      )}

      {screen === 'formA' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 space-y-8"
        >
          <div className="border-b border-slate-100 pb-5">
            <h2 className="font-sans text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <ClipboardCheck className="w-6 h-6 text-amber-500" /> Formulario A
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Filtro y validación de las compuertas críticas (Gates) para acceder al programa de consultoría gratuito.
            </p>
          </div>

          <form onSubmit={handleApplyA} className="space-y-6">
            {/* General Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Nombre de la Empresa</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    ref={companyInputRef}
                    type="text"
                    required
                    placeholder="Ej. ABC Manufacturing"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-800 transition"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Nombre del Patrocinador Ejecutivo</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Ej. Ing. Roberto Mendoza"
                    value={sponsorName}
                    onChange={(e) => setSponsorName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-800 transition"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="Ej. rmendoza@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-800 transition"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Teléfono / WhatsApp de Contacto</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    placeholder="Ej. +52 55 1234 5678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-800 transition"
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  Recomendado con código de país (ej. +52). Se acepta el número tal como lo ingreses.
                </p>
              </div>
            </div>

            {/* Questions Form A */}
            <div className="space-y-6 pt-4 border-t border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Preguntas de Validación (Gates de Decisión):</h3>
              
              {formAQues.map((q) => (
                <div key={q.id} className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-150">
                  <div className="flex justify-between items-start gap-2">
                    <label className="text-sm font-semibold text-slate-800 leading-snug">{q.label}</label>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 mt-2">
                    {q.options.map((opt) => {
                      const isSelected = answersA[q.id] === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          id={`formA-${q.id}-opt-${opt.value}`}
                          onClick={() => setAnswersA({ ...answersA, [q.id]: opt.value })}
                          className={`p-2.5 text-left text-xs rounded-lg border transition-all ${
                            isSelected
                              ? 'bg-amber-500/10 border-amber-500 text-amber-950 font-medium ring-1 ring-amber-500'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{opt.label}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setScreen('landing')}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Volver
              </button>
              <button
                type="submit"
                id="submit-formA-btn"
                disabled={loading}
                className="px-6 py-3 bg-amber-500 text-slate-950 font-bold text-sm rounded-lg hover:bg-amber-400 transition shadow-md disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {loading ? 'Procesando...' : 'Evaluar Postulación'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {screen === 'resultA' && applicant && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 max-w-2xl mx-auto space-y-8"
        >
          <div className="text-center space-y-4">
            {applicant.statusA === 'Rechazado' && (
              <div className="inline-flex items-center justify-center bg-red-100 text-red-600 p-4 rounded-full">
                <XCircle className="w-12 h-12" />
              </div>
            )}
            {applicant.statusA === 'Aceptación Condicional' && (
              <div className="inline-flex items-center justify-center bg-amber-100 text-amber-600 p-4 rounded-full">
                <AlertTriangle className="w-12 h-12" />
              </div>
            )}
            {applicant.statusA === 'Aceptación Inmediata' && (
              <div className="inline-flex items-center justify-center bg-green-100 text-green-600 p-4 rounded-full">
                <CheckCircle2 className="w-12 h-12" />
              </div>
            )}

            <h2 className="font-sans text-2xl font-black text-slate-900 leading-tight">
              {applicant.statusA === 'Rechazado' && 'Agradecemos su interés en el Programa CSEA'}
              {applicant.statusA === 'Aceptación Condicional' && 'Postulación Recibida (Aceptación Condicional)'}
              {applicant.statusA === 'Aceptación Inmediata' && '¡Felicitaciones! Empresa Elegida para el Programa CSEA'}
            </h2>
            
            <p className="font-mono text-xs text-slate-400 uppercase tracking-wider">
              Puntaje Inicial: {applicant.scoreA}/25 ({applicant.percentA}%)
            </p>
            <div className="inline-block mt-2 px-3 py-1 bg-slate-100 rounded-full text-xs font-semibold text-slate-700">
              Nivel de Madurez de Ejecución Inicial: <span className="text-amber-600 font-extrabold">{
                applicant.percentA < 40 ? 'Muy Baja' :
                applicant.percentA < 60 ? 'Baja' :
                applicant.percentA < 80 ? 'Media' :
                applicant.percentA < 90 ? 'Alta' : 'Muy Alta'
              }</span>
            </div>
          </div>

          <div className="p-5 bg-slate-50 border border-slate-150 rounded-xl space-y-3 text-sm text-slate-600 leading-relaxed">
            {applicant.statusA === 'Rechazado' && (
              <p>
                Lamentablemente su empresa no cumple con los criterios de compuertas críticas de nuestro programa gratuito en esta etapa (se requiere un portafolio de mínimo 3 iniciativas simultáneas, un patrocinador directivo y disponibilidad suficiente de tiempo). <br /><br />Sin embargo, podemos ofrecerles una versión del CSEA como un servicio de pago o bien enviarle recursos informativos para optimizar sus metodologías operativas de forma autónoma. ¡Muchísimas gracias por su interés!
              </p>
            )}
            {applicant.statusA === 'Aceptación Condicional' && (
              <p>
                Su empresa cumple con la mayoría de los requerimientos para el programa, pero su puntuación se encuentra en una franja intermedia. <br /><br />Para ayudarnos a tomar una decisión definitiva en el comité y validar su admisión, le invitamos a responder el <strong>Pre-Assessment Diagnóstico (Bloque B)</strong>. Con esta información adicional, nuestros consultores analizarán la complejidad de su portafolio antes de realizar el contacto.
              </p>
            )}
            {applicant.statusA === 'Aceptación Inmediata' && (
              <p>
                Felicidades. Su organización cumple plenamente con los exigentes criterios y perfiles de elegibilidad para participar en la actual generación. Cuenta con un portafolio robusto, patrocinio ejecutivo idóneo y el compromiso necesario para que el diagnóstico genere un retorno real.<br /><br /><strong>Paso Siguiente:</strong> Complete el cuestionario <strong>Pre-Assessment Diagnóstico (Bloque B)</strong>. Son únicamente 10 preguntas breves de autoevaluación que nos permitirán mapear sus "dolores" prioritarios antes de nuestra sesión estratégica de 90 minutos.
              </p>
            )}
          </div>

          <div className="flex justify-center pt-4">
            {applicant.statusA === 'Rechazado' ? (
              <button
                id="back-to-landing-btn"
                onClick={() => setScreen('landing')}
                className="px-6 py-2.5 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-700 transition"
              >
                Volver a la Página Principal
              </button>
            ) : (
              <button
                id="go-to-formB-btn"
                onClick={() => setScreen('formB')}
                className="px-6 py-3 bg-amber-500 text-slate-950 font-bold text-sm rounded-lg hover:bg-amber-400 transition shadow-md flex items-center gap-2 cursor-pointer"
              >
                Continuar al Pre-Assessment (Bloque B) <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>
      )}

      {screen === 'formB' && applicant && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 space-y-8"
        >
          <div className="border-b border-slate-100 pb-5">
            <span className="font-mono text-[10px] text-amber-500 uppercase tracking-widest font-bold">
              Etapa 2 de 3
            </span>
            <h2 className="font-sans text-2xl font-extrabold text-slate-900 mt-1 flex items-center gap-2">
              <FileText className="w-6 h-6 text-amber-500" /> Bloque B - Pre-Assessment Diagnóstico
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Evaluación profunda de las 6 dimensiones clave de la capacidad de ejecución operativa en su organización.
            </p>
          </div>

          <div className="space-y-6">
            {formBQues.map((q, idx) => (
              <div key={q.id} className="space-y-3 p-5 bg-slate-50 border border-slate-150 rounded-xl">
                <div>
                  <h4 className="font-sans font-bold text-slate-900 text-sm">{q.label}</h4>
                  <p className="text-xs text-slate-500">{q.desc}</p>
                </div>

                <div className="space-y-2 mt-3">
                  {q.options.map((opt) => {
                    const isSelected = answersB[q.id] === opt.val;
                    return (
                      <button
                        key={opt.val}
                        type="button"
                        id={`formB-${q.id}-opt-${opt.val}`}
                        onClick={() => setAnswersB({ ...answersB, [q.id]: opt.val })}
                        className={`w-full p-3 text-left text-xs rounded-lg border transition-all flex items-center gap-3 ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500 text-amber-950 font-semibold ring-1 ring-amber-500'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full border text-[10px] flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-amber-500 border-amber-600 text-slate-950 font-bold' : 'border-slate-300 text-slate-400'
                        }`}>
                          {opt.val}
                        </span>
                        <span className="leading-snug">{opt.text}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button
              id="submit-formB-btn"
              onClick={handleApplyB}
              disabled={loading}
              className="px-6 py-3 bg-amber-500 text-slate-950 font-bold text-sm rounded-lg hover:bg-amber-400 transition shadow-md disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {loading ? 'Enviando...' : 'Finalizar Pre-Assessment'} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {screen === 'scheduler' && applicant && (() => {
        const sumB = Object.keys(answersB).reduce((acc, key) => acc + (Number(answersB[key]) || 3), 0);
        const answeredCountB = Object.keys(answersB).length;
        const fullSumB = sumB + (10 - answeredCountB) * 3;
        const normalizedMaturityB = Math.max(0, Math.min(100, Math.round((fullSumB / 50) * 100)));

        let levelName = 'Reactiva';
        let levelColor = 'text-red-700 bg-red-50 border-red-200';
        let levelDesc = '';
        let stepsToFollow: string[] = [];

        if (normalizedMaturityB >= 75) {
          levelName = 'Optimización Avanzada (Alta)';
          levelColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
          levelDesc = 'Su organización posee procesos estandarizados fuertes, visibilidad ejecutiva y alto alineamiento de recursos. El principal desafío es evitar la burocracia y automatizar flujos continuos.';
          stepsToFollow = [
            'Automatizar tableros de control de proyectos con integraciones directas (ej. Jira, Asana).',
            'Refinar la gobernanza para enfocar la toma de decisiones directivas únicamente en desvíos críticos.',
            'Lanzar iniciativas de innovación continua y capacitación avanzada en agilidad escalada.'
          ];
        } else if (normalizedMaturityB >= 50) {
          levelName = 'Controlada y Estándar (Media-Alta)';
          levelColor = 'text-teal-700 bg-teal-50 border-teal-200';
          levelDesc = 'Existen metodologías claras adoptadas en la mayoría de las áreas y reportes periódicos estructurados. Persiste el reto de afinar la gestión de capacidad y evitar la sobrecarga de recursos clave.';
          stepsToFollow = [
            'Establecer un proceso estricto de control de capacidad para evitar la multitarea excesiva de recursos clave.',
            'Definir un comité formal de control de cambios antes de modificar alcances de proyectos en marcha.',
            'Estandarizar KPIs unificados de éxito operativo de proyectos entre gerencias.'
          ];
        } else if (normalizedMaturityB >= 30) {
          levelName = 'Táctica y Fragmentada (Media-Baja)';
          levelColor = 'text-amber-700 bg-amber-50 border-amber-200';
          levelDesc = 'La ejecución depende principalmente del esfuerzo y criterio individual de los líderes de proyecto. Las prioridades cambian constantemente y la visibilidad directiva es reactiva.';
          stepsToFollow = [
            'Adoptar un marco metodológico ligero estandarizado (plantillas básicas de inicio, estatus y cierre) para toda la empresa.',
            'Institucionalizar reuniones mensuales de portafolio estratégicas guiadas por el Patrocinador Ejecutivo.',
            'Establecer canales claros y unificados de comunicación de cambios de alcance.'
          ];
        } else {
          levelName = 'Reactiva (Baja)';
          levelColor = 'text-red-700 bg-red-50 border-red-200';
          levelDesc = 'Se opera principalmente bajo urgencias cotidianas de "apagar fuegos". Se carece de un marco metodológico, no hay visibilidad consolidada y la multitarea diluye los esfuerzos organizacionales.';
          stepsToFollow = [
            'Poner un límite riguroso al inicio de nuevas iniciativas, enfocando a los equipos en un portafolio de máximo 3-5 proyectos prioritarios.',
            'Asignar roles y responsabilidades formales a patrocinadores directivos para cada iniciativa clave.',
            'Generar un reporte semanal de estatus sumamente simple (semáforo Rojo-Amarillo-Verde) para enterar a la dirección.'
          ];
        }

        return (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 max-w-2xl mx-auto space-y-8"
          >
            {/* Header */}
            <div className="text-center space-y-2 pb-4 border-b border-slate-100">
              <div className="inline-flex items-center justify-center bg-amber-100 text-amber-600 p-3 rounded-full">
                <Calendar className="w-8 h-8" />
              </div>
              <h2 className="font-sans text-2xl font-black text-slate-900 leading-tight">
                Resultados y Agenda del Diagnóstico
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Hemos analizado tus respuestas del Bloque B. A continuación se presenta tu diagnóstico de madurez operativa y los pasos de acción inmediatos.
              </p>
            </div>

            {/* Maturity Results Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4 shadow-inner">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-150 pb-4">
                <div>
                  <span className="font-mono text-[9px] text-slate-500 uppercase tracking-widest font-bold bg-slate-200/60 px-2 py-0.5 rounded">
                    Resultado del Diagnóstico (Bloque B)
                  </span>
                  <h3 className="text-sm font-extrabold text-slate-900 leading-tight mt-1.5">
                    Nivel de Madurez Operativa:
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Capacidad de ejecución estratégica actual
                  </p>
                </div>
                <div className={`px-4 py-2 rounded-xl border text-center shrink-0 ${levelColor}`}>
                  <div className="text-[10px] font-mono uppercase tracking-wider font-bold">Madurez de Ejecución</div>
                  <div className="text-2xl font-black">{normalizedMaturityB}%</div>
                  <div className="text-[11px] font-bold mt-0.5 leading-tight">{levelName}</div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>Análisis de Situación:</strong> {levelDesc}
                </p>
                
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                    <span>Pasos clave recomendados a seguir:</span>
                  </h4>
                  <ol className="grid gap-2 text-xs text-slate-600 pl-4 list-decimal">
                    {stepsToFollow.map((step, idx) => (
                      <li key={idx} className="leading-snug">{step}</li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>

            {/* Calendly Section */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Agendar tu Sesión de Diagnóstico (45 Min)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Para formalizar tu admisión y dar seguimiento a este diagnóstico con un Consultor Senior de Capricorn PMO, agenda tu sesión usando Calendly:
              </p>

              <div className="max-w-md mx-auto">
                {/* Option 1: Calendly */}
                <div className="border border-amber-200 bg-amber-50/20 rounded-xl p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 rounded text-[9px] font-bold uppercase tracking-wider text-amber-800">
                      Recomendado
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm">Agendar vía Calendly</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Selecciona libremente el día y hora ideal en nuestra agenda en tiempo real.
                    </p>
                  </div>
                  
                  <a
                    href="https://calendly.com/capricorn-pmo/45-minutos-con-capricorn-pmo"
                    target="_blank"
                    rel="noreferrer"
                    id="calendly-button"
                    className="w-full py-3 bg-amber-500 text-slate-950 font-bold text-xs rounded-lg hover:bg-amber-400 text-center transition shadow flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Agendar en Calendly</span>
                  </a>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-[10px] text-slate-400 leading-tight">
                * Se enviará una confirmación automática con los detalles de conexión.
              </div>
              
              <div className="flex gap-2 w-full sm:w-auto justify-end">
                <button
                  id="calendly-confirm-btn"
                  onClick={async () => {
                    setLoading(true);
                    try {
                      const { ok, data } = await safeFetchJson<{ success: boolean; applicant: Applicant }>(`/api/applicants/${applicant.id}/schedule`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ scheduledTime: 'Agendado vía Calendly' })
                      });
                      if (ok && data?.success) {
                        setApplicant(data.applicant);
                        onSuccessSubmission(data.applicant);
                        setScreen('completed');
                      }
                    } catch (err) {
                      console.error('Error agendando vía Calendly:', err);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 text-slate-100 font-bold text-xs rounded-lg hover:bg-slate-800 transition text-center cursor-pointer shadow-sm"
                >
                  Ya agendé en Calendly
                </button>
              </div>
            </div>
          </motion.div>
        );
      })()}

      {screen === 'completed' && applicant && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 max-w-2xl mx-auto space-y-8"
        >
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center bg-green-100 text-green-600 p-4 rounded-full">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h2 className="font-sans text-2xl font-black text-slate-900">
              ¡Diagnóstico CSEA Registrado Exitosamente!
            </h2>
            <p className="font-sans text-xs text-slate-400 uppercase tracking-widest font-bold">
              ID: {applicant.id}
            </p>
          </div>

          <div className="p-5 bg-slate-950 text-slate-200 rounded-xl space-y-4">
            <h4 className="font-sans font-bold text-amber-400 text-sm border-b border-slate-800 pb-2">Resumen de Agenda y Sesión:</h4>
            <div className="space-y-2 text-xs leading-relaxed">
              <p><strong>Empresa:</strong> {applicant.companyName}</p>
              <p><strong>Patrocinador:</strong> {applicant.sponsorName}</p>
              <p><strong>Sesión Consultiva CSEA:</strong> {applicant.scheduledTime || 'Por Confirmar'}</p>
              <p><strong>Duración:</strong> 90 Minutos (Vía Teams / Meet)</p>
            </div>
          </div>

          <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
            <h4 className="font-sans font-bold text-slate-900 text-sm">¿Qué sigue ahora?</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-xs">
              <li>Recibirá un correo automático confirmando su postulación y el enlace de calendario.</li>
              <li>Nuestros consultores revisarán el **Pre-Assessment Brief (Interno)** generado automáticamente con sus respuestas para preparar la entrevista táctica.</li>
              <li>Durante la sesión de 90 minutos profundizaremos en las causas raíz de sus dolores estratégicos.</li>
              <li>A las 48 horas posteriores a la sesión, le entregaremos el completo **Reporte Ejecutivo CSEA 3.2** con el análisis por dimensiones, sus riesgos y un plan de acción para los próximos 90 días.</li>
            </ul>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-center">
            <button
              id="restart-portal-btn"
              onClick={() => {
                setScreen('landing');
                setCompanyName('');
                setSponsorName('');
                setEmail('');
                setPhone('');
                setAnswersA({ q1: 3, q2: 3, q3: 3, q4: 3, q5: 3 });
                setAnswersB({ q1: 3, q2: 3, q3: 3, q4: 3, q5: 3, q6: 3, q7: 3, q8: 3, q9: 3, q10: 3 });
                setSelectedSlot(null);
                setApplicant(null);
              }}
              className="px-5 py-2 text-xs bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition"
            >
              Registrar Otra Empresa
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
