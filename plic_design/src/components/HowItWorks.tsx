import { UserCheck, CreditCard, Send, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';

export function HowItWorks() {
  const steps = [
    {
      number: 1,
      icon: UserCheck,
      title: '회원가입',
      description: 'PASS 본인인증으로 간편하게 가입하세요. 1분이면 충분합니다.',
    },
    {
      number: 2,
      icon: CreditCard,
      title: '카드 등록',
      description: '본인 명의 신용/체크카드를 최대 5장까지 등록할 수 있습니다.',
    },
    {
      number: 3,
      icon: Send,
      title: '송금 정보 입력',
      description: '송금 금액과 수취인 계좌를 입력하고 실명을 확인합니다.',
    },
    {
      number: 4,
      icon: CheckCircle,
      title: '송금 완료',
      description: '결제가 완료되면 수취인에게 즉시 원금이 송금됩니다.',
    },
  ];

  return (
    <section id="how-it-works" className="py-24 px-6 bg-white">
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
            간단한 4단계로 송금을 완료하세요
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            복잡한 절차 없이, 카드 하나로 누구에게나 송금할 수 있습니다.
          </p>
        </motion.div>

        {/* Steps - Diagonal Cards */}
        <div className="relative">
          {/* Connecting Line */}
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
                    {/* Number Badge */}
                    <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br from-[#2563EB] to-[#3b82f6] rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white font-black text-lg">{step.number}</span>
                    </div>

                    {/* Icon */}
                    <div className="w-16 h-16 bg-gradient-to-br from-[#2563EB] to-[#3b82f6] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Icon size={32} className="text-white" strokeWidth={2} />
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
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
