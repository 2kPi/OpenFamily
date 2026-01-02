import { Settings, Home, ArrowLeft, Plus, BarChart3 } from 'lucide-react';
import { useAddButton } from '@/contexts/AddButtonContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface NavigationProps {
  currentPage: 'home' | 'shopping' | 'tasks' | 'tasks-kanban' | 'appointments' | 'settings' | 'recipes' | 'meals' | 'budget' | 'statistics';
  onPageChange: (page: 'home' | 'shopping' | 'tasks' | 'tasks-kanban' | 'appointments' | 'settings' | 'recipes' | 'meals' | 'budget' | 'statistics') => void;
  onSearchClick?: () => void;
}

export default function Navigation({ currentPage, onPageChange, onSearchClick }: NavigationProps) {
  const { onAddClick } = useAddButton();
  const { t } = useLanguage();

  const handleBack = () => {
    // Si on est sur la page d'accueil, ne rien faire
    if (currentPage === 'home') return;
    
    // Sinon retourner à l'accueil
    onPageChange('home');
  };

  const handleAddClick = () => {
    // Appeler l'action définie par la page active
    if (onAddClick) {
      onAddClick();
    }
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-40 shadow-lg">
        <div className="flex items-center justify-around h-20 px-2">
          {/* Bouton Accueil */}
          <button
            onClick={() => onPageChange('home')}
            className={`flex flex-col items-center justify-center gap-1 w-20 h-full transition-colors relative ${
              currentPage === 'home'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Home className="w-6 h-6" />
            <span className="text-xs font-medium">{t.navigation.home}</span>
            {currentPage === 'home' && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-primary rounded-b" />
            )}
          </button>

          {/* Bouton Retour */}
          <button
            onClick={handleBack}
            className={`flex flex-col items-center justify-center gap-1 w-20 h-full transition-colors ${
              currentPage === 'home'
                ? 'text-muted-foreground/50'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            disabled={currentPage === 'home'}
          >
            <ArrowLeft className="w-6 h-6" />
            <span className="text-xs font-medium">{t.navigation.back}</span>
          </button>

          {/* Bouton + central surélevé */}
          <button
            onClick={handleAddClick}
            className="flex flex-col items-center justify-center -mt-8 relative"
          >
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl transition-all hover:scale-110 border-4 border-background">
              <Plus className="w-8 h-8 text-primary-foreground" />
            </div>
            <span className="text-xs font-medium text-primary mt-1">{t.navigation.add}</span>
          </button>

          {/* Bouton Statistiques */}
          <button
            onClick={() => onPageChange('statistics')}
            className={`flex flex-col items-center justify-center gap-1 w-20 h-full transition-colors relative ${
              currentPage === 'statistics'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BarChart3 className="w-6 h-6" />
            <span className="text-xs font-medium">{t.navigation.stats}</span>
            {currentPage === 'statistics' && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-primary rounded-b" />
            )}
          </button>

          {/* Bouton Paramètres */}
          <button
            onClick={() => onPageChange('settings')}
            className={`flex flex-col items-center justify-center gap-1 w-20 h-full transition-colors relative ${
              currentPage === 'settings'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Settings className="w-6 h-6" />
            <span className="text-xs font-medium">{t.navigation.settings}</span>
            {currentPage === 'settings' && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-primary rounded-b" />
            )}
          </button>
        </div>
      </nav>
    </>
  );
}
