import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Currency {
  code: string;
  symbol: string;
  name: string;
}

export const currencies: Currency[] = [
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'GBP', symbol: '£', name: 'Pound Sterling' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
];

// Helper function to get translated currency name
export const getCurrencyName = (code: string, t: any): string => {
  return t.settings.currencies[code] || code;
};

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatPrice: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface CurrencyProviderProps {
  children: ReactNode;
}

export function CurrencyProvider({ children }: CurrencyProviderProps) {
  const [currency, setCurrencyState] = useState<Currency>(currencies[0]); // Default to EUR

  useEffect(() => {
    // Load currency from localStorage on mount
    const saved = localStorage.getItem('currency');
    if (saved) {
      const parsedCurrency = JSON.parse(saved);
      const foundCurrency = currencies.find(c => c.code === parsedCurrency.code);
      if (foundCurrency) {
        setCurrencyState(foundCurrency);
      }
    }
  }, []);

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    localStorage.setItem('currency', JSON.stringify(newCurrency));
  };

  const formatPrice = (amount: number): string => {
    // Ensure amount is a valid number
    const validAmount = Number(amount) || 0;
    
    if (currency.code === 'JPY' || currency.code === 'CNY') {
      // No decimals for Yen and Yuan
      return `${Math.round(validAmount)} ${currency.symbol}`;
    }
    
    if (currency.code === 'USD' || currency.code === 'CAD' || currency.code === 'AUD') {
      // Dollar signs before the amount
      return `${currency.symbol}${validAmount.toFixed(2)}`;
    }
    
    // Default format: amount + symbol (for EUR, GBP, CHF)
    return `${validAmount.toFixed(2)} ${currency.symbol}`;
  };

  return (
    <CurrencyContext.Provider value={{
      currency,
      setCurrency,
      formatPrice,
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}