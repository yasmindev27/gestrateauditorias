import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AIHTab } from '@/components/aih/AIHTab';
import { MovDocTab } from '@/components/aih/MovDocTab';
import { RelatoriosTab } from '@/components/aih/RelatoriosTab';
import { OficioTab } from '@/components/aih/OficioTab';
import { cn } from '@/lib/utils';
import { FileSpreadsheet, FileText, BarChart3, ScrollText, LogOut, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logoGestrategic from '@/assets/logo-gestrategic.jpg';

// Usuários somente visualização
const VIEWER_USERS = ['karine'];

type TabKey = 'aih' | 'movdoc' | 'relatorios' | 'oficio';

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'aih', label: 'Controle de AIH', icon: FileSpreadsheet },
  { key: 'movdoc', label: 'Movimentação de AIH', icon: FileText },
  { key: 'relatorios', label: 'Relatórios', icon: BarChart3 },
  { key: 'oficio', label: 'Criar Ofício', icon: ScrollText },
];

const AIHApp = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('aih');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isViewer, setIsViewer] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/auth');
      } else {
        const email = session.user.email ?? '';
        setUserEmail(email);
        const username = email.split('@')[0].toLowerCase();
        setIsViewer(VIEWER_USERS.includes(username));
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate('/auth');
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const username = userEmail?.split('@')[0] ?? '';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bg-hospital-header-bg text-primary-foreground shadow-md">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src={logoGestrategic} alt="Gestrategic" className="h-8 w-8 rounded object-cover" />
            <div>
              <h1 className="text-base font-bold leading-tight tracking-tight">Controle AIH</h1>
              <p className="text-xs text-white/60 leading-none">Gestrategic · Tecnologia em Saúde</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {username && (
              <div className="hidden sm:flex items-center gap-1.5">
                <span className="text-xs text-white/60 capitalize">{username}</span>
                {isViewer && (
                  <span className="flex items-center gap-1 text-[10px] bg-white/10 text-white/70 px-1.5 py-0.5 rounded">
                    <Eye className="w-3 h-3" /> visualização
                  </span>
                )}
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-white/80 hover:text-white hover:bg-white/10 gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Tab navigation */}
      <nav className="bg-card border-b border-border px-4 sm:px-6 flex items-center gap-0 overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap",
              activeTab === key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'aih' && <AIHTab readOnly={isViewer} />}
        {activeTab === 'movdoc' && <MovDocTab readOnly={isViewer} />}
        {activeTab === 'relatorios' && <RelatoriosTab />}
        {activeTab === 'oficio' && <OficioTab readOnly={isViewer} />}
      </main>
    </div>
  );
};

export default AIHApp;
