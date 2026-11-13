import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import Header from './components/Header';
import ClientPortal from './components/ClientPortal';
import ConsultantPortal from './components/ConsultantPortal';
import AdminPortal from './components/AdminPortal';
import AuthConsultorModal from './components/AuthConsultorModal';
import HelpTutorialModal from './components/HelpTutorialModal';
import { Applicant, Consultor } from './types';
import { safeFetchJson } from './utils/apiClient';
import { auth, onAuthStateChanged, signOut } from './firebaseClient';

import { CapricornIcon } from './components/CapricornLogo';
export default function App() {
  const [currentRole, setCurrentRole] = useState<'client' | 'consultor' | 'admin'>(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('mode') === 'pre-brief') {
          return 'client';
        }
      }
    } catch {
      // Ignored
    }
    return 'consultor';
  });
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [consultores, setConsultores] = useState<Consultor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // Active Consultant identity and multi-tenant isolation
  const [activeConsultor, setActiveConsultor] = useState<{ id: string; name: string; email: string } | null>(() => {
    try {
      const saved = localStorage.getItem('csea_active_consultor');
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignored
    }
    return null;
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Sync activeConsultor with localStorage
  useEffect(() => {
    if (activeConsultor) {
      localStorage.setItem('csea_active_consultor', JSON.stringify(activeConsultor));
    } else {
      localStorage.removeItem('csea_active_consultor');
    }
  }, [activeConsultor]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setActiveConsultor(prev => ({
          id: firebaseUser.uid,
          name: prev?.name || firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0].replace(/[._-]/g, ' ') : 'Consultor Estratégico'),
          email: firebaseUser.email || ''
        }));
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch database information with strict tenant isolation
  const fetchDB = async () => {
    try {
      if (currentRole === 'consultor' && !activeConsultor) {
        setApplicants([]);
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      if (activeConsultor?.id) params.set('consultorId', activeConsultor.id);
      if (activeConsultor?.email) params.set('consultorEmail', activeConsultor.email);
      if (currentRole === 'admin') params.set('role', 'admin');

      const queryString = params.toString();
      const url = queryString ? `/api/db?${queryString}` : '/api/db';

      const { ok, data, error } = await safeFetchJson<{ applicants: Applicant[]; consultores: Consultor[] }>(url);
      if (ok && data) {
        setApplicants(data.applicants || []);
        setConsultores(data.consultores || []);
      } else {
        console.warn('Error fetching database:', error);
      }
    } catch (err) {
      console.error('Error fetching database:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDB();
  }, [activeConsultor?.id, activeConsultor?.email, currentRole]);

  const handleLogoutConsultor = async () => {
    try {
      await signOut(auth);
    } catch {
      // Ignored
    }
    localStorage.removeItem('csea_active_consultor');
    setActiveConsultor(null);
  };

  const handleUpdateApplicantInList = (updated: Applicant) => {
    setApplicants(prev => {
      const index = prev.findIndex(a => a.id === updated.id);
      if (index === -1) {
        return [...prev, updated];
      }
      const next = [...prev];
      next[index] = updated;
      return next;
    });
  };

  const handleDeleteApplicant = async (id: string): Promise<boolean> => {
    try {
      const headers: Record<string, string> = {};
      if (activeConsultor?.id) headers['x-consultor-id'] = activeConsultor.id;
      if (activeConsultor?.email) headers['x-consultor-email'] = activeConsultor.email;
      if (currentRole === 'admin') headers['x-admin-auth'] = 'true';

      const { ok, data, error } = await safeFetchJson<{ success: boolean; error?: string }>(`/api/applicants/${id}`, {
        method: 'DELETE',
        headers
      });
      if (ok && data?.success) {
        setApplicants(prev => prev.filter(a => a.id !== id));
        return true;
      } else {
        console.error('Error deleting applicant:', error || data?.error);
        return false;
      }
    } catch (err) {
      console.error('Error deleting applicant:', err);
      return false;
    }
  };

  const handleAddConsultor = async (name: string, password?: string): Promise<boolean> => {
    try {
      const { ok, data, error } = await safeFetchJson<{ success: boolean; consultores: Consultor[]; error?: string }>('/api/consultores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password })
      });
      if (ok && data?.success) {
        setConsultores(data.consultores);
        return true;
      } else {
        console.error('Error adding consultor:', error || data?.error);
        return false;
      }
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleDeleteConsultor = async (name: string): Promise<boolean> => {
    try {
      const { ok, data, error } = await safeFetchJson<{ success: boolean; consultores: Consultor[]; error?: string }>(`/api/consultores?name=${encodeURIComponent(name)}`, {
        method: 'DELETE'
      });
      if (ok && data?.success) {
        setConsultores(data.consultores);
        return true;
      } else {
        console.error('Error deleting consultor:', error || data?.error);
        return false;
      }
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleNavigateFromHelp = (module: 'client' | 'consultor' | 'admin' | 'auth_modal') => {
    setIsHelpModalOpen(false);
    if (module === 'auth_modal') {
      setCurrentRole('consultor');
      setIsAuthModalOpen(true);
    } else {
      setCurrentRole(module);
    }
  };

  return (
    <div id="app-viewport" className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-amber-200 text-slate-800">
      <Header 
        currentRole={currentRole} 
        onChangeRole={setCurrentRole} 
        activeConsultor={activeConsultor}
        onLogoutConsultor={handleLogoutConsultor}
        onOpenHelp={() => setIsHelpModalOpen(true)}
      />

      <main className="flex-grow">
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-2">
              <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">
                Cargando Plataforma CSEA v4.0...
              </p>
            </div>
          </div>
        ) : (
          <div>
            {currentRole === 'client' && (
              <ClientPortal 
                onSuccessSubmission={handleUpdateApplicantInList} 
              />
            )}
            {currentRole === 'consultor' && (
              <ConsultantPortal 
                applicants={applicants} 
                consultores={consultores}
                activeConsultor={activeConsultor}
                onRefresh={fetchDB}
                onUpdateApplicant={handleUpdateApplicantInList}
                onDeleteApplicant={handleDeleteApplicant}
                onOpenAuthModal={() => setIsAuthModalOpen(true)}
              />
            )}
            {currentRole === 'admin' && (
              <AdminPortal 
                applicants={applicants}
                consultores={consultores}
                onRefresh={fetchDB}
                onAddConsultor={handleAddConsultor}
                onDeleteConsultor={handleDeleteConsultor}
              />
            )}
          </div>
        )}
      </main>

      <AuthConsultorModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        consultores={consultores}
        onSuccessAuth={(consultorInfo) => {
          setActiveConsultor(consultorInfo);
          setIsAuthModalOpen(false);
        }}
      />

      <HelpTutorialModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        onNavigateToModule={handleNavigateFromHelp}
      />

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-6 text-center text-xs font-sans mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-slate-950 p-1.5 rounded-lg border border-amber-600/30">
              <CapricornIcon className="w-5 h-5" color="#D9822B" />
            </div>
            <div className="text-left">
              <p className="font-bold text-slate-200">Capricorn Consulting</p>
              <p className="text-[10px] text-slate-500">Corporate Strategy Execution Assessment (CSEA 3.2)</p>
            </div>
          </div>
          <div className="text-slate-500 text-[10px]">
            Desarrollado para Empresas en Crecimiento (PYMES). Todos los derechos reservados © {new Date().getFullYear()}.
          </div>
        </div>
      </footer>
    </div>
  );
}
