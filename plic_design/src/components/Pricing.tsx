import { Check, Star } from 'lucide-react';
import { motion } from 'motion/react';

export function Pricing() {
  const plans = [
    {
      name: '베이직',
      nameEn: 'BASIC',
      rate: '3.5',
      monthlyLimit: '1,000만원',
      singleMax: '500만원',
      dailyMax: '1,000만원',
      features: [
        '본인 명의 카드 5장 등록',
        '실시간 송금',
        '거래 내역 조회',
      ],
      recommended: false,
    },
    {
      name: '플래티넘',
      nameEn: 'PLATINUM',
      rate: '3.0',
      monthlyLimit: '3,000만원',
      singleMax: '1,000만원',
      dailyMax: '3,000만원',
      features: [
        '본인 명의 카드 5장 등록',
        '실시간 송금',
        '거래 내역 조회',
        '우선 고객 지원',
      ],
      recommended: true,
      note: '월 수수료 10만원 이상 시 자동 승급',
    },
  ];

  return (
    <section id="pricing" className="py-24 px-6 bg-white">
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
            투명한 수수료
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            숨겨진 비용 없이, 수수료율만 확인하세요. 많이 이용할수록 더 저렴해집니다.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.nameEn}
              initial={{ opacity: 0, y: 50, rotate: index === 0 ? -2 : 2 }}
              whileInView={{ opacity: 1, y: 0, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className={`relative ${plan.recommended ? 'md:-mt-8' : ''}`}
            >
              {/* Recommended Badge */}
              {plan.recommended && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <div className="bg-gradient-to-r from-[#2563EB] to-[#3b82f6] text-white px-6 py-2 rounded-full shadow-lg flex items-center gap-2">
                    <Star size={16} fill="currentColor" />
                    <span className="text-sm font-bold">추천</span>
                  </div>
                </div>
              )}

              <div className={`bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border-2 ${
                plan.recommended ? 'border-[#2563EB]' : 'border-gray-200'
              } relative overflow-hidden`}>
                {/* Background Decoration */}
                {plan.recommended && (
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100 to-transparent rounded-full blur-3xl opacity-50"></div>
                )}

                {/* Plan Name */}
                <div className="relative mb-6">
                  <div className="text-sm font-semibold text-gray-500 mb-1">
                    {plan.nameEn}
                  </div>
                  <h3 className="text-3xl font-black text-gray-900">
                    {plan.name}
                  </h3>
                </div>

                {/* Rate */}
                <div className="relative mb-8">
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-6xl font-black bg-gradient-to-r from-[#2563EB] to-[#3b82f6] bg-clip-text text-transparent">
                      {plan.rate}
                    </span>
                    <span className="text-3xl font-bold bg-gradient-to-r from-[#2563EB] to-[#3b82f6] bg-clip-text text-transparent">
                      %
                    </span>
                  </div>
                  <p className="text-gray-600">수수료율</p>
                </div>

                {/* Limits */}
                <div className="relative space-y-3 mb-8 pb-8 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">월 한도</span>
                    <span className="font-bold text-gray-900">{plan.monthlyLimit}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">1회 최대</span>
                    <span className="font-bold text-gray-900">{plan.singleMax}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">1일 최대</span>
                    <span className="font-bold text-gray-900">{plan.dailyMax}</span>
                  </div>
                </div>

                {/* Features */}
                <div className="relative space-y-4 mb-8">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="mt-0.5 w-5 h-5 bg-gradient-to-br from-[#2563EB] to-[#3b82f6] rounded-full flex items-center justify-center flex-shrink-0">
                        <Check size={12} className="text-white" strokeWidth={3} />
                      </div>
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Note */}
                {plan.note && (
                  <div className="relative bg-blue-50 rounded-2xl p-4 mb-6 border border-blue-100">
                    <p className="text-sm text-[#2563EB]">
                      <span className="font-bold">참고:</span> {plan.note}
                    </p>
                  </div>
                )}

                {/* CTA Button */}
                <button
                  className={`relative w-full py-4 rounded-full font-bold text-lg transition-all duration-300 ${
                    plan.recommended
                      ? 'bg-gradient-to-r from-[#2563EB] to-[#3b82f6] text-white shadow-lg hover:shadow-xl hover:shadow-blue-500/50'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  시작하기
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
