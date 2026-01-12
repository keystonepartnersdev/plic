'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Mail, MessageSquare, Smartphone, Moon, Volume2, Check } from 'lucide-react';
import { Header } from '@/components/common';
import { useUserStore } from '@/stores';
import { cn } from '@/lib/utils';

interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  dealUpdates: boolean;
  marketingEnabled: boolean;
  nightModeEnabled: boolean;
  soundEnabled: boolean;
}

export default function NotificationSettingsPage() {
  const router = useRouter();
  const { currentUser, isLoggedIn } = useUserStore();

  const [mounted, setMounted] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    pushEnabled: true,
    emailEnabled: true,
    smsEnabled: false,
    dealUpdates: true,
    marketingEnabled: false,
    nightModeEnabled: false,
    soundEnabled: true,
  });

  useEffect(() => {
    setMounted(true);
    // Load saved settings from localStorage
    const savedSettings = localStorage.getItem('notificationSettings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Failed to parse notification settings');
      }
    }
  }, []);

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

  const handleToggle = (key: keyof NotificationSettings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    // Save to localStorage
    localStorage.setItem('notificationSettings', JSON.stringify(newSettings));
    // Show save success
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 1500);
  };

  const ToggleSwitch = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={cn(
        'relative w-12 h-7 rounded-full transition-colors',
        enabled ? 'bg-primary-400' : 'bg-gray-200'
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform',
          enabled && 'translate-x-5'
        )}
      />
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <Header title="알림 설정" showBack />

      {/* 스크롤 가능한 콘텐츠 영역 */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4">
        {/* 알림 수신 방법 */}
        <div className="bg-white rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">알림 수신 방법</h3>
          </div>
          <div className="divide-y divide-gray-100">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">푸시 알림</p>
                  <p className="text-sm text-gray-500">앱 푸시 알림을 받습니다</p>
                </div>
              </div>
              <ToggleSwitch enabled={settings.pushEnabled} onChange={() => handleToggle('pushEnabled')} />
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">이메일 알림</p>
                  <p className="text-sm text-gray-500">이메일로 알림을 받습니다</p>
                </div>
              </div>
              <ToggleSwitch enabled={settings.emailEnabled} onChange={() => handleToggle('emailEnabled')} />
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">SMS 알림</p>
                  <p className="text-sm text-gray-500">문자 메시지로 알림을 받습니다</p>
                </div>
              </div>
              <ToggleSwitch enabled={settings.smsEnabled} onChange={() => handleToggle('smsEnabled')} />
            </div>
          </div>
        </div>

        {/* 알림 종류 */}
        <div className="bg-white rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">알림 종류</h3>
          </div>
          <div className="divide-y divide-gray-100">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">거래 알림</p>
                  <p className="text-sm text-gray-500">거래 상태 변경 시 알림</p>
                </div>
              </div>
              <ToggleSwitch enabled={settings.dealUpdates} onChange={() => handleToggle('dealUpdates')} />
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">마케팅 알림</p>
                  <p className="text-sm text-gray-500">이벤트, 프로모션 정보 수신</p>
                </div>
              </div>
              <ToggleSwitch enabled={settings.marketingEnabled} onChange={() => handleToggle('marketingEnabled')} />
            </div>
          </div>
        </div>

        {/* 기타 설정 */}
        <div className="bg-white rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">기타 설정</h3>
          </div>
          <div className="divide-y divide-gray-100">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <Moon className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">야간 알림 차단</p>
                  <p className="text-sm text-gray-500">21시 ~ 08시 알림 차단</p>
                </div>
              </div>
              <ToggleSwitch enabled={settings.nightModeEnabled} onChange={() => handleToggle('nightModeEnabled')} />
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Volume2 className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">알림 소리</p>
                  <p className="text-sm text-gray-500">알림 수신 시 소리 재생</p>
                </div>
              </div>
              <ToggleSwitch enabled={settings.soundEnabled} onChange={() => handleToggle('soundEnabled')} />
            </div>
          </div>
        </div>

        {/* 안내 */}
        <p className="text-center text-sm text-gray-500 px-4">
          알림 설정은 즉시 저장됩니다.
          <br />
          기기의 알림 권한이 필요할 수 있습니다.
        </p>
      </div>

      {/* 저장 성공 토스트 */}
      {saveSuccess && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg z-50 animate-fade-in">
          <Check className="w-4 h-4" />
          설정이 저장되었습니다
        </div>
      )}
    </div>
  );
}
