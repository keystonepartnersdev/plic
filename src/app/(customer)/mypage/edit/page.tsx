'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, Shield, Check } from 'lucide-react';
import { Header } from '@/components/common';
import { useUserStore } from '@/stores';
import { usersAPI } from '@/lib/api';
import { cn, getErrorMessage } from '@/lib/utils';

export default function EditProfilePage() {
  const router = useRouter();
  const { currentUser, isLoggedIn, updateUser, _hasHydrated } = useUserStore();

  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const [originalData, setOriginalData] = useState({
    name: '',
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
      setOriginalData({
        name: currentUser.name,
        phone: currentUser.phone,
      });
    }
  }, [currentUser]);

  // 변경사항 있는지 확인
  const hasChanges = formData.name !== originalData.name || formData.phone !== originalData.phone;

  useEffect(() => {
    if (mounted && _hasHydrated && !isLoggedIn) {
      router.replace('/auth/login');
    }
  }, [mounted, _hasHydrated, isLoggedIn, router]);

  if (!mounted || !_hasHydrated || !isLoggedIn || !currentUser) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400" />
      </div>
    );
  }

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await usersAPI.updateMe({
        name: formData.name,
        phone: formData.phone,
      });

      updateUser({
        name: formData.name,
        phone: formData.phone,
      });

      // 저장 후 원본 데이터 업데이트
      setOriginalData({
        name: formData.name,
        phone: formData.phone,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err: unknown) {
      setError(getErrorMessage(err) || '저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="개인정보 수정" showBack />

      <div className="p-5 space-y-4">
        <div className="bg-white rounded-xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">이름</p>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="font-medium text-gray-900 bg-transparent border-none outline-none w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4 pt-4 border-t border-gray-100">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">이메일</p>
              <p className="font-medium text-gray-900">{formData.email}</p>
              <p className="text-xs text-gray-400">이메일은 변경할 수 없습니다</p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Phone className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">전화번호</p>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="font-medium text-gray-900 bg-transparent border-none outline-none w-full"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">인증 상태</p>
              <p className="font-medium text-gray-900">
                {currentUser.isVerified ? '인증완료' : '미인증'}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {saveSuccess && (
          <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm flex items-center gap-2">
            <Check className="w-4 h-4" />
            저장되었습니다.
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          className={cn(
            'w-full py-4 rounded-xl font-semibold transition-colors',
            isSaving || !hasChanges
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-primary-400 text-white hover:bg-primary-500'
          )}
        >
          {isSaving ? '저장 중...' : '저장하기'}
        </button>
      </div>
    </div>
  );
}
