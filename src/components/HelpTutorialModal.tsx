import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, ChevronRight, Sparkles, ShieldCheck, Users, ArrowRight,
  Activity, Target, Lightbulb, CheckSquare, FileText, CheckCircle2,
  QrCode, Share2, LayoutGrid, Download, Edit3, BarChart3, Trash2,
  AlertCircle, Compass, Award, Clock, ArrowUpRight
} from 'lucide-react';
import { CapricornIcon } from './CapricornLogo';

interface HelpTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToModule: (module: 'client' | 'consultor' | 'admin' | 'auth_modal') => void;
}

type TabKey = 'step1_start' | 'step2_pipeline' | 'step3_interview' | 'step4_report' | 'step5_practices';

interface StepSection {
  id: TabKey;
  stepNumber: string;
  label: string;
  shortLabel: string;
  title: string;
  subtitle: string;
  icon: any;
  badge: string;
}

const SECTIONS: StepSection[] = [
  {
    id: 'step1_start',
    stepNumber: 'Fase 1',
    label: '1. Inicio & Invitación QR',
    shortLabel: '1. Invitación & QR',
    title: 'Arranque del Proyecto, Invitación al Patrocinador y Pre-Brief',
    subtitle: 'Captura el dolor crítico y contextualiza la iniciativa en menos de 10 minutos',
    icon: QrCode,
    badge: 'Paso 1'
  },
  {
    id: 'step2_pipeline',
    stepNumber: 'Fase 2',
    label: '2. Tablero & Dashboard de Avance',
    shortLabel: '2. Tablero & Avance',
    title: 'Monitoreo del Portafolio: Pipeline Kanban y Dashboard de Completitud',
    subtitle: 'Visibilidad ejecutiva en tiempo real sobre el avance por empresa y departamento',
    icon: LayoutGrid,
    badge: 'Paso 2'
  },
  {
    id: 'step3_interview',
    stepNumber: 'Fase 3',
    label: '3. Entrevista Ejecutiva (60Q)',
    shortLabel: '3. Entrevista 60Q',
    title: 'Facilitación de la Sesión de 90 Minutos y Acreditación de Evidencias',
    subtitle: '6 dimensiones, señales observables (S1-S5) y acreditación con microcontadores',
    icon: CheckSquare,
    badge: 'Paso 3'
  },
  {
    id: 'step4_report',
    stepNumber: 'Fase 4',
    label: '4. Diagnóstico & Reporte C-Level',
    shortLabel: '4. Reporte C-Level',
    title: 'Generación del Informe Ejecutivo, Radar Dimensional y Entregables Formales',
    subtitle: '18 secciones oficiales y exportación directa en PDF de alta resolución y Word',
    icon: Activity,
    badge: 'Paso 4'
  },
  {
    id: 'step5_practices',
    stepNumber: 'Fase 5',
    label: '5. Buenas Prácticas & FAQ de PMO',
    shortLabel: '5. Tips & FAQ',
    title: 'Guía de Facilitación para Gestores de Proyectos y Preguntas Frecuentes',
    subtitle: 'Criterios de diálogo directivo, gestión limpia de cartera y consejos prácticos',
    icon: Lightbulb,
    badge: 'Paso 5'
  }
];

export const HelpTutorialModal: React.FC<HelpTutorialModalProps> = ({
  isOpen,
  onClose,
  onNavigateToModule
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('step1_start');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col"
        >
          {/* Modal Header */}
          <div className="px-6 py-4 bg-slate-950 text-white border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-slate-900 border border-amber-500/40 shadow-xs">
                <CapricornIcon className="w-5 h-5" color="#D9822B" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-sans font-black text-white text-sm sm:text-base tracking-tight">
                    Guía de Uso CSEA v4.0 — Gestión de Proyectos
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Manual de Facilitación PMO
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Flujo paso a paso para líderes y consultores: desde la invitación inicial hasta el reporte ejecutivo final
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Cerrar Guía"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Interactive Navigation Tabs (5 Step Sequence) */}
          <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-thin shrink-0">
            {SECTIONS.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeTab === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveTab(sec.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{sec.shortLabel}</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-black uppercase ${
                    isActive ? 'bg-slate-950 text-amber-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {sec.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tab Content Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-grow">
            
            {/* ========================================================
                FASE 1: INICIO & INVITACIÓN QR (ARRANQUE DEL PROYECTO)
               ======================================================== */}
            {activeTab === 'step1_start' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-amber-600 uppercase tracking-widest font-bold">
                      Paso 1 de 5 · Arranque y Conexión con el Cliente
                    </span>
                    <span className="bg-amber-500/10 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                      Prospección Ágil
                    </span>
                  </div>
                  <h4 className="text-base font-black text-slate-900 mt-0.5">
                    Invitación al Patrocinador y Captura del Pre-Brief
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Inicia el proyecto conectando directamente con el patrocinador ejecutivo para recopilar el contexto inicial sin esfuerzo administrativo.
                  </p>
                </div>

                {/* 3 Main Action Cards */}
                <div className="grid md:grid-cols-3 gap-3">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                      <Share2 className="w-4 h-4 text-amber-500" />
                      <span>1. Enlace Compartible</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Haz clic en <strong>"Compartir Pre-Brief"</strong> en el menú superior para generar tu enlace personalizado. Toda empresa que responda ingresará directamente a tu portafolio privado.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-900 text-slate-200 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                      <QrCode className="w-4 h-4 text-amber-400" />
                      <span>2. Código QR Presencial</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      En juntas presenciales o videollamadas de arranque, abre la pestaña <strong>"Código QR"</strong> para que el patrocinador lo escanee directamente con la cámara de su teléfono.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                      <FileText className="w-4 h-4 text-emerald-600" />
                      <span>3. Mensajes Listos</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Aprovecha los botones de <strong>WhatsApp</strong> y <strong>Correo</strong> para enviar una invitación ejecutiva ya redactada con el propósito y tiempo estimado de respuesta.
                    </p>
                  </div>
                </div>

                {/* What the Client Fills Card */}
                <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
                      <Compass className="w-4 h-4 text-amber-600" />
                      <span>¿Qué información responde el cliente en esta fase inicial?</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                      10 Minutos Máximo
                    </span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2.5 text-xs text-slate-700 pt-1">
                    <div className="p-3 bg-white rounded-lg border border-amber-200/60 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 text-[11px]">
                        <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center text-[10px] font-bold">A</span>
                        <span>Formulario de Elegibilidad (Gate A)</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        5 preguntas rápidas que evalúan la urgencia del negocio, el respaldo del patrocinador ejecutivo y la viabilidad del diagnóstico.
                      </p>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-amber-200/60 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 text-[11px]">
                        <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center text-[10px] font-bold">B</span>
                        <span>Pre-Assessment Brief (Formulario B)</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        Autoevaluación cualitativa donde el directivo declara sus dolores críticos, nivel de madurez percibido y prioridades estratégicas del año.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Project Manager Pro-Tip */}
                <div className="p-3.5 bg-slate-900 text-white rounded-xl border border-slate-800 text-xs flex items-start gap-3">
                  <div className="p-1.5 bg-amber-500 text-slate-950 rounded-lg shrink-0 mt-0.5">
                    <Lightbulb className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-amber-400">Consejo de Gestión de Proyectos:</p>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Comparte el enlace 48 horas antes de la sesión de entrevista de 90 minutos. Esto te permitirá leer el Pre-Brief con anticipación y formular preguntas incisivas enfocadas en los dolores reales del negocio.
                    </p>
                  </div>
                </div>

                {/* Quick Navigation Action */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                  <span className="text-xs text-slate-500">¿Listo para invitar a un patrocinador?</span>
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToModule('consultor');
                    }}
                    className="w-full sm:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <span>Ir a Mi Cartera y Generar Enlace</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================
                FASE 2: TABLERO KANBAN & DASHBOARD DE AVANCE
               ======================================================== */}
            {activeTab === 'step2_pipeline' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-amber-600 uppercase tracking-widest font-bold">
                      Paso 2 de 5 · Control y Monitoreo del Portafolio
                    </span>
                    <span className="bg-emerald-500/10 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                      Visibilidad en Tiempo Real
                    </span>
                  </div>
                  <h4 className="text-base font-black text-slate-900 mt-0.5">
                    Tablero de Iniciativas y Dashboard de Avance por Área
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Supervisa el estado de cada empresa, detecta cuellos de botella y gestiona el ciclo de vida de los proyectos sin fricción.
                  </p>
                </div>

                {/* 2 Big Features */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                      <LayoutGrid className="w-4 h-4 text-amber-500" />
                      <span>Tablero Kanban de 6 Etapas</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Visualiza tus organizaciones organizadas en columnas según su grado de avance. Puedes arrastrar o seleccionar la etapa directamente, o dejar que el sistema las avance automáticamente a medida que se capturan datos.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-900 text-slate-200 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      <BarChart3 className="w-4 h-4 text-emerald-400" />
                      <span>Dashboard de Barras en Tiempo Real</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Gráficos de barras interactivos que comparan el % de avance de los cuestionarios entre organizaciones y áreas funcionales (Dirección, Operaciones, PMO, Finanzas, TI y Comercial).
                    </p>
                  </div>
                </div>

                {/* The 6 Life-Cycle Stages Cards */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Las 6 Etapas del Ciclo de Vida en el Tablero
                    </h5>
                    <span className="text-[10px] font-mono text-slate-500">Progresión Inteligente</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-0.5">
                      <span className="text-[9px] font-bold font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">1. Pre-Brief Pendiente</span>
                      <p className="font-bold text-slate-900 text-[11px] mt-1">Postulación Inicial</p>
                      <p className="text-[10px] text-slate-500">Gate A registrado por el cliente.</p>
                    </div>

                    <div className="p-2.5 bg-white rounded-lg border border-amber-200 space-y-0.5">
                      <span className="text-[9px] font-bold font-mono px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">2. Pre-Brief Listo</span>
                      <p className="font-bold text-slate-900 text-[11px] mt-1">Brief Completo</p>
                      <p className="text-[10px] text-slate-500">Hipótesis de riesgo generadas.</p>
                    </div>

                    <div className="p-2.5 bg-white rounded-lg border border-blue-200 space-y-0.5">
                      <span className="text-[9px] font-bold font-mono px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">3. 60Q en Curso</span>
                      <p className="font-bold text-slate-900 text-[11px] mt-1">Entrevista Activa</p>
                      <p className="text-[10px] text-slate-500">De 1 a 59 reactivos evaluados.</p>
                    </div>

                    <div className="p-2.5 bg-white rounded-lg border border-indigo-200 space-y-0.5">
                      <span className="text-[9px] font-bold font-mono px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800">4. 60Q Completa</span>
                      <p className="font-bold text-slate-900 text-[11px] mt-1">Matriz Certificada</p>
                      <p className="text-[10px] text-slate-500">Los 60 reactivos con evidencias.</p>
                    </div>

                    <div className="p-2.5 bg-white rounded-lg border border-emerald-200 space-y-0.5">
                      <span className="text-[9px] font-bold font-mono px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">5. Reporte Emitido</span>
                      <p className="font-bold text-slate-900 text-[11px] mt-1">Diagnóstico C-Level</p>
                      <p className="text-[10px] text-slate-500">18 secciones y radar listos.</p>
                    </div>

                    <div className="p-2.5 bg-white rounded-lg border border-purple-200 space-y-0.5">
                      <span className="text-[9px] font-bold font-mono px-1.5 py-0.2 rounded bg-purple-100 text-purple-800">6. Acompañamiento</span>
                      <p className="font-bold text-slate-900 text-[11px] mt-1">Ejecución PMO</p>
                      <p className="text-[10px] text-slate-500">Hoja de ruta y roadmap en marcha.</p>
                    </div>
                  </div>
                </div>

                {/* Project Manager Pro-Tip */}
                <div className="p-3.5 bg-slate-900 text-white rounded-xl border border-slate-800 text-xs flex items-start gap-3">
                  <div className="p-1.5 bg-emerald-500 text-slate-950 rounded-lg shrink-0 mt-0.5">
                    <Lightbulb className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-emerald-400">Consejo de Gestión de Proyectos:</p>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Utiliza la vista del <strong>Dashboard de Barras</strong> en tus juntas de estatus semanales. Si notas que un departamento clave (por ejemplo, Operaciones o TI) está retrasado en su bloque de preguntas, puedes coordinar una sesión breve de 20 minutos enfocada solo en sus 10 reactivos.
                    </p>
                  </div>
                </div>

                {/* Quick Navigation Action */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                  <span className="text-xs text-slate-500">Monitorear el avance de las iniciativas:</span>
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToModule('consultor');
                    }}
                    className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <span>Abrir Tablero & Dashboard de Avance</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================
                FASE 3: ENTREVISTA EJECUTIVA (60 REACTIVOS)
               ======================================================== */}
            {activeTab === 'step3_interview' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-amber-600 uppercase tracking-widest font-bold">
                      Paso 3 de 5 · Evaluación en Vivo de 90 Minutos
                    </span>
                    <span className="bg-blue-500/10 text-blue-800 text-[9px] font-bold px-2 py-0.5 rounded-full border border-blue-500/30">
                      Acreditación de Evidencias
                    </span>
                  </div>
                  <h4 className="text-base font-black text-slate-900 mt-0.5">
                    Conducción de la Entrevista y Registro Cualitativo
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Evalúa las 6 dimensiones estratégicas con rigor de auditoría C-Level respaldado por testimonios y evidencias concretas.
                  </p>
                </div>

                {/* The 6 Dimensions Overview */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Las 6 Dimensiones Oficiales (10 Preguntas por Bloque)
                    </h5>
                    <span className="text-[10px] font-mono text-slate-500">Total: 60 Reactivos</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <p className="font-bold text-slate-900 text-[11px]">1. Alineación (ALI)</p>
                      <p className="text-[10px] text-amber-600 font-mono font-bold">Peso: 20%</p>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <p className="font-bold text-slate-900 text-[11px]">2. Priorización (PRI)</p>
                      <p className="text-[10px] text-amber-600 font-mono font-bold">Peso: 20%</p>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <p className="font-bold text-slate-900 text-[11px]">3. Gobernanza (GOB)</p>
                      <p className="text-[10px] text-amber-600 font-mono font-bold">Peso: 20%</p>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <p className="font-bold text-slate-900 text-[11px]">4. Disciplina (DIS)</p>
                      <p className="text-[10px] text-amber-600 font-mono font-bold">Peso: 15%</p>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <p className="font-bold text-slate-900 text-[11px]">5. Capacidad (CAP)</p>
                      <p className="text-[10px] text-amber-600 font-mono font-bold">Peso: 15%</p>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <p className="font-bold text-slate-900 text-[11px]">6. Visibilidad (VIS)</p>
                      <p className="text-[10px] text-amber-600 font-mono font-bold">Peso: 10%</p>
                    </div>
                  </div>
                </div>

                {/* Triple Validation Rule Card */}
                <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-blue-950">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      <span>Regla de Acreditación Tripartita por Reactivo</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      Cero Diagnósticos Vacíos
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed">
                    Para asegurar que el diagnóstico tenga peso ante la Dirección General, cada uno de los 60 reactivos exige obligatoriamente tres elementos:
                  </p>

                  <div className="grid sm:grid-cols-3 gap-2.5">
                    <div className="p-3 bg-white rounded-lg border border-blue-200/60 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-blue-950 text-[11px]">
                        <Award className="w-3.5 h-3.5 text-blue-600" />
                        <span>1. Calificación (1 a 5)</span>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        Puntaje guiado por señales observables: <strong>S1</strong> (ausente), <strong>S3</strong> (intermitente) o <strong>S5</strong> (institucionalizado).
                      </p>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-blue-200/60 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-blue-950 text-[11px]">
                        <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                        <span>2. Evidencia Cliente (≥15 c.)</span>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        Testimonio directo o hechos concretos declarados por el directivo durante la sesión.
                      </p>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-blue-200/60 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-blue-950 text-[11px]">
                        <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                        <span>3. Notas Consultor (≥15 c.)</span>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        Juicio técnico experto, riesgos de entrega inferidos y sugerencias de mejora.
                      </p>
                    </div>
                  </div>
                </div>

                {/* UX Helpers: Microcounters & Auditor */}
                <div className="grid md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <Edit3 className="w-4 h-4 text-amber-500" />
                      <span>Microcontadores en Vivo</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Cada campo de texto cuenta con un contador (<code className="font-mono text-[10px]">X / 15 caracteres</code>). Permanece en ámbar mientras escribes y cambia a <strong>verde con marca de confirmación</strong> en cuanto alcanzas la extensión requerida.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-amber-400">
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                      <span>Modal de Auditoría con Salto Directo</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Al presionar <em>"Completar Entrevista"</em>, si algún reactivo quedó sin notas, el sistema muestra una ventana emergente que lista exactamente qué falta y ofrece un <strong>botón de salto directo</strong> para llevarte a esa pregunta al instante.
                    </p>
                  </div>
                </div>

                {/* Project Manager Pro-Tip */}
                <div className="p-3.5 bg-slate-900 text-white rounded-xl border border-slate-800 text-xs flex items-start gap-3">
                  <div className="p-1.5 bg-amber-500 text-slate-950 rounded-lg shrink-0 mt-0.5">
                    <Lightbulb className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-amber-400">Consejo de Gestión de Proyectos:</p>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Si el equipo directivo tiene poco tiempo, puedes dividir la entrevista en dos sesiones de 45 minutos (ej. Bloques 1 a 3 el lunes y Bloques 4 a 6 el miércoles). La barra de progreso superior guarda automáticamente cada respuesta en tiempo real sin riesgo de pérdida.
                    </p>
                  </div>
                </div>

                {/* Quick Navigation Action */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                  <span className="text-xs text-slate-500">Iniciar o continuar la entrevista de una empresa:</span>
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToModule('consultor');
                    }}
                    className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <span>Ir a Captura de 60 Reactivos</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================
                FASE 4: DIAGNÓSTICO & REPORTE C-LEVEL
               ======================================================== */}
            {activeTab === 'step4_report' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-amber-600 uppercase tracking-widest font-bold">
                      Paso 4 de 5 · Entregable para el Comité Directivo
                    </span>
                    <span className="bg-purple-500/10 text-purple-800 text-[9px] font-bold px-2 py-0.5 rounded-full border border-purple-500/30">
                      18 Secciones Oficiales
                    </span>
                  </div>
                  <h4 className="text-base font-black text-slate-900 mt-0.5">
                    Generación del Reporte Ejecutivo, Radar y Formatos Oficiales
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Convierte las evidencias en un informe formal de 18 secciones listo para presentar ante el Consejo de Administración.
                  </p>
                </div>

                {/* 2 Big Feature Cards */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                      <Activity className="w-4 h-4 text-amber-500" />
                      <span>Radar Dimensional Interactivo</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Muestra visualmente el perfil de madurez de la empresa comparado contra la <strong>Meta de Excelencia CSEA (4.0 puntos)</strong> en cada una de las 6 dimensiones, permitiendo a los directores entender su brecha de un solo vistazo.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-900 text-slate-200 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                      <Download className="w-4 h-4 text-amber-400" />
                      <span>Exportación Oficial en PDF y Word</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Descarga en un clic el <strong>PDF Oficial de Alta Resolución</strong> para entrega formal impresa o digital, o el archivo <strong>Word (.doc)</strong> estructurado si deseas incorporar anexos o el logotipo del cliente.
                    </p>
                  </div>
                </div>

                {/* 18 Sections Breakdown */}
                <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      Estructura del Reporte Ejecutivo (18 Secciones)
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Estándar Metodológico</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-300">
                    <p>1. Carta Ejecutiva</p>
                    <p>2. Comprensión de evaluación</p>
                    <p>3. Resumen ejecutivo</p>
                    <p className="text-amber-300">4. Resultados evaluación *</p>
                    <p className="text-amber-300">5. Análisis dimensiones *</p>
                    <p className="text-amber-300">6. Conclusiones *</p>
                    <p className="text-amber-300">7. Matriz de acciones *</p>
                    <p className="text-amber-300">8. Registro de riesgos *</p>
                    <p className="text-amber-300">9. Hoja de ruta (Roadmap) *</p>
                    <p className="text-amber-300">10. Matriz de prioridades *</p>
                    <p className="text-amber-300">11. Análisis por categoría *</p>
                    <p className="text-amber-300">12. Matriz casos negocio *</p>
                    <p className="text-amber-300">13. Perspectivas inversión *</p>
                    <p>14. Conclusiones finales</p>
                    <p>15. Plan transformación</p>
                    <p>16. Capacidades futuras</p>
                    <p>17. Guía de referencia</p>
                    <p>18. Preguntas frecuentes (FAQ)</p>
                  </div>
                  <p className="text-[10px] text-slate-400 border-t border-slate-800 pt-2">
                    * <strong>Regla de oro de cierre:</strong> Los capítulos 4 al 13 cierran obligatoriamente con cuatro subsecciones en este orden: <em>Análisis Ejecutivo, Recomendaciones, Principales Conclusiones y Conclusión Ejecutiva</em>.
                  </p>
                </div>

                {/* Project Manager Pro-Tip */}
                <div className="p-3.5 bg-slate-900 text-white rounded-xl border border-slate-800 text-xs flex items-start gap-3">
                  <div className="p-1.5 bg-purple-500 text-white rounded-lg shrink-0 mt-0.5">
                    <Lightbulb className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-purple-400">Consejo de Gestión de Proyectos:</p>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      En la sesión de cierre con el Comité Directivo, abre siempre con el <strong>Radar Dimensional</strong> para situar el nivel de madurez general. Dedica el 70% del tiempo de la reunión a discutir la <strong>Hoja de Ruta (Cap. 9)</strong> y la <strong>Matriz de Acciones Inmediatas (Cap. 7)</strong> para salir con compromisos claros.
                    </p>
                  </div>
                </div>

                {/* Quick Navigation Action */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                  <span className="text-xs text-slate-500">Explorar reportes y gráficos dimensionales:</span>
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToModule('consultor');
                    }}
                    className="w-full sm:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <span>Ver Radar Chart y Reportes</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================
                FASE 5: BUENAS PRÁCTICAS & FAQ DE PMO
               ======================================================== */}
            {activeTab === 'step5_practices' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-amber-600 uppercase tracking-widest font-bold">
                      Paso 5 de 5 · Excelencia Operativa
                    </span>
                    <span className="bg-amber-500/10 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                      Cero Fricción
                    </span>
                  </div>
                  <h4 className="text-base font-black text-slate-900 mt-0.5">
                    Buenas Prácticas de Facilitación y Preguntas Frecuentes de PMO
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Consejos prácticos para maximizar la efectividad en juntas directivas y resolver dudas comunes del día a día.
                  </p>
                </div>

                {/* Facilitation Guidance Cards */}
                <div className="grid md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900 uppercase tracking-wider">
                      <Compass className="w-4 h-4 text-amber-500" />
                      <span>Tono Consultivo Directivo</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-[11px]">
                      Plantea siempre los hallazgos en términos de <strong>exposición potencial de negocio y riesgos de entrega de proyectos</strong> (ej. *"existe exposición a sobrecostos por retrabajo en iniciativas prioritarias"*) en lugar de juicios dramáticos de crisis.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-900 text-slate-200 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-amber-400 uppercase tracking-wider">
                      <Trash2 className="w-4 h-4 text-amber-400" />
                      <span>Gestión Limpia del Portafolio</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed text-[11px]">
                      Si creas empresas de prueba o una oportunidad no prospera, utiliza el botón <strong>"Eliminar Organización"</strong> en la lista. El sistema confirmará la acción y purgará de forma definitiva el registro de tu espacio de trabajo sin dejar datos huérfanos.
                    </p>
                  </div>
                </div>

                {/* PMO FAQ Accordion / Cards */}
                <div className="space-y-2.5">
                  <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Preguntas Frecuentes para Gestores de Proyectos (PMO FAQ)
                  </h5>

                  <div className="space-y-2 text-xs">
                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                      <p className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>¿Qué hacer si el patrocinador no dispone de 90 minutos continuos?</span>
                      </p>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        Divide la evaluación en dos sesiones de 45 minutos (ej. Bloques 1 a 3 en una primera reunión y Bloques 4 a 6 en una segunda). La plataforma guarda el progreso de cada pregunta automáticamente, por lo que puedes pausar y retomar en cualquier momento.
                      </p>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                      <p className="font-bold text-slate-900 flex items-center gap-1.5">
                        <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                        <span>¿Por qué son obligatorios los comentarios y notas en cada pregunta?</span>
                      </p>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        Para asegurar que el diagnóstico esté sustentado en testimonios y hechos observables, no en apreciaciones subjetivas. Estas notas alimentan directamente el motor analítico para generar los capítulos del informe oficial con argumentos sólidos y sin vacíos.
                      </p>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                      <p className="font-bold text-slate-900 flex items-center gap-1.5">
                        <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>¿Cómo interpretar los gráficos de barras del Dashboard de Avance?</span>
                      </p>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        Muestran el porcentaje de cuestionario completado por empresa y por área funcional. Te permite identificar con un solo vistazo qué departamentos han concluido sus 10 preguntas y cuáles tienen respuestas pendientes para focalizar el seguimiento.
                      </p>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                      <p className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-purple-600" />
                        <span>¿Cómo se garantiza que mis empresas solo las vea mi cuenta?</span>
                      </p>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        Cada consultor cuenta con un espacio de trabajo privado. Los enlaces que compartes llevan tu identificador único de consultor, de modo que las empresas que respondan ingresan exclusivamente a tu tablero de portafolio sin mezclarse con otros colegas.
                      </p>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                      <p className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Download className="w-3.5 h-3.5 text-amber-600" />
                        <span>¿Puedo editar el reporte antes de presentarlo al Consejo de Administración?</span>
                      </p>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        Sí. Puedes descargar el diagnóstico en formato Word (.doc) editable para ajustar el formato institucional de la empresa, agregar anexos técnicos o incorporar los logotipos de los patrocinadores antes de la entrega ejecutiva.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Support and Contact Footer */}
                <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-center sm:text-left">
                    <p className="font-bold text-xs text-amber-400">Capricorn Consulting — Mesa de Ayuda Metodológica</p>
                    <p className="text-[11px] text-slate-400">Soporte a Líderes de Proyecto: info@capricorn.com.mx · rconde@capricorn.com.mx</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition cursor-pointer"
                  >
                    Entendido, Cerrar Guía
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Modal Footer Controls (Step Navigation) */}
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Metodología Certificada Capricorn Strategic Execution Assessment® (CSEA v4.0)</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const idx = SECTIONS.findIndex(s => s.id === activeTab);
                  if (idx > 0) setActiveTab(SECTIONS[idx - 1].id);
                }}
                disabled={activeTab === 'step1_start'}
                className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => {
                  const idx = SECTIONS.findIndex(s => s.id === activeTab);
                  if (idx < SECTIONS.length - 1) setActiveTab(SECTIONS[idx + 1].id);
                }}
                disabled={activeTab === 'step5_practices'}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed flex items-center gap-1"
              >
                <span>Siguiente Paso</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default HelpTutorialModal;
