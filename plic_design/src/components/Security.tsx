import { Shield, Lock, UserCheck, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

export function Security() {
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
        {/* Section Header */}
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
            금융급 보안으로<br />
            <span className="text-[#2563EB]">안전하게</span> 지켜드립니다
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            PLIC은 국제 보안 표준을 준수하며, 고객님의 소중한 금융 정보를 철저하게 보호합니다.
            안심하고 이용하세요.
          </p>
        </motion.div>

        {/* Security Features - Grid Layout (Clean Style) */}
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
                  {/* Icon */}
                  <div className="flex-shrink-0 w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm text-[#2563EB] group-hover:bg-[#2563EB] group-hover:text-white transition-all duration-300">
                    <Icon size={28} strokeWidth={2} />
                  </div>

                  {/* Content */}
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
