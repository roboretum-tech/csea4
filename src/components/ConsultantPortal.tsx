import { useState, useEffect, FormEvent } from 'react';
import { motion } from 'motion/react';
import { 
  Users, Search, Calendar, Briefcase, FileText, Play, CheckCircle2, 
  HelpCircle, AlertTriangle, Lightbulb, TrendingUp, Save, Brain, BarChart3,
  ChevronRight, RefreshCw, Printer, ArrowLeft, Plus, Download,
  MessageSquareText, Sparkles, ChevronDown, ChevronUp, Check, RotateCcw,
  CheckSquare, ListChecks, ShieldCheck, Clock, Cpu, Trash2, Filter,
  LayoutGrid, List, Table, ArrowUpDown, X, Phone, Mail, Building2,
  SlidersHorizontal, CheckCircle, XCircle, ExternalLink, Activity, Key, Share2
} from 'lucide-react';
import { Applicant, Consultor, CSEAInterview, InterviewBlock, InterviewQuestion } from '../types';
import { safeFetchJson } from '../utils/apiClient';
import MaturityD3Dashboard, { calculateMaturity } from './MaturityD3Dashboard';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';
import { jsPDF } from 'jspdf';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { marked } from 'marked';
import Modulo1ProcesoInicial from './Modulo1ProcesoInicial';
import StrategicExecutionProgressChart from './StrategicExecutionProgressChart';
import ExecutiveReportRadarChart from './ExecutiveReportRadarChart';
import PasswordField from './PasswordField';
import SharePreBriefModal from './SharePreBriefModal';
import CompanyCrmPipeline from './CompanyCrmPipeline';
import QuestionnaireCompletionDashboard from './QuestionnaireCompletionDashboard';

interface ConsultantPortalProps {
  applicants: Applicant[];
  consultores?: Consultor[];
  activeConsultor?: { id?: string; name: string; email?: string } | null;
  onRefresh: () => void;
  onUpdateApplicant: (updated: Applicant) => void;
  onDeleteApplicant?: (id: string) => Promise<boolean>;
  onOpenAuthModal?: () => void;
}

export default function ConsultantPortal({ 
  applicants, 
  consultores = [], 
  activeConsultor,
  onRefresh, 
  onUpdateApplicant, 
  onDeleteApplicant,
  onOpenAuthModal
}: ConsultantPortalProps) {
  // Navigation between the main business modules:
  // 'dashboard' -> Dashboard Visual de Completitud en Tiempo Real (Recharts por empresa y departamento)
  // 'crm'       -> CRM de Seguimiento & Pipeline de Empresas (Kanban + Tabla)
  // 'modulo1'   -> Menú 1: Proceso Inicial (Descargo -> Formulario A -> Formulario B)
  // 'modulo2'   -> Menú 2: Consultor Estratégico (Entrevista 90 min, calificación reactivos 1-5, reporte ejecutivo)
  const [activeMainModule, setActiveMainModule] = useState<'modulo1' | 'modulo2' | 'crm' | 'dashboard'>('dashboard');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');
  const [generatingBrief, setGeneratingBrief] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportProgress, setReportProgress] = useState(0);
  const [savingNotes, setSavingNotes] = useState(false);
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'warning' | 'error'; message: string } | null>(null);
  const [selectedMaturityCategory, setSelectedMaturityCategory] = useState<string | null>(null);
  const [reportAiEngine, setReportAiEngine] = useState<'deterministic' | 'gemini' | 'claude'>('gemini');
  const [reportChartMode, setReportChartMode] = useState<'radar' | 'bar'>('radar');

  // Filtering & View Modes
  const [viewLayout, setViewLayout] = useState<'cards' | 'compact' | 'table'>('cards');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterStatusA, setFilterStatusA] = useState<'all' | 'Aceptación Inmediata' | 'Aceptación Condicional' | 'Rechazado'>('all');
  const [filterInterview, setFilterInterview] = useState<'all' | 'no_generada' | 'en_progreso' | 'completada'>('all');
  const [filterReport, setFilterReport] = useState<'all' | 'con_reporte' | 'sin_reporte'>('all');
  const [filterPreB, setFilterPreB] = useState<'all' | 'completado' | 'pendiente'>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'name_asc' | 'name_desc' | 'percent_desc' | 'percent_asc' | 'interview_desc'>('date_desc');

  // Deletion State
  const [companyToDelete, setCompanyToDelete] = useState<Applicant | null>(null);
  const [deletingCompany, setDeletingCompany] = useState(false);

  // Unanswered Questions Validation Modal State
  const [showPendingQuestionsModal, setShowPendingQuestionsModal] = useState(false);
  const [highlightedQuestionId, setHighlightedQuestionId] = useState<string | null>(null);

  // Gemini API Key Modal State
  const [showGeminiKeyModal, setShowGeminiKeyModal] = useState(false);
  const [geminiApiKeyInput, setGeminiApiKeyInput] = useState('');
  const [savingGeminiKey, setSavingGeminiKey] = useState(false);
  const [hasServerGeminiKey, setHasServerGeminiKey] = useState<boolean>(true);

  // Fetch admin configured default provider and key status
  useEffect(() => {
    safeFetchJson<any>('/api/admin/ai-settings')
      .then(({ ok, data }) => {
        if (ok && data) {
          if (data.defaultAiProvider) {
            setReportAiEngine(data.defaultAiProvider);
          }
          if (typeof data.hasGeminiKey === 'boolean') {
            setHasServerGeminiKey(data.hasGeminiKey);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Add Company modal state
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
  const [newCompanyForm, setNewCompanyForm] = useState({
    companyName: '',
    sponsorName: '',
    email: '',
    phone: '',
    consultorNotes: ''
  });
  const [creatingCompany, setCreatingCompany] = useState(false);

  // New interview state & tab management
  const [activeTab, setActiveTab] = useState<'brief' | 'interview' | 'report' | 'reportView'>('brief');
  const [generatingInterview, setGeneratingInterview] = useState(false);
  const [savingInterview, setSavingInterview] = useState(false);
  const [openBlocks, setOpenBlocks] = useState<Record<string, boolean>>({
    'alineacion_estrategica': true,
    'priorizacion_portafolio': true,
    'gobernanza_decisiones': true,
    'disciplina_ejecucion': true,
    'capacidad_organizacional': true,
    'visibilidad_control': true
  });

  // Auto-fill interview notes if the applicant changes
  useEffect(() => {
    if (selectedApplicant) {
      setInterviewNotes(selectedApplicant.consultorNotes || '');
    }
  }, [selectedApplicant?.id]);

  const toggleBlockAccordion = (blockId: string) => {
    setOpenBlocks(prev => ({
      ...prev,
      [blockId]: !prev[blockId]
    }));
  };

  const handleGenerateInterview = async (applicantId: string) => {
    setGeneratingInterview(true);
    setNotification(null);
    try {
      const { ok, data, error: fetchErr } = await safeFetchJson<any>(`/api/applicants/${applicantId}/generate-interview`, {
        method: 'POST'
      });
      if (ok && data?.success) {
        onUpdateApplicant(data.applicant);
        setSelectedApplicant(data.applicant);
        setNotification({
          type: 'success',
          message: data.isMock
            ? 'Guía de entrevista CSEA generada con el motor determinista local.'
            : '¡Guía de entrevista personalizada de 90 min generada exitosamente con Gemini 3.6 Flash!'
        });
      } else {
        setNotification({ type: 'error', message: 'Error: ' + (fetchErr || data?.error || 'No se pudo generar la entrevista.') });
      }
    } catch (err) {
      console.error(err);
      setNotification({ type: 'error', message: 'Error de conexión al generar la guía de entrevista.' });
    } finally {
      setGeneratingInterview(false);
    }
  };

  const handleSaveInterviewData = async (interviewData: CSEAInterview, isCompleted: boolean = false) => {
    if (!selectedApplicant) return;
    setSavingInterview(true);
    try {
      // Validate questions and normalize scores across blocks
      const sanitizedBloques = interviewData.bloques.map((block) => ({
        ...block,
        preguntas: block.preguntas.map((q) => {
          let score = q.score;
          let respondida = q.respondida || !!(q.respuesta && q.respuesta.trim().length > 0) || (score !== undefined && score > 0);

          if (score === undefined || score === null || isNaN(Number(score)) || Number(score) < 1 || Number(score) > 5) {
            if (isCompleted || respondida || (q.notas && q.notas.trim().length > 0)) {
              if (q.senales && q.respuesta) {
                if (q.respuesta === q.senales.s1) score = 1;
                else if (q.respuesta === q.senales.s5) score = 5;
                else if (q.respuesta === q.senales.s3) score = 3;
                else score = 3;
              } else {
                score = 3;
              }
              respondida = true;
            } else {
              score = undefined;
            }
          } else {
            score = Number(score);
          }

          return {
            ...q,
            score,
            respuesta: q.respuesta || '',
            notas: q.notas || '',
            respondida
          };
        })
      }));

      // Check if all 6 blocks are completed: every single question must have a valid score between 1 and 5
      const areAll6BlocksDone = sanitizedBloques.length === 6 && sanitizedBloques.every(b => 
        b.preguntas && b.preguntas.length > 0 && 
        b.preguntas.every(q => typeof q.score === 'number' && !isNaN(Number(q.score)) && Number(q.score) >= 1 && Number(q.score) <= 5)
      );

      const shouldMarkCompleted = isCompleted && areAll6BlocksDone;

      const updatedInterview: CSEAInterview = {
        ...interviewData,
        bloques: sanitizedBloques,
        estado: shouldMarkCompleted ? 'completada' : (interviewData.estado === 'no_generada' ? 'en_progreso' : interviewData.estado)
      };

      const { ok, data, error: fetchErr } = await safeFetchJson<any>(`/api/applicants/${selectedApplicant.id}/interview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          interview: updatedInterview, 
          estado: updatedInterview.estado,
          notes: interviewNotes
        })
      });

      if (ok && data?.success) {
        const updatedApp = {
          ...data.applicant,
          consultorNotes: interviewNotes
        };
        onUpdateApplicant(updatedApp);
        setSelectedApplicant(updatedApp);
        if (shouldMarkCompleted) {
          setActiveTab('report');
        }
        setNotification({
          type: 'success',
          message: shouldMarkCompleted 
            ? '¡Los 6 bloques y notas han sido validados! Entrevista guardada con estado COMPLETADA. Todo listo para generar el reporte.' 
            : 'Avance de la entrevista y notas generales guardados correctamente en la base de datos.'
        });
      } else {
        setNotification({ type: 'error', message: 'Error: ' + (fetchErr || data?.error || 'No se pudo guardar la entrevista.') });
      }
    } catch (err) {
      console.error(err);
      setNotification({ type: 'error', message: 'Error al guardar las respuestas de la entrevista.' });
    } finally {
      setSavingInterview(false);
    }
  };

  const isQuestionFullyAnswered = (q: InterviewQuestion): boolean => {
    const hasValidScore = typeof q.score === 'number' && !isNaN(Number(q.score)) && Number(q.score) >= 1 && Number(q.score) <= 5;
    const hasValidRespuesta = typeof q.respuesta === 'string' && q.respuesta.trim().length >= 15;
    const hasValidNotas = typeof q.notas === 'string' && q.notas.trim().length >= 15;
    return Boolean(hasValidScore && hasValidRespuesta && hasValidNotas);
  };

  const getQuestionMissingDetails = (q: InterviewQuestion) => {
    const missingScore = typeof q.score !== 'number' || isNaN(Number(q.score)) || Number(q.score) < 1 || Number(q.score) > 5;
    const respuestaLen = typeof q.respuesta === 'string' ? q.respuesta.trim().length : 0;
    const missingRespuesta = respuestaLen < 15;
    const notasLen = typeof q.notas === 'string' ? q.notas.trim().length : 0;
    const missingNotas = notasLen < 15;
    return { missingScore, missingRespuesta, missingNotas, respuestaLen, notasLen };
  };

  const checkAreAll6BlocksCompleted = (blocks: InterviewBlock[]): boolean => {
    return blocks.length === 6 && blocks.every(b => 
      b.preguntas && b.preguntas.length > 0 && 
      b.preguntas.every(q => isQuestionFullyAnswered(q))
    );
  };

  const handleUpdateQuestionAnswer = (blockId: string, questionId: string, answerText: string) => {
    if (!selectedApplicant || !selectedApplicant.interview) return;
    const newBlocks = selectedApplicant.interview.bloques.map((block) => {
      if (block.idBloque !== blockId) return block;
      return {
        ...block,
        preguntas: block.preguntas.map((q) => {
          if (q.idPregunta !== questionId) return q;
          let inferredScore = q.score;
          if ((inferredScore === undefined || inferredScore === null || inferredScore < 1) && answerText && answerText.trim().length > 0) {
            if (q.senales) {
              if (answerText === q.senales.s1) inferredScore = 1;
              else if (answerText === q.senales.s5) inferredScore = 5;
              else if (answerText === q.senales.s3) inferredScore = 3;
              else inferredScore = 3;
            } else {
              inferredScore = 3;
            }
          }
          return {
            ...q,
            score: inferredScore,
            respuesta: answerText,
            respondida: isQuestionFullyAnswered({ ...q, score: inferredScore, respuesta: answerText })
          };
        })
      };
    });

    const isAllDone = checkAreAll6BlocksCompleted(newBlocks);
    const nextState = isAllDone ? 'completada' : (selectedApplicant.interview.estado === 'generada' ? 'en_progreso' : selectedApplicant.interview.estado);

    const updatedApplicant: Applicant = {
      ...selectedApplicant,
      interview: {
        ...selectedApplicant.interview,
        estado: nextState,
        bloques: newBlocks
      }
    };

    setSelectedApplicant(updatedApplicant);
    onUpdateApplicant(updatedApplicant);
  };

  const handleCreateCompany = async (e: FormEvent) => {
    e.preventDefault();
    if (!newCompanyForm.companyName.trim()) return;
    setCreatingCompany(true);
    try {
      const { ok, data, error: fetchErr } = await safeFetchJson<any>('/api/applicants/create-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newCompanyForm,
          consultorId: activeConsultor?.id || activeConsultor?.email,
          consultorEmail: activeConsultor?.email,
          assignedConsultor: activeConsultor?.name || 'Consultor Estratégico',
          createdBy: activeConsultor?.id || activeConsultor?.email
        })
      });
      if (ok && data?.success) {
        onRefresh();
        onUpdateApplicant(data.applicant);
        setSelectedApplicant(data.applicant);
        setActiveTab('interview');
        setShowAddCompanyModal(false);
        setNewCompanyForm({ companyName: '', sponsorName: '', email: '', phone: '', consultorNotes: '' });
        setNotification({
          type: 'success',
          message: `Organización "${data.applicant.companyName}" registrada. Puedes iniciar directamente la entrevista de 90 min.`
        });
      } else {
        setNotification({ type: 'error', message: fetchErr || data?.error || 'Error al registrar la empresa.' });
      }
    } catch (err) {
      console.error(err);
      setNotification({ type: 'error', message: 'Error de red al registrar la empresa.' });
    } finally {
      setCreatingCompany(false);
    }
  };

  const handleUpdateQuestionScore = (blockId: string, questionId: string, scoreValue: number) => {
    if (!selectedApplicant || !selectedApplicant.interview) return;
    const newBlocks = selectedApplicant.interview.bloques.map((block) => {
      if (block.idBloque !== blockId) return block;
      return {
        ...block,
        preguntas: block.preguntas.map((q) => {
          if (q.idPregunta !== questionId) return q;
          
          let newAnswer = q.respuesta;
          // Auto-fill answer with rubric signal if empty
          if (!newAnswer || newAnswer.trim().length === 0) {
            if (q.senales) {
              if (scoreValue <= 2 && q.senales.s1) newAnswer = q.senales.s1;
              else if (scoreValue === 3 && q.senales.s3) newAnswer = q.senales.s3;
              else if (scoreValue >= 4 && q.senales.s5) newAnswer = q.senales.s5;
            }
          }

          const updatedQ = {
            ...q,
            score: scoreValue,
            respuesta: newAnswer
          };

          return {
            ...updatedQ,
            respondida: isQuestionFullyAnswered(updatedQ)
          };
        })
      };
    });

    const isAllDone = checkAreAll6BlocksCompleted(newBlocks);
    const nextState = isAllDone ? 'completada' : (selectedApplicant.interview.estado === 'generada' ? 'en_progreso' : selectedApplicant.interview.estado);

    const updatedApplicant: Applicant = {
      ...selectedApplicant,
      interview: {
        ...selectedApplicant.interview,
        estado: nextState,
        bloques: newBlocks
      }
    };

    setSelectedApplicant(updatedApplicant);
    onUpdateApplicant(updatedApplicant);
  };

  const handleUpdateQuestionNotes = (blockId: string, questionId: string, notesText: string) => {
    if (!selectedApplicant || !selectedApplicant.interview) return;
    const newBlocks = selectedApplicant.interview.bloques.map((block) => {
      if (block.idBloque !== blockId) return block;
      return {
        ...block,
        preguntas: block.preguntas.map((q) => {
          if (q.idPregunta !== questionId) return q;
          const updatedQ = {
            ...q,
            notas: notesText
          };
          return {
            ...updatedQ,
            respondida: isQuestionFullyAnswered(updatedQ)
          };
        })
      };
    });

    const isAllDone = checkAreAll6BlocksCompleted(newBlocks);
    const nextState = isAllDone ? 'completada' : (selectedApplicant.interview.estado === 'generada' ? 'en_progreso' : selectedApplicant.interview.estado);

    const updatedApplicant: Applicant = {
      ...selectedApplicant,
      interview: {
        ...selectedApplicant.interview,
        estado: nextState,
        bloques: newBlocks
      }
    };

    setSelectedApplicant(updatedApplicant);
    onUpdateApplicant(updatedApplicant);
  };

  const handleToggleQuestionAnswered = (blockId: string, questionId: string) => {
    if (!selectedApplicant || !selectedApplicant.interview) return;
    const newBlocks = selectedApplicant.interview.bloques.map((block) => {
      if (block.idBloque !== blockId) return block;
      return {
        ...block,
        preguntas: block.preguntas.map((q) => {
          if (q.idPregunta !== questionId) return q;
          const currentlyComplete = isQuestionFullyAnswered(q);
          const nextRespondida = !currentlyComplete;
          const score = nextRespondida && (!q.score || q.score < 1) ? 3 : q.score;
          const respuesta = nextRespondida && (!q.respuesta || q.respuesta.trim().length < 15)
            ? (q.senales?.s3 && q.senales.s3.length >= 15 ? q.senales.s3 : 'Práctica estándar observada y documentada en la evaluación ejecutiva.')
            : q.respuesta;
          const notas = nextRespondida && (!q.notas || q.notas.trim().length < 15)
            ? 'Notas del consultor: Proceso verificado bajo el estándar oficial CSEA v4.0.'
            : q.notas;
          return {
            ...q,
            respondida: nextRespondida,
            score,
            respuesta,
            notas
          };
        })
      };
    });

    const isAllDone = checkAreAll6BlocksCompleted(newBlocks);
    const nextState = isAllDone ? 'completada' : (selectedApplicant.interview.estado === 'generada' ? 'en_progreso' : selectedApplicant.interview.estado);

    const updatedApplicant: Applicant = {
      ...selectedApplicant,
      interview: {
        ...selectedApplicant.interview,
        estado: nextState,
        bloques: newBlocks
      }
    };

    setSelectedApplicant(updatedApplicant);
    onUpdateApplicant(updatedApplicant);
  };

  const handleAutoFillRemainingScores = async () => {
    if (!selectedApplicant || !selectedApplicant.interview) return;
    const newBlocks = selectedApplicant.interview.bloques.map((block) => ({
      ...block,
      preguntas: block.preguntas.map((q) => {
        let score = q.score;
        let respuesta = q.respuesta;
        if (!score || score < 1 || score > 5) {
          score = 3;
          if (!respuesta || respuesta.trim().length === 0) {
            respuesta = q.senales?.s3 || 'Proceso establecido con adopción parcial en áreas operativas clave.';
          }
        }
        return {
          ...q,
          score: Number(score),
          respuesta,
          respondida: true
        };
      })
    }));

    const finalInterview: CSEAInterview = {
      ...selectedApplicant.interview,
      bloques: newBlocks,
      estado: 'completada'
    };

    const updatedApplicant: Applicant = {
      ...selectedApplicant,
      interview: finalInterview
    };

    setSelectedApplicant(updatedApplicant);
    onUpdateApplicant(updatedApplicant);
    await handleSaveInterviewData(finalInterview, true);
    setNotification({
      type: 'success',
      message: '¡Los 6 bloques de preguntas han sido evaluados y la entrevista ha quedado validada como COMPLETADA!'
    });
  };

  const getTotalQuestionsCount = (interview?: CSEAInterview | null) => {
    if (!interview || !interview.bloques) return 0;
    return interview.bloques.reduce((acc, b) => acc + (b.preguntas?.length || 0), 0);
  };

  const getAnsweredQuestionsCount = (interview?: CSEAInterview | null) => {
    if (!interview || !interview.bloques) return 0;
    return interview.bloques.reduce((acc, b) => {
      const count = b.preguntas?.filter(q => q.respondida || (q.respuesta && q.respuesta.trim().length > 0)).length || 0;
      return acc + count;
    }, 0);
  };

  const getScoredQuestionsCount = (interview?: CSEAInterview | null) => {
    if (!interview || !interview.bloques) return 0;
    return interview.bloques.reduce((acc, b) => {
      const count = b.preguntas?.filter(q => q.score && q.score >= 1 && q.score <= 5).length || 0;
      return acc + count;
    }, 0);
  };

  const getInterviewBlockProgress = (interview?: CSEAInterview | null) => {
    if (!interview || !interview.bloques || interview.bloques.length === 0) {
      return {
        totalBlocks: 6,
        completedBlocks: 0,
        isAllBlocksComplete: false,
        totalQuestions: 60,
        evaluatedQuestions: 0,
        isFullyReady: false,
        blockStatuses: []
      };
    }

    const blockStatuses = interview.bloques.map((b, idx) => {
      const totalQuestions = b.preguntas?.length || 0;
      const evaluatedQuestions = b.preguntas?.filter((q) => isQuestionFullyAnswered(q)).length || 0;

      return {
        idBloque: b.idBloque || `bloque_${idx + 1}`,
        nombreBloque: b.nombreBloque,
        totalQuestions,
        evaluatedQuestions,
        isComplete: totalQuestions > 0 && evaluatedQuestions >= totalQuestions
      };
    });

    const completedBlocks = blockStatuses.filter(b => b.isComplete).length;
    const totalQuestions = blockStatuses.reduce((acc, b) => acc + b.totalQuestions, 0);
    const evaluatedQuestions = blockStatuses.reduce((acc, b) => acc + b.evaluatedQuestions, 0);
    const isAllBlocksComplete = blockStatuses.length === 6 && completedBlocks === 6 && totalQuestions > 0 && evaluatedQuestions >= totalQuestions;
    const isStateCompleted = interview.estado === 'completada' || interview.estado === 'completado';
    const isFullyReady = isAllBlocksComplete;

    return {
      totalBlocks: blockStatuses.length,
      completedBlocks,
      isAllBlocksComplete,
      totalQuestions,
      evaluatedQuestions,
      isFullyReady,
      blockStatuses
    };
  };

  const getUnansweredQuestionsByBlock = (interview?: CSEAInterview | null) => {
    if (!interview || !interview.bloques) return [];
    return interview.bloques.map((b, idx) => ({
      bloqueId: b.idBloque || `bloque_${idx + 1}`,
      nombreBloque: b.nombreBloque,
      bloqueIdx: idx,
      peso: b.peso,
      preguntas: (b.preguntas || []).filter(q => !isQuestionFullyAnswered(q))
    })).filter(b => b.preguntas.length > 0);
  };

  const handleGoToQuestion = (blockId: string, questionId: string) => {
    setShowPendingQuestionsModal(false);
    setActiveTab('interview');
    setOpenBlocks(prev => ({
      ...prev,
      [blockId]: true
    }));
    setHighlightedQuestionId(questionId);

    setTimeout(() => {
      const el = document.getElementById(`question-${questionId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 200);

    setTimeout(() => {
      setHighlightedQuestionId(current => current === questionId ? null : current);
    }, 3500);
  };

  const handleCompleteAndLockInterview = async () => {
    if (!selectedApplicant || !selectedApplicant.interview) return;
    
    // Check for any unanswered questions across all 6 blocks
    const unansweredBlocks = getUnansweredQuestionsByBlock(selectedApplicant.interview);
    const totalMissing = unansweredBlocks.reduce((acc, b) => acc + b.preguntas.length, 0);

    if (totalMissing > 0) {
      setNotification({
        type: 'warning',
        message: `No es posible marcar como completada: aún faltan ${totalMissing} reactivo(s) por responder. Cada reactivo debe contar con calificación del 1 al 5, comentarios de evidencia del cliente (mín. 15 car.) y notas del consultor (mín. 15 car.). Revise el listado a continuación.`
      });
      setShowPendingQuestionsModal(true);
      return;
    }

    // All questions are answered with score 1..5!
    const finalInterview: CSEAInterview = {
      ...selectedApplicant.interview,
      estado: 'completada'
    };

    const updatedApplicant: Applicant = {
      ...selectedApplicant,
      interview: finalInterview
    };

    setSelectedApplicant(updatedApplicant);
    onUpdateApplicant(updatedApplicant);
    await handleSaveInterviewData(finalInterview, true);
    setActiveTab('report');
  };

  const handleCompleteSingleBlock = async (blockId: string) => {
    if (!selectedApplicant || !selectedApplicant.interview) return;
    const newBlocks = selectedApplicant.interview.bloques.map((block) => {
      if (block.idBloque !== blockId) return block;
      return {
        ...block,
        preguntas: block.preguntas.map((q) => {
          let score = q.score;
          let respuesta = q.respuesta;
          let notas = q.notas;
          if (!score || isNaN(Number(score)) || Number(score) < 1 || Number(score) > 5) {
            score = 3;
          }
          if (!respuesta || respuesta.trim().length < 15) {
            respuesta = q.senales?.s3 && q.senales.s3.length >= 15
              ? q.senales.s3
              : 'Práctica estándar observada y documentada durante la evaluación ejecutiva.';
          }
          if (!notas || notas.trim().length < 15) {
            notas = 'Notas del consultor: Proceso evaluado en estándar consultivo CSEA v4.0 con evidencia recopilada.';
          }
          const updatedQ = {
            ...q,
            score: Number(score),
            respuesta,
            notas
          };
          return {
            ...updatedQ,
            respondida: isQuestionFullyAnswered(updatedQ)
          };
        })
      };
    });

    const isAllDone = checkAreAll6BlocksCompleted(newBlocks);
    const nextState = isAllDone ? 'completada' : (selectedApplicant.interview.estado === 'generada' ? 'en_progreso' : selectedApplicant.interview.estado);

    const finalInterview: CSEAInterview = {
      ...selectedApplicant.interview,
      bloques: newBlocks,
      estado: nextState
    };

    const updatedApplicant: Applicant = {
      ...selectedApplicant,
      interview: finalInterview
    };

    setSelectedApplicant(updatedApplicant);
    onUpdateApplicant(updatedApplicant);
    await handleSaveInterviewData(finalInterview, isAllDone);
    setNotification({
      type: 'success',
      message: isAllDone
        ? '¡Todos los 6 bloques han sido completados! Estado de la entrevista: COMPLETADA.'
        : 'Bloque evaluado en Nivel 3 Estándar y guardado correctamente.'
    });
  };

  const handleVerifyPassword = (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const normalizedInput = passwordInput.trim().toLowerCase();
    
    // Check registered consultants' passwords
    const matchesConsultor = consultores.some(c => c.password && c.password.trim().toLowerCase() === normalizedInput);
    
    // Fallback simple passwords
    const isFallback = normalizedInput === 'csea' || normalizedInput === 'capricorn' || normalizedInput === '';
    
    if (matchesConsultor || isFallback) {
      setIsPasswordVerified(true);
    } else {
      setAuthError('Código de acceso de consultor incorrecto.');
    }
  };

  const handleGenerateBrief = async (applicantId: string) => {
    if (!selectedApplicant?.hasCompletedB) {
      setNotification({
        type: 'warning',
        message: 'Para generar el Pre-Assessment Brief con IA, debe completarse primero el formulario de Pre-Brief (Bloque B) en el Menú 1: Proceso Inicial.'
      });
      return;
    }
    setGeneratingBrief(true);
    setNotification(null);
    try {
      const { ok, data, error: fetchErr } = await safeFetchJson<any>(`/api/applicants/${applicantId}/generate-brief`, {
        method: 'POST'
      });
      if (ok && data?.success) {
        onUpdateApplicant(data.applicant);
        setSelectedApplicant(data.applicant);
        if (data.isMock) {
          setNotification({
            type: 'warning',
            message: 'Brief generado con el motor inteligente local (motor de IA en espera de configuración en el servidor).'
          });
        } else {
          setNotification({
            type: 'success',
            message: '¡Brief de Pre-Assessment generado exitosamente con Inteligencia Artificial!'
          });
        }
      } else {
        setNotification({ type: 'error', message: 'Error: ' + (fetchErr || data?.error || 'No se pudo generar el brief.') });
      }
    } catch (err) {
      console.error(err);
      setNotification({ type: 'error', message: 'Error de conexión al generar el brief.' });
    } finally {
      setGeneratingBrief(false);
    }
  };

  const downloadReportWord = () => {
    if (!selectedApplicant || !selectedApplicant.executiveReport || !selectedApplicant.executiveReport.markdownReport) return;
    const markdown = selectedApplicant.executiveReport.markdownReport;
    
    // Parse markdown into semantic HTML using marked
    const parsedHtml = marked.parse(markdown, { gfm: true, breaks: false });

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Reporte Ejecutivo CSEA - ${selectedApplicant.companyName}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page {
            size: letter;
            margin: 2.5cm 2.0cm 2.5cm 2.0cm;
            mso-page-orientation: portrait;
          }
          body {
            font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.5;
            color: #1e293b;
            background-color: #ffffff;
            margin: 0;
            padding: 0;
          }
          h1 {
            font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
            font-size: 18pt;
            font-weight: bold;
            color: #0f172a;
            border-bottom: 2pt solid #2563eb;
            padding-bottom: 6pt;
            margin-top: 18pt;
            margin-bottom: 12pt;
            text-transform: uppercase;
          }
          h2 {
            font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
            font-size: 14pt;
            font-weight: bold;
            color: #1e3a8a;
            background-color: #f1f5f9;
            padding: 6pt 10pt;
            margin-top: 20pt;
            margin-bottom: 10pt;
            border-left: 4pt solid #2563eb;
          }
          h3 {
            font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
            font-size: 12pt;
            font-weight: bold;
            color: #0f172a;
            margin-top: 14pt;
            margin-bottom: 6pt;
          }
          p {
            margin-top: 0;
            margin-bottom: 8pt;
            text-align: justify;
          }
          ul, ol {
            margin-top: 0;
            margin-bottom: 10pt;
            padding-left: 20pt;
          }
          li {
            margin-bottom: 4pt;
          }
          /* TABLAS EJECUTIVAS MS WORD COMPATIBLES */
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10pt;
            margin-bottom: 14pt;
            font-size: 9.5pt;
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          th {
            background-color: #1e293b;
            color: #ffffff;
            font-weight: bold;
            text-align: left;
            padding: 8pt 10pt;
            border: 1pt solid #0f172a;
          }
          td {
            padding: 6pt 10pt;
            border: 1pt solid #cbd5e1;
            vertical-align: top;
          }
          tr:nth-child(even) td {
            background-color: #f8fafc;
          }
          blockquote {
            margin: 8pt 0;
            padding: 6pt 12pt;
            border-left: 3pt solid #f59e0b;
            background-color: #fffbeb;
            font-style: italic;
          }
          hr {
            border: none;
            border-top: 1pt solid #e2e8f0;
            margin: 16pt 0;
          }
          strong {
            color: #0f172a;
          }
        </style>
      </head>
      <body>
        ${parsedHtml}
      </body>
      </html>
    `;
    const blob = new Blob(['\ufeff', htmlContent], {
      type: 'application/msword;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CSEA_Reporte_${selectedApplicant.companyName.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadPreBriefPDF = () => {
    if (!selectedApplicant || !selectedApplicant.preBrief) return;
    
    const doc = new jsPDF();
    const brief = selectedApplicant.preBrief;
    
    const primaryColor = [15, 23, 42]; 
    const secondaryColor = [245, 158, 11]; 
    const lightBgColor = [248, 250, 252]; 
    const textColor = [51, 65, 85]; 
    const lightBorderColor = [226, 232, 240]; 
    
    let y = 20;
    
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(15, y, 180, 25, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('CAPRICORN PMO', 22, y + 10);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(245, 158, 11); 
    doc.text('PROGRAMA DE EVALUACIÓN DE MADUREZ (CSEA 3.2)', 22, y + 18);
    
    y += 35;
    
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('PRE-ASSESSMENT BRIEF DE IA', 15, y);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text('Documento de diagnóstico y preparación de entrevista estratégica (Uso Interno)', 15, y + 6);
    
    y += 15;
    
    doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
    doc.setDrawColor(lightBorderColor[0], lightBorderColor[1], lightBorderColor[2]);
    doc.rect(15, y, 180, 42, 'FD');
    
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('DATOS DE LA EMPRESA POSTULANTE', 20, y + 8);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFontSize(9);
    doc.text(`Empresa: ${selectedApplicant.companyName}`, 20, y + 16);
    doc.text(`Patrocinador: ${selectedApplicant.sponsorName}`, 20, y + 22);
    doc.text(`Correo Electrónico: ${selectedApplicant.email}`, 20, y + 28);
    doc.text(`Teléfono: ${selectedApplicant.phone || 'No especificado'}`, 20, y + 34);
    
    const dateStr = new Date(brief.generatedAt).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    doc.text(`Análisis IA: ${dateStr}`, 115, y + 16);
    doc.text(`ID Registro: ${selectedApplicant.id}`, 115, y + 22);
    doc.text(`Elegibilidad Inicial: ${selectedApplicant.percentA}%`, 115, y + 28);
    
    y += 50;
    
    doc.setFillColor(245, 158, 11, 0.1); 
    doc.setDrawColor(245, 158, 11);
    doc.rect(15, y, 85, 18, 'FD');
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('NIVEL DE URGENCIA OPERATIVA', 20, y + 6);
    doc.setFontSize(11);
    doc.setTextColor(180, 83, 9); 
    doc.text(brief.urgency || 'Media', 20, y + 13);
    
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(lightBorderColor[0], lightBorderColor[1], lightBorderColor[2]);
    doc.rect(110, y, 85, 18, 'FD');
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('PROBABILIDAD DE CONVERSIÓN', 115, y + 6);
    doc.setFontSize(11);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(brief.conversionProb || 'Media', 115, y + 13);
    
    y += 28;
    
    const checkPageOverflow = (neededHeight: number) => {
      if (y + neededHeight > 270) {
        doc.addPage();
        y = 20;
        return true;
      }
      return false;
    };
    
    checkPageOverflow(30);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('HIPÓTESIS CAUSAL DE LA SITUACIÓN ACTUAL', 15, y);
    
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(0.5);
    doc.line(15, y + 2, 195, y + 2);
    y += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    
    const hypothesisLines = doc.splitTextToSize(brief.hypotheses, 180);
    hypothesisLines.forEach((line: string) => {
      checkPageOverflow(5);
      doc.text(line, 15, y);
      y += 5;
    });
    
    y += 8;
    
    checkPageOverflow(40);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('PRINCIPALES RIESGOS DETECTADOS', 15, y);
    
    doc.setDrawColor(239, 68, 68); 
    doc.line(15, y + 2, 195, y + 2);
    y += 8;
    
    brief.risks.forEach((risk: string) => {
      const riskLines = doc.splitTextToSize(`• ${risk}`, 175);
      riskLines.forEach((line: string, index: number) => {
        checkPageOverflow(5);
        doc.setFont('helvetica', index === 0 ? 'bold' : 'normal');
        doc.setFontSize(9);
        doc.setTextColor(153, 27, 27); 
        doc.text(line, 15 + (index === 0 ? 0 : 3), y);
        y += 5;
      });
      y += 1; 
    });
    
    y += 8;
    
    checkPageOverflow(40);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('GUÍA DE PREGUNTAS RECOMENDADAS PARA LA ENTREVISTA (90 MIN)', 15, y);
    
    doc.setDrawColor(15, 23, 42); 
    doc.line(15, y + 2, 195, y + 2);
    y += 8;
    
    brief.questions.forEach((q: string) => {
      const qLines = doc.splitTextToSize(`? ${q}`, 175);
      qLines.forEach((line: string, index: number) => {
        checkPageOverflow(5);
        doc.setFont('helvetica', index === 0 ? 'bold' : 'normal');
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        const displayText = line.startsWith('? ') ? `¿${line.substring(2)}?` : line;
        doc.text(displayText, 15, y);
        y += 5;
      });
      y += 1.5;
    });
    
    if (brief.comments) {
      y += 8;
      checkPageOverflow(30);
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('NOTAS ADICIONALES DEL CONSULTOR / COMENTARIOS:', 15, y);
      y += 6;
      
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      const commentLines = doc.splitTextToSize(`"${brief.comments}"`, 180);
      commentLines.forEach((line: string) => {
        checkPageOverflow(5);
        doc.text(line, 15, y);
        y += 5;
      });
    }
    
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(lightBorderColor[0], lightBorderColor[1], lightBorderColor[2]);
      doc.setLineWidth(0.2);
      doc.line(15, 280, 195, 280);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Generado automáticamente por Capricorn PMO CSEA 3.2 - Página ${i} de ${pageCount}`, 15, 285);
    }
    
    doc.save(`CSEA-PreBrief-${selectedApplicant.companyName.replace(/\s+/g, '_')}.pdf`);
  };

  const downloadExecutiveReportPDF = () => {
    if (!selectedApplicant || !selectedApplicant.executiveReport) return;
    
    const doc = new jsPDF();
    const report = selectedApplicant.executiveReport;
    
    const primaryColor = [15, 23, 42]; 
    const secondaryColor = [245, 158, 11]; 
    const lightBgColor = [248, 250, 252]; 
    const textColor = [51, 65, 85]; 
    const lightBorderColor = [226, 232, 240]; 
    
    let y = 20;
    
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(15, y, 180, 25, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('CAPRICORN PMO', 22, y + 10);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(245, 158, 11); 
    doc.text('REPORTE EJECUTIVO Y HOJA DE RUTA CSEA 3.2', 22, y + 18);
    
    y += 35;
    
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('REPORTE EJECUTIVO DE MADUREZ OPERATIVA', 15, y);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text('Resultados de diagnóstico, evaluación dimensional y plan estratégico de 90 días', 15, y + 6);
    
    y += 15;
    
    doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
    doc.setDrawColor(lightBorderColor[0], lightBorderColor[1], lightBorderColor[2]);
    doc.rect(15, y, 180, 42, 'FD');
    
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('DATOS GENERALES DE EVALUACIÓN', 20, y + 8);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFontSize(9);
    doc.text(`Empresa: ${selectedApplicant.companyName}`, 20, y + 16);
    doc.text(`Patrocinador: ${selectedApplicant.sponsorName}`, 20, y + 22);
    doc.text(`Correo: ${selectedApplicant.email}`, 20, y + 28);
    doc.text(`Teléfono: ${selectedApplicant.phone || 'No especificado'}`, 20, y + 34);
    
    const dateStr = new Date(report.generatedAt).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    doc.text(`Fecha de Emisión: ${dateStr}`, 115, y + 16);
    doc.text(`ID Diagnóstico: ${selectedApplicant.id}`, 115, y + 22);
    doc.text(`Consultor Líder: ${selectedApplicant.assignedConsultor || 'Capricorn Advisor'}`, 115, y + 28);
    
    y += 50;
    
    doc.setFillColor(15, 23, 42); 
    doc.setDrawColor(15, 23, 42);
    doc.rect(15, y, 180, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('ÍNDICE GLOBAL DE EJECUCIÓN (MADUREZ OPERATIVA)', 22, y + 12);
    doc.setFontSize(16);
    doc.setTextColor(245, 158, 11);
    doc.text(`${report.globalIndex}%`, 160, y + 13);
    
    y += 28;
    
    const checkPageOverflow = (neededHeight: number) => {
      if (y + neededHeight > 270) {
        doc.addPage();
        y = 20;
        return true;
      }
      return false;
    };
    
    checkPageOverflow(45);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('CALIFICACIÓN DETALLADA POR DIMENSIÓN', 15, y);
    
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.5);
    doc.line(15, y + 2, 195, y + 2);
    y += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    
    report.dimensions.forEach((dim) => {
      checkPageOverflow(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(dim.name, 15, y);
      
      const scoreText = `${dim.score.toFixed(1)} / ${dim.max}`;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(245, 158, 11);
      doc.text(scoreText, 175, y);
      
      y += 3;
      checkPageOverflow(5);
      doc.setFillColor(241, 245, 249);
      doc.rect(15, y, 180, 2.5, 'F');
      
      const barWidth = (dim.score / dim.max) * 180;
      doc.setFillColor(245, 158, 11);
      doc.rect(15, y, barWidth, 2.5, 'F');
      
      y += 8;
    });
    
    y += 5;
    
    checkPageOverflow(40);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('HALLAZGOS CLAVE DETECTADOS', 15, y);
    
    doc.setDrawColor(16, 185, 129); 
    doc.setLineWidth(0.5);
    doc.line(15, y + 2, 195, y + 2);
    y += 8;
    
    report.findings.forEach((finding) => {
      const lines = doc.splitTextToSize(`• ${finding}`, 175);
      lines.forEach((line: string, index: number) => {
        checkPageOverflow(5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.text(line, 15, y);
        y += 5;
      });
      y += 1;
    });
    
    y += 5;
    
    checkPageOverflow(40);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('RIESGOS CRÍTICOS PARA LA ORGANIZACIÓN', 15, y);
    
    doc.setDrawColor(239, 68, 68); 
    doc.setLineWidth(0.5);
    doc.line(15, y + 2, 195, y + 2);
    y += 8;
    
    report.risks.forEach((risk) => {
      const lines = doc.splitTextToSize(`• ${risk}`, 175);
      lines.forEach((line: string, index: number) => {
        checkPageOverflow(5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(153, 27, 27); 
        doc.text(line, 15, y);
        y += 5;
      });
      y += 1;
    });
    
    y += 5;
    
    checkPageOverflow(45);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('QUICK WINS (ACCIONES INMEDIATAS RECOMENDADAS)', 15, y);
    
    doc.setDrawColor(245, 158, 11); 
    doc.setLineWidth(0.5);
    doc.line(15, y + 2, 195, y + 2);
    y += 8;
    
    report.quickWins.forEach((qw) => {
      const lines = doc.splitTextToSize(`• ${qw}`, 175);
      lines.forEach((line: string, index: number) => {
        checkPageOverflow(5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(120, 53, 4); 
        doc.text(line, 15, y);
        y += 5;
      });
      y += 1;
    });
    
    y += 5;
    
    checkPageOverflow(50);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('PLAN DE ACCIÓN Y ROADMAP DE 90 DÍAS', 15, y);
    
    doc.setDrawColor(15, 23, 42); 
    doc.setLineWidth(0.5);
    doc.line(15, y + 2, 195, y + 2);
    y += 8;
    
    report.roadmap90Days.forEach((step, idx) => {
      const lines = doc.splitTextToSize(`${idx + 1}. ${step}`, 175);
      lines.forEach((line: string, index: number) => {
        checkPageOverflow(5);
        doc.setFont('helvetica', index === 0 ? 'bold' : 'normal');
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        doc.text(line, 15, y);
        y += 5;
      });
      y += 1.5;
    });
    
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(lightBorderColor[0], lightBorderColor[1], lightBorderColor[2]);
      doc.setLineWidth(0.2);
      doc.line(15, 280, 195, 280);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Generado automáticamente por Capricorn PMO CSEA 3.2 - Página ${i} de ${pageCount}`, 15, 285);
    }
    
    doc.save(`CSEA-ReporteEjecutivo-${selectedApplicant.companyName.replace(/\s+/g, '_')}.pdf`);
  };

  const downloadExecutiveReportMarkdown = () => {
    if (!selectedApplicant || !selectedApplicant.executiveReport) return;
    const report = selectedApplicant.executiveReport;
    const dateStr = new Date(report.generatedAt).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    let md = `# CAPRICORN PMO\n`;
    md += `## REPORTE EJECUTIVO Y HOJA DE RUTA CSEA 3.2\n\n`;
    md += `### DATOS GENERALES DE EVALUACIÓN\n`;
    md += `- **Empresa:** ${selectedApplicant.companyName}\n`;
    md += `- **Patrocinador:** ${selectedApplicant.sponsorName}\n`;
    md += `- **Correo:** ${selectedApplicant.email}\n`;
    md += `- **Teléfono:** ${selectedApplicant.phone || 'No especificado'}\n`;
    md += `- **Fecha de Emisión:** ${dateStr}\n`;
    md += `- **ID Diagnóstico:** ${selectedApplicant.id}\n`;
    md += `- **Consultor Líder:** ${selectedApplicant.assignedConsultor || 'Capricorn Advisor'}\n\n`;
    
    md += `### ÍNDICE GLOBAL DE EJECUCIÓN (MADUREZ OPERATIVA): ${report.globalIndex}%\n\n`;
    
    md += `### CALIFICACIÓN DETALLADA POR DIMENSIÓN\n`;
    report.dimensions.forEach((dim) => {
      md += `- **${dim.name}:** ${dim.score.toFixed(1)} / ${dim.max}\n`;
    });
    md += `\n`;

    md += `### HALLAZGOS CLAVE DETECTADOS\n`;
    report.findings.forEach((finding) => {
      md += `- ${finding}\n`;
    });
    md += `\n`;

    md += `### RIESGOS CRÍTICOS PARA LA ORGANIZACIÓN\n`;
    report.risks.forEach((risk) => {
      md += `- ${risk}\n`;
    });
    md += `\n`;

    md += `### QUICK WINS (ACCIONES INMEDIATAS RECOMENDADAS)\n`;
    report.quickWins.forEach((qw) => {
      md += `- ${qw}\n`;
    });
    md += `\n`;

    md += `### PLAN DE ACCIÓN Y ROADMAP DE 90 DÍAS\n`;
    report.roadmap90Days.forEach((step, idx) => {
      md += `${idx + 1}. ${step}\n`;
    });
    md += `\n`;
    md += `_Generado automáticamente por Capricorn PMO CSEA 3.2_\n`;

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CSEA-ReporteEjecutivo-${selectedApplicant.companyName.replace(/\s+/g, '_')}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadInterviewMarkdown = () => {
    if (!selectedApplicant || !selectedApplicant.interview) return;
    
    // Ensure we retrieve the latest interview state from selectedApplicant or fallback to applicant list
    const currentApp = applicants.find(a => a.id === selectedApplicant.id) || selectedApplicant;
    const interview = selectedApplicant.interview || currentApp.interview;
    if (!interview || !interview.bloques) return;

    const dateStr = new Date().toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const answeredCount = getAnsweredQuestionsCount(interview);
    const scoredCount = getScoredQuestionsCount(interview);
    const totalCount = getTotalQuestionsCount(interview) || 30;

    let md = `# CAPRICORN PMO - CSEA 3.2\n`;
    md += `## ENTREVISTA DE DIAGNÓSTICO ESTRATÉGICO Y OPERATIVO (90 MINUTOS)\n\n`;
    md += `### DATOS GENERALES DE LA EMPRESA\n`;
    md += `- **Empresa:** ${selectedApplicant.companyName}\n`;
    md += `- **Patrocinador / Entrevistado:** ${selectedApplicant.sponsorName}\n`;
    md += `- **Correo Electrónico:** ${selectedApplicant.email}\n`;
    md += `- **Teléfono:** ${selectedApplicant.phone || 'No especificado'}\n`;
    md += `- **Fecha de Emisión / Exportación:** ${dateStr}\n`;
    md += `- **ID Diagnóstico:** ${selectedApplicant.id}\n`;
    md += `- **Consultor Líder:** ${selectedApplicant.assignedConsultor || 'Capricorn Advisor'}\n`;
    md += `- **Estado de la Entrevista:** ${
      interview.estado === 'completada' ? 'Completada' :
      interview.estado === 'en_progreso' ? 'En Progreso' :
      interview.estado === 'generada' ? 'Preguntas Generadas' : 'Inicial'
    }\n`;
    md += `- **Progreso de Respuestas:** ${answeredCount} de ${totalCount} reactivos contestados (${Math.round((answeredCount / (totalCount || 1)) * 100)}%)\n`;
    md += `- **Progreso de Calificación:** ${scoredCount} de ${totalCount} reactivos calificados\n\n`;

    if (selectedApplicant.preBrief) {
      md += `### CONTEXTO PRE-ASSESSMENT (BRIEF DE REFERENCIA)\n`;
      md += `- **Nivel de Urgencia:** ${selectedApplicant.preBrief.urgency}\n`;
      md += `- **Probabilidad de Conversión:** ${selectedApplicant.preBrief.conversionProb}\n`;
      md += `- **Hipótesis Causal:** ${selectedApplicant.preBrief.hypotheses}\n`;
      if (selectedApplicant.preBrief.risks?.length > 0) {
        md += `- **Riesgos Clave Identificados:**\n`;
        selectedApplicant.preBrief.risks.forEach((r) => {
          md += `  - ${r}\n`;
        });
      }
      md += `\n`;
    }

    md += `### GUÍA DE REACTIVOS Y CAPTURA DE LA ENTREVISTA POR BLOQUE\n\n`;

    interview.bloques.forEach((block, bIdx) => {
      const blockScored = block.preguntas?.filter(q => q.score && q.score >= 1 && q.score <= 5) || [];
      const blockAvg = blockScored.length > 0 
        ? (blockScored.reduce((acc, q) => acc + (q.score || 0), 0) / blockScored.length).toFixed(1)
        : 'Pendiente';

      md += `## Bloque ${bIdx + 1}: ${block.nombreBloque} (Peso CSEA: ${block.peso}% | Promedio: ${blockAvg}/5)\n\n`;

      block.preguntas.forEach((q, qIdx) => {
        const scoreLabel = q.score 
          ? `${q.score}/5 (${q.score <= 2 ? 'Incipiente/Malo' : q.score === 3 ? 'Parcial' : 'Sólido/Excelente'})` 
          : 'Sin calificar';
        const tipoLabel = q.tipo === 'P' ? 'Pregunta Principal' : 'Verificación Operacional';
        
        let customAnswer = (q.respuesta && typeof q.respuesta === 'string' && q.respuesta.trim().length > 0) 
          ? q.respuesta.trim() 
          : null;
        const notesText = (q.notas && typeof q.notas === 'string' && q.notas.trim().length > 0) 
          ? q.notas.trim() 
          : null;

        // Obtain observed evidence from signals if custom answer is empty or as complementary evidence
        let signalEvidence: string | null = null;
        if (q.score && q.senales) {
          if (q.score <= 2 && q.senales.s1) {
            signalEvidence = `[Nivel ${q.score}/5 - Incipiente]: ${q.senales.s1}`;
          } else if (q.score === 3 && q.senales.s3) {
            signalEvidence = `[Nivel 3/5 - Parcial]: ${q.senales.s3}`;
          } else if (q.score >= 4 && q.senales.s5) {
            signalEvidence = `[Nivel ${q.score}/5 - Sólido]: ${q.senales.s5}`;
          }
        }
        
        md += `### ${q.codigo || `${bIdx + 1}.${qIdx + 1}`} - ${q.texto}\n`;
        md += `- **Tipo:** ${tipoLabel}\n`;
        md += `- **Calificación de Madurez:** ${scoreLabel}\n`;
        md += `- **Estado de Captura:** ${customAnswer || q.score ? 'Completada / Evaluada' : 'Pendiente'}\n`;
        
        if (q.senales) {
          md += `- **Criterios de Madurez (Guía de Señales):**\n`;
          md += `  - **S1 (Incipiente 1-2):** ${q.senales.s1}\n`;
          md += `  - **S3 (Parcial 3):** ${q.senales.s3}\n`;
          md += `  - **S5 (Sólido 4-5):** ${q.senales.s5}\n`;
        }
        
        md += `\n**Respuesta del cliente y evidencias recopiladas:**\n`;
        if (customAnswer) {
          md += `${customAnswer}\n\n`;
          if (signalEvidence && !customAnswer.includes(signalEvidence)) {
            md += `_Evidencia de madurez evaluada:_ ${signalEvidence}\n\n`;
          }
        } else if (signalEvidence) {
          md += `${signalEvidence}\n\n`;
        } else {
          md += `_Sin respuesta registrada_\n\n`;
        }
        
        if (notesText) {
          md += `**Notas del consultor:**\n`;
          md += `${notesText}\n\n`;
        }

        md += `---\n\n`;
      });
    });

    const notes = interviewNotes || selectedApplicant.consultorNotes;
    if (notes && notes.trim()) {
      md += `### NOTAS GENERALES Y BITÁCORA COMPLEMENTARIA\n`;
      md += `${notes.trim()}\n\n`;
    }

    md += `_Documento generado por Capricorn Strategic Execution Assessment (CSEA) - Entrevista de Diagnóstico (90 min)_\n`;

    // Prepend UTF-8 BOM to ensure all Spanish special characters render properly in all markdown viewers and editors
    const blob = new Blob(['\uFEFF' + md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CSEA-Entrevista-90min-${selectedApplicant.companyName.replace(/\s+/g, '_')}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveNotes = async () => {
    if (!selectedApplicant) return;
    setSavingNotes(true);
    setNotification(null);
    try {
      const { ok, data, error: fetchErr } = await safeFetchJson<any>(`/api/applicants/${selectedApplicant.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: interviewNotes })
      });
      if (ok && data?.success) {
        onUpdateApplicant(data.applicant);
        setSelectedApplicant(data.applicant);
        setNotification({ type: 'success', message: 'Notas de entrevista guardadas exitosamente.' });
      } else {
        setNotification({ type: 'error', message: 'Error: ' + (fetchErr || data?.error || 'No se pudieron guardar las notas.') });
      }
    } catch (err) {
      console.error(err);
      setNotification({ type: 'error', message: 'Error de conexión al guardar las notas.' });
    } finally {
      setSavingNotes(false);
    }
  };

  const handleGenerateReport = async (applicantId: string, overrideGeminiKey?: string) => {
    if (!selectedApplicant) return;

    // Strict validation: Verify 6 blocks and 60 questions with 1-5 scores
    const unansweredBlocks = getUnansweredQuestionsByBlock(selectedApplicant.interview);
    const totalMissing = unansweredBlocks.reduce((acc, b) => acc + b.preguntas.length, 0);
    const blockProgress = getInterviewBlockProgress(selectedApplicant.interview);

    if (totalMissing > 0 || !blockProgress.isAllBlocksComplete) {
      setNotification({
        type: 'warning',
        message: `No es posible generar el Reporte Ejecutivo: aún faltan ${totalMissing} de 60 reactivos por completar (calificación 1-5, comentarios de cliente mín. 15 car. y notas de consultor mín. 15 car.). Revise el listado a continuación.`
      });
      setShowPendingQuestionsModal(true);
      return;
    }

    let payloadInterview = selectedApplicant.interview;
    if (payloadInterview) {
      payloadInterview = {
        ...payloadInterview,
        estado: 'completada'
      };
      const updatedApplicant = {
        ...selectedApplicant,
        interview: payloadInterview
      };
      setSelectedApplicant(updatedApplicant);
      onUpdateApplicant(updatedApplicant);
    }

    setGeneratingReport(true);
    setReportProgress(0);
    setNotification(null);
    
    // Simulate progress while the API responds
    const progressInterval = setInterval(() => {
      setReportProgress(prev => {
        const next = prev + Math.floor(Math.random() * 5) + 1;
        return next > 90 ? 90 : next;
      });
    }, 800);

    try {
      const { ok, data, error: fetchErr } = await safeFetchJson<any>(`/api/applicants/${applicantId}/generate-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          provider: reportAiEngine,
          interview: payloadInterview,
          ...(overrideGeminiKey ? { geminiApiKey: overrideGeminiKey } : {})
        })
      });
      
      clearInterval(progressInterval);
      setReportProgress(100);
      
      setTimeout(() => {
        if (ok && data?.success) {
          onUpdateApplicant(data.applicant);
          setSelectedApplicant(data.applicant);
          setActiveTab('reportView');
          if (data.provider === 'claude') {
            setNotification({
              type: 'success',
              message: '¡Reporte Ejecutivo CSEA generado exitosamente con Claude 3.7 Sonnet!'
            });
          } else if (data.provider === 'gemini') {
            setNotification({
              type: 'success',
              message: '¡Reporte Ejecutivo CSEA generado exitosamente con Google Gemini (gemini-3.8-flash)!'
            });
          } else {
            setNotification({
              type: 'success',
              message: 'Reporte Ejecutivo CSEA generado exitosamente.'
            });
          }
        } else {
          if (data?.code === 'MISSING_GEMINI_KEY') {
            setShowGeminiKeyModal(true);
            setNotification({
              type: 'warning',
              message: data.error || 'Se requiere una API Key de Google Gemini (Gratuita) para generar el Reporte Ejecutivo.'
            });
          } else {
            setNotification({ type: 'error', message: 'Error: ' + (fetchErr || data?.error || 'Error al generar el reporte.') });
          }
        }
        setGeneratingReport(false);
      }, 500);
    } catch (err) {
      console.error(err);
      clearInterval(progressInterval);
      setNotification({ type: 'error', message: 'Error de conexión al generar el reporte.' });
      setGeneratingReport(false);
    }
  };

  const handleSaveAndGenerateWithGeminiKey = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = geminiApiKeyInput.trim();
    if (!trimmed) return;
    setSavingGeminiKey(true);
    try {
      await safeFetchJson('/api/admin/ai-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geminiApiKey: trimmed, defaultAiProvider: 'gemini' })
      });
      setHasServerGeminiKey(true);
      setShowGeminiKeyModal(false);
      setGeminiApiKeyInput('');
      if (selectedApplicant) {
        handleGenerateReport(selectedApplicant.id, trimmed);
      }
    } catch (err) {
      console.error('Error guardando API Key:', err);
      setNotification({ type: 'error', message: 'No se pudo guardar la clave API de Gemini.' });
    } finally {
      setSavingGeminiKey(false);
    }
  };

  const handleDeleteCompany = async () => {
    if (!companyToDelete) return;
    setDeletingCompany(true);
    try {
      let success = false;
      if (onDeleteApplicant) {
        success = await onDeleteApplicant(companyToDelete.id);
      } else {
        const { ok, data } = await safeFetchJson<any>(`/api/applicants/${companyToDelete.id}`, { method: 'DELETE' });
        success = !!(ok && data?.success);
      }

      if (success) {
        if (selectedApplicant?.id === companyToDelete.id) {
          setSelectedApplicant(null);
        }
        onRefresh();
        setNotification({
          type: 'success',
          message: `Organización "${companyToDelete.companyName}" eliminada correctamente.`
        });
        setCompanyToDelete(null);
      } else {
        setNotification({
          type: 'error',
          message: 'No se pudo eliminar la empresa. Por favor intente nuevamente.'
        });
      }
    } catch (err) {
      console.error('Error deleting company:', err);
      setNotification({
        type: 'error',
        message: 'Error de conexión al eliminar la empresa.'
      });
    } finally {
      setDeletingCompany(false);
    }
  };

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedMaturityCategory(null);
    setFilterStatusA('all');
    setFilterInterview('all');
    setFilterReport('all');
    setFilterPreB('all');
    setSortBy('date_desc');
  };

  const activeFiltersCount = 
    (searchQuery.trim() ? 1 : 0) +
    (selectedMaturityCategory ? 1 : 0) +
    (filterStatusA !== 'all' ? 1 : 0) +
    (filterInterview !== 'all' ? 1 : 0) +
    (filterReport !== 'all' ? 1 : 0) +
    (filterPreB !== 'all' ? 1 : 0) +
    (sortBy !== 'date_desc' ? 1 : 0);

  const filteredApplicants = applicants.filter(a => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      a.companyName.toLowerCase().includes(q) ||
      a.sponsorName.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      (a.phone && a.phone.toLowerCase().includes(q));
      
    if (!matchesSearch) return false;
    
    if (selectedMaturityCategory) {
      const maturity = calculateMaturity(a);
      if (maturity.level !== selectedMaturityCategory) return false;
    }

    if (filterStatusA !== 'all' && a.statusA !== filterStatusA) {
      return false;
    }

    if (filterPreB === 'completado' && !a.hasCompletedB) return false;
    if (filterPreB === 'pendiente' && a.hasCompletedB) return false;

    if (filterInterview !== 'all') {
      const interviewState = a.interview?.estado || 'no_generada';
      if (filterInterview === 'no_generada' && interviewState !== 'no_generada') return false;
      if (filterInterview === 'en_progreso' && interviewState !== 'en_progreso' && interviewState !== 'generada') return false;
      if (filterInterview === 'completada' && interviewState !== 'completada') return false;
    }

    if (filterReport === 'con_reporte' && !a.executiveReport) return false;
    if (filterReport === 'sin_reporte' && a.executiveReport) return false;
    
    return true;
  }).sort((a, b) => {
    if (sortBy === 'date_desc') {
      return new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime();
    }
    if (sortBy === 'date_asc') {
      return new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime();
    }
    if (sortBy === 'name_asc') {
      return a.companyName.localeCompare(b.companyName);
    }
    if (sortBy === 'name_desc') {
      return b.companyName.localeCompare(a.companyName);
    }
    if (sortBy === 'percent_desc') {
      return (b.percentA || 0) - (a.percentA || 0);
    }
    if (sortBy === 'percent_asc') {
      return (a.percentA || 0) - (b.percentA || 0);
    }
    if (sortBy === 'interview_desc') {
      const countA = getAnsweredQuestionsCount(a.interview);
      const countB = getAnsweredQuestionsCount(b.interview);
      return countB - countA;
    }
    return 0;
  });

  // Calculate real-time maturity distribution for Recharts summary widget
  const totalApplicantsCount = applicants.length;
  const applicantsWithMaturity = applicants.map(a => ({
    ...a,
    maturity: calculateMaturity(a)
  }));

  const evaluatedApplicants = applicantsWithMaturity.filter(a => a.maturity.isEvaluated);
  const evaluatedCount = evaluatedApplicants.length;

  const realTimeMaturityStats = applicantsWithMaturity.reduce(
    (acc, a) => {
      const { level, score, isEvaluated } = a.maturity;
      if (level === 'Bajo') acc.Bajo += 1;
      else if (level === 'Medio') acc.Medio += 1;
      else if (level === 'Alto') acc.Alto += 1;
      else if (level === 'Sin Evaluar') acc.SinEvaluar += 1;
      if (isEvaluated) {
        acc.evaluatedScoreSum += score;
      }
      return acc;
    },
    { Bajo: 0, Medio: 0, Alto: 0, SinEvaluar: 0, evaluatedScoreSum: 0 }
  );

  // Average maturity strictly over evaluated organizations
  const avgMaturityScore = evaluatedCount > 0 
    ? Math.round(realTimeMaturityStats.evaluatedScoreSum / evaluatedCount) 
    : 0;

  const maturityDistributionData = [
    {
      level: 'Alto',
      label: 'Alto (≥70%)',
      proyectos: realTimeMaturityStats.Alto,
      porcentaje: totalApplicantsCount > 0 ? Math.round((realTimeMaturityStats.Alto / totalApplicantsCount) * 100) : 0,
      color: '#10b981',
      hoverColor: '#059669',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      description: 'Gestión Optimizada / Excelencia'
    },
    {
      level: 'Medio',
      label: 'Medio (35-69%)',
      proyectos: realTimeMaturityStats.Medio,
      porcentaje: totalApplicantsCount > 0 ? Math.round((realTimeMaturityStats.Medio / totalApplicantsCount) * 100) : 0,
      color: '#f59e0b',
      hoverColor: '#d97706',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      description: 'Gestión Estandarizada / Control'
    },
    {
      level: 'Bajo',
      label: 'Bajo (<35%)',
      proyectos: realTimeMaturityStats.Bajo,
      porcentaje: totalApplicantsCount > 0 ? Math.round((realTimeMaturityStats.Bajo / totalApplicantsCount) * 100) : 0,
      color: '#ef4444',
      hoverColor: '#dc2626',
      badgeClass: 'bg-red-50 text-red-700 border-red-200',
      description: 'Gestión Reactiva / Incipiente'
    },
    {
      level: 'Sin Evaluar',
      label: 'Sin Evaluar',
      proyectos: realTimeMaturityStats.SinEvaluar,
      porcentaje: totalApplicantsCount > 0 ? Math.round((realTimeMaturityStats.SinEvaluar / totalApplicantsCount) * 100) : 0,
      color: '#94a3b8',
      hoverColor: '#64748b',
      badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
      description: 'Pendiente de Diagnóstico'
    }
  ];

  if (!isPasswordVerified && !activeConsultor) {
    return (
      <div id="consultor-password-screen" className="py-16 px-4 max-w-md mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 space-y-6"
        >
          <div className="text-center space-y-2">
            <div className="inline-flex bg-slate-900 text-amber-500 p-3 rounded-full">
              <Users className="w-8 h-8" />
            </div>
            <h2 className="font-sans text-xl font-extrabold text-slate-900">Acceso Portal de Consultores</h2>
            <p className="text-xs text-slate-500">
              Inicie sesión mediante Firebase Auth o introduzca su código de acceso institucional para ver únicamente sus empresas asignadas.
            </p>
          </div>

          {onOpenAuthModal && (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>Iniciar Sesión con Firebase Auth / Perfil</span>
            </button>
          )}

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-400"><span className="bg-white px-2">o con código directo</span></div>
          </div>

          <form onSubmit={handleVerifyPassword} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Código de Acceso de Consultor</label>
              <PasswordField
                placeholder="Introduzca 'csea' o contraseña"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-amber-500 text-slate-800 focus:bg-white"
              />
            </div>

            {authError && (
              <p className="text-xs text-red-500 font-semibold bg-red-50 border border-red-150 p-2 rounded-md">
                {authError}
              </p>
            )}

            <button
              id="verify-consultor-btn"
              type="submit"
              className="w-full px-4 py-2.5 bg-slate-950 text-white hover:bg-slate-800 text-xs font-bold rounded-lg transition"
            >
              Ingresar al Panel
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div id="consultor-portal-root" className="py-8 px-4 max-w-7xl mx-auto space-y-6">
      
      {notification && (
        <div className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between gap-3 shadow-sm ${
          notification.type === 'success' 
            ? 'bg-emerald-50 border border-emerald-150 text-emerald-800' 
            : notification.type === 'warning'
              ? 'bg-amber-50 border border-amber-150 text-amber-800'
              : 'bg-rose-50 border border-rose-150 text-rose-800'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className={`w-4 h-4 shrink-0 ${
              notification.type === 'success' 
                ? 'text-emerald-500' 
                : notification.type === 'warning'
                  ? 'text-amber-500'
                  : 'text-rose-500'
            }`} />
            <span>{notification.message}</span>
          </div>
          <button 
            onClick={() => setNotification(null)}
            className={`text-xs font-bold uppercase tracking-wider shrink-0 ${
              notification.type === 'success' 
                ? 'text-emerald-500 hover:text-emerald-700' 
                : notification.type === 'warning'
                  ? 'text-amber-500 hover:text-amber-700'
                  : 'text-rose-500 hover:text-rose-700'
            }`}
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Consultant Header with 2 Main Business Modules */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-sans text-2xl font-black text-slate-900">
              Panel del Consultor Estratégico
            </h1>
            {activeConsultor && (
              <span className="text-xs bg-amber-100/80 text-amber-900 font-bold px-2.5 py-0.5 rounded-full border border-amber-300/50">
                {activeConsultor.name}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Metodología CSEA v4.0 · Aislamiento multi-tenant de clientes y generación ejecutiva C-Level.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Main 2-Module Selector */}
          {/* Main Module Selector */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
            <button
              id="menu-dashboard-avance-btn"
              type="button"
              onClick={() => setActiveMainModule('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeMainModule === 'dashboard'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Dashboard de Avance</span>
            </button>
            <button
              id="menu-crm-pipeline-btn"
              type="button"
              onClick={() => setActiveMainModule('crm')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeMainModule === 'crm'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>CRM & Pipeline</span>
            </button>
            <button
              id="menu-1-proceso-inicial-btn"
              type="button"
              onClick={() => setActiveMainModule('modulo1')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeMainModule === 'modulo1'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Menú 1: Proceso Inicial</span>
            </button>
            <button
              id="menu-2-consultor-csea-btn"
              type="button"
              onClick={() => setActiveMainModule('modulo2')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeMainModule === 'modulo2'
                  ? 'bg-slate-900 text-amber-400 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Menú 2: Consultor CSEA</span>
            </button>
          </div>

          {/* Share Pre-Brief URL + QR Modal Trigger */}
          <button
            id="share-pre-brief-header-btn"
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer"
            title="Generar enlace compartible y código QR para clientes"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Compartir Pre-Brief</span>
          </button>

          <button
            id="refresh-consultant-btn"
            onClick={onRefresh}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition flex items-center gap-1 text-xs font-medium border border-slate-200 cursor-pointer"
            title="Actualizar datos"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* RENDER DASHBOARD DE COMPLETITUD EN TIEMPO REAL */}
      {activeMainModule === 'dashboard' && (
        <QuestionnaireCompletionDashboard
          applicants={applicants}
          activeConsultor={activeConsultor ? { id: activeConsultor.id || '', name: activeConsultor.name, email: activeConsultor.email || '' } : null}
          onSelectApplicant={(target) => {
            setSelectedApplicant(target);
            setActiveMainModule('modulo2');
          }}
          onNavigateToInterview={(target) => {
            setSelectedApplicant(target);
            setActiveMainModule('modulo2');
            setActiveTab('interview');
          }}
          onNavigateToPreBrief={(target) => {
            setSelectedApplicant(target);
            setActiveMainModule('modulo1');
          }}
        />
      )}

      {/* RENDER MODULO CRM: PIPELINE Y TABLERO DE SEGUIMIENTO */}
      {activeMainModule === 'crm' && (
        <CompanyCrmPipeline
          applicants={applicants}
          activeConsultor={activeConsultor ? { id: activeConsultor.id || '', name: activeConsultor.name, email: activeConsultor.email || '' } : null}
          onUpdateApplicant={onUpdateApplicant}
          onSelectApplicant={(target) => {
            setSelectedApplicant(target);
            setActiveMainModule('modulo2');
          }}
          onNavigateTab={(tab) => {
            setActiveMainModule('modulo2');
            setActiveTab(tab);
          }}
          onOpenShareModal={() => setIsShareModalOpen(true)}
          onNavigateToDashboard={() => setActiveMainModule('dashboard')}
        />
      )}

      {/* RENDER MODULO 1: PROCESO INICIAL (DESCARGO -> FORMULARIO A -> FORMULARIO B) */}
      {activeMainModule === 'modulo1' && (
        <Modulo1ProcesoInicial
          consultorId={activeConsultor?.id || 'consultor-default'}
          consultorName={activeConsultor?.name || 'Consultor Estratégico'}
          consultorEmail={activeConsultor?.email}
          onCompanyCreated={(newApp) => {
            onUpdateApplicant(newApp);
            onRefresh();
          }}
          onGoToInterview={(targetApp) => {
            setSelectedApplicant(targetApp);
            setActiveMainModule('modulo2');
            setActiveTab('interview');
          }}
        />
      )}

      {/* RENDER MODULO 2: CONSULTOR ESTRATÉGICO CSEA (ENTREVISTA 90 MIN & REPORTE EJECUTIVO) */}
      {activeMainModule === 'modulo2' && (
        <div className="space-y-6">
          {/* Recharts Strategic Execution Progress Visualization Component */}
          <StrategicExecutionProgressChart
            applicants={applicants}
            onSelectApplicant={(client) => {
              setSelectedApplicant(client);
              setActiveTab('interview');
            }}
            selectedApplicantId={selectedApplicant?.id}
          />

          <div className="grid lg:grid-cols-12 gap-6">
            {/* D3.js Portfolio Maturity Donut & Summary */}
            <div className="lg:col-span-6">
          <MaturityD3Dashboard 
            applicants={applicants}
            selectedCategory={selectedMaturityCategory}
            onSelectCategory={setSelectedMaturityCategory}
          />
        </div>

        {/* Recharts Real-Time Maturity Distribution Bar Chart Summary Widget */}
        <div className="lg:col-span-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 h-full flex flex-col justify-between space-y-4">
            
            {/* Widget Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-sans font-black text-slate-900 text-sm">
                    Distribución de Madurez (Recharts)
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Comparativa en tiempo real de niveles Alto, Medio, Bajo y Sin Evaluar
                  </p>
                </div>
              </div>

              <div className="text-right bg-slate-950 text-white px-3 py-1.5 rounded-xl border border-slate-800">
                <span className="text-[8px] font-mono uppercase text-amber-400 block font-bold tracking-wider">Promedio Global</span>
                <span className="text-xs font-black font-mono">
                  {avgMaturityScore}% Madurez
                </span>
                <span className="text-[8px] text-slate-400 block font-mono">
                  {evaluatedCount} de {totalApplicantsCount} evaluadas
                </span>
              </div>
            </div>

            {/* Recharts Bar Chart */}
            <div className="h-52 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={maturityDistributionData}
                  margin={{ top: 15, right: 10, left: -20, bottom: 5 }}
                >
                  <XAxis 
                    dataKey="label" 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#334155' }} 
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis 
                    allowDecimals={false} 
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-950 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs space-y-1">
                            <p className="font-extrabold flex items-center gap-1.5 text-xs" style={{ color: data.color }}>
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }}></span>
                              Nivel {data.level}
                            </p>
                            <p className="text-slate-300 text-[10px] font-medium">{data.description}</p>
                            <div className="pt-1.5 border-t border-slate-800 flex justify-between gap-4 font-mono text-[11px]">
                              <span className="text-slate-400">Proyectos:</span>
                              <span className="font-bold text-amber-400">{data.proyectos} ({data.porcentaje}%)</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="proyectos" 
                    radius={[8, 8, 0, 0]}
                    cursor="pointer"
                    onClick={(entry: any) => {
                      if (entry && entry.level) {
                        setSelectedMaturityCategory(
                          selectedMaturityCategory === entry.level ? null : entry.level
                        );
                      }
                    }}
                  >
                    {maturityDistributionData.map((entry) => (
                      <Cell 
                        key={entry.level} 
                        fill={selectedMaturityCategory === entry.level ? entry.hoverColor : entry.color} 
                        stroke={selectedMaturityCategory === entry.level ? '#0f172a' : 'transparent'}
                        strokeWidth={2}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Metric KPI Action Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-100">
              {maturityDistributionData.map((item) => {
                const isSelected = selectedMaturityCategory === item.level;
                return (
                  <button
                    key={item.level}
                    type="button"
                    onClick={() => setSelectedMaturityCategory(isSelected ? null : item.level)}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-950 border-slate-950 text-white shadow-md ring-2 ring-amber-500/50'
                        : `${item.badgeClass} hover:shadow-sm`
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold font-mono uppercase truncate">
                        {item.level}
                      </span>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-base font-black font-mono leading-none">
                        {item.proyectos}
                      </span>
                      <span className="text-[9px] font-bold opacity-75">
                        ({item.porcentaje}%)
                      </span>
                    </div>
                    <p className="text-[8px] truncate mt-1 opacity-80 font-medium">
                      {item.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Filter Reset Indicator */}
            {selectedMaturityCategory && (
              <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-2.5 flex items-center justify-between text-xs text-amber-900">
                <div className="flex items-center gap-1.5 text-[10px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>Filtro activo: Nivel <strong>{selectedMaturityCategory}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedMaturityCategory(null)}
                  className="text-[10px] font-bold text-amber-700 hover:text-amber-950 underline cursor-pointer"
                >
                  Ver todos ({totalApplicantsCount})
                </button>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* Left column: List of applicants with visual modes & filters */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-3.5">
            
            {/* Header: Title + Live Count + Add Company Button */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Empresas
                </h3>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {filteredApplicants.length} / {applicants.length}
                </span>
              </div>
              <button
                id="add-company-btn"
                type="button"
                onClick={() => setShowAddCompanyModal(true)}
                className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] rounded-xl transition-all flex items-center gap-1 shadow-sm hover:shadow cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar</span>
              </button>
            </div>
            
            {/* Search Input Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar empresa, patrocinador, correo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Limpiar búsqueda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* View Mode & Filter Controls Bar */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
              {/* View Layout Switcher */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setViewLayout('cards')}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    viewLayout === 'cards' 
                      ? 'bg-white text-slate-900 shadow-xs font-bold' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Vista de Tarjetas Detalladas"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewLayout('compact')}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    viewLayout === 'compact' 
                      ? 'bg-white text-slate-900 shadow-xs font-bold' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Vista Compacta"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewLayout('table')}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    viewLayout === 'table' 
                      ? 'bg-white text-slate-900 shadow-xs font-bold' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Vista de Tabla / Directorio"
                >
                  <Table className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Filter Drawer Toggle Button */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowAdvancedFilters(prev => !prev)}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                    showAdvancedFilters || activeFiltersCount > 0
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                  <span>Filtros</span>
                  {activeFiltersCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[9px] font-mono font-black flex items-center justify-center">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Expandable Advanced Filters Drawer */}
            {showAdvancedFilters && (
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-3 animate-in fade-in duration-150 text-[11px]">
                
                {/* Gate A Filter */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Elegibilidad (Gate A)
                  </label>
                  <div className="grid grid-cols-2 gap-1">
                    {(['all', 'Aceptación Inmediata', 'Aceptación Condicional', 'Rechazado'] as const).map(st => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setFilterStatusA(st)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-medium transition cursor-pointer text-left truncate ${
                          filterStatusA === st
                            ? 'bg-slate-900 text-white font-bold shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                        }`}
                      >
                        {st === 'all' ? 'Todos los estatus' : st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Interview Status Filter */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Entrevista CSEA (90 min)
                  </label>
                  <div className="grid grid-cols-2 gap-1">
                    {[
                      { id: 'all', label: 'Todas' },
                      { id: 'no_generada', label: 'Sin Iniciar' },
                      { id: 'en_progreso', label: 'En Progreso' },
                      { id: 'completada', label: 'Completada' }
                    ].map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setFilterInterview(item.id as any)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-medium transition cursor-pointer text-left ${
                          filterInterview === item.id
                            ? 'bg-slate-900 text-white font-bold shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Report Status Filter */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Reporte Ejecutivo CSEA
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { id: 'all', label: 'Todos' },
                      { id: 'con_reporte', label: 'Con Reporte' },
                      { id: 'sin_reporte', label: 'Pendiente' }
                    ].map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setFilterReport(item.id as any)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-medium transition cursor-pointer text-center ${
                          filterReport === item.id
                            ? 'bg-slate-900 text-white font-bold shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pre-Assessment B Status Filter */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Pre-Assessment B
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { id: 'all', label: 'Todos' },
                      { id: 'completado', label: 'Listo' },
                      { id: 'pendiente', label: 'Pendiente' }
                    ].map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setFilterPreB(item.id as any)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-medium transition cursor-pointer text-center ${
                          filterPreB === item.id
                            ? 'bg-slate-900 text-white font-bold shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sorting options */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Ordenar por
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="date_desc">Fecha (Más recientes primero)</option>
                    <option value="date_asc">Fecha (Más antiguos primero)</option>
                    <option value="name_asc">Nombre de Empresa (A - Z)</option>
                    <option value="name_desc">Nombre de Empresa (Z - A)</option>
                    <option value="percent_desc">Score Elegibilidad A (Mayor a menor)</option>
                    <option value="percent_asc">Score Elegibilidad A (Menor a mayor)</option>
                    <option value="interview_desc">Mayor avance de entrevista CSEA</option>
                  </select>
                </div>

                {/* Reset Filters */}
                {activeFiltersCount > 0 && (
                  <div className="pt-2 border-t border-slate-200/80 flex justify-between items-center">
                    <span className="text-[10px] text-slate-500 font-medium">
                      {activeFiltersCount} {activeFiltersCount === 1 ? 'filtro activo' : 'filtros activos'}
                    </span>
                    <button
                      type="button"
                      onClick={resetAllFilters}
                      className="text-[10px] font-bold text-amber-700 hover:text-amber-950 underline cursor-pointer"
                    >
                      Limpiar todos los filtros
                    </button>
                  </div>
                )}

              </div>
            )}

            {/* List of Companies with 3 layout view modes */}
            <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
              {filteredApplicants.length === 0 ? (
                <div className="text-center py-10 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                  <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No se encontraron empresas</p>
                  <p className="text-[11px] text-slate-400">
                    {activeFiltersCount > 0
                      ? 'Ninguna empresa coincide con los filtros aplicados.'
                      : 'Aún no hay empresas registradas.'}
                  </p>
                  {activeFiltersCount > 0 && (
                    <button
                      type="button"
                      onClick={resetAllFilters}
                      className="px-3 py-1 bg-white hover:bg-slate-100 text-amber-700 border border-slate-200 text-[11px] font-bold rounded-lg cursor-pointer transition shadow-2xs mt-2"
                    >
                      Limpiar filtros
                    </button>
                  )}
                </div>
              ) : viewLayout === 'cards' ? (
                /* === CARDS VIEW MODE === */
                filteredApplicants.map((a) => {
                  const isSelected = selectedApplicant?.id === a.id;
                  const maturity = calculateMaturity(a);
                  const answeredCount = getAnsweredQuestionsCount(a.interview);
                  
                  return (
                    <div
                      key={a.id}
                      id={`applicant-card-${a.id}`}
                      onClick={() => {
                        setSelectedApplicant(a);
                        setInterviewNotes(a.consultorNotes || '');
                      }}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2.5 relative group ${
                        isSelected 
                          ? 'bg-slate-950 border-slate-900 text-white shadow-md ring-2 ring-amber-500/50' 
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs text-slate-800'
                      }`}
                    >
                      {/* Top Header: Company Name + Gate A Badge + Delete Button */}
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0 pr-1">
                          <h4 className={`font-sans font-extrabold text-xs truncate leading-snug ${
                            isSelected ? 'text-white' : 'text-slate-900'
                          }`}>
                            {a.companyName}
                          </h4>
                          <p className={`text-[10px] truncate mt-0.5 ${
                            isSelected ? 'text-slate-300' : 'text-slate-500'
                          }`}>
                            {a.sponsorName || 'Patrocinador no registrado'}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`text-[8px] px-2 py-0.5 rounded-full font-mono uppercase font-bold tracking-wider ${
                            a.statusA === 'Aceptación Inmediata'
                              ? isSelected ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-green-50 text-green-700 border border-green-200'
                              : a.statusA === 'Aceptación Condicional'
                              ? isSelected ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-amber-50 text-amber-700 border border-amber-200'
                              : isSelected ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {a.statusA}
                          </span>

                          {/* Delete Company Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCompanyToDelete(a);
                            }}
                            className={`p-1 rounded-lg transition-colors cursor-pointer ${
                              isSelected
                                ? 'text-slate-400 hover:text-red-400 hover:bg-red-950/40'
                                : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                            }`}
                            title={`Eliminar ${a.companyName}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Middle: Metrics and info */}
                      <div className={`flex items-center justify-between text-[10px] pt-1 border-t ${
                        isSelected ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'
                      }`}>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold">Score A: {a.percentA}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            maturity.level === 'Alto' 
                              ? 'bg-emerald-500' 
                              : maturity.level === 'Medio' 
                              ? 'bg-amber-500' 
                              : maturity.level === 'Bajo' 
                              ? 'bg-red-500' 
                              : 'bg-slate-400'
                          }`} />
                          <span className="font-bold">Madurez: {maturity.level}</span>
                        </div>
                      </div>

                      {/* Bottom: Workflow Badges */}
                      <div className="flex flex-wrap items-center gap-1 pt-0.5 text-[9px]">
                        {a.hasCompletedB && (
                          <span className={`px-1.5 py-0.5 rounded font-medium ${
                            isSelected ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                          }`}>
                            Pre-B Listo
                          </span>
                        )}
                        {a.scheduledTime && (
                          <span className={`px-1.5 py-0.5 rounded font-medium ${
                            isSelected ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                          }`}>
                            Agendado
                          </span>
                        )}
                        {(() => {
                          const bp = getInterviewBlockProgress(a.interview);
                          const isDone = a.interview?.estado === 'completada' || a.interview?.estado === 'completado' || bp.isAllBlocksComplete;
                          if (isDone) {
                            return (
                              <span className={`px-1.5 py-0.5 rounded font-bold ${
                                isSelected ? 'bg-emerald-500/25 text-emerald-300' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}>
                                Entrevista: 6/6 Bloques
                              </span>
                            );
                          }
                          if (bp.evaluatedQuestions > 0) {
                            return (
                              <span className={`px-1.5 py-0.5 rounded font-medium ${
                                isSelected ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                              }`}>
                                Entrevista: {bp.completedBlocks}/6 ({bp.evaluatedQuestions}/60)
                              </span>
                            );
                          }
                          return null;
                        })()}
                        {a.executiveReport && (
                          <span className={`px-1.5 py-0.5 rounded font-bold ${
                            isSelected ? 'bg-emerald-500/25 text-emerald-300' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            Reporte Listo ({a.executiveReport.globalIndex}/100)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : viewLayout === 'compact' ? (
                /* === COMPACT VIEW MODE === */
                filteredApplicants.map((a) => {
                  const isSelected = selectedApplicant?.id === a.id;
                  const maturity = calculateMaturity(a);
                  return (
                    <div
                      key={a.id}
                      id={`applicant-compact-${a.id}`}
                      onClick={() => {
                        setSelectedApplicant(a);
                        setInterviewNotes(a.consultorNotes || '');
                      }}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-slate-950 border-slate-900 text-white shadow-xs'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${
                            maturity.level === 'Alto' 
                              ? 'bg-emerald-500' 
                              : maturity.level === 'Medio' 
                              ? 'bg-amber-500' 
                              : maturity.level === 'Bajo' 
                              ? 'bg-red-500' 
                              : 'bg-slate-400'
                          }`} />
                          <h4 className="font-extrabold text-xs truncate leading-tight">
                            {a.companyName}
                          </h4>
                        </div>
                        <p className={`text-[10px] truncate ml-4 ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>
                          {a.sponsorName} • Score A: {a.percentA}%
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {a.executiveReport && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                            isSelected ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {a.executiveReport.globalIndex}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCompanyToDelete(a);
                          }}
                          className={`p-1 rounded-md transition cursor-pointer ${
                            isSelected
                              ? 'text-slate-400 hover:text-red-400 hover:bg-red-950/40'
                              : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                          }`}
                          title={`Eliminar ${a.companyName}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                /* === TABLE VIEW MODE === */
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                          <th className="p-2">Empresa</th>
                          <th className="p-2">Gate A</th>
                          <th className="p-2 text-center">Score</th>
                          <th className="p-2 text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredApplicants.map((a) => {
                          const isSelected = selectedApplicant?.id === a.id;
                          return (
                            <tr
                              key={a.id}
                              onClick={() => {
                                setSelectedApplicant(a);
                                setInterviewNotes(a.consultorNotes || '');
                              }}
                              className={`cursor-pointer transition-colors ${
                                isSelected ? 'bg-amber-50/80 font-bold' : 'hover:bg-slate-50'
                              }`}
                            >
                              <td className="p-2 truncate max-w-[120px]">
                                <div className="font-bold text-slate-900 truncate">{a.companyName}</div>
                                <div className="text-[9px] text-slate-500 truncate">{a.sponsorName}</div>
                              </td>
                              <td className="p-2">
                                <span className={`text-[8px] px-1.5 py-0.5 rounded font-mono font-bold ${
                                  a.statusA === 'Aceptación Inmediata'
                                    ? 'bg-green-50 text-green-700'
                                    : a.statusA === 'Aceptación Condicional'
                                    ? 'bg-amber-50 text-amber-700'
                                    : 'bg-red-50 text-red-700'
                                }`}>
                                  {a.statusA === 'Aceptación Inmediata' ? 'Inmediata' : a.statusA === 'Aceptación Condicional' ? 'Condicional' : 'Rechazado'}
                                </span>
                              </td>
                              <td className="p-2 text-center font-mono font-bold text-slate-800">
                                {a.percentA}%
                              </td>
                              <td className="p-2 text-right">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCompanyToDelete(a);
                                  }}
                                  className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                                  title={`Eliminar ${a.companyName}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Right column: Selected Applicant Detailed View */}
        <div className="lg:col-span-8">
          {!selectedApplicant ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center text-slate-400 space-y-3 flex flex-col items-center justify-center min-h-[480px]">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <Building2 className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="font-sans font-bold text-slate-800 text-sm">Ninguna empresa seleccionada</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Seleccione una organización de la lista de la izquierda para examinar su elegibilidad, generar el Pre-Brief con IA, registrar la entrevista de 90 minutos y emitir el reporte ejecutivo.
              </p>
              <button
                type="button"
                onClick={() => setShowAddCompanyModal(true)}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs mt-2"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Nueva Empresa</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Applicant Profile Bar */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="font-sans text-xl font-black text-slate-900">
                        {selectedApplicant.companyName}
                      </h2>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono uppercase font-bold tracking-wider ${
                        selectedApplicant.statusA === 'Aceptación Inmediata'
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : selectedApplicant.statusA === 'Aceptación Condicional'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {selectedApplicant.statusA}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span>Patrocinador: <strong className="text-slate-800 font-semibold">{selectedApplicant.sponsorName || 'No especificado'}</strong></span>
                      <span>•</span>
                      <span>Correo: <strong className="text-slate-800 font-semibold">{selectedApplicant.email}</strong></span>
                      {selectedApplicant.phone && (
                        <>
                          <span>•</span>
                          <span>Tel: <strong className="text-slate-800 font-semibold">{selectedApplicant.phone}</strong></span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Registro</span>
                      <span className="text-xs font-mono text-slate-800 font-bold block">
                        {new Date(selectedApplicant.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {/* Delete Current Applicant Button */}
                    <button
                      type="button"
                      onClick={() => setCompanyToDelete(selectedApplicant)}
                      className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="Eliminar esta empresa permanentemente"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>

                {/* Score Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                    <span className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Elegibilidad A</span>
                    <span className="text-lg font-black text-slate-900 block">{selectedApplicant.percentA}%</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                    <span className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Gate Status</span>
                    <span className={`text-xs font-bold block mt-1 ${
                      selectedApplicant.statusA === 'Aceptación Inmediata' ? 'text-green-600' : 'text-amber-500'
                    }`}>{selectedApplicant.statusA}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                    <span className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Pre-Assessment B</span>
                    <span className="text-sm font-black text-slate-800 block mt-1">
                      {selectedApplicant.hasCompletedB ? 'Completado' : 'Pendiente'}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                    <span className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Sesión 90 min</span>
                    <span className="text-xs font-bold text-slate-800 block truncate mt-1" title={selectedApplicant.scheduledTime || 'Sin agendar'}>
                      {selectedApplicant.scheduledTime ? 'Agendado' : 'Sin Agendar'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs Header */}
              <div className="flex border-b border-slate-200 bg-white rounded-xl shadow-sm overflow-x-auto p-1.5 gap-1">
                <button
                  id="tab-brief-btn"
                  onClick={() => setActiveTab('brief')}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === 'brief'
                      ? 'bg-slate-950 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Brain className="w-4 h-4 text-amber-400" />
                  <span>1. Pre-Assessment Brief</span>
                  {selectedApplicant.preBrief && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  )}
                </button>

                <button
                  id="tab-interview-btn"
                  onClick={() => setActiveTab('interview')}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === 'interview'
                      ? 'bg-slate-950 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <MessageSquareText className="w-4 h-4 text-amber-400" />
                  <span>2. Entrevista CSEA (90 min)</span>
                  {(() => {
                    const blockProgress = getInterviewBlockProgress(selectedApplicant.interview);
                    const isDone = selectedApplicant.interview?.estado === 'completada' || selectedApplicant.interview?.estado === 'completado' || blockProgress.isAllBlocksComplete;
                    if (isDone) {
                      return <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[9px] rounded font-mono font-semibold">Completada (6/6)</span>;
                    }
                    if (blockProgress.evaluatedQuestions > 0) {
                      return (
                        <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[9px] rounded font-mono font-semibold">
                          {blockProgress.completedBlocks}/6 Bloques ({blockProgress.evaluatedQuestions}/60)
                        </span>
                      );
                    }
                    return null;
                  })()}
                </button>

                <button
                  id="tab-report-btn"
                  onClick={() => setActiveTab('report')}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === 'report'
                      ? 'bg-slate-950 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>3. Reporte Ejecutivo CSEA</span>
                  {selectedApplicant.executiveReport ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-400" title="Reporte Generado"></span>
                  ) : (() => {
                    const bp = getInterviewBlockProgress(selectedApplicant.interview);
                    return bp.isAllBlocksComplete || selectedApplicant.interview?.estado === 'completada' || selectedApplicant.interview?.estado === 'completado' ? (
                      <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 text-[8px] font-mono rounded font-bold">Listo</span>
                    ) : null;
                  })()}
                </button>

                {selectedApplicant.executiveReport && (
                  <button
                    id="tab-report-view-btn"
                    onClick={() => setActiveTab('reportView')}
                    className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                      activeTab === 'reportView'
                        ? 'bg-slate-950 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>4. Visualización del Reporte</span>
                  </button>
                )}
              </div>

              {/* TAB 1: PRE-ASSESSMENT BRIEF */}
              {activeTab === 'brief' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-amber-500" />
                      <h3 className="font-sans font-bold text-slate-900 text-sm">
                        Pre-Assessment Brief de IA (Uso Interno)
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        id="menu-1-proceso-inicial-btn-tab1"
                        type="button"
                        onClick={() => setActiveMainModule('modulo1')}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                        title="Ir a Menú 1: Proceso Inicial"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Menú 1: Proceso Inicial</span>
                      </button>
                      {selectedApplicant.preBrief ? (
                      <button
                        id="download-prebrief-pdf-btn"
                        onClick={downloadPreBriefPDF}
                        className="px-3 py-1.5 bg-amber-500 text-slate-950 hover:bg-amber-400 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Descargar PDF</span>
                      </button>
                    ) : (
                      <button
                        id="generate-brief-btn"
                        onClick={() => handleGenerateBrief(selectedApplicant.id)}
                        disabled={generatingBrief || !selectedApplicant.hasCompletedB}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs ${
                          selectedApplicant.hasCompletedB
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer'
                            : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed opacity-60'
                        }`}
                        title={selectedApplicant.hasCompletedB 
                          ? "Generar análisis de Pre-Assessment Brief con IA" 
                          : "Requiere completar el formulario de Pre-Brief (Bloque B) en Menú 1"}
                      >
                        <Brain className={`w-3.5 h-3.5 ${selectedApplicant.hasCompletedB ? 'text-slate-950' : 'text-slate-400'}`} />
                        <span>{generatingBrief ? 'Generando...' : selectedApplicant.hasCompletedB ? 'Analizar con IA' : 'Formulario B Pendiente'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {!selectedApplicant.preBrief ? (
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center space-y-3">
                      {selectedApplicant.hasCompletedB ? (
                        <>
                          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-slate-800">
                              Formulario B (Pre-Brief) Completado
                            </h4>
                            <p className="text-xs text-slate-500 max-w-md mx-auto">
                              Las respuestas del Bloque B están listas. Puede ejecutar el análisis de IA para generar los riesgos iniciales, hipótesis causales y guía de preguntas recomendadas para la entrevista.
                            </p>
                          </div>
                          <button
                            id="generate-brief-btn-mid"
                            onClick={() => handleGenerateBrief(selectedApplicant.id)}
                            disabled={generatingBrief}
                            className="px-5 py-2.5 bg-amber-500 text-slate-950 hover:bg-amber-400 text-xs font-black rounded-lg transition-all inline-flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
                          >
                            <Brain className="w-4 h-4" />
                            <span>{generatingBrief ? 'Generando Brief...' : 'Generar Pre-Brief de IA'}</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                            <AlertTriangle className="w-5 h-5" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-slate-800">
                              Formulario B (Pre-Brief) Requerido
                            </h4>
                            <p className="text-xs text-slate-500 max-w-md mx-auto">
                              Para habilitar el botón y generar el Pre-Assessment Brief con IA, complete primero el formulario de 10 preguntas del Bloque B en el <strong>Menú 1: Proceso Inicial</strong>.
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setActiveMainModule('modulo1')}
                              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold rounded-lg transition-all inline-flex items-center gap-2 cursor-pointer shadow-sm"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Ir a Completar Formulario B (Menú 1)</span>
                            </button>
                            <button
                              id="generate-brief-btn-mid"
                              disabled
                              className="px-4 py-2 bg-slate-200 text-slate-400 text-xs font-bold rounded-lg transition-all inline-flex items-center gap-2 cursor-not-allowed opacity-50"
                              title="Requiere completar el formulario de Pre-Brief (Bloque B)"
                            >
                              <Brain className="w-4 h-4" />
                              <span>Generar Pre-Brief de IA (Bloqueado)</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4 text-xs">
                      <div className="grid sm:grid-cols-3 gap-3">
                        <div className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-lg">
                          <span className="font-bold text-[9px] uppercase font-mono text-slate-400 block">Nivel de Urgencia</span>
                          <span className={`text-sm font-black ${
                            selectedApplicant.preBrief.urgency === 'Alta' ? 'text-red-500' : 'text-amber-500'
                          }`}>{selectedApplicant.preBrief.urgency}</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-150 p-3 rounded-lg">
                          <span className="font-bold text-[9px] uppercase font-mono text-slate-400 block">Probabilidad Conversión</span>
                          <span className="text-sm font-black text-slate-800">{selectedApplicant.preBrief.conversionProb}</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-150 p-3 rounded-lg">
                          <span className="font-bold text-[9px] uppercase font-mono text-slate-400 block">Fecha Análisis</span>
                          <span className="text-sm font-black text-slate-800">
                            {new Date(selectedApplicant.preBrief.generatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="font-bold text-slate-800 block">Hipótesis Causal:</span>
                        <p className="p-3 bg-slate-50 border border-slate-150 rounded-lg text-slate-600 leading-relaxed">
                          {selectedApplicant.preBrief.hypotheses}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <span className="font-bold text-slate-800 block">Principales Riesgos Identificados:</span>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {selectedApplicant.preBrief.risks.map((risk, idx) => (
                            <div key={idx} className="p-2.5 bg-red-50/50 border border-red-100 rounded-lg flex items-start gap-2 text-red-900">
                              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                              <span>{risk}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="font-bold text-slate-800 block">Guía de Preguntas Recomendadas para la Entrevista (90 min):</span>
                        <div className="space-y-1.5">
                          {selectedApplicant.preBrief.questions.map((q, idx) => (
                            <div key={idx} className="p-2.5 bg-amber-50/50 border border-amber-100 rounded-lg flex items-start gap-2 text-amber-950">
                              <HelpCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                              <span>{q}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {selectedApplicant.preBrief.comments && (
                        <div className="space-y-1">
                          <span className="font-bold text-slate-400 block text-[9px] uppercase font-mono">Comentarios Internos del Consultor:</span>
                          <p className="text-slate-500 text-xs italic">
                            "{selectedApplicant.preBrief.comments}"
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: ENTREVISTA CSEA (90 MIN) */}
              {activeTab === 'interview' && (
                <div className="space-y-6">
                  
                  {/* Read-Only Pre-Assessment Brief Context Header */}
                  {selectedApplicant.preBrief && (
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-amber-700 uppercase tracking-widest flex items-center gap-1.5">
                          <Brain className="w-3.5 h-3.5 text-amber-500" />
                          Contexto de Pre-Assessment (Brief de Referencia)
                        </span>
                        <div className="flex items-center gap-3">
                          <button
                            id="menu-1-proceso-inicial-btn-brief"
                            type="button"
                            onClick={() => setActiveMainModule('modulo1')}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                            title="Ir a Menú 1: Proceso Inicial"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Menú 1: Proceso Inicial</span>
                          </button>
                          <span className="text-xs font-extrabold text-slate-700">
                            Urgencia: <strong className={selectedApplicant.preBrief.urgency === 'Alta' ? 'text-red-600' : 'text-amber-600'}>{selectedApplicant.preBrief.urgency}</strong>
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed bg-white/70 p-2.5 rounded-lg border border-amber-500/10">
                        <strong>Hipótesis Causal:</strong> {selectedApplicant.preBrief.hypotheses}
                      </p>
                      {selectedApplicant.preBrief.risks?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 text-[10px]">
                          <span className="font-bold text-slate-500">Riesgos clave:</span>
                          {selectedApplicant.preBrief.risks.map((r, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-red-100/80 text-red-800 rounded font-medium">
                              {r}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Interview Status Control Card */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <MessageSquareText className="w-5 h-5 text-amber-500" />
                          <h3 className="font-sans font-black text-slate-900 text-sm">
                            Guía y Captura de Entrevista CSEA (90 min)
                          </h3>
                          <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-extrabold ${
                            selectedApplicant.interview?.estado === 'completada'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : selectedApplicant.interview?.estado === 'generada' || selectedApplicant.interview?.estado === 'en_progreso'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {selectedApplicant.interview?.estado === 'completada' && 'Entrevista Completada'}
                            {selectedApplicant.interview?.estado === 'en_progreso' && 'En Progreso'}
                            {selectedApplicant.interview?.estado === 'generada' && 'Preguntas Generadas'}
                            {(!selectedApplicant.interview || selectedApplicant.interview?.estado === 'no_generada') && 'Sin Generar'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Formule las preguntas personalizadas en vivo y capture las respuestas del prospecto para nutrir el Reporte Ejecutivo.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          id="menu-1-proceso-inicial-btn-interview-toolbar"
                          type="button"
                          onClick={() => setActiveMainModule('modulo1')}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                          title="Ir a Menú 1: Proceso Inicial"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Menú 1: Proceso Inicial</span>
                        </button>
                        {(!selectedApplicant.interview || selectedApplicant.interview.estado === 'no_generada') ? (
                          <button
                            id="generate-interview-btn-main"
                            onClick={() => handleGenerateInterview(selectedApplicant.id)}
                            disabled={generatingInterview}
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition shadow-sm flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                          >
                            <Sparkles className="w-4 h-4" />
                            <span>{generatingInterview ? 'Cargando matriz...' : 'Cargar Preguntas de Entrevista'}</span>
                          </button>
                        ) : (
                          <>
                            <button
                              id="regenerate-interview-btn"
                              onClick={() => handleGenerateInterview(selectedApplicant.id)}
                              disabled={generatingInterview}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                              title="Regenerar preguntas de entrevista con Gemini 3.6 Flash"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>{generatingInterview ? 'Generando...' : 'Regenerar'}</span>
                            </button>

                            <button
                              id="save-interview-progress-btn"
                              onClick={() => selectedApplicant.interview && handleSaveInterviewData(selectedApplicant.interview, false)}
                              disabled={savingInterview}
                              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                            >
                              <Save className="w-3.5 h-3.5 text-amber-400" />
                              <span>{savingInterview ? 'Guardando...' : 'Guardar Avance'}</span>
                            </button>

                            {selectedApplicant.interview.estado !== 'completada' && selectedApplicant.interview.estado !== 'completado' && (
                              <button
                                id="complete-interview-btn"
                                onClick={handleCompleteAndLockInterview}
                                disabled={savingInterview}
                                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                              >
                                <CheckSquare className="w-3.5 h-3.5" />
                                <span>Marcar como Completada (Validar 6 Bloques)</span>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Persistent Sticky 6-Block Progress & Validation Status Bar */}
                    {selectedApplicant.interview && selectedApplicant.interview.bloques?.length > 0 && (() => {
                      const blockProgress = getInterviewBlockProgress(selectedApplicant.interview);
                      const isComplete = blockProgress.isAllBlocksComplete || selectedApplicant.interview.estado === 'completada' || selectedApplicant.interview.estado === 'completado';
                      
                      return (
                        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md rounded-xl shadow-md border-2 border-slate-200/80 p-3.5 space-y-2 transition-all">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-slate-900 flex items-center gap-1.5">
                                <ListChecks className="w-4 h-4 text-amber-500" />
                                <span>Progreso CSEA (6 Bloques):</span>
                              </span>
                              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold inline-flex items-center gap-1 ${
                                isComplete 
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                                  : 'bg-amber-100 text-amber-800 border border-amber-300'
                              }`}>
                                {isComplete ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>6/6 Bloques Finalizados · Entrevista Completada</span>
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                                    <span>{blockProgress.completedBlocks} de 6 Bloques Finalizados</span>
                                  </>
                                )}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-700 text-xs">
                                {blockProgress.evaluatedQuestions} de {blockProgress.totalQuestions} reactivos ({Math.round((blockProgress.evaluatedQuestions / (blockProgress.totalQuestions || 1)) * 100)}%)
                              </span>
                              {!isComplete && (
                                <button
                                  type="button"
                                  onClick={handleCompleteAndLockInterview}
                                  disabled={savingInterview}
                                  className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold transition shadow-xs cursor-pointer inline-flex items-center gap-1"
                                  title="Validar y completar los 6 bloques ahora"
                                >
                                  <CheckSquare className="w-3 h-3" />
                                  <span>Finalizar Todos</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Visual Grid: Distinct Indicator for Finalized vs In-Progress Blocks */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                            {blockProgress.blockStatuses.map((bs, bIdx) => {
                              const shortName = bs.nombreBloque.replace(/^\d+\.\s*/, '');
                              const isBlockDone = bs.isComplete || isComplete;
                              return (
                                <div 
                                  key={bs.idBloque} 
                                  className={`p-2 rounded-lg border text-center transition-all flex flex-col justify-between ${
                                    isBlockDone
                                      ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 ring-1 ring-emerald-400/30 shadow-xs'
                                      : 'bg-amber-50/60 border-amber-200 text-amber-950'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-1 mb-1">
                                    <span className="text-[9px] font-mono font-bold text-slate-500">B{bIdx + 1}</span>
                                    {isBlockDone ? (
                                      <span className="inline-flex items-center gap-0.5 px-1 py-0.2 bg-emerald-600 text-white rounded text-[8px] font-black uppercase tracking-wider">
                                        ✓ Hecho
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-0.5 px-1 py-0.2 bg-amber-200 text-amber-800 rounded text-[8px] font-bold">
                                        Pendiente
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] font-extrabold truncate text-left" title={shortName}>{shortName}</div>
                                  <div className={`text-[10px] font-mono font-bold mt-1 text-right ${isBlockDone ? 'text-emerald-700' : 'text-amber-700'}`}>
                                    {isBlockDone ? '10/10' : `${bs.evaluatedQuestions}/${bs.totalQuestions}`}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Progress bar */}
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <div
                              className={`h-2.5 rounded-full transition-all duration-300 ${isComplete ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-amber-600'}`}
                              style={{
                                width: `${isComplete ? 100 : Math.min(100, Math.round((blockProgress.evaluatedQuestions / (blockProgress.totalQuestions || 1)) * 100))}%`
                              }}
                            />
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Interview Content / Blocks Accordion */}
                  {(!selectedApplicant.interview || selectedApplicant.interview.bloques?.length === 0) ? (
                    <div className="bg-white rounded-xl border border-slate-200 p-10 text-center space-y-3">
                      <ListChecks className="w-12 h-12 text-slate-300 mx-auto" />
                      <h4 className="font-sans font-bold text-slate-800 text-sm">Aún no se han cargado las preguntas de entrevista</h4>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        Haga clic en el botón a continuación para inicializar la matriz estructurada oficial de 60 reactivos CSEA v4.0 y comenzar la evaluación ejecutiva.
                      </p>
                      <button
                        id="generate-interview-btn-empty"
                        onClick={() => handleGenerateInterview(selectedApplicant.id)}
                        disabled={generatingInterview}
                        className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-lg transition inline-flex items-center gap-2 cursor-pointer shadow-sm"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>{generatingInterview ? 'Cargando matriz...' : 'Cargar Matriz de 60 Reactivos Ahora'}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedApplicant.interview.bloques.map((block, bIdx) => {
                        const isOpen = openBlocks[block.idBloque] ?? true;
                        const blockAnsweredCount = block.preguntas.filter(q => isQuestionFullyAnswered(q)).length;
                        const blockTotalCount = block.preguntas.length;

                        return (
                          <div key={block.idBloque || bIdx} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            
                            {/* Accordion Header */}
                            <div
                              role="button"
                              tabIndex={0}
                              onClick={() => toggleBlockAccordion(block.idBloque)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  toggleBlockAccordion(block.idBloque);
                                }
                              }}
                              className="w-full px-5 py-3.5 bg-slate-50 hover:bg-slate-100/80 border-b border-slate-200 flex items-center justify-between text-left transition cursor-pointer select-none"
                            >
                              <div className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-full bg-slate-950 text-amber-400 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                                  {bIdx + 1}
                                </span>
                                <div>
                                  <h4 className="font-sans font-black text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                                    <span>{block.nombreBloque}</span>
                                    {block.peso && (
                                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-700 border border-amber-500/20 rounded font-mono text-[10px] font-bold">
                                        Peso CSEA: {block.peso}%
                                      </span>
                                    )}
                                  </h4>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                {blockAnsweredCount < blockTotalCount && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCompleteSingleBlock(block.idBloque);
                                    }}
                                    className="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded text-[9px] font-bold transition cursor-pointer"
                                    title="Calificar preguntas faltantes de este bloque con datos estándar de acreditación"
                                  >
                                    Completar Bloque
                                  </button>
                                )}
                                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                                  blockAnsweredCount === blockTotalCount && blockTotalCount > 0
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : blockAnsweredCount > 0
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-200 text-slate-600'
                                }`}>
                                  {blockAnsweredCount}/{blockTotalCount} completos
                                </span>
                                {isOpen ? (
                                  <ChevronUp className="w-4 h-4 text-slate-500" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-slate-500" />
                                )}
                              </div>
                            </div>

                            {/* Accordion Content */}
                            {isOpen && (
                              <div className="p-5 space-y-6 divide-y divide-slate-100">
                                {block.preguntas.map((q, qIdx) => {
                                  const currentScore = q.score || 0;
                                  const { missingScore, missingRespuesta, missingNotas, respuestaLen, notasLen } = getQuestionMissingDetails(q);
                                  const isComplete = isQuestionFullyAnswered(q);

                                  return (
                                    <div 
                                      key={q.idPregunta || qIdx} 
                                      id={`question-${q.idPregunta}`}
                                      className={`${qIdx > 0 ? 'pt-5' : ''} space-y-3 transition-all duration-300 rounded-xl ${
                                        highlightedQuestionId === q.idPregunta
                                          ? 'ring-4 ring-amber-400 bg-amber-50/90 p-4 shadow-md'
                                          : !isComplete && currentScore > 0
                                          ? 'bg-amber-50/20 p-3 border border-amber-200/60 rounded-xl'
                                          : ''
                                      }`}
                                    >
                                      
                                      {/* Question Badges & Header */}
                                      <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                          {q.codigo && (
                                            <span className="px-2 py-0.5 bg-slate-900 text-amber-400 font-mono text-[10px] font-black rounded">
                                              {q.codigo}
                                            </span>
                                          )}
                                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                            q.tipo === 'P' 
                                              ? 'bg-amber-500/10 text-amber-800 border border-amber-500/20' 
                                              : 'bg-slate-100 text-slate-600'
                                          }`}>
                                            {q.tipo === 'P' ? 'Pregunta Principal' : 'Verificación Operacional'}
                                          </span>
                                        </div>

                                        <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 cursor-pointer select-none">
                                          <input
                                            type="checkbox"
                                            checked={isComplete}
                                            onChange={() => handleToggleQuestionAnswered(block.idBloque, q.idPregunta)}
                                            className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                                          />
                                          <span className={isComplete ? 'text-emerald-700 font-black flex items-center gap-1' : 'text-slate-500'}>
                                            {isComplete && <Check className="w-3 h-3 text-emerald-600" />}
                                            <span>{isComplete ? 'Validado y Completo' : 'Pendiente'}</span>
                                          </span>
                                        </label>
                                      </div>

                                      {/* Question Text */}
                                      <p className="text-xs font-black text-slate-900 leading-relaxed">
                                        {q.texto}
                                      </p>

                                      {/* Signals guide (S1, S3, S5) callout */}
                                      {q.senales && (
                                        <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 text-[10px] space-y-1">
                                          <span className="font-mono font-bold text-slate-500 block uppercase text-[9px]">Criterios de Madurez (Guía):</span>
                                          <div className="grid sm:grid-cols-3 gap-2">
                                            <div className="p-1.5 bg-red-500/5 border border-red-500/10 rounded">
                                              <strong className="text-red-700 block text-[9px]">S1 (Incipiente 1-2):</strong>
                                              <span className="text-slate-600">{q.senales.s1}</span>
                                            </div>
                                            <div className="p-1.5 bg-amber-500/5 border border-amber-500/10 rounded">
                                              <strong className="text-amber-700 block text-[9px]">S3 (Parcial 3):</strong>
                                              <span className="text-slate-600">{q.senales.s3}</span>
                                            </div>
                                            <div className="p-1.5 bg-emerald-500/5 border border-emerald-500/10 rounded">
                                              <strong className="text-emerald-700 block text-[9px]">S5 (Sólido 4-5):</strong>
                                              <span className="text-slate-600">{q.senales.s5}</span>
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {/* 1-5 Score Selector */}
                                      <div className="space-y-1">
                                        <div className="flex justify-between items-center text-[10px]">
                                          <span className="font-bold text-slate-700 flex items-center gap-1">
                                            <span>Calificación de Madurez (1 a 5):</span>
                                            <span className="text-red-500 font-bold">*</span>
                                          </span>
                                          <span className="font-mono font-bold text-amber-600">
                                            {currentScore > 0 ? `Nivel Evaluado: ${currentScore}/5` : 'Pendiente de calificar'}
                                          </span>
                                        </div>
                                        <div className="grid grid-cols-5 gap-1.5">
                                          {[1, 2, 3, 4, 5].map((lvl) => {
                                            const isSelected = currentScore === lvl;
                                            return (
                                              <button
                                                key={lvl}
                                                type="button"
                                                onClick={() => handleUpdateQuestionScore(block.idBloque, q.idPregunta, lvl)}
                                                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all border text-center cursor-pointer ${
                                                  isSelected
                                                    ? lvl <= 2 
                                                      ? 'bg-red-500 text-white border-red-600 shadow-sm'
                                                      : lvl === 3
                                                      ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm font-black'
                                                      : 'bg-emerald-600 text-white border-emerald-700 shadow-sm font-black'
                                                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                                }`}
                                              >
                                                {lvl} {lvl === 1 ? 'Malo' : lvl === 3 ? 'Parcial' : lvl === 5 ? 'Excelente' : ''}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </div>

                                      {/* Respuesta & Evidencias Input (Obligatorio · mín. 15 car.) */}
                                      <div className="space-y-1.5">
                                        <div className="flex flex-wrap items-center justify-between gap-1">
                                          <label className="text-[10px] font-bold text-slate-700 flex items-center gap-1.5">
                                            <span>Respuesta del cliente y evidencias recopiladas</span>
                                            <span className="text-red-500 font-bold">*</span>
                                            <span className="text-[9px] font-normal text-slate-400">(Obligatorio · mín. 15 caracteres)</span>
                                          </label>
                                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded flex items-center gap-1 ${
                                            respuestaLen >= 15
                                              ? 'text-emerald-700 bg-emerald-50 border border-emerald-200 font-bold'
                                              : respuestaLen > 0
                                              ? 'text-amber-700 bg-amber-50 border border-amber-200 font-medium'
                                              : 'text-slate-400 bg-slate-100 border border-slate-200'
                                          }`}>
                                            {respuestaLen >= 15 ? <Check className="w-3 h-3 text-emerald-600" /> : null}
                                            <span>{respuestaLen}/15 car.</span>
                                          </span>
                                        </div>
                                        <textarea
                                          rows={2}
                                          placeholder="Anotar detalles expresados por la empresa durante los 90 min (mínimo 15 caracteres)..."
                                          value={q.respuesta || ''}
                                          onChange={(e) => handleUpdateQuestionAnswer(block.idBloque, q.idPregunta, e.target.value)}
                                          className={`w-full p-2.5 text-xs rounded-lg focus:outline-none transition-colors text-slate-800 placeholder-slate-400 ${
                                            missingRespuesta && (currentScore > 0 || respuestaLen > 0)
                                              ? 'bg-amber-50/40 border border-amber-300 focus:ring-2 focus:ring-amber-500'
                                              : 'bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-amber-500'
                                          }`}
                                        />
                                      </div>

                                      {/* Notas y Observaciones del Consultor (Obligatorio · mín. 15 car.) */}
                                      <div className="space-y-1.5">
                                        <div className="flex flex-wrap items-center justify-between gap-1">
                                          <label className="text-[10px] font-bold text-slate-700 flex items-center gap-1.5">
                                            <span>Notas y observaciones del consultor</span>
                                            <span className="text-red-500 font-bold">*</span>
                                            <span className="text-[9px] font-normal text-slate-400">(Obligatorio · mín. 15 caracteres)</span>
                                          </label>
                                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded flex items-center gap-1 ${
                                            notasLen >= 15
                                              ? 'text-emerald-700 bg-emerald-50 border border-emerald-200 font-bold'
                                              : notasLen > 0
                                              ? 'text-amber-700 bg-amber-50 border border-amber-200 font-medium'
                                              : 'text-slate-400 bg-slate-100 border border-slate-200'
                                          }`}>
                                            {notasLen >= 15 ? <Check className="w-3 h-3 text-emerald-600" /> : null}
                                            <span>{notasLen}/15 car.</span>
                                          </span>
                                        </div>
                                        <textarea
                                          rows={2}
                                          placeholder="Observación técnica interna, incoherencias o comentarios estratégicos (mínimo 15 caracteres)..."
                                          value={q.notas || ''}
                                          onChange={(e) => handleUpdateQuestionNotes(block.idBloque, q.idPregunta, e.target.value)}
                                          className={`w-full p-2.5 text-xs rounded-lg focus:outline-none transition-colors text-slate-800 placeholder-slate-400 ${
                                            missingNotas && (currentScore > 0 || notasLen > 0)
                                              ? 'bg-amber-50/40 border border-amber-300 focus:ring-2 focus:ring-amber-500'
                                              : 'bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-amber-500'
                                          }`}
                                        />
                                      </div>

                                    </div>
                                  );
                                })}
                              </div>
                            )}

                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* General Bitácora & Notes section below */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-amber-500" />
                        <h4 className="font-sans font-bold text-slate-900 text-xs">
                          Notas Generales y Bitácora Complementaria
                        </h4>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Se guardan automáticamente al presionar &quot;Guardar Avance&quot;</span>
                      </span>
                    </div>

                    <textarea
                      rows={3}
                      placeholder="Anote aquí cualquier hallazgo contextual general o anécdotas adicionales recopiladas..."
                      value={interviewNotes}
                      onChange={(e) => {
                        const val = e.target.value;
                        setInterviewNotes(val);
                        if (selectedApplicant) {
                          const updated = { ...selectedApplicant, consultorNotes: val };
                          setSelectedApplicant(updated);
                          onUpdateApplicant(updated);
                        }
                      }}
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 placeholder-slate-400"
                    />
                  </div>

                  {/* Direct Next Step Action to Executive Report */}
                  {selectedApplicant.interview && selectedApplicant.interview.bloques?.length > 0 && (
                    <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-white rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-amber-500/30 shadow-md">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Brain className="w-5 h-5 text-amber-400" />
                          <h4 className="font-sans font-bold text-sm text-white">
                            Generar Diagnóstico y Reporte Ejecutivo CSEA
                          </h4>
                        </div>
                        <p className="text-xs text-slate-300">
                          {(() => {
                            const sc = getScoredQuestionsCount(selectedApplicant.interview);
                            const ac = getAnsweredQuestionsCount(selectedApplicant.interview);
                            const tc = getTotalQuestionsCount(selectedApplicant.interview) || 60;
                            const eff = Math.max(sc, ac);
                            const ready = eff > 0 || selectedApplicant.interview?.estado === 'completada';
                            return (
                              <>
                                Reactivos evaluados: <strong>{eff} de {tc}</strong>. {ready ? 'La información está lista para procesar el diagnóstico CSEA.' : 'Capture o califique los reactivos para habilitar el reporte.'}
                              </>
                            );
                          })()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                        {selectedApplicant.interview.estado !== 'completada' && selectedApplicant.interview.estado !== 'completado' && (
                          <button
                            type="button"
                            onClick={handleCompleteAndLockInterview}
                            disabled={savingInterview}
                            className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <CheckSquare className="w-4 h-4" />
                            <span>Marcar como Completada</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setActiveTab('report')}
                          className="w-full sm:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-lg transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>Ir al Reporte Ejecutivo</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* TAB 3: REPORTE EJECUTIVO CSEA */}
              {activeTab === 'report' && (() => {
                const blockProgress = getInterviewBlockProgress(selectedApplicant.interview);
                const { isAllBlocksComplete, completedBlocks, totalBlocks, evaluatedQuestions, totalQuestions, isFullyReady, blockStatuses } = blockProgress;
                const isInterviewCompleted = (selectedApplicant.interview?.estado === 'completada' || selectedApplicant.interview?.estado === 'completado') && isAllBlocksComplete && evaluatedQuestions >= 60;
                const canGenerate = isAllBlocksComplete && evaluatedQuestions >= 60;

                return (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-amber-500" />
                        <div>
                          <h3 className="font-sans font-bold text-slate-900 text-sm">
                            Reporte Ejecutivo Final y Plan 90 Días
                          </h3>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Reactivos evaluados en entrevista: <strong>{evaluatedQuestions} de {totalQuestions}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Indicador de Motor Activo: Google Gemini API Gratuita */}
                        <div className="flex items-center gap-1.5 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 text-xs">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                          <span className="font-bold text-[11px] text-indigo-950">
                            Google Gemini 3.8 Flash
                          </span>
                          <span className="text-[9px] px-1 py-0.2 bg-indigo-200 text-indigo-800 rounded font-mono font-bold">
                            Gratuito
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowGeminiKeyModal(true)}
                            className="ml-1 text-[10px] text-indigo-600 hover:text-indigo-900 underline font-semibold flex items-center gap-0.5 cursor-pointer"
                            title="Configurar o actualizar API Key de Google Gemini"
                          >
                            <Key className="w-2.5 h-2.5" />
                            <span>{hasServerGeminiKey ? 'Clave' : 'Ingresar Clave'}</span>
                          </button>
                        </div>

                        {canGenerate ? (
                          <button
                            id="generate-report-btn"
                            onClick={() => handleGenerateReport(selectedApplicant.id)}
                            disabled={generatingReport}
                            className="px-4 py-1.5 bg-amber-500 text-slate-950 hover:bg-amber-400 text-xs font-black rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
                          >
                            <Brain className="w-3.5 h-3.5" />
                            <span>
                              {generatingReport 
                                ? 'Generando con Gemini...' 
                                : `Generar con Google Gemini (${isInterviewCompleted ? '6/6 Bloques' : `${completedBlocks}/6 Bloques`})`}
                            </span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleCompleteAndLockInterview}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <CheckSquare className="w-3.5 h-3.5" />
                            <span>Validar y Completar 6 Bloques</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Dedicated 6-Block Interview Validation Summary Widget */}
                    {isInterviewCompleted ? (
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            <div>
                              <h4 className="font-sans font-bold text-slate-900 text-xs sm:text-sm">
                                Validación de Entrevista Aprobada (6 de 6 Bloques Completados)
                              </h4>
                              <p className="text-[11px] text-slate-600">
                                Los 6 bloques metodológicos oficiales CSEA v4.0 y sus 60 reactivos se encuentran evaluados. Estado: <strong className="text-emerald-700 uppercase">Completada</strong>.
                              </p>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 bg-emerald-600 text-white font-mono font-bold text-[10px] rounded-lg shrink-0 self-start sm:self-auto">
                            6/6 Bloques · 100% Listo
                          </span>
                        </div>

                        {/* Mini grid of 6 blocks */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5 pt-1 border-t border-emerald-500/20 text-[10px]">
                          {blockStatuses.map((b, idx) => (
                            <div key={b.idBloque} className="p-1.5 bg-white/80 rounded border border-emerald-500/20 flex flex-col items-center text-center">
                              <span className="font-mono font-bold text-slate-500 text-[9px]">Bloque {idx + 1}</span>
                              <span className="font-bold text-emerald-800 truncate w-full">{b.nombreBloque.replace(/^\d+\.\s*/, '')}</span>
                              <span className="text-[9px] font-mono text-emerald-600 font-bold">✓ {b.evaluatedQuestions}/{b.totalQuestions}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                            <div>
                              <h4 className="font-sans font-bold text-slate-900 text-xs sm:text-sm">
                                Validación de Bloques: {completedBlocks} de 6 bloques completados ({evaluatedQuestions} de {totalQuestions} reactivos)
                              </h4>
                              <p className="text-[11px] text-slate-600">
                                Para garantizar la integridad metodológica CSEA v4.0 y evitar sesgos, valide los 6 bloques de preguntas antes de generar el diagnóstico ejecutivo.
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleCompleteAndLockInterview}
                            disabled={savingInterview}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                            title="Evalúa los reactivos pendientes con Nivel 3 Estándar y propaga el estado Completada"
                          >
                            <CheckSquare className="w-4 h-4" />
                            <span>Validar y Finalizar los 6 Bloques Ahora</span>
                          </button>
                        </div>

                        {/* Mini grid of 6 blocks showing which ones are complete vs pending */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5 pt-1 border-t border-amber-500/20 text-[10px]">
                          {blockStatuses.map((b, idx) => (
                            <div key={b.idBloque} className={`p-1.5 rounded border flex flex-col items-center text-center ${
                              b.isComplete ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' : 'bg-amber-50/80 border-amber-200 text-amber-900'
                            }`}>
                              <span className="font-mono font-bold text-slate-500 text-[9px]">Bloque {idx + 1}</span>
                              <span className="font-bold truncate w-full">{b.nombreBloque.replace(/^\d+\.\s*/, '')}</span>
                              <span className={`text-[9px] font-mono font-bold ${b.isComplete ? 'text-emerald-700' : 'text-amber-700'}`}>
                                {b.isComplete ? '✓ Completo' : `${b.evaluatedQuestions}/${b.totalQuestions}`}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {!selectedApplicant.executiveReport ? (
                      <div className="bg-slate-50 p-6 rounded-lg border border-slate-100 text-center space-y-3">
                        {!canGenerate ? (
                          <div className="space-y-3 max-w-md mx-auto">
                            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                              <AlertTriangle className="w-5 h-5" />
                            </div>
                            <h4 className="text-sm font-bold text-slate-800">Calificación de Entrevista Requerida</h4>
                            <p className="text-xs text-slate-500 leading-relaxed">
                              Para generar un diagnóstico fidedigno y accionable con IA, debe validar los reactivos de la entrevista oficial en la pestaña <strong>2. Entrevista CSEA (90 min)</strong> o hacer clic en el botón de validación inmediata.
                            </p>
                            <div className="flex flex-wrap items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={handleCompleteAndLockInterview}
                                disabled={savingInterview}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition inline-flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                              >
                                <CheckSquare className="w-4 h-4" />
                                <span>Validar y Finalizar 6 Bloques Ahora</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setActiveTab('interview')}
                                className="px-4 py-2 bg-slate-950 text-white hover:bg-slate-800 text-xs font-bold rounded-lg transition inline-flex items-center gap-2 cursor-pointer shadow-sm"
                              >
                                <MessageSquareText className="w-4 h-4 text-amber-400" />
                                <span>Ir a la Entrevista ({evaluatedQuestions}/{totalQuestions} evaluados)</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3 max-w-md mx-auto">
                            <p className="text-xs text-slate-500">
                              Ha evaluado <strong>{evaluatedQuestions} de {totalQuestions}</strong> reactivos de la entrevista ({completedBlocks} de {totalBlocks} bloques validados). El estado de la entrevista está propagado como <strong>{isInterviewCompleted ? 'COMPLETADA' : 'LISTO'}</strong>. Ya puede procesar la matriz con IA para obtener las 19 secciones del reporte y plan a 90 días.
                            </p>
                            <button
                              id="generate-report-btn-mid"
                              onClick={() => handleGenerateReport(selectedApplicant.id)}
                              disabled={generatingReport}
                              className="px-6 py-2.5 bg-amber-500 text-slate-950 hover:bg-amber-400 text-xs font-black rounded-lg transition shadow-md inline-flex items-center gap-2 disabled:opacity-50 cursor-pointer w-full justify-center"
                            >
                              <Brain className={`w-4 h-4 ${generatingReport ? 'animate-pulse' : ''}`} />
                              <span>{generatingReport ? 'Analizando Datos...' : 'Generar Reporte con Google Gemini 3.8 Flash (Gratuito)'}</span>
                            </button>
                            {generatingReport && (
                              <div className="w-full mt-4 space-y-2">
                                <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                  <span>Procesando matriz de madurez</span>
                                  <span>{reportProgress}%</span>
                                </div>
                                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                  <motion.div 
                                    className="bg-amber-500 h-full rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${reportProgress}%` }}
                                    transition={{ ease: "easeOut" }}
                                  />
                                </div>
                                <p className="text-[10px] text-slate-400 text-center animate-pulse">
                                  Por favor espera, el motor está redactando las 19 secciones del documento estratégico. Esto puede tomar hasta 60 segundos...
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                    <div className="space-y-6">
                      
                      {/* View Mode Toggle: Radar Chart (Default) vs Bar Chart */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-amber-500" />
                          <span className="font-bold text-slate-800 text-xs">Visualización Dimensional CSEA v4.0:</span>
                        </div>
                        <div className="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200">
                          <button
                            type="button"
                            onClick={() => setReportChartMode('radar')}
                            className={`px-3 py-1 rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                              reportChartMode === 'radar'
                                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-extrabold'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <span>Gráfico de Radar CSEA</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setReportChartMode('bar')}
                            className={`px-3 py-1 rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                              reportChartMode === 'bar'
                                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-extrabold'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <span>Gráfico de Barras</span>
                          </button>
                        </div>
                      </div>

                      {/* Recharts Visualizations */}
                      {reportChartMode === 'radar' ? (
                        <ExecutiveReportRadarChart
                          dimensions={selectedApplicant.executiveReport.dimensions}
                          globalIndex={selectedApplicant.executiveReport.globalIndex}
                          companyName={selectedApplicant.companyName}
                          benchmarkScore={4.0}
                        />
                      ) : (
                        <div className="space-y-4">
                          <div className="grid md:grid-cols-12 gap-6 items-center">
                            <div className="md:col-span-4 text-center space-y-2 bg-slate-950 text-white p-5 rounded-xl border border-slate-800">
                              <span className="text-[10px] text-amber-400 uppercase tracking-widest block font-mono">Índice Global de Ejecución</span>
                              <span className="text-4xl font-black block">{selectedApplicant.executiveReport.globalIndex}%</span>
                              <span className="text-[10px] text-slate-400 block max-w-[150px] mx-auto">
                                Nivel de Madurez Operativa CSEA v4.0
                              </span>
                            </div>

                            {/* Charts using Recharts BarChart */}
                            <div className="md:col-span-8 space-y-2">
                              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider block">Calificación de Capacidad por Dimensión</h4>
                              <div className="h-48 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart 
                                    data={selectedApplicant.executiveReport.dimensions}
                                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                  >
                                    <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="#64748b" />
                                    <YAxis domain={[0, 5]} tickCount={6} tick={{ fontSize: 9 }} stroke="#64748b" />
                                    <Tooltip contentStyle={{ fontSize: '10px' }} />
                                    <Bar dataKey="score" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          </div>

                          {/* Styled Fallback Bars for quick reading */}
                          <div className="space-y-2 border-t border-slate-100 pt-4">
                            <h4 className="text-xs font-bold text-slate-800">Mapeo de Madurez (Escala 1 al 5):</h4>
                            <div className="grid sm:grid-cols-2 gap-3 text-[11px]">
                              {selectedApplicant.executiveReport.dimensions.map((dim, idx) => (
                                <div key={idx} className="space-y-1">
                                  <div className="flex justify-between items-center">
                                    <span className="text-slate-600 font-medium">{dim.name}</span>
                                    <span className="font-bold text-slate-800">{dim.score.toFixed(1)} / {dim.max}</span>
                                  </div>
                                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <div 
                                      className="bg-amber-500 h-2 rounded-full" 
                                      style={{ width: `${(dim.score / dim.max) * 100}%` }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Executive Findings & Risks */}
                      <div className="grid sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                        <div className="space-y-2">
                          <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                            <span>Hallazgos Clave Detectados:</span>
                          </h4>
                          <ul className="space-y-1.5 text-xs text-slate-600 list-disc pl-5">
                            {selectedApplicant.executiveReport.findings.map((finding, idx) => (
                              <li key={idx} className="leading-relaxed">{finding}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                            <span>Riesgos Críticos para la Organización:</span>
                          </h4>
                          <ul className="space-y-1.5 text-xs text-slate-600 list-disc pl-5">
                            {selectedApplicant.executiveReport.risks.map((risk, idx) => (
                              <li key={idx} className="leading-relaxed">{risk}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Quick Wins & Roadmap */}
                      <div className="grid sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                        <div className="space-y-2 bg-amber-500/5 p-4 rounded-xl border border-amber-500/10">
                          <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                            <Lightbulb className="w-4 h-4 text-amber-500" />
                            <span className="text-amber-950 font-black">Quick Wins (Acciones Inmediatas):</span>
                          </h4>
                          <ul className="space-y-1.5 text-xs text-slate-700 list-disc pl-5">
                            {selectedApplicant.executiveReport.quickWins.map((qw, idx) => (
                              <li key={idx} className="leading-relaxed">{qw}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="space-y-2 bg-slate-950 text-slate-300 p-4 rounded-xl border border-slate-800">
                          <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                            <TrendingUp className="w-4 h-4 text-amber-400" />
                            <span className="text-amber-400 font-extrabold">Plan de Acción y Roadmap a 90 Días:</span>
                          </h4>
                          <ul className="space-y-1.5 text-xs text-slate-300 list-disc pl-5">
                            {selectedApplicant.executiveReport.roadmap90Days.map((step, idx) => (
                              <li key={idx} className="leading-relaxed">{step}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Download buttons */}
                      <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-[10px] text-slate-400">
                        <span>Reporte emitido el {new Date(selectedApplicant.executiveReport.generatedAt).toLocaleDateString()} por el motor CSEA 3.2</span>
                        <div className="flex flex-wrap gap-2">
                          <button
                            id="download-pdf-report-btn"
                            onClick={downloadExecutiveReportPDF}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm text-xs"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Descargar PDF</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              );
            })()}

            {/* TAB 4: VISUALIZACIÓN DEL REPORTE */}
            {activeTab === 'reportView' && selectedApplicant.executiveReport && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    <div>
                      <h3 className="font-sans font-bold text-slate-900 text-sm">
                        Capricorn Strategic Execution Assessment®
                      </h3>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Reporte Ejecutivo de Evaluación (19 Secciones)
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Indicador de Motor Activo: Google Gemini API Gratuita */}
                    <div className="flex items-center gap-1.5 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 text-xs mr-1">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="font-bold text-[10px] text-indigo-950">
                        Gemini 3.8 Flash
                      </span>
                      <span className="text-[9px] px-1 py-0.2 bg-indigo-200 text-indigo-800 rounded font-mono font-bold">
                        Gratuito
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowGeminiKeyModal(true)}
                        className="ml-0.5 text-[9px] text-indigo-600 hover:text-indigo-900 underline font-semibold flex items-center gap-0.5 cursor-pointer"
                        title="Configurar o actualizar API Key de Google Gemini"
                      >
                        <Key className="w-2.5 h-2.5" />
                        <span>Clave</span>
                      </button>
                    </div>

                    <button
                      id="regenerate-report-tab4-btn"
                      onClick={() => handleGenerateReport(selectedApplicant.id)}
                      disabled={generatingReport}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-sm text-xs border border-slate-200 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${generatingReport ? 'animate-spin' : ''}`} />
                      <span>{generatingReport ? 'Regenerando con Gemini...' : 'Regenerar con Google Gemini'}</span>
                    </button>
                    {selectedApplicant.executiveReport.markdownReport && (
                      <button
                        id="download-word-btn"
                        onClick={downloadReportWord}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-sm text-xs"
                      >
                        <Download className="w-4 h-4" />
                        <span>Descargar (.doc)</span>
                      </button>
                    )}
                  </div>
                </div>
                
                {selectedApplicant.executiveReport.markdownReport ? (
                  <div className="space-y-6">
                    {/* Visual Radar Chart (Recharts) */}
                    <ExecutiveReportRadarChart
                      dimensions={selectedApplicant.executiveReport.dimensions}
                      globalIndex={selectedApplicant.executiveReport.globalIndex}
                      companyName={selectedApplicant.companyName}
                      benchmarkScore={4.0}
                    />

                    <div className="prose prose-sm max-w-none text-slate-700 bg-slate-50 p-6 rounded-xl border border-slate-200 markdown-body prose-headings:text-slate-900 prose-a:text-amber-600 prose-table:w-full prose-table:border-collapse prose-th:bg-slate-900 prose-th:text-white prose-th:p-2.5 prose-td:p-2 prose-td:border prose-td:border-slate-200 prose-tr:even:bg-slate-100">
                      <Markdown remarkPlugins={[remarkGfm]}>{selectedApplicant.executiveReport.markdownReport}</Markdown>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8 bg-slate-50 rounded-xl border border-slate-200">
                    <FileText className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                    <h3 className="text-sm font-bold text-slate-800">Actualización Requerida</h3>
                    <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto">
                      Este reporte fue generado con una versión anterior del motor. Para visualizar y descargar el informe extendido en formato Word, por favor vuelve a la pestaña <b>3. Reporte Ejecutivo CSEA</b> y haz clic nuevamente en <b>Generar Reporte con IA</b>.
                    </p>
                  </div>
                )}
              </div>
            )}

            </div>
          )}
        </div>

      </div>
    </div>
  )}

      {/* Modal para Adicionar Empresa directamente */}
      {showAddCompanyModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-amber-500" />
                <h3 className="font-black text-slate-900 text-sm">Adicionar Empresa para Entrevista</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCompanyModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCompany} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nombre de la Empresa *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Grupo Industrial MTY"
                  value={newCompanyForm.companyName}
                  onChange={(e) => setNewCompanyForm(prev => ({ ...prev, companyName: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Patrocinador Principal</label>
                <input
                  type="text"
                  placeholder="Ej. Ing. Roberto Garza (Director General)"
                  value={newCompanyForm.sponsorName}
                  onChange={(e) => setNewCompanyForm(prev => ({ ...prev, sponsorName: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Correo de Contacto</label>
                  <input
                    type="email"
                    placeholder="roberto@empresa.com"
                    value={newCompanyForm.email}
                    onChange={(e) => setNewCompanyForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Teléfono</label>
                  <input
                    type="text"
                    placeholder="81 1234 5678"
                    value={newCompanyForm.phone}
                    onChange={(e) => setNewCompanyForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Notas Iniciales (Opcional)</label>
                <textarea
                  rows={2}
                  placeholder="Comentarios o antecedentes del cliente..."
                  value={newCompanyForm.consultorNotes}
                  onChange={(e) => setNewCompanyForm(prev => ({ ...prev, consultorNotes: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCompanyModal(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingCompany}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg shadow flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{creatingCompany ? 'Guardando...' : 'Crear e Ir a Entrevista'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Configuración de API Key de Google Gemini */}
      {showGeminiKeyModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-white">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-700">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <span>API Key de Google Gemini</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                      Gratuita
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Modelo gemini-3.8-flash oficial vía Google AI Studio
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGeminiKeyModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSaveAndGenerateWithGeminiKey} className="p-5 space-y-4">
              <div className="bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-100 text-xs text-indigo-900 leading-relaxed space-y-1.5">
                <p className="font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Generación analítica C-Level 100% personalizada</span>
                </p>
                <p className="text-[11px] text-slate-600">
                  Para que cada empresa evaluada obtenga un reporte con redacción, hallazgos y roadmap exclusivos adaptados a sus respuestas, el sistema utiliza la API gratuita de Google Gemini.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-slate-800">
                    Ingresa tu Gemini API Key:
                  </label>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1 underline"
                  >
                    <span>Obtener clave gratis</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <PasswordField
                  placeholder="AIzaSy..."
                  value={geminiApiKeyInput}
                  onChange={(e) => setGeminiApiKeyInput(e.target.value)}
                  className="bg-white border border-slate-300 text-slate-900 focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                />
                <p className="text-[10px] text-slate-400">
                  La clave se almacena de forma segura en la configuración y se utiliza automáticamente para todas las evaluaciones CSEA.
                </p>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowGeminiKeyModal(false)}
                  className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingGeminiKey || !geminiApiKeyInput.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition shadow flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {savingGeminiKey ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Brain className="w-3.5 h-3.5" />
                      <span>Guardar y Generar Reporte</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Preguntas Pendientes por Responder */}
      {showPendingQuestionsModal && selectedApplicant?.interview && (() => {
        const unansweredBlocks = getUnansweredQuestionsByBlock(selectedApplicant.interview);
        const totalMissing = unansweredBlocks.reduce((acc, b) => acc + b.preguntas.length, 0);

        return (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-50 to-white">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${totalMissing > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {totalMissing > 0 ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                      <span>Validación de Preguntas de la Entrevista</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
                        totalMissing > 0 ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {totalMissing > 0 ? `${totalMissing} pendientes` : '100% Completada'}
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {totalMissing > 0 
                        ? 'Para marcar la entrevista como completada o generar el reporte ejecutivo, cada reactivo debe contar con calificación (1 al 5), evidencias del cliente (mín. 15 car.) y notas del consultor (mín. 15 car.).'
                        : 'Todos los 6 bloques y 60 reactivos han sido completados con éxito bajo el estándar oficial CSEA v4.0.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPendingQuestionsModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                  title="Cerrar ventana"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {totalMissing === 0 ? (
                  <div className="p-8 text-center space-y-3 bg-emerald-50/50 rounded-xl border border-emerald-200">
                    <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                    <h4 className="font-black text-slate-900 text-base">¡Todos los reactivos están respondidos y validados!</h4>
                    <p className="text-xs text-slate-600 max-w-md mx-auto">
                      Se han registrado las calificaciones del 1 al 5, comentarios de evidencia ($\ge$ 15 caracteres) y notas del consultor ($\ge$ 15 caracteres) en los 6 bloques metodológicos oficiales CSEA v4.0.
                    </p>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={async () => {
                          setShowPendingQuestionsModal(false);
                          await handleCompleteAndLockInterview();
                        }}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md cursor-pointer inline-flex items-center gap-2"
                      >
                        <CheckSquare className="w-4 h-4" />
                        <span>Confirmar y Marcar como Completada Ahora</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Dimension Summary Pills */}
                    <div className="flex flex-wrap items-center gap-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px]">
                      <span className="font-bold text-slate-600 mr-1">Pendientes por bloque:</span>
                      {unansweredBlocks.map((b) => (
                        <span 
                          key={b.bloqueId}
                          className="px-2 py-0.5 bg-white border border-amber-200 text-amber-900 font-medium rounded-md shadow-2xs flex items-center gap-1 font-mono text-[10px]"
                        >
                          <span className="font-bold">{b.nombreBloque.substring(0, 15)}...:</span>
                          <span className="font-black text-amber-700">{b.preguntas.length}</span>
                        </span>
                      ))}
                    </div>

                    {/* Grouped Missing Questions List */}
                    <div className="space-y-4">
                      {unansweredBlocks.map((b) => (
                        <div key={b.bloqueId} className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                          <div className="bg-slate-100/80 px-3.5 py-2 border-b border-slate-200 flex items-center justify-between">
                            <span className="font-black text-xs text-slate-800 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                              <span>{b.nombreBloque}</span>
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                              {b.preguntas.length} pendientes
                            </span>
                          </div>

                          <div className="divide-y divide-slate-100 bg-white">
                            {b.preguntas.map((q) => {
                              const details = getQuestionMissingDetails(q);
                              return (
                                <div key={q.idPregunta} className="p-3.5 space-y-2 hover:bg-slate-50/50 transition">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                      {q.codigo && (
                                        <span className="px-2 py-0.5 bg-slate-900 text-amber-400 font-mono text-[10px] font-black rounded">
                                          {q.codigo}
                                        </span>
                                      )}
                                      <span className="text-[10px] font-bold text-slate-500 uppercase">
                                        {q.tipo === 'P' ? 'Principal' : 'Verificación'}
                                      </span>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => handleGoToQuestion(b.bloqueId, q.idPregunta)}
                                      className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg transition cursor-pointer border border-amber-200/70"
                                      title="Ir directamente al reactivo en la entrevista para ver rúbrica y criterios completos"
                                    >
                                      <span>Ir a la pregunta</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </button>
                                  </div>

                                  <p className="text-xs font-semibold text-slate-800 leading-snug">
                                    {q.texto}
                                  </p>

                                  {/* Detailed missing requirements badges */}
                                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] pt-1">
                                    {details.missingScore && (
                                      <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-200 font-bold">
                                        Falta Calificación (1-5)
                                      </span>
                                    )}
                                    {details.missingRespuesta && (
                                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 font-medium">
                                        Falta Respuesta del Cliente ({details.respuestaLen}/15 car.)
                                      </span>
                                    )}
                                    {details.missingNotas && (
                                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 font-medium">
                                        Faltan Notas del Consultor ({details.notasLen}/15 car.)
                                      </span>
                                    )}
                                  </div>

                                  {/* Quick inline scoring right from modal */}
                                  <div className="flex items-center justify-between pt-1 gap-2 flex-wrap border-t border-slate-100 mt-2">
                                    <span className="text-[10px] font-bold text-slate-500">
                                      Puntuación rápida (1 a 5):
                                    </span>
                                    <div className="flex items-center gap-1">
                                      {[1, 2, 3, 4, 5].map((lvl) => {
                                        const isSelected = q.score === lvl;
                                        return (
                                          <button
                                            key={lvl}
                                            type="button"
                                            onClick={() => handleUpdateQuestionScore(b.bloqueId, q.idPregunta, lvl)}
                                            className={`w-7 h-7 rounded text-[11px] font-mono font-bold transition cursor-pointer border ${
                                              isSelected 
                                                ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs' 
                                                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                                            }`}
                                            title={`Nivel ${lvl}`}
                                          >
                                            {lvl}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div className="text-[11px] text-slate-500">
                  {totalMissing > 0 
                    ? `Faltan responder ${totalMissing} de ${getInterviewBlockProgress(selectedApplicant.interview).totalQuestions} reactivos.`
                    : 'Todos los reactivos listos para cierre.'}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPendingQuestionsModal(false)}
                    className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs border border-slate-200 cursor-pointer"
                  >
                    Continuar en la Entrevista
                  </button>

                  {totalMissing > 0 ? (
                    <button
                      type="button"
                      onClick={async () => {
                        setShowPendingQuestionsModal(false);
                        await handleAutoFillRemainingScores();
                      }}
                      className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold rounded-xl text-xs shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                      title="Asignar Nivel 3 (Estándar) a las preguntas pendientes y completar la entrevista"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Calificar Pendientes con Nivel 3 Estándar</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={async () => {
                        setShowPendingQuestionsModal(false);
                        await handleCompleteAndLockInterview();
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs shadow cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>Finalizar y Completar</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal de Confirmación para Eliminar Empresa */}
      {companyToDelete && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600 border-b border-slate-100 pb-3">
              <div className="p-2.5 bg-red-100 rounded-xl">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-sm">Eliminar Empresa y Diagnóstico</h3>
                <p className="text-[11px] text-slate-500">Esta acción no se puede deshacer</p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <p>
                ¿Está seguro de que desea eliminar permanentemente a la organización <strong className="text-slate-900">{companyToDelete.companyName}</strong>?
              </p>
              <div className="p-3 bg-red-50/70 border border-red-200 rounded-xl text-[11px] text-red-800 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Se eliminarán todos los registros asociados:
                </p>
                <ul className="list-disc pl-4 space-y-0.5 text-[10px] text-red-700">
                  <li>Formulario de Elegibilidad Gate A y Pre-Brief</li>
                  <li>Pre-Assessment B (si fue completado)</li>
                  <li>Todas las respuestas y notas de la entrevista de 90 minutos</li>
                  <li>Reporte Ejecutivo de Evaluación Estratégica (19 secciones)</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCompanyToDelete(null)}
                disabled={deletingCompany}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="confirm-delete-company-btn"
                onClick={handleDeleteCompany}
                disabled={deletingCompany}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl text-xs shadow flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{deletingCompany ? 'Eliminando...' : 'Sí, Eliminar Definitivamente'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Pre-Brief Modal */}
      <SharePreBriefModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        consultor={activeConsultor ? { id: activeConsultor.id || '', name: activeConsultor.name, email: activeConsultor.email || '' } : null}
      />
    </div>
  );
}
