'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Plus,
  Tag,
  Ticket,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  X,
  Check,
  AlertCircle,
  Users,
  UserPlus,
  UserMinus,
  RefreshCw,
} from 'lucide-react';
import { adminAPI } from '@/lib/api';
import { useAdminUserStore } from '@/stores';
import { IDiscount, IDiscountCreateInput, TDiscountType, TUserGrade, IUser } from '@/types';
import { cn } from '@/lib/utils';

// 등급 라벨 맵
const GRADE_LABELS: Record<TUserGrade, string> = {
  basic: '베이직',
  platinum: '플래티넘',
  b2b: 'B2B',
  employee: '임직원',
};

const ALL_GRADES: TUserGrade[] = ['basic', 'platinum', 'b2b', 'employee'];

type TabType = 'code' | 'coupon';

export default function AdminCodesPage() {
  const { users, searchUsers } = useAdminUserStore();

  // API 데이터 상태
  const [discounts, setDiscounts] = useState<IDiscount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [activeTab, setActiveTab] = useState<TabType>('code');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<IDiscount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IDiscount | null>(null);

  // API에서 할인 목록 로드
  const fetchDiscounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminAPI.getDiscounts();
      setDiscounts(response.discounts || []);
    } catch (err: any) {
      console.error('할인 목록 로드 실패:', err);
      setError(err.message || '할인 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  // 타입별 필터링
  const getDiscountsByType = (type: TDiscountType) => {
    return discounts.filter(d => d.type === type);
  };

  // 현재 탭에 맞는 데이터
  const filteredDiscounts = getDiscountsByType(activeTab).filter((d) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      d.name.toLowerCase().includes(searchLower) ||
      (d.code && d.code.toLowerCase().includes(searchLower)) ||
      d.id.toLowerCase().includes(searchLower)
    );
  });

  // 통계
  const codeStats = {
    total: getDiscountsByType('code').length,
    active: getDiscountsByType('code').filter((d) => d.isActive).length,
  };
  const couponStats = {
    total: getDiscountsByType('coupon').length,
    active: getDiscountsByType('coupon').filter((d) => d.isActive).length,
  };

  const handleDelete = async (discount: IDiscount) => {
    setIsSaving(true);
    try {
      await adminAPI.deleteDiscount(discount.id);
      await fetchDiscounts();
      setDeleteTarget(null);
    } catch (err: any) {
      console.error('할인 삭제 실패:', err);
      alert(err.message || '할인 삭제에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (discount: IDiscount) => {
    setIsSaving(true);
    try {
      await adminAPI.updateDiscount(discount.id, { isActive: !discount.isActive });
      await fetchDiscounts();
    } catch (err: any) {
      console.error('할인 상태 변경 실패:', err);
      alert(err.message || '할인 상태 변경에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async (data: IDiscountCreateInput) => {
    setIsSaving(true);
    try {
      if (editingDiscount) {
        await adminAPI.updateDiscount(editingDiscount.id, data);
      } else {
        await adminAPI.createDiscount(data);
      }
      await fetchDiscounts();
      setShowCreateModal(false);
      setEditingDiscount(null);
    } catch (err: any) {
      console.error('할인 저장 실패:', err);
      alert(err.message || '할인 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 로딩 상태
  if (loading && discounts.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-900">코드관리</h1>
          <p className="text-gray-500 mt-1">할인코드 및 쿠폰을 관리합니다.</p>
        </div>
        <button
          onClick={fetchDiscounts}
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Tag className="w-4 h-4" />
            <span>전체 할인코드</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{codeStats.total}개</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500 mb-1">활성 할인코드</p>
          <p className="text-2xl font-bold text-green-600">{codeStats.active}개</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Ticket className="w-4 h-4" />
            <span>전체 쿠폰</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{couponStats.total}개</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500 mb-1">활성 쿠폰</p>
          <p className="text-2xl font-bold text-green-600">{couponStats.active}개</p>
        </div>
      </div>

      {/* 탭 */}
      <div className="bg-white rounded-xl shadow-sm mb-6">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('code')}
            className={cn(
              'flex items-center gap-2 px-6 py-4 font-medium transition-colors relative',
              activeTab === 'code' ? 'text-primary-400' : 'text-gray-400 hover:text-gray-600'
            )}
          >
            <Tag className="w-5 h-5" />
            할인코드
            <span
              className={cn(
                'ml-1 text-sm',
                activeTab === 'code' ? 'text-primary-400' : 'text-gray-400'
              )}
            >
              {codeStats.total}
            </span>
            {activeTab === 'code' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-400" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('coupon')}
            className={cn(
              'flex items-center gap-2 px-6 py-4 font-medium transition-colors relative',
              activeTab === 'coupon' ? 'text-primary-400' : 'text-gray-400 hover:text-gray-600'
            )}
          >
            <Ticket className="w-5 h-5" />
            쿠폰
            <span
              className={cn(
                'ml-1 text-sm',
                activeTab === 'coupon' ? 'text-primary-400' : 'text-gray-400'
              )}
            >
              {couponStats.total}
            </span>
            {activeTab === 'coupon' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-400" />
            )}
          </button>
        </div>

        {/* 검색 및 추가 버튼 */}
        <div className="p-4 flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'code' ? '코드명, 할인코드 검색' : '쿠폰명 검색'}
              className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400"
            />
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={isSaving}
            className="flex items-center justify-center gap-2 h-10 px-4 bg-primary-400 hover:bg-primary-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
            {activeTab === 'code' ? '할인코드 추가' : '쿠폰 추가'}
          </button>
        </div>
      </div>

      {/* 목록 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">
                  {activeTab === 'code' ? '코드정보' : '쿠폰정보'}
                </th>
                <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">할인</th>
                <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">조건</th>
                <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">
                  {activeTab === 'code' ? '사용 가능 등급' : '지급 대상'}
                </th>
                <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">유효기간</th>
                <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">사용</th>
                <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">상태</th>
                <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredDiscounts.length > 0 ? (
                filteredDiscounts.map((discount) => (
                  <DiscountRow
                    key={discount.id}
                    discount={discount}
                    isSaving={isSaving}
                    onEdit={() => setEditingDiscount(discount)}
                    onDelete={() => setDeleteTarget(discount)}
                    onToggle={() => handleToggle(discount)}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    {searchQuery
                      ? '검색 결과가 없습니다.'
                      : activeTab === 'code'
                      ? '등록된 할인코드가 없습니다.'
                      : '등록된 쿠폰이 없습니다.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 생성/수정 모달 */}
      {(showCreateModal || editingDiscount) && (
        <DiscountModal
          type={activeTab}
          discount={editingDiscount}
          users={users}
          searchUsers={searchUsers}
          isSaving={isSaving}
          onClose={() => {
            setShowCreateModal(false);
            setEditingDiscount(null);
          }}
          onSave={handleSave}
        />
      )}

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <DeleteConfirmModal
          discount={deleteTarget}
          isSaving={isSaving}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => handleDelete(deleteTarget)}
        />
      )}
    </div>
  );
}

// 행 컴포넌트
function DiscountRow({
  discount,
  isSaving,
  onEdit,
  onDelete,
  onToggle,
}: {
  discount: IDiscount;
  isSaving: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const isExpired = new Date(discount.expiry) < new Date();

  // 대상 등급 표시
  const getGradeDisplay = () => {
    if (discount.type === 'code') {
      // 할인코드: allowedGrades
      if (!discount.allowedGrades || discount.allowedGrades.length === 0 || discount.allowedGrades.length === ALL_GRADES.length) {
        return '전체 등급';
      }
      return discount.allowedGrades.map(g => GRADE_LABELS[g]).join(', ');
    } else {
      // 쿠폰: targetGrades
      if (!discount.targetGrades || discount.targetGrades.length === 0) {
        if (discount.targetUserIds && discount.targetUserIds.length > 0) {
          return `개별 지급 ${discount.targetUserIds.length}명`;
        }
        return '전체 등급';
      }
      const gradeText = discount.targetGrades.length === ALL_GRADES.length
        ? '전체 등급'
        : discount.targetGrades.map(g => GRADE_LABELS[g]).join(', ');
      const userCount = discount.targetUserIds?.length || 0;
      if (userCount > 0) {
        return `${gradeText} + 개별 ${userCount}명`;
      }
      return gradeText;
    }
  };

  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50">
      <td className="px-6 py-4">
        <div>
          <p className="font-medium text-gray-900">{discount.name}</p>
          {discount.code && (
            <p className="text-xs text-primary-400 font-mono bg-primary-50 inline-block px-2 py-0.5 rounded mt-1">
              {discount.code}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-1">{discount.id}</p>
        </div>
      </td>
      <td className="px-6 py-4">
        <div>
          <p className="font-medium text-gray-900">
            {discount.discountType === 'amount'
              ? `${discount.discountValue.toLocaleString()}원`
              : `수수료 ${discount.discountValue}% 할인`}
          </p>
          <p className="text-xs text-gray-500">
            {discount.discountType === 'amount' ? '금액 할인' : '수수료 할인'}
          </p>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm">
          <p className="text-gray-700">
            {discount.minAmount > 0
              ? `${discount.minAmount.toLocaleString()}원 이상`
              : '조건 없음'}
          </p>
          <div className="flex flex-wrap gap-1 mt-1">
            {discount.canStack && (
              <span className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">
                중복가능
              </span>
            )}
            {discount.isReusable && (
              <span className="text-xs px-1.5 py-0.5 bg-green-50 text-green-600 rounded">
                재사용
              </span>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm">
          <p className="text-gray-700 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-gray-400" />
            {getGradeDisplay()}
          </p>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm">
          <p className={cn(isExpired ? 'text-red-500' : 'text-gray-700')}>
            {discount.startDate ? new Date(discount.startDate).toLocaleDateString('ko-KR') : '-'} ~ {new Date(discount.expiry).toLocaleDateString('ko-KR')}
          </p>
          {isExpired && (
            <span className="text-xs text-red-500">만료됨</span>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <p className="text-sm text-gray-700">{discount.usageCount}회</p>
      </td>
      <td className="px-6 py-4">
        <button
          onClick={onToggle}
          disabled={isSaving}
          className={cn(
            'flex items-center gap-1.5 text-sm font-medium transition-colors',
            discount.isActive ? 'text-green-600' : 'text-gray-400',
            isSaving && 'opacity-50 cursor-not-allowed'
          )}
        >
          {discount.isActive ? (
            <>
              <ToggleRight className="w-5 h-5" />
              활성
            </>
          ) : (
            <>
              <ToggleLeft className="w-5 h-5" />
              비활성
            </>
          )}
        </button>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            disabled={isSaving}
            className="p-2 text-gray-400 hover:text-primary-400 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            disabled={isSaving}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// 생성/수정 모달
function DiscountModal({
  type,
  discount,
  users,
  searchUsers,
  isSaving,
  onClose,
  onSave,
}: {
  type: TDiscountType;
  discount: IDiscount | null;
  users: IUser[];
  searchUsers: (query: string) => IUser[];
  isSaving: boolean;
  onClose: () => void;
  onSave: (data: IDiscountCreateInput) => void;
}) {
  const [formData, setFormData] = useState<IDiscountCreateInput>({
    name: discount?.name || '',
    code: discount?.code || '',
    type: discount?.type || type,
    discountType: discount?.discountType || 'amount',
    discountValue: discount?.discountValue || 0,
    minAmount: discount?.minAmount || 0,
    startDate: discount?.startDate || new Date().toISOString().split('T')[0],
    expiry: discount?.expiry || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    canStack: discount?.canStack || false,
    isReusable: discount?.isReusable || false,
    description: discount?.description || '',
    // 등급 및 사용자 설정 - 기본값: 빈 배열 (아무 등급도 선택되지 않음)
    allowedGrades: discount?.allowedGrades || [],
    targetGrades: discount?.targetGrades || [],
    targetUserIds: discount?.targetUserIds || [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // 사용자 검색 관련 상태
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);

  // 검색된 사용자 목록
  const searchedUsers = useMemo(() => {
    if (!userSearchQuery.trim()) return [];
    return searchUsers(userSearchQuery).slice(0, 10); // 최대 10명
  }, [userSearchQuery, searchUsers]);

  // 선택된 사용자 목록
  const selectedUsers = useMemo(() => {
    return users.filter(u => formData.targetUserIds?.includes(u.uid));
  }, [users, formData.targetUserIds]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요.';
    }

    if (type === 'code' && !formData.code?.trim()) {
      newErrors.code = '할인코드를 입력해주세요.';
    }

    if (formData.discountValue <= 0) {
      newErrors.discountValue = '할인 값을 입력해주세요.';
    }

    if (formData.discountType === 'feePercent' && formData.discountValue > 100) {
      newErrors.discountValue = '퍼센트는 100을 초과할 수 없습니다.';
    }

    if (!formData.expiry) {
      newErrors.expiry = '유효기간을 선택해주세요.';
    }

    // 할인코드: 최소 1개 등급 선택 필요
    if (type === 'code' && (!formData.allowedGrades || formData.allowedGrades.length === 0)) {
      newErrors.allowedGrades = '최소 1개 등급을 선택해주세요.';
    }

    // 쿠폰: 등급 또는 사용자 중 하나는 선택 필요
    if (type === 'coupon') {
      const hasGrades = formData.targetGrades && formData.targetGrades.length > 0;
      const hasUsers = formData.targetUserIds && formData.targetUserIds.length > 0;
      if (!hasGrades && !hasUsers) {
        newErrors.target = '지급 대상 등급 또는 사용자를 선택해주세요.';
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

  // 등급 선택 토글
  const toggleGrade = (grade: TUserGrade, field: 'allowedGrades' | 'targetGrades') => {
    const currentGrades = formData[field] || [];
    if (currentGrades.includes(grade)) {
      setFormData({
        ...formData,
        [field]: currentGrades.filter(g => g !== grade),
      });
    } else {
      setFormData({
        ...formData,
        [field]: [...currentGrades, grade],
      });
    }
  };

  // 전체 등급 선택/해제
  const toggleAllGrades = (field: 'allowedGrades' | 'targetGrades') => {
    const currentGrades = formData[field] || [];
    if (currentGrades.length === ALL_GRADES.length) {
      setFormData({ ...formData, [field]: [] });
    } else {
      setFormData({ ...formData, [field]: [...ALL_GRADES] });
    }
  };

  // 사용자 추가
  const addUser = (user: IUser) => {
    if (!formData.targetUserIds?.includes(user.uid)) {
      setFormData({
        ...formData,
        targetUserIds: [...(formData.targetUserIds || []), user.uid],
      });
    }
    setUserSearchQuery('');
    setShowUserSearch(false);
  };

  // 사용자 제거
  const removeUser = (userId: string) => {
    setFormData({
      ...formData,
      targetUserIds: formData.targetUserIds?.filter(id => id !== userId) || [],
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {discount ? (type === 'code' ? '할인코드 수정' : '쿠폰 수정') : (type === 'code' ? '할인코드 추가' : '쿠폰 추가')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 폼 */}
        <div className="p-4 space-y-4">
          {/* 이름 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {type === 'code' ? '코드명' : '쿠폰명'} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="예: 신규가입 할인"
              className={cn(
                'w-full h-10 px-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400',
                errors.name ? 'border-red-300' : 'border-gray-200'
              )}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* 할인코드 (코드 타입만) */}
          {type === 'code' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                할인코드 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="예: WELCOME2024"
                className={cn(
                  'w-full h-10 px-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400 font-mono',
                  errors.code ? 'border-red-300' : 'border-gray-200'
                )}
              />
              {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code}</p>}
            </div>
          )}

          {/* 할인 유형 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">할인 유형</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, discountType: 'amount' })}
                className={cn(
                  'flex-1 h-10 px-4 rounded-lg border font-medium transition-colors',
                  formData.discountType === 'amount'
                    ? 'bg-primary-400 text-white border-primary-400'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-primary-400'
                )}
              >
                금액 할인
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, discountType: 'feePercent' })}
                className={cn(
                  'flex-1 h-10 px-4 rounded-lg border font-medium transition-colors',
                  formData.discountType === 'feePercent'
                    ? 'bg-primary-400 text-white border-primary-400'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-primary-400'
                )}
              >
                수수료 % 할인
              </button>
            </div>
          </div>

          {/* 할인 값 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {formData.discountType === 'amount' ? '할인 금액' : '할인율'} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={formData.discountValue || ''}
                onChange={(e) => setFormData({ ...formData, discountValue: parseInt(e.target.value) || 0 })}
                placeholder={formData.discountType === 'amount' ? '5000' : '30'}
                className={cn(
                  'w-full h-10 px-4 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400',
                  errors.discountValue ? 'border-red-300' : 'border-gray-200'
                )}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                {formData.discountType === 'amount' ? '원' : '%'}
              </span>
            </div>
            {errors.discountValue && <p className="text-xs text-red-500 mt-1">{errors.discountValue}</p>}
          </div>

          {/* 최소 주문 금액 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">최소 주문 금액</label>
            <div className="relative">
              <input
                type="number"
                value={formData.minAmount || ''}
                onChange={(e) => setFormData({ ...formData, minAmount: parseInt(e.target.value) || 0 })}
                placeholder="0 (조건 없음)"
                className="w-full h-10 px-4 pr-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">원</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">0원 입력 시 조건 없이 사용 가능</p>
          </div>

          {/* 적용 기간 (시작일 ~ 유효기간) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              적용 기간 <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className={cn(
                    'w-full h-10 px-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400',
                    errors.startDate ? 'border-red-300' : 'border-gray-200'
                  )}
                />
              </div>
              <span className="text-gray-400">~</span>
              <div className="flex-1">
                <input
                  type="date"
                  value={formData.expiry}
                  onChange={(e) => setFormData({ ...formData, expiry: e.target.value })}
                  className={cn(
                    'w-full h-10 px-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400',
                    errors.expiry ? 'border-red-300' : 'border-gray-200'
                  )}
                />
              </div>
            </div>
            {(errors.startDate || errors.expiry) && (
              <p className="text-xs text-red-500 mt-1">{errors.startDate || errors.expiry}</p>
            )}
          </div>

          {/* 할인코드: 사용 가능 등급 선택 */}
          {type === 'code' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  사용 가능 등급 <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => toggleAllGrades('allowedGrades')}
                  className="text-xs text-primary-400 hover:text-primary-500"
                >
                  {formData.allowedGrades?.length === ALL_GRADES.length ? '전체 해제' : '전체 선택'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {ALL_GRADES.map((grade) => (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => toggleGrade(grade, 'allowedGrades')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors',
                      formData.allowedGrades?.includes(grade)
                        ? 'bg-primary-400 text-white border-primary-400'
                        : 'bg-white text-gray-300 border-gray-200 hover:border-primary-400 hover:text-gray-500'
                    )}
                  >
                    {GRADE_LABELS[grade]}
                  </button>
                ))}
              </div>
              {errors.allowedGrades && <p className="text-xs text-red-500 mt-1">{errors.allowedGrades}</p>}
              <p className="text-xs text-gray-500 mt-1">선택한 등급의 사용자만 이 코드를 사용할 수 있습니다.</p>
            </div>
          )}

          {/* 쿠폰: 지급 대상 설정 */}
          {type === 'coupon' && (
            <>
              {/* 등급별 지급 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    지급 대상 등급
                  </label>
                  <button
                    type="button"
                    onClick={() => toggleAllGrades('targetGrades')}
                    className="text-xs text-primary-400 hover:text-primary-500"
                  >
                    {formData.targetGrades?.length === ALL_GRADES.length ? '전체 해제' : '전체 선택'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ALL_GRADES.map((grade) => (
                    <button
                      key={grade}
                      type="button"
                      onClick={() => toggleGrade(grade, 'targetGrades')}
                      className={cn(
                        'px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors',
                        formData.targetGrades?.includes(grade)
                          ? 'bg-primary-400 text-white border-primary-400'
                          : 'bg-white text-gray-300 border-gray-200 hover:border-primary-400 hover:text-gray-500'
                      )}
                    >
                      {GRADE_LABELS[grade]}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">선택한 등급의 사용자에게 쿠폰이 자동 지급됩니다.</p>
              </div>

              {/* 개별 사용자 지급 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  개별 사용자 지급
                </label>

                {/* 사용자 검색 */}
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={userSearchQuery}
                      onChange={(e) => {
                        setUserSearchQuery(e.target.value);
                        setShowUserSearch(true);
                      }}
                      onFocus={() => setShowUserSearch(true)}
                      placeholder="UID, 이름, 휴대폰번호로 검색"
                      className="w-full h-10 pl-9 pr-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400 text-sm"
                    />
                  </div>

                  {/* 검색 결과 드롭다운 */}
                  {showUserSearch && userSearchQuery && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {searchedUsers.length > 0 ? (
                        searchedUsers.map((user) => {
                          const isSelected = formData.targetUserIds?.includes(user.uid);
                          return (
                            <button
                              key={user.uid}
                              type="button"
                              onClick={() => !isSelected && addUser(user)}
                              disabled={isSelected}
                              className={cn(
                                'w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between',
                                isSelected && 'bg-gray-50 cursor-not-allowed'
                              )}
                            >
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {user.name}
                                  <span className="ml-2 text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                                    {GRADE_LABELS[user.grade]}
                                  </span>
                                </p>
                                <p className="text-xs text-gray-500">
                                  {user.uid} · {user.phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')}
                                </p>
                              </div>
                              {isSelected ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <UserPlus className="w-4 h-4 text-gray-400" />
                              )}
                            </button>
                          );
                        })
                      ) : (
                        <p className="px-3 py-4 text-sm text-gray-500 text-center">
                          검색 결과가 없습니다.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* 선택된 사용자 목록 */}
                {selectedUsers.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {selectedUsers.map((user) => (
                      <div
                        key={user.uid}
                        className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {user.name}
                            <span className="ml-2 text-xs px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded">
                              {GRADE_LABELS[user.grade]}
                            </span>
                          </p>
                          <p className="text-xs text-gray-500">{user.uid}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeUser(user.uid)}
                          className="p-1 text-gray-400 hover:text-red-500 rounded"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-1">
                  등급과 별개로 특정 사용자에게 직접 쿠폰을 지급할 수 있습니다.
                </p>
              </div>

              {errors.target && <p className="text-xs text-red-500">{errors.target}</p>}
            </>
          )}

          {/* 옵션 */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">옵션</label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.canStack}
                onChange={(e) => setFormData({ ...formData, canStack: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-primary-400 focus:ring-primary-400"
              />
              <div>
                <p className="text-sm text-gray-700">중복 사용 가능</p>
                <p className="text-xs text-gray-500">다른 할인과 함께 적용 가능</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isReusable}
                onChange={(e) => setFormData({ ...formData, isReusable: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-primary-400 focus:ring-primary-400"
              />
              <div>
                <p className="text-sm text-gray-700">재사용 가능</p>
                <p className="text-xs text-gray-500">한 번 사용 후에도 다시 사용 가능</p>
              </div>
            </label>
          </div>

          {/* 설명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">설명 (선택)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="관리자용 메모"
              rows={2}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400 resize-none"
            />
          </div>
        </div>

        {/* 푸터 */}
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
            {isSaving ? '저장 중...' : (discount ? '수정하기' : '추가하기')}
          </button>
        </div>
      </div>
    </div>
  );
}

// 삭제 확인 모달
function DeleteConfirmModal({
  discount,
  isSaving,
  onClose,
  onConfirm,
}: {
  discount: IDiscount;
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
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {discount.type === 'code' ? '할인코드 삭제' : '쿠폰 삭제'}
          </h3>
          <p className="text-gray-500 mb-1">
            <span className="font-medium text-gray-900">{discount.name}</span>
            {discount.code && (
              <span className="ml-1 text-primary-400">({discount.code})</span>
            )}
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
