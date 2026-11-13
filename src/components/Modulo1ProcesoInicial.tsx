import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, FileText, CheckCircle2, AlertTriangle, ArrowRight, 
  Building2, User, Mail, Phone, Check, ArrowLeft, RefreshCw, Layers
} from 'lucide-react';
import { Applicant } from '../types';
import { safeFetchJson } from '../utils/apiClient';

interface Modulo1ProcesoInicialProps {
  consultorId: string;
  consultorName: string;
  consultorEmail?: string;
  onCompanyCreated: (newApplicant: Applicant) => void;
  onGoToInterview: (applicant: Applicant) => void;
}

export default function Modulo1ProcesoInicial({
  consultorId,
  consultorName,
  consultorEmail,
  onCompanyCreated,
  onGoToInterview
}: Modulo1ProcesoInicialProps) {
  // Steps: 'disclaimer' -> 'formA' -> 'resultA' -> 'formB' -> 'completed'
  const [step, setStep] = useState<'disclaimer' | 'formA' | 'resultA' | 'formB' | 'completed'>('disclaimer');
  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form A Data
  const [companyName, setCompanyName] = useState('');
  const [sponsorName, setSponsorName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [answersA, setAnswersA] = useState<Record<string, number>>({});

  // Created Applicant
  const [createdApplicant, setCreatedApplicant] = useState<Applicant | null>(null);

  // Form B Data
  const [answersB, setAnswersB] = useState<Record<string, number>>({});

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
      desc: '¿Cómo se gestionan los cambios de prioridad o solicitudes imprevistas?',
      options: [
        { text: 'Los proyectos se interrumpen constantemente según urgencias de última hora', val: 1 },
        { text: 'Se aceptan casi todos los cambios sin recalcular fechas ni costos', val: 2 },
        { text: 'Se analizan informalmente con el solicitante antes de ejecutar', val: 3 },
        { text: 'Existe un comité de control de cambios para evaluar impactos', val: 4 },
        { text: 'Proceso formal de gobernanza que protege la capacidad de entrega', val: 5 },
      ]
    },
    {
      id: 'q6',
      label: '6. Detección de Desviaciones',
      desc: '¿Cuándo se detectan comúnmente las desviaciones o retrasos en los proyectos?',
      options: [
        { text: 'Cuando el proyecto ya venció o el cliente reclama el entregable', val: 1 },
        { text: 'Pocos días antes de la fecha límite programada', val: 2 },
        { text: 'Durante las revisiones mensuales de avance', val: 3 },
        { text: 'De forma anticipada mediante hitos y entregables intermedios', val: 4 },
        { text: 'Monitoreo proactivo continuo con alertas tempranas', val: 5 },
      ]
    },
    {
      id: 'q7',
      label: '7. Conflictos por Recursos Compartidos',
      desc: '¿Con qué frecuencia compiten múltiples proyectos por el tiempo del mismo personal?',
      options: [
        { text: 'Diariamente; el personal crítico está sobreasignado a más de 3 proyectos', val: 1 },
        { text: 'Frecuentemente; se generan cuellos de botella constantes en perfiles clave', val: 2 },
        { text: 'A veces; se resuelven mediante negociaciones directas entre líderes', val: 3 },
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

  const handleSubmitFormA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!companyName.trim() || !sponsorName.trim() || !email.trim()) {
      setError('Por favor complete el nombre de la empresa, patrocinador y correo.');
      return;
    }

    const unanswered = formAQues.filter(q => answersA[q.id] === undefined);
    if (unanswered.length > 0) {
      setError('Por favor responda las 5 preguntas del Formulario A para evaluar los Gates de admisión.');
      return;
    }

    setLoading(true);
    try {
      const { ok, data, error: apiErr } = await safeFetchJson<{ success: boolean; applicant: Applicant; error?: string }>('/api/applicants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: companyName.trim(),
          sponsorName: sponsorName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          answersA,
          consultorId: consultorId || undefined,
          consultorEmail: consultorEmail || undefined,
          assignedConsultor: consultorName || undefined,
          createdBy: consultorId || consultorEmail || undefined,
          disclaimerAccepted: true
        })
      });

      if (ok && data?.applicant) {
        setCreatedApplicant(data.applicant);
        onCompanyCreated(data.applicant);
        setStep('resultA');
      } else {
        setError(apiErr || data?.error || 'Error al procesar el Formulario A.');
      }
    } catch (err: any) {
      console.error(err);
      setError('Error de conexión al enviar el Formulario A.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFormB = async () => {
    if (!createdApplicant) return;
    setError(null);

    const unanswered = formBQues.filter(q => answersB[q.id] === undefined);
    if (unanswered.length > 0) {
      setError('Por favor responda todas las 10 preguntas del Pre-Assessment (Formulario B).');
      return;
    }

    setLoading(true);
    try {
      const { ok, data, error: apiErr } = await safeFetchJson<{ success: boolean; applicant: Applicant; error?: string }>(`/api/applicants/${createdApplicant.id}/submitB`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answersB })
      });

      if (ok && data?.applicant) {
        setCreatedApplicant(data.applicant);
        onCompanyCreated(data.applicant);
        setStep('completed');
      } else {
        setError(apiErr || data?.error || 'Error al registrar el Pre-Assessment.');
      }
    } catch (err: any) {
      console.error(err);
      setError('Error de conexión al registrar el Pre-Assessment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Module 1 Sub-stepper */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono ${
              step === 'disclaimer' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-100 text-slate-600'
            }`}>1</span>
            <span className={step === 'disclaimer' ? 'text-slate-900 font-bold' : 'text-slate-500'}>
              Descargo de Responsabilidades
            </span>
          </div>
          <span className="text-slate-300">→</span>
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono ${
              step === 'formA' || step === 'resultA' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-100 text-slate-600'
            }`}>2</span>
            <span className={step === 'formA' || step === 'resultA' ? 'text-slate-900 font-bold' : 'text-slate-500'}>
              Formulario A (Filtro / Gates)
            </span>
          </div>
          <span className="text-slate-300">→</span>
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono ${
              step === 'formB' || step === 'completed' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-100 text-slate-600'
            }`}>3</span>
            <span className={step === 'formB' || step === 'completed' ? 'text-slate-900 font-bold' : 'text-slate-500'}>
              Formulario B (Pre-Assessment)
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Descargo de Responsabilidades */}
      {step === 'disclaimer' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-md">
              <ShieldCheck className="w-4 h-4" />
              <span>Etapa 1 · Descargo de Responsabilidad y Confidencialidad</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Marco de Evaluación y Confidencialidad CSEA v4.0
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Como consultor estratégico autorizado de Capricorn Consulting ({consultorName}), este proceso permite ingresar y admitir a una organización cliente asegurando el cumplimiento estricto de las reglas metodológicas CSEA.
            </p>
          </div>

          <div className="space-y-4 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-5 leading-relaxed">
            <p>
              <strong>1. Confidencialidad de la Información:</strong> Toda la información comercial, organizacional y de proyectos capturada en este sistema es tratada bajo estricto secreto profesional y resguardo conforme a la política de protección de datos de Capricorn Consulting.
            </p>
            <p>
              <strong>2. Naturaleza del Diagnóstico:</strong> La evaluación evalúa capacidades de ejecución estratégica como hipótesis consultiva; no constituye una auditoría contable ni fiscal.
            </p>
            <p>
              <strong>3. Cero Alucinaciones y Rigor C-Level:</strong> Los reportes ejecutivos no inventan cifras de ROI ni porcentajes de ahorro financiero no respaldados por evidencia capturada.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="accept-disc"
              checked={acceptedDisclaimer}
              onChange={(e) => setAcceptedDisclaimer(e.target.checked)}
              className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
            />
            <label htmlFor="accept-disc" className="text-xs font-semibold text-slate-800 cursor-pointer">
              He revisado y acepto los términos de confidencialidad y rigor metodológico para proceder con el cliente.
            </label>
          </div>

          <div className="pt-2">
            <button
              disabled={!acceptedDisclaimer}
              onClick={() => { setError(null); setStep('formA'); }}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl shadow-sm transition disabled:opacity-50 flex items-center gap-2"
            >
              <span>Continuar al Formulario A (Filtro y Gates)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Formulario A (Filtro / Gates) */}
      {step === 'formA' && (
        <form onSubmit={handleSubmitFormA} className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-2 border-b border-slate-100 pb-4">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-md">
              <FileText className="w-4 h-4" />
              <span>Etapa 2 · Formulario A: Filtro de Admisión y Gates</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Datos Generales y Validación de Elegibilidad
            </h2>
            <p className="text-xs text-slate-500">
              Registre la organización que evaluará bajo su cartera de consultor. Se calculará el cumplimiento de los 5 Gates obligatorios.
            </p>
          </div>

          {/* Contact Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nombre de la Empresa / Organización *
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="Ej. Logística Global S.A."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Patrocinador / Contacto Ejecutivo *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="Ej. Lic. Claudia Morales"
                  value={sponsorName}
                  onChange={(e) => setSponsorName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Correo Electrónico de Contacto *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  placeholder="contacto@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Teléfono de Contacto
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="+52 55 1234 5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Form A Questions */}
          <div className="space-y-5 pt-2">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Validación de Criterios y Gates de Admisión (1 al 5)
            </h3>
            {formAQues.map((q) => (
              <div key={q.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <p className="text-xs font-bold text-slate-800">{q.label}</p>
                  <span className="text-[11px] font-mono text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded">
                    Gate: {q.gate}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                  {q.options.map((opt) => {
                    const isSelected = answersA[q.id] === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setAnswersA(prev => ({ ...prev, [q.id]: opt.value }))}
                        className={`p-2.5 text-left rounded-lg text-xs border transition-all ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 font-bold border-amber-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-[10px] font-bold">Nivel {opt.value}</span>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <p className="line-clamp-2 text-[11px] leading-tight">{opt.label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep('disclaimer')}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a Descargo</span>
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl shadow-sm transition disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Evaluar Admisión y Continuar</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* 2.1 Resultado de Formulario A */}
      {step === 'resultA' && createdApplicant && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-2 border-b border-slate-100 pb-4">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-md">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Resultado de Evaluación de Admisión (Gates)</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              {createdApplicant.companyName} — Estatus: {createdApplicant.statusA}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[11px] text-slate-500 font-semibold block">Puntaje Bloque A</span>
              <span className="text-2xl font-bold font-mono text-slate-900">{createdApplicant.scoreA} / 25 pts</span>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[11px] text-slate-500 font-semibold block">Porcentaje de Cumplimiento</span>
              <span className="text-2xl font-bold font-mono text-amber-600">{createdApplicant.percentA}%</span>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[11px] text-slate-500 font-semibold block">Estatus de Entrada</span>
              <span className={`text-sm font-bold block mt-1.5 ${
                createdApplicant.statusA === 'Aceptación Inmediata' ? 'text-emerald-700' :
                createdApplicant.statusA === 'Aceptación Condicional' ? 'text-amber-700' : 'text-rose-700'
              }`}>{createdApplicant.statusA}</span>
            </div>
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 leading-relaxed">
            La organización ha sido vinculada formalmente a su perfil de consultor <strong>{consultorName}</strong> ({consultorId}). Puede proceder a completar el Formulario B (Pre-Assessment Operativo) o avanzar directamente al Módulo del Consultor Estratégico.
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              onClick={() => onGoToInterview(createdApplicant)}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition flex items-center gap-2"
            >
              <span>Ir Directo a la Entrevista (Módulo 2)</span>
            </button>
            <button
              onClick={() => setStep('formB')}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-2"
            >
              <span>Proceder a Formulario B (Pre-Assessment)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 3. Formulario B (Pre-Assessment) */}
      {step === 'formB' && createdApplicant && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-2 border-b border-slate-100 pb-4">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-md">
              <Layers className="w-4 h-4" />
              <span>Etapa 3 · Formulario B: Autoevaluación Operativa (10 Dimensiones)</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Pre-Assessment de Madurez de {createdApplicant.companyName}
            </h2>
            <p className="text-xs text-slate-500">
              Califique cada dimensión del 1 (reactivo/crítico) al 5 (optimizado/maduro) para generar el pre-diagnóstico.
            </p>
          </div>

          <div className="space-y-6">
            {formBQues.map((q) => (
              <div key={q.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{q.label}</h4>
                  <p className="text-[11px] text-slate-500">{q.desc}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1">
                  {q.options.map((opt) => {
                    const isSelected = answersB[q.id] === opt.val;
                    return (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => setAnswersB(prev => ({ ...prev, [q.id]: opt.val }))}
                        className={`p-2.5 text-left rounded-lg text-xs border transition-all ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 font-bold border-amber-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-[10px] font-bold">Nivel {opt.val}</span>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <p className="line-clamp-3 text-[11px] leading-tight">{opt.text}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep('resultA')}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a Resultado A</span>
            </button>
            <button
              onClick={handleSubmitFormB}
              disabled={loading}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl shadow-sm transition disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Finalizar Proceso Inicial y Guardar</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 4. Completado */}
      {step === 'completed' && createdApplicant && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-5 shadow-sm">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900">
              ¡Proceso Inicial de Admisión y Pre-Assessment Completado!
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              La empresa <strong>{createdApplicant.companyName}</strong> cuenta con sus Formularios A y B registrados en su cartera privada. Ahora puede proceder a la entrevista estratégica CSEA de 90 minutos.
            </p>
          </div>
          <div className="pt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setStep('disclaimer');
                setAcceptedDisclaimer(false);
                setCompanyName('');
                setSponsorName('');
                setEmail('');
                setPhone('');
                setAnswersA({});
                setAnswersB({});
                setCreatedApplicant(null);
              }}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition"
            >
              Ingresar Otra Empresa
            </button>
            <button
              onClick={() => onGoToInterview(createdApplicant)}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-2"
            >
              <span>Ir a la Entrevista CSEA (Módulo 2)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
