import { ArrowRight, MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';

export function CTA() {
  return (
    <section className="relative py-32 px-6 overflow-hidden bg-gradient-to-br from-[#2563EB] via-[#3b82f6] to-indigo-600">
      {/* Animated Background */}
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
              width: `${Math.random() * 300 + 100}px`,
              height: `${Math.random() * 300 + 100}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
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
          {/* Title */}
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-black text-white mb-8 leading-tight">
            지금 바로
            <br />
            PLIC을 시작하세요
          </h2>

          {/* Description */}
          <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-2xl mx-auto">
            1분 회원가입으로 카드 송금의 새로운 경험을 시작하세요.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <button className="group px-10 py-5 bg-white text-[#2563EB] rounded-full font-bold text-lg hover:bg-blue-50 transition-all duration-300 flex items-center gap-3 shadow-2xl">
              무료로 시작하기
              <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button className="px-10 py-5 bg-white/10 backdrop-blur-md text-white rounded-full font-bold text-lg hover:bg-white/20 transition-all duration-300 border-2 border-white/30 flex items-center gap-3">
              <MessageCircle size={24} />
              문의하기
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-8 text-white/80">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span className="text-sm">가입비 무료</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span className="text-sm">숨겨진 비용 없음</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span className="text-sm">언제든지 해지 가능</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
