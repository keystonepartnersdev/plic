'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ChevronRight, User, RefreshCw } from 'lucide-react';
import { adminAPI } from '@/lib/api';
import { UserHelper } from '@/classes';
import { IUser } from '@/types';
import { cn } from '@/lib/utils';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGrade, setFilterGrade] = useState<string>('all');

  const grades = Object.entries(UserHelper.GRADE_CONFIG).map(([key, config]) => ({
    value: key,
    label: config.name,
  }));

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminAPI.getUsers();
      setUsers(response.users || []);
    } catch (err: any) {
      console.error('회원 목록 로드 실패:', err);
      setError(err.message || '회원 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    const matchesSearch = (user.name && user.name.includes(searchQuery)) ||
      (user.phone && user.phone.includes(searchQuery)) ||
      (user.email && user.email.includes(searchQuery)) ||
      (user.uid && user.uid.includes(searchQuery));
    const matchesGrade = filterGrade === 'all' || user.grade === filterGrade;
    return matchesSearch && matchesGrade;
  });

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    suspended: 'bg-red-100 text-red-700',
    pending: 'bg-yellow-100 text-yellow-700',
    withdrawn: 'bg-gray-100 text-gray-700',
  };

  const statusLabels: Record<string, string> = {
    active: '활성',
    suspended: '정지',
    pending: '대기',
    withdrawn: '탈퇴',
  };

  return (
    <div>
      {/* 페이지 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">회원정보</h1>
          <p className="text-gray-500 mt-1">전체 회원 목록을 관리합니다.</p>
        </div>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 disabled:opacity-50"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          새로고침
        </button>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* 필터 및 검색 */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* 검색 */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="이름, 휴대폰번호, 회원번호 검색"
              className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400"
            />
          </div>

          {/* 등급 필터 */}
          <select
            value={filterGrade}
            onChange={(e) => setFilterGrade(e.target.value)}
            className="h-10 px-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400 bg-white"
          >
            <option value="all">전체 등급</option>
            {grades.map((grade) => (
              <option key={grade.value} value={grade.value}>{grade.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 회원 목록 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">회원정보</th>
                  <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">등급</th>
                  <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">상태</th>
                  <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">거래</th>
                  <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">가입일</th>
                  <th className="text-left text-sm font-medium text-gray-500 px-6 py-4"></th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => {
                    const gradeConfig = UserHelper.getGradeConfig(user.grade);
                    return (
                      <tr key={user.uid} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                              <User className="w-5 h-5 text-gray-400" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{user.name || '-'}</p>
                              <p className="text-sm text-gray-500">
                                {user.phone ? user.phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3') : '-'}
                              </p>
                              <p className="text-xs text-gray-400 font-mono">{user.uid}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-primary-100 text-primary-700">
                            {gradeConfig.name}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            'inline-flex px-2 py-1 text-xs font-medium rounded',
                            statusColors[user.status] || 'bg-gray-100 text-gray-700'
                          )}>
                            {statusLabels[user.status] || user.status || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900">{user.totalDealCount || 0}건</p>
                          <p className="text-xs text-gray-500">{(user.totalPaymentAmount || 0).toLocaleString()}원</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/admin/users/${user.uid}`}
                            className="text-primary-400 hover:text-primary-500"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      {searchQuery || filterGrade !== 'all'
                        ? '검색 결과가 없습니다.'
                        : '등록된 회원이 없습니다.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
