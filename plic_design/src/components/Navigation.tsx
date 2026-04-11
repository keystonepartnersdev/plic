import { Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export function Navigation() {
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
    { label: '서비스소개', href: '#features' },
    { label: 'PLIC 혜택', href: '#pricing' },
    { label: '서비스 이용', href: '#how-it-works' },
    { label: '공지사항', href: '#faq' },
    { label: '서비스 해지', href: '#' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/90 backdrop-blur-md border-b border-gray-100' 
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-20">
          {/* Logo - Text Only as requested */}
          <a href="#" className="text-2xl font-black text-gray-900 tracking-tight">
            PLIC
          </a>

          {/* Desktop Menu - Centered like reference */}
          <div className="hidden md:flex items-center gap-10">
            {menuItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={`text-base font-medium transition-colors ${
                  item.label === 'PLIC 혜택' ? 'text-[#2563EB] font-bold' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* CTA Button */}
          <div className="hidden md:block">
            <button className="px-6 py-2.5 border border-[#2563EB] text-[#2563EB] text-sm font-bold rounded-full hover:bg-blue-50 transition-all duration-300">
              앱 다운로드 →
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-gray-900"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
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
            <div className="pt-4 mt-2 border-t border-gray-100">
              <button className="w-full px-6 py-3 bg-[#2563EB] text-white text-sm font-bold rounded-lg">
                앱 다운로드
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
