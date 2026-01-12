'use client';

import { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { useUserStore, useDealStore, useSettingsStore } from '@/stores';
import { TUserGrade, TUserStatus, IUserHistory, IDeal, TDealStatus } from '@/types';
import { DealHelper } from '@/classes';
import { cn } from '@/lib/utils';

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
  withdrawn: '탈퇴',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-700',
  suspended: 'bg-red-100 text-red-700',
  pending: 'bg-yellow-100 text-yellow-700',
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

  const { users, updateUserInList } = useUserStore();
  const { deals } = useDealStore();
  const { getGradeSettings, settings } = useSettingsStore();
  const user = users.find(u => u.uid === uid);

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    grade: user?.grade || 'basic',
    status: user?.status || 'active',
  });
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editInfoData, setEditInfoData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  // 회원의 거래 내역 (샘플 데이터 포함)
  const sampleDeals: IDeal[] = [];

  const allDeals = [...deals, ...sampleDeals.filter(sd => !deals.some(d => d.did === sd.did))];
  const userDeals = useMemo(() => {
    return allDeals.filter(deal => deal.uid === uid).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [allDeals, uid]);

  // 거래 통계 계산
  const dealStats = useMemo(() => {
    const completed = userDeals.filter(d => d.status === 'completed');
    const pending = userDeals.filter(d => ['pending', 'reviewing', 'awaiting_payment'].includes(d.status));
    return {
      total: userDeals.length,
      completed: completed.length,
      pending: pending.length,
      totalAmount: completed.reduce((sum, d) => sum + d.amount, 0),
    };
  }, [userDeals]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">회원을 찾을 수 없습니다</h2>
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

  const handleSave = () => {
    const historyEntries: IUserHistory[] = [];
    const now = new Date().toISOString();
    const gradeSettings = getGradeSettings(editData.grade as TUserGrade);

    // 등급 변경 시
    if (editData.grade !== user.grade) {
      historyEntries.push({
        id: `H${Date.now()}_grade`,
        field: 'grade',
        fieldLabel: FIELD_LABELS.grade,
        prevValue: GRADE_LABELS[user.grade],
        newValue: GRADE_LABELS[editData.grade as TUserGrade],
        actor: 'admin',
        actorLabel: ACTOR_LABELS.admin,
        timestamp: now,
      });

      // 등급 변경 시 수수료율 변경 기록
      if (user.feeRate !== gradeSettings.feeRate) {
        historyEntries.push({
          id: `H${Date.now()}_feeRate`,
          field: 'feeRate',
          fieldLabel: FIELD_LABELS.feeRate,
          prevValue: `${user.feeRate}%`,
          newValue: `${gradeSettings.feeRate}%`,
          actor: 'admin',
          actorLabel: ACTOR_LABELS.admin,
          memo: `${GRADE_LABELS[editData.grade as TUserGrade]} 등급 적용`,
          timestamp: now,
        });
      }

      // 등급 변경 시 월 한도 변경 기록
      if (user.monthlyLimit !== gradeSettings.monthlyLimit) {
        historyEntries.push({
          id: `H${Date.now()}_limit`,
          field: 'monthlyLimit',
          fieldLabel: FIELD_LABELS.monthlyLimit,
          prevValue: `${user.monthlyLimit.toLocaleString()}원`,
          newValue: `${gradeSettings.monthlyLimit.toLocaleString()}원`,
          actor: 'admin',
          actorLabel: ACTOR_LABELS.admin,
          memo: `${GRADE_LABELS[editData.grade as TUserGrade]} 등급 적용`,
          timestamp: now,
        });
      }
    }

    // 상태 변경 시
    if (editData.status !== user.status) {
      historyEntries.push({
        id: `H${Date.now()}_status`,
        field: 'status',
        fieldLabel: FIELD_LABELS.status,
        prevValue: STATUS_LABELS[user.status],
        newValue: STATUS_LABELS[editData.status],
        actor: 'admin',
        actorLabel: ACTOR_LABELS.admin,
        timestamp: now,
      });
    }

    // 업데이트 데이터 구성
    const updateData: Partial<typeof user> = {
      grade: editData.grade as TUserGrade,
      status: editData.status as TUserStatus,
      history: [...historyEntries, ...(user.history || [])],
    };

    // 등급 변경 시 수수료/한도 자동 적용
    if (editData.grade !== user.grade) {
      updateData.feeRate = gradeSettings.feeRate;
      updateData.monthlyLimit = gradeSettings.monthlyLimit;
      // B2B 또는 임직원으로 변경 시 수동 등급으로 표시
      updateData.isGradeManual = editData.grade === 'b2b' || editData.grade === 'employee';
    }

    updateUserInList(user.uid, updateData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      grade: user.grade,
      status: user.status,
    });
    setIsEditing(false);
  };

  const handleWithdraw = () => {
    const now = new Date().toISOString();
    const historyEntry: IUserHistory = {
      id: `H${Date.now()}_status`,
      field: 'status',
      fieldLabel: FIELD_LABELS.status,
      prevValue: STATUS_LABELS[user.status],
      newValue: STATUS_LABELS.withdrawn,
      actor: 'admin',
      actorLabel: ACTOR_LABELS.admin,
      memo: '회원탈퇴 처리',
      timestamp: now,
    };

    updateUserInList(user.uid, {
      status: 'withdrawn',
      history: [historyEntry, ...(user.history || [])],
    });

    setShowWithdrawModal(false);
  };

  const handleSaveInfo = () => {
    const historyEntries: IUserHistory[] = [];
    const now = new Date().toISOString();

    // 이름 변경 시
    if (editInfoData.name !== user.name) {
      historyEntries.push({
        id: `H${Date.now()}_name`,
        field: 'name',
        fieldLabel: FIELD_LABELS.name,
        prevValue: user.name,
        newValue: editInfoData.name,
        actor: 'admin',
        actorLabel: ACTOR_LABELS.admin,
        timestamp: now,
      });
    }

    // 이메일 변경 시
    if (editInfoData.email !== user.email) {
      historyEntries.push({
        id: `H${Date.now()}_email`,
        field: 'email',
        fieldLabel: FIELD_LABELS.email,
        prevValue: user.email || '-',
        newValue: editInfoData.email,
        actor: 'admin',
        actorLabel: ACTOR_LABELS.admin,
        timestamp: now,
      });
    }

    // 연락처 변경 시
    if (editInfoData.phone !== user.phone) {
      historyEntries.push({
        id: `H${Date.now()}_phone`,
        field: 'phone',
        fieldLabel: FIELD_LABELS.phone,
        prevValue: user.phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3'),
        newValue: editInfoData.phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3'),
        actor: 'admin',
        actorLabel: ACTOR_LABELS.admin,
        timestamp: now,
      });
    }

    if (historyEntries.length > 0) {
      updateUserInList(user.uid, {
        name: editInfoData.name,
        email: editInfoData.email,
        phone: editInfoData.phone,
        history: [...historyEntries, ...(user.history || [])],
      });
    }

    setIsEditingInfo(false);
  };

  const handleCancelInfo = () => {
    setEditInfoData({
      name: user.name,
      email: user.email || '',
      phone: user.phone,
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
          <span className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-lg',
            GRADE_COLORS[user.grade]
          )}>
            {GRADE_LABELS[user.grade]}
            {user.isGradeManual && <span className="ml-1 text-xs">(수동)</span>}
          </span>
          <span className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-lg',
            STATUS_COLORS[user.status]
          )}>
            {STATUS_LABELS[user.status]}
          </span>
          {user.status !== 'withdrawn' && (
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
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
                      {user.phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')}
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
                      const statusConfig = DealHelper.getStatusConfig(deal.status);
                      const typeConfig = DealHelper.getDealTypeConfig(deal.dealType);
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
                <span className={user.agreements.service ? 'text-green-600' : 'text-red-500'}>
                  {user.agreements.service ? '동의' : '미동의'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">개인정보 처리방침</span>
                <span className={user.agreements.privacy ? 'text-green-600' : 'text-red-500'}>
                  {user.agreements.privacy ? '동의' : '미동의'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">제3자 정보제공</span>
                <span className={user.agreements.thirdParty ? 'text-green-600' : 'text-red-500'}>
                  {user.agreements.thirdParty ? '동의' : '미동의'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">마케팅 수신</span>
                <span className={user.agreements.marketing ? 'text-green-600' : 'text-red-500'}>
                  {user.agreements.marketing ? '동의' : '미동의'}
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
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleSave}
                    className="p-2 text-primary-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg"
                  >
                    <Save className="w-4 h-4" />
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
    </div>
  );
}
