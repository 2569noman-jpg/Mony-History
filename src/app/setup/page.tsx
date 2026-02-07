"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Setup() {
  const [income, setIncome] = useState("");
  const [savingsGoal, setSavingsGoal] = useState("");
  const [currency, setCurrency] = useState<'BDT' | 'USD' | 'EUR' | 'GBP' | 'INR' | 'SAR'>('BDT');
  const router = useRouter();

  const CURRENCIES = {
    BDT: { symbol: "৳", name: "Bangladeshi Taka" },
    USD: { symbol: "$", name: "US Dollar" },
    EUR: { symbol: "€", name: "Euro" },
    GBP: { symbol: "£", name: "British Pound" },
    INR: { symbol: "₹", name: "Indian Rupee" },
    SAR: { symbol: "SR", name: "Saudi Riyal" }
  };

  const t = {
    en: {
      setup_title: "Setup Budget",
      setup_subtitle: "Let's plan your monthly finances",
      select_currency: "Select Currency",
      monthly_income: "Monthly Credit",
      savings_goal: "Monthly Savings Goal",
      placeholder_income: "e.g. 50000+5000",
      placeholder_savings: "e.g. 10000+2000",
      result: "Result",
      start_tracking: "Start Tracking",
      go_back: "Go Back"
    },
    bn: {
      setup_title: "বাজেট সেটআপ",
      setup_subtitle: "আপনার মাসিক আর্থিক পরিকল্পনা শুরু করুন",
      select_currency: "কারেন্সি নির্বাচন করুন",
      monthly_income: "মাসিক ক্রেডিট",
      savings_goal: "মাসিক সঞ্চয় লক্ষ্য",
      placeholder_income: "যেমন: ৫০০০০+৫০০০",
      placeholder_savings: "যেমন: ১০০০০+২০০০",
      result: "ফলাফল",
      start_tracking: "ট্র্যাকিং শুরু করুন",
      go_back: "ফিরে যান"
    }
  };

  const [lang, setLang] = useState<'en' | 'bn'>('en');

  useEffect(() => {
    const savedLang = localStorage.getItem("money_history_lang") as 'en' | 'bn';
    if (savedLang) setLang(savedLang);
    
    const savedCurrency = localStorage.getItem("money_history_currency");
    if (savedCurrency) setCurrency(savedCurrency as any);
    
    const savedTheme = localStorage.getItem("money_history_theme");
    const themeToApply = savedTheme || 'dark';
    document.documentElement.classList.toggle('dark', themeToApply === 'dark');
  }, []);

  const currentT = t[lang];

  const handleSave = () => {
    const finalIncome = Number(evaluateExpression(income));
    const finalSavings = Number(evaluateExpression(savingsGoal));
    
    if (!finalIncome || !finalSavings) return;
    
    localStorage.setItem("money_history_currency", currency);
    localStorage.setItem("money_history_setup", JSON.stringify({
      totalIncome: finalIncome,
      savingsGoal: finalSavings,
      setupDate: new Date().toISOString(),
      autoAdjustSavings: true,
      fixedExpenses: []
    }));
    router.push("/");
  };

  const evaluateExpression = (input: string): string => {
    try {
      // Clean input: allow only numbers, operators, dots and parentheses
      // Also treat spaces as '+' for easier list calculation
      const cleaned = input.trim().replace(/\s+/g, '+').replace(/[^\d\+\-\*\/\.\(\)]/g, '');
      if (!cleaned) return input;
      
      // Basic validation to prevent injection or invalid math
      if (/^[\d\+\-\*\/\.\(\)]+$/.test(cleaned)) {
        // Safe evaluation using Function constructor for basic math
        const result = new Function(`return ${cleaned}`)();
        return isFinite(result) ? result.toString() : input;
      }
      return input;
    } catch (e) {
      return input;
    }
  };

  const formatAmount = (amount: number | string) => {
    const num = Number(amount) || 0;
    return num.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  };

  const currencySymbol = CURRENCIES[currency].symbol;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-background" suppressHydrationWarning>
      <main className="w-full max-w-md flex flex-col gap-8">
        <div className="text-center mb-4">
          <h1 className="text-4xl font-black text-foreground mb-2 tracking-tight">{currentT.setup_title}</h1>
          <p className="text-foreground/80 font-medium">{currentT.setup_subtitle}</p>
        </div>

        <div className="modern-card p-8 flex flex-col gap-8 shadow-xl">
          <div className="flex flex-col gap-3">
            <label className="text-xs font-black text-foreground/70 ml-1 uppercase tracking-[0.2em]">
              {currentT.select_currency}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(CURRENCIES) as Array<keyof typeof CURRENCIES>).map((curr) => (
                <button
                  key={curr}
                  onClick={() => setCurrency(curr)}
                  className={`py-3 rounded-2xl text-xs font-black transition-all border-2 ${
                    currency === curr 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                      : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400'
                  }`}
                >
                  {CURRENCIES[curr].symbol} {curr}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-xs font-black text-foreground/70 ml-1 uppercase tracking-[0.2em]">
              {currentT.monthly_income}
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="text"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                onBlur={(e) => {
                  const evaluated = evaluateExpression(e.target.value);
                  setIncome(evaluated);
                }}
                placeholder={currentT.placeholder_income}
                className="modern-input w-full pl-6 pr-12 py-5 text-2xl font-black outline-none border-2 border-foreground/5 focus:border-accent-primary transition-all text-left"
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-foreground/50 font-black text-xl">{currencySymbol}</span>
            </div>
            {income && (
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest ml-1 animate-in fade-in slide-in-from-top-1">
                {currentT.result}: {currencySymbol}{formatAmount(evaluateExpression(income))}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-xs font-black text-foreground/70 ml-1 uppercase tracking-[0.2em]">
              {currentT.savings_goal}
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="text"
                value={savingsGoal}
                onChange={(e) => setSavingsGoal(e.target.value)}
                onBlur={(e) => {
                  const evaluated = evaluateExpression(e.target.value);
                  setSavingsGoal(evaluated);
                }}
                placeholder={currentT.placeholder_savings}
                className="modern-input w-full pl-6 pr-12 py-5 text-2xl font-black outline-none border-2 border-foreground/5 focus:border-accent-primary transition-all text-left"
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-foreground/50 font-black text-xl">{currencySymbol}</span>
            </div>
            {savingsGoal && (
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest ml-1 animate-in fade-in slide-in-from-top-1">
                {currentT.result}: {currencySymbol}{formatAmount(evaluateExpression(savingsGoal))}
              </p>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={!income || !savingsGoal}
            className="modern-button py-5 text-xl font-black disabled:opacity-30 disabled:cursor-not-allowed mt-4 shadow-lg active:scale-[0.98] transition-transform"
          >
            {currentT.start_tracking}
          </button>
        </div>

        <button 
          onClick={() => router.back()}
          className="text-foreground/60 font-black uppercase tracking-widest text-xs hover:text-foreground transition-colors flex items-center justify-center gap-2"
        >
          <span>←</span> {currentT.go_back}
        </button>
      </main>
    </div>
  );
}
