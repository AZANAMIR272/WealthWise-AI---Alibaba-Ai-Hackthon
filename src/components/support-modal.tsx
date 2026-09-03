'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  X, Mail, LifeBuoy, ExternalLink, MessageCircleQuestion, Upload, ShieldCheck, Clock
} from 'lucide-react';
import { useLang } from '@/lib/i18n';

const TEAM = [
  { name: 'Syed Muhammad Azan', role: 'Lead Developer', photo: '/team/syed-az.jpg', linkedin: 'https://www.linkedin.com/in/syed-muhammad-azan-5703a9312/' },
  { name: 'Mariam Zuberi', role: 'Designer', photo: '/team/mariam-z.png', linkedin: 'https://www.linkedin.com/in/mariam-zuberi-24a2a7294/' },
  { name: 'Isbah Ali', role: 'Data Analyst', photo: '/team/isbah-a.png', linkedin: 'https://www.linkedin.com/in/isbah-ali-dataanalyst/' },
  { name: 'Muhammad Safwan', role: 'Developer', photo: '/team/safwan.png', linkedin: 'https://www.linkedin.com/in/safwan282/' },
];

const SUPPORT_EMAIL = 'support@wealthwise.ai';

interface SupportModalProps {
  open: boolean;
  onClose: () => void;
  initialTab?: 'contact' | 'support';
}

export function SupportModal({ open, onClose, initialTab = 'contact' }: SupportModalProps) {
  const { lang } = useLang();
  const [tab, setTab] = useState<'contact' | 'support'>(initialTab);

  useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab]);

  if (!open) return null;

  const helpTopics = [
    {
      icon: MessageCircleQuestion,
      title: lang === 'en' ? 'Account & Login' : 'اکاؤنٹ اور لاگ ان',
      desc: lang === 'en'
        ? 'OTP verification, password reset, blocked accounts'
        : 'OTP تصدیق، پاس ورڈ ری سیٹ، بلاک اکاؤنٹس',
    },
    {
      icon: Upload,
      title: lang === 'en' ? 'Bank Statement Upload' : 'بینک اسٹیٹمنٹ اپلوڈ',
      desc: lang === 'en'
        ? 'Upload PDF, CSV or photo — AI reads it for you'
        : 'PDF، CSV یا تصویر اپلوڈ کریں — AI خود پڑھ لے گا',
    },
    {
      icon: ShieldCheck,
      title: lang === 'en' ? 'Data & Privacy' : 'ڈیٹا اور پرائیویسی',
      desc: lang === 'en'
        ? 'Your data is encrypted and securely stored'
        : 'آپ کا ڈیٹا انکرپٹڈ اور محفوظ طریقے سے رکھا جاتا ہے',
    },
  ];

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface-secondary border border-border-secondary rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-surface-secondary border-b border-border-secondary px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <LifeBuoy className="w-5 h-5 text-primary-500" />
            {lang === 'en' ? 'Help Center' : 'ہیلپ سینٹر'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-tertiary text-text-muted hover:text-text-primary transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4">
          <div className="grid grid-cols-2 gap-1 bg-surface-primary rounded-xl p-1">
            <button
              onClick={() => setTab('contact')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                tab === 'contact' ? 'bg-primary-500 text-white shadow' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              {lang === 'en' ? 'Contact Us' : 'رابطہ کریں'}
            </button>
            <button
              onClick={() => setTab('support')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                tab === 'support' ? 'bg-primary-500 text-white shadow' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <LifeBuoy className="w-3.5 h-3.5" />
              {lang === 'en' ? 'Support' : 'سپورٹ'}
            </button>
          </div>
        </div>

        <div className="p-6">
          {tab === 'contact' ? (
            <div className="space-y-4">
              {/* Team */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TEAM.map((m) => (
                  <a
                    key={m.name}
                    href={m.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 p-3 rounded-xl bg-surface-primary border border-border-secondary hover:border-primary-500/40 transition-all"
                  >
                    <div className="relative w-10 h-10 rounded-full overflow-hidden border border-border-secondary flex-shrink-0">
                      <Image src={m.photo} alt={m.name} fill className="object-cover" sizes="40px" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-text-primary truncate">{m.name}</p>
                      <p className="text-[10px] text-text-muted truncate flex items-center gap-1">
                        {m.role}
                        <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </p>
                    </div>
                  </a>
                ))}
              </div>

              {/* Email CTA */}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold text-sm shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-all"
              >
                <Mail className="w-4 h-4" />
                {SUPPORT_EMAIL}
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Help topics */}
              <div className="space-y-3">
                {helpTopics.map((topic, i) => {
                  const Icon = topic.icon;
                  return (
                    <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl bg-surface-primary border border-border-secondary">
                      <div className="w-9 h-9 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-primary-500" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-text-primary">{topic.title}</p>
                        <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">{topic.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Email CTA */}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold text-sm shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-all"
              >
                <Mail className="w-4 h-4" />
                {lang === 'en' ? 'Email Support' : 'سپورٹ کو ای میل کریں'}
              </a>
              <p className="flex items-center justify-center gap-1.5 text-[11px] text-text-muted">
                <Clock className="w-3 h-3" />
                {lang === 'en' ? 'We usually reply within 24 hours' : 'ہم عام طور پر 24 گھنٹوں میں جواب دیتے ہیں'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
