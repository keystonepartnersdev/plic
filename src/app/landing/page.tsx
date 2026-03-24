'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import tracking from '@/lib/tracking';
import { TrackingProvider } from '@/components/common';
import {
  Menu, X, ArrowRight, CreditCard,
  Clock, BadgeCheck, Zap, Building2, Gift, BarChart3,
  UserCheck, Send, CheckCircle, Shield, Lock, AlertTriangle,
  Star, Quote, TrendingUp, Users, ShoppingBag,
  Plus, Minus, MessageCircle, Briefcase, FileCheck, Scale
} from 'lucide-react';
import Link from 'next/link';

// ==================== Navigation ====================
function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const menuItems = [
    { label: '서비스소개', href: '#service-intro' },
    { label: '이용방법', href: '#how-it-works' },
    { label: '보안', href: '#security' },
    { label: '고객 후기', href: '#reviews' },
    { label: '자주 묻는 질문', href: '#faq' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 transition-all duration-300 ${
        isScrolled
          ? 'bg-white border-b border-gray-100 shadow-sm'
          : 'bg-white/80 backdrop-blur-sm'
      }`}
      style={{ zIndex: 99999 }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-20">
          <a href="#" className="text-2xl font-black text-gray-900 tracking-tight">
            PLIC
          </a>

          <div className="hidden md:flex items-center gap-10">
            {menuItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-base font-medium transition-colors text-gray-500 hover:text-gray-900"
              >
                {item.label}
              </a>
            ))}
          </div>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-gray-900"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 bg-white border-t border-gray-100 absolute left-0 right-0 px-6 shadow-xl">
            {menuItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="block py-3 text-gray-600 hover:text-[#2563EB] font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}

// ==================== 2.5D SVG Graphics ====================
function CardFlowGraphic({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="card1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
        <linearGradient id="card2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>
        <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="4" dy="6" stdDeviation="8" floodColor="#2563EB" floodOpacity="0.15" />
        </filter>
      </defs>
      {/* Back card */}
      <rect x="50" y="20" width="130" height="82" rx="12" fill="url(#card2)" opacity="0.5" transform="rotate(5 115 61)" filter="url(#cardShadow)" />
      {/* Front card */}
      <rect x="20" y="40" width="130" height="82" rx="12" fill="url(#card1)" filter="url(#cardShadow)" />
      <rect x="32" y="58" width="40" height="28" rx="4" fill="white" opacity="0.25" />
      <rect x="32" y="100" width="80" height="8" rx="4" fill="white" opacity="0.3" />
      {/* Arrow */}
      <circle cx="165" cy="110" r="20" fill="#10B981" opacity="0.9" />
      <path d="M158 110 L170 110 M166 105 L172 110 L166 115" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShieldGraphic({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <filter id="shieldShadow" x="-20%" y="-10%" width="140%" height="140%">
          <feDropShadow dx="3" dy="6" stdDeviation="10" floodColor="#2563EB" floodOpacity="0.2" />
        </filter>
      </defs>
      {/* Shield body */}
      <path d="M100 20 L160 50 C160 50 165 130 100 180 C35 130 40 50 40 50 Z" fill="url(#shieldGrad)" filter="url(#shieldShadow)" />
      {/* Inner highlight */}
      <path d="M100 35 L148 58 C148 58 152 120 100 163 C48 120 52 58 52 58 Z" fill="white" opacity="0.1" />
      {/* Check mark */}
      <circle cx="100" cy="95" r="28" fill="white" opacity="0.2" />
      <path d="M82 95 L95 108 L120 82" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Sparkles */}
      <circle cx="170" cy="40" r="4" fill="#FBBF24" opacity="0.8" />
      <circle cx="30" cy="70" r="3" fill="#34D399" opacity="0.8" />
      <circle cx="160" cy="140" r="3" fill="#818CF8" opacity="0.6" />
    </svg>
  );
}

function MoneyFlowGraphic({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="phoneGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F1F5F9" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>
        <filter id="phoneShadow" x="-15%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="3" dy="5" stdDeviation="8" floodColor="#0F172A" floodOpacity="0.12" />
        </filter>
      </defs>
      {/* Phone */}
      <rect x="30" y="10" width="80" height="150" rx="14" fill="url(#phoneGrad)" stroke="#CBD5E1" strokeWidth="1.5" filter="url(#phoneShadow)" />
      <rect x="38" y="28" width="64" height="110" rx="4" fill="white" />
      <rect x="60" y="14" width="20" height="6" rx="3" fill="#CBD5E1" />
      {/* Screen content */}
      <rect x="44" y="36" width="52" height="6" rx="3" fill="#2563EB" opacity="0.7" />
      <rect x="44" y="48" width="36" height="4" rx="2" fill="#94A3B8" />
      <rect x="44" y="58" width="52" height="20" rx="6" fill="#EFF6FF" />
      <text x="55" y="72" fontSize="9" fill="#2563EB" fontWeight="bold">₩1,000,000</text>
      {/* Flow arrows */}
      <path d="M120 85 C150 85 150 65 180 65" stroke="#2563EB" strokeWidth="2.5" strokeDasharray="4 3" fill="none" />
      <path d="M120 85 C150 85 150 105 180 105" stroke="#2563EB" strokeWidth="2.5" strokeDasharray="4 3" fill="none" />
      {/* Bank icons */}
      <rect x="180" y="50" width="40" height="30" rx="8" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1" />
      <text x="191" y="69" fontSize="7" fill="#2563EB" fontWeight="bold">은행</text>
      <rect x="180" y="90" width="40" height="30" rx="8" fill="#F0FDF4" stroke="#BBF7D0" strokeWidth="1" />
      <text x="191" y="109" fontSize="7" fill="#16A34A" fontWeight="bold">수취</text>
      {/* Coins */}
      <circle cx="145" cy="40" r="10" fill="#FBBF24" opacity="0.8" />
      <text x="141" y="44" fontSize="9" fill="white" fontWeight="bold">₩</text>
      <circle cx="155" cy="135" r="8" fill="#FBBF24" opacity="0.6" />
      <text x="152" y="138" fontSize="7" fill="white" fontWeight="bold">₩</text>
    </svg>
  );
}

function LegalDocGraphic({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="docGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F8FAFC" />
        </linearGradient>
        <filter id="docShadow" x="-15%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="2" dy="4" stdDeviation="8" floodColor="#0F172A" floodOpacity="0.1" />
        </filter>
      </defs>
      {/* Document */}
      <rect x="45" y="20" width="110" height="145" rx="10" fill="url(#docGrad)" stroke="#E2E8F0" strokeWidth="1.5" filter="url(#docShadow)" />
      {/* Document lines */}
      <rect x="60" y="45" width="80" height="5" rx="2.5" fill="#E2E8F0" />
      <rect x="60" y="58" width="60" height="5" rx="2.5" fill="#E2E8F0" />
      <rect x="60" y="71" width="72" height="5" rx="2.5" fill="#E2E8F0" />
      <rect x="60" y="84" width="55" height="5" rx="2.5" fill="#E2E8F0" />
      {/* Stamp / Seal */}
      <circle cx="120" cy="125" r="22" fill="none" stroke="#2563EB" strokeWidth="2.5" opacity="0.7" />
      <circle cx="120" cy="125" r="17" fill="none" stroke="#2563EB" strokeWidth="1" opacity="0.5" />
      <text x="108" y="129" fontSize="10" fill="#2563EB" fontWeight="bold" opacity="0.8">인가</text>
      {/* Check badge */}
      <circle cx="155" cy="35" r="16" fill="#10B981" />
      <path d="M147 35 L153 41 L163 30" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Scale icon (justice) */}
      <g transform="translate(30, 130)" opacity="0.6">
        <line x1="15" y1="5" x2="15" y2="25" stroke="#6366F1" strokeWidth="2" />
        <line x1="5" y1="5" x2="25" y2="5" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" />
        <path d="M3 5 L8 18 Q5.5 22 3 18 Z" fill="#6366F1" opacity="0.4" />
        <path d="M22 5 L27 18 Q24.5 22 22 18 Z" fill="#6366F1" opacity="0.4" />
      </g>
    </svg>
  );
}

// ==================== Hero ====================
function Hero() {
  return (
    <section data-section="hero" className="relative bg-gradient-to-br from-[#F8F9FA] via-white to-[#F3F4F6] pt-20 overflow-hidden">
      {/* Desktop: 좌측 텍스트 + 우측 영상 */}
      <div className="hidden md:flex max-w-7xl mx-auto px-6 pt-28 pb-20 items-center gap-12 lg:gap-20">
        {/* 좌측: 텍스트 영역 (좌측 정렬) */}
        <div className="flex-1 text-left">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-[#2563EB] rounded-full text-sm font-bold mb-6">
              <Briefcase size={14} />
              <span>사업자 전용 서비스</span>
            </div>

            <h1 className="text-4xl lg:text-6xl xl:text-7xl font-bold text-gray-900 leading-tight mb-2">
              카드로 송금하다
            </h1>
            <p className="text-4xl lg:text-6xl xl:text-7xl font-black text-[#2563EB] tracking-tight mb-6">
              PLIC
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <p className="text-lg lg:text-xl text-gray-600 mb-4 leading-relaxed">
              거래대금, 사업장 월세, 인건비, 자재비 등<br />
              현금 지출이 필요한 모든 사업 비용을 카드로.
            </p>
            <div className="flex flex-wrap gap-2 mb-10">
              {['거래대금', '사업장 월세', '인건비', '자재비', '장비 대여료'].map((tag) => (
                <span key={tag} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Link href="https://www.plic.kr/" data-track="landing_cta_hero" className="inline-flex items-center gap-2 px-8 py-4 bg-[#2563EB] text-white rounded-full font-semibold text-lg hover:bg-[#1d4ed8] transition-all duration-300 shadow-lg shadow-blue-500/25">
              무료로 시작하기
              <ArrowRight size={20} />
            </Link>
          </motion.div>
        </div>

        {/* 우측: 영상 */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="flex-shrink-0"
        >
          <div className="relative">
            {/* 우측하단 드롭쉐도우 */}
            <div className="absolute -bottom-6 -right-6 w-full h-full bg-gradient-to-br from-blue-200/40 to-indigo-300/30 rounded-[2.5rem] blur-2xl" />
            <div className="relative bg-gray-900 rounded-[2.5rem] overflow-hidden border-[6px] border-gray-800" style={{ width: '300px', boxShadow: '12px 16px 40px rgba(37, 99, 235, 0.18), 6px 8px 20px rgba(0, 0, 0, 0.08)' }}>
              {/* 상단 노치 */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-gray-900 rounded-b-2xl z-10" />
              <video
                autoPlay
                muted
                loop
                playsInline
                className="w-full"
              >
                <source src="/images/landing/plic-demo.mp4" type="video/mp4" />
              </video>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Mobile: 중앙 정렬 */}
      <div className="md:hidden px-6 pt-24 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-[#2563EB] rounded-full text-sm font-bold mb-6">
            <Briefcase size={14} />
            <span>사업자 전용 서비스</span>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 leading-tight mb-2">
            카드로 송금하다
          </h1>
          <p className="text-4xl font-black text-[#2563EB] tracking-tight mb-4">
            PLIC
          </p>
          <p className="text-base text-gray-600 mb-3 leading-relaxed">
            거래대금, 월세, 인건비 등<br />
            사업 비용을 카드로 결제하세요.
          </p>
          <div className="flex flex-wrap justify-center gap-1.5 mb-8">
            {['거래대금', '월세', '인건비', '자재비'].map((tag) => (
              <span key={tag} className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                {tag}
              </span>
            ))}
          </div>
        </motion.div>

        {/* 모바일 영상 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex justify-center"
        >
          <div className="relative">
            <div className="absolute -bottom-4 -right-4 w-full h-full bg-gradient-to-br from-blue-200/30 to-indigo-300/20 rounded-[2rem] blur-xl" />
            <div className="relative bg-gray-900 rounded-[2rem] overflow-hidden border-[5px] border-gray-800" style={{ width: '220px', boxShadow: '8px 12px 30px rgba(37, 99, 235, 0.15)' }}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-gray-900 rounded-b-xl z-10" />
              <video
                autoPlay
                muted
                loop
                playsInline
                className="w-full"
              >
                <source src="/images/landing/plic-demo.mp4" type="video/mp4" />
              </video>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ==================== CardBanner ====================
function CardBanner() {
  const cardCompanies = [
    'Samsung Card', 'Shinhan Card', 'KB Card', 'Hyundai Card', 'Lotte Card',
    'Woori Card', 'Hana Card', 'NH Card', 'BC Card', 'Citi Card',
  ];

  return (
    <section
      className="w-full flex flex-col justify-center"
      style={{ height: '110px', backgroundColor: '#f1f2f5' }}
    >
      <style jsx>{`
        @keyframes cardScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        .card-scroll-container {
          display: inline-flex;
          animation: cardScroll 30s linear infinite;
          white-space: nowrap;
        }
      `}</style>

      <p className="text-center text-sm mb-4" style={{ color: '#9AA8B8' }}>
        PLIC은 모든 카드 결제를 지원합니다.
      </p>

      <div className="overflow-hidden">
        <div className="card-scroll-container">
          {[...cardCompanies, ...cardCompanies, ...cardCompanies].map((card, index) => (
            <span key={index} className="inline-flex items-center gap-2 px-10">
              <CreditCard size={20} style={{ color: '#C5CED9' }} className="flex-shrink-0" />
              <span className="font-bold whitespace-nowrap" style={{ color: '#C5CED9', fontSize: '20px' }}>{card}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ==================== iMessage Q&A ====================
function MessageQA() {
  const conversations = [
    {
      q: '이거 돈 세탁 아닌가요!?',
      a: '아닙니다! 플릭은 정식 PG사와 연계하는 합법적인 결제 대행 서비스입니다!',
    },
    {
      q: '수취인의 동의가 필요한가요?',
      a: "아닙니다. 수취인의 동의 없이 지정된 '송금자'명으로 수취인에게 이체됩니다!",
    },
    {
      q: '카드 할부도 되나요?',
      a: '네! 카드사에서 지원하는 무이자 기간 그대로 적용 가능합니다!',
    },
    {
      q: '카드 혜택도 적용되나요!?',
      a: '네! 포인트/항공마일리지 적립, 결제 할인 등 그대로 적용됩니다!',
    },
    {
      q: '단기 대출을 받는게 낫지 않나요?',
      a: '대출은 신용도 하락의 문제가 있고, 대출 이자보다 수수료도 저렴합니다!',
    },
  ];

  return (
    <section data-section="message-qa" className="py-20 md:py-28 px-6 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-bold mb-6">
            <MessageCircle size={16} />
            <span>자주 하시는 질문</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4">
            이런 점이 궁금하셨죠?
          </h2>
          <p className="text-base md:text-lg text-gray-500">
            PLIC 서비스에 대해 가장 많이 물어보시는 질문들
          </p>
        </motion.div>

        {/* iMessage 스타일 대화 */}
        <div className="max-w-lg mx-auto space-y-6">
          {conversations.map((conv, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.12 }}
            >
              {/* Question (left - gray bubble) */}
              <div className="flex justify-start mb-2">
                <div className="relative max-w-[80%]">
                  <div className="bg-[#E9E9EB] text-gray-900 px-4 py-2.5 rounded-2xl rounded-bl-md text-[15px] leading-relaxed font-medium">
                    {conv.q}
                  </div>
                </div>
              </div>

              {/* Answer (right - blue bubble) */}
              <div className="flex justify-end">
                <div className="relative max-w-[80%]">
                  <div className="bg-[#007AFF] text-white px-4 py-2.5 rounded-2xl rounded-br-md text-[15px] leading-relaxed">
                    {conv.a}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ==================== Trust / Legal PG Section ====================
function TrustSection() {
  const trustPoints = [
    {
      icon: FileCheck,
      title: '정식 허가 PG사 연계',
      description: 'PLIC은 금융위원회에 등록된 정식 PG사를 통해 결제를 처리합니다. 모든 거래는 합법적인 절차를 따릅니다.',
    },
    {
      icon: Scale,
      title: '합법적인 결제 대행',
      description: '카드 결제 대행은 여신전문금융업법에 따른 합법적 서비스입니다. 불법 현금융통(카드깡)과는 전혀 다릅니다.',
    },
    {
      icon: Shield,
      title: '철저한 거래 검수',
      description: '모든 거래는 운영팀의 검수를 거칩니다. 불법 거래가 의심되는 건은 즉시 차단하여 서비스 건전성을 유지합니다.',
    },
    {
      icon: Lock,
      title: '개인정보 보호',
      description: '카드 정보는 PG사 보안 시스템에서만 처리되며, PLIC 서버에 저장되지 않습니다. AWS KMS로 민감 정보를 암호화합니다.',
    },
  ];

  return (
    <section data-section="trust" className="py-20 md:py-28 px-6 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          {/* 좌측: 2.5D 그래픽 */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex-shrink-0"
          >
            <LegalDocGraphic className="w-48 h-48 md:w-64 md:h-64" />
          </motion.div>

          {/* 우측: 콘텐츠 */}
          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-10"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-bold mb-6">
                <BadgeCheck size={16} />
                <span>합법 · 안전 · 투명</span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 mb-4">
                정식 허가 PG사와 함께하는<br />
                <span className="text-[#2563EB]">합법적인</span> 서비스
              </h2>
              <p className="text-base md:text-lg text-gray-500 leading-relaxed">
                PLIC은 법적 테두리 안에서 안전하게 운영됩니다.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 gap-5">
              {trustPoints.map((point, index) => {
                const Icon = point.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="p-5 rounded-2xl bg-gray-50 hover:bg-blue-50/50 transition-colors"
                  >
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm mb-3 text-[#2563EB]">
                      <Icon size={20} />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1.5 text-sm">{point.title}</h3>
                    <p className="text-gray-500 text-xs leading-relaxed">{point.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ==================== Features ====================
function Features() {
  const features = [
    {
      icon: Clock,
      title: '결제일까지 여유',
      description: '현금 여유가 없을 때, 신용카드로 결제가 가능하기에 여유로운 자금흐름을 만들 수 있습니다.',
    },
    {
      icon: BadgeCheck,
      title: '원금 전액 송금 보장',
      description: '수취인은 송금 원금을 100% 그대로 받습니다. 100만원을 보내면, 100만원이 도착합니다.',
    },
    {
      icon: Zap,
      title: 'D+3일 이내 송금',
      description: '결제 완료 즉시 운영팀 검토 후 D+3(영업일 기준)일 이내에 송금됩니다.',
    },
    {
      icon: Building2,
      title: '어떤 계좌든 OK',
      description: '국내 모든 은행 계좌로 송금할 수 있습니다. 수취인이 PLIC 회원이 아니어도 괜찮습니다.',
    },
    {
      icon: Gift,
      title: '카드 혜택 그대로',
      description: '카드 포인트, 할인, 할부 등 기존 카드 혜택을 그대로 누릴 수 있습니다.',
    },
    {
      icon: BarChart3,
      title: '실시간 거래 내역',
      description: '모든 거래 상태를 실시간으로 확인할 수 있습니다. 투명한 거래 이력 관리가 가능합니다.',
    },
  ];

  return (
    <section id="service-intro" data-section="features" className="py-24 px-6 bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left flex-1"
          >
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              왜 PLIC인가요?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl leading-relaxed">
              PLIC은 카드 결제의 편리함과 계좌 송금의 범용성을 결합한 새로운 금융 서비스입니다.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex-shrink-0"
          >
            <CardFlowGraphic className="w-40 h-32 md:w-52 md:h-40" />
          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group"
              >
                <div className="bg-white rounded-3xl p-8 shadow-md hover:shadow-2xl transition-all duration-300 h-full border border-gray-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>

                  <div className="relative w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-6">
                    <Icon size={28} className="text-[#2563EB]" strokeWidth={2} />
                  </div>

                  <h3 className="relative text-xl font-bold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="relative text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ==================== HowItWorks ====================
function HowItWorks() {
  const steps = [
    {
      number: 1,
      icon: UserCheck,
      title: '회원가입',
      description: '간편하게 사업자 정보로 가입하세요.\n1분이면 충분합니다.',
    },
    {
      number: 2,
      icon: CreditCard,
      title: '거래 등록',
      description: '거래 유형, 금액, 수취인 정보, 증빙을\n등록합니다.',
    },
    {
      number: 3,
      icon: Send,
      title: '카드결제',
      description: '본인 명의의 카드로 결제해주세요.',
    },
    {
      number: 4,
      icon: CheckCircle,
      title: '송금완료',
      description: '결제가 완료되면 운영팀 검수 후\n수취인에게 원금이 즉시 송금됩니다.',
    },
  ];

  return (
    <section id="how-it-works" data-section="how-it-works" className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16 mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex-shrink-0 order-2 lg:order-1"
          >
            <MoneyFlowGraphic className="w-48 h-36 md:w-60 md:h-44" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left flex-1 order-1 lg:order-2"
          >
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              간단하게 송금하세요
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl leading-relaxed">
              복잡한 절차 없이, 카드 하나로 누구에게나 송금할 수 있습니다.
            </p>
          </motion.div>
        </div>

        <div className="relative">
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-200 to-transparent -translate-y-1/2"></div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 50, rotate: -5 }}
                  whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="relative group"
                >
                  <div className="bg-gradient-to-br from-white to-blue-50 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-blue-100 h-full">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#2563EB] to-[#3b82f6] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Icon size={32} className="text-white" strokeWidth={2} />
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      <span className="text-[#2563EB]">{step.number}</span> {step.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// ==================== Security ====================
function Security() {
  const securityFeatures = [
    {
      icon: Shield,
      title: '카드 정보 비접촉',
      description: '카드 번호는 PLIC 서버를 거치지 않습니다. PG사 SDK를 통해 토큰화되어 처리됩니다.',
    },
    {
      icon: Lock,
      title: 'KMS 암호화',
      description: '민감 정보는 AWS KMS AES-256으로 암호화하여 저장합니다.',
    },
    {
      icon: UserCheck,
      title: '본인인증 필수',
      description: 'PASS 본인인증과 3D Secure로 부정 사용을 방지합니다.',
    },
    {
      icon: AlertTriangle,
      title: '이상거래 탐지 (FDS)',
      description: '실시간 이상거래 탐지 시스템으로 의심 거래를 사전에 차단합니다.',
    },
  ];

  return (
    <section id="security" data-section="security" className="py-32 px-6 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left flex-1"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-[#2563EB] rounded-full text-sm font-bold mb-6">
              <Shield size={16} />
              <span>Security First</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              표준 보안 체계로<br />
              <span className="text-[#2563EB]">안전하게</span> 지켜드립니다
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl leading-relaxed">
              PLIC은 보안 표준을 준수하며, 고객님의 소중한 정보를 철저하게 보호합니다.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex-shrink-0"
          >
            <ShieldGraphic className="w-40 h-40 md:w-52 md:h-52" />
          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {securityFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group p-8 rounded-3xl bg-gray-50 border border-transparent hover:border-blue-100 hover:bg-blue-50/30 transition-all duration-300"
              >
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm text-[#2563EB] group-hover:bg-[#2563EB] group-hover:text-white transition-all duration-300">
                    <Icon size={28} strokeWidth={2} />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-[#2563EB] transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ==================== Reviews (슬라이드-정지 모션) ====================
function Reviews() {
  const reviews = [
    {
      name: "김ㅇㅇ 대표",
      role: "프랜차이즈 카페 운영",
      category: "물품대금",
      icon: ShoppingBag,
      content: "매달 나가는 원두값과 부자재 비용이 만만치 않았는데, 카드로 결제하고 현금 유동성을 확보할 수 있어서 매장 운영에 큰 도움이 됩니다.",
      amount: "월 평균 700만원 이용",
    },
    {
      name: "이ㅇㅇ 실장",
      role: "인테리어 디자인",
      category: "인건비/자재비",
      icon: Users,
      content: "현장 일용직 인건비는 당일 지급이 원칙이라 현금이 항상 부족했는데, PLIC 덕분에 카드 결제로 여유 있게 지급하고 있습니다.",
      amount: "건당 150만원 이용",
    },
    {
      name: "박ㅇㅇ 대표",
      role: "온라인 쇼핑몰",
      category: "재고 매입",
      icon: TrendingUp,
      content: "시즌 상품 사입할 때 목돈이 필요한데, 카드 한도를 이용해서 물건을 먼저 받고 결제는 나중에 하니 매출 회전이 훨씬 빨라졌어요.",
      amount: "월 평균 950만원 이용",
    },
    {
      name: "최ㅇㅇ 원장",
      role: "입시 학원",
      category: "강사료",
      icon: Users,
      content: "프리랜서 선생님들 강사료 지급일에 맞춰 현금을 준비하는 게 스트레스였는데, 이제 카드로 간편하게 송금합니다.",
      amount: "월 평균 800만원 이용",
    },
    {
      name: "정ㅇㅇ 대표",
      role: "스타트업",
      category: "사무실 월세",
      icon: Building2,
      content: "공유오피스 보증금과 월세를 법인카드로 결제할 수 있어서 비용 처리가 간편하고 현금 흐름 관리가 수월해졌습니다.",
      amount: "월 250만원 이용",
    },
    {
      name: "한ㅇㅇ 대표",
      role: "건설/시공",
      category: "장비 대여료",
      icon: Building2,
      content: "고가의 장비 대여료를 현금으로만 달라는 곳이 많은데, PLIC으로 카드 결제하고 송금해주니 거래처도 좋아하고 저도 편합니다.",
      amount: "건당 180만원 이용",
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const totalCards = reviews.length;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalCards);
    }, 3000); // 3초 정지 후 다음 카드

    return () => clearInterval(interval);
  }, [totalCards]);

  return (
    <section id="reviews" data-section="reviews" className="py-24 overflow-hidden" style={{ backgroundColor: '#f8fafc' }}>
      <div className="max-w-7xl mx-auto px-6 mb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-[#2563EB] rounded-full text-sm font-bold mb-6">
            <Quote size={16} className="fill-current" />
            <span>생생한 이용 후기</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            많은 사업자분들이<br />
            <span className="text-[#2563EB]">자금 고민을 해결</span>했어요!
          </h2>
          <p className="text-lg text-gray-500">
            인건비, 계약금, 월세까지.<br />
            사업에 필요한 모든 자금, PLIC으로 해결하세요.
          </p>
        </motion.div>
      </div>

      {/* 슬라이드-정지 캐러셀 */}
      <div className="overflow-hidden" ref={containerRef}>
        <div
          className="flex transition-transform duration-700 ease-in-out"
          style={{
            transform: `translateX(calc(-${currentIndex * 406}px + max(0px, (100vw - 406px) / 2)))`,
          }}
        >
          {reviews.map((review, index) => {
            const Icon = review.icon;
            const isActive = index === currentIndex;
            return (
              <div
                key={index}
                className={`flex-shrink-0 w-[400px] px-3 transition-all duration-700 ${
                  isActive ? 'opacity-100 scale-100' : 'opacity-60 scale-[0.96]'
                }`}
              >
                <div className={`bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border h-full flex flex-col justify-between ${
                  isActive ? 'border-blue-200 shadow-lg' : 'border-gray-100'
                }`} style={{ minHeight: '340px' }}>
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-[#2563EB]">
                          <Icon size={18} />
                        </div>
                        <div>
                          <div className="text-xs text-[#2563EB] font-bold mb-0.5">{review.category}</div>
                          <div className="font-bold text-gray-900">{review.name}</div>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} fill="#FBBF24" color="#FBBF24" />
                        ))}
                      </div>
                    </div>

                    <p className="text-gray-600 leading-relaxed mb-6 text-[15px]">
                      &quot;{review.content}&quot;
                    </p>
                  </div>

                  <div className="mt-auto border-t border-gray-100 flex items-center justify-between pt-4">
                    <span className="text-sm text-gray-500">{review.role}</span>
                    <span className="text-sm font-bold text-[#2563EB] bg-blue-50 px-3 py-1 rounded-full">
                      {review.amount}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 인디케이터 */}
        <div className="flex justify-center gap-2 mt-8">
          {reviews.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'w-8 h-2.5 bg-[#2563EB]'
                  : 'w-2.5 h-2.5 bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ==================== FAQ ====================
function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: '수취인도 PLIC에 가입해야 하나요?',
      answer: '아니요, 수취인은 PLIC 회원이 아니어도 됩니다. 국내 모든 은행 계좌로 송금받을 수 있습니다. 수취인은 별도의 앱 설치나 회원가입 없이 계좌로 돈을 받기만 하면 됩니다.',
    },
    {
      question: '송금 취소가 가능한가요?',
      answer: '결제 이후, 송금 이전까지는 수수료 없이 취소가 가능합니다. 이 경우 결제 금액 전액이 결제 취소됩니다. 단, 송금이 이루어진 후에는 취소가 불가하며, 결제 취소를 원하시는 경우에는 고객센터로 문의 부탁드립니다.',
    },
    {
      question: '어떤 카드를 사용할 수 있나요?',
      answer: '본인 명의의 국내 신용카드와 체크카드, 법인 명의의 카드를 사용할 수 있습니다. 해외 발급 카드는 현재 지원하지 않습니다.',
    },
    {
      question: '송금은 얼마나 걸리나요?',
      answer: '결제가 완료되면 운영팀 검수 후 D+3일(영업일 기준) 이내에 송금됩니다. 은행 점검 시간(23:30~00:30)에는 점검 종료 후 순차적으로 처리됩니다.',
    },
    {
      question: '환불은 얼마나 걸리나요?',
      answer: '환불 처리 시 신용카드와 체크카드 모두 3~7 영업일 내에 카드사를 통해 환불됩니다. 환불 시에는 수수료도 함께 환불됩니다.',
    },
    {
      question: '제 명의의 통장으로 송금받고 싶어요.',
      answer: '카드 결제자와 수취인이 동일한 경우는 불법 현금융통(카드깡)인 범죄 행위로 분류됩니다. PLIC은 불법 거래를 근절하기 위하여, 철저한 거래 검수를 진행하고 있습니다.',
    },
  ];

  return (
    <section id="faq" data-section="faq" className="py-24 px-6 bg-white">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
            자주 묻는 질문
          </h2>
          <p className="text-lg text-gray-600">
            궁금한 점이 있으신가요? 여기에서 답을 찾아보세요.
          </p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <div className={`bg-white rounded-2xl overflow-hidden transition-all duration-300 border-2 ${
                openIndex === index
                  ? 'border-[#2563EB] shadow-lg'
                  : 'border-gray-200 shadow-sm hover:border-gray-300'
              }`}>
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-6 py-6 flex justify-between items-center text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="text-lg font-bold text-gray-900 pr-4">
                    {faq.question}
                  </span>
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    openIndex === index
                      ? 'bg-gradient-to-r from-[#2563EB] to-[#3b82f6] text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {openIndex === index ? (
                      <Minus size={20} strokeWidth={3} />
                    ) : (
                      <Plus size={20} strokeWidth={3} />
                    )}
                  </div>
                </button>

                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6">
                        <div className="pt-2 border-t border-gray-200">
                          <p className="text-gray-600 leading-relaxed pt-4 whitespace-pre-line">
                            {faq.answer}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 text-center"
        >
          <p className="text-gray-600 mb-4">찾으시는 답변이 없나요?</p>
          <a href="mailto:support@plic.kr" className="inline-block px-8 py-3 bg-gradient-to-r from-[#2563EB] to-[#3b82f6] text-white rounded-full font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300">
            1:1 문의하기
          </a>
        </motion.div>
      </div>
    </section>
  );
}

// ==================== CTA ====================
function CTA() {
  return (
    <section data-section="cta" className="relative py-32 px-6 overflow-hidden bg-gradient-to-br from-[#2563EB] via-[#3b82f6] to-indigo-600">
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [0, 1.5, 0],
              opacity: [0, 0.2, 0]
            }}
            transition={{
              duration: 4 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.8,
              ease: "easeInOut"
            }}
            className="absolute bg-white rounded-full"
            style={{
              width: `${100 + i * 30}px`,
              height: `${100 + i * 30}px`,
              left: `${(i * 10) % 100}%`,
              top: `${(i * 15) % 100}%`,
            }}
          />
        ))}
      </div>

      <div className="max-w-5xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-black text-white mb-8 leading-tight">
            지금 바로
            <br />
            PLIC하세요
          </h2>

          <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-2xl mx-auto">
            카드로 송금하는 새로운 경험을 시작해보세요!
          </p>

          <div className="hidden md:flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link href="https://www.plic.kr/" data-track="landing_cta_bottom" className="group w-full sm:w-auto px-10 py-5 bg-white text-[#2563EB] rounded-full font-bold text-lg hover:bg-blue-50 transition-all duration-300 flex items-center justify-center gap-3 shadow-2xl">
              무료로 시작하기
              <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
            </Link>

            <a href="http://pf.kakao.com/_xnQKhX" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto px-10 py-5 bg-white/10 backdrop-blur-md text-white rounded-full font-bold text-lg hover:bg-white/20 transition-all duration-300 border-2 border-white/30 flex items-center justify-center gap-3">
              <MessageCircle size={24} />
              문의하기
            </a>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-8 text-white/80">
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span className="text-sm">가입비 무료</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span className="text-sm">숨겨진 비용 없음</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span className="text-sm">언제든지 회원가입 해지 가능</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ==================== Footer ====================
function Footer() {
  const footerSections = [
    {
      title: '서비스',
      links: [
        { label: '서비스소개', href: '#service-intro' },
        { label: '이용방법', href: '#how-it-works' },
        { label: '보안', href: '#security' },
        { label: '고객 후기', href: '#reviews' },
        { label: '자주 묻는 질문', href: '#faq' },
      ],
    },
    {
      title: '고객지원',
      links: [
        { label: '1:1 문의', href: 'mailto:support@plic.kr' },
      ],
    },
    {
      title: '법적',
      links: [
        { label: '서비스 이용약관', href: '/terms/service' },
        { label: '개인정보 처리방침', href: '/terms/privacy' },
      ],
    },
  ];

  return (
    <footer className="bg-gray-50 pb-20 md:pb-0">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12 pb-12 border-b border-gray-200">
          <div>
            <div className="mb-6">
              <span className="text-xl font-black text-gray-900">PLIC</span>
            </div>
            <p className="text-gray-600 leading-relaxed text-sm max-w-sm mb-6">
              카드로 송금하다.<br />
              PLIC은 카드 결제를 통한 계좌 송금 서비스로, 사업자에게 유연한 자금흐름을 만들어 드립니다.<br />
              편리하고 안전한 금융 경험, 지금 바로 시작해보세요.
            </p>
            <div className="text-gray-500 text-xs leading-relaxed">
              <p>주식회사 키스톤파트너스 | 대표자: 방성민</p>
              <p>사업자등록번호: 583-88-01313</p>
              <p>경기도 안양시 동안구 흥안대로 457-27, 1동 지하 1층 비 117호(관양동)</p>
            </div>
          </div>

          <div className="flex flex-wrap justify-start lg:justify-end gap-12 lg:gap-16">
            {footerSections.map((section, index) => (
              <div key={index}>
                <h3 className="text-gray-900 font-bold mb-4 text-sm">{section.title}</h3>
                <ul className="space-y-3">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      {link.href.startsWith('/') ? (
                        <Link
                          href={link.href}
                          className="text-gray-600 hover:text-[#2563EB] transition-colors text-sm"
                        >
                          {link.label}
                        </Link>
                      ) : (
                        <a
                          href={link.href}
                          className="text-gray-600 hover:text-[#2563EB] transition-colors text-sm"
                        >
                          {link.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          <p className="text-gray-500">
            © 2025 PLIC. All rights reserved.
          </p>

          <div className="text-gray-500">
            <a href="mailto:support@plic.kr" className="hover:text-[#2563EB] transition-colors">
              support@plic.kr
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ==================== Main Page ====================
export default function LandingPage() {
  return (
    <TrackingProvider>
      <div className="min-h-screen bg-white overflow-x-hidden">
        <Navigation />
        <Hero />
        <CardBanner />
        <MessageQA />
        <TrustSection />
        <Features />
        <HowItWorks />
        <Security />
        <Reviews />
        <FAQ />
        <CTA />
        <Footer />

        {/* 모바일 하단 고정 플로팅 CTA 버튼 */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-[99998] bg-white/95 backdrop-blur-md border-t border-gray-100 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <Link
            href="https://www.plic.kr/"
            data-track="landing_cta_mobile_fixed"
            className="flex items-center justify-center gap-2 w-full h-14 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white rounded-full font-bold text-lg shadow-lg shadow-blue-500/30 hover:shadow-xl transition-all duration-300"
          >
            무료로 시작하기
            <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    </TrackingProvider>
  );
}
