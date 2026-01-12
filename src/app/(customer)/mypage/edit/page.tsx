'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, Shield, Check } from 'lucide-react';
import { Header } from '@/components/common';
import { useUserStore } from '@/stores';
import { cn } from '@/lib/utils';

export default function EditProfilePage() {
  const router = useRouter();
  const { currentUser, isLoggedIn, updateUser } = useUserStore();

  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    setMounted(true);
    if (currentUser) {
      setFormData({
        name: currentUser.name,
        email: currentUser.email || '',
        phone: currentUser.phone,
      });
    }
  }, [currentUser]);

  useEffect(() => {
    if (mounted && !isLoggedIn) {
      router.replace('/auth/login');
    }
  }, [mounted, isLoggedIn, router]);

  if (!mounted || !isLoggedIn || !currentUser) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400" />
      </div>
    );
  }

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    updateUser({
      name: formData.name,
      email: formData.email || undefined,
      phone: formData.phone,
    });

    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    return numbers;
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <Header title="개인정보 수정" showBack />

      {/* 스크롤 가능한 콘텐츠 영역 */}
      <div className="flex-1 overflow-y-auto px-5 py-6 pb-24">
        {/* 프로필 이미지 */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center">
              <User className="w-12 h-12 text-primary-400" />
            </div>
          </div>
        </div>

        {/* 폼 */}
        <div className="bg-white rounded-xl p-5 space-y-5">
          {/* 이름 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이름
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full h-12 pl-12 pr-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400"
                placeholder="이름을 입력하세요"
              />
            </div>
          </div>

          {/* 이메일 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이메일
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full h-12 pl-12 pr-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400"
                placeholder="이메일을 입력하세요"
              />
            </div>
          </div>

          {/* 연락처 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              연락처
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                className="w-full h-12 pl-12 pr-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400"
                placeholder="휴대폰 번호를 입력하세요"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">- 없이 숫자만 입력</p>
          </div>

          {/* 본인인증 상태 */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">본인 인증</span>
              </div>
              <span className={cn(
                'px-3 py-1 text-sm font-medium rounded-full',
                currentUser.isVerified
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700'
              )}>
                {currentUser.isVerified ? '인증완료' : '미인증'}
              </span>
            </div>
            {currentUser.verifiedAt && (
              <p className="text-xs text-gray-500 mt-2 ml-7">
                인증일: {new Date(currentUser.verifiedAt).toLocaleDateString('ko-KR')}
              </p>
            )}
          </div>
        </div>

        {/* 회원정보 */}
        <div className="bg-white rounded-xl p-5 mt-4">
          <h3 className="font-semibold text-gray-900 mb-4">회원 정보</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">회원번호</span>
              <span className="text-gray-900 font-mono">{currentUser.uid}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">가입일</span>
              <span className="text-gray-900">
                {new Date(currentUser.createdAt).toLocaleDateString('ko-KR')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">가입 방식</span>
              <span className="text-gray-900">
                {currentUser.authType === 'direct' ? '직접 가입' : '소셜 로그인'}
                {currentUser.socialProvider && ` (${currentUser.socialProvider})`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 저장 버튼 - 프레임 내부 하단 고정 */}
      <div className="flex-shrink-0 p-5 bg-white border-t border-gray-100">
        <button
          onClick={handleSave}
          disabled={isSaving || !formData.name || !formData.phone}
          className="w-full h-14 bg-primary-400 hover:bg-primary-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-xl transition-colors"
        >
          {isSaving ? '저장 중...' : '저장하기'}
        </button>
      </div>

      {/* 저장 성공 메시지 - 토스트 */}
      {saveSuccess && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg z-50">
          <Check className="w-4 h-4" />
          저장되었습니다
        </div>
      )}
    </div>
  );
}
