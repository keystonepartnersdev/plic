'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  UserCog,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react';
import { adminAPI } from '@/lib/api';
import { useAdminStore } from '@/stores';
import { IAdmin, TAdminRole, TAdminStatus } from '@/types';
import { AdminHelper } from '@/classes';
import { cn, getErrorMessage } from '@/lib/utils';

const ROLE_LABELS: Record<TAdminRole, string> = {
  super: '슈퍼관리자',
  operator: '운영팀',
  cs: 'CS팀',
};

const ROLE_ICONS: Record<TAdminRole, typeof Shield> = {
  super: ShieldCheck,
  operator: Shield,
  cs: ShieldAlert,
};

const STATUS_LABELS: Record<TAdminStatus, string> = {
  active: '활성',
  inactive: '비활성',
  suspended: '정지',
};

const STATUS_COLORS: Record<TAdminStatus, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-700',
  suspended: 'bg-red-100 text-red-700',
};

export default function AdminsManagePage() {
  const { currentAdmin } = useAdminStore();

  // API 데이터 상태
  const [adminList, setAdminList] = useState<IAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<IAdmin | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IAdmin | null>(null);

  // API에서 관리자 목록 로드
  const fetchAdmins = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminAPI.getAdmins();
      setAdminList(response.admins || []);
    } catch (err: unknown) {
      console.error('관리자 목록 로드 실패:', err);
      setError(getErrorMessage(err) || '관리자 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  // 필터링된 관리자 목록
  const filteredAdmins = adminList.filter((admin) => {
    const matchesSearch =
      admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.adminId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || admin.role === filterRole;
    const matchesStatus = filterStatus === 'all' || admin.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // 통계
  const stats = {
    total: adminList.length,
    super: adminList.filter((a) => a.role === 'super').length,
    operator: adminList.filter((a) => a.role === 'operator').length,
    cs: adminList.filter((a) => a.role === 'cs').length,
    active: adminList.filter((a) => a.status === 'active').length,
  };

  const handleDelete = async (admin: IAdmin) => {
    if (admin.isMaster) {
      alert('마스터 계정은 삭제할 수 없습니다.');
      return;
    }

    setIsSaving(true);
    try {
      await adminAPI.deleteAdmin(admin.adminId);
      await fetchAdmins();
      setDeleteTarget(null);
    } catch (err: unknown) {
      console.error('관리자 삭제 실패:', err);
      alert(getErrorMessage(err) || '관리자 삭제에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (admin: IAdmin) => {
    if (admin.isMaster) {
      alert('마스터 계정의 상태는 변경할 수 없습니다.');
      return;
    }

    setIsSaving(true);
    try {
      const newStatus = admin.status === 'active' ? 'inactive' : 'active';
      await adminAPI.updateAdmin(admin.adminId, { status: newStatus });
      await fetchAdmins();
    } catch (err: unknown) {
      console.error('관리자 상태 변경 실패:', err);
      alert(getErrorMessage(err) || '관리자 상태 변경에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async (data: Partial<IAdmin> & { password?: string }) => {
    setIsSaving(true);
    try {
      if (editingAdmin) {
        await adminAPI.updateAdmin(editingAdmin.adminId, data);
      } else {
        await adminAPI.createAdmin({
          email: data.email || '',
          name: data.name || '',
          phone: data.phone,
          role: data.role as TAdminRole,
          password: data.password || 'temp1234!',
        });
      }
      await fetchAdmins();
      setShowCreateModal(false);
      setEditingAdmin(null);
    } catch (err: unknown) {
      console.error('관리자 저장 실패:', err);
      alert(getErrorMessage(err) || '관리자 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 로딩 상태
  if (loading && adminList.length === 0) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400" />
      </div>
    );
  }

  return (
    <div>
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">어드민관리</h1>
          <p className="text-gray-500 mt-1">관리자 계정을 관리합니다.</p>
        </div>
        <button
          onClick={fetchAdmins}
          disabled={loading || isSaving}
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

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <UserCog className="w-4 h-4" />
            <span>전체 관리자</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total}명</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>슈퍼관리자</span>
          </div>
          <p className="text-2xl font-bold text-primary-600">{stats.super}명</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Shield className="w-4 h-4" />
            <span>운영팀</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{stats.operator}명</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span>CS팀</span>
          </div>
          <p className="text-2xl font-bold text-orange-600">{stats.cs}명</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500 mb-1">활성 계정</p>
          <p className="text-2xl font-bold text-green-600">{stats.active}명</p>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="이름, 이메일, 관리자 ID 검색"
              className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400"
            />
          </div>

          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="h-10 px-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400 bg-white"
          >
            <option value="all">전체 역할</option>
            <option value="super">슈퍼관리자</option>
            <option value="operator">운영팀</option>
            <option value="cs">CS팀</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-10 px-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400 bg-white"
          >
            <option value="all">전체 상태</option>
            <option value="active">활성</option>
            <option value="inactive">비활성</option>
            <option value="suspended">정지</option>
          </select>

          <button
            onClick={() => setShowCreateModal(true)}
            disabled={isSaving}
            className="flex items-center justify-center gap-2 h-10 px-4 bg-primary-400 hover:bg-primary-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
            관리자 추가
          </button>
        </div>
      </div>

      {/* 관리자 목록 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">관리자정보</th>
                <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">역할</th>
                <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">상태</th>
                <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">최근 로그인</th>
                <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">생성일</th>
                <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredAdmins.length > 0 ? (
                filteredAdmins.map((admin) => {
                  const RoleIcon = ROLE_ICONS[admin.role];
                  return (
                    <tr key={admin.adminId} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-600 font-medium">
                              {admin.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900">{admin.name}</p>
                              {admin.isMaster && (
                                <span className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded">
                                  마스터
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">{admin.email}</p>
                            <p className="text-xs text-gray-400 font-mono">{admin.adminId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <RoleIcon className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-700">{ROLE_LABELS[admin.role]}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleStatus(admin)}
                          disabled={admin.isMaster || isSaving}
                          className={cn(
                            'inline-flex px-2 py-1 text-xs font-medium rounded transition-opacity',
                            STATUS_COLORS[admin.status],
                            (admin.isMaster || isSaving) && 'opacity-50 cursor-not-allowed'
                          )}
                        >
                          {STATUS_LABELS[admin.status]}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {admin.lastLoginAt
                          ? new Date(admin.lastLoginAt).toLocaleString('ko-KR')
                          : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(admin.createdAt).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingAdmin(admin)}
                            disabled={isSaving}
                            className="p-2 text-gray-400 hover:text-primary-400 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {!admin.isMaster && (
                            <button
                              onClick={() => setDeleteTarget(admin)}
                              disabled={isSaving}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    {searchQuery || filterRole !== 'all' || filterStatus !== 'all'
                      ? '검색 결과가 없습니다.'
                      : '등록된 관리자가 없습니다.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 생성/수정 모달 */}
      {(showCreateModal || editingAdmin) && (
        <AdminModal
          admin={editingAdmin}
          currentAdminId={currentAdmin?.adminId || ''}
          isSaving={isSaving}
          onClose={() => {
            setShowCreateModal(false);
            setEditingAdmin(null);
          }}
          onSave={handleSave}
        />
      )}

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <DeleteConfirmModal
          admin={deleteTarget}
          isSaving={isSaving}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => handleDelete(deleteTarget)}
        />
      )}
    </div>
  );
}

// 생성/수정 모달
function AdminModal({
  admin,
  currentAdminId,
  isSaving,
  onClose,
  onSave,
}: {
  admin: IAdmin | null;
  currentAdminId: string;
  isSaving: boolean;
  onClose: () => void;
  onSave: (data: Partial<IAdmin> & { password?: string }) => void;
}) {
  const [formData, setFormData] = useState({
    email: admin?.email || '',
    name: admin?.name || '',
    phone: admin?.phone || '',
    role: admin?.role || 'operator' as TAdminRole,
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && formData.email !== 'admin') {
      newErrors.email = '올바른 이메일 형식이 아닙니다.';
    }

    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요.';
    }

    // 새 관리자 생성 시 비밀번호는 필수
    if (!admin && !formData.password.trim()) {
      newErrors.password = '비밀번호를 입력해주세요.';
    } else if (formData.password) {
      // 기존 관리자 수정 시 비밀번호를 입력한 경우만 검증
      const passwordValidation = AdminHelper.validatePassword(formData.password);
      if (!passwordValidation.valid) {
        newErrors.password = passwordValidation.errors[0];
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSave(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {admin ? '관리자 수정' : '관리자 추가'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* 이메일 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이메일 <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={admin?.isMaster}
              placeholder="admin@example.com"
              className={cn(
                'w-full h-10 px-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400',
                errors.email ? 'border-red-300' : 'border-gray-200',
                admin?.isMaster && 'bg-gray-100 cursor-not-allowed'
              )}
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          {/* 이름 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="홍길동"
              className={cn(
                'w-full h-10 px-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400',
                errors.name ? 'border-red-300' : 'border-gray-200'
              )}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* 연락처 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="010-0000-0000"
              className="w-full h-10 px-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400"
            />
          </div>

          {/* 역할 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              역할 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as TAdminRole })}
              disabled={admin?.isMaster}
              className={cn(
                'w-full h-10 px-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400 bg-white',
                admin?.isMaster && 'bg-gray-100 cursor-not-allowed'
              )}
            >
              <option value="super">슈퍼관리자</option>
              <option value="operator">운영팀</option>
              <option value="cs">CS팀</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {AdminHelper.ROLE_CONFIG[formData.role].description}
            </p>
          </div>

          {/* 비밀번호 */}
          {!admin ? (
            // 새 관리자 추가 시 - 비밀번호는 필수
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="8자 이상, 대/소문자, 숫자, 특수문자 포함"
                  className={cn(
                    'w-full h-10 px-4 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400',
                    errors.password ? 'border-red-300' : 'border-gray-200'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </div>
          ) : (
            // 관리자 수정 시 - 현재 로그인한 관리자만 본인의 비밀번호 변경 가능
            admin?.adminId === currentAdminId ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  비밀번호 변경 (선택사항)
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="새 비밀번호를 입력하세요"
                    className={cn(
                      'w-full h-10 px-4 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400',
                      errors.password ? 'border-red-300' : 'border-gray-200'
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {formData.password && (
                  <p className="text-xs text-gray-500 mt-1">
                    8자 이상, 대/소문자, 숫자, 특수문자 포함
                  </p>
                )}
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
              </div>
            ) : (
              // 다른 관리자 편집 시 - 비밀번호 변경 불가
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  비밀번호
                </label>
                <div className="h-10 px-4 border border-gray-200 rounded-lg bg-gray-100 flex items-center text-gray-500">
                  본인의 계정에서만 비밀번호를 변경할 수 있습니다
                </div>
              </div>
            )
          )}
        </div>

        <div className="flex gap-3 p-4 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 h-12 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex-1 h-12 bg-primary-400 text-white font-medium rounded-xl hover:bg-primary-500 transition-colors disabled:opacity-50"
          >
            {isSaving ? '저장 중...' : (admin ? '수정하기' : '추가하기')}
          </button>
        </div>
      </div>
    </div>
  );
}

// 삭제 확인 모달
function DeleteConfirmModal({
  admin,
  isSaving,
  onClose,
  onConfirm,
}: {
  admin: IAdmin;
  isSaving: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">관리자 삭제</h3>
          <p className="text-gray-500 mb-1">
            <span className="font-medium text-gray-900">{admin.name}</span>
            <span className="ml-1 text-gray-400">({admin.email})</span>
          </p>
          <p className="text-sm text-gray-500">
            삭제하면 복구할 수 없습니다. 정말 삭제하시겠습니까?
          </p>
        </div>
        <div className="flex gap-3 p-4 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 h-12 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={isSaving}
            className="flex-1 h-12 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {isSaving ? '삭제 중...' : '삭제하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
