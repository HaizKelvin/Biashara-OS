import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'sw';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    dashboard: 'Dashboard',
    sales: 'Sales',
    expenses: 'Expenses',
    inventory: 'Inventory',
    debts: 'Debts',
    settings: 'Settings',
    ai_advisor: 'AI Advisor',
    total_sales: 'Total Sales',
    profit: 'Net Profit',
    low_stock: 'Low Stock',
    pending_debts: 'Pending Debtor',
    add_sale: 'New Sale',
    reports: 'Reports',
    welcome: 'Habari',
    mpesa_recon: 'M-Pesa Recon',
    invoices: 'Invoices',
  },
  sw: {
    dashboard: 'Dashibodi',
    sales: 'Mauzo',
    expenses: 'Gharama',
    inventory: 'Stoki',
    debts: 'Madeni',
    settings: 'Mipangilio',
    ai_advisor: 'Mshauri wa AI',
    total_sales: 'Jumla ya Mauzo',
    profit: 'Faida Safi',
    low_stock: 'Stoki Chache',
    pending_debts: 'Madeni Amilifu',
    add_sale: 'Mauzo Mpya',
    reports: 'Ripoti',
    welcome: 'Habari gani',
    mpesa_recon: 'Kuhakiki M-Pesa',
    invoices: 'Ankara',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string) => {
    return (translations[language] as any)[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
