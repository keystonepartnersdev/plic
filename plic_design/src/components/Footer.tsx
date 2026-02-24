import { Facebook, Twitter, Instagram, Linkedin, Mail } from 'lucide-react';

export function Footer() {
  const footerSections = [
    {
      title: '서비스',
      links: ['이용방법', '특징', '수수료', '보안'],
    },
    {
      title: '고객지원',
      links: ['자주 묻는 질문', '공지사항', '1:1 문의', '이용가이드'],
    },
    {
      title: '회사',
      links: ['회사 소개', '채용', '제휴 문의', '투자자 정보'],
    },
    {
      title: '법적',
      links: ['이용약관', '개인정보처리방침', '전자금융거래약관'],
    },
  ];

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
  ];

  return (
    <footer className="bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Top Section */}
        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-12 mb-12 pb-12 border-b border-gray-200">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-[#2563EB] to-[#3b82f6] rounded-full flex items-center justify-center">
                <span className="text-white font-black text-lg">P</span>
              </div>
              <span className="text-xl font-black text-gray-900">PLIC</span>
            </div>
            <p className="text-gray-600 leading-relaxed mb-6 text-sm">
              카드로 송금하다. PLIC은 카드 결제를 통한 계좌 송금 서비스로, 편리하고 안전한 금융 경험을 제공합니다.
            </p>
            
            {/* Social Links */}
            <div className="flex gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="w-10 h-10 bg-white hover:bg-gradient-to-r hover:from-[#2563EB] hover:to-[#3b82f6] rounded-full flex items-center justify-center transition-all shadow-sm hover:shadow-md group border border-gray-200"
                  >
                    <Icon size={18} className="text-gray-600 group-hover:text-white transition-colors" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Links */}
          {footerSections.map((section, index) => (
            <div key={index}>
              <h3 className="text-gray-900 font-bold mb-4 text-sm">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href="#"
                      className="text-gray-600 hover:text-[#2563EB] transition-colors text-sm"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          <p className="text-gray-500">
            © 2025 PLIC. All rights reserved.
          </p>
          
          <div className="flex items-center gap-2 text-gray-500">
            <Mail size={16} />
            <a href="mailto:support@plic.kr" className="hover:text-[#2563EB] transition-colors">
              support@plic.kr
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
