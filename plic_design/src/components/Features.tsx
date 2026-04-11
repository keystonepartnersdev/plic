import { BadgeCheck, Clock, Zap, Building2, Gift, BarChart3 } from 'lucide-react';
import { motion } from 'motion/react';

export function Features() {
  const features = [
    {
      icon: BadgeCheck,
      title: '원금 전액 송금 보장',
      description: '수수료는 결제자가 부담합니다. 수취인은 송금 원금을 100% 그대로 받습니다. 100만원을 보내면, 100만원이 도착합니다.',
    },
    {
      icon: Clock,
      title: '결제일까지 여유',
      description: '신용카드로 결제하면 카드 결제일까지 시간 여유를 확보할 수 있습니다. 급한 송금도 부담 없이.',
    },
    {
      icon: Zap,
      title: '30초 내 송금',
      description: '결제 완료 즉시 수취인 계좌로 송금됩니다. 평균 30초 이내에 송금이 완료됩니다.',
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
      description: '모든 거래 상태를 실시간으로 확인할 수 있습니다. 투명한 거래 이력 관리.',
    },
  ];

  return (
    <section id="features" className="py-24 px-6 bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
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
            PLIC은 카드 결제의 편리함과 계좌 송금의 범용성을 결합한 새로운 금융 서비스입니다.
          </p>
        </motion.div>

        {/* Features - Masonry Style */}
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
                  {/* Background Decoration */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  {/* Icon */}
                  <div className="relative w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-6">
                    <Icon size={28} className="text-[#2563EB]" strokeWidth={2} />
                  </div>

                  {/* Content */}
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
