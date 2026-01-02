import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency, currencies } from '@/contexts/CurrencyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Language, languageNames, languageFlags } from '@/lib/i18n';
import { Sun, Moon, Check, Users, Globe, Palette, ArrowRight, ArrowLeft, DollarSign } from 'lucide-react';
import { markOnboardingCompleted } from '@/lib/configSync';

const COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const { language, setLanguage, t } = useLanguage();
  const { currency, setCurrency } = useCurrency();
  const { theme, setTheme } = useTheme();
  const { addFamilyMember } = useApp();
  const [step, setStep] = useState(1);
  const [tempMembers, setTempMembers] = useState<Array<{ name: string; color: string }>>([]);
  const [newMemberName, setNewMemberName] = useState('');

  const totalSteps = 4; // Augmenté de 3 à 4 pour inclure la devise

  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang);
  };

  const handleThemeSelect = (selectedTheme: 'light' | 'dark') => {
    setTheme(selectedTheme);
  };

  const handleAddMember = () => {
    if (newMemberName.trim()) {
      const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
      setTempMembers([...tempMembers, { name: newMemberName.trim(), color: randomColor }]);
      setNewMemberName('');
    }
  };

  const handleFinish = async () => {
    // Add family members
    tempMembers.forEach(member => {
      addFamilyMember({
        name: member.name,
        color: member.color,
        role: 'other',
        bloodType: '',
        allergies: [],
        medicalNotes: '',
        vaccines: [],
        emergencyContact: { name: '', phone: '', relation: '' },
      });
    });

    // Marquer l'onboarding comme terminé (mode serveur PostgreSQL uniquement)
    await markOnboardingCompleted(theme as 'light' | 'dark', language);
    onComplete();
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 text-foreground">{t.onboarding.title}</h1>
          <p className="text-foreground/70">{t.onboarding.subtitle}</p>
        </div>

        {/* Progress */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === step ? 'w-12 bg-primary' : 'w-8 bg-primary/20'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Language */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <Globe className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold">{t.onboarding.selectLanguage}</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {(['fr', 'en', 'de', 'es'] as Language[]).map(lang => (
                <Button
                  key={lang}
                  variant={language === lang ? 'default' : 'outline'}
                  size="lg"
                  className="h-20 text-lg justify-start gap-3"
                  onClick={() => handleLanguageSelect(lang)}
                >
                  <span className="text-3xl">{languageFlags[lang]}</span>
                  <span>{languageNames[lang]}</span>
                  {language === lang && <Check className="w-5 h-5 ml-auto" />}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Currency */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <DollarSign className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold">{t.onboarding.selectCurrency}</h2>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {currencies.map(curr => (
                <Button
                  key={curr.code}
                  variant={currency.code === curr.code ? 'default' : 'outline'}
                  size="lg"
                  className="h-16 justify-start gap-3"
                  onClick={() => setCurrency(curr)}
                >
                  <span className="text-2xl font-bold w-12 text-center">{curr.symbol}</span>
                  <div className="flex flex-col items-start">
                    <span className="font-semibold">{curr.name}</span>
                    <span className="text-sm text-muted-foreground">{curr.code}</span>
                  </div>
                  {currency.code === curr.code && <Check className="w-5 h-5 ml-auto" />}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Theme */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <Palette className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold">{t.onboarding.selectTheme}</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                size="lg"
                className="h-32 flex-col gap-3"
                onClick={() => handleThemeSelect('light')}
              >
                <Sun className="w-12 h-12" />
                <span className="text-lg">{t.onboarding.lightMode}</span>
                {theme === 'light' && <Check className="w-5 h-5 absolute top-3 right-3" />}
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                size="lg"
                className="h-32 flex-col gap-3"
                onClick={() => handleThemeSelect('dark')}
              >
                <Moon className="w-12 h-12" />
                <span className="text-lg">{t.onboarding.darkMode}</span>
                {theme === 'dark' && <Check className="w-5 h-5 absolute top-3 right-3" />}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Family Members */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold">{t.onboarding.addFamilyMembers}</h2>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder={t.onboarding.memberName}
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
              />
              <Button onClick={handleAddMember}>{t.onboarding.addMember}</Button>
            </div>

            {tempMembers.length > 0 && (
              <div className="space-y-2">
                {tempMembers.map((member, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                  >
                    <div
                      className="w-8 h-8 rounded-full"
                      style={{ backgroundColor: member.color }}
                    />
                    <span className="font-medium">{member.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto"
                      onClick={() => setTempMembers(tempMembers.filter((_, i) => i !== index))}
                    >
                      {t.delete}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {tempMembers.length === 0 && (
              <div className="text-center py-8 text-foreground/60">
                <Users className="w-16 h-16 mx-auto mb-3 opacity-50" />
                <p>{t.onboarding.addFamilyMembers}</p>
              </div>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={step === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.onboarding.previous}
          </Button>

          <div className="flex gap-2">
            {step === 3 && (
              <Button variant="ghost" onClick={handleFinish}>
                {t.onboarding.skipForNow}
              </Button>
            )}
            <Button onClick={handleNext}>
              {step === totalSteps ? t.onboarding.finish : t.onboarding.next}
              {step < totalSteps && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
