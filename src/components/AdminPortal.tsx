import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, UserPlus, Trash2, BarChart3, TrendingUp, Users, DollarSign,
  Calendar, CheckCircle, RefreshCw, Layers, Briefcase, Award, KeyRound,
  Mail, ArrowRight, Lock, Eye, EyeOff, AlertCircle, Check, Cpu, Sparkles,
  ShieldCheck, ExternalLink
} from 'lucide-react';
import { Applicant, Consultor } from '../types';
import { safeFetchJson } from '../utils/apiClient';
import PasswordField from './PasswordField';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';

interface AdminPortalProps {
  applicants: Applicant[];
  consultores: Consultor[];
  onRefresh: () => void;
  onAddConsultor: (name: string, password?: string) => Promise<boolean>;
  onDeleteConsultor: (name: string) => Promise<boolean>;
}

export default function AdminPortal({ 
  applicants, 
  consultores, 
  onRefresh, 
  onAddConsultor, 
  onDeleteConsultor 
}: AdminPortalProps) {
  const [isAdminVerified, setIsAdminVerified] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [newConsultorName, setNewConsultorName] = useState('');
  const [newConsultorPassword, setNewConsultorPassword] = useState('');
  const [submittingConsultor, setSubmittingConsultor] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [isVerifyingLogin, setIsVerifyingLogin] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);

  // Recovery Modal States (Option A: OTP via Make Webhook)
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<'request' | 'verify'>('request');
  const [recoveryEmail, setRecoveryEmail] = useState('rconde@capricorn.com.mx');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // In-portal password update
  const [showChangePasswordSection, setShowChangePasswordSection] = useState(false);
  const [changeCurrentPass, setChangeCurrentPass] = useState('');
  const [changeNewPass, setChangeNewPass] = useState('');
  const [changeConfirmPass, setChangeConfirmPass] = useState('');
  const [changePassLoading, setChangePassLoading] = useState(false);
  const [changePassMsg, setChangePassMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // AI Settings (Deterministic vs Gemini vs Claude)
  const [aiProvider, setAiProvider] = useState<'deterministic' | 'gemini' | 'claude'>('gemini');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [hasGeminiKey, setHasGeminiKey] = useState(true);
  const [hasAnthropicKey, setHasAnthropicKey] = useState(false);
  const [geminiQuotaExhausted, setGeminiQuotaExhausted] = useState(false);
  const [anthropicQuotaExhausted, setAnthropicQuotaExhausted] = useState(false);
  const [geminiKeyConfiguredStatus, setGeminiKeyConfiguredStatus] = useState('Configurada en servidor');
  const [anthropicKeyConfiguredStatus, setAnthropicKeyConfiguredStatus] = useState('No configurada');
  const [savingAiSettings, setSavingAiSettings] = useState(false);
  const [aiSettingsMsg, setAiSettingsMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // States for simulated metrics editing
  const [conversions, setConversions] = useState<Record<string, boolean>>({});
  const [clientSatisfaction, setClientSatisfaction] = useState<Record<string, number>>({});

  // Initialize conversion flags & AI settings
  useEffect(() => {
    const initialConversions: Record<string, boolean> = {};
    const initialSatisfaction: Record<string, number> = {};
    applicants.forEach(a => {
      initialConversions[a.id] = localStorage.getItem(`converted_${a.id}`) === 'true';
      initialSatisfaction[a.id] = Number(localStorage.getItem(`sat_${a.id}`) || '9');
    });
    setConversions(initialConversions);
    setClientSatisfaction(initialSatisfaction);

    // Fetch current AI settings
    safeFetchJson<any>('/api/admin/ai-settings')
      .then(({ ok, data }) => {
        if (ok && data) {
          if (data.defaultAiProvider) setAiProvider(data.defaultAiProvider);
          setHasGeminiKey(!!data.hasGeminiKey);
          setHasAnthropicKey(!!data.hasAnthropicKey);
          setGeminiQuotaExhausted(!!data.geminiQuotaExhausted);
          setAnthropicQuotaExhausted(!!data.anthropicQuotaExhausted);
          if (data.geminiKeyConfigured) setGeminiKeyConfiguredStatus(data.geminiKeyConfigured);
          if (data.anthropicKeyConfigured) setAnthropicKeyConfiguredStatus(data.anthropicKeyConfigured);
        }
      })
      .catch(err => console.error('Error fetching AI settings:', err));
  }, [applicants]);

  const handleSaveAiSettings = async (e: FormEvent) => {
    e.preventDefault();
    setSavingAiSettings(true);
    setAiSettingsMsg(null);
    try {
      const { ok, data, error: fetchErr } = await safeFetchJson<any>('/api/admin/ai-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaultAiProvider: aiProvider,
          anthropicApiKey: anthropicKey.trim() || undefined,
          geminiApiKey: geminiKey.trim() || undefined
        })
      });
      if (ok && data?.success) {
        setAiSettingsMsg({
          type: 'success',
          text: `Configuración guardada exitosamente. Motor predeterminado: ${data.defaultAiProvider.toUpperCase()}`
        });
        setHasGeminiKey(!!data.hasGeminiKey);
        setHasAnthropicKey(!!data.hasAnthropicKey);
        setGeminiQuotaExhausted(!!data.geminiQuotaExhausted);
        setAnthropicQuotaExhausted(!!data.anthropicQuotaExhausted);
        if (data.geminiKeyConfigured) setGeminiKeyConfiguredStatus(data.geminiKeyConfigured);
        if (data.anthropicKeyConfigured) setAnthropicKeyConfiguredStatus(data.anthropicKeyConfigured);
        setAnthropicKey('');
        setGeminiKey('');
      } else {
        setAiSettingsMsg({ type: 'error', text: fetchErr || data?.error || 'Error al guardar la configuración de IA.' });
      }
    } catch (err: any) {
      setAiSettingsMsg({ type: 'error', text: 'Error de conexión: ' + err.message });
    } finally {
      setSavingAiSettings(false);
    }
  };

  const handleVerifyAdmin = async (e: FormEvent) => {
    e.preventDefault();
    setAdminError(null);

    if (!adminPassword.trim()) {
      setAdminError('Por favor ingrese la contraseña de administrador.');
      return;
    }

    setIsVerifyingLogin(true);
    try {
      const { ok, data, error: fetchErr } = await safeFetchJson<any>('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword })
      });
      if (ok && data?.success) {
        setIsAdminVerified(true);
        if (data.recoveryEmail) {
          setRecoveryEmail(data.recoveryEmail);
        }
      } else {
        setAdminError(fetchErr || data?.error || 'Contraseña de administrador incorrecta.');
      }
    } catch (err: any) {
      setAdminError('Error de comunicación con el servidor: ' + err.message);
    } finally {
      setIsVerifyingLogin(false);
    }
  };

  const handleRequestOtp = async (e: FormEvent) => {
    e.preventDefault();
    setRecoveryMessage(null);
    setRecoveryLoading(true);

    try {
      const { ok, data, error: fetchErr } = await safeFetchJson<any>('/api/admin/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: recoveryEmail })
      });
      if (ok && data?.success) {
        setRecoveryStep('verify');
        if (data.devOtp) {
          setOtpCode(data.devOtp);
        }
        setRecoveryMessage({
          type: 'success',
          text: `Código OTP generado (${data.devOtp ? `Código: ${data.devOtp}` : 'enviado a ' + (data.targetEmail || recoveryEmail)}). Revisa tu bandeja o utiliza el código autorrellenado.`
        });
      } else {
        setRecoveryMessage({
          type: 'error',
          text: fetchErr || data?.error || 'No se pudo enviar el código de recuperación.'
        });
      }
    } catch (err: any) {
      setRecoveryMessage({
        type: 'error',
        text: 'Error al solicitar el código: ' + err.message
      });
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setRecoveryMessage(null);

    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setRecoveryMessage({ type: 'error', text: 'El código OTP debe ser de 6 dígitos numéricos.' });
      return;
    }

    if (newPassword.length < 8) {
      setRecoveryMessage({ type: 'error', text: 'La nueva contraseña debe tener al menos 8 caracteres.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setRecoveryMessage({ type: 'error', text: 'Las contraseñas ingresadas no coinciden.' });
      return;
    }

    setRecoveryLoading(true);
    try {
      const { ok, data, error: fetchErr } = await safeFetchJson<any>('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: otpCode.trim(), newPassword })
      });
      if (ok && data?.success) {
        setRecoveryMessage({
          type: 'success',
          text: '¡Contraseña actualizada con éxito! Ahora puede ingresar al portal.'
        });
        setAdminPassword(newPassword);
        setTimeout(() => {
          setShowRecoveryModal(false);
          setRecoveryStep('request');
          setOtpCode('');
          setNewPassword('');
          setConfirmPassword('');
          setRecoveryMessage(null);
        }, 2200);
      } else {
        setRecoveryMessage({
          type: 'error',
          text: fetchErr || data?.error || 'No se pudo restablecer la contraseña.'
        });
      }
    } catch (err: any) {
      setRecoveryMessage({
        type: 'error',
        text: 'Error al restablecer contraseña: ' + err.message
      });
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleChangePasswordInPortal = async (e: FormEvent) => {
    e.preventDefault();
    setChangePassMsg(null);

    if (changeNewPass.length < 8) {
      setChangePassMsg({ type: 'error', text: 'La nueva clave debe tener al menos 8 caracteres.' });
      return;
    }
    if (changeNewPass !== changeConfirmPass) {
      setChangePassMsg({ type: 'error', text: 'La confirmación no coincide con la nueva contraseña.' });
      return;
    }

    setChangePassLoading(true);
    try {
      const { ok, data, error: fetchErr } = await safeFetchJson<any>('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: changeCurrentPass, newPassword: changeNewPass })
      });
      if (ok && data?.success) {
        setChangePassMsg({ type: 'success', text: 'Contraseña de Administrador actualizada correctamente.' });
        setChangeCurrentPass('');
        setChangeNewPass('');
        setChangeConfirmPass('');
        setTimeout(() => {
          setShowChangePasswordSection(false);
          setChangePassMsg(null);
        }, 2500);
      } else {
        setChangePassMsg({ type: 'error', text: fetchErr || data?.error || 'Error al cambiar contraseña.' });
      }
    } catch (err: any) {
      setChangePassMsg({ type: 'error', text: 'Error: ' + err.message });
    } finally {
      setChangePassLoading(false);
    }
  };

  const handleToggleConversion = (applicantId: string) => {
    const nextVal = !conversions[applicantId];
    setConversions(prev => ({ ...prev, [applicantId]: nextVal }));
    localStorage.setItem(`converted_${applicantId}`, String(nextVal));
  };

  const handleSatisfactionChange = (applicantId: string, rating: number) => {
    setClientSatisfaction(prev => ({ ...prev, [applicantId]: rating }));
    localStorage.setItem(`sat_${applicantId}`, String(rating));
  };

  const handleAddSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newConsultorName.trim()) return;
    setSubmittingConsultor(true);
    setNotification(null);
    onAddConsultor(newConsultorName.trim(), newConsultorPassword.trim()).then((success) => {
      if (success) {
        setNewConsultorName('');
        setNewConsultorPassword('');
        setNotification({ type: 'success', message: 'Consultor agregado exitosamente.' });
        setTimeout(() => setNotification(null), 5000);
      } else {
        setNotification({ type: 'error', message: 'Error al agregar el consultor.' });
      }
      setSubmittingConsultor(false);
    });
  };

  const handleDeleteClick = (name: string) => {
    setDeleteConfirmation(name);
  };

  const confirmDeleteConsultor = async () => {
    if (!deleteConfirmation) return;
    setNotification(null);
    const success = await onDeleteConsultor(deleteConfirmation);
    if (success) {
      setNotification({ type: 'success', message: `Consultor "${deleteConfirmation}" dado de baja exitosamente.` });
      setTimeout(() => setNotification(null), 5000);
    } else {
      setNotification({ type: 'error', message: 'Error al dar de baja al consultor.' });
    }
    setDeleteConfirmation(null);
  };

  // KPI Calculations
  const totalEvaluated = applicants.length;
  const acceptedApplicants = applicants.filter(a => a.statusA !== 'Rechazado');
  const totalAccepted = acceptedApplicants.length;
  const acceptanceRate = totalEvaluated > 0 ? Math.round((totalAccepted / totalEvaluated) * 100) : 0;

  // Conversion metrics
  const convertedCount = Object.values(conversions).filter(Boolean).length;
  const conversionRate = totalAccepted > 0 ? Math.round((convertedCount / totalAccepted) * 100) : 0;

  // NPS / Satisfaction calculations
  const satValues = Object.values(clientSatisfaction) as number[];
  const avgSatisfaction = satValues.length > 0 
    ? (satValues.reduce((acc, v) => acc + v, 0) / satValues.length).toFixed(1) 
    : '9.2';

  // Average Cycle Time: Simulating based on data completeness
  const avgCycleWeeks = totalEvaluated > 0 ? 1.8 : 0;

  // Estimated economic benefit identified (Mock average $45,000 MXN / $2,500 USD per diagnostic or optimization recommendation)
  const totalBenefit = convertedCount * 120000 + (totalAccepted - convertedCount) * 25000;

  // Chart data: Acceptance Rate chart
  const acceptanceData = [
    { name: 'Aceptación Inmediata', value: applicants.filter(a => a.statusA === 'Aceptación Inmediata').length },
    { name: 'Aceptación Condicional', value: applicants.filter(a => a.statusA === 'Aceptación Condicional').length },
    { name: 'Rechazados / No Elegibles', value: applicants.filter(a => a.statusA === 'Rechazado').length }
  ];

  const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

  if (!isAdminVerified) {
    return (
      <div id="admin-password-screen" className="py-16 px-4 max-w-md mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 space-y-6"
        >
          <div className="text-center space-y-2">
            <div className="inline-flex bg-slate-950 text-amber-500 p-3.5 rounded-2xl shadow-md border border-slate-800">
              <Shield className="w-8 h-8" />
            </div>
            <h2 className="font-sans text-xl font-extrabold text-slate-900">Acceso Administrador General</h2>
            <p className="text-xs text-slate-500">
              Gestione el catálogo de consultores autorizados y audite las métricas globales del programa CSEA.
            </p>
          </div>

          <form onSubmit={handleVerifyAdmin} className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 block">Contraseña de Administrador</label>
                <button
                  type="button"
                  onClick={() => {
                    setShowRecoveryModal(true);
                    setRecoveryStep('request');
                    setRecoveryMessage(null);
                  }}
                  className="text-[11px] font-semibold text-amber-600 hover:text-amber-700 transition underline underline-offset-2 cursor-pointer"
                >
                  ¿Olvidó su contraseña?
                </button>
              </div>
              <PasswordField
                placeholder="Introduzca la clave de administrador"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="py-2.5 bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-amber-500 text-slate-800 focus:bg-white"
              />
            </div>

            {adminError && (
              <motion.div 
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-600 font-medium bg-red-50 border border-red-200 p-3 rounded-lg flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{adminError}</span>
              </motion.div>
            )}

            <button
              id="verify-admin-btn"
              type="submit"
              disabled={isVerifyingLogin}
              className="w-full px-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isVerifyingLogin ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ingresar al Portal Admin</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-500" />
              <span>Autenticación Cifrada SHA-256</span>
            </span>
            <button
              type="button"
              onClick={() => {
                setShowRecoveryModal(true);
                setRecoveryStep('request');
                setRecoveryMessage(null);
              }}
              className="text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
            >
              Recuperar Acceso (OTP)
            </button>
          </div>
        </motion.div>

        {/* Modal for Password Recovery (Option A: OTP via Make Webhook) */}
        <AnimatePresence>
          {showRecoveryModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-5"
              >
                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-sans font-bold text-slate-900 text-sm">
                        Recuperación de Acceso Administrador
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {recoveryStep === 'request' ? 'Paso 1: Solicitud de Código OTP' : 'Paso 2: Verificación y Nueva Contraseña'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowRecoveryModal(false)}
                    className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1 rounded hover:bg-slate-100"
                  >
                    ✕
                  </button>
                </div>

                {recoveryMessage && (
                  <div className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                    recoveryMessage.type === 'success' 
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                    {recoveryMessage.type === 'success' ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <span>{recoveryMessage.text}</span>
                  </div>
                )}

                {recoveryStep === 'request' ? (
                  <form onSubmit={handleRequestOtp} className="space-y-4">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Se despachará un <strong>código OTP de 6 dígitos</strong> con vigencia de 15 minutos al correo electrónico registrado del Administrador vía el Webhook oficial de Capricorn.
                    </p>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Correo Electrónico de Recuperación</label>
                      <div className="relative">
                        <input
                          type="email"
                          required
                          value={recoveryEmail}
                          onChange={(e) => setRecoveryEmail(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800"
                        />
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Cuentas autorizadas: rconde@capricorn.com.mx / info@capricorn.com.mx
                      </p>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowRecoveryModal(false)}
                        className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={recoveryLoading}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {recoveryLoading ? (
                          <>
                            <div className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                            <span>Enviando...</span>
                          </>
                        ) : (
                          <>
                            <span>Enviar Código OTP</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-3.5">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Código OTP de 6 Dígitos</label>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        placeholder="Ej: 582914"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        className="w-full text-center font-mono text-xl tracking-widest px-3 py-2 bg-slate-50 border-2 border-amber-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Nueva Contraseña de Administrador</label>
                      <PasswordField
                        required
                        minLength={8}
                        placeholder="Mínimo 8 caracteres"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-amber-500 text-slate-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Confirmar Nueva Contraseña</label>
                      <PasswordField
                        required
                        minLength={8}
                        placeholder="Repita la nueva contraseña"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-amber-500 text-slate-800"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => setRecoveryStep('request')}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline cursor-pointer"
                      >
                        Reenviar código
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowRecoveryModal(false)}
                          className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={recoveryLoading}
                          className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {recoveryLoading ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Restableciendo...</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5 text-amber-400" />
                              <span>Guardar Nueva Clave</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div id="admin-portal-root" className="py-8 px-4 max-w-7xl mx-auto space-y-8">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="font-sans text-2xl font-black text-slate-900">
            Panel de Administración Global CSEA
          </h1>
          <p className="text-xs text-slate-500">
            Altas y bajas de consultores estratégicos, y métricas de éxito de las generaciones.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => setShowChangePasswordSection(!showChangePasswordSection)}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition flex items-center gap-1.5 text-xs font-semibold"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-600" />
            <span>{showChangePasswordSection ? 'Cerrar Ajustes de Clave' : 'Cambiar Contraseña Admin'}</span>
          </button>
          <button
            onClick={onRefresh}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition flex items-center gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Actualizar Métricas</span>
          </button>
        </div>
      </div>

      {/* Change Password Dropdown Panel */}
      <AnimatePresence>
        {showChangePasswordSection && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-slate-900 text-white rounded-xl p-6 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-amber-400" />
                  <h3 className="font-sans font-bold text-sm">Cambio de Contraseña de Administrador</h3>
                </div>
                <span className="text-[11px] text-slate-400">Protegido con SHA-256</span>
              </div>

              {changePassMsg && (
                <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  changePassMsg.type === 'success' 
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                    : 'bg-red-950 text-red-300 border border-red-800'
                }`}>
                  {changePassMsg.type === 'success' ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
                  <span>{changePassMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleChangePasswordInPortal} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">Contraseña Actual</label>
                  <PasswordField
                    required
                    placeholder="Clave actual"
                    value={changeCurrentPass}
                    onChange={(e) => setChangeCurrentPass(e.target.value)}
                    className="text-xs bg-slate-950 border border-slate-700 text-white focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">Nueva Contraseña</label>
                  <PasswordField
                    required
                    minLength={8}
                    placeholder="Mínimo 8 caracteres"
                    value={changeNewPass}
                    onChange={(e) => setChangeNewPass(e.target.value)}
                    className="text-xs bg-slate-950 border border-slate-700 text-white focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">Confirmar Nueva Contraseña</label>
                  <PasswordField
                    required
                    minLength={8}
                    placeholder="Repita nueva clave"
                    value={changeConfirmPass}
                    onChange={(e) => setChangeConfirmPass(e.target.value)}
                    className="text-xs bg-slate-950 border border-slate-700 text-white focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div className="md:col-span-3 flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowChangePasswordSection(false)}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={changePassLoading}
                    className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition disabled:opacity-50"
                  >
                    {changePassLoading ? 'Actualizando...' : 'Guardar Nueva Contraseña'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-mono uppercase font-bold">Total Evaluadas</span>
            <span className="text-xl font-black text-slate-900">{totalEvaluated}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-mono uppercase font-bold">Tasa Aceptación</span>
            <span className="text-xl font-black text-slate-900">{acceptanceRate}%</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-mono uppercase font-bold">Tasa Conversión</span>
            <span className="text-xl font-black text-slate-900">{conversionRate}%</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-mono uppercase font-bold">Beneficio Estimado</span>
            <span className="text-xl font-black text-slate-900">
              ${totalBenefit.toLocaleString()} MXN
            </span>
          </div>
        </div>

      </div>

      {/* Main Admin Content Grid */}
      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* Left Side: Consultores Management (Altas/Bajas) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h3 className="font-sans font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-500" />
                <span>Gestión de Consultores</span>
              </h3>
              <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-mono font-bold">
                {consultores.length} Activos
              </span>
            </div>

            {notification && (
              <div className={`p-3 rounded-lg text-xs font-semibold ${
                notification.type === 'success' 
                  ? 'bg-emerald-50 border border-emerald-100 text-emerald-800' 
                  : 'bg-rose-50 border border-rose-100 text-rose-800'
              }`}>
                {notification.message}
              </div>
            )}

            {deleteConfirmation && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-2">
                <p className="font-semibold text-amber-800">
                  ¿Está seguro de dar de baja al consultor "{deleteConfirmation}"?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={confirmDeleteConsultor}
                    className="px-2 py-1 bg-amber-600 text-white rounded text-[10px] font-bold hover:bg-amber-700"
                  >
                    Sí, dar de baja
                  </button>
                  <button
                    onClick={() => setDeleteConfirmation(null)}
                    className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-[10px] hover:bg-slate-300"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Form to Add Consultor */}
            <form onSubmit={handleAddSubmit} className="space-y-3">
              <label className="text-[11px] font-bold text-slate-700 block">Dar de Alta Nuevo Consultor:</label>
              <div className="space-y-2">
                <input
                  type="text"
                  required
                  placeholder="Nombre. Ej. Ing. Diana Montes"
                  value={newConsultorName}
                  onChange={(e) => setNewConsultorName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-800"
                />
                <div className="flex gap-2 items-center">
                  <PasswordField
                    placeholder="Contraseña / Código de acceso (Opcional)"
                    value={newConsultorPassword}
                    onChange={(e) => setNewConsultorPassword(e.target.value)}
                    containerClassName="flex-1"
                    className="py-1.5 text-xs bg-slate-50 border border-slate-200 focus:ring-1 focus:ring-amber-500 text-slate-800"
                  />
                  <button
                    id="add-consultor-btn"
                    type="submit"
                    disabled={submittingConsultor || !newConsultorName.trim()}
                    className="px-3 py-1.5 bg-slate-950 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition disabled:opacity-50 flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Alta</span>
                  </button>
                </div>
              </div>
            </form>

            {/* List of Consultores */}
            <div className="space-y-2 pt-2">
              <label className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">Consultores Autorizados:</label>
              {consultores.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">No hay consultores registrados.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {consultores.map((c) => (
                    <div key={c.name} className="py-2 flex items-center justify-between text-xs text-slate-800">
                      <div>
                        <span className="font-semibold block">{c.name}</span>
                        {c.password && (
                          <span className="text-[10px] font-mono text-slate-400">
                            Código: <strong className="text-slate-600">{c.password}</strong>
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteClick(c.name)}
                        className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded transition"
                        title="Dar de baja consultor"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Metrics Dashboard and Audit Panel */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Conversión Audit Panel */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-sans font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-500" />
                <span>Auditoría de Conversión a Proyectos</span>
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">
                Administre el estatus de conversión de los clientes elegibles a proyectos reales de Capricorn (PMO, optimizaciones, etc.) para mantener los KPIs actualizados.
              </p>
            </div>

            {applicants.filter(a => a.statusA !== 'Rechazado').length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                No hay empresas aceptadas para evaluar su estado de conversión comercial todavía.
              </p>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {applicants.filter(a => a.statusA !== 'Rechazado').map((a) => (
                  <div 
                    key={a.id} 
                    className="p-3 bg-slate-50 border border-slate-150 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800 block">{a.companyName}</span>
                      <span className="text-[10px] text-slate-500 block">Sponsor: {a.sponsorName}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Customer satisfaction selector */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-mono">Calificación:</span>
                        <select
                          value={clientSatisfaction[a.id] || 9}
                          onChange={(e) => handleSatisfactionChange(a.id, Number(e.target.value))}
                          className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[11px] focus:outline-none"
                        >
                          {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(v => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                      </div>

                      {/* Convert toggle button */}
                      <button
                        onClick={() => handleToggleConversion(a.id)}
                        className={`px-2.5 py-1 rounded text-[10px] font-bold transition ${
                          conversions[a.id]
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                      >
                        {conversions[a.id] ? 'Convertido ✓' : 'No Convertido'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Graphical KPI Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            <h3 className="font-sans font-extrabold text-slate-900 text-sm">Distribución de Solicitudes</h3>
            
            {applicants.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">
                No hay suficientes datos gráficos aún. Registre su primera postulación de cliente.
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4 items-center">
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={acceptanceData}>
                      <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="#64748b" />
                      <YAxis tick={{ fontSize: 9 }} stroke="#64748b" />
                      <Tooltip contentStyle={{ fontSize: '10px' }} />
                      <Bar dataKey="value" fill="#3b82f6">
                        {acceptanceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="flex items-center gap-1.5 font-medium text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      Aceptación Inmediata
                    </span>
                    <span className="font-bold text-slate-800">
                      {applicants.filter(a => a.statusA === 'Aceptación Inmediata').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="flex items-center gap-1.5 font-medium text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      Aceptación Condicional
                    </span>
                    <span className="font-bold text-slate-800">
                      {applicants.filter(a => a.statusA === 'Aceptación Condicional').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="flex items-center gap-1.5 font-medium text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                      No Elegible / Rechazado
                    </span>
                    <span className="font-bold text-slate-800">
                      {applicants.filter(a => a.statusA === 'Rechazado').length}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Make Webhook Integration Card */}
          <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 p-6 space-y-4 text-slate-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="font-sans font-bold text-white text-sm">Notificaciones por Email (Make Webhook)</h3>
              </div>
              <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono rounded">
                Activo
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Al finalizar el pre-assessment se despacha automáticamente el correo con asunto <strong className="text-slate-200">"pre-assessement realizado"</strong> hacia <strong className="text-amber-400">info@capricorn.com.mx</strong> y <strong className="text-amber-400">rconde@capricorn.com.mx</strong>.
            </p>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-[11px] text-slate-400 overflow-hidden">
                <span className="font-mono text-emerald-400 font-bold">● URL:</span>
                <span className="font-mono text-slate-300 break-all select-all">https://hook.us1.make.com/cv5sb2eq1tjrt30f2gl5omjsqwolfmyp</span>
              </div>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const { ok, data, error: fetchErr } = await safeFetchJson<any>('/api/webhook/test-make', { method: 'POST' });
                    if (ok && data?.success) {
                      const emp = data.applicantSent?.empresa || 'Empresa';
                      const con = data.applicantSent?.contacto || 'Contacto';
                      setNotification({ 
                        type: 'success', 
                        message: `¡Notificación despachada a Make Webhook (cv5sb2...) con datos reales de "${emp}" (${con})!` 
                      });
                    } else {
                      setNotification({ type: 'error', message: 'Error al enviar a Make: ' + (fetchErr || data?.error || 'Respuesta no exitosa') });
                    }
                  } catch (err: any) {
                    setNotification({ type: 'error', message: 'Error al conectar con el servidor: ' + err.message });
                  }
                }}
                className="shrink-0 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-xs transition cursor-pointer shadow-sm"
              >
                Probar Webhook
              </button>
            </div>
          </div>

          {/* AI Engine & LLM Settings Card (Deterministic vs Claude vs Gemini) */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-600" />
                <h3 className="font-sans font-bold text-slate-900 text-sm">Motor de Inteligencia Artificial (Reporte CSEA)</h3>
              </div>
              <span className={`px-2.5 py-0.5 text-[10px] font-bold font-mono rounded-full border ${
                aiProvider === 'gemini'
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                  : aiProvider === 'claude' 
                  ? 'bg-purple-50 text-purple-700 border-purple-200' 
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}>
                {aiProvider === 'gemini' ? 'Google Gemini 3.8 Flash (Gratuito)' : aiProvider === 'claude' ? 'Claude 3.7 Sonnet' : 'CSEA Golden Master (Local)'}
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Selecciona el motor para la redacción de los reportes estratégicos CSEA. Por defecto se utiliza la <strong>API gratuita de Google Gemini (gemini-3.8-flash)</strong> para generar análisis analíticos personalizados y diferenciados según las respuestas de cada empresa.
            </p>

            {aiSettingsMsg && (
              <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                aiSettingsMsg.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {aiSettingsMsg.type === 'success' ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
                <span>{aiSettingsMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveAiSettings} className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                {/* Gemini Option (Primary & Default) */}
                <label className={`relative flex flex-col justify-between p-3 rounded-xl border-2 cursor-pointer transition ${
                  aiProvider === 'gemini' 
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-xs' 
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}>
                  <div className="flex items-start gap-2.5">
                    <input
                      type="radio"
                      name="aiProvider"
                      value="gemini"
                      checked={aiProvider === 'gemini'}
                      onChange={() => setAiProvider('gemini')}
                      className="text-indigo-600 focus:ring-indigo-500 mt-0.5"
                    />
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                        <span>Google Gemini</span>
                        <span className="text-[9px] px-1 py-0.2 bg-indigo-100 text-indigo-700 rounded font-mono font-bold">Gratuito</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        gemini-3.8-flash oficial vía Google AI Studio.
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 text-[10px] font-mono font-semibold text-indigo-700 bg-indigo-100/60 px-2 py-0.5 rounded text-center">
                    {hasGeminiKey ? '✓ Clave Activa' : 'Requiere API Key'}
                  </div>
                </label>

                {/* Claude Option */}
                <label className={`relative flex flex-col justify-between p-3 rounded-xl border-2 cursor-pointer transition ${
                  aiProvider === 'claude' 
                    ? 'border-purple-600 bg-purple-50/50 shadow-xs' 
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}>
                  <div className="flex items-start gap-2.5">
                    <input
                      type="radio"
                      name="aiProvider"
                      value="claude"
                      checked={aiProvider === 'claude'}
                      onChange={() => setAiProvider('claude')}
                      className="text-purple-600 focus:ring-purple-500 mt-0.5"
                    />
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                        <span>Claude 3.7</span>
                        <span className="text-[9px] px-1 py-0.2 bg-purple-100 text-purple-700 rounded font-mono">Anthropic</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {anthropicQuotaExhausted ? 'Créditos agotados en cuenta' : hasAnthropicKey ? 'Clave activa' : 'Requiere API Key'}
                      </p>
                    </div>
                  </div>
                  {anthropicQuotaExhausted ? (
                    <div className="mt-2 text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded text-center">
                      ⚠️ Cuota agotada
                    </div>
                  ) : (
                    <div className="mt-2 text-[10px] font-mono font-semibold text-purple-700 bg-purple-100/60 px-2 py-0.5 rounded text-center">
                      {hasAnthropicKey ? '✓ Clave Activa' : 'Opcional'}
                    </div>
                  )}
                </label>

                {/* Deterministic Golden Master Option */}
                <label className={`relative flex flex-col justify-between p-3 rounded-xl border-2 cursor-pointer transition ${
                  aiProvider === 'deterministic' 
                    ? 'border-amber-500 bg-amber-50/50 shadow-xs' 
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}>
                  <div className="flex items-start gap-2.5">
                    <input
                      type="radio"
                      name="aiProvider"
                      value="deterministic"
                      checked={aiProvider === 'deterministic'}
                      onChange={() => setAiProvider('deterministic')}
                      className="text-amber-600 focus:ring-amber-500 mt-0.5"
                    />
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                        <span>Golden Master</span>
                        <span className="text-[9px] px-1 py-0.2 bg-amber-100 text-amber-800 rounded font-mono font-bold">Local</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Generador local de contingencia sin conexión a red.
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 text-[10px] font-mono font-semibold text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded text-center">
                    Modo Respaldo
                  </div>
                </label>

              </div>

              <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700">Google Gemini API Key:</label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Estado: {geminiQuotaExhausted ? '⚠️ Saldo agotado en cuenta' : geminiKeyConfiguredStatus}
                  </span>
                </div>
                <PasswordField
                  placeholder="AIzaSy... (o deja en blanco para mantener la actual)"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="bg-white border border-slate-300 text-slate-900 focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                />
                <p className="text-[10px] text-slate-500">
                  Ingresa tu API Key de Google Gemini para reanudar el servicio o actualizar la cuota prepagada.
                </p>
              </div>

              <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700">Anthropic API Key (Claude):</label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Estado: {anthropicQuotaExhausted ? '⚠️ Saldo agotado en cuenta' : anthropicKeyConfiguredStatus}
                  </span>
                </div>
                <PasswordField
                  placeholder="sk-ant-api03-... (o deja en blanco para mantener la actual)"
                  value={anthropicKey}
                  onChange={(e) => setAnthropicKey(e.target.value)}
                  className="bg-white border border-slate-300 text-slate-900 focus:ring-2 focus:ring-purple-500 font-mono text-xs"
                />
                <p className="text-[10px] text-slate-500">
                  Ingresa tu API Key de Anthropic con créditos activos para habilitar Claude 3.7 Sonnet.
                </p>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={savingAiSettings}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {savingAiSettings ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Guardar Configuración de IA</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Configuración de Autenticación & Proveedores Firebase (Exclusivo Administrador) */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-500" />
                <h3 className="font-sans font-bold text-slate-900 text-sm">Autenticación y Seguridad (Firebase Auth)</h3>
              </div>
              <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-mono rounded-full font-bold">
                Acceso Exclusivo de Administrador
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Panel administrativo para gestionar proveedores de identidad de Firebase (Email/Password, Google Sign-In), reglas de autenticación y cuentas autorizadas de consultores.
            </p>

            <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 text-xs text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="font-bold text-slate-900">Habilitar / Gestionar Proveedores de Autenticación</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Configura el método de Email y Contraseña o Google OAuth directamente en la consola oficial de Firebase de este proyecto.
                </p>
              </div>

              <a 
                href="https://console.firebase.google.com/project/gen-lang-client-0662069262/authentication/providers" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition text-xs flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
              >
                <span>Abrir Consola Firebase</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
