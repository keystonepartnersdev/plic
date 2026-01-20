'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { adminAPI } from '@/lib/api';
import { useAdminStore } from '@/stores';
import { AdminHelper } from '@/classes';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAdminStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // 백엔드 API로 로그인
      const response = await adminAPI.login({ email, password });

      // 로그인 성공 - 토큰은 adminAPI.login에서 이미 저장됨
      const roleConfig = AdminHelper.getRoleConfig(response.admin.role);
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 8 * 60 * 60 * 1000); // 8시간

      login({
        adminId: response.admin.adminId,
        email: response.admin.email,
        name: response.admin.name,
        role: response.admin.role,
        permissions: roleConfig.permissions,
        loginAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      });

      router.replace('/admin');
    } catch (err: any) {
      console.error('로그인 실패:', err);
      setError(err.message || '로그인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 로고 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-400 mb-2">PLIC Admin</h1>
          <p className="text-gray-500">관리자 로그인</p>
        </div>

        {/* 로그인 폼 */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          {/* 이메일 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              아이디
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일 주소"
                className="
                  w-full h-12 pl-10 pr-4
                  border border-gray-200 rounded-xl
                  focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400
                  transition-colors
                "
              />
            </div>
          </div>

          {/* 비밀번호 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호"
                className="
                  w-full h-12 pl-10 pr-12
                  border border-gray-200 rounded-xl
                  focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400
                  transition-colors
                "
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          {/* 로그인 버튼 */}
          <button
            type="submit"
            disabled={isLoading || !email || !password}
            className="
              w-full h-12
              bg-primary-400 hover:bg-primary-500
              disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed
              text-white font-semibold
              rounded-xl
              transition-colors
            "
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  );
}
