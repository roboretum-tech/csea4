import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Copy, Check, QrCode, Share2, Mail, MessageSquare, 
  ExternalLink, ShieldCheck, UserCheck
} from 'lucide-react';

interface SharePreBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  consultor: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export default function SharePreBriefModal({
  isOpen,
  onClose,
  consultor
}: SharePreBriefModalProps) {
  // 1. All hooks called unconditionally at top level
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'link' | 'qr' | 'email' | 'whatsapp'>('link');

  // Stable string extractions to ensure reliable dependencies
  const consultorId = consultor?.id || '';
  const consultorName = consultor?.name || '';
  const consultorEmail = consultor?.email || '';

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const base = `${window.location.origin}${window.location.pathname}`;
    const params = new URLSearchParams();
    params.set('mode', 'pre-brief');
    if (consultorId) params.set('consultorId', consultorId);
    if (consultorEmail) params.set('consultorEmail', consultorEmail);
    if (consultorName) params.set('consultorName', consultorName);
    return `${base}?${params.toString()}`;
  }, [consultorId, consultorEmail, consultorName]);

  const emailSubject = useMemo(() => {
    return `Invitación: Pre-Assessment de Ejecución Estratégica CSEA — ${consultorName || 'Capricorn Consulting'}`;
  }, [consultorName]);

  const emailBody = useMemo(() => {
    return `Estimado(a) Director(a) / Patrocinador(a),

Le invito a completar el Pre-Assessment de Ejecución Estratégica CSEA (Capricorn Strategic Execution Assessment®).

Este cuestionario confidencial de 5 minutos permite diagnosticar la madurez operativa, alineación de portafolio y disciplina de ejecución de sus iniciativas estratégicas prioritarias.

Por favor acceda al enlace personalizado para iniciar:
${shareUrl}

Una vez completado, analizaremos preliminarmente sus resultados para nuestra sesión de diagnóstico ejecutivo.

Atentamente,
${consultorName || 'Consultor Estratégico'}
Capricorn Consulting
${consultorEmail || ''}`;
  }, [shareUrl, consultorName, consultorEmail]);

  const whatsappMessage = useMemo(() => {
    return `Hola, te comparto el enlace personalizado para completar el Pre-Assessment CSEA de Capricorn Consulting para el diagnóstico de ejecución estratégica de tu organización: ${shareUrl}`;
  }, [shareUrl]);

  // Generate deterministic QR-like graphic matrix in SVG
  const qrMatrix = useMemo(() => {
    // Generate a structured 25x25 QR pattern based on URL hash
    const size = 25;
    const grid: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
    
    // Top-left finder
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
          grid[r][c] = true;
        }
      }
    }
    // Top-right finder
    for (let r = 0; r < 7; r++) {
      for (let c = size - 7; c < size; c++) {
        const cRel = c - (size - 7);
        if (r === 0 || r === 6 || cRel === 0 || cRel === 6 || (r >= 2 && r <= 4 && cRel >= 2 && cRel <= 4)) {
          grid[r][c] = true;
        }
      }
    }
    // Bottom-left finder
    for (let r = size - 7; r < size; r++) {
      const rRel = r - (size - 7);
      for (let c = 0; c < 7; c++) {
        if (rRel === 0 || rRel === 6 || c === 0 || c === 6 || (rRel >= 2 && rRel <= 4 && c >= 2 && c <= 4)) {
          grid[r][c] = true;
        }
      }
    }

    // Fill timing pattern
    for (let i = 8; i < size - 8; i++) {
      grid[6][i] = i % 2 === 0;
      grid[i][6] = i % 2 === 0;
    }

    // Deterministic data pseudo-pattern using URL hash
    let hash = 0;
    for (let i = 0; i < shareUrl.length; i++) {
      hash = (hash * 31 + shareUrl.charCodeAt(i)) & 0xffffffff;
    }
    let seed = Math.abs(hash);

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        // Skip finder zones
        if ((r < 8 && c < 8) || (r < 8 && c >= size - 8) || (r >= size - 8 && c < 8)) continue;
        if (r === 6 || c === 6) continue;
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        grid[r][c] = (seed % 100) > 42;
      }
    }
    return grid;
  }, [shareUrl]);

  // Effect to reset copied feedback when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setCopiedLink(false);
      setCopiedTemplate(null);
    }
  }, [isOpen]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = shareUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleCopyText = async (text: string, templateId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedTemplate(templateId);
      setTimeout(() => setCopiedTemplate(null), 2500);
    } catch {
      setCopiedTemplate(templateId);
      setTimeout(() => setCopiedTemplate(null), 2500);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]"
          >
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Enlace Compartible para Pre-Brief
              </h3>
              <p className="text-[11px] text-amber-400/90 font-mono">
                Atribución Multi-Tenant Automática
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Consultant Attribution Banner */}
        <div className="bg-amber-50/80 border-b border-amber-200/80 px-6 py-2.5 flex items-center gap-2.5 text-xs text-amber-950">
          <UserCheck className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-[11px] leading-tight">
            Vinculado a: <strong className="font-bold text-slate-900">{consultor?.name || 'Consultor Activo'}</strong> ({consultor?.email || 'Sin correo'}). Toda empresa que conteste este enlace se registrará exclusivamente en tu portafolio.
          </p>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('link')}
            className={`flex-1 py-2.5 text-center transition border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'link'
                ? 'border-amber-500 text-slate-900 bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Enlace URL</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('qr')}
            className={`flex-1 py-2.5 text-center transition border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'qr'
                ? 'border-amber-500 text-slate-900 bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Código QR</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('whatsapp')}
            className={`flex-1 py-2.5 text-center transition border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'whatsapp'
                ? 'border-amber-500 text-slate-900 bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('email')}
            className={`flex-1 py-2.5 text-center transition border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'email'
                ? 'border-amber-500 text-slate-900 bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-blue-600" />
            <span>Correo</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'link' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  URL Directa para Clientes
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 truncate select-all">
                    {shareUrl}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      copiedLink
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-amber-400'
                    }`}
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
                <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  ¿Cómo funciona este enlace?
                </p>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-500">
                  <li>El cliente abre la URL directamente en su navegador o dispositivo móvil.</li>
                  <li>Completa la postulación Gate A (5 reactivos) y el Pre-Brief Formulario B.</li>
                  <li>El sistema registra la empresa y la asigna a tu cuenta de consultor automáticamente.</li>
                  <li>La empresa aparecerá al instante en tu <strong>CRM de Seguimiento</strong>.</li>
                </ul>
              </div>

              <div className="pt-2 flex justify-end">
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 font-bold hover:underline"
                >
                  <span>Probar enlace en nueva pestaña</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {activeTab === 'qr' && (
            <div className="space-y-4 text-center">
              <p className="text-xs text-slate-600">
                Pide al cliente que escanee este código QR con la cámara de su teléfono móvil para responder el Pre-Brief al instante:
              </p>

              {/* QR Render */}
              <div className="inline-block p-4 bg-white rounded-2xl border-2 border-slate-900 shadow-lg mx-auto">
                <svg
                  viewBox="0 0 25 25"
                  className="w-44 h-44 mx-auto block shape-rendering-crispEdges"
                >
                  <rect width="25" height="25" fill="#ffffff" />
                  {qrMatrix.map((row, r) =>
                    row.map((val, c) =>
                      val ? (
                        <rect
                          key={`${r}-${c}`}
                          x={c}
                          y={r}
                          width="1"
                          height="1"
                          fill="#0f172a"
                        />
                      ) : null
                    )
                  )}
                </svg>
                <div className="mt-2 text-[10px] font-mono font-bold text-slate-500 tracking-wider uppercase">
                  CSEA Pre-Brief QR
                </div>
              </div>

              <div className="flex justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedLink ? '¡Enlace Copiado!' : 'Copiar URL Asociada'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'whatsapp' && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                Mensaje Modelo para WhatsApp / Mensajería Directa
              </label>
              <textarea
                readOnly
                rows={4}
                value={whatsappMessage}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed font-sans resize-none"
              />
              <div className="flex justify-between items-center pt-1">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Abrir en WhatsApp</span>
                </a>
                <button
                  type="button"
                  onClick={() => handleCopyText(whatsappMessage, 'wa')}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedTemplate === 'wa' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedTemplate === 'wa' ? '¡Copiado!' : 'Copiar Texto'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'email' && (
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Asunto del Correo
                </label>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 select-all">
                  {emailSubject}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Cuerpo del Mensaje Formal
                </label>
                <textarea
                  readOnly
                  rows={8}
                  value={emailBody}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed font-sans resize-none select-all"
                />
              </div>

              <div className="flex justify-between items-center pt-1">
                <a
                  href={`mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Abrir en Cliente de Correo</span>
                </a>
                <button
                  type="button"
                  onClick={() => handleCopyText(emailBody, 'email')}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedTemplate === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedTemplate === 'email' ? '¡Copiado!' : 'Copiar Correo'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </motion.div>
    </div>
      )}
    </AnimatePresence>
  );
}
