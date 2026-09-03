import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Lang = 'en' | 'ur';

const translations = {
  // Landing
  tagline: { en: 'Paisa Soch Ke Chalao, Future AI Se Poochho', ur: 'پیسہ سوچ کے چلاؤ، فیوچر AI سے پوچھو' },
  taglineRoman: { en: 'Paisa Soch Ke Chalao, Future AI Se Poochho', ur: 'Paisa Soch Ke Chalao, Future AI Se Poochho' },
  taglineSub: { en: 'Pakistan ka pehla AI Financial Digital Twin. Har faisla pehle test karo.', ur: 'پاکستان کا پہلا AI فنانشل ڈیجیٹل ٹوئن۔ ہر فیصلہ پہلے ٹیسٹ کرو۔' },
  welcomeBack: { en: 'Welcome Back', ur: 'واپس آئیں' },
  welcomeBackRoman: { en: 'Wapis Aayein', ur: 'Wapis Aayein' },
  loginToAccount: { en: 'Log in to your account', ur: 'اپنے اکاؤنٹ میں لاگ ان کریں' },
  getStarted: { en: 'Get Started', ur: 'شروع کریں' },
  getStartedRoman: { en: 'Shuru Karein', ur: 'Shuru Karein' },
  createAccountFree: { en: 'Create a new account — it\'s free!', ur: 'نیا اکاؤنٹ بنائیں — مفت ہے!' },
  continueGoogle: { en: 'Continue with Google', ur: 'گوگل سے جاری رکھیں' },
  orEmail: { en: 'OR BY EMAIL', ur: 'یا ای میل سے' },
  fullName: { en: 'Full Name', ur: 'پورا نام' },
  email: { en: 'Email', ur: 'ای میل' },
  password: { en: 'Password', ur: 'پاس ورڈ' },
  confirmPassword: { en: 'Confirm Password', ur: 'پاس ورڈ کی تصدیق' },
  loginBtn: { en: 'Login', ur: 'لاگ ان کریں' },
  loginBtnRoman: { en: 'Login Karein', ur: 'Login Karein' },
  registerBtn: { en: 'Create Account', ur: 'اکاؤنٹ بنائیں' },
  registerBtnRoman: { en: 'Account Banayein', ur: 'Account Banayein' },
  noAccount: { en: "Don't have an account?", ur: 'اکاؤنٹ نہیں ہے؟' },
  hasAccount: { en: 'Already have an account?', ur: 'پہلے سے اکاؤنٹ ہے؟' },
  registerHere: { en: 'Register', ur: 'رجسٹر کریں' },
  loginHere: { en: 'Login', ur: 'لاگ ان کریں' },
  encrypted: { en: '256-bit encrypted • Data stored in Pakistan', ur: '256-bit encrypted • ڈیٹا پاکستان میں محفوظ' },
  madeIn: { en: 'MADE IN PAKISTAN', ur: 'پاکستان میں بنایا گیا' },

  // Features
  financialTwin: { en: 'Financial Digital Twin', ur: 'فنانشل ڈیجیٹل ٹوئن' },
  financialTwinDesc: { en: 'A virtual replica of your money — test every decision first', ur: 'آپ کے پیسوں کا ورچوئل نقل — ہر فیصلہ پہلے ٹیسٹ کریں' },
  whatIfSim: { en: 'What-If Simulator', ur: 'واٹ-ف سمیلیٹر' },
  whatIfSimDesc: { en: '"What if I buy a Rs. 2 lakh car?" — AI will tell you', ur: '"اگر میں 2 لاکھ کی گاڑی لوں تو؟" — AI بتائے گا' },
  stressTest: { en: 'Stress Test', ur: 'اسٹریس ٹیسٹ' },
  stressTestDesc: { en: 'Salary delay, job loss, emergency — plan every scenario', ur: 'تنخواہ میں تاخیر، نوکری کا نقصان، ایمرجنسی — ہر منظر نامہ پلان کریں' },
  aiCoach: { en: 'AI Coach', ur: 'AI کوچ' },
  aiCoachDesc: { en: 'Real AI that gives advice on your actual data — in English or Urdu', ur: 'حقیقی AI جو آپ کے اصل ڈیٹا پر مشورہ دیتا ہے — انگریزی یا اردو میں' },

  // Sidebar
  home: { en: 'Home', ur: 'ہوم' },
  commandCenter: { en: 'Command Center', ur: 'کمانڈ سینٹر' },
  whatIfSimNav: { en: 'What-If Simulator', ur: 'واٹ-ف سمیلیٹر' },
  digitalTwinNav: { en: 'Digital Twin', ur: 'ڈیجیٹل ٹوئن' },
  transactionsNav: { en: 'Transactions', ur: 'ٹرانزیکشنز' },
  goalPlanner: { en: 'Goal Planner', ur: 'گول پلانر' },
  riskRadar: { en: 'Risk Radar', ur: 'رسک ریڈار' },
  aiCoachNav: { en: 'AI Coach', ur: 'AI کوچ' },
  lightMode: { en: 'Light Mode', ur: 'لائٹ موڈ' },
  darkMode: { en: 'Dark Mode', ur: 'ڈارک موڈ' },
  contactUs: { en: 'Contact Us', ur: 'رابطہ کریں' },
  support: { en: 'Support', ur: 'سپورٹ' },

  // Dashboard
  greeting: { en: 'Assalam o Alaikum', ur: 'السلام علیکم' },
  dashSubtitle: { en: 'Your complete financial picture at a glance', ur: 'آپ کی مکمل مالی تصویر ایک نظر میں' },
  healthScore: { en: 'Financial Health Score', ur: 'مالی صحت کا اسکور' },
  totalBalance: { en: 'Total Balance', ur: 'کل بیلنس' },
  monthlyIncome: { en: 'Monthly Income', ur: 'ماہانہ آمدنی' },
  monthlyExpenses: { en: 'Monthly Expenses', ur: 'ماہانہ اخراجات' },
  monthlySavings: { en: 'Monthly Savings', ur: 'ماہانہ بچت' },
  emergencyFund: { en: 'Emergency Fund', ur: 'ایمرجنسی فنڈ' },
  netWorth: { en: 'Net Worth', ur: 'خالص مالیت' },
  safeToSpend: { en: 'Safe-to-Spend', ur: 'خرچ کرنے کی حد' },
  today: { en: 'Today', ur: 'آج' },
  thisWeek: { en: 'This Week', ur: 'اس ہفتے' },
  thisMonth: { en: 'This Month', ur: 'اس مہینے' },
  cashFlow6mo: { en: 'Cash Flow (6 Months)', ur: 'کیش فلو (6 ماہ)' },
  spendingBreakdown: { en: 'Spending Breakdown', ur: 'اخراجات کی تفصیل' },
  goals: { en: 'Goals', ur: 'اہداف' },
  viewAll: { en: 'View All', ur: 'سب دیکھیں' },
  dashTagline: { en: '"Har rupiya, har faisla — AI ki taqat ke saath."', ur: '"ہر روپیہ، ہر فیصلہ — AI کی طاقت کے ساتھ۔"' },

  // Simulator
  simTitle: { en: 'What-If Simulator', ur: 'واٹ-ف سمیلیٹر' },
  simSubtitle: { en: 'Test decisions before making them. Your money\'s flight simulator.', ur: 'فیصلے پہلے ٹیسٹ کرو — آپ کے پیسوں کا فلائٹ سمیلیٹر' },
  simulate: { en: 'Simulate', ur: 'سمیلیٹ کریں' },

  // Coach
  coachTitle: { en: 'AI Financial Coach', ur: 'AI مالی کوچ' },
  coachSubtitle: { en: 'Powered by Gemini AI + Your Actual Data', ur: 'Gemini AI + آپ کا اصل ڈیٹا' },
  askCoach: { en: 'Ask your AI Financial Coach...', ur: 'اپنے AI مالی کوچ سے پوچھیں...' },
  send: { en: 'Send', ur: 'بھیجیں' },
  voiceCmd: { en: 'Voice command', ur: 'آواز کا حکم' },
  listening: { en: 'Listening... Speak in Urdu/English', ur: 'سن رہا ہوں... اردو/انگریزی میں بولیں' },
  listenBtn: { en: 'Listen', ur: 'سنیں' },
  why: { en: 'Why? (Factors behind this recommendation)', ur: 'کیوں؟ (اس سفارش کے پیچھے عوامل)' },

  // Risk
  riskTitle: { en: 'Risk Radar', ur: 'رسک ریڈار' },
  stressTestTitle: { en: 'Financial Stress Tests', ur: 'مالی اسٹریس ٹیسٹ' },

  // Goals
  goalsTitle: { en: 'Goal Planner', ur: 'گول پلانر' },
  addGoal: { en: 'Add Goal', ur: 'گول شامل کریں' },

  // Common
  loading: { en: 'Loading your Financial Digital Twin...', ur: 'آپ کا فنانشل ڈیجیٹل ٹوئن لوڈ ہو رہا ہے...' },
  logout: { en: 'Logout', ur: 'لاگ آؤٹ' },
  account: { en: 'PKR Account', ur: 'PKR اکاؤنٹ' },
  provinces: { en: 'Sindh • Punjab • Balochistan • KPK • Gilgit-Baltistan • Kashmir', ur: 'سندھ • پنجاب • بلوچستان • کے پی کے • گلگت بلتستان • کشمیر' },
};

type TranslationKey = keyof typeof translations;

interface LangState {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  t: (key: TranslationKey) => string;
}

export const useLang = create<LangState>()(
  persist(
    (set, get) => ({
      lang: 'en',
      setLang: (lang: Lang) => set({ lang }),
      toggleLang: () => set((s) => ({ lang: s.lang === 'en' ? 'ur' : 'en' })),
      t: (key: TranslationKey) => {
        const entry = translations[key];
        if (!entry) return key;
        const val = entry[get().lang];
        return val || key;
      },
    }),
    { name: 'wealthwise-lang' }
  )
);
