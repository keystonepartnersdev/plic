import { ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

const PhoneMockup = ({ src, className, delay = 0, style }: { src: string, className?: string, delay?: number, style?: any }) => (
  <motion.div
    initial={{ y: 100, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ duration: 1, delay, ease: [0.22, 1, 0.36, 1] }}
    className={`absolute rounded-[2.5rem] bg-white shadow-2xl overflow-hidden border-[6px] border-slate-900 ${className}`}
    style={style}
  >
    <div className="relative w-full h-full bg-white overflow-hidden rounded-[2.2rem]">
      <img src={src} alt="App Screen" className="w-full h-full object-cover" />
      {/* Glass reflection */}
      <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none z-10" />
    </div>
  </motion.div>
);

export function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-[#F9FAFB] pt-20">
      
      <div className="max-w-7xl mx-auto px-6 w-full grid lg:grid-cols-2 gap-12 items-center">
        
        {/* Left Content - Original Text, Left Aligned for Layout */}
        <div className="relative z-10 order-2 lg:order-1 text-center lg:text-left">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-full shadow-lg mb-8 border border-blue-100 mx-auto lg:mx-0"
          >
            <Sparkles size={20} className="text-[#2563EB]" />
            <span className="text-sm font-semibold text-gray-700">베타 서비스 오픈</span>
          </motion.div>

          {/* Main Headline - Preserved Original Text */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 mb-6 leading-tight tracking-tight">
              <span className="bg-gradient-to-r from-[#2563EB] to-[#3b82f6] bg-clip-text text-transparent">
                카드로
              </span>
              <br />
              송금하다
            </h1>
          </motion.div>

          {/* Sub Copy - Preserved Original Text */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed"
          >
            현금이나 계좌이체로 지불해야 하는 금액을 신용카드로 결제하고,<br className="hidden md:block" />
            수취인에게 원금 전액을 송금합니다.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center mb-16"
          >
            <button className="group px-8 py-4 bg-gradient-to-r from-[#2563EB] to-[#3b82f6] text-white rounded-full font-semibold text-lg hover:shadow-xl hover:shadow-blue-500/50 transition-all duration-300 flex items-center gap-2">
              무료로 시작하기
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-8 py-4 bg-white text-gray-700 rounded-full font-semibold text-lg hover:bg-gray-50 transition-all duration-300 shadow-md border border-gray-100">
              자세히 알아보기
            </button>
          </motion.div>

          {/* Key Metrics - Compact Layout */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl"
          >
            {[
              { value: '99.9%', label: '서비스 가용성' },
              { value: '30초', label: '평균 송금 시간' },
              { value: '100%', label: '원금 전액 송금' },
              { value: '3.0%~', label: '업계 최저 수수료' },
            ].map((metric, index) => (
              <div
                key={index}
                className="bg-white/60 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-white/50 text-center lg:text-left"
              >
                <div className="text-2xl font-black bg-gradient-to-r from-[#2563EB] to-[#3b82f6] bg-clip-text text-transparent mb-1">
                  {metric.value}
                </div>
                <div className="text-xs text-gray-600 font-medium">
                  {metric.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right Content - Phone Mockups matching Reference */}
        <div className="relative order-1 lg:order-2 h-[500px] md:h-[700px] w-full flex items-center justify-center lg:justify-end perspective-[1000px]">
          {/* Phone 1: Back/Top (Faded) */}
          <PhoneMockup 
            src="https://images.unsplash.com/photo-1663153206192-6d0e4c9570dd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaW50ZWNoJTIwbW9iaWxlJTIwYXBwJTIwc2NyZWVufGVufDF8fHx8MTc2ODk3MzEzOHww&ixlib=rb-4.1.0&q=80&w=1080"
            className="z-10 w-[200px] h-[420px] md:w-[240px] md:h-[500px] opacity-40 blur-[1px]"
            delay={0.2}
            style={{ 
              top: '5%', 
              right: '20%', 
              transform: 'rotate(-15deg) scale(0.9)',
            }}
          />
          
          {/* Phone 2: Middle */}
          <PhoneMockup 
            src="https://images.unsplash.com/photo-1533234944761-2f5337579079?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2JpbGUlMjBiYW5raW5nJTIwYXBwJTIwdWl8ZW58MXx8fHwxNzY4OTczMTM4fDA&ixlib=rb-4.1.0&q=80&w=1080"
            className="z-20 w-[220px] h-[460px] md:w-[260px] md:h-[540px] opacity-80"
            delay={0.4}
            style={{ 
              top: '15%', 
              right: '10%', 
              transform: 'rotate(-15deg) scale(0.95)',
            }}
          />
          
          {/* Phone 3: Front (Main) */}
          <PhoneMockup 
            src="https://images.unsplash.com/photo-1766503206606-27de0861e8a4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2JpbGUlMjBhcHAlMjBpbnRlcmZhY2UlMjBibHVlJTIwY2xlYW58ZW58MXx8fHwxNzY4OTczMTM4fDA&ixlib=rb-4.1.0&q=80&w=1080"
            className="z-30 w-[240px] h-[500px] md:w-[280px] md:h-[580px]"
            delay={0.6}
            style={{ 
              top: '25%', 
              right: '0%', 
              transform: 'rotate(-15deg)',
            }}
          />
        </div>

      </div>
    </section>
  );
}
