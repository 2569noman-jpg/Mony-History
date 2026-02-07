"use client";

import React, { useMemo, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

import { 
  ResponsiveContainer, PieChart, Pie, Cell, 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, BarChart, Bar, AreaChart, Area 
} from 'recharts';
import { 
  Plus, Search, Filter, ArrowUpCircle, ArrowDownCircle, 
  Wallet, TrendingUp, Calendar, ChevronDown, 
  Settings, Trash2, Download, Globe, Moon, Sun, MapPin,
  CheckCircle2, CreditCard, Banknote, Landmark,
  MessageCircle, ShieldCheck, Key, RefreshCw, Bell, Camera, Shield, User, HelpCircle, LogOut, Pencil, Info, Lock, Unlock, Delete,
  Home as HomeIcon, Zap, Wifi, Dumbbell, Tv,
  PieChart as PieChartIcon
} from 'lucide-react';

interface Transaction {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  type: 'income' | 'expense';
  account: 'Cash' | 'bKash' | 'Bank';
  note?: string;
}

interface FixedExpense {
  id: string;
  name: string;
  amount: number;
}

interface SetupData {
  totalIncome: number;
  savingsGoal: number;
  fixedExpenses: FixedExpense[];
  autoAdjustSavings: boolean;
  setupDate: string;
}

interface Repayment {
  id: string;
  debtId: string;
  amount: number;
  date: string;
  note?: string;
}

interface Debt {
  id: string;
  person: string;
  amount: number;
  type: 'owe' | 'lent'; // owe: I owe them (আমি দেব), lent: They owe me (আমি পাব)
  note?: string;
  date: string;
  status: 'pending' | 'settled';
  repayments: Repayment[];
}

const CATEGORIES = ["Food", "Transport", "Shopping", "Bills", "Health", "Salary", "Gift", "Invest", "Business", "Freelance", "Others"];
const INCOME_CATEGORIES = ["Salary", "Business", "Freelance", "Invest", "Gift", "Others"];
const EXPENSE_CATEGORIES = ["Food", "Transport", "Shopping", "Bills", "Health", "Others"];

const ACCOUNTS = ["Cash", "bKash", "Bank"];

const CATEGORY_ICONS: Record<string, string> = {
  "Food": "🍔",
  "Transport": "🚗",
  "Shopping": "🛍️",
  "Bills": "📄",
  "Health": "🏥",
  "Salary": "💰",
  "Gift": "🎁",
  "Invest": "📈",
  "Business": "🏢",
  "Freelance": "💻",
  "Others": "💸"
};

const CURRENCIES = {
  BDT: { symbol: "৳", name: "Bangladeshi Taka" },
  USD: { symbol: "$", name: "US Dollar" },
  EUR: { symbol: "€", name: "Euro" },
  GBP: { symbol: "£", name: "British Pound" },
  INR: { symbol: "₹", name: "Indian Rupee" },
  SAR: { symbol: "SR", name: "Saudi Riyal" }
};

const EXPENSE_SUGGESTIONS = [
  { title: "Breakfast", category: "Food" },
  { title: "Lunch", category: "Food" },
  { title: "Dinner", category: "Food" },
  { title: "Bus Fare", category: "Transport" },
  { title: "Rickshaw", category: "Transport" },
  { title: "CNG/Uber", category: "Transport" },
  { title: "Grocery", category: "Shopping" },
  { title: "Tea & Snacks", category: "Food" },
  { title: "Mobile Recharge", category: "Bills" },
  { title: "Medicine", category: "Health" }
];

const INCOME_SUGGESTIONS = [
  { title: "Salary", category: "Salary" },
  { title: "Freelancing", category: "Salary" },
  { title: "Gift", category: "Gift" },
  { title: "Bonus", category: "Gift" },
  { title: "Profit", category: "Salary" }
];

const SAVINGS_TIPS = {
  en: [
    { text: "Small daily savings create a massive fortune over time.", icon: "💰" },
    { text: "Don't save what is left after spending; spend what is left after saving.", icon: "🎯" },
    { text: "Every {symbol}100 saved today is a step towards your financial freedom.", icon: "🚀" },
    { text: "A budget tells your money where to go instead of wondering where it went.", icon: "📊" },
    { text: "If you save {symbol}50 daily, you'll have {symbol}18,250 in a year!", icon: "📈" }
  ],
  bn: [
    { text: "প্রতিদিনের ছোট ছোট সঞ্চয় ভবিষ্যতে বড় মূলধন তৈরি করে।", icon: "💰" },
    { text: "খরচ করার পর যা থাকে তা সঞ্চয় করবেন না, বরং সঞ্চয় করার পর যা থাকে তা খরচ করুন।", icon: "🎯" },
    { text: "আজকের জমানো {symbol}১০০ আপনার আর্থিক স্বাধীনতার পথে একটি বড় ধাপ।", icon: "🚀" },
    { text: "বাজেট আপনার টাকাকে পথ দেখায়, যাতে আপনাকে ভাবতে না হয় টাকা কোথায় গেল।", icon: "📊" },
    { text: "প্রতিদিন {symbol}৫০ জমালে বছরে আপনার সঞ্চয় হবে {symbol}১৮,২৫০!", icon: "📈" }
  ]
};

const TRANSLATIONS = {
  en: {
    home: "Home",
    stats: "Stats",
    history: "History",
    profile: "Profile",
    add: "Add",
    income: "Credit",
    expense: "Debit",
    today_allowance: "Today you can safely spend",
    remaining: "Remaining",
    spent: "Debit",
    saved: "Saved",
    monthly_summary: "Monthly Summary",
    recent_activity: "Recent Activity",
    no_activity: "Your recent transactions will appear here.",
    no_spending: "Tap '+ Add Debit' to log your first spending.",
    see_all: "See All",
    budget_settings: "Budget Settings",
    app_settings: "App Settings",
    data_security: "Data & Security",
    clear_history: "Reset All App Data",
    search_placeholder: "Search by note...",
    language: "Language",
    currency: "Currency",
    theme: "Theme",
    export: "Export CSV",
    confirm_clear: "Are you sure? This will delete all history!",
    fixed_expenses: "Fixed Debits",
    monthly_income: "Monthly Credit",
    savings_goal: "Savings Goal",
    daily_limit: "Daily Limit",
    auto_adjust: "Auto-adjust Savings",
    available_daily: "Available for Daily Spending",
    planned_savings: "Planned Savings",
    current_savings: "Current Savings",
    bonus: "bonus",
    penalty: "penalty",
    daily_habit_bonus: "bonus from daily habits",
    daily_habit_penalty: "penalty from daily habits",
    based_on_budget: "Based on your budget and savings goal",
    spent_today: "Debit today",
    left: "Left",
    more_options: "More Options",
    close: "Close",
    fixed_deducted: "Deducted at start of month",
    fixed_breakdown: "Fixed Debits Breakdown",
    total_transactions: "Total Transactions",
    active_days: "Active Days",
    avg_daily_spend: "Avg. Daily Debit",
    support_feedback: "Support & Feedback",
    backup_data: "Backup Data",
    restore_data: "Restore Data",
    smart_insight: "Smart Insight",
    potential_savings: "Potential Savings",
    daily_saving_of: "If you save ",
    monthly_result: " extra daily, you'll have ",
    yearly_result: " in a month and ",
    end_of_year: " by end of year.",
    planner: "Planner",
    financial_overview: "Financial Overview",
    monthly_report: "Monthly Report",
    yearly_report: "Yearly Report",
    total_income: "Total Credit",
    total_expense: "Total Debit",
    total_savings: "Total Savings",
    goal_projection: "Goal Projection",
    time_to_goal: "Time to Reach Goal",
    months_days: "months and days",
    current_pace: "At your current pace",
    days: "days",
    months: "months",
    savings_usage: "What's this for?",
    set_goal_description: "Saving for something special?",
    set_goal: "Set Goal",
    my_goal: "My Financial Goal",
    target: "Target",
    projection: "Estimated Time",
    yearly_breakdown: "Yearly Breakdown",
    no_data: "No data available",
    save: "Save",
    savings: "Savings",
    spending_trend: "Spending Trend",
    app_lock: "App Lock",
    set_pin: "Set PIN",
    enter_pin: "Enter PIN",
    verify_pin: "Verify PIN",
    confirm_pin: "Confirm PIN",
    pin_mismatch: "PIN mismatch!",
    lock_enabled: "App Lock Enabled",
    lock_disabled: "App Lock Disabled",
    wrong_pin: "Wrong PIN!",
    security: "Security",
    enable_lock: "Enable Lock",
    disable_lock: "Disable Lock",
    debts_loans: "Debts & Loans",
    i_owe: "I Owe (Debt)",
    they_owe: "They Owe (Credit)",
    person_name: "Person Name",
    amount: "Amount",
    note: "Note",
    date: "Date",
    total_amount: "Total Amount",
    repayments: "Repayment History",
    add_debt: "Add Debt/Loan",
    add_repayment: "Add Repayment",
    settled: "Settled",
    pending: "Pending",
    purpose: "Purpose",
    total_debt: "Total Debt",
    total_credit: "Total Credit",
    no_debts: "No active debts or loans found.",
    remaining_balance: "Remaining",
    payment_date: "Payment Date",
    delete_debt_confirm: "Are you sure you want to delete this record?",
  },
  bn: {
    home: "হোম",
    stats: "পরিসংখ্যান",
    history: "ইতিহাস",
    profile: "প্রোফাইল",
    add: "যোগ করুন",
    income: "ক্রেডিট (Credit)",
    expense: "ডেবিট (Debit)",
    today_allowance: "আজ আপনি নিরাপদে খরচ করতে পারেন",
    remaining: "অবশিষ্ট",
    spent: "ডেবিট হয়েছে",
    saved: "সঞ্চয়",
    monthly_summary: "মাসিক সারসংক্ষেপ",
    recent_activity: "সাম্প্রতিক কার্যক্রম",
    no_activity: "আপনার সাম্প্রতিক লেনদেন এখানে দেখা যাবে।",
    no_spending: "প্রথম খরচ যোগ করতে '+ ডেবিট যোগ করুন' ট্যাপ করুন।",
    see_all: "সব দেখুন",
    budget_settings: "বাজেট সেটিংস",
    app_settings: "অ্যাপ সেটিংস",
    data_security: "ডেটা ও নিরাপত্তা",
    clear_history: "অ্যাপ রিসেট করুন",
    search_placeholder: "নোট দিয়ে খুঁজুন...",
    language: "ভাষা",
    currency: "মুদ্রা",
    theme: "থিম",
    export: "CSV এক্সপোর্ট",
    confirm_clear: "আপনি কি নিশ্চিত? এটি সব ইতিহাস মুছে ফেলবে!",
    fixed_expenses: "স্থায়ী ডেবিট",
    monthly_income: "মাসিক ক্রেডিট",
    savings_goal: "সঞ্চয় লক্ষ্য",
    daily_limit: "দৈনিক লিমিট",
    auto_adjust: "সঞ্চয় অটো-অ্যাডজাস্ট",
    available_daily: "দৈনিক খরচের জন্য আছে",
    planned_savings: "পরিকল্পিত সঞ্চয়",
    current_savings: "বর্তমান সঞ্চয়",
    bonus: "বোনাস",
    penalty: "পেনাল্টি",
    daily_habit_bonus: "দৈনিক অভ্যাস থেকে বোনাস",
    daily_habit_penalty: "দৈনিক অভ্যাস থেকে পেনাল্টি",
    based_on_budget: "আপনার বাজেট এবং সঞ্চয় লক্ষ্যের উপর ভিত্তি করে",
    spent_today: "আজ ডেবিট হয়েছে",
    left: "বাকি",
    more_options: "আরও অপশন",
    close: "বন্ধ করুন",
    fixed_deducted: "মাসের শুরুতেই কেটে রাখা হয়েছে",
    fixed_breakdown: "স্থায়ী ডেবিট এর হিসাব",
    total_transactions: "মোট লেনদেন",
    active_days: "সক্রিয় দিন",
    avg_daily_spend: "গড় দৈনিক ডেবিট",
    support_feedback: "সহায়তা ও ফিডব্যাক",
    backup_data: "ব্যাকআপ ডেটা",
    restore_data: "ডেটা রিস্টোর",
    smart_insight: "স্মার্ট ইনসাইট",
    potential_savings: "সম্ভাব্য সঞ্চয়",
    daily_saving_of: "যদি আপনি প্রতিদিন অতিরিক্ত ",
    monthly_result: " জমান, তবে মাসে ",
    yearly_result: " এবং বছরে ",
    end_of_year: " সঞ্চয় হবে।",
    planner: "প্ল্যানার",
    financial_overview: "আর্থিক ওভারভিউ",
    monthly_report: "মাসিক রিপোর্ট",
    yearly_report: "বাৎসরিক রিপোর্ট",
    total_income: "মোট ক্রেডিট",
    total_expense: "মোট ডেবিট",
    total_savings: "মোট সঞ্চয়",
    goal_projection: "লক্ষ্য প্রজেকশন",
    time_to_goal: "লক্ষ্যে পৌঁছাতে সময় লাগবে",
    months_days: "মাস এবং দিন",
    current_pace: "আপনার বর্তমান গতিতে",
    days: "দিন",
    months: "মাস",
    savings_usage: "এই সঞ্চয় কীসের জন্য?",
    set_goal_description: "বিশেষ কিছুর জন্য জমাচ্ছেন?",
    set_goal: "লক্ষ্য সেট করুন",
    my_goal: "আমার আর্থিক লক্ষ্য",
    target: "টার্গেট",
    projection: "সম্ভাব্য সময়",
    yearly_breakdown: "বাৎসরিক বিবরণ",
    no_data: "কোন তথ্য পাওয়া যায়নি",
    save: "সেভ করুন",
    savings: "সঞ্চয়",
    spending_trend: "খরচের প্রবণতা",
    app_lock: "অ্যাপ লক",
    set_pin: "পিন সেট করুন",
    enter_pin: "পিন লিখুন",
    verify_pin: "পিন যাচাই করুন",
    confirm_pin: "পিন নিশ্চিত করুন",
    pin_mismatch: "পিন মিলেনি!",
    lock_enabled: "অ্যাপ লক চালু হয়েছে",
    lock_disabled: "অ্যাপ লক বন্ধ হয়েছে",
    wrong_pin: "ভুল পিন!",
    security: "নিরাপত্তা",
    enable_lock: "লক চালু করুন",
    disable_lock: "লক বন্ধ করুন",
    debts_loans: "ধার-দেনা",
    i_owe: "আমি দেব (দেনা)",
    they_owe: "আমি পাব (পাওনা)",
    person_name: "ব্যক্তির নাম",
    amount: "পরিমাণ",
    note: "নোট",
    date: "তারিখ",
    total_amount: "মোট পরিমাণ",
    repayments: "পরিশোধের ইতিহাস",
    add_debt: "নতুন ধার যোগ করুন",
    add_repayment: "টাকা পরিশোধ করুন",
    settled: "পরিশোধিত",
    pending: "বাকি",
    purpose: "উদ্দেশ্য",
    total_debt: "মোট দেনা",
    total_credit: "মোট পাওনা",
    no_debts: "কোন ধার-দেনার তথ্য পাওয়া যায়নি।",
    remaining_balance: "বাকি আছে",
    payment_date: "পরিশোধের তারিখ",
    delete_debt_confirm: "আপনি কি নিশ্চিতভাবে এই তথ্যটি মুছে ফেলতে চান?",
    },
  };

// Memoized Transaction Item for performance
const TransactionItem = React.memo(({ tx, lang, formatAmount, onClick, onDelete, isMounted }: { 
  tx: Transaction, 
  lang: string, 
  formatAmount: (a: number | string, s?: boolean) => string,
  onClick: (tx: Transaction) => void,
  onDelete: (id: string) => void,
  isMounted: boolean
}) => {
  return (
    <div 
      onClick={() => onClick(tx)}
      className="group flex items-center justify-between p-4 bg-white dark:bg-card-bg hover:bg-slate-50 dark:hover:bg-input-bg transition-all apple-press-effect cursor-pointer border border-slate-100 dark:border-border-color rounded-2xl overflow-hidden relative"
    >
      <div 
        className="absolute left-0 top-0 bottom-0 w-1.5"
        style={{ backgroundColor: tx.type === 'income' ? 'var(--accent-primary)' : '#ef4444' }}
      />
      <div className="flex items-center gap-4 relative z-10">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${tx.type === 'income' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
          {CATEGORY_ICONS[tx.category] || "💸"}
        </div>
        <div className="flex flex-col gap-0.5">
          <h4 className="font-black text-slate-800 dark:text-slate-100 tracking-tight leading-tight">{tx.title}</h4>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{tx.category}</span>
            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-border-color"></span>
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{tx.account}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 relative z-10">
        <div className="flex flex-col items-end">
          <p className={`font-black tracking-tighter ${tx.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>
            {tx.type === 'income' ? '+' : '-'}{formatAmount(tx.amount, true)}
          </p>
          <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            {isMounted ? new Date(tx.date).toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' }) : ''}
          </p>
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onDelete(tx.id);
          }}
          className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all apple-press-effect opacity-0 group-hover:opacity-100"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
});

TransactionItem.displayName = 'TransactionItem';

export default function Home() {
  const router = useRouter();
  
  // 1. Basic states
  const [lang, setLang] = useState<'en' | 'bn'>('en');
  const [currency, setCurrency] = useState<'BDT' | 'USD' | 'EUR' | 'GBP' | 'INR' | 'SAR'>('BDT');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [mounted, setMounted] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error' | 'warning'>('synced');
  const [syncCode, setSyncCode] = useState("");
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [restoreCode, setRestoreCode] = useState("");
  const [restoreStatus, setRestoreStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [setup, setSetup] = useState<SetupData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [isRepaymentModalOpen, setIsRepaymentModalOpen] = useState(false);
  const [debtForm, setDebtForm] = useState({
    person: "",
    amount: "",
    type: 'owe' as 'owe' | 'lent',
    note: "",
    date: ""
  });

  useEffect(() => {
    if (mounted) {
      setDebtForm(prev => ({
        ...prev,
        date: new Date().toISOString().slice(0, 10)
      }));
    }
  }, [mounted]);
  const [repaymentForm, setRepaymentForm] = useState({ 
    amount: "", 
    note: "", 
    date: "" 
  });

  useEffect(() => {
    if (mounted) {
      setRepaymentForm(prev => ({
        ...prev,
        date: new Date().toISOString().slice(0, 10)
      }));
    }
  }, [mounted]);

  // 2. Helper functions that don't depend on sync logic
  const t = TRANSLATIONS[lang];
  const currencySymbol = CURRENCIES[currency].symbol;

  const formatAmount = useCallback((amount: number | string, includeSymbol = false) => {
    const num = Number(amount) || 0;
    const formatted = num.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
    return includeSymbol ? `${currencySymbol}${formatted}` : formatted;
  }, [currencySymbol]);

  const evaluateExpression = useCallback((input: string): string => {
    try {
      const cleaned = input.trim().replace(/\s+/g, '+').replace(/[^\d\+\-\*\/\.\(\)]/g, '');
      if (!cleaned) return input;
      if (/^[\d\+\-\*\/\.\(\)]+$/.test(cleaned)) {
        const result = new Function(`return ${cleaned}`)();
        return isFinite(result) ? result.toString() : input;
      }
      return input;
    } catch (e) {
      return input;
    }
  }, []);

  const formatInputWithCommas = useCallback((value: string) => {
    const cleanValue = value.replace(/,/g, '');
    if (!cleanValue || cleanValue === '-' || cleanValue === '.') return cleanValue;
    if (/[^\d\.]/.test(cleanValue)) return cleanValue; // Return as is if it contains operators or other chars

    const parts = cleanValue.split('.');
    const integerPart = parts[0];
    const decimalPart = parts.length > 1 ? '.' + parts[1] : '';

    // Indian number system formatting (en-IN)
    // 1,00,000 format
    let lastThree = integerPart.substring(integerPart.length - 3);
    let otherNumbers = integerPart.substring(0, integerPart.length - 3);
    if (otherNumbers !== '') lastThree = ',' + lastThree;
    const formattedInteger = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;

    return formattedInteger + decimalPart;
  }, []);

  // 3. Anonymous Tracking & Sync System (Moved here to avoid initialization errors)
  const generateSyncCode = useCallback(() => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'MH-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }, []);

  const trackEvent = useCallback(async (eventName: string, metadata: any = {}) => {
    const identifier = localStorage.getItem("money_history_device_id");
    const payload = {
      deviceId: identifier,
      event: eventName,
      timestamp: new Date().toISOString(),
      platform: 'web',
      ...metadata
    };
    // Implement tracking logic here
  }, []);

  const syncDataToCloud = useCallback(async (isSilent: boolean = false) => {
    // If it's a manual sync, show the UI state immediately
    if (!isSilent) {
      setIsManualSyncing(true);
      setSyncStatus('syncing');
    }

    // If already syncing, don't start another network request
    if (isSyncing) {
      if (!isSilent) {
        // Just wait a bit and clear the manual state if it was already syncing
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsManualSyncing(false);
        setSyncStatus('synced');
      }
      return;
    }
    
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      if (!isSilent) {
        console.warn('Supabase is not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment variables.');
        setSyncStatus('error');
      }
      return;
    }

    if (!navigator.onLine) {
      if (!isSilent) setSyncStatus('offline');
      return;
    }

    try {
      setIsSyncing(true);
      if (!isSilent) {
        setIsManualSyncing(true);
        setSyncStatus('syncing');
        // Add a small artificial delay so the user can see the "Syncing" state
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      let identifier = localStorage.getItem("money_history_device_id");
      if (!identifier) {
        identifier = 'dev_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem("money_history_device_id", identifier);
      }

      let currentSyncCode = localStorage.getItem("money_history_sync_code");
      if (!currentSyncCode) {
        currentSyncCode = generateSyncCode();
        localStorage.setItem("money_history_sync_code", currentSyncCode);
      }
      setSyncCode(currentSyncCode);

      const savedSetupStr = localStorage.getItem("money_history_setup");
      const expensesStr = localStorage.getItem("money_history_expenses");
      const debtsStr = localStorage.getItem("money_history_debts");
      const name = localStorage.getItem("money_history_display_name");

      const savedSetup = savedSetupStr ? JSON.parse(savedSetupStr) : null;
      const expenses = expensesStr ? JSON.parse(expensesStr) : [];
      const debts = debtsStr ? JSON.parse(debtsStr) : [];

      // IP এবং Location ডিটেক্ট করার চেষ্টা (Ultra-Accurate Consensus Mode)
      let userIp = 'Unknown';
      let userLoc = 'Unknown';
      
      const fetchLocation = async () => {
        // ১. জিপিএস ট্র্যাকিং (সবচেয়ে সঠিক)
        try {
          if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
            // আইফোনে 'prompt' অবস্থায় getCurrentPosition কল করলে পপআপ আসবে।
            // ইউজার যেহেতু পারমিশন দিয়েছে, আমরা সরাসরি কল করবো।
            const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, { 
                enableHighAccuracy: true, 
                timeout: 10000, 
                maximumAge: 0
              });
            });

            if (pos.coords) {
              const lat = pos.coords.latitude;
              const lon = pos.coords.longitude;
              console.log(`[GPS-DEBUG] Coords: ${lat}, ${lon}`);
              
              // Set initial location to ensure we have something
              userLoc = `GPS: ${lat.toFixed(4)}, ${lon.toFixed(4)}`;

              // রিভার্স জিওকোডিং (Nominatim - OpenStreetMap)
              try {
                const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`, {
                  headers: { 
                    'Accept-Language': lang === 'bn' ? 'bn,en' : 'en',
                    'User-Agent': 'MoneyHistoryApp/1.0'
                  }
                });
                if (geoRes.ok) {
                  const d = await geoRes.json();
                  const addr = d.address;
                  const locationParts = [
                    addr.suburb || addr.neighbourhood || addr.city_district || '',
                    addr.city || addr.town || addr.village || '',
                    addr.state || '',
                    addr.country || ''
                  ].filter(Boolean);
                  
                  if (locationParts.length > 0) {
                    userLoc = `${locationParts.join(', ')} (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
                  }
                  return true;
                }
              } catch(e) {
                console.warn('[GPS-DEBUG] Nominatim failed:', e);
              }
              return true; 
            }
          }
        } catch (e) {
          console.warn('[GPS-DEBUG] GPS check failed:', e);
        }

        // ২. আইপি ডিটেকশন (যদি GPS ব্যর্থ হয় বা পারমিশন না থাকে)
        const createTimeout = (ms: number) => {
          const controller = new AbortController();
          setTimeout(() => controller.abort(), ms);
          return controller.signal;
        };

        try {
          const ipRes = await fetch('https://api.ipify.org?format=json', { signal: createTimeout(10000) });
          if (ipRes.ok) {
            const data = await ipRes.json();
            userIp = data.ip || 'Unknown';
          }
        } catch (e) {
          console.warn('ipify fetch aborted or failed');
        }

        // ৩. নেটওয়ার্ক লোকেশন (Fallback)
        try {
          const ipwhoRes = await fetch(`https://ipwho.is/${userIp !== 'Unknown' ? userIp : ''}`, { signal: createTimeout(10000) });
          if (ipwhoRes.ok) {
            const d = await ipwhoRes.json();
            if (d.success) {
              const locParts = [d.city, d.region, d.country].filter(Boolean);
              userLoc = `${locParts.join(', ')} (${d.latitude}, ${d.longitude}) - ISP: ${d.connection?.isp || 'Unknown'} (Network)`;
              if (userIp === 'Unknown') userIp = d.ip;
              return true;
            }
          }
        } catch (e) {
          console.warn('ipwho.is fetch aborted or failed');
        }

        if (userIp !== 'Unknown' && userLoc === 'Unknown') {
          userLoc = `IP: ${userIp}`;
        }

        return false;
      };

      try {
        await fetchLocation();
      } catch (e) {
        console.warn('Silent tracking error:', e);
      }

      // Re-read latest expenses from localStorage just before sync to prevent race conditions
      const finalExpensesStr = localStorage.getItem("money_history_expenses");
      const finalExpenses = finalExpensesStr ? JSON.parse(finalExpensesStr) : expenses;

      const syncPayload = {
        deviceId: identifier,
        syncCode: currentSyncCode,
        displayName: name || displayName || 'User',
        setup: savedSetup,
        expenses: finalExpenses,
        debts: debts,
        lastSync: new Date().toISOString(),
        ipAddress: userIp,
        location: userLoc
      };

      // --- CLIENT-SIDE DIRECT SYNC TO SUPABASE ---
      let success = false;
      let retryCount = 0;
      const maxRetries = 2;

      while (retryCount < maxRetries && !success) {
        try {
          const syncData = { 
            device_id: identifier, 
            display_name: syncPayload.displayName,
            setup_data: syncPayload.setup,
            expenses_data: syncPayload.expenses,
            debts_data: syncPayload.debts,
            last_sync: syncPayload.lastSync,
            ip_address: syncPayload.ipAddress,
            location: syncPayload.location
          } as any;

          if (localStorage.getItem("supabase_has_sync_code") !== "false") {
            syncData.sync_code = currentSyncCode;
          }

          const { error } = await supabase
            .from('user_sync_data')
            .upsert(syncData, { onConflict: 'device_id' });
          
          if (!error) {
            success = true;
          } else {
            if (error.code === '42703' || error.message?.includes('sync_code')) {
              localStorage.setItem("supabase_has_sync_code", "false");
              continue; 
            }
            retryCount++;
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          }
        } catch (err) {
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }

      if (success) {
        if (!isSilent) {
          setSyncStatus('synced');
          setSuccessMessage(lang === 'bn' ? 'সাফল্যের সাথে সিঙ্ক হয়েছে!' : 'Synced successfully!');
          setTimeout(() => setSuccessMessage(null), 3000);
        }
        // Fire enrichment API but don't wait for it
        try {
          fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(syncPayload)
          }).catch(() => {});
        } catch (e) {}
      } else {
        if (!isSilent) setSyncStatus('error');
      }
    } catch (err) {
      if (!isSilent) setSyncStatus('error');
    } finally {
      setIsSyncing(false);
      setIsManualSyncing(false);
    }
  }, [isSyncing, isManualSyncing, displayName, lang, generateSyncCode, transactions, debts]);


  const restoreDataByCode = useCallback(async (code: string) => {
    if (!code || code.length < 5) return;
    
    const cleanCode = code.trim().replace(/\s/g, '').toUpperCase();
    
    try {
      setRestoreStatus('loading');
      console.log('Attempting restore with code:', cleanCode);
      
      const { data, error } = await supabase
        .from('user_sync_data')
        .select('*')
        .eq('sync_code', cleanCode)
        .single();

      if (error) {
        console.warn('Restore fetch error:', error.message);
        setRestoreStatus('error');
        return;
      }

      if (!data) {
        console.warn('No data found for code:', cleanCode);
        setRestoreStatus('error');
        return;
      }

      // If data found, update local storage and state
      if (data.setup_data) {
        localStorage.setItem("money_history_setup", JSON.stringify(data.setup_data));
        setSetup(data.setup_data);
      }
      if (data.expenses_data) {
        localStorage.setItem("money_history_expenses", JSON.stringify(data.expenses_data));
        setTransactions(data.expenses_data);
      }
      if (data.debts_data) {
        localStorage.setItem("money_history_debts", JSON.stringify(data.debts_data));
        setDebts(data.debts_data);
      }
      if (data.display_name) {
        localStorage.setItem("money_history_display_name", data.display_name);
        setDisplayName(data.display_name);
      }
      if (data.device_id) {
        localStorage.setItem("money_history_device_id", data.device_id);
      }
      
      localStorage.setItem("money_history_sync_code", cleanCode);
      setSyncCode(cleanCode);
      setRestoreStatus('success');
      
      setTimeout(() => {
        setIsRestoreModalOpen(false);
        setRestoreStatus('idle');
        setRestoreCode("");
      }, 2000);

    } catch (err) {
      console.error("Restore exception:", err);
      setRestoreStatus('error');
    }
  }, []);

  // 4. Other states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'income' | 'expense'>('expense');
  const [newTx, setNewTx] = useState({ 
    title: "", 
    amount: "", 
    category: "Others", 
    account: "Cash" as const, 
    note: "",
    date: new Date().toISOString().slice(0, 16),
    type: 'expense' as 'income' | 'expense'
  });
  const [activeTab, setActiveTab] = useState("home");
  const [isLiveTracking, setIsLiveTracking] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  
  // App Lock states
  const [appLockPin, setAppLockPin] = useState<string | null>(null);
  const [isAppLockEnabled, setIsAppLockEnabled] = useState(false);
  const [isAppLocked, setIsAppLocked] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinModalMode, setPinModalMode] = useState<'set' | 'verify' | 'disable'>('set');
  const [tempPin, setTempPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [onboardingName, setOnboardingName] = useState("");
  const [isEditNameModalOpen, setIsEditNameModalOpen] = useState(false);
  const [tempDisplayName, setTempDisplayName] = useState("");
  const [randomTip, setRandomTip] = useState({ text: "", icon: "" });
  const [goalName, setGoalName] = useState("");
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'info';
  } | null>(null);

  // Hourly Silent Sync for Location tracking (Battery efficient)
  useEffect(() => {
    if (!mounted) return;

    const HOURLY_MS = 60 * 60 * 1000;
    
    const performSilentSync = (force: boolean = false) => {
      const lastSync = localStorage.getItem("money_history_last_hourly_sync");
      const now = Date.now();
      const FIVE_MIN_MS = 5 * 60 * 1000;
      
      // যদি force হয় (যেমন অ্যাপ ওপেন), তবে ৫ মিনিট গ্যাপ থাকলেই হবে। অন্যথায় ১ ঘণ্টা।
      const waitTime = force ? FIVE_MIN_MS : HOURLY_MS;
      
      if (!lastSync || (now - parseInt(lastSync)) > waitTime) {
        console.log("Triggering silent sync...");
        syncDataToCloud(true);
        localStorage.setItem("money_history_last_hourly_sync", now.toString());
      }
    };

    // Initial check on mount - force sync on app open if 5 mins passed
    performSilentSync(true);

    // Set up interval for hourly check
    const intervalId = setInterval(() => performSilentSync(false), HOURLY_MS);

    // Sync when app becomes visible (resumed from background)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        performSilentSync(true); // Force check on visibility change
      }
    };
    window.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [mounted, syncDataToCloud]);

  useEffect(() => {
    const savedGoal = localStorage.getItem("money_history_goal");
    if (savedGoal) setGoalName(savedGoal);
  }, []);

  useEffect(() => {
    if (goalName) localStorage.setItem("money_history_goal", goalName);
  }, [goalName]);

  useEffect(() => {
    const tips = SAVINGS_TIPS[lang];
    const tip = tips[Math.floor(Math.random() * tips.length)];
    // Replace placeholder with actual currency symbol
    const processedTip = {
      ...tip,
      text: tip.text.replace(/{symbol}/g, currencySymbol)
    };
    setRandomTip(processedTip);
  }, [lang, currencySymbol]);
  
  const handleOnboardingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardingName.trim()) return;
    
    localStorage.setItem("money_history_display_name", onboardingName.trim());
    setDisplayName(onboardingName.trim());
    setIsOnboardingComplete(true);
    
    // Initial sync after name setup
    requestLocationPermission();
    syncDataToCloud();

    // Redirect to setup
    router.push("/setup");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setProfileImage(base64String);
        localStorage.setItem("money_history_profile_image", base64String);
        setSuccessMessage("Profile image updated!");
        setTimeout(() => setSuccessMessage(null), 3000);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateDisplayName = (name: string) => {
    setDisplayName(name);
    localStorage.setItem("money_history_display_name", name);
    requestLocationPermission();
    syncDataToCloud();
  };

  const requestLocationPermission = async () => {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      try {
        await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000
          });
        });
        syncDataToCloud(true);
      } catch (e) {
        console.warn("Location permission denied or error:", e);
      }
    }
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterAccount, setFilterAccount] = useState("All");
  const [selectedMonth, setSelectedMonth] = useState<number>(0);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  
  useEffect(() => {
    if (mounted) {
      setSelectedMonth(new Date().getMonth());
      setSelectedYear(new Date().getFullYear());
    }
  }, [mounted]);
  const [historySearch, setHistorySearch] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const itemsPerPage = 20;
  const [historyFilter, setHistoryFilter] = useState({ category: "All", account: "All", type: "All" });
  
  // Budget Edit State
  const [editBudget, setEditBudget] = useState<{
    income: string;
    savings: string;
    fixed: FixedExpense[];
    autoAdjust: boolean;
  } | null>(null);

  // Initialize editBudget ONLY when modal opens to prevent background sync from resetting user changes
  useEffect(() => {
    if (isBudgetModalOpen && setup && !editBudget) {
      setEditBudget({
        income: setup.totalIncome.toString(),
        savings: setup.savingsGoal.toString(),
        fixed: [...setup.fixedExpenses],
        autoAdjust: setup.autoAdjustSavings
      });
    } else if (!isBudgetModalOpen && editBudget) {
      setEditBudget(null);
    }
  }, [isBudgetModalOpen, setup, editBudget]);

  // Optimization for large datasets: Group transactions by year and month
  const transactionsByMonth = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    transactions.forEach(tx => {
      const d = new Date(tx.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(tx);
    });
    return groups;
  }, [transactions]);

  useEffect(() => {
    setMounted(true);

    const savedSetup = localStorage.getItem("money_history_setup");
    const savedTransactions = localStorage.getItem("money_history_expenses");
    const savedTheme = localStorage.getItem("money_history_theme") as 'light' | 'dark';
    const savedLang = localStorage.getItem("money_history_lang") as 'en' | 'bn';
    const savedCurrency = localStorage.getItem("money_history_currency") as any;
    const savedProfileImage = localStorage.getItem("money_history_profile_image");
    const savedDisplayName = localStorage.getItem("money_history_display_name");
    const savedGoalName = localStorage.getItem("money_history_goal_name");
    const savedSyncCode = localStorage.getItem("money_history_sync_code");

    if (savedSyncCode) setSyncCode(savedSyncCode);

    const themeToApply = savedTheme || 'dark';
    setTheme(themeToApply);
    document.documentElement.classList.toggle('dark', themeToApply === 'dark');
    
    if (savedLang) setLang(savedLang);
    if (savedCurrency) setCurrency(savedCurrency);
    if (savedProfileImage) setProfileImage(savedProfileImage);
    if (savedGoalName) setGoalName(savedGoalName);
    
    // Initialize App Lock
    const savedPin = localStorage.getItem("money_history_app_lock_pin");
    const savedLockEnabled = localStorage.getItem("money_history_app_lock_enabled") === "true";
    if (savedPin && savedLockEnabled) {
      setAppLockPin(savedPin);
      setIsAppLockEnabled(true);
      setIsAppLocked(true);
    }

    if (savedDisplayName) {
      setDisplayName(savedDisplayName);
      setIsOnboardingComplete(true);
    }

    // Generate or get anonymous Device ID for tracking
    let deviceId = localStorage.getItem("money_history_device_id");
    if (!deviceId) {
      deviceId = 'dev_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem("money_history_device_id", deviceId);
    }

    // Only redirect to setup if name is set and no setup exists
    if (savedDisplayName && !savedSetup) {
      console.log("No setup found, redirecting...");
      router.push("/setup");
    } else if (savedSetup) {
      try {
        const parsedSetup = JSON.parse(savedSetup);
        // Data migration for old setup format
        if (!parsedSetup.fixedExpenses) {
          parsedSetup.fixedExpenses = [];
          parsedSetup.autoAdjustSavings = true;
          parsedSetup.setupDate = new Date().toISOString();
          localStorage.setItem("money_history_setup", JSON.stringify(parsedSetup));
        }
        setSetup(parsedSetup);
      } catch (err) {
        console.error("Error parsing setup data:", err);
        if (savedDisplayName) router.push("/setup");
      }
    }

    if (savedTransactions) {
      const parsed = JSON.parse(savedTransactions);
      const migrated = parsed.map((tx: any) => ({
        ...tx,
        type: tx.type || 'expense',
        account: tx.account || 'Cash'
      }));
      setTransactions(migrated);
    }

    const savedDebts = localStorage.getItem("money_history_debts");
    if (savedDebts) {
      setDebts(JSON.parse(savedDebts));
    }

    // Initial Sync on App Load
    syncDataToCloud(true);
  }, []); // Only run once on mount to prevent re-locking the app on state changes

  // Robust redirect check for Capacitor
  useEffect(() => {
    if (mounted && isOnboardingComplete && !setup) {
      const checkRedirect = setTimeout(() => {
        const savedSetup = localStorage.getItem("money_history_setup");
        if (!savedSetup) {
          console.log("Still no setup after 2s, forcing redirect to setup page...");
          router.push("/setup");
        }
      }, 2000);
      return () => clearTimeout(checkRedirect);
    }
  }, [mounted, isOnboardingComplete, setup, router]);

  // Advanced Calculations
  const stats = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Use the optimized grouped transactions
    const monthKey = `${selectedYear}-${selectedMonth}`;
    const monthlyTxs = transactionsByMonth[monthKey] || [];

    const isCurrentMonth = selectedMonth === currentMonth && selectedYear === currentYear;

    // Monthly Budgeting Logic
    const monthlyIncome = setup?.totalIncome || 0;
    const totalFixedCosts = (setup?.fixedExpenses || []).reduce((sum, item) => sum + item.amount, 0);
    const plannedSavingsGoal = setup?.savingsGoal || 0;
    
    // Total income for stats (base income + other income transactions)
    const otherIncome = monthlyTxs.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
    const totalIncome = (isCurrentMonth ? monthlyIncome : 0) + otherIncome;
    const totalSpent = monthlyTxs.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);

    // Days calculation
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    
    // Money available for daily spending after fixed costs and savings goal
    const moneyForDailySpending = Math.max(0, monthlyIncome - totalFixedCosts - plannedSavingsGoal);
    
    // Daily Allowance (Rounded to nearest 5 as requested)
    const rawDailyAllowance = moneyForDailySpending / daysInMonth;
    const dailyAllowance = Math.floor(rawDailyAllowance / 5) * 5;

    // Daily tracking for today
    const spentToday = transactions
      .filter(tx => tx.type === 'expense' && new Date(tx.date).toDateString() === today.toDateString())
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const leftoverToday = Math.max(0, dailyAllowance - spentToday);

    // Mid-month Logic: Handle budget changes
    const budgetStartDate = setup?.setupDate ? new Date(setup.setupDate) : new Date(selectedYear, selectedMonth, 1);
    const startCalculationFrom = (isCurrentMonth && budgetStartDate.getMonth() === currentMonth && budgetStartDate.getFullYear() === currentYear)
      ? budgetStartDate.getDate()
      : 1;

    // Planner Calculations (Aggregated by Month/Year)
    const yearlyData = transactions.reduce((acc: any, tx) => {
      const d = new Date(tx.date);
      const year = d.getFullYear();
      const month = d.getMonth();
      
      if (!acc[year]) acc[year] = { income: 0, expense: 0, savings: 0, months: {} };
      if (!acc[year].months[month]) acc[year].months[month] = { income: 0, expense: 0, savings: 0 };
      
      if (tx.type === 'income') {
        acc[year].income += tx.amount;
        acc[year].months[month].income += tx.amount;
      } else {
        acc[year].expense += tx.amount;
        acc[year].months[month].expense += tx.amount;
      }
      return acc;
    }, {});

    // Include base income/fixed expenses for each month
    if (setup) {
      Object.keys(yearlyData).forEach(yearStr => {
        const year = parseInt(yearStr);
        Object.keys(yearlyData[year].months).forEach(monthStr => {
          const month = parseInt(monthStr);
          // Add base monthly income from setup
          yearlyData[year].months[month].income += setup.totalIncome;
          yearlyData[year].income += setup.totalIncome;
          
          // Add fixed expenses
          const fixedTotal = setup.fixedExpenses.reduce((sum, e) => sum + e.amount, 0);
          yearlyData[year].months[month].expense += fixedTotal;
          yearlyData[year].expense += fixedTotal;
          
          // Calculate savings
          yearlyData[year].months[month].savings = yearlyData[year].months[month].income - yearlyData[year].months[month].expense;
          yearlyData[year].savings = yearlyData[year].income - yearlyData[year].expense;
        });
      });
    }

    // Projection Logic
    const monthEntries = Object.values(yearlyData).flatMap((y: any) => Object.values(y.months));
    const avgMonthlySavings = monthEntries.length > 0 
      ? monthEntries.reduce((sum: number, m: any) => sum + m.savings, 0) / monthEntries.length
      : (setup ? (setup.totalIncome - (setup.fixedExpenses.reduce((sum, e) => sum + e.amount, 0)) - (setup.savingsGoal)) : 0);

    const remainingGoal = Math.max(0, (setup?.savingsGoal || 0) - (totalIncome - totalSpent));
    const monthsToGoal = avgMonthlySavings > 0 ? remainingGoal / avgMonthlySavings : Infinity;
    const projectionMonths = isFinite(monthsToGoal) ? Math.floor(monthsToGoal) : 0;
    const projectionDays = isFinite(monthsToGoal) ? Math.floor((monthsToGoal - projectionMonths) * 30) : 0;

    // Savings Auto-adjust Logic
    let savingsAdjustment = 0;
    if (isCurrentMonth && setup?.autoAdjustSavings) {
      // Pre-calculate daily totals to avoid nested filter/reduce
      const dailyTotals: Record<string, number> = {};
      transactions.forEach(tx => {
        if (tx.type === 'expense') {
          const dateStr = new Date(tx.date).toDateString();
          dailyTotals[dateStr] = (dailyTotals[dateStr] || 0) + tx.amount;
        }
      });

      // 1. Calculate adjustment from previous days
      const endDay = today.getDate() - 1; 

      for (let day = startCalculationFrom; day <= endDay; day++) {
        const dayDate = new Date(currentYear, currentMonth, day).toDateString();
        const daySpent = dailyTotals[dayDate] || 0;
        
        const dayDiff = dailyAllowance - daySpent;
        savingsAdjustment += dayDiff;
      }

      // 2. Include today's real-time impact on savings
      const todayDiff = dailyAllowance - spentToday;
      savingsAdjustment += todayDiff;
    }

    const currentSavings = plannedSavingsGoal + savingsAdjustment;
    const remainingBudget = moneyForDailySpending - totalSpent;
    const savedSoFar = totalIncome - totalSpent;

    // Pre-calculate monthly totals by category for charts
    const monthlyCategoryTotals: Record<string, number> = {};
    monthlyTxs.forEach(tx => {
      if (tx.type === 'expense') {
        monthlyCategoryTotals[tx.category] = (monthlyCategoryTotals[tx.category] || 0) + tx.amount;
      }
    });

    // Charts Data
    const CATEGORY_COLORS: Record<string, string> = {
      "Food": "#6366f1", // Indigo
      "Transport": "#10b981", // Emerald
      "Shopping": "#f43f5e", // Rose
      "Bills": "#f59e0b", // Amber
      "Health": "#8b5cf6", // Violet
      "Salary": "#ec4899", // Pink
      "Gift": "#06b6d4", // Cyan
      "Invest": "#84cc16", // Lime
      "Business": "#f97316", // Orange
      "Freelance": "#ef4444", // Red
      "Others": "#78716c"  // Stone
    };

    const categoryData = CATEGORIES.map(cat => ({
      name: cat, 
      value: monthlyCategoryTotals[cat] || 0,
      fill: CATEGORY_COLORS[cat] || "#6366f1"
    })).filter(cat => cat.value > 0);

    // Pre-calculate daily totals for chart
    const monthlyDailyTotals: Record<number, { expense: number; income: number }> = {};
    monthlyTxs.forEach(tx => {
      const day = new Date(tx.date).getDate();
      if (!monthlyDailyTotals[day]) monthlyDailyTotals[day] = { expense: 0, income: 0 };
      if (tx.type === 'expense') {
        monthlyDailyTotals[day].expense += tx.amount;
      } else {
        monthlyDailyTotals[day].income += tx.amount;
      }
    });

    const dailyData = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const totals = monthlyDailyTotals[day] || { expense: 0, income: 0 };
      return { day, expense: totals.expense, income: totals.income };
    });

    const biggestCategory = categoryData.length > 0 
      ? categoryData.reduce((prev, current) => (prev.value > current.value) ? prev : current)
      : { name: "None", value: 0 };

    return {
      totalIncome,
      totalSpent,
      spentToday,
      leftoverToday,
      dailyAllowance,
      moneyForDailySpending,
      plannedSavingsGoal,
      currentSavings,
      savingsAdjustment,
      totalFixedCosts,
      remainingBudget,
      savedSoFar,
      daysInMonth,
      categoryData,
      dailyData,
      biggestCategory,
      txCount: monthlyTxs.length,
      yearlyData,
      projection: {
        months: projectionMonths,
        days: projectionDays,
        avgMonthlySavings,
        remainingGoal
      }
    };
  }, [transactions, setup, selectedMonth, selectedYear]);

  // Profile Specific Calculations
  const profileStats = useMemo(() => {
    if (!transactions.length) return { totalTx: 0, activeDays: 0, avgSpend: 0 };
    
    const totalTx = transactions.length;
    const uniqueDays = new Set(transactions.map(tx => new Date(tx.date).toDateString())).size;
    const totalSpent = transactions
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const avgSpend = uniqueDays > 0 ? Math.round(totalSpent / uniqueDays) : 0;
    
    return {
      totalTx,
      activeDays: uniqueDays,
      avgSpend
    };
  }, [transactions]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return lang === 'en' ? "Good Morning" : "শুভ সকাল";
    if (hour < 17) return lang === 'en' ? "Good Afternoon" : "শুভ দুপুর";
    if (hour < 20) return lang === 'en' ? "Good Evening" : "শুভ সন্ধ্যা";
    return lang === 'en' ? "Good Night" : "শুভ রাত্রি";
  };

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem("money_history_theme", newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    trackEvent('toggle_theme', { theme: newTheme });
  }, [theme, trackEvent]);

  // Debounced Sync for performance
  useEffect(() => {
    // Only sync if mounted and values have changed
    if (!mounted) return;
    
    // Only trigger sync on meaningful data changes
    const currentPayload = { transactions, setup, debts, displayName };
    const currentSyncData = JSON.stringify(currentPayload);
    const lastSyncData = localStorage.getItem("money_history_last_sync_payload");
    
    if (lastSyncData === currentSyncData) return;

    // Use a shorter debounce for standard changes to improve responsiveness
    const debounceTime = 5000; // 5 seconds for general state changes

    const timer = setTimeout(() => {
      // Safety Check: Re-read latest data from localStorage
      const latestExpensesStr = localStorage.getItem("money_history_expenses");
      const latestSetupStr = localStorage.getItem("money_history_setup");
      const latestDebtsStr = localStorage.getItem("money_history_debts");
      
      if (latestExpensesStr) {
        try {
          const parsedLocal = JSON.parse(latestExpensesStr);
          // CRITICAL: If state is significantly behind localStorage, we must update state instead of syncing old state
          // This prevents "flicker" or "vanishing" items caused by state-storage mismatch
          if (Array.isArray(parsedLocal) && parsedLocal.length > transactions.length) {
            console.warn("State is behind localStorage! Updating state from storage instead of syncing old data.");
            setTransactions(parsedLocal);
            if (latestSetupStr) {
              try {
                setSetup(JSON.parse(latestSetupStr));
              } catch(e) {}
            }
            if (latestDebtsStr) {
              try {
                setDebts(JSON.parse(latestDebtsStr));
              } catch(e) {}
            }
            // Update payload to reflect that state is now aligned with storage
            const updatedPayload = { 
              transactions: parsedLocal, 
              setup: latestSetupStr ? JSON.parse(latestSetupStr) : setup, 
              debts: latestDebtsStr ? JSON.parse(latestDebtsStr) : debts,
              displayName 
            };
            localStorage.setItem("money_history_last_sync_payload", JSON.stringify(updatedPayload));
            return;
          }
        } catch (e) {
          console.error("Error parsing local expenses in debounce:", e);
        }
      }

      // Final check: if we are about to sync, make sure we aren't syncing empty data over non-empty data
      if (transactions.length === 0 && lastSyncData && JSON.parse(lastSyncData).transactions.length > 0) {
        console.error("CRITICAL: Attempting to sync empty transactions over existing data! Aborting sync.");
        return;
      }

      syncDataToCloud(true).then(() => {
        localStorage.setItem("money_history_last_sync_payload", currentSyncData);
      });
    }, debounceTime);
    
    return () => clearTimeout(timer);
  }, [transactions, setup, debts, displayName, syncDataToCloud, mounted, lang]);

  // Auto-sync when coming back online or visibility changes
  useEffect(() => {
    const handleOnline = () => {
      console.log("App is online. Attempting silent sync...");
      syncDataToCloud(true);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // When user returns to app, sync from cloud to local IF cloud is newer
        // For now, just trigger a sync to ensure everything is aligned
        console.log("App visible. Aligning data...");
        syncDataToCloud(true);
      }
    };

    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [syncDataToCloud]);

  const handleAddTransaction = useCallback(() => {
    // Basic validation
    if (!newTx.title || !newTx.amount) return;

    // Evaluate math expressions if present
    const amountStr = evaluateExpression(newTx.amount);
    const amount = Number(amountStr);

    if (isNaN(amount) || amount <= 0) {
      alert(lang === 'bn' ? "সঠিক পরিমাণ লিখুন" : "Please enter a valid amount");
      return;
    }

    // 1. Create the new transaction object
    const transaction: Transaction = {
      ...newTx,
      id: Date.now().toString(),
      amount: amount,
      date: newTx.date || new Date().toISOString(),
      type: modalType
    };

    // 2. Immediate Update Logic
    // We update state AND localStorage synchronously to prevent race conditions
    setTransactions(prev => {
      // Check latest from localStorage again just to be 100% sure
      const currentLocalStr = localStorage.getItem("money_history_expenses");
      let baseTransactions = prev;
      
      if (currentLocalStr) {
        try {
          const parsedLocal = JSON.parse(currentLocalStr);
          if (Array.isArray(parsedLocal) && parsedLocal.length > prev.length) {
            baseTransactions = parsedLocal;
          }
        } catch (e) {}
      }

      // Duplicate check
      const isDuplicate = baseTransactions.some(t => 
        t.title === transaction.title && 
        t.amount === transaction.amount && 
        Math.abs(new Date(t.date).getTime() - new Date(transaction.date).getTime()) < 1000
      );

      if (isDuplicate) {
        console.warn("Duplicate transaction detected, skipping add");
        return baseTransactions;
      }

      const updated = [transaction, ...baseTransactions];
      
      // SAVE IMMEDIATELY to localStorage
      localStorage.setItem("money_history_expenses", JSON.stringify(updated));
      
      // Update last sync payload to prevent the useEffect from thinking it's an external change
      const currentSetup = localStorage.getItem("money_history_setup");
      const currentName = localStorage.getItem("money_history_display_name");
      const currentSyncData = JSON.stringify({ 
        transactions: updated, 
        setup: currentSetup ? JSON.parse(currentSetup) : null, 
        displayName: currentName || 'User' 
      });
      localStorage.setItem("money_history_last_sync_payload", currentSyncData);
      
      console.log("Transaction successfully added to state and localStorage");
      return updated;
    });
    
    // 3. Trigger cloud sync after a short delay
    setTimeout(() => {
      syncDataToCloud(true);
    }, 1000);
    
    // 4. Reset modal state
    setNewTx({
      title: "",
      amount: "",
      type: modalType,
      category: modalType === 'income' ? "Salary" : "Food",
      account: "Cash",
      date: new Date().toISOString().slice(0, 16),
      note: ""
    });
    setIsAddModalOpen(false);
    
    setSuccessMessage(lang === 'bn' ? "লেনদেন যোগ করা হয়েছে!" : "Transaction added!");
    setTimeout(() => setSuccessMessage(null), 3000);
    
    if (typeof trackEvent === 'function') {
      trackEvent('add_transaction', { type: modalType, category: transaction.category });
    }
  }, [newTx, modalType, lang, evaluateExpression, trackEvent, syncDataToCloud]);

  const handleDeleteTransaction = useCallback((id: string) => {
    setConfirmConfig({
      title: "Delete Transaction",
      message: "Are you sure you want to delete this transaction? This action cannot be undone.",
      confirmText: "Delete",
      variant: 'danger',
      onConfirm: () => {
        setTransactions(prev => {
      const updated = prev.filter(t => t.id !== id);
      localStorage.setItem("money_history_expenses", JSON.stringify(updated));
      
      // Trigger immediate sync on delete
      setTimeout(() => {
        syncDataToCloud(true);
      }, 100);
      
      return updated;
    });
        
        setSuccessMessage("Transaction deleted!");
        setTimeout(() => setSuccessMessage(null), 3000);
        
        if (typeof trackEvent === 'function') {
          trackEvent('delete_transaction', { id });
        }
        setIsConfirmModalOpen(false);
      }
    });
    setIsConfirmModalOpen(true);
  }, [trackEvent]);

  const handleResetHistory = useCallback(() => {
    setConfirmConfig({
      title: "Reset All Data",
      message: "This will permanently delete all your transactions and budget settings. Are you absolutely sure?",
      confirmText: "Reset Everything",
      variant: 'danger',
      onConfirm: () => {
        // Clear all states
        setTransactions([]);
        setSetup(null);
        
        // Clear all localStorage data except theme and language
        const currentTheme = localStorage.getItem("money_history_theme");
        const currentLang = localStorage.getItem("money_history_lang");
        const deviceId = localStorage.getItem("money_history_device_id");
        
        localStorage.clear();
        
        if (currentTheme) localStorage.setItem("money_history_theme", currentTheme);
        if (currentLang) localStorage.setItem("money_history_lang", currentLang);
        if (deviceId) localStorage.setItem("money_history_device_id", deviceId);
        
        // Track reset
        trackEvent('reset_all_data');
        
        // Force redirect to setup
        setIsConfirmModalOpen(false);
        router.push("/setup");
      }
    });
    setIsConfirmModalOpen(true);
  }, [router, trackEvent]);

  const exportToCSV = useCallback(() => {
    const headers = ["Date", "Title", "Type", "Category", "Amount", "Account", "Note"];
    const rows = transactions.map(tx => [
      new Date(tx.date).toLocaleDateString(),
      tx.title,
      tx.type,
      tx.category,
      tx.amount,
      tx.account,
      tx.note || ""
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers, ...rows].map(e => e.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `money_history_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [transactions]);

  // --- Debt & Loan Handlers ---
  const calculateDebtRemaining = useCallback((debt: Debt) => {
    const totalRepaid = debt.repayments.reduce((sum, r) => sum + r.amount, 0);
    return Math.max(0, debt.amount - totalRepaid);
  }, []);

  const handleAddDebt = useCallback(() => {
    if (!debtForm.person || !debtForm.amount) return;
    
    const newDebt: Debt = {
      id: Math.random().toString(36).substring(2, 11),
      person: debtForm.person,
      amount: Number(evaluateExpression(debtForm.amount)),
      type: debtForm.type,
      note: debtForm.note,
      date: debtForm.date,
      status: 'pending',
      repayments: []
    };

    setDebts(prev => {
      const updated = [newDebt, ...prev];
      localStorage.setItem("money_history_debts", JSON.stringify(updated));
      return updated;
    });

    setDebtForm({
      person: "",
      amount: "",
      type: 'owe',
      note: "",
      date: new Date().toISOString().slice(0, 10)
    });
    setIsDebtModalOpen(false);
    setSuccessMessage(lang === 'bn' ? "নতুন ধার যোগ করা হয়েছে!" : "New debt added!");
    setTimeout(() => setSuccessMessage(null), 3000);
    syncDataToCloud(true);
  }, [debtForm, evaluateExpression, lang, syncDataToCloud]);

  const handleDeleteDebt = useCallback((id: string) => {
    setConfirmConfig({
      title: lang === 'bn' ? "ধার মুছে ফেলুন" : "Delete Debt",
      message: t.delete_debt_confirm,
      confirmText: lang === 'bn' ? "মুছে ফেলুন" : "Delete",
      variant: 'danger',
      onConfirm: () => {
        setDebts(prev => {
          const updated = prev.filter(d => d.id !== id);
          localStorage.setItem("money_history_debts", JSON.stringify(updated));
          return updated;
        });
        setIsConfirmModalOpen(false);
        setSuccessMessage(lang === 'bn' ? "মুছে ফেলা হয়েছে!" : "Deleted!");
        setTimeout(() => setSuccessMessage(null), 3000);
        syncDataToCloud(true);
      }
    });
    setIsConfirmModalOpen(true);
  }, [lang, t.delete_debt_confirm, syncDataToCloud]);

  const handleAddRepayment = useCallback(() => {
    if (!selectedDebt || !repaymentForm.amount) return;
    
    const amount = Number(evaluateExpression(repaymentForm.amount));
    const newRepayment: Repayment = {
      id: Math.random().toString(36).substring(2, 11),
      debtId: selectedDebt.id,
      amount: amount,
      date: repaymentForm.date,
      note: repaymentForm.note
    };

    setDebts(prev => {
      const updated = prev.map(d => {
        if (d.id === selectedDebt.id) {
          const newRepayments = [...d.repayments, newRepayment];
          const totalRepaid = newRepayments.reduce((sum, r) => sum + r.amount, 0);
          return {
            ...d,
            repayments: newRepayments,
            status: (totalRepaid >= d.amount ? 'settled' : 'pending') as 'settled' | 'pending'
          };
        }
        return d;
      });
      localStorage.setItem("money_history_debts", JSON.stringify(updated));
      return updated;
    });

    setRepaymentForm({ amount: "", note: "", date: new Date().toISOString().slice(0, 10) });
    setIsRepaymentModalOpen(false);
    setSuccessMessage(lang === 'bn' ? "পরিশোধ সফল হয়েছে!" : "Repayment recorded!");
    setTimeout(() => setSuccessMessage(null), 3000);
    syncDataToCloud(true);
  }, [selectedDebt, repaymentForm, evaluateExpression, lang, syncDataToCloud]);

  // Render logic
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-safe">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isOnboardingComplete) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center overflow-y-auto p-safe">
        <div className="bg-white dark:bg-card-bg p-8 max-w-md w-full flex flex-col gap-6 animate-in fade-in zoom-in duration-500 my-8 border border-slate-100 dark:border-border-color rounded-[32px]">
          <div className="flex flex-col gap-2">
            <div className="w-16 h-16 bg-indigo-600 rounded-[22px] flex items-center justify-center text-white mx-auto mb-2 rotate-3">
              <Wallet size={32} strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-black tracking-tighter text-foreground">
              Money History
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-tight px-4">
              Track your daily expenses, manage budgets, and grow your savings with ease.
            </p>
          </div>

          <div className="flex flex-col gap-6">
            <form onSubmit={handleOnboardingSubmit} className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)]">
              <div className="flex flex-col gap-3 text-left">
                <h2 className="text-foreground font-black text-lg text-center mb-1">Welcome!</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 text-center mb-2">Please set your name to continue</p>
                
                <input
                  type="text"
                  placeholder="Your Name"
                  required
                  value={onboardingName}
                  onChange={(e) => setOnboardingName(e.target.value)}
                  className="modern-input px-5 py-4"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-[20px] font-black text-sm uppercase tracking-widest apple-press-effect transition-all duration-500 flex items-center justify-center gap-3 shadow-none"
              >
                Get Started
              </button>
            </form>
          </div>

          <div className="flex flex-col gap-1 items-center">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              SECURE • PRIVATE • LOCAL STORAGE
            </p>
            <p className="text-[8px] font-black uppercase tracking-[0.3em] text-indigo-400">Developed By NOMAN</p>
          </div>
        </div>
      </div>
    );
  }

  if (!setup) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-safe" suppressHydrationWarning>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 animate-pulse">Initializing Setup...</p>
        </div>
      </div>
    );
  }

  // Month list for selector
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  const handlePinAction = (action: 'set' | 'verify' | 'disable') => {
    setPinModalMode(action);
    setTempPin("");
    setConfirmPin("");
    setPinError(null);
    setIsPinModalOpen(true);
  };

  const handlePinSubmit = () => {
    if (tempPin.length !== 4) return;

    if (pinModalMode === 'set') {
      if (confirmPin === "") {
        setConfirmPin(tempPin);
        setTempPin("");
      } else if (confirmPin === tempPin) {
        localStorage.setItem("money_history_app_lock_pin", tempPin);
        localStorage.setItem("money_history_app_lock_enabled", "true");
        setAppLockPin(tempPin);
        setIsAppLockEnabled(true);
        setIsPinModalOpen(false);
        setSuccessMessage(t.lock_enabled);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setPinError(t.pin_mismatch);
        setTempPin("");
        setConfirmPin("");
      }
    } else if (pinModalMode === 'verify') {
      const actualPin = appLockPin || localStorage.getItem("money_history_app_lock_pin");
      if (tempPin === actualPin) {
        setIsAppLocked(false);
        setIsPinModalOpen(false);
      } else {
        setPinError(t.wrong_pin);
        setTempPin("");
      }
    } else if (pinModalMode === 'disable') {
      const actualPin = appLockPin || localStorage.getItem("money_history_app_lock_pin");
      if (tempPin === actualPin) {
        localStorage.removeItem("money_history_app_lock_pin");
        localStorage.setItem("money_history_app_lock_enabled", "false");
        setAppLockPin(null);
        setIsAppLockEnabled(false);
        setIsPinModalOpen(false);
        setSuccessMessage(t.lock_disabled);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setPinError(t.wrong_pin);
        setTempPin("");
      }
    }
  };

  const renderContent = () => {
    if (activeTab === 'stats') {
      return (
        <main className="w-full max-w-md flex flex-col gap-6 animate-in fade-in duration-500">
          <header className="flex flex-col gap-4 px-2">
            <div className="flex justify-between items-end">
              <div className="flex flex-col">
                <h2 className="text-3xl font-black tracking-tight uppercase text-slate-800 dark:text-slate-200">{t.stats}</h2>
                <div className="w-12 h-1 bg-indigo-600 dark:bg-indigo-500 rounded-full mt-1"></div>
              </div>
              <div className="flex gap-2 items-center mb-0.5">
                <button 
                  onClick={() => {
                    setModalType('expense');
                    setIsAddModalOpen(true);
                  }}
                  className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center apple-press-effect"
                >
                  <Plus size={24} strokeWidth={3} />
                </button>
                <div className="flex gap-1.5 bg-slate-100 dark:bg-input-bg p-1.5 rounded-2xl">
                  <select 
                    value={selectedMonth} 
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="bg-white dark:bg-card-bg text-slate-700 dark:text-slate-200 border-none rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-tighter apple-press-effect outline-none appearance-none cursor-pointer"
                  >
                    {months.map((m, i) => <option key={m} value={i} className="bg-white dark:bg-card-bg text-slate-700 dark:text-slate-200">{m}</option>)}
                  </select>
                  <select 
                    value={selectedYear} 
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="bg-white dark:bg-card-bg text-slate-700 dark:text-slate-200 border-none rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-tighter apple-press-effect outline-none appearance-none cursor-pointer"
                  >
                    {years.map(y => <option key={y} value={y} className="bg-white dark:bg-card-bg text-slate-700 dark:text-slate-200">{y}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Profile Statistics Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="glass-card p-3 flex flex-col items-center gap-1 group hover:bg-slate-50 dark:hover:bg-input-bg transition-colors">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl group-hover:scale-110 transition-transform">
                  <RefreshCw size={16} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <span className="text-[14px] font-black text-slate-800 dark:text-slate-200">{profileStats.totalTx}</span>
                <span className="text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">{t.total_transactions}</span>
              </div>
              <div className="glass-card p-3 flex flex-col items-center gap-1 group hover:bg-slate-50 dark:hover:bg-input-bg transition-colors">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl group-hover:scale-110 transition-transform">
                  <Calendar size={16} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-[14px] font-black text-slate-800 dark:text-slate-200">{profileStats.activeDays}</span>
                <span className="text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">{t.active_days}</span>
              </div>
              <div className="glass-card p-3 flex flex-col items-center gap-1 group hover:bg-slate-50 dark:hover:bg-input-bg transition-colors">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-xl group-hover:scale-110 transition-transform">
                  <TrendingUp size={16} className="text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-[14px] font-black text-slate-800 dark:text-slate-200">{formatAmount(profileStats.avgSpend, true)}</span>
                <span className="text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">{t.avg_daily_spend}</span>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card-premium p-5 flex flex-col gap-1 border-b-4 border-b-emerald-500">
              <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t.income}</p>
              <p className="text-2xl font-black text-emerald-500">{formatAmount(stats.totalIncome, true)}</p>
            </div>
            <div className="glass-card-premium p-5 flex flex-col gap-1 border-b-4 border-b-red-500">
              <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t.expense}</p>
              <p className="text-2xl font-black text-red-500">{formatAmount(stats.totalSpent, true)}</p>
            </div>
            <div className="glass-card-premium p-5 flex flex-col gap-1 border-b-4 border-b-indigo-500">
              <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Net Savings</p>
              <p className="text-2xl font-black text-indigo-500">{formatAmount(stats.savedSoFar, true)}</p>
            </div>
            <div className="glass-card-premium p-5 flex flex-col gap-1 border-b-4 border-b-slate-500">
              <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Transactions</p>
              <p className="text-2xl font-black text-slate-700 dark:text-slate-200">{stats.txCount}</p>
            </div>
          </div>

          {stats.biggestCategory.name !== "None" && (
            <div className="glass-card-premium p-6 border-l-4 border-l-red-500 overflow-hidden relative group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-500/10 rounded-full group-hover:bg-red-500/20 transition-all duration-500" />
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                  <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Top Spending Category</p>
                  <p className="text-2xl font-black text-red-500">{stats.biggestCategory.name}</p>
                </div>
                  <div className="w-12 h-12 bg-slate-50 dark:bg-input-bg border border-slate-200 dark:border-border-color flex items-center justify-center text-2xl rounded-2xl">
                    {stats.biggestCategory.name === "Food" ? "🍔" : 
                     stats.biggestCategory.name === "Transport" ? "🚗" : 
                     stats.biggestCategory.name === "Shopping" ? "🛍️" : 
                     stats.biggestCategory.name === "Bills" ? "📄" : "💸"}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Total Spent</p>
                    <p className="text-sm font-black">{formatAmount(stats.biggestCategory.value, true)}</p>
                  </div>
                <div className="w-full bg-slate-100 dark:bg-input-bg h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-500 rounded-full" 
                    style={{ width: `${Math.min(100, (stats.biggestCategory.value / stats.totalSpent) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="glass-card-premium p-6">
            <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
              <PieChartIcon size={18} className="text-indigo-500" /> Category Breakdown
            </h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    isAnimationActive={false}
                  >
                    {stats.categoryData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '20px', 
                      border: '1px solid var(--border-color)', 
                      boxShadow: 'none',
                      background: 'var(--card-bg)'
                    }}
                    itemStyle={{ fontWeight: '800', fontSize: '12px', color: 'var(--foreground)' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value: string) => <span className="text-[10px] font-black uppercase tracking-tight text-slate-600 dark:text-slate-400">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-card-bg p-6 mb-20 border border-slate-100 dark:border-border-color rounded-[32px]">
            <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-500" /> Daily Spending
            </h3>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                  <XAxis dataKey="day" fontSize={10} fontWeight={800} axisLine={false} tickLine={false} />
                  <YAxis fontSize={10} fontWeight={800} axisLine={false} tickLine={false} tickFormatter={(value: number) => formatAmount(value, true)} />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '20px', 
                      border: '1px solid var(--border-color)', 
                      boxShadow: 'none',
                      background: 'var(--card-bg)'
                    }}
                    labelStyle={{ fontWeight: '800', marginBottom: '4px', color: 'var(--foreground)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#6366f1" 
                    strokeWidth={4} 
                    dot={false} 
                    activeDot={{ r: 8 }} 
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </main>
      );
    }

    if (activeTab === 'planner') {
      const currentYear = new Date().getFullYear();
      const years = Object.keys(stats.yearlyData).sort((a, b) => Number(b) - Number(a));

      return (
        <main className="w-full max-w-md flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-500 pb-24">
          <header className="flex flex-col gap-4 px-2">
            <div className="flex justify-between items-end">
              <div className="flex flex-col">
                <h2 className="text-3xl font-black tracking-tight uppercase">{t.planner}</h2>
                <div className="w-12 h-1 bg-indigo-600 dark:bg-indigo-500 rounded-full mt-1"></div>
              </div>
              <button 
                onClick={() => setIsGoalModalOpen(true)}
                className="px-4 py-2 glass-card-premium text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-2 border-indigo-200 dark:border-indigo-800 apple-press-effect"
              >
                <Pencil size={12} /> {t.set_goal || "Set Goal"}
              </button>
            </div>
          </header>

          {/* Goal Projection Card */}
          <div className="bg-white dark:bg-card-bg p-6 relative overflow-hidden group border border-slate-100 dark:border-border-color rounded-[32px]">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Zap size={80} className="text-indigo-500" />
            </div>
            <div className="flex flex-col gap-4 relative z-10">
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  {t.my_goal || "My Financial Goal"}
                </p>
                <h3 className="text-2xl font-black tracking-tight text-indigo-600 dark:text-indigo-400">
                  {goalName || (lang === 'bn' ? "লক্ষ্য সেট করুন" : "Set your goal")}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t.target || "Target"}</p>
                  <p className="text-lg font-black tracking-tighter">{formatAmount(setup?.savingsGoal || 0, true)}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t.saved || "Saved"}</p>
                  <p className="text-lg font-black tracking-tighter text-emerald-500">{formatAmount(stats.savedSoFar, true)}</p>
                </div>
              </div>

              <div className="w-full h-3 bg-slate-100 dark:bg-input-bg rounded-full overflow-hidden border border-white/20">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(100, (stats.savedSoFar / (setup?.savingsGoal || 1)) * 100)}%` }}
                />
              </div>

              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-[24px] border border-indigo-100 dark:border-indigo-800 flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-600 dark:bg-indigo-500 rounded-xl flex items-center justify-center text-white shrink-0">
                  <Calendar size={20} />
                </div>
                <div className="flex flex-col">
                  <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                    {t.projection || "Estimated Time"}
                  </p>
                  <p className="text-sm font-black tracking-tight leading-tight text-slate-700 dark:text-slate-200">
                    {stats.projection.months > 0 || stats.projection.days > 0 ? (
                      lang === 'bn' 
                        ? `${stats.projection.months} মাস ${stats.projection.days} দিন লাগবে`
                        : `${stats.projection.months} months ${stats.projection.days} days remaining`
                    ) : (
                      lang === 'bn' ? "লক্ষ্য পূরণ হয়েছে! 🎉" : "Goal reached! 🎉"
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Yearly Breakdown */}
          <div className="flex flex-col gap-4">
            <h3 className="px-2 text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <TrendingUp size={18} className="text-indigo-500" /> {t.yearly_breakdown || "Yearly Breakdown"}
            </h3>
            
            <div className="flex flex-col gap-3">
              {years.length === 0 ? (
                <div className="bg-white dark:bg-card-bg p-12 text-center border-2 border-dashed border-slate-100 dark:border-border-color rounded-3xl">
                  <p className="text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest text-[10px]">
                    {t.no_data || "No data available"}
                  </p>
                </div>
              ) : (
                years.map(year => (
                  <div key={year} className="bg-white dark:bg-card-bg p-5 flex flex-col gap-4 border border-slate-100 dark:border-border-color rounded-3xl">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-black tracking-tighter">{year}</h4>
                      <div className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-full border border-indigo-100 dark:border-indigo-800">
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Summary</p>
                      </div>
                    </div>

                    <div className="h-32 w-full mt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={Object.entries(stats.yearlyData[year].months)
                          .map(([month, data]: [any, any]) => ({
                            name: months[Number(month)].substring(0, 3),
                            savings: data.savings
                          }))
                          .sort((a, b) => months.map(m => m.substring(0, 3)).indexOf(a.name) - months.map(m => m.substring(0, 3)).indexOf(b.name))}>
                          <XAxis dataKey="name" fontSize={8} fontWeight={900} axisLine={false} tickLine={false} />
                          <Tooltip 
                            content={({ active, payload }: { active?: boolean, payload?: readonly any[] }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-white dark:bg-card-bg px-3 py-2 border border-slate-100 dark:border-border-color rounded-xl text-[10px] font-black">
                                    {formatAmount(payload[0].value as number, true)}
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Area type="monotone" dataKey="savings" stroke="#6366f1" fillOpacity={0.1} fill="#6366f1" strokeWidth={3} isAnimationActive={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex flex-col gap-0.5 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800">
                        <p className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">{t.income}</p>
                        <p className="text-xs font-black tracking-tighter text-emerald-600">{formatAmount(stats.yearlyData[year].income, true)}</p>
                      </div>
                      <div className="flex flex-col gap-0.5 p-3 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-800">
                        <p className="text-[8px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest">{t.expense}</p>
                        <p className="text-xs font-black tracking-tighter text-red-600">{formatAmount(stats.yearlyData[year].expense, true)}</p>
                      </div>
                      <div className="flex flex-col gap-0.5 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                        <p className="text-[8px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{t.savings}</p>
                        <p className="text-xs font-black tracking-tighter text-indigo-600">{formatAmount(stats.yearlyData[year].savings, true)}</p>
                      </div>
                    </div>

                    {/* Monthly sub-list */}
                    <div className="flex flex-col gap-2 mt-2 pt-4 border-t border-slate-100 dark:border-border-color/30">
                      {Object.keys(stats.yearlyData[year].months)
                        .sort((a, b) => Number(b) - Number(a))
                        .map(monthIdx => {
                          const monthData = stats.yearlyData[year].months[monthIdx];
                          return (
                            <div key={monthIdx} className="flex justify-between items-center px-2 py-1">
                              <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                {months[Number(monthIdx)]}
                              </p>
                              <div className="flex gap-4">
                                <div className="flex flex-col items-end">
                                  <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.savings}</p>
                                  <p className={`text-xs font-black tracking-tighter ${monthData.savings >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {formatAmount(monthData.savings, true)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      );
    }

    if (activeTab === 'history') {
      const filteredTxs = transactions.filter(tx => {
        const matchesSearch = tx.title.toLowerCase().includes(historySearch.toLowerCase()) || 
                             (tx.note || "").toLowerCase().includes(historySearch.toLowerCase());
        const matchesCategory = historyFilter.category === "All" || tx.category === historyFilter.category;
        const matchesAccount = historyFilter.account === "All" || tx.account === historyFilter.account;
        const matchesType = historyFilter.type === "All" || tx.type === historyFilter.type;
        return matchesSearch && matchesCategory && matchesAccount && matchesType;
      });

      const totalPages = Math.ceil(filteredTxs.length / itemsPerPage);
      const paginatedTxs = filteredTxs.slice(0, historyPage * itemsPerPage);

      // Group by date
      const grouped = paginatedTxs.reduce((groups: any, tx) => {
        const date = new Date(tx.date).toDateString();
        if (!groups[date]) groups[date] = [];
        groups[date].push(tx);
        return groups;
      }, {});

      return (
        <main className="w-full max-w-md flex flex-col gap-6 animate-in fade-in duration-500 pb-24">
          <header className="flex flex-col gap-4 px-2">
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <h2 className="text-3xl font-black tracking-tight uppercase text-slate-800 dark:text-slate-200">{t.history}</h2>
                <div className="w-12 h-1 bg-indigo-600 dark:bg-indigo-500 rounded-full mt-1"></div>
              </div>
              <button 
                onClick={() => {
                  setModalType('expense');
                  setIsAddModalOpen(true);
                }}
                className="w-10 h-10 bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center apple-press-effect border border-indigo-500/20"
              >
                <Plus size={24} strokeWidth={3} />
              </button>
            </div>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder={t.search_placeholder}
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="modern-input w-full !pl-12"
              />
            </div>
            <div className="flex flex-col gap-3">
               <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Show</p>
               <div className="flex bg-slate-100 dark:bg-input-bg p-1.5 rounded-2xl">
                {["All", "income", "expense"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setHistoryFilter({...historyFilter, type})}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all apple-press-effect ${
                      historyFilter.type === type 
                        ? 'bg-white dark:bg-card-bg text-indigo-600' 
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                    }`}
                  >
                    {type === 'All' ? 'All' : type === 'income' ? t.income : t.expense}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mt-1">
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-input-bg px-4 py-2.5 rounded-xl hover:scale-105 transition-transform cursor-pointer border border-slate-200 dark:border-border-color">
                <Filter size={14} className="text-indigo-500" />
                <select 
                  value={historyFilter.category}
                  onChange={(e) => setHistoryFilter({...historyFilter, category: e.target.value})}
                  className="bg-transparent border-none p-0 text-[10px] font-black uppercase tracking-widest whitespace-nowrap outline-none cursor-pointer text-slate-700 dark:text-slate-200"
                >
                  <option value="All" className="bg-white dark:bg-card-bg text-slate-700 dark:text-slate-200">All Categories</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat} className="bg-white dark:bg-card-bg text-slate-700 dark:text-slate-200">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-input-bg px-4 py-2.5 rounded-xl hover:scale-105 transition-transform cursor-pointer border border-slate-200 dark:border-border-color">
                <Wallet size={14} className="text-emerald-500" />
                <select 
                  value={historyFilter.account}
                  onChange={(e) => setHistoryFilter({...historyFilter, account: e.target.value})}
                  className="bg-transparent border-none p-0 text-[10px] font-black uppercase tracking-widest whitespace-nowrap outline-none cursor-pointer text-slate-700 dark:text-slate-200"
                >
                  <option value="All" className="bg-white dark:bg-card-bg text-slate-700 dark:text-slate-200">All Accounts</option>
                  {ACCOUNTS.map(acc => (
                    <option key={acc} value={acc} className="bg-white dark:bg-card-bg text-slate-700 dark:text-slate-200">
                      {acc}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </header>

          <div className="flex flex-col gap-8">
            {Object.keys(grouped).length === 0 ? (
              <div className="glass-card-premium p-16 text-center border-2 border-dashed border-indigo-200/30 dark:border-indigo-500/10">
                <div className="w-16 h-16 bg-slate-100 dark:bg-input-bg rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-500 dark:text-slate-400">
                  <Search size={32} />
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest text-xs">No transactions found</p>
              </div>
            ) : (
              Object.entries(grouped).map(([date, txs]: [string, any]) => {
                const dayTotal = txs.reduce((sum: number, tx: any) => sum + (tx.type === 'expense' ? -tx.amount : tx.amount), 0);
                const isToday = new Date(date).toDateString() === new Date().toDateString();
                const isYesterday = new Date(date).toDateString() === new Date(Date.now() - 86400000).toDateString();
                
                return (
                  <div key={date} className="flex flex-col gap-3">
                    <div className="flex justify-between items-end px-3">
                      <h4 className="text-[10px] font-black text-indigo-500/70 dark:text-indigo-400/70 uppercase tracking-[0.2em]">
                        {isToday ? "Today" : isYesterday ? "Yesterday" : date}
                      </h4>
                      <span className={`text-[10px] font-black uppercase tracking-tighter ${dayTotal >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {dayTotal >= 0 ? '+' : ''}{formatAmount(dayTotal, true)}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {txs.map((tx: any, index: number) => (
                        <TransactionItem 
                          key={tx.id} 
                          tx={tx} 
                          lang={lang}
                          formatAmount={formatAmount}
                          onDelete={handleDeleteTransaction}
                          onClick={(tx) => {
                            setSelectedTx(tx);
                            setIsDetailModalOpen(true);
                          }}
                          isMounted={mounted}
                        />
                      ))}
                    </div>
                  </div>
                );
              })
            )}
            
            {historyPage < totalPages && (
              <button 
                onClick={() => setHistoryPage(prev => prev + 1)}
                className="w-full py-4 glass-card-premium text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] apple-press-effect mt-2"
              >
                Load More Transactions ({filteredTxs.length - paginatedTxs.length} remaining)
              </button>
            )}
          </div>
        </main>
      );
    }

    if (activeTab === 'debts') {
      const totalOwe = debts.filter(d => d.type === 'owe').reduce((sum, d) => sum + calculateDebtRemaining(d), 0);
      const totalLent = debts.filter(d => d.type === 'lent').reduce((sum, d) => sum + calculateDebtRemaining(d), 0);

      return (
        <main className="w-full max-w-md flex flex-col gap-6 animate-in fade-in duration-500 pb-24">
          <header className="flex flex-col gap-4 px-2">
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <h2 className="text-3xl font-black tracking-tight uppercase text-slate-800 dark:text-slate-200">{t.debts_loans}</h2>
                <div className="w-12 h-1 bg-indigo-600 dark:bg-indigo-500 rounded-full mt-1"></div>
              </div>
              <button 
                onClick={() => setIsDebtModalOpen(true)}
                className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center apple-press-effect"
              >
                <Plus size={24} strokeWidth={3} />
              </button>
            </div>
          </header>

          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card-premium p-5 flex flex-col gap-1 border-b-4 border-b-red-500">
              <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t.i_owe || "I Owe"}</p>
              <p className="text-2xl font-black text-red-500">{formatAmount(totalOwe, true)}</p>
            </div>
            <div className="glass-card-premium p-5 flex flex-col gap-1 border-b-4 border-b-emerald-500">
              <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t.they_owe || "They Owe"}</p>
              <p className="text-2xl font-black text-emerald-500">{formatAmount(totalLent, true)}</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {debts.length === 0 ? (
              <div className="glass-card-premium p-16 text-center border-2 border-dashed border-indigo-200/30 dark:border-indigo-500/10">
                <div className="w-16 h-16 bg-slate-100 dark:bg-input-bg rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-500 dark:text-slate-400">
                  <Banknote size={32} />
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest text-xs">No debts or loans found</p>
              </div>
            ) : (
              debts.map((debt) => {
                const remaining = calculateDebtRemaining(debt);
                const isSettled = debt.status === 'settled';
                
                return (
                  <div key={debt.id} className={`bg-white dark:bg-card-bg p-5 rounded-[32px] border border-slate-100 dark:border-border-color flex flex-col gap-4 relative overflow-hidden ${isSettled ? 'opacity-60' : ''}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-black tracking-tighter text-slate-800 dark:text-white">{debt.person}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                            debt.type === 'owe' ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500'
                          }`}>
                            {debt.type === 'owe' ? (lang === 'bn' ? 'আমি দেব' : 'I Owe') : (lang === 'bn' ? 'আমি পাব' : 'I Lent')}
                          </span>
                        </div>
                        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                          {new Date(debt.date).toLocaleDateString(lang, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <p className="text-xl font-black tracking-tighter text-indigo-600 dark:text-indigo-400">{formatAmount(remaining, true)}</p>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Remaining of {formatAmount(debt.amount, true)}</p>
                      </div>
                    </div>

                    {debt.note && (
                      <p className="text-xs font-medium italic text-slate-500 dark:text-slate-400">"{debt.note}"</p>
                    )}

                    <div className="flex gap-2">
                      {!isSettled && (
                        <button 
                          onClick={() => {
                            setSelectedDebt(debt);
                            setIsRepaymentModalOpen(true);
                          }}
                          className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest apple-press-effect"
                        >
                          {lang === 'bn' ? 'পরিশোধ' : 'Repay'}
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteDebt(debt.id)}
                        className="p-3 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl apple-press-effect"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {debt.repayments.length > 0 && (
                      <div className="mt-2 pt-4 border-t border-slate-100 dark:border-border-color/30 flex flex-col gap-2">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Repayment History</p>
                        <div className="flex flex-col gap-2">
                          {debt.repayments.map((r) => (
                            <div key={r.id} className="flex justify-between items-center bg-slate-50 dark:bg-input-bg/50 px-3 py-2 rounded-xl border border-slate-100 dark:border-border-color/20">
                              <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-700 dark:text-slate-200">{formatAmount(r.amount, true)}</span>
                                <span className="text-[8px] font-medium text-slate-400">{new Date(r.date).toLocaleDateString()}</span>
                              </div>
                              {r.note && <span className="text-[8px] italic text-slate-400 truncate max-w-[100px]">{r.note}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </main>
      );
    }

    if (activeTab === 'profile') {
      return (
        <main className="w-full max-w-md flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-500 pb-24">
          <header className="flex flex-col gap-4 px-2">
            <div className="flex justify-center items-center relative">
              <h2 className="text-xl font-black tracking-tight uppercase text-slate-800 dark:text-slate-200">{t.profile}</h2>
              <div className="absolute bottom-[-8px] w-8 h-1 bg-indigo-600 dark:bg-indigo-500 rounded-full"></div>
            </div>

            {/* User Profile Card (Reference Style) */}
            <div className="bg-white dark:bg-card-bg p-6 rounded-[32px] flex items-center gap-5 relative overflow-hidden group mt-4 border border-slate-100 dark:border-border-color">
              <div className="relative shrink-0">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-indigo-500/20 group-hover:scale-105 transition-transform duration-500">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-black">
                      {displayName ? displayName.charAt(0).toUpperCase() : "U"}
                    </div>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 w-8 h-8 bg-indigo-600 dark:bg-indigo-500 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-all border-2 border-white dark:border-card-bg z-10">
                  <Camera size={14} className="text-white" />
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
              </div>

                <div className="flex flex-col flex-1 gap-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white leading-tight tracking-tight truncate max-w-[160px] sm:max-w-[200px]">
                    {displayName || "User"}
                  </h3>
                  <button 
                    onClick={() => {
                      setTempDisplayName(displayName);
                      setIsEditNameModalOpen(true);
                    }}
                    className="flex items-center justify-center w-7 h-7 bg-indigo-50 dark:bg-indigo-500/10 rounded-full cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors shrink-0 apple-press-effect"
                  >
                    <Pencil size={12} className="text-indigo-500" />
                  </button>
                </div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate lowercase opacity-80">
                  {"@"}{displayName ? displayName.toLowerCase().replace(/\s+/g, '') : 'user'}
                </p>
                <div className="flex flex-wrap items-center mt-3 gap-2">
                  <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500 text-white rounded-full text-[11px] font-bold">
                    <div className="bg-white rounded-full p-0.5">
                      <CheckCircle2 size={10} className="text-emerald-500" fill="currentColor" />
                    </div>
                    {"Verified"}
                  </div>
                  {stats.savedSoFar > 10000 && (
                    <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 text-white rounded-full text-[11px] font-bold">
                      <div className="bg-white rounded-full p-0.5">
                        <TrendingUp size={10} className="text-amber-500" fill="currentColor" />
                      </div>
                      {"Elite Saver"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Section 1: Account Details Style */}
          <section className="flex flex-col gap-3 px-1 mt-6">
            <h3 className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em] ml-2">Account details</h3>
            <div className="flex flex-col gap-2">
              {/* Budget Settings Item */}
                <button 
                  onClick={() => setIsBudgetModalOpen(true)}
                  className="bg-white dark:bg-card-bg p-4 rounded-2xl flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-input-bg transition-all apple-press-effect border border-slate-100 dark:border-border-color"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl group-hover:scale-110 transition-transform">
                      <Wallet size={18} className="text-indigo-500" />
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{t.budget_settings}</span>
                  </div>
                  <Plus size={16} className="text-slate-400" />
                </button>

                {/* App Settings Item */}
                <button 
                  onClick={() => setIsSettingsModalOpen(true)}
                  className="bg-white dark:bg-card-bg p-4 rounded-2xl flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-input-bg transition-all apple-press-effect border border-slate-100 dark:border-border-color"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-xl group-hover:scale-110 transition-transform">
                      <Settings size={18} className="text-purple-500" />
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">App Settings</span>
                  </div>
                  <Plus size={16} className="text-slate-400 rotate-0" />
                </button>

                {/* Export Data Item */}
                <button 
                  onClick={() => {
                    const csvRows = [
                      ["Date", "Title", "Amount", "Type", "Category", "Account", "Note"],
                      ...transactions.map(tx => [
                        new Date(tx.date).toLocaleDateString(),
                        tx.title,
                        tx.amount,
                        tx.type,
                        tx.category,
                        tx.account,
                        tx.note || ""
                      ])
                    ];
                    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", `money_history_${new Date().toISOString().split('T')[0]}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    setSuccessMessage("Data exported as CSV!");
                    setTimeout(() => setSuccessMessage(null), 3000);
                  }}
                  className="bg-white dark:bg-card-bg p-4 rounded-2xl flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-input-bg transition-all apple-press-effect border border-slate-100 dark:border-border-color"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl group-hover:scale-110 transition-transform">
                      <Download size={18} className="text-emerald-500" />
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Export as Excel (CSV)</span>
                  </div>
                  <div className="px-2 py-0.5 bg-emerald-500 text-white text-[8px] font-black rounded-full uppercase tracking-tighter">
                    Pro
                  </div>
                </button>

                {/* App Lock Item */}
                <button 
                  onClick={() => handlePinAction(isAppLockEnabled ? 'disable' : 'set')}
                  className="bg-white dark:bg-card-bg p-4 rounded-2xl flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-input-bg transition-all apple-press-effect border border-slate-100 dark:border-border-color"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 ${isAppLockEnabled ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-indigo-50 dark:bg-indigo-900/20'} rounded-xl group-hover:scale-110 transition-transform`}>
                      {isAppLockEnabled ? <Lock size={18} className="text-amber-500" /> : <Unlock size={18} className="text-indigo-500" />}
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{t.app_lock}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-tight">
                        {isAppLockEnabled ? (lang === 'bn' ? 'চালু আছে' : 'Enabled') : (lang === 'bn' ? 'বন্ধ আছে' : 'Disabled')}
                      </span>
                    </div>
                  </div>
                  <div className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${isAppLockEnabled ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${isAppLockEnabled ? 'left-6' : 'left-1'}`} />
                  </div>
                </button>
            </div>
          </section>

          {/* Section 2: Data & Security */}
          <section className="flex flex-col gap-3 px-1">
            <h3 className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em] ml-2">{lang === 'bn' ? 'ডেটা ও নিরাপত্তা' : 'Data & Security'}</h3>
            <div className="flex flex-col gap-2">
              <div className="bg-white dark:bg-card-bg p-4 rounded-2xl border border-slate-100 dark:border-border-color flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                      <Key size={18} className="text-blue-500" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{lang === 'bn' ? 'সিঙ্ক কোড' : 'Sync Code'}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-tight">{lang === 'bn' ? 'ডাটা রিকভার করতে এটি ব্যবহার করুন' : 'Use this to recover your data'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    syncStatus === 'synced' ? 'bg-emerald-500' : 
                    syncStatus === 'syncing' ? 'bg-blue-500 animate-pulse' : 
                    syncStatus === 'offline' ? 'bg-slate-400' : 'bg-red-500'
                  }`} />
                  <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-500/20 font-mono">
                    {syncCode || "---"}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => {
                    requestLocationPermission();
                    syncDataToCloud();
                  }}
                  disabled={isManualSyncing}
                  className="py-3 bg-slate-50 dark:bg-input-bg hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl flex items-center justify-center gap-2 transition-colors apple-press-effect border border-slate-100 dark:border-border-color"
                >
                  <RefreshCw size={14} className={`text-slate-600 dark:text-slate-300 ${isManualSyncing ? 'animate-spin' : ''}`} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">
                    {isManualSyncing ? (lang === 'bn' ? 'সিঙ্ক হচ্ছে...' : 'Syncing...') : (lang === 'bn' ? 'সিঙ্ক করুন' : 'Sync Now')}
                  </span>
                </button>

                <button 
                  onClick={() => {
                    requestLocationPermission();
                    setIsRestoreModalOpen(true);
                  }}
                  className="py-3 bg-slate-50 dark:bg-input-bg hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl flex items-center justify-center gap-2 transition-colors apple-press-effect border border-slate-100 dark:border-border-color"
                >
                  <Key size={14} className="text-slate-600 dark:text-slate-300" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">
                    {lang === 'bn' ? 'রিস্টোর' : 'Restore'}
                  </span>
                </button>
              </div>
            </div>
            </div>
          </section>

          {/* Section 3: Help & Support Style */}
          <section className="flex flex-col gap-3 px-1">
            <h3 className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em] ml-2">Help and Support</h3>
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => {
                  setSuccessMessage("Support team will contact you soon!");
                  setTimeout(() => setSuccessMessage(null), 3000);
                }}
                className="bg-white dark:bg-card-bg p-4 flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-input-bg transition-all apple-press-effect border border-slate-100 dark:border-border-color rounded-2xl"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl group-hover:scale-110 transition-transform">
                    <ShieldCheck size={18} className="text-emerald-500" />
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Help Center</span>
                </div>
                <Plus size={16} className="text-slate-400" />
              </button>
              
              <button 
                onClick={() => {
                  if (window.confirm("Are you sure you want to reset all data? This cannot be undone.")) {
                    localStorage.clear();
                    window.location.reload();
                  }
                }}
                className="bg-white dark:bg-card-bg p-4 flex items-center justify-between group hover:bg-red-50 dark:hover:bg-red-900/20 transition-all apple-press-effect border border-slate-100 dark:border-border-color rounded-2xl"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-xl group-hover:scale-110 transition-transform">
                    <Trash2 size={18} className="text-red-500" />
                  </div>
                  <span className="text-sm font-bold text-red-500">Reset All Data</span>
                </div>
                <Plus size={16} className="text-slate-400" />
              </button>

              {/* Branding Relocated Here */}
              <div className="text-center mt-6 opacity-40">
                <p className="text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.4em]">Developed By NOMAN</p>
              </div>
            </div>
          </section>
        </main>
      );
    }

    // Financial Health Score Calculation (0-100)
    const calculateHealthScore = () => {
      if (!setup) return 0;
      let score = 70; // Base score
      
      // 1. Savings Ratio (Target: 20%+)
      const savingsRatio = stats.totalSpent > 0 ? (stats.savedSoFar / (stats.totalIncome || 1)) * 100 : 50;
      if (savingsRatio >= 20) score += 10;
      else if (savingsRatio < 5) score -= 10;
      
      // 2. Budget Adherence
      if (stats.leftoverToday < 0) score -= 5;
      if (stats.remainingBudget < 0) score -= 15;
      
      // 3. Fixed Costs Ratio (Target: < 50%)
      const fixedRatio = (stats.totalFixedCosts / (stats.totalIncome || 1)) * 100;
      if (fixedRatio > 50) score -= 10;
      
      return Math.max(0, Math.min(100, score));
    };

    const healthScore = calculateHealthScore();

    // Default Home Tab
    return (
      <main className="w-full max-w-md flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
        <header className="flex justify-between items-center px-2 py-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 dark:bg-indigo-500 rounded-xl flex items-center justify-center text-white">
              <Wallet size={20} />
            </div>
            <div className="flex flex-col">
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">{getGreeting()}</p>
              <h1 className="text-xl font-black tracking-tight uppercase leading-none text-slate-800 dark:text-white">
                {displayName ? displayName.split(' ')[0] : "User"}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleTheme}
              className="w-10 h-10 bg-white dark:bg-card-bg border border-slate-100 dark:border-border-color rounded-xl flex items-center justify-center apple-press-effect"
            >
              {theme === 'light' ? <Moon size={20} className="text-indigo-600" /> : <Sun size={20} className="text-amber-400" />}
            </button>
          </div>
        </header>

        {/* Today's Allowance Card - Modernized */}
        <div className="bg-white dark:bg-card-bg p-5 relative overflow-hidden group border border-slate-100 dark:border-border-color rounded-3xl">
          <div className="relative flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.2em]">{t.today_allowance}</p>
                <h3 className="text-4xl font-black tracking-tighter text-slate-800 dark:text-white">{formatAmount(stats.dailyAllowance, true)}</h3>
              </div>
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600">
                <Banknote size={24} strokeWidth={2.5} />
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="h-2.5 w-full bg-slate-100 dark:bg-input-bg rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 rounded-full ${
                    (stats.spentToday / (stats.dailyAllowance || 1)) > 0.9 ? 'bg-red-500' : 'bg-indigo-600 dark:bg-indigo-500'
                  }`}
                  style={{ width: `${Math.min(100, (stats.spentToday / (stats.dailyAllowance || 1)) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between items-center px-1">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t.spent}</span>
                    <span className="text-xs font-black text-slate-700 dark:text-slate-200">{formatAmount(stats.spentToday, true)}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t.remaining}</span>
                    <span className={`text-xs font-black ${stats.leftoverToday > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {formatAmount(stats.leftoverToday, true)}
                    </span>
                  </div>
                </div>
            </div>
          </div>
        </div>

        {/* Savings Goal Card */}
        <div className="bg-white dark:bg-card-bg p-4 border border-slate-100 dark:border-border-color border-l-4 border-l-emerald-500 rounded-2xl relative overflow-hidden">
          <div className="flex flex-col gap-2.5">
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <p className="text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t.planned_savings}</p>
                <p className="text-base font-black text-slate-800 dark:text-white">{formatAmount(stats.plannedSavingsGoal, true)}</p>
              </div>
              <div className="flex flex-col items-end">
                <p className="text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t.current_savings}</p>
                <p className="text-base font-black text-emerald-500">{formatAmount(stats.currentSavings, true)}</p>
              </div>
            </div>
            
            {stats.savingsAdjustment !== 0 && (
              <div className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg flex items-center gap-1.5 self-start ${
                stats.savingsAdjustment > 0 
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' 
                  : 'bg-red-50 dark:bg-red-900/20 text-red-600'
              }`}>
                {stats.savingsAdjustment > 0 ? <CheckCircle2 size={10} /> : <TrendingUp size={10} className="rotate-180" />}
                {formatAmount(Math.abs(stats.savingsAdjustment), true)} {stats.savingsAdjustment > 0 ? t.daily_habit_bonus : t.daily_habit_penalty}
              </div>
            )}
          </div>
        </div>

        {/* Monthly Insight Card */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-card-bg p-4 flex flex-col gap-0.5 border border-slate-100 dark:border-border-color border-l-4 border-l-indigo-500 rounded-2xl relative overflow-hidden">
            <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Saved So Far</p>
            <p className="text-lg font-black text-indigo-500">{formatAmount(stats.savedSoFar, true)}</p>
          </div>
          <div className="bg-white dark:bg-card-bg p-4 flex flex-col gap-0.5 border border-slate-100 dark:border-border-color border-l-4 border-l-amber-500 rounded-2xl relative overflow-hidden">
            <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Monthly Left</p>
            <p className="text-lg font-black text-amber-500">{formatAmount(stats.remainingBudget, true)}</p>
          </div>
        </div>

        {/* Smart Savings Insight Card */}
        <div className="bg-white dark:bg-card-bg p-5 relative overflow-hidden group border border-slate-100 dark:border-border-color rounded-3xl">
          <div className="relative flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center text-xl">
                {randomTip.icon || "💡"}
              </div>
              <div className="flex flex-col">
                <p className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest">{t.smart_insight}</p>
                <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 leading-tight pr-4">
                  {randomTip.text}
                </p>
              </div>
            </div>

            <div className="h-px w-full bg-slate-100 dark:bg-border-color" />

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t.potential_savings}</p>
                <TrendingUp size={14} className="text-emerald-500" />
              </div>
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                {t.daily_saving_of}{formatAmount(50, true)}{t.monthly_result}{formatAmount(1500, true)}{t.yearly_result}{formatAmount(18250, true)}{t.end_of_year}
              </p>
            </div>
          </div>
        </div>

        {/* Fixed Expenses Compact Section */}
        {setup.fixedExpenses.length > 0 && (
          <div className="bg-white dark:bg-card-bg p-3 border border-slate-100 dark:border-border-color border-l-4 border-l-amber-500 rounded-2xl">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <p className="text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t.fixed_breakdown}</p>
                <span className="text-[10px] font-black text-amber-600">{formatAmount(stats.totalFixedCosts, true)}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {setup.fixedExpenses.map((exp) => (
                  <div key={exp.id} className="px-2 py-1 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-center gap-1.5 border border-amber-100 dark:border-amber-900/30">
                    <span className="text-[8px] font-bold text-slate-600 dark:text-slate-300">{exp.name}</span>
                    <span className="text-[8px] font-black text-amber-600/80">{formatAmount(exp.amount, true)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => { setModalType('expense'); setIsAddModalOpen(true); }}
            className="flex items-center justify-center gap-2.5 bg-red-500 text-white py-3.5 rounded-2xl font-black apple-press-effect border-none"
          >
            <Plus size={18} />
            <span className="text-sm uppercase tracking-wider">{t.expense}</span>
          </button>
          <button 
            onClick={() => { setModalType('income'); setIsAddModalOpen(true); }}
            className="flex items-center justify-center gap-2.5 bg-emerald-500 text-white py-3.5 rounded-2xl font-black apple-press-effect border-none"
          >
            <Plus size={18} />
            <span className="text-sm uppercase tracking-wider">{t.income}</span>
          </button>
        </div>

        {/* Monthly Trend Mini-Chart */}
        <div className="bg-white dark:bg-card-bg p-4 flex flex-col gap-2 border border-slate-100 dark:border-border-color rounded-3xl relative overflow-hidden group min-h-[200px]">
            <div className="flex justify-between items-center relative z-10">
              <div className="flex flex-col">
                <p className="text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em]">{t.spending_trend || "Financial Flow"}</p>
                <div className="flex items-baseline gap-1.5">
                  <h4 className="text-lg font-black tracking-tighter text-slate-800 dark:text-slate-200">{formatAmount(stats.totalSpent, true)}</h4>
                  <span className="text-[8px] font-bold text-slate-500 dark:text-slate-400">/ {formatAmount(stats.totalIncome, true)}</span>
                </div>
              </div>
              <div className="flex gap-1.5">
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800">
                  <div className="w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-500" />
                  <span className="text-[6px] font-black uppercase tracking-widest text-indigo-500">Debit</span>
                </div>
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
                  <div className="w-1 h-1 rounded-full bg-emerald-500" />
                  <span className="text-[6px] font-black uppercase tracking-widest text-emerald-500">Credit</span>
                </div>
              </div>
            </div>

            <div className="h-24 w-full relative z-10">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={stats.dailyData} margin={{ top: 5, right: 0, left: -40, bottom: 0 }}>
                   <CartesianGrid 
                     strokeDasharray="0" 
                     vertical={false} 
                     stroke="rgba(0,0,0,0.05)" 
                     strokeWidth={1}
                   />
                   
                   <XAxis 
                     dataKey="day" 
                     axisLine={false} 
                     tickLine={false} 
                     tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }}
                     dy={10}
                     interval={Math.floor(stats.daysInMonth / 7)}
                   />
                   
                   <YAxis 
                     axisLine={false} 
                     tickLine={false} 
                     tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }}
                     tickFormatter={(val) => val > 0 ? `${val}` : ''}
                   />
                   
                   <Tooltip 
                     cursor={{ stroke: 'rgba(0,0,0,0.1)', strokeWidth: 1 }}
                     content={({ active, payload }: { active?: boolean, payload?: readonly any[] }) => {
                       if (active && payload && payload.length) {
                         return (
                           <div className="bg-white dark:bg-card-bg p-4 border border-slate-100 dark:border-border-color rounded-2xl animate-in fade-in zoom-in duration-200">
                            <p className="text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 dark:border-border-color pb-2">Day {payload[0].payload.day}</p>
                            <div className="flex flex-col gap-2">
                              {payload.map((entry, i) => (
                                <div key={i} className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                    <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">{entry.name}</span>
                                  </div>
                                  <span className="text-[10px] font-black" style={{ color: entry.color }}>
                                    {formatAmount(entry.value as number, true)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                         );
                       }
                       return null;
                     }}
                   />
                   
                   <Area 
                     type="monotone" 
                     dataKey="income" 
                     name="Credit"
                     stroke="#10b981" 
                     fillOpacity={0.1} 
                     fill="#10b981" 
                     strokeWidth={3}
                     isAnimationActive={false}
                   />
                   
                   <Area 
                     type="monotone" 
                     dataKey="expense" 
                     name="Debit"
                     stroke="#6366f1" 
                     fillOpacity={0.1} 
                     fill="#6366f1" 
                     strokeWidth={3}
                     isAnimationActive={false}
                   />
                 </AreaChart>
               </ResponsiveContainer>
             </div>

             {/* Bottom Summary Bars like in the image */}
             <div className="grid grid-cols-3 gap-2 mt-1 relative z-10 border-t border-slate-100 dark:border-border-color pt-2">
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-end">
                    <p className="text-[6px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Efficiency</p>
                    <p className="text-[8px] font-black text-indigo-500">{Math.round((1 - (stats.totalSpent / (stats.totalIncome || 1))) * 100)}%</p>
                  </div>
                  <div className="h-1 w-full bg-slate-100 dark:bg-input-bg rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(100, Math.max(0, (1 - (stats.totalSpent / (stats.totalIncome || 1))) * 100))}%` }}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-end">
                    <p className="text-[6px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Savings</p>
                    <p className="text-[8px] font-black text-emerald-500">{Math.round((stats.savedSoFar / (stats.totalIncome || 1)) * 100)}%</p>
                  </div>
                  <div className="h-1 w-full bg-slate-100 dark:bg-input-bg rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(100, Math.max(0, (stats.savedSoFar / (stats.totalIncome || 1)) * 100))}%` }}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-end">
                    <p className="text-[6px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Budget</p>
                    <p className="text-[8px] font-black text-amber-500">{Math.round((stats.totalSpent / (stats.moneyForDailySpending || 1)) * 100)}%</p>
                  </div>
                  <div className="h-1 w-full bg-slate-100 dark:bg-input-bg rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(100, (stats.totalSpent / (stats.moneyForDailySpending || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
             </div>
          </div>

        {/* Quick Activity List */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-lg font-black tracking-tight uppercase text-slate-800 dark:text-slate-200">{t.recent_activity}</h2>
            <button 
              onClick={() => setActiveTab('history')} 
              className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-white dark:bg-card-bg border border-slate-100 dark:border-border-color px-4 py-2 rounded-xl transition-all uppercase tracking-widest apple-press-effect"
            >
              {t.see_all}
            </button>
          </div>
          
          <div className="flex flex-col gap-3">
            {transactions.length === 0 ? (
              <div className="bg-white dark:bg-card-bg p-12 text-center border-2 border-dashed border-slate-100 dark:border-border-color rounded-3xl flex flex-col gap-3">
                <div className="w-14 h-14 bg-slate-50 dark:bg-input-bg/50 rounded-2xl border border-slate-100 dark:border-border-color flex items-center justify-center mx-auto text-indigo-400">
                  <Calendar size={28} />
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest text-[10px]">{t.no_activity}</p>
              </div>
            ) : (
              transactions.slice(0, 5).map((tx) => (
                <TransactionItem 
                  key={tx.id}
                  tx={tx}
                  lang={lang}
                  formatAmount={formatAmount}
                  onClick={(tx) => {
                    setSelectedTx(tx);
                    setIsDetailModalOpen(true);
                  }}
                  onDelete={handleDeleteTransaction}
                  isMounted={mounted}
                />
              ))
            )}
          </div>
        </div>
      </main>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative pb-32 p-safe" suppressHydrationWarning>
      
      {/* App Lock Screen Overlay */}
      {isAppLockEnabled && isAppLocked && (
        <div className="fixed inset-0 z-[1000] bg-slate-50 dark:bg-background flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="w-full max-w-xs flex flex-col items-center gap-8">
            <div className="w-20 h-20 bg-indigo-600 rounded-[24px] flex items-center justify-center text-white rotate-3 shadow-xl">
              <Lock size={40} strokeWidth={2.5} />
            </div>
            
            <div className="text-center flex flex-col gap-2">
              <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{t.app_lock}</h2>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t.enter_pin}</p>
            </div>

            <div className="flex flex-col items-center gap-6 w-full">
              <div className="flex gap-4">
                {[...Array(4)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                      tempPin.length > i 
                        ? 'bg-indigo-600 border-indigo-600 scale-110' 
                        : 'bg-transparent border-slate-300 dark:border-slate-700'
                    }`}
                  />
                ))}
              </div>

              {pinError && (
                <p className="text-xs font-black text-red-500 uppercase tracking-widest animate-bounce">{pinError}</p>
              )}

              <div className="grid grid-cols-3 gap-4 w-full px-4 mt-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'clear', 0, 'delete'].map((num, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (num === 'clear') setTempPin("");
                      else if (num === 'delete') setTempPin(prev => prev.slice(0, -1));
                      else if (tempPin.length < 4) {
                        const newPin = tempPin + num;
                        setTempPin(newPin);
                        if (newPin.length === 4) {
                          setTimeout(() => {
                            const actualPin = appLockPin || localStorage.getItem("money_history_app_lock_pin");
                            if (newPin === actualPin) {
                              setIsAppLocked(false);
                              setTempPin("");
                              setPinError(null);
                            } else {
                              setPinError(t.wrong_pin);
                              setTempPin("");
                            }
                          }, 300);
                        }
                      }
                    }}
                    className={`h-16 rounded-2xl flex items-center justify-center text-xl font-black transition-all apple-press-effect ${
                      num === 'clear' || num === 'delete'
                        ? 'bg-slate-100 dark:bg-input-bg text-slate-500'
                        : 'bg-white dark:bg-card-bg text-slate-800 dark:text-white border border-slate-100 dark:border-border-color shadow-sm'
                    }`}
                  >
                    {num === 'delete' ? <Delete size={20} /> : num === 'clear' ? 'C' : num}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 w-full max-w-md mx-auto p-4 flex flex-col items-center">
        {successMessage && (
          <div className="fixed top-[calc(2rem+env(safe-area-inset-top))] left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-full duration-500 pointer-events-none">
            <div className="bg-emerald-500 text-white px-6 py-3 rounded-2xl flex items-center gap-3 border-none">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                <CheckCircle2 size={14} />
              </div>
              <span className="text-sm font-black uppercase tracking-widest">{successMessage}</span>
            </div>
          </div>
        )}
        {renderContent()}
      </div>

      <BottomNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        t={t}
        onAdd={() => {
          setModalType('expense');
          setIsAddModalOpen(true);
        }}
      />

      {/* Add Transaction Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 pb-safe modal-overlay animate-in fade-in duration-300">
          <div className="w-full max-w-md modal-content p-6 sm:p-8 animate-in slide-in-from-bottom-full duration-500 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6 sm:mb-8">
              <h2 className="text-2xl font-black uppercase tracking-tight truncate mr-4">
                {modalType === 'income' ? t.income : t.expense}
              </h2>
              <button onClick={() => setIsAddModalOpen(false)} className="modal-close-btn shrink-0">×</button>
            </div>

            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Amount</label>
                <div className="relative">
                  <input 
                    type="text" 
                    inputMode="text"
                    placeholder="e.g. 500+200*2"
                    autoFocus
                    value={newTx.amount}
                    onChange={(e) => setNewTx({...newTx, amount: formatInputWithCommas(e.target.value)})}
                    onBlur={(e) => {
                      const evaluated = evaluateExpression(e.target.value);
                      setNewTx({...newTx, amount: formatInputWithCommas(evaluated)});
                    }}
                    className="w-full pl-6 pr-14 py-5 modern-input text-3xl font-black outline-none"
                  />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-400/50">{currencySymbol}</span>
                </div>
                {newTx.amount && (
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest ml-1 animate-in fade-in slide-in-from-top-1">
                    Result: {currencySymbol}{formatAmount(evaluateExpression(newTx.amount))}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Title / Description</label>
                <input 
                  type="text" 
                  placeholder="What's this for?"
                  value={newTx.title}
                  onChange={(e) => setNewTx({...newTx, title: e.target.value})}
                  className="w-full px-5 py-4 modern-input text-sm font-bold outline-none"
                />
                <div className="flex flex-wrap gap-2 mt-1">
                  {(modalType === 'expense' ? EXPENSE_SUGGESTIONS : INCOME_SUGGESTIONS).map((suggestion) => (
                    <button
                      key={suggestion.title}
                      onClick={() => setNewTx({
                        ...newTx,
                        title: suggestion.title,
                        category: suggestion.category
                      })}
                      className="px-3 py-1.5 text-[10px] font-bold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors border border-indigo-100 dark:border-indigo-800 apple-press-effect"
                    >
                      {suggestion.title}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Category</label>
                <div className="grid grid-cols-4 gap-2">
                  {(modalType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setNewTx({...newTx, category: cat})}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all duration-200 apple-press-effect ${
                        newTx.category === cat 
                          ? 'bg-indigo-600 dark:bg-indigo-500 text-white border-indigo-600 dark:border-indigo-500' 
                      : 'bg-white dark:bg-card-bg border-slate-100 dark:border-border-color hover:border-indigo-500/30'
                  }`}
                >
                  <span className="text-xl mb-1">{CATEGORY_ICONS[cat] || '💸'}</span>
                  <span className="text-[8px] font-black uppercase tracking-tighter truncate w-full text-center">{cat}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Account</label>
              <div className="flex gap-2">
                {ACCOUNTS.map(acc => (
                  <button
                    key={acc}
                    onClick={() => setNewTx({...newTx, account: acc as any})}
                    className={`flex-1 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all duration-200 apple-press-effect ${
                      newTx.account === acc 
                        ? 'bg-indigo-600 dark:bg-indigo-500 text-white border-indigo-600 dark:border-indigo-500' 
                        : 'bg-white dark:bg-card-bg border-slate-100 dark:border-border-color hover:border-indigo-500/30'
                    }`}
                  >
                    {acc}
                  </button>
                ))}
              </div>
            </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Date</label>
                  <div className="relative">
                    <input 
                      type="datetime-local" 
                      value={newTx.date}
                      onChange={(e) => setNewTx({...newTx, date: e.target.value})}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                    />
                    <div className="w-full px-4 py-3.5 modern-input flex items-center justify-between group-focus-within:border-indigo-500/50 transition-all">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">
                          {new Date(newTx.date).toLocaleDateString(lang, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                          {new Date(newTx.date).toLocaleTimeString(lang, { hour: 'numeric', minute: '2-digit' })}
                        </span>
                      </div>
                      <Calendar size={16} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Note (Optional)</label>
                <textarea 
                  placeholder="Add a detailed note..."
                  value={newTx.note}
                  onChange={(e) => setNewTx({...newTx, note: e.target.value})}
                  className="w-full px-5 py-3 modern-input text-sm font-medium outline-none h-20 resize-none"
                />
              </div>

              <button 
                onClick={handleAddTransaction}
                disabled={!newTx.title || !newTx.amount}
                className={`w-full py-5 rounded-2xl font-black text-white transition-all apple-press-effect mt-2 disabled:opacity-50 border-none ${modalType === 'income' ? 'bg-emerald-500' : 'bg-red-500'}`}
              >
                {lang === 'bn' ? (modalType === 'income' ? 'ক্রেডিট যোগ করুন' : 'ডেবিট যোগ করুন') : `Add ${modalType === 'income' ? 'Credit' : 'Debit'}`}
              </button>
            </div>
        </div>
      </div>
    )}

      {/* Transaction Detail Modal */}
      {isDetailModalOpen && selectedTx && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center p-0 pb-safe sm:p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/40 dark:bg-black/60" onClick={() => setIsDetailModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-card-bg rounded-t-[32px] sm:rounded-[32px] overflow-hidden animate-in slide-in-from-bottom-full duration-500">
            <div className={`h-32 w-full flex items-center justify-center relative ${selectedTx.type === 'income' ? 'bg-emerald-500' : 'bg-red-500'}`}>
              <div className="absolute top-4 right-4">
                <button onClick={() => setIsDetailModalOpen(false)} className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors">
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>
              <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center text-4xl text-white">
                {selectedTx.category === "Food" ? "🍔" : 
                 selectedTx.category === "Salary" ? "💰" :
                 selectedTx.category === "Transport" ? "🚗" : 
                 selectedTx.category === "Shopping" ? "🛍️" : 
                 selectedTx.category === "Bills" ? "📄" : "💸"}
              </div>
            </div>
            
            <div className="p-8 flex flex-col gap-6">
              <div className="flex flex-col items-center text-center gap-1">
                <h3 className="text-2xl font-black text-slate-800 dark:text-white">{selectedTx.title}</h3>
                <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em]">{selectedTx.category}</p>
              </div>

              <div className="flex justify-around items-center py-4 bg-slate-50 dark:bg-input-bg border border-slate-100 dark:border-border-color rounded-2xl">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Amount</span>
                  <span className={`text-xl font-black ${selectedTx.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>
                    {selectedTx.type === 'income' ? '+' : '-'}{formatAmount(selectedTx.amount, true)}
                  </span>
                </div>
                <div className="w-px h-8 bg-slate-200 dark:bg-border-color" />
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Account</span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{selectedTx.account}</span>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                  <Calendar size={18} />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{new Date(selectedTx.date).toLocaleDateString(lang, { dateStyle: 'full' })}</span>
                </div>
                {selectedTx.note && (
                  <div className="flex items-start gap-3 text-slate-500 dark:text-slate-400">
                    <Settings size={18} className="mt-0.5" />
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Note</span>
                      <p className="text-sm font-medium italic text-slate-700 dark:text-slate-300">"{selectedTx.note}"</p>
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={() => {
                  handleDeleteTransaction(selectedTx.id);
                  setIsDetailModalOpen(false);
                }}
                className="mt-4 flex items-center justify-center gap-2 w-full py-4 bg-red-50 text-red-500 dark:bg-red-500/10 rounded-2xl font-black text-sm apple-press-effect hover:bg-red-100 transition-colors"
              >
                <Trash2 size={18} />
                Delete Transaction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Budget Settings Modal */}
      {isBudgetModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/40 dark:bg-black/60" onClick={() => setIsBudgetModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-card-bg rounded-[32px] overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-300">
            {/* Sticky Header */}
            <div className="sticky top-0 z-20 flex justify-between items-center p-6 sm:px-8 sm:py-6 bg-white dark:bg-card-bg border-b border-slate-100 dark:border-border-color/50">
              <div className="flex flex-col gap-0.5 min-w-0">
                <h2 className="text-2xl font-black uppercase tracking-tight truncate text-slate-800 dark:text-white">{t.budget_settings}</h2>
                <div className="flex gap-2 items-center overflow-x-auto no-scrollbar">
                  <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Update your monthly plans</p>
                  <button 
                    onClick={() => {
                      if (editBudget?.income) {
                        const income = Number(evaluateExpression(editBudget.income));
                        if (income > 0) {
                          const recommendedSavings = Math.floor(income * 0.2);
                          setEditBudget({
                            ...editBudget,
                            savings: recommendedSavings.toString()
                          });
                          setSuccessMessage("Smart Goal: 20% savings set!");
                          setTimeout(() => setSuccessMessage(null), 3000);
                        }
                      }
                    }}
                    className="px-2 py-0.5 bg-indigo-500/10 text-indigo-500 text-[8px] font-black rounded-full uppercase tracking-tighter hover:bg-indigo-500/20 transition-colors"
                  >
                    Auto-Plan 20%
                  </button>
                </div>
              </div>
              <button onClick={() => setIsBudgetModalOpen(false)} className="modal-close-btn">×</button>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
              <div className="flex flex-col gap-6 pb-4">
                {/* Budget Automation Presets */}
                <div className="flex flex-col gap-3">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">Budget Automation Presets</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        if (editBudget) {
                          const income = Number(evaluateExpression(editBudget.income));
                          const savings = Math.round(income * 0.2);
                          setEditBudget({...editBudget, savings: savings.toString()});
                        }
                      }}
                      className="bg-white dark:bg-input-bg p-4 rounded-2xl border border-slate-100 dark:border-border-color flex flex-col items-center gap-2 group hover:bg-indigo-500 hover:text-white transition-all duration-300"
                    >
                      <span className="text-xl">🎯</span>
                      <span className="text-[10px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest group-hover:text-white transition-colors">Save 20%</span>
                    </button>
                    <button
                      onClick={() => {
                        if (editBudget) {
                          const income = Number(evaluateExpression(editBudget.income));
                          const savings = Math.round(income * 0.5);
                          setEditBudget({...editBudget, savings: savings.toString()});
                        }
                      }}
                      className="bg-white dark:bg-input-bg p-4 rounded-2xl border border-slate-100 dark:border-border-color flex flex-col items-center gap-2 group hover:bg-emerald-500 hover:text-white transition-all duration-300"
                    >
                      <span className="text-xl">🚀</span>
                      <span className="text-[10px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest group-hover:text-white transition-colors">Aggressive (50%)</span>
                    </button>
                    <button
                      onClick={() => {
                        if (editBudget) {
                          const income = Number(evaluateExpression(editBudget.income));
                          const savings = Math.round(income * 0.2);
                          const fixedTotal = Math.round(income * 0.5);
                          
                          // Auto-add fixed expenses based on 50/30/20 rule
                          setEditBudget({
                            ...editBudget, 
                            savings: savings.toString(),
                            fixed: [
                              ...editBudget.fixed,
                              { id: Date.now().toString(), name: "Needs (50%)", amount: fixedTotal }
                            ]
                          });
                          setSuccessMessage("50/30/20 Rule Applied!");
                          setTimeout(() => setSuccessMessage(null), 3000);
                        }
                      }}
                      className="bg-white dark:bg-input-bg p-4 rounded-2xl border border-slate-100 dark:border-border-color flex flex-col items-center gap-2 group hover:bg-amber-500 hover:text-white transition-all duration-300 col-span-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">⚖️</span>
                        <span className="text-[10px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest group-hover:text-white transition-colors">50/30/20 Rule</span>
                      </div>
                      <p className="text-[8px] font-bold text-slate-500 dark:text-slate-400 group-hover:text-white/80 transition-colors">50% Needs, 30% Wants, 20% Savings</p>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">{t.monthly_income}</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg group-focus-within:scale-110 transition-transform">
                      <Wallet size={16} className="text-indigo-500" />
                    </div>
                    <input 
                        type="text" 
                        inputMode="text"
                        value={editBudget?.income ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditBudget(prev => prev ? {...prev, income: formatInputWithCommas(val)} : null);
                      }}
                      onBlur={(e) => {
                        const val = e.target.value;
                        const evaluated = evaluateExpression(val);
                        setEditBudget(prev => prev ? {...prev, income: formatInputWithCommas(evaluated)} : null);
                      }}
                      className="w-full bg-slate-50 dark:bg-input-bg border-2 border-transparent focus:border-indigo-500/20 rounded-2xl py-4 pl-14 pr-10 text-base font-bold text-slate-700 dark:text-slate-200 transition-all outline-none"
                      placeholder="e.g. 50000+5000"
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{currencySymbol}</span>
                  </div>
                  {editBudget?.income && (
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest ml-1 animate-in fade-in slide-in-from-top-1">
                      Result: {currencySymbol}{formatAmount(evaluateExpression(editBudget.income))}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">{t.savings_goal}</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg group-focus-within:scale-110 transition-transform">
                      <TrendingUp size={16} className="text-emerald-500" />
                    </div>
                    <input 
                        type="text" 
                        inputMode="text"
                        value={editBudget?.savings ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditBudget(prev => prev ? {...prev, savings: formatInputWithCommas(val)} : null);
                      }}
                      onBlur={(e) => {
                        const val = e.target.value;
                        const evaluated = evaluateExpression(val);
                        setEditBudget(prev => prev ? {...prev, savings: formatInputWithCommas(evaluated)} : null);
                      }}
                      className="w-full bg-slate-50 dark:bg-input-bg border-2 border-transparent focus:border-indigo-500/20 rounded-2xl py-4 pl-14 pr-10 text-base font-bold text-slate-700 dark:text-slate-200 transition-all outline-none"
                      placeholder="e.g. 10000+2000"
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{currencySymbol}</span>
                  </div>
                  {editBudget?.savings && (
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest ml-1 animate-in fade-in slide-in-from-top-1">
                      Result: {currencySymbol}{formatAmount(evaluateExpression(editBudget.savings))}
                    </p>
                  )}
                </div>

                {/* Fixed Expenses Section */}
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Fixed Expenses</label>
                  </div>

                  {/* Quick Suggestions Buttons */}
                  <div className="flex flex-wrap gap-2 px-1 mb-1">
                    {[
                      { name: 'Home Rent', icon: <HomeIcon size={10} /> },
                      { name: 'Utility Bill', icon: <Zap size={10} /> },
                      { name: 'Internet', icon: <Wifi size={10} /> },
                      { name: 'Gym', icon: <Dumbbell size={10} /> },
                      { name: 'Insurance', icon: <ShieldCheck size={10} /> },
                      { name: 'OTT/Netflix', icon: <Tv size={10} /> },
                      { name: 'Custom', icon: <Plus size={10} />, isCustom: true }
                    ].map((item) => (
                      <button
                        key={item.name}
                        onClick={() => {
                          setEditBudget(prev => {
                            if (!prev) return prev;
                            const newId = Date.now().toString();
                            const newName = item.isCustom ? "" : item.name;
                            
                            // Check if already exists to avoid duplicates (except for custom)
                            if (item.isCustom || !prev.fixed.some(f => f.name === item.name)) {
                              return {
                                ...prev,
                                fixed: [...prev.fixed, { id: newId, name: newName, amount: 0 }]
                              };
                            }
                            return prev;
                          });
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-full text-[10px] font-bold transition-all apple-press-effect ${
                          item.isCustom 
                            ? "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20" 
                            : "bg-slate-100 dark:bg-input-bg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border-slate-200 dark:border-border-color text-slate-600 dark:text-slate-400 hover:text-indigo-500"
                        }`}
                      >
                        {item.icon}
                        {item.name}
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    {editBudget?.fixed.map((expense, index) => (
                      <div key={expense.id || index} className="flex gap-3 items-center p-3 bg-white dark:bg-input-bg border border-slate-100 dark:border-border-color/50 rounded-2xl animate-in fade-in slide-in-from-left-4 duration-300">
                        <div className="flex-1 relative">
                          <input 
                            type="text"
                            placeholder="Expense Name"
                            value={expense.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditBudget(prev => {
                                if (!prev) return prev;
                                const newFixed = prev.fixed.map((f, i) => 
                                  i === index ? { ...f, name: val } : f
                                );
                                return { ...prev, fixed: newFixed };
                              });
                            }}
                            className="w-full bg-transparent border-none p-0 text-sm font-bold outline-none placeholder:text-slate-400"
                          />
                        </div>
                        <div className="w-32 relative flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-card-bg rounded-xl border border-slate-100 dark:border-border-color focus-within:border-indigo-500/30 transition-all">
                          <input 
                            type="text" 
                            inputMode="text"
                            placeholder="0"
                            value={expense.amount === 0 ? "" : formatInputWithCommas(expense.amount.toString())}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditBudget(prev => {
                                if (!prev) return prev;
                                const newFixed = prev.fixed.map((f, i) => 
                                  i === index ? { ...f, amount: formatInputWithCommas(val) as any } : f
                                );
                                return { ...prev, fixed: newFixed };
                              });
                            }}
                            onBlur={(e) => {
                              const val = e.target.value;
                              const evaluated = evaluateExpression(val);
                              setEditBudget(prev => {
                                if (!prev) return prev;
                                const newFixed = prev.fixed.map((f, i) => 
                                  i === index ? { ...f, amount: Number(evaluated) } : f
                                );
                                return { ...prev, fixed: newFixed };
                              });
                            }}
                            className="w-full bg-transparent border-none p-0 text-sm font-black outline-none text-right"
                          />
                          <span className="text-[10px] font-bold text-slate-400">{currencySymbol}</span>
                        </div>
                        <button 
                          onClick={() => {
                            setEditBudget(prev => {
                              if (!prev) return prev;
                              const newFixed = prev.fixed.filter((_, i) => i !== index);
                              return { ...prev, fixed: newFixed };
                            });
                          }}
                          className="p-2 text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    
                    {editBudget?.fixed.length === 0 && (
                      <div className="text-center py-6 bg-white dark:bg-input-bg border-dashed border-2 border-slate-200 dark:border-border-color rounded-2xl">
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">No fixed expenses added</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white dark:bg-input-bg p-5 border border-slate-100 dark:border-border-color border-l-4 border-l-indigo-500 mt-2 rounded-2xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                      <ShieldCheck size={18} className="text-indigo-500" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Financial Tip</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    Setting a realistic savings goal helps you stay consistent. We recommend saving at least 20% of your monthly income.
                  </p>
                </div>

                <button 
                  onClick={() => {
                    if (editBudget && setup) {
                      const newSetup: SetupData = {
                        totalIncome: Number(evaluateExpression(editBudget.income)),
                        savingsGoal: Number(evaluateExpression(editBudget.savings)),
                        fixedExpenses: editBudget.fixed.map(f => ({
                          ...f,
                          amount: Number(evaluateExpression(f.amount.toString()))
                        })),
                        autoAdjustSavings: editBudget.autoAdjust,
                        setupDate: new Date().toISOString()
                      };
                      setSetup(newSetup);
                      localStorage.setItem("money_history_setup", JSON.stringify(newSetup));
                      syncDataToCloud();
                      setIsBudgetModalOpen(false);
                      setSuccessMessage("Budget successfully updated!");
                      setTimeout(() => setSuccessMessage(null), 3000);
                    }
                  }}
                  className="modern-button w-full py-4 text-sm uppercase tracking-[0.2em] mt-4"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-end justify-center p-4 pb-safe modal-overlay animate-in fade-in duration-300">
          <div className="w-full max-w-md modal-content animate-in slide-in-from-bottom-full duration-500 flex flex-col max-h-[90vh] overflow-hidden bg-white dark:bg-card-bg">
            {/* Sticky Header */}
            <div className="sticky top-0 z-20 flex justify-between items-center p-6 sm:px-8 sm:py-6 bg-white dark:bg-card-bg border-b border-slate-100 dark:border-border-color/50">
              <h2 className="text-2xl font-black uppercase tracking-tight truncate mr-4">{t.app_settings}</h2>
              <button onClick={() => setIsSettingsModalOpen(false)} className="modal-close-btn shrink-0">×</button>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
              <div className="flex flex-col gap-8 pb-4">
                {/* App Settings */}
              <section className="flex flex-col gap-3">
                <h3 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest px-2">{t.app_settings}</h3>
                <div className="flex flex-col gap-2">
                  <div className="bg-white dark:bg-card-bg p-4 rounded-2xl border border-slate-100 dark:border-border-color flex justify-between items-center group hover:bg-slate-50 dark:hover:bg-input-bg transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 dark:bg-input-bg rounded-xl group-hover:scale-110 transition-transform">
                        <Globe size={18} className="text-indigo-500" />
                      </div>
                      <span className="text-sm font-bold">{t.language}</span>
                    </div>
                    <button 
                      onClick={() => {
                        const newLang = lang === 'en' ? 'bn' : 'en';
                        setLang(newLang);
                        localStorage.setItem("money_history_lang", newLang);
                      }}
                      className="px-4 py-1.5 bg-slate-100 dark:bg-input-bg rounded-xl text-[10px] font-black uppercase tracking-widest apple-press-effect border border-slate-200 dark:border-border-color"
                    >
                      {lang === 'en' ? 'English' : 'বাংলা'}
                    </button>
                  </div>
                  <div className="bg-white dark:bg-card-bg p-4 rounded-2xl border border-slate-100 dark:border-border-color flex justify-between items-center group hover:bg-slate-50 dark:hover:bg-input-bg transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 dark:bg-input-bg rounded-xl group-hover:scale-110 transition-transform">
                        <Wallet size={18} className="text-emerald-500" />
                      </div>
                      <span className="text-sm font-bold">{t.currency}</span>
                    </div>
                    <select 
                      value={currency}
                      onChange={(e) => {
                        const newCurrency = e.target.value as any;
                        setCurrency(newCurrency);
                        localStorage.setItem("money_history_currency", newCurrency);
                      }}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-input-bg rounded-xl text-[10px] font-black uppercase tracking-widest outline-none border border-slate-200 dark:border-border-color cursor-pointer"
                    >
                      {Object.entries(CURRENCIES).map(([code, { name, symbol }]) => (
                        <option key={code} value={code} className="bg-white dark:bg-input-bg">
                          {code} ({symbol})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="bg-white dark:bg-card-bg p-4 rounded-2xl border border-slate-100 dark:border-border-color flex justify-between items-center group hover:bg-slate-50 dark:hover:bg-input-bg transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 dark:bg-input-bg rounded-xl group-hover:scale-110 transition-transform">
                        {theme === 'light' ? <Moon size={18} className="text-indigo-500" /> : <Sun size={18} className="text-amber-500" />}
                      </div>
                      <span className="text-sm font-bold">{t.theme}</span>
                    </div>
                    <button 
                      onClick={toggleTheme}
                      className="px-4 py-1.5 bg-slate-100 dark:bg-input-bg rounded-xl text-[10px] font-black uppercase tracking-widest apple-press-effect border border-slate-200 dark:border-border-color"
                    >
                      {theme === 'light' ? 'Dark' : 'Light'}
                    </button>
                  </div>
                </div>
              </section>

              {/* Data & Support */}
              <section className="flex flex-col gap-3">
                <h3 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest px-2">Data & Support</h3>
                <div className="flex flex-col gap-2">
                  <button onClick={exportToCSV} className="bg-white dark:bg-card-bg p-4 rounded-2xl border border-slate-100 dark:border-border-color flex items-center gap-3 apple-press-effect text-left group hover:bg-slate-50 dark:hover:bg-input-bg transition-colors">
                    <div className="p-2 bg-slate-100 dark:bg-input-bg rounded-xl group-hover:scale-110 transition-transform">
                      <Download size={18} className="text-emerald-500" />
                    </div>
                    <span className="text-sm font-bold">{t.export}</span>
                  </button>

                  <button 
                    onClick={() => {
                      if (window.confirm(t.confirm_clear)) {
                        handleResetHistory();
                      }
                    }} 
                    className="bg-white dark:bg-card-bg p-4 rounded-2xl border border-red-500/20 hover:bg-red-50 dark:hover:bg-red-900/10 apple-press-effect text-left group transition-colors flex items-center gap-3"
                  >
                    <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-xl group-hover:scale-110 transition-transform">
                      <Trash2 size={18} className="text-red-500" />
                    </div>
                    <span className="text-sm font-bold text-red-500">{t.clear_history}</span>
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    )}

      {/* Edit Name Modal */}
      {isEditNameModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-[2px]" onClick={() => setIsEditNameModalOpen(false)} />
          <div className="relative w-full max-w-xs bg-white dark:bg-card-bg rounded-[32px] overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-black uppercase tracking-tight text-slate-800 dark:text-slate-200">Edit Name</h3>
                <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Update your profile name</p>
              </div>
              
              <div className="relative">
                <input 
                  type="text" 
                  value={tempDisplayName}
                  onChange={(e) => setTempDisplayName(e.target.value)}
                  autoFocus
                  className="w-full bg-slate-50 dark:bg-input-bg border-2 border-indigo-500/20 rounded-2xl py-3 px-4 text-[16px] font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500 transition-all"
                  placeholder="Enter name..."
                />
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => setIsEditNameModalOpen(false)}
                  className="flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-500 bg-slate-100 dark:bg-input-bg apple-press-effect"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    updateDisplayName(tempDisplayName);
                    setIsEditNameModalOpen(false);
                    setSuccessMessage("Name updated successfully!");
                    setTimeout(() => setSuccessMessage(null), 3000);
                  }}
                  className="flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-white bg-indigo-600 apple-press-effect"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Goal Modal */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 modal-overlay animate-in fade-in duration-300">
          <div className="w-full max-w-sm modal-content p-6 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black uppercase tracking-tight text-slate-800 dark:text-slate-200">{t.set_goal || "Set Your Goal"}</h2>
              <button onClick={() => setIsGoalModalOpen(false)} className="modal-close-btn">×</button>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Goal Name</label>
                <input 
                  type="text" 
                  placeholder={lang === 'bn' ? "যেমন: নতুন বাইক কেনা" : "e.g. Buying a new bike"}
                  className="w-full bg-slate-100 dark:bg-input-bg border-2 border-transparent focus:border-indigo-500 rounded-2xl px-5 py-3.5 text-[16px] font-bold outline-none transition-all"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                />
              </div>
              
              <button 
                onClick={() => setIsGoalModalOpen(false)}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs apple-press-effect mt-2"
              >
                {t.save || "Save Goal"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Data Modal */}
      {isRestoreModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 modal-overlay animate-in fade-in duration-300">
          <div className="w-full max-w-sm modal-content p-6 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black uppercase tracking-tight truncate mr-4">
                {lang === 'bn' ? 'ডাটা রিস্টোর করুন' : 'Restore Data'}
              </h2>
              <button onClick={() => setIsRestoreModalOpen(false)} className="modal-close-btn">×</button>
            </div>

            <div className="flex flex-col gap-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                {lang === 'bn' ? 'আপনার ইউনিক সিঙ্ক কোডটি লিখুন যা দিয়ে আপনি অন্য ডিভাইসে ডাটা রিকভার করতে চান।' : 'Enter your unique sync code to recover your data from another device.'}
              </p>
              
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="e.g. MH-A1B2C3"
                  className="modern-input w-full uppercase font-mono tracking-widest text-center"
                  value={restoreCode}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase().replace(/\s/g, '');
                    setRestoreCode(val);
                  }}
                  disabled={restoreStatus === 'loading' || restoreStatus === 'success'}
                />
              </div>

              {restoreStatus === 'error' && (
                <p className="text-[10px] font-bold text-red-500 text-center uppercase tracking-widest animate-pulse">
                  {lang === 'bn' ? 'ভুল কোড বা ডাটা পাওয়া যায়নি!' : 'Invalid code or no data found!'}
                </p>
              )}

              {restoreStatus === 'success' && (
                <p className="text-[10px] font-bold text-emerald-500 text-center uppercase tracking-widest">
                  {lang === 'bn' ? 'ডাটা সফলভাবে রিস্টোর হয়েছে!' : 'Data restored successfully!'}
                </p>
              )}

              <button 
                onClick={() => restoreDataByCode(restoreCode)}
                disabled={restoreCode.length < 5 || restoreStatus === 'loading' || restoreStatus === 'success'}
                className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all apple-press-effect flex items-center justify-center gap-2 ${
                  restoreStatus === 'loading' ? 'bg-slate-100 dark:bg-input-bg text-slate-400' :
                  restoreStatus === 'success' ? 'bg-emerald-500 text-white' :
                  'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                {restoreStatus === 'loading' ? (
                  <div className="w-4 h-4 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin" />
                ) : (
                  <RefreshCw size={14} />
                )}
                {restoreStatus === 'loading' ? (lang === 'bn' ? 'চেক করা হচ্ছে...' : 'Checking...') : 
                 restoreStatus === 'success' ? (lang === 'bn' ? 'সম্পন্ন' : 'Success') : 
                 (lang === 'bn' ? 'ডাটা রিকভার করুন' : 'Recover My Data')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PIN Setup/Verify Modal */}
      {isDebtModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 modal-overlay animate-in fade-in duration-300">
          <div className="w-full max-w-sm modal-content p-6 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6">
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-black uppercase tracking-tight text-slate-800 dark:text-slate-200">{lang === 'bn' ? 'নতুন ধার-দেনা' : 'Add New Debt/Loan'}</h2>
                <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Create a new record</p>
              </div>
              <button onClick={() => setIsDebtModalOpen(false)} className="modal-close-btn">×</button>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{lang === 'bn' ? 'ব্যক্তির নাম' : 'Person Name'}</label>
                <input 
                  type="text" 
                  placeholder="e.g. Noman"
                  className="modern-input w-full"
                  value={debtForm.person}
                  onChange={(e) => setDebtForm(prev => ({ ...prev, person: e.target.value }))}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.amount}</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-indigo-500 transition-transform group-focus-within:scale-110">
                    {CURRENCIES[currency as keyof typeof CURRENCIES].symbol}
                  </div>
                  <input 
                    type="text" 
                    placeholder="0.00"
                    className="modern-input w-full !pl-10 text-xl"
                    value={debtForm.amount}
                    onChange={(e) => setDebtForm(prev => ({ ...prev, amount: formatInputWithCommas(e.target.value) }))}
                    onBlur={() => {
                      const evaled = evaluateExpression(debtForm.amount);
                      setDebtForm(prev => ({ ...prev, amount: formatInputWithCommas(evaled.toString()) }));
                    }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{lang === 'bn' ? 'ধরণ' : 'Type'}</label>
                <div className="flex bg-slate-100 dark:bg-input-bg p-1.5 rounded-2xl">
                  <button
                    onClick={() => setDebtForm(prev => ({ ...prev, type: 'owe' }))}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all apple-press-effect ${
                      debtForm.type === 'owe' ? 'bg-white dark:bg-card-bg text-red-500 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    {lang === 'bn' ? 'আমি দেব' : 'I Owe'}
                  </button>
                  <button
                    onClick={() => setDebtForm(prev => ({ ...prev, type: 'lent' }))}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all apple-press-effect ${
                      debtForm.type === 'lent' ? 'bg-white dark:bg-card-bg text-emerald-500 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    {lang === 'bn' ? 'আমি পাব' : 'I Lent'}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.note}</label>
                <input 
                  type="text" 
                  placeholder="What is this for?"
                  className="modern-input w-full"
                  value={debtForm.note}
                  onChange={(e) => setDebtForm(prev => ({ ...prev, note: e.target.value }))}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.date}</label>
                <input 
                  type="date" 
                  className="modern-input w-full"
                  value={debtForm.date}
                  onChange={(e) => setDebtForm(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              
              <button 
                onClick={handleAddDebt}
                disabled={!debtForm.person || !debtForm.amount || parseFloat(debtForm.amount) === 0}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs apple-press-effect mt-2 disabled:opacity-50"
              >
                {t.save || "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isRepaymentModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 modal-overlay animate-in fade-in duration-300">
          <div className="w-full max-w-sm modal-content p-6 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6">
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-black uppercase tracking-tight text-slate-800 dark:text-slate-200">{lang === 'bn' ? 'পরিশোধ রেকর্ড' : 'Record Repayment'}</h2>
                <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  {selectedDebt?.person} ({formatAmount(calculateDebtRemaining(selectedDebt!), true)} remaining)
                </p>
              </div>
              <button onClick={() => setIsRepaymentModalOpen(false)} className="modal-close-btn">×</button>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{lang === 'bn' ? 'পরিশোধের পরিমাণ' : 'Repayment Amount'}</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-indigo-500 transition-transform group-focus-within:scale-110">
                    {CURRENCIES[currency as keyof typeof CURRENCIES].symbol}
                  </div>
                  <input 
                    type="text" 
                    placeholder="0.00"
                    className="modern-input w-full !pl-10 text-xl"
                    value={repaymentForm.amount}
                    onChange={(e) => setRepaymentForm(prev => ({ ...prev, amount: formatInputWithCommas(e.target.value) }))}
                    onBlur={() => {
                      const evaled = evaluateExpression(repaymentForm.amount);
                      setRepaymentForm(prev => ({ ...prev, amount: formatInputWithCommas(evaled.toString()) }));
                    }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.note}</label>
                <input 
                  type="text" 
                  placeholder="Any note?"
                  className="modern-input w-full"
                  value={repaymentForm.note}
                  onChange={(e) => setRepaymentForm(prev => ({ ...prev, note: e.target.value }))}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.date}</label>
                <input 
                  type="date" 
                  className="modern-input w-full"
                  value={repaymentForm.date}
                  onChange={(e) => setRepaymentForm(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              
              <button 
                onClick={handleAddRepayment}
                disabled={!repaymentForm.amount || parseFloat(repaymentForm.amount) === 0}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs apple-press-effect mt-2 disabled:opacity-50"
              >
                {lang === 'bn' ? 'পরিশোধ সম্পন্ন করুন' : 'Complete Repayment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isPinModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 modal-overlay animate-in fade-in duration-300">
          <div className="w-full max-w-xs modal-content p-8 animate-in zoom-in-95 duration-300 border-t-4 border-t-indigo-600">
            <div className="flex flex-col items-center gap-6">
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Lock size={32} />
              </div>
              
              <div className="text-center flex flex-col gap-1">
                <h3 className="text-lg font-black uppercase tracking-tight text-slate-800 dark:text-slate-200">
                  {pinModalMode === 'set' 
                    ? (confirmPin === "" ? t.set_pin : t.confirm_pin)
                    : (pinModalMode === 'verify' ? t.enter_pin : t.disable_lock)}
                </h3>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {pinModalMode === 'set' && confirmPin !== "" ? t.confirm_pin : t.enter_pin}
                </p>
              </div>

              <div className="flex flex-col items-center gap-4 w-full">
                <div className="flex gap-3">
                  {[...Array(4)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${
                        tempPin.length > i 
                          ? 'bg-indigo-600 border-indigo-600 scale-110' 
                          : 'bg-transparent border-slate-300 dark:border-slate-700'
                      }`}
                    />
                  ))}
                </div>

                {pinError && (
                  <p className="text-[10px] font-black text-red-500 uppercase tracking-widest animate-bounce">{pinError}</p>
                )}

                <div className="grid grid-cols-3 gap-3 w-full mt-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'clear', 0, 'delete'].map((num, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        if (num === 'clear') setTempPin("");
                        else if (num === 'delete') setTempPin(prev => prev.slice(0, -1));
                        else if (tempPin.length < 4) {
                          const newPin = tempPin + num;
                          setTempPin(newPin);
                          if (newPin.length === 4) {
                            // Small delay to show the last dot then submit
                            setTimeout(() => {
                              // We need to trigger handlePinSubmit logic manually here 
                              // because state won't be updated until next render
                              if (pinModalMode === 'set') {
                                if (confirmPin === "") {
                                  setConfirmPin(newPin);
                                  setTempPin("");
                                } else if (confirmPin === newPin) {
                                  localStorage.setItem("money_history_app_lock_pin", newPin);
                                  localStorage.setItem("money_history_app_lock_enabled", "true");
                                  setAppLockPin(newPin);
                                  setIsAppLockEnabled(true);
                                  setIsPinModalOpen(false);
                                  setSuccessMessage(t.lock_enabled);
                                  setTimeout(() => setSuccessMessage(null), 3000);
                                } else {
                                  setPinError(t.pin_mismatch);
                                  setTempPin("");
                                  setConfirmPin("");
                                }
                              } else if (pinModalMode === 'verify' || pinModalMode === 'disable') {
                                const actualPin = appLockPin || localStorage.getItem("money_history_app_lock_pin");
                                if (newPin === actualPin) {
                                  if (pinModalMode === 'verify') {
                                    setIsAppLocked(false);
                                    setIsPinModalOpen(false);
                                  } else {
                                    localStorage.removeItem("money_history_app_lock_pin");
                                    localStorage.setItem("money_history_app_lock_enabled", "false");
                                    setAppLockPin(null);
                                    setIsAppLockEnabled(false);
                                    setIsPinModalOpen(false);
                                    setSuccessMessage(t.lock_disabled);
                                    setTimeout(() => setSuccessMessage(null), 3000);
                                  }
                                } else {
                                  setPinError(t.wrong_pin);
                                  setTempPin("");
                                }
                              }
                            }, 300);
                          }
                        }
                      }}
                      className={`h-12 rounded-xl flex items-center justify-center text-lg font-black transition-all apple-press-effect ${
                        num === 'clear' || num === 'delete'
                          ? 'bg-slate-50 dark:bg-input-bg text-slate-400 text-sm'
                          : 'bg-white dark:bg-card-bg text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-border-color'
                      }`}
                    >
                      {num === 'delete' ? <Delete size={16} /> : num === 'clear' ? 'C' : num}
                    </button>
                  ))}
                </div>
                
                <div className="grid grid-cols-2 gap-3 w-full mt-2">
                  <button
                    onClick={() => setIsPinModalOpen(false)}
                    className="py-3 rounded-xl font-black uppercase tracking-widest text-[10px] text-slate-400 bg-slate-100 dark:bg-input-bg apple-press-effect"
                  >
                    {t.close}
                  </button>
                  <button
                    onClick={handlePinSubmit}
                    disabled={tempPin.length !== 4}
                    className="py-3 rounded-xl font-black uppercase tracking-widest text-[10px] bg-indigo-600 text-white apple-press-effect disabled:opacity-50"
                  >
                    {t.save || 'OK'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {isConfirmModalOpen && confirmConfig && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 modal-overlay animate-in fade-in duration-300">
          <div className="w-full max-w-xs modal-content p-6 animate-in zoom-in-95 duration-300 border-t-4 border-t-red-500">
            <div className="flex flex-col items-center text-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${confirmConfig.variant === 'danger' ? 'bg-red-50 text-red-500' : 'bg-indigo-50 text-indigo-500'}`}>
                {confirmConfig.variant === 'danger' ? <Trash2 size={32} /> : <Info size={32} />}
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-black uppercase tracking-tight text-slate-800 dark:text-slate-200">{confirmConfig.title}</h3>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{confirmConfig.message}</p>
              </div>
              <div className="flex flex-col w-full gap-2 mt-2">
                <button 
                  onClick={confirmConfig.onConfirm}
                  className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs apple-press-effect ${confirmConfig.variant === 'danger' ? 'bg-red-500 text-white' : 'bg-indigo-600 text-white'}`}
                >
                  {confirmConfig.confirmText || 'Confirm'}
                </button>
                <button 
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs text-slate-400 bg-slate-100 dark:bg-input-bg apple-press-effect"
                >
                  {confirmConfig.cancelText || 'Cancel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BottomNav({ activeTab, setActiveTab, t, onAdd }: { 
  activeTab: string, 
  setActiveTab: (t: string) => void, 
  t: any,
  onAdd: () => void
}) {
  const tabs = [
    { id: 'home', icon: <HomeIcon size={20} />, label: t.home },
    { id: 'stats', icon: <PieChartIcon size={20} />, label: t.stats },
    { id: 'debts', icon: <Banknote size={20} />, label: t.debts_loans || "Debts" },
    { id: 'planner', icon: <TrendingUp size={20} />, label: t.planner },
    { id: 'history', icon: <RefreshCw size={20} />, label: t.history },
    { id: 'profile', icon: <User size={20} />, label: t.profile }
  ];

  const activeIndex = tabs.findIndex(tab => tab.id === activeTab);

  return (
    <div className="fixed bottom-4 left-4 right-4 mx-auto max-w-[420px] bg-white dark:bg-card-bg border-2 border-slate-100 dark:border-border-color px-2 h-[70px] rounded-[30px] flex items-center justify-around z-50 mb-[env(safe-area-inset-bottom)]">
      {/* Nav Items */}
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 apple-press-effect ${
            activeTab === tab.id 
              ? 'bg-indigo-600 dark:bg-indigo-500 text-white scale-110' 
              : 'text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400'
          }`}
        >
          <div className="flex flex-col items-center gap-0.5">
            <span className="transition-transform duration-300">
              {tab.icon}
            </span>
            <span className={`text-[8px] font-black uppercase tracking-tighter transition-all duration-300 ${activeTab === tab.id ? 'opacity-100' : 'opacity-60'}`}>
              {tab.label}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
