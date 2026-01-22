'use client';

import { ReactNode } from 'react';
import { ChevronLeft, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showClose?: boolean;
  onBack?: () => void;
  onClose?: () => void;
  rightAction?: ReactNode;
  transparent?: boolean;
  className?: string;
}

export default function Header({
  title,
  showBack = false,
  showClose = false,
  onBack,
  onClose,
  rightAction,
  transparent = false,
  className = '',
}: HeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  };

  return (
    <header
      className={`
        sticky top-0 z-50
        h-16 px-4
        flex items-center justify-between
        transition-all duration-300
        ${transparent ? 'bg-transparent' : 'bg-white/90 backdrop-blur-md border-b border-gray-100'}
        ${className}
      `}
    >
      {/* 좌측 영역 */}
      <div className="w-10 flex items-center">
        {showBack && (
          <button
            onClick={handleBack}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-all duration-300"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" strokeWidth={2} />
          </button>
        )}
      </div>

      {/* 중앙 타이틀 */}
      <h1 className="flex-1 text-center font-bold text-gray-900 truncate">
        {title}
      </h1>

      {/* 우측 영역 */}
      <div className="w-10 flex items-center justify-end">
        {showClose && (
          <button
            onClick={handleClose}
            className="p-2 -mr-2 hover:bg-gray-100 rounded-full transition-all duration-300"
          >
            <X className="w-6 h-6 text-gray-700" strokeWidth={2} />
          </button>
        )}
        {rightAction}
      </div>
    </header>
  );
}
