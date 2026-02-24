'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, X, ArrowRight, Sparkles, CreditCard,
  Clock, BadgeCheck, Zap, Building2, Gift, BarChart3,
  UserCheck, Send, CheckCircle, Shield, Lock, AlertTriangle,
  Star, Quote, TrendingUp, Users, ShoppingBag,
  Plus, Minus, MessageCircle
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

// ==================== Hero ====================
function Hero() {
  return (
    <section className="relative flex flex-col bg-gradient-to-br from-[#F8F9FA] via-white to-[#F3F4F6] pt-20 overflow-hidden">
      {/* 텍스트 + 버튼 영역 */}
      <div className="max-w-4xl mx-auto px-6 w-full text-center pt-24 pb-4 lg:pt-32 lg:pb-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-gray-900 leading-tight">
            카드로 송금하다
          </h1>
          <div className="flex items-center justify-center gap-3 mb-6 lg:mb-8">
            <p className="text-4xl md:text-5xl lg:text-7xl font-black text-[#2563EB] tracking-tight">
              PLIC
            </p>
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-[#2563EB] rounded-full text-sm font-bold">
              <Sparkles size={14} />
              Beta
            </span>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-base md:text-lg lg:text-xl text-gray-600 mb-8 lg:mb-12 max-w-2xl mx-auto leading-relaxed"
        >
          현금이나 계좌이체로 지불해야 하는 금액.<br />
          카드로 편하게 결제하세요.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <Link href="/auth/signup" className="inline-flex items-center gap-2 px-8 py-4 bg-[#2563EB] text-white rounded-full font-semibold text-lg hover:bg-[#1d4ed8] transition-all duration-300 shadow-lg shadow-blue-500/25">
            무료로 시작하기
            <ArrowRight size={20} />
          </Link>
        </motion.div>
      </div>

      {/* 폰 목업 - 모바일: 세로 폰 1개 중앙 */}
      <div className="md:hidden flex justify-center px-6 pb-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <img
            src="/landing/test2.png"
            alt="PLIC 거래 유형 선택"
            className="w-[220px] drop-shadow-2xl mx-auto"
          />
        </motion.div>
      </div>

      {/* 폰 목업 - 데스크톱: 2개 나란히 */}
      <div className="hidden md:flex justify-center px-6 pb-2 lg:pb-4">
        <div className="relative flex items-center justify-center" style={{ maxWidth: '1000px', width: '100%' }}>
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="relative z-10 flex-shrink-0"
          >
            <img
              src="/landing/test2.png"
              alt="PLIC 거래 유형 선택"
              className="w-[286px] lg:w-[338px] drop-shadow-2xl"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="relative z-0 ml-4 lg:ml-6 flex-shrink-0"
          >
            <img
              src="/landing/test.png"
              alt="PLIC 메인 화면"
              className="w-[700px] lg:w-[832px] drop-shadow-2xl"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ==================== CardBanner ====================
function CardBanner() {
  const cardCompanies = [
    'Samsung Card',
    'Shinhan Card',
    'KB Card',
    'Hyundai Card',
    'Lotte Card',
    'Woori Card',
    'Hana Card',
    'NH Card',
    'BC Card',
    'Citi Card',
  ];

  return (
    <section
      className="w-full flex flex-col justify-center"
      style={{ height: '110px', backgroundColor: '#f1f2f5' }}
    >
      <style jsx>{`
        @keyframes cardScroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
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
    <section id="service-intro" className="py-24 px-6 bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
            왜 PLIC인가요?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            PLIC은 카드 결제의 편리함과<br className="md:hidden" />
            계좌 송금의 범용성을 결합한<br className="md:hidden" />
            새로운 금융 서비스입니다.<br />
            급한 송금도 부담 없이 가능합니다.
          </p>
        </motion.div>

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
    <section id="how-it-works" className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
            간단하게 송금하세요
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            복잡한 절차 없이, 카드 하나로<br className="md:hidden" />
            누구에게나 송금할 수 있습니다.
          </p>
        </motion.div>

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
    <section id="security" className="py-32 px-6 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-[#2563EB] rounded-full text-sm font-bold mb-6">
            <Shield size={16} />
            <span>Security First</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            표준 보안 체계로<br />
            <span className="text-[#2563EB]">안전하게</span> 지켜드립니다
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            PLIC은 보안 표준을 준수하며,<br />
            고객님의 소중한 정보를 철저하게 보호합니다.
          </p>
        </motion.div>

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

// ==================== Reviews ====================
function Reviews() {
  const reviews = [
    {
      name: "김ㅇㅇ 대표",
      role: "프랜차이즈 카페 운영",
      category: "물품대금",
      icon: ShoppingBag,
      content: "매달 나가는 원두값과 부자재 비용이 만만치 않았는데, 카드로 결제하고 현금 유동성을 확보할 수 있어서 매장 운영에 큰 도움이 됩니다.",
      amount: "월 평균 1,500만원 이용",
    },
    {
      name: "이ㅇㅇ 실장",
      role: "인테리어 디자인",
      category: "인건비/자재비",
      icon: Users,
      content: "현장 일용직 인건비는 당일 지급이 원칙이라 현금이 항상 부족했는데, PLIC 덕분에 카드 결제로 여유 있게 지급하고 있습니다.",
      amount: "건당 500만원 이용",
    },
    {
      name: "박ㅇㅇ 대표",
      role: "온라인 쇼핑몰",
      category: "재고 매입",
      icon: TrendingUp,
      content: "시즌 상품 사입할 때 목돈이 필요한데, 카드 한도를 이용해서 물건을 먼저 받고 결제는 나중에 하니 매출 회전이 훨씬 빨라졌어요.",
      amount: "월 평균 3,000만원 이용",
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
      amount: "건당 2,000만원 이용",
    },
  ];

  return (
    <section id="reviews" className="py-24 overflow-hidden" style={{ backgroundColor: '#f8fafc' }}>
      <style jsx>{`
        @keyframes reviewScroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .reviews-scroll-container {
          display: flex;
          animation: reviewScroll 10s linear infinite;
        }
        .reviews-scroll-container:hover {
          animation-play-state: paused;
        }
      `}</style>

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
            사업에 필요한 모든 자금,<br />
            PLIC으로 해결하세요.
          </p>
        </motion.div>
      </div>

      <div className="overflow-hidden">
        <div className="reviews-scroll-container">
          {[...reviews, ...reviews].map((review, index) => {
            const Icon = review.icon;
            return (
              <div key={index} className="flex-shrink-0 w-[400px] px-3">
                <div className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 h-full flex flex-col justify-between" style={{ minHeight: '340px' }}>
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
    <section id="faq" className="py-24 px-6 bg-white">
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
    <section className="relative py-32 px-6 overflow-hidden bg-gradient-to-br from-[#2563EB] via-[#3b82f6] to-indigo-600">
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

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link href="/auth/signup" className="group w-full sm:w-auto px-10 py-5 bg-white text-[#2563EB] rounded-full font-bold text-lg hover:bg-blue-50 transition-all duration-300 flex items-center justify-center gap-3 shadow-2xl">
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
    <footer className="bg-gray-50">
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
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Navigation />
      <Hero />
      <CardBanner />
      <Features />
      <HowItWorks />
      <Security />
      <Reviews />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}
