'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  CreditCard,
  AlertCircle,
  Edit2,
  Save,
  X,
  ChevronRight,
  Clock,
  Check,
  History,
  FileText,
  RefreshCw,
  Building,
  ExternalLink,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useSettingsStore } from '@/stores';
import { adminAPI } from '@/lib/api';
import { TUserGrade, TUserStatus, IUserHistory, IDeal, TDealStatus, IUser } from '@/types';
import { DealHelper } from '@/classes';
import { cn, getErrorMessage } from '@/lib/utils';

const GRADE_LABELS: Record<TUserGrade, string> = {
  basic: '베이직',
  platinum: '플래티넘',
  b2b: 'B2B',
  employee: '임직원',
};

const GRADE_COLORS: Record<TUserGrade, string> = {
  basic: 'bg-gray-100 text-gray-700',
  platinum: 'bg-purple-100 text-purple-700',
  b2b: 'bg-blue-100 text-blue-700',
  employee: 'bg-green-100 text-green-700',
};

const STATUS_LABELS: Record<string, string> = {
  active: '활성',
  inactive: '비활성',
  suspended: '정지',
  pending: '대기',
  pending_verification: '사업자 인증 대기',
  withdrawn: '탈퇴',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-700',
  suspended: 'bg-red-100 text-red-700',
  pending: 'bg-yellow-100 text-yellow-700',
  pending_verification: 'bg-orange-100 text-orange-700',
  withdrawn: 'bg-gray-100 text-gray-500',
};

// 히스토리 필드 라벨
const FIELD_LABELS: Record<string, string> = {
  signup: '회원가입',
  status: '계정상태',
  grade: '회원 등급',
  feeRate: '수수료율',
  monthlyLimit: '월 한도',
  name: '이름',
  email: '이메일',
  phone: '연락처',
  thirdParty: '제3자 정보제공 동의',
  marketing: '마케팅 수신 동의',
};

// 히스토리 주체 라벨
const ACTOR_LABELS: Record<string, string> = {
  member: '회원',
  admin: '운영팀',
  system: '시스템',
};

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const uid = params.uid as string;

  const { getGradeSettings, settings } = useSettingsStore();

  // API 데이터 상태
  const [user, setUser] = useState<IUser | null>(null);
  const [userDeals, setUserDeals] = useState<IDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    grade: 'basic' as TUserGrade,
    status: 'active' as TUserStatus,
  });
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectMemo, setRejectMemo] = useState('');
  const [isApprovingBusiness, setIsApprovingBusiness] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<TUserStatus>('active');
  const [statusChangeReason, setStatusChangeReason] = useState('');
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editInfoData, setEditInfoData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  // API에서 회원 정보 로드
  const fetchUser = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminAPI.getUser(uid);
      setUser(response.user);
      setUserDeals(response.recentDeals || []);
      // 편집 데이터 초기화
      setEditData({
        grade: response.user.grade || 'basic',
        status: response.user.status || 'active',
      });
      setEditInfoData({
        name: response.user.name || '',
        email: response.user.email || '',
        phone: response.user.phone || '',
      });
    } catch (err: unknown) {
      console.error('회원 정보 로드 실패:', err);
      setError(getErrorMessage(err) || '회원 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  // 거래 통계 계산
  const dealStats = useMemo(() => {
    const completed = userDeals.filter(d => d.status && d.status === 'completed');
    const pending = userDeals.filter(d => d.status && ['pending', 'reviewing', 'awaiting_payment'].includes(d.status));
    return {
      total: userDeals.length,
      completed: completed.length,
      pending: pending.length,
      totalAmount: completed.reduce((sum, d) => sum + (d.amount || 0), 0),
    };
  }, [userDeals]);

  // 로딩 상태
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400" />
      </div>
    );
  }

  // 에러 또는 회원 없음
  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {error || '회원을 찾을 수 없습니다'}
        </h2>
        <p className="text-gray-500 mb-6">요청하신 회원 정보가 존재하지 않습니다.</p>
        <Link
          href="/admin/users"
          className="flex items-center gap-2 px-4 py-2 bg-primary-400 text-white rounded-lg hover:bg-primary-500"
        >
          <ArrowLeft className="w-4 h-4" />
          회원 목록으로
        </Link>
      </div>
    );
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 등급 변경
      if (editData.grade !== user.grade) {
        await adminAPI.updateUserGrade(user.uid, editData.grade);
      }

      // 상태 변경
      if (editData.status !== user.status) {
        await adminAPI.updateUserStatus(user.uid, editData.status);
      }

      // 데이터 다시 로드
      await fetchUser();
      setIsEditing(false);
    } catch (err: unknown) {
      console.error('회원 정보 수정 실패:', err);
      alert(getErrorMessage(err) || '회원 정보 수정에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      grade: user.grade,
      status: user.status,
    });
    setIsEditing(false);
  };

  const handleWithdraw = async () => {
    setIsSaving(true);
    try {
      await adminAPI.updateUserStatus(user.uid, 'withdrawn', '관리자 회원탈퇴 처리');
      await fetchUser();
      setShowWithdrawModal(false);
    } catch (err: unknown) {
      console.error('회원 탈퇴 처리 실패:', err);
      alert(getErrorMessage(err) || '회원 탈퇴 처리에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleApproveBusiness = async () => {
    setIsApprovingBusiness(true);
    try {
      await adminAPI.updateBusinessVerification(user.uid, 'verified');
      await fetchUser();
      alert('사업자 인증이 승인되었습니다.');
    } catch (err: unknown) {
      console.error('사업자 승인 실패:', err);
      alert(getErrorMessage(err) || '사업자 승인에 실패했습니다.');
    } finally {
      setIsApprovingBusiness(false);
    }
  };

  const handleRejectBusiness = async () => {
    if (!rejectMemo.trim()) {
      alert('거절 사유를 입력해주세요.');
      return;
    }
    setIsApprovingBusiness(true);
    try {
      await adminAPI.updateBusinessVerification(user.uid, 'rejected', rejectMemo);
      await fetchUser();
      setShowRejectModal(false);
      setRejectMemo('');
      alert('사업자 인증이 거절되었습니다.');
    } catch (err: unknown) {
      console.error('사업자 거절 실패:', err);
      alert(getErrorMessage(err) || '사업자 거절에 실패했습니다.');
    } finally {
      setIsApprovingBusiness(false);
    }
  };

  // 빠른 상태 변경
  const handleQuickStatusChange = async () => {
    if (newStatus === user.status) {
      setShowStatusModal(false);
      return;
    }
    setIsSaving(true);
    try {
      await adminAPI.updateUserStatus(user.uid, newStatus, statusChangeReason || undefined);
      await fetchUser();
      setShowStatusModal(false);
      setStatusChangeReason('');
      alert(`회원 상태가 "${STATUS_LABELS[newStatus]}"(으)로 변경되었습니다.`);
    } catch (err: unknown) {
      console.error('상태 변경 실패:', err);
      alert(getErrorMessage(err) || '상태 변경에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const openStatusModal = () => {
    setNewStatus(user.status);
    setStatusChangeReason('');
    setShowStatusModal(true);
  };

  const handleSaveInfo = async () => {
    // 현재 백엔드에서 회원 기본정보 수정 API가 없으므로 알림 표시
    alert('회원 기본정보 수정 기능은 준비중입니다.');
    setIsEditingInfo(false);
  };

  const handleCancelInfo = () => {
    setEditInfoData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
    });
    setIsEditingInfo(false);
  };

  // 상태 아이콘
  const StatusIcon = ({ status }: { status: TDealStatus }) => {
    switch (status) {
      case 'pending':
      case 'reviewing':
      case 'hold':
        return <Clock className="w-4 h-4" />;
      case 'completed':
        return <Check className="w-4 h-4" />;
      case 'need_revision':
        return <AlertCircle className="w-4 h-4" />;
      case 'cancelled':
        return <X className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const statusColors: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    orange: 'bg-orange-100 text-orange-700',
    red: 'bg-red-100 text-red-700',
    gray: 'bg-gray-100 text-gray-700',
    green: 'bg-green-100 text-green-700',
  };

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-gray-500 font-mono">{user.uid}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchUser}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
          <span className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-lg',
            GRADE_COLORS[user.grade]
          )}>
            {GRADE_LABELS[user.grade]}
            {user.isGradeManual && <span className="ml-1 text-xs">(수동)</span>}
          </span>
          <button
            onClick={openStatusModal}
            disabled={isSaving}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-lg flex items-center gap-1 hover:opacity-80 transition-opacity cursor-pointer',
              STATUS_COLORS[user.status]
            )}
          >
            {STATUS_LABELS[user.status]}
            <Edit2 className="w-3 h-3" />
          </button>
          {user.status !== 'withdrawn' && (
            <button
              onClick={() => setShowWithdrawModal(true)}
              disabled={isSaving}
              className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            >
              회원탈퇴
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 왼쪽: 기본 정보 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 기본 정보 */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">기본 정보</h2>
              {!isEditingInfo ? (
                <button
                  onClick={() => setIsEditingInfo(true)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-primary-400 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  수정
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleCancelInfo}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                    취소
                  </button>
                  <button
                    onClick={handleSaveInfo}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-white bg-primary-400 hover:bg-primary-500 rounded-lg transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    저장
                  </button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {/* 이름 */}
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500">이름</p>
                  {isEditingInfo ? (
                    <input
                      type="text"
                      value={editInfoData.name}
                      onChange={(e) => setEditInfoData({ ...editInfoData, name: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-200 rounded font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-400/20"
                    />
                  ) : (
                    <p className="font-medium text-gray-900">{user.name}</p>
                  )}
                </div>
              </div>
              {/* 이메일 */}
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500">이메일</p>
                  {isEditingInfo ? (
                    <input
                      type="email"
                      value={editInfoData.email}
                      onChange={(e) => setEditInfoData({ ...editInfoData, email: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-200 rounded font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-400/20"
                      placeholder="이메일 입력"
                    />
                  ) : (
                    <p className="font-medium text-gray-900">{user.email || '-'}</p>
                  )}
                </div>
              </div>
              {/* 연락처 */}
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500">연락처</p>
                  {isEditingInfo ? (
                    <input
                      type="tel"
                      value={editInfoData.phone}
                      onChange={(e) => {
                        const numbers = e.target.value.replace(/[^\d]/g, '');
                        setEditInfoData({ ...editInfoData, phone: numbers });
                      }}
                      className="w-full px-2 py-1 border border-gray-200 rounded font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-400/20"
                      placeholder="01012345678"
                      maxLength={11}
                    />
                  ) : (
                    <p className="font-medium text-gray-900">
                      {user.phone ? user.phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3') : '-'}
                    </p>
                  )}
                </div>
              </div>
              {/* 가입일 */}
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">가입일</p>
                  <p className="font-medium text-gray-900">
                    {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 인증 정보 */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">인증 정보</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">가입 방식</p>
                <p className="font-medium text-gray-900">
                  {user.authType === 'direct' ? '직접 가입' : '소셜 로그인'}
                  {user.socialProvider && ` (${user.socialProvider})`}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">본인 인증</p>
                <p className={cn(
                  'font-medium',
                  user.isVerified ? 'text-green-600' : 'text-red-500'
                )}>
                  {user.isVerified ? '인증완료' : '미인증'}
                </p>
              </div>
              {user.verifiedAt && (
                <div>
                  <p className="text-sm text-gray-500">인증일</p>
                  <p className="font-medium text-gray-900">
                    {new Date(user.verifiedAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">최근 로그인</p>
                <p className="font-medium text-gray-900">
                  {user.lastLoginAt
                    ? new Date(user.lastLoginAt).toLocaleString('ko-KR')
                    : '-'}
                </p>
              </div>
            </div>
          </div>

          {/* 거래 통계 */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">거래 통계</h2>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{user.totalDealCount}</p>
                <p className="text-sm text-gray-500">총 거래 건수</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-primary-400">
                  {(user.totalPaymentAmount / 10000).toLocaleString()}만
                </p>
                <p className="text-sm text-gray-500">누적 결제금액</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {((user.lastMonthPaymentAmount || 0) / 10000).toLocaleString()}만
                </p>
                <p className="text-sm text-gray-500">전월 결제금액</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">
                  {(user.usedAmount / 10000).toLocaleString()}만
                </p>
                <p className="text-sm text-gray-500">이번 달 사용</p>
              </div>
            </div>
          </div>

          {/* 거래 내역 대시보드 */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">거래 내역</h2>
              <Link
                href={`/admin/deals?uid=${uid}`}
                className="text-sm text-primary-400 hover:text-primary-500 flex items-center gap-1"
              >
                전체보기 <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* 거래 통계 미니 */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-lg font-bold text-gray-900">{dealStats.total}</p>
                <p className="text-xs text-gray-500">전체</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <p className="text-lg font-bold text-green-600">{dealStats.completed}</p>
                <p className="text-xs text-gray-500">완료</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg text-center">
                <p className="text-lg font-bold text-yellow-600">{dealStats.pending}</p>
                <p className="text-xs text-gray-500">진행중</p>
              </div>
              <div className="p-3 bg-primary-50 rounded-lg text-center">
                <p className="text-lg font-bold text-primary-400">{(dealStats.totalAmount / 10000).toFixed(0)}만</p>
                <p className="text-xs text-gray-500">총 송금액</p>
              </div>
            </div>

            {/* 거래 목록 테이블 */}
            {userDeals.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left text-xs font-medium text-gray-500 px-3 py-2">거래정보</th>
                      <th className="text-left text-xs font-medium text-gray-500 px-3 py-2">유형</th>
                      <th className="text-left text-xs font-medium text-gray-500 px-3 py-2">상태</th>
                      <th className="text-left text-xs font-medium text-gray-500 px-3 py-2">금액</th>
                      <th className="text-left text-xs font-medium text-gray-500 px-3 py-2">일자</th>
                      <th className="text-left text-xs font-medium text-gray-500 px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {userDeals.slice(0, 5).map((deal) => {
                      const statusConfig = DealHelper.getStatusConfig(deal.status) || { name: '알 수 없음', color: 'gray', tab: 'progress' as const };
                      const typeConfig = DealHelper.getDealTypeConfig(deal.dealType) || { name: '기타', icon: 'FileText', requiredDocs: [], optionalDocs: [], description: '' };
                      return (
                        <tr key={deal.did} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="px-3 py-3">
                            <div>
                              <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{deal.dealName}</p>
                              <p className="text-xs text-gray-400 font-mono">{deal.did}</p>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-700">
                              {typeConfig.name}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <span className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded',
                              statusColors[statusConfig.color]
                            )}>
                              <StatusIcon status={deal.status} />
                              {statusConfig.name}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <p className="text-sm font-medium text-gray-900">{deal.amount.toLocaleString()}원</p>
                          </td>
                          <td className="px-3 py-3 text-xs text-gray-500">
                            {new Date(deal.createdAt).toLocaleDateString('ko-KR')}
                          </td>
                          <td className="px-3 py-3">
                            <Link
                              href={`/admin/deals/${deal.did}`}
                              className="text-primary-400 hover:text-primary-500"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                <p>거래 내역이 없습니다.</p>
              </div>
            )}
          </div>

          {/* 동의 항목 */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">동의 항목</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">서비스 이용약관</span>
                <span className={user.agreements?.service ? 'text-green-600' : 'text-red-500'}>
                  {user.agreements?.service ? '동의' : '미동의'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">개인정보 처리방침</span>
                <span className={user.agreements?.privacy ? 'text-green-600' : 'text-red-500'}>
                  {user.agreements?.privacy ? '동의' : '미동의'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">제3자 정보제공</span>
                <span className={user.agreements?.thirdParty ? 'text-green-600' : 'text-red-500'}>
                  {user.agreements?.thirdParty ? '동의' : '미동의'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">마케팅 수신</span>
                <span className={user.agreements?.marketing ? 'text-green-600' : 'text-red-500'}>
                  {user.agreements?.marketing ? '동의' : '미동의'}
                </span>
              </div>
            </div>
          </div>

          {/* 히스토리 섹션 */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">히스토리</h2>
            </div>

            {user.history && user.history.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left text-xs font-medium text-gray-500 px-3 py-2">일시</th>
                      <th className="text-left text-xs font-medium text-gray-500 px-3 py-2">항목</th>
                      <th className="text-left text-xs font-medium text-gray-500 px-3 py-2">이전 값</th>
                      <th className="text-left text-xs font-medium text-gray-500 px-3 py-2">변경 값</th>
                      <th className="text-left text-xs font-medium text-gray-500 px-3 py-2">변경 주체</th>
                      <th className="text-left text-xs font-medium text-gray-500 px-3 py-2">메모</th>
                    </tr>
                  </thead>
                  <tbody>
                    {user.history.map((entry) => (
                      <tr key={entry.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-3 py-3 text-sm text-gray-500 whitespace-nowrap">
                          {new Date(entry.timestamp).toLocaleString('ko-KR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="px-3 py-3">
                          <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-700">
                            {entry.fieldLabel}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-600">
                          {entry.prevValue || '-'}
                        </td>
                        <td className="px-3 py-3 text-sm font-medium text-gray-900">
                          {entry.newValue || '-'}
                        </td>
                        <td className="px-3 py-3">
                          <span className={cn(
                            'inline-flex px-2 py-0.5 text-xs font-medium rounded',
                            entry.actor === 'admin' ? 'bg-blue-100 text-blue-700' :
                            entry.actor === 'system' ? 'bg-purple-100 text-purple-700' :
                            'bg-gray-100 text-gray-700'
                          )}>
                            {entry.actorLabel}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-500 max-w-[200px] truncate">
                          {entry.memo || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <History className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                <p>변경 이력이 없습니다.</p>
              </div>
            )}
          </div>
        </div>

        {/* 오른쪽: 등급/수수료 관리 */}
        <div className="space-y-6">
          {/* 사업자 인증 관리 */}
          {user.userType === 'business' && user.businessInfo && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Building className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900">사업자 인증</h2>
              </div>

              {/* 인증 상태 배지 */}
              <div className="mb-4">
                <span className={cn(
                  'inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg',
                  user.businessInfo.verificationStatus === 'verified' ? 'bg-green-100 text-green-700' :
                  user.businessInfo.verificationStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                  'bg-orange-100 text-orange-700'
                )}>
                  {user.businessInfo.verificationStatus === 'verified' ? (
                    <><CheckCircle className="w-4 h-4" />인증 완료</>
                  ) : user.businessInfo.verificationStatus === 'rejected' ? (
                    <><XCircle className="w-4 h-4" />인증 거절</>
                  ) : (
                    <><Clock className="w-4 h-4" />인증 대기</>
                  )}
                </span>
              </div>

              {/* 사업자 정보 */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">상호</span>
                  <span className="font-medium text-gray-900">{user.businessInfo.businessName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">사업자등록번호</span>
                  <span className="font-medium text-gray-900 font-mono">
                    {user.businessInfo.businessNumber.replace(/(\d{3})(\d{2})(\d{5})/, '$1-$2-$3')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">대표자명</span>
                  <span className="font-medium text-gray-900">{user.businessInfo.representativeName}</span>
                </div>
                {user.businessInfo.businessLicenseKey && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">사업자등록증</span>
                    <a
                      href={`${process.env.NEXT_PUBLIC_S3_URL || 'https://plic-uploads-prod.s3.ap-northeast-2.amazonaws.com'}/${user.businessInfo.businessLicenseKey}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary-400 hover:text-primary-500 font-medium"
                    >
                      <ExternalLink className="w-4 h-4" />
                      파일 보기
                    </a>
                  </div>
                )}
                {user.businessInfo.verificationMemo && (
                  <div className="pt-2 border-t border-gray-100">
                    <span className="text-gray-500 block mb-1">메모</span>
                    <p className="text-gray-700 bg-gray-50 p-2 rounded">{user.businessInfo.verificationMemo}</p>
                  </div>
                )}
                {user.businessInfo.verifiedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">인증일</span>
                    <span className="font-medium text-gray-900">
                      {new Date(user.businessInfo.verifiedAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                )}
              </div>

              {/* 승인/거절 버튼 (대기 상태일 때만) */}
              {(user.businessInfo.verificationStatus === 'pending' || user.status === 'pending_verification') && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={isApprovingBusiness}
                    className="flex-1 h-10 flex items-center justify-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    거절
                  </button>
                  <button
                    onClick={handleApproveBusiness}
                    disabled={isApprovingBusiness}
                    className="flex-1 h-10 flex items-center justify-center gap-1 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isApprovingBusiness ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    승인
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 등급 및 수수료 관리 */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">등급/수수료 관리</h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-gray-400 hover:text-primary-400 hover:bg-primary-50 rounded-lg"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex gap-1">
                  <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="p-2 text-primary-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg disabled:opacity-50"
                  >
                    {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {/* 회원 등급 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">회원 등급</label>
                {isEditing ? (
                  <>
                    <select
                      value={editData.grade}
                      onChange={(e) => setEditData({ ...editData, grade: e.target.value as TUserGrade })}
                      className="w-full h-10 px-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400 bg-white"
                    >
                      <option value="basic">베이직</option>
                      <option value="platinum">플래티넘</option>
                      <option value="b2b">B2B</option>
                      <option value="employee">임직원</option>
                    </select>
                    {editData.grade !== user.grade && (
                      <p className="text-xs text-blue-600 mt-1">
                        등급 변경 시 해당 등급의 수수료({getGradeSettings(editData.grade as TUserGrade).feeRate}%)와
                        한도({getGradeSettings(editData.grade as TUserGrade).monthlyLimit.toLocaleString()}원)가 자동 적용됩니다.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="font-medium text-gray-900">
                    {GRADE_LABELS[user.grade]}
                    {user.isGradeManual && <span className="text-xs text-gray-500 ml-2">(수동 부여)</span>}
                  </p>
                )}
              </div>

              {/* 수수료율 - 읽기 전용 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">수수료율</label>
                <p className="font-medium text-gray-900">{user.feeRate}%</p>
                <p className="text-xs text-gray-500 mt-1">
                  {GRADE_LABELS[user.grade]} 등급 기준: {getGradeSettings(user.grade)?.feeRate || 0}%
                </p>
              </div>

              {/* 월 한도 - 읽기 전용 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">월 한도</label>
                <p className="font-medium text-gray-900">{user.monthlyLimit.toLocaleString()}원</p>
                <p className="text-xs text-gray-500 mt-1">
                  사용: {user.usedAmount.toLocaleString()}원 ({Math.round(user.usedAmount / user.monthlyLimit * 100)}%)
                </p>
                <p className="text-xs text-gray-500">
                  {GRADE_LABELS[user.grade]} 등급 기준: {(getGradeSettings(user.grade)?.monthlyLimit || 0).toLocaleString()}원
                </p>
              </div>

              {/* 상태 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">계정 상태</label>
                {isEditing ? (
                  <select
                    value={editData.status}
                    onChange={(e) => setEditData({ ...editData, status: e.target.value as TUserStatus })}
                    className="w-full h-10 px-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400 bg-white"
                  >
                    <option value="active">활성</option>
                    <option value="pending">대기</option>
                    <option value="pending_verification">사업자 인증 대기</option>
                    <option value="suspended">정지</option>
                    <option value="withdrawn">탈퇴</option>
                  </select>
                ) : (
                  <p className={cn(
                    'font-medium',
                    user.status === 'active' ? 'text-green-600' : user.status === 'suspended' ? 'text-red-500' : 'text-gray-500'
                  )}>
                    {STATUS_LABELS[user.status]}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 한도 현황 */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">이번 달 한도 현황</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">사용</span>
                <span className="font-medium text-gray-900">{user.usedAmount.toLocaleString()}원</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className={cn(
                    'h-3 rounded-full transition-all',
                    user.usedAmount / user.monthlyLimit >= 0.9 ? 'bg-red-400' :
                    user.usedAmount / user.monthlyLimit >= 0.7 ? 'bg-yellow-400' : 'bg-primary-400'
                  )}
                  style={{ width: `${Math.min(user.usedAmount / user.monthlyLimit * 100, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">잔여</span>
                <span className="font-medium text-gray-900">
                  {Math.max(user.monthlyLimit - user.usedAmount, 0).toLocaleString()}원
                </span>
              </div>
              {user.usedAmount >= user.monthlyLimit && (
                <div className="mt-2 p-2 bg-red-50 rounded-lg">
                  <p className="text-xs text-red-600 font-medium">월 한도를 초과하여 새로운 거래가 제한됩니다.</p>
                </div>
              )}
            </div>
          </div>

          {/* 자동 등급 정보 */}
          {!user.isGradeManual && (user.grade === 'basic' || user.grade === 'platinum') && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">자동 등급 정보</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">전월 결제금액</span>
                  <span className="font-medium text-gray-900">
                    {((user.lastMonthPaymentAmount || 0) / 10000).toLocaleString()}만원
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">플래티넘 승급 기준</span>
                  <span className="font-medium text-gray-900">
                    {(settings.gradeCriteria.platinumThreshold / 10000).toLocaleString()}만원 이상
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">베이직 유지 기준</span>
                  <span className="font-medium text-gray-900">
                    {(settings.gradeCriteria.basicThreshold / 10000).toLocaleString()}만원 미만
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    매월 1일에 전월 결제금액을 기준으로 등급이 자동 조정됩니다.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 회원탈퇴 확인 모달 */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-4">회원탈퇴 확인</h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-6">
              <strong className="text-gray-900">{user.name}</strong>님을 정말 탈퇴 처리하시겠습니까?
              <br /><br />
              탈퇴 후에도 회원 정보는 유지되지만, 해당 회원은 로그인할 수 없게 됩니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="flex-1 h-12 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleWithdraw}
                className="flex-1 h-12 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
              >
                탈퇴 처리
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 사업자 인증 거절 모달 */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-4">사업자 인증 거절</h2>
            <p className="text-gray-600 text-sm mb-4">
              거절 사유를 입력해주세요. 회원에게 해당 사유가 전달됩니다.
            </p>
            <textarea
              value={rejectMemo}
              onChange={(e) => setRejectMemo(e.target.value)}
              placeholder="거절 사유를 입력하세요 (예: 사업자등록증이 불명확합니다)"
              className="w-full h-24 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400 resize-none text-sm"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectMemo('');
                }}
                disabled={isApprovingBusiness}
                className="flex-1 h-12 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleRejectBusiness}
                disabled={isApprovingBusiness}
                className="flex-1 h-12 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isApprovingBusiness ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  '거절하기'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 상태 변경 모달 */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-4">회원 상태 변경</h2>
            <p className="text-gray-600 text-sm mb-4">
              <strong className="text-gray-900">{user.name}</strong>님의 상태를 변경합니다.
            </p>

            {/* 현재 상태 */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">현재 상태</p>
              <span className={cn(
                'inline-flex px-2 py-1 text-sm font-medium rounded',
                STATUS_COLORS[user.status]
              )}>
                {STATUS_LABELS[user.status]}
              </span>
            </div>

            {/* 새 상태 선택 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">변경할 상태</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as TUserStatus)}
                className="w-full h-11 px-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400 bg-white"
              >
                <option value="active">활성</option>
                <option value="pending">대기</option>
                <option value="pending_verification">사업자 인증 대기</option>
                <option value="suspended">정지</option>
                <option value="withdrawn">탈퇴</option>
              </select>
            </div>

            {/* 변경 사유 (선택) */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">변경 사유 (선택)</label>
              <textarea
                value={statusChangeReason}
                onChange={(e) => setStatusChangeReason(e.target.value)}
                placeholder="상태 변경 사유를 입력하세요"
                className="w-full h-20 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400 resize-none text-sm"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setStatusChangeReason('');
                }}
                disabled={isSaving}
                className="flex-1 h-12 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleQuickStatusChange}
                disabled={isSaving || newStatus === user.status}
                className="flex-1 h-12 bg-primary-400 hover:bg-primary-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:bg-gray-300 flex items-center justify-center"
              >
                {isSaving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  '변경하기'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
