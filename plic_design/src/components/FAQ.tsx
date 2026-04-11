import { Plus, Minus } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: '수취인도 PLIC에 가입해야 하나요?',
      answer: '아니요, 수취인은 PLIC 회원이 아니어도 됩니다. 국내 모든 은행 계좌로 송금받을 수 있습니다. 수취인은 별도의 앱 설치나 회원가입 없이 계좌로 돈을 받기만 하면 됩니다.',
    },
    {
      question: '송금 취소가 가능한가요?',
      answer: '결제 확정 전까지는 수수료 없이 취소 가능합니다. 결제 완료 후 송금 시작 전에도 취소할 수 있으며, 이 경우 결제 금액 전액이 환불됩니다. 단, 송금이 시작된 후에는 취소가 불가능합니다.',
    },
    {
      question: '어떤 카드를 사용할 수 있나요?',
      answer: '본인 명의의 국내 신용카드와 체크카드를 사용할 수 있습니다. 법인카드와 해외 발급 카드는 현재 지원하지 않습니다. 카드는 최대 5장까지 등록할 수 있습니다.',
    },
    {
      question: '송금은 얼마나 걸리나요?',
      answer: '결제가 완료되면 평균 30초 이내에 수취인 계좌로 송금됩니다. 은행 점검 시간(23:30~00:30)에는 점검 종료 후 순차적으로 처리됩니다.',
    },
    {
      question: '플래티넘 등급은 어떻게 되나요?',
      answer: '직전 1개월 동안 누적 수수료가 10만원 이상이면 다음 달 1일에 자동으로 플래티넘 등급으로 승급됩니다. 플래티넘 등급은 수수료율 3.0%, 월 한도 3,000만원의 혜택이 있습니다.',
    },
    {
      question: '환불은 얼마나 걸리나요?',
      answer: '환불 처리 시 신용카드와 체크카드 모두 3~7 영업일 내에 카드사를 통해 환불됩니다. 환불 시에는 수수료도 함께 환불됩니다.',
    },
  ];

  return (
    <section id="faq" className="py-24 px-6 bg-white">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
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

        {/* FAQ Accordion */}
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
                          <p className="text-gray-600 leading-relaxed pt-4">
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

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 text-center"
        >
          <p className="text-gray-600 mb-4">찾으시는 답변이 없나요?</p>
          <button className="px-8 py-3 bg-gradient-to-r from-[#2563EB] to-[#3b82f6] text-white rounded-full font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300">
            1:1 문의하기
          </button>
        </motion.div>
      </div>
    </section>
  );
}
