'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  Clock,
  Check,
  AlertCircle,
  X,
  User,
  Building,
  CreditCard,
  Calendar,
  Download,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  RefreshCw,
  File,
  Users,
  Edit3,
} from 'lucide-react';
import { adminAPI } from '@/lib/api';
import tracking from '@/lib/tracking';
import { DealHelper } from '@/classes';
import { IDeal, TDealStatus, IUser } from '@/types';
import { cn, getErrorMessage } from '@/lib/utils';
import { AdminEditDealModal } from './AdminEditDealModal';

const statusColors: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  orange: 'bg-orange-100 text-orange-700',
  red: 'bg-red-100 text-red-700',
  gray: 'bg-gray-100 text-gray-700',
  green: 'bg-green-100 text-green-700',
};

export default function AdminDealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const did = params.did as string;

  // API 데이터 상태
  const [deal, setDeal] = useState<IDeal | null>(null);
  const [dealUser, setDealUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [showRevisionConfirmModal, setShowRevisionConfirmModal] = useState(false);
  const [selectedRevisionType, setSelectedRevisionType] = useState<'documents' | 'recipient' | null>(null);
  const [revisionMemo, setRevisionMemo] = useState('');

  // 수정 모달 상태
  const [editModalType, setEditModalType] = useState<'amount' | 'recipient' | 'attachments' | null>(null);

  // API에서 거래 정보 로드
  const fetchDeal = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminAPI.getDeal(did);
      setDeal(response.deal);
      setDealUser(response.user || null);
    } catch (err: unknown) {
      console.error('거래 정보 로드 실패:', err);
      setError(getErrorMessage(err) || '거래 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [did]);

  // 로딩 상태
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400" />
      </div>
    );
  }

  // 에러 또는 거래 없음
  if (error || !deal) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {error || '거래를 찾을 수 없습니다'}
        </h2>
        <p className="text-gray-500 mb-6">요청하신 거래 정보가 존재하지 않습니다.</p>
        <Link
          href="/admin/deals"
          className="flex items-center gap-2 px-4 py-2 bg-primary-400 text-white rounded-lg hover:bg-primary-500"
        >
          <ArrowLeft className="w-4 h-4" />
          거래 목록으로
        </Link>
      </div>
    );
  }

  const statusConfig = DealHelper.getStatusConfig(deal.status, deal.isPaid) || { name: '알 수 없음', color: 'gray', tab: 'progress' as const };
  const typeConfig = DealHelper.getDealTypeConfig(deal.dealType) || { name: '기타', icon: 'FileText', requiredDocs: [], optionalDocs: [], description: '' };

  // 수정 가능 여부: 결제 전 & draft/awaiting_payment 상태일 때만
  const canEdit = !deal.isPaid &&
    (deal.status === 'draft' || deal.status === 'awaiting_payment');

  const handleStatusChange = async (newStatus: TDealStatus) => {
    // 보완 요청일 경우 모달 열기
    if (newStatus === 'need_revision') {
      setShowRevisionModal(true);
      return;
    }

    // 취소 요청일 경우 - 결제 완료된 거래는 PG 취소 먼저 진행
    if (newStatus === 'cancelled' && deal.isPaid && deal.pgTransactionId) {
      const confirmed = window.confirm(
        `이 거래는 결제가 완료된 상태입니다.\n` +
        `PG 결제 취소를 진행하시겠습니까?\n\n` +
        `결제금액: ${deal.finalAmount?.toLocaleString()}원\n` +
        `거래번호: ${deal.pgTransactionId}`
      );

      if (!confirmed) return;

      setIsProcessing(true);
      try {
        // PG 결제 취소 API 호출
        console.log('[Admin] Cancelling PG payment:', deal.pgTransactionId);
        const cancelResponse = await fetch(`/api/payments/${deal.pgTransactionId}/cancel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: deal.finalAmount,
            dealNumber: deal.did,
          }),
        });

        const cancelData = await cancelResponse.json();

        if (!cancelResponse.ok || !cancelData.success) {
          throw new Error(cancelData.error || 'PG 결제 취소에 실패했습니다.');
        }

        console.log('[Admin] PG cancel success:', cancelData);
        alert(`PG 결제 취소 완료\n취소 금액: ${cancelData.cancelledAmount?.toLocaleString()}원`);

        // PG 취소 성공 후 거래 상태 변경
        await adminAPI.updateDealStatus(deal.did, 'cancelled', 'PG 결제 취소 완료');
        await fetchDeal();
      } catch (err: unknown) {
        console.error('PG 결제 취소 실패:', err);
        alert(`PG 결제 취소 실패: ${getErrorMessage(err)}\n\n수동으로 PG사에서 취소 처리가 필요합니다.`);
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    setIsProcessing(true);
    try {
      await adminAPI.updateDealStatus(deal.did, newStatus);
      // 어드민 승인 완료 시 송금완료 트래킹 (admin으로 태깅)
      if (newStatus === 'completed') {
        tracking.identify('admin', 'admin');
        tracking.transferFunnel.complete();
        tracking.flush();
      }
      await fetchDeal(); // 데이터 다시 로드
    } catch (err: unknown) {
      console.error('거래 상태 변경 실패:', err);
      alert(getErrorMessage(err) || '거래 상태 변경에 실패했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 보완 요청 유형 선택 시 (확인 모달 표시)
  const handleRevisionTypeSelect = (revisionType: 'documents' | 'recipient') => {
    setSelectedRevisionType(revisionType);
    setShowRevisionModal(false);
    setShowRevisionConfirmModal(true);
    setRevisionMemo('');
  };

  // 확인 모달에서 확인 버튼 클릭 시 (실제 요청)
  const handleRevisionConfirm = async () => {
    if (!selectedRevisionType) return;

    setIsProcessing(true);
    try {
      const reason = selectedRevisionType === 'documents'
        ? `서류 보완 요청${revisionMemo ? `: ${revisionMemo}` : ''}`
        : `수취인 정보 보완 요청${revisionMemo ? `: ${revisionMemo}` : ''}`;

      await adminAPI.updateDealStatus(
        deal.did,
        'need_revision',
        reason,
        selectedRevisionType,
        revisionMemo || undefined
      );
      await fetchDeal(); // 데이터 다시 로드
      setShowRevisionConfirmModal(false);
      setSelectedRevisionType(null);
      setRevisionMemo('');
    } catch (err: unknown) {
      console.error('보완 요청 실패:', err);
      alert(getErrorMessage(err) || '보완 요청에 실패했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

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
            <h1 className="text-2xl font-bold text-gray-900">{deal.dealName}</h1>
            <p className="text-gray-500 font-mono">{deal.did}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={fetchDeal}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
          {deal.isPaid && (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg bg-red-100 text-red-700">
              <Check className="w-4 h-4" />
              결제완료
            </span>
          )}
          <span className={cn(
            'inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg',
            statusColors[statusConfig.color]
          )}>
            <StatusIcon status={deal.status} />
            {statusConfig.name}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 왼쪽: 거래 정보 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 기본 정보 */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">거래 정보</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">거래 유형</p>
                <p className="font-medium text-gray-900">{typeConfig.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">신청자 UID</p>
                <p className="font-medium text-gray-900 font-mono">{deal.uid}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">생성일</p>
                <p className="font-medium text-gray-900">
                  {new Date(deal.createdAt).toLocaleString('ko-KR')}
                </p>
              </div>
            </div>
          </div>

          {/* 금액 정보 */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">금액 정보</h2>
              {canEdit && (
                <button
                  onClick={() => setEditModalType('amount')}
                  className="flex items-center gap-1 text-sm text-primary-400 hover:text-primary-500 font-medium"
                >
                  <Edit3 className="w-4 h-4" />
                  수정
                </button>
              )}
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">결제 금액</span>
                <span className="font-medium text-gray-900">{deal.amount.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">수수료 ({deal.feeRate}%)</span>
                <span className="font-medium text-gray-900">{deal.feeAmount.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between font-semibold border-t border-gray-100 pt-3">
                <span className="text-gray-900">소계</span>
                <span className="text-gray-900">{deal.totalAmount.toLocaleString()}원</span>
              </div>
              {deal.discountAmount > 0 && (
                <>
                  <div className="flex justify-between text-green-600">
                    <span>할인 금액</span>
                    <span>-{deal.discountAmount.toLocaleString()}원</span>
                  </div>
                  {deal.discountCode && (
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>적용 코드</span>
                      <span className="font-mono bg-gray-100 px-2 py-1 rounded">{deal.discountCode}</span>
                    </div>
                  )}
                </>
              )}
              <div className="border-t border-gray-100 pt-3 flex justify-between">
                <span className="font-semibold text-gray-900">총 결제액</span>
                <span className="text-2xl font-bold text-primary-400">
                  {deal.finalAmount.toLocaleString()}원
                </span>
              </div>
            </div>
          </div>

          {/* PG 결제 정보 */}
          {(
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">PG 결제 정보 (소프트먼트)</h2>
              {!deal.pgTransactionId ? (
                <p className="text-gray-400 text-center py-4">PG 결제 정보가 없습니다. (이전 결제 건)</p>
              ) : (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">소프트먼트 거래번호</span>
                  <span className="font-mono text-sm text-gray-900">{deal.pgTransactionId}</span>
                </div>
                {deal.pgTrackId && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">가맹점 주문번호</span>
                    <span className="font-mono text-sm text-gray-900">{deal.pgTrackId}</span>
                  </div>
                )}
                {deal.pgAuthCd && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">승인번호</span>
                    <span className="font-mono text-sm text-gray-900">{deal.pgAuthCd}</span>
                  </div>
                )}
                {deal.pgTransactionDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">거래일시</span>
                    <span className="text-sm text-gray-900">{deal.pgTransactionDate}</span>
                  </div>
                )}
                {deal.pgGoodsName && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">상품명</span>
                    <span className="text-sm text-gray-900">{deal.pgGoodsName}</span>
                  </div>
                )}
                <div className="border-t border-gray-100 pt-3 mt-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">카드 정보</p>
                  <div className="space-y-2">
                    {deal.pgCardNo && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">카드번호</span>
                        <span className="font-mono text-sm text-gray-900">{deal.pgCardNo}</span>
                      </div>
                    )}
                    {deal.pgCardIssuer && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">발급사</span>
                        <span className="text-sm text-gray-900">{deal.pgCardIssuer}{deal.pgCardIssuerCode ? ` (${deal.pgCardIssuerCode})` : ''}</span>
                      </div>
                    )}
                    {deal.pgCardAcquirer && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">매입사</span>
                        <span className="text-sm text-gray-900">{deal.pgCardAcquirer}{deal.pgCardAcquirerCode ? ` (${deal.pgCardAcquirerCode})` : ''}</span>
                      </div>
                    )}
                    {deal.pgCardType && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">카드타입</span>
                        <span className="text-sm text-gray-900">{deal.pgCardType}</span>
                      </div>
                    )}
                    {deal.pgInstallment && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">할부</span>
                        <span className="text-sm text-gray-900">{deal.pgInstallment === '00' ? '일시불' : `${deal.pgInstallment}개월`}</span>
                      </div>
                    )}
                    {deal.pgPayMethodTypeCode && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">결제수단 코드</span>
                        <span className="font-mono text-sm text-gray-900">{deal.pgPayMethodTypeCode}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              )}
            </div>
          )}

          {/* 수취인 정보 */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">수취인 정보</h2>
              {canEdit && (
                <button
                  onClick={() => setEditModalType('recipient')}
                  className="flex items-center gap-1 text-sm text-primary-400 hover:text-primary-500 font-medium"
                >
                  <Edit3 className="w-4 h-4" />
                  수정
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">은행</p>
                <p className="font-medium text-gray-900">{deal.recipient?.bank || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">예금주</p>
                <p className="font-medium text-gray-900">{deal.recipient?.accountHolder || '-'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500">계좌번호</p>
                <p className="font-medium text-gray-900 font-mono">{deal.recipient?.accountNumber || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">발송인</p>
                <p className="font-medium text-gray-900">{deal.senderName || dealUser?.name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">계좌 인증</p>
                <p className={cn(
                  'font-medium',
                  deal.recipient?.isVerified ? 'text-green-600' : 'text-red-500'
                )}>
                  {deal.recipient?.isVerified ? '인증' : '미인증'}
                </p>
              </div>
            </div>
          </div>

          {/* 첨부 서류 */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">첨부 서류</h2>
              {canEdit && (
                <button
                  onClick={() => setEditModalType('attachments')}
                  className="flex items-center gap-1 text-sm text-primary-400 hover:text-primary-500 font-medium"
                >
                  <Edit3 className="w-4 h-4" />
                  수정
                </button>
              )}
            </div>
            {deal.attachments && deal.attachments.length > 0 ? (
              <div className="space-y-2">
                {deal.attachments.map((fileKey, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">첨부파일 {index + 1}</span>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          const adminToken = localStorage.getItem('plic_admin_token');
                          const res = await fetch('/api/uploads/download-url', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${adminToken}`,
                            },
                            body: JSON.stringify({ fileKey }),
                          });
                          const result = await res.json();
                          if (result.success) {
                            window.open(result.data.downloadUrl, '_blank');
                          } else {
                            alert(result.error || '파일을 다운로드할 수 없습니다.');
                          }
                        } catch {
                          alert('파일 다운로드 중 오류가 발생했습니다.');
                        }
                      }}
                      className="text-primary-400 hover:text-primary-500"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">첨부된 서류가 없습니다.</p>
            )}
          </div>
        </div>

        {/* 오른쪽: 상태 관리 및 히스토리 */}
        <div className="space-y-6">
          {/* 상태 관리 */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">상태 관리</h2>
            <div className="space-y-2">
              {deal.status !== 'completed' && deal.status !== 'cancelled' && (
                <>
                  <button
                    onClick={() => handleStatusChange('approved')}
                    disabled={isProcessing || !deal.isPaid || deal.status === 'approved'}
                    className="w-full flex items-center justify-center gap-2 h-10 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Check className="w-4 h-4" />
                    검수 완료
                  </button>
                  <button
                    onClick={() => handleStatusChange('completed')}
                    disabled={isProcessing || !deal.isPaid}
                    className="w-full flex items-center justify-center gap-2 h-10 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="w-4 h-4" />
                    거래 완료 처리
                  </button>
                  {deal.status === 'hold' ? (
                    <button
                      onClick={() => handleStatusChange(deal.isPaid ? 'pending' : 'awaiting_payment')}
                      disabled={isProcessing}
                      className="w-full flex items-center justify-center gap-2 h-10 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Play className="w-4 h-4" />
                      진행 재개
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStatusChange('hold')}
                      disabled={isProcessing}
                      className="w-full flex items-center justify-center gap-2 h-10 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Pause className="w-4 h-4" />
                      보류 처리
                    </button>
                  )}
                  <button
                    onClick={() => handleStatusChange('need_revision')}
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center gap-2 h-10 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className="w-4 h-4" />
                    보완 요청
                  </button>
                  <button
                    onClick={() => handleStatusChange('cancelled')}
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center gap-2 h-10 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    거래 취소
                  </button>
                </>
              )}
              {deal.status === 'completed' && (
                <div className="space-y-2">
                  <p className="text-center text-gray-500 py-2">완료된 거래입니다.</p>
                  {deal.isPaid && (
                    <button
                      onClick={() => handleStatusChange('cancelled')}
                      disabled={isProcessing}
                      className="w-full flex items-center justify-center gap-2 h-10 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      결제 취소
                    </button>
                  )}
                </div>
              )}
              {deal.status === 'cancelled' && (
                <p className="text-center text-gray-500 py-4">취소된 거래입니다.</p>
              )}
            </div>
          </div>

          {/* 결제/송금 상태 */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">처리 현황</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">결제 상태</span>
                <span className={cn(
                  'px-2 py-1 text-xs font-medium rounded',
                  deal.isPaid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                )}>
                  {deal.isPaid ? '결제완료' : '결제대기'}
                </span>
              </div>
              {deal.isPaid && deal.paidAt && (
                <div className="text-xs text-gray-500">
                  결제일시: {new Date(deal.paidAt).toLocaleString('ko-KR')}
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-gray-500">송금 상태</span>
                <span className={cn(
                  'px-2 py-1 text-xs font-medium rounded',
                  deal.isTransferred ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                )}>
                  {deal.isTransferred ? '송금완료' : '송금대기'}
                </span>
              </div>
              {deal.isTransferred && deal.transferredAt && (
                <div className="text-xs text-gray-500">
                  송금일시: {new Date(deal.transferredAt).toLocaleString('ko-KR')}
                </div>
              )}
            </div>
          </div>

          {/* 상태 변경 이력 */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">처리 이력</h2>
            {/* statusHistory (상태 변경 추적) */}
            {deal.statusHistory && deal.statusHistory.length > 0 ? (
              <div className="space-y-3">
                {deal.statusHistory.map((item: { prevStatus: string; newStatus: string; changedAt: string; changedBy: string; reason?: string; revisionMemo?: string }, index: number) => {
                  const statusLabel = (s: string) => {
                    const labels: Record<string, string> = { draft: '작성중', awaiting_payment: '결제대기', pending: '진행중', reviewing: '검토중', hold: '보류', need_revision: '보완필요', approved: '검수완료', cancelled: '거래취소', completed: '거래완료' };
                    return labels[s] || s;
                  };
                  const byLabel = item.changedBy === 'admin' ? '운영팀' : item.changedBy === 'user' ? '사용자' : '시스템';
                  return (
                    <div key={index} className="flex gap-3 items-start">
                      <div className="w-2 h-2 mt-2 rounded-full bg-primary-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500">{statusLabel(item.prevStatus)}</span>
                          <span className="text-gray-400 text-xs">→</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">{statusLabel(item.newStatus)}</span>
                          <span className="text-xs text-gray-400">({byLabel})</span>
                        </div>
                        {item.reason && <p className="text-xs text-gray-500 mt-1">{item.reason}</p>}
                        {item.revisionMemo && <p className="text-xs text-gray-500 mt-0.5">메모: {item.revisionMemo}</p>}
                        <p className="text-xs text-gray-400 mt-1">{new Date(item.changedAt).toLocaleString('ko-KR')}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">처리 이력이 없습니다.</p>
            )}

            {/* 기존 history (보완 제출 등) */}
            {deal.history && deal.history.length > 0 && (
              <>
                <hr className="my-4 border-gray-100" />
                <h3 className="text-sm font-medium text-gray-500 mb-3">사용자 활동</h3>
                <div className="space-y-3">
                  {deal.history.map((item, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="w-2 h-2 mt-2 rounded-full bg-gray-300 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">{item.action}</p>
                        <p className="text-xs text-gray-500">{item.description}</p>
                        <p className="text-xs text-gray-400 mt-1">{new Date(item.timestamp).toLocaleString('ko-KR')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 보완 요청 유형 선택 모달 */}
      {showRevisionModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-6">보완 요청 유형 선택</h3>
            <p className="text-gray-500 mb-6">고객에게 어떤 항목의 보완을 요청하시겠습니까?</p>

            <div className="space-y-3">
              {/* 서류 보완 버튼 */}
              <button
                onClick={() => handleRevisionTypeSelect('documents')}
                disabled={isProcessing}
                className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
              >
                <div className="flex items-start gap-3">
                  <File className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">서류 보완</p>
                    <p className="text-sm text-gray-500 mt-1">
                      고객이 제출한 서류를 다시 확인하고 수정하도록 요청합니다.
                    </p>
                  </div>
                </div>
              </button>

              {/* 수취인 정보 보완 버튼 */}
              <button
                onClick={() => handleRevisionTypeSelect('recipient')}
                disabled={isProcessing}
                className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
              >
                <div className="flex items-start gap-3">
                  <Users className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">수취인 정보 보완</p>
                    <p className="text-sm text-gray-500 mt-1">
                      수취인 은행, 계좌번호, 예금주 정보를 다시 입력하도록 요청합니다.
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {/* 취소 버튼 */}
            <button
              onClick={() => {
                setShowRevisionModal(false);
                setSelectedRevisionType(null);
              }}
              disabled={isProcessing}
              className="w-full mt-4 h-11 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* 보완 요청 확인 모달 - 메모 입력 */}
      {showRevisionConfirmModal && selectedRevisionType && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {selectedRevisionType === 'documents' ? '서류 보완' : '수취인 정보 보완'} 요청
            </h3>
            <p className="text-gray-600 mb-6">
              {selectedRevisionType === 'documents'
                ? '고객에게 서류 보완을 요청합니다.'
                : '고객에게 수취인 정보 보완을 요청합니다.'}
            </p>

            {/* 메모 입력 필드 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">메모</label>
              <textarea
                value={revisionMemo}
                onChange={(e) => setRevisionMemo(e.target.value)}
                placeholder="고객에게 전달할 메모를 입력하세요 (선택사항)"
                className="w-full h-20 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/20 resize-none"
              />
            </div>

            {/* 버튼 */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowRevisionConfirmModal(false);
                  setSelectedRevisionType(null);
                  setRevisionMemo('');
                }}
                disabled={isProcessing}
                className="flex-1 h-11 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleRevisionConfirm}
                disabled={isProcessing}
                className="flex-1 h-11 bg-primary-400 text-white font-medium rounded-xl hover:bg-primary-500 transition-colors disabled:opacity-50"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 수정 모달 */}
      {editModalType && (
        <AdminEditDealModal
          isOpen={!!editModalType}
          onClose={() => setEditModalType(null)}
          deal={deal}
          onUpdate={fetchDeal}
          editType={editModalType}
        />
      )}
    </div>
  );
}
