import { Shield, Users, LogOut, UserCheck, HelpCircle } from 'lucide-react';
import { CapricornIcon } from './CapricornLogo';

interface HeaderProps {
  currentRole: 'client' | 'consultor' | 'admin';
  onChangeRole: (role: 'client' | 'consultor' | 'admin') => void;
  activeConsultor?: { id?: string; name: string; email?: string } | null;
  onLogoutConsultor?: () => void;
  onOpenHelp?: () => void;
}

export default function Header({ currentRole, onChangeRole, activeConsultor, onLogoutConsultor, onOpenHelp }: HeaderProps) {
  return (
    <header id="app-header" className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div id="header-brand-icon" className="bg-slate-950/80 border border-amber-600/40 p-2 rounded-xl flex items-center justify-center shadow-sm">
              <CapricornIcon className="w-5 h-5" color="#D9822B" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-sans font-extrabold text-base tracking-wider uppercase text-amber-500">
                  CAPRICORN
                </span>
                <span className="font-sans font-semibold text-xs tracking-normal text-slate-300">
                  Consulting
                </span>
              </div>
              <span className="font-mono text-[10px] text-amber-400/90 uppercase tracking-widest block font-medium">
                CSEA v4.0 · Strategic Execution Assessment
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {activeConsultor && currentRole === 'consultor' && (
              <div className="hidden sm:flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 rounded-lg px-2.5 py-1 text-xs mr-2">
                <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-slate-300 font-medium truncate max-w-[140px]">{activeConsultor.name}</span>
                {onLogoutConsultor && (
                  <button 
                    onClick={onLogoutConsultor} 
                    title="Cerrar sesión de consultor"
                    className="text-slate-400 hover:text-rose-400 transition-colors ml-1 p-0.5"
                  >
                    <LogOut className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

            {onOpenHelp && (
              <button
                id="header-help-btn"
                onClick={onOpenHelp}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-amber-400 hover:text-slate-950 bg-amber-500/10 hover:bg-amber-400 border border-amber-500/30 transition-all flex items-center space-x-1.5 shadow-xs cursor-pointer mr-1"
                title="Abrir Centro de Ayuda y Guía de Uso CSEA v4.0"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Guía de Uso</span>
              </button>
            )}

            <button
              id="role-btn-consultor"
              onClick={() => onChangeRole('consultor')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 flex items-center space-x-1.5 ${
                currentRole === 'consultor'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Consultores</span>
            </button>
            <button
              id="role-btn-admin"
              onClick={() => onChangeRole('admin')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 flex items-center space-x-1.5 ${
                currentRole === 'admin'
                  ? 'bg-slate-700 text-white shadow-sm border border-slate-600'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
