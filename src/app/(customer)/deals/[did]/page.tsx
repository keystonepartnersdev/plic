'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, FileText, Clock, Check, AlertCircle, X, CreditCard, Download, Ticket, Tag, Trash2, Plus, Eye } from 'lucide-react';
import { Header } from '@/components/common';
import { useUserStore, useDealStore, useDiscountStore } from '@/stores';
import { DealHelper } from '@/classes';
import { IDeal, IDiscount } from '@/types';
import { cn } from '@/lib/utils';

export default function DealDetailPage() {
  const router = useRouter();
  const params = useParams();
  const did = params.did as string;

  const { currentUser, isLoggedIn } = useUserStore();
  const { deals, updateDeal } = useDealStore();

  const [mounted, setMounted] = useState(false);
  const [deal, setDeal] = useState<IDeal | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<{ url: string; name: string; index: number; isNew?: boolean } | null>(null);

  // 할인 스토어에서 데이터 가져오기
  const { getDiscountByCode, getActiveCodes, getActiveCoupons, markAsUsed } = useDiscountStore();

  // 할인코드 & 쿠폰 상태
  const [discountCodeInput, setDiscountCodeInput] = useState('');
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [appliedDiscounts, setAppliedDiscounts] = useState<IDiscount[]>([]);

  // 보완 요청 관련 상태
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionAttachments, setRevisionAttachments] = useState<File[]>([]);
  const [revisionRecipient, setRevisionRecipient] = useState<{ bank: string; accountNumber: string; accountHolder: string; senderName: string; isVerified?: boolean }>({
    bank: '',
    accountNumber: '',
    accountHolder: '',
    senderName: '',
  });
  const [showRevisionConfirmModal, setShowRevisionConfirmModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);
  const [revisionType, setRevisionType] = useState<'documents' | 'recipient' | null>(null);
  const [revisionVerificationFailed, setRevisionVerificationFailed] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // 스토어에서 활성 할인코드/쿠폰 가져오기
  const availableDiscountCodes = getActiveCodes();
  const availableCoupons = getActiveCoupons();

  // 전체 할인 금액 계산 (퍼센트 합산 → 금액 순차 적용)
  const calculateTotalDiscount = (): { total: number; details: Map<string, number> } => {
    if (!deal) return { total: 0, details: new Map() };

    const details = new Map<string, number>();
    let remainingFee = deal.feeAmount;

    // 1. 퍼센트 할인 합산
    const percentDiscounts = appliedDiscounts.filter(d => d.discountType === 'feePercent');
    const totalPercent = percentDiscounts.reduce((sum, d) => sum + d.discountValue, 0);
    const percentDiscount = Math.min(
      Math.floor(deal.feeAmount * (totalPercent / 100)),
      remainingFee
    );

    if (percentDiscount > 0) {
      remainingFee -= percentDiscount;
      percentDiscounts.forEach(d => {
        const individualDiscount = Math.floor(deal.feeAmount * (d.discountValue / 100));
        details.set(d.id, Math.min(individualDiscount, deal.feeAmount));
      });
    }

    // 2. 금액 할인 순차 적용
    const amountDiscounts = appliedDiscounts.filter(d => d.discountType === 'amount');
    amountDiscounts.forEach(d => {
      const discount = Math.min(d.discountValue, remainingFee);
      if (discount > 0) {
        details.set(d.id, discount);
        remainingFee -= discount;
      } else {
        details.set(d.id, 0);
      }
    });

    const totalDiscount = deal.feeAmount - remainingFee;
    return { total: totalDiscount, details };
  };

  const { total: totalDiscountAmount, details: discountDetails } = calculateTotalDiscount();
  const calculatedFinalAmount = deal ? deal.totalAmount - totalDiscountAmount : 0;

  // 개별 할인 금액 조회
  const getDiscountAmount = (discountId: string): number => {
    return discountDetails.get(discountId) || 0;
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoggedIn) {
      router.replace('/auth/login');
      return;
    }

    const foundDeal = deals.find((d) => d.did === did);
    if (mounted && !foundDeal) {
      router.replace('/deals');
      return;
    }

    setDeal(foundDeal || null);

    // 저장된 할인 코드가 있으면 복원
    if (foundDeal && foundDeal.discountCode) {
      const discountCodes = foundDeal.discountCode.split(', ').filter(code => code.trim());
      const restoredDiscounts: IDiscount[] = [];

      discountCodes.forEach(code => {
        const discountData = getDiscountByCode(code) || availableCoupons.find(c => c.name === code);
        if (discountData) {
          restoredDiscounts.push(discountData);
        }
      });

      if (restoredDiscounts.length > 0) {
        setAppliedDiscounts(restoredDiscounts);
      }
    }
  }, [mounted, isLoggedIn, deals, did, router]);

  if (!mounted || !isLoggedIn || !deal) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400" />
      </div>
    );
  }

  const statusConfig = DealHelper.getStatusConfig(deal.status);
  const typeConfig = DealHelper.getDealTypeConfig(deal.dealType);

  const statusColors: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    orange: 'bg-orange-100 text-orange-700',
    red: 'bg-red-100 text-red-700',
    gray: 'bg-gray-100 text-gray-700',
    green: 'bg-green-100 text-green-700',
  };

  const StatusIcon = () => {
    switch (deal.status) {
      case 'pending':
      case 'reviewing':
      case 'hold':
        return <Clock className="w-6 h-6" />;
      case 'completed':
        return <Check className="w-6 h-6" />;
      case 'need_revision':
        return <AlertCircle className="w-6 h-6" />;
      case 'cancelled':
        return <X className="w-6 h-6" />;
      default:
        return <FileText className="w-6 h-6" />;
    }
  };

  const handleCancel = () => {
    if (confirm('정말 거래를 취소하시겠습니까?')) {
      updateDeal(deal.did, {
        status: 'cancelled',
        history: [
          {
            timestamp: new Date().toISOString(),
            action: '거래 취소',
            description: '사용자가 거래를 취소했습니다.',
            actor: 'user',
            actorId: currentUser?.uid,
          },
          ...deal.history,
        ],
      });
    }
  };

  // 할인 적용 가능 여부 체크
  const canApplyDiscount = (discount: IDiscount): { canApply: boolean; reason?: string } => {
    // 이미 적용된 할인인지 확인
    if (appliedDiscounts.some(d => d.id === discount.id)) {
      return { canApply: false, reason: '이미 적용된 할인입니다.' };
    }

    // 재사용 불가 & 이미 사용한 할인인지 확인
    if (!discount.isReusable && discount.isUsed) {
      return { canApply: false, reason: '이미 사용한 할인입니다. (재사용 불가)' };
    }

    // 최소 주문 금액 확인
    if (deal.amount < discount.minAmount) {
      return { canApply: false, reason: `최소 주문 금액 ${discount.minAmount.toLocaleString()}원 이상부터 사용 가능합니다.` };
    }

    // 유효기간 확인
    if (new Date(discount.expiry) < new Date()) {
      return { canApply: false, reason: '유효기간이 만료된 할인입니다.' };
    }

    // 수수료가 이미 0원인지 확인
    const { total: currentDiscount } = calculateTotalDiscount();
    const remainingFee = deal.feeAmount - currentDiscount;
    if (remainingFee === 0) {
      return { canApply: false, reason: '수수료가 이미 전액 할인되어 추가 할인을 적용할 수 없습니다.' };
    }

    // 중복 사용 불가 할인이 있는지 확인
    const hasNonStackable = appliedDiscounts.some(d => !d.canStack);
    if (hasNonStackable && !discount.canStack) {
      return { canApply: false, reason: '다른 할인과 중복 사용이 불가합니다.' };
    }
    if (hasNonStackable) {
      return { canApply: false, reason: '이미 적용된 할인이 중복 사용 불가 할인입니다.' };
    }
    if (!discount.canStack && appliedDiscounts.length > 0) {
      return { canApply: false, reason: '이 할인은 다른 할인과 중복 사용이 불가합니다.' };
    }

    return { canApply: true };
  };

  // 거래 정보 업데이트 (할인 적용 시)
  const updateDealWithDiscounts = (newAppliedDiscounts: IDiscount[]) => {
    if (!deal) return;

    // 전달된 할인들을 기반으로 할인 금액 계산
    let remainingFee = deal.feeAmount;
    let totalDiscountAmount = 0;

    // 1. 퍼센트 할인 합산
    const percentDiscounts = newAppliedDiscounts.filter(d => d.discountType === 'feePercent');
    const totalPercent = percentDiscounts.reduce((sum, d) => sum + d.discountValue, 0);
    const percentDiscount = Math.min(
      Math.floor(deal.feeAmount * (totalPercent / 100)),
      remainingFee
    );

    if (percentDiscount > 0) {
      remainingFee -= percentDiscount;
      totalDiscountAmount += percentDiscount;
    }

    // 2. 금액 할인 순차 적용
    const amountDiscounts = newAppliedDiscounts.filter(d => d.discountType === 'amount');
    amountDiscounts.forEach(d => {
      const discount = Math.min(d.discountValue, remainingFee);
      if (discount > 0) {
        totalDiscountAmount += discount;
        remainingFee -= discount;
      }
    });

    const newFinalAmount = deal.totalAmount - totalDiscountAmount;

    // 적용된 할인 코드들을 저장 (쉼표로 구분)
    const discountCodes = newAppliedDiscounts
      .filter(d => d.type === 'code')
      .map(d => d.name || d.id)
      .join(', ');

    const discountCouponNames = newAppliedDiscounts
      .filter(d => d.type === 'coupon')
      .map(d => d.name)
      .join(', ');

    // 할인 코드와 쿠폰 모두 포함해서 저장
    const allDiscountNames = [
      ...newAppliedDiscounts.filter(d => d.type === 'code').map(d => d.name || d.id),
      ...newAppliedDiscounts.filter(d => d.type === 'coupon').map(d => d.name)
    ].join(', ');

    updateDeal(deal.did, {
      discountCode: allDiscountNames || undefined,
      discountAmount: totalDiscountAmount,
      finalAmount: newFinalAmount,
    });
  };

  // 할인코드 적용
  const handleApplyDiscountCode = () => {
    if (!discountCodeInput.trim()) {
      alert('할인코드를 입력해주세요.');
      return;
    }

    // 스토어에서 코드로 검색
    const discountCode = getDiscountByCode(discountCodeInput);

    if (!discountCode) {
      alert('유효하지 않은 할인코드입니다.');
      return;
    }

    // 비활성 코드 체크
    if (!discountCode.isActive) {
      alert('현재 사용할 수 없는 할인코드입니다.');
      return;
    }

    const { canApply, reason } = canApplyDiscount(discountCode);
    if (!canApply) {
      alert(reason);
      return;
    }

    const newAppliedDiscounts = [...appliedDiscounts, discountCode];
    setAppliedDiscounts(newAppliedDiscounts);
    setDiscountCodeInput('');

    // 거래 정보 업데이트
    updateDealWithDiscounts(newAppliedDiscounts);

    alert('할인코드가 적용되었습니다.');
  };

  // 쿠폰 선택
  const handleSelectCoupon = (coupon: IDiscount) => {
    // 비활성 쿠폰 체크
    if (!coupon.isActive) {
      alert('현재 사용할 수 없는 쿠폰입니다.');
      return;
    }

    const { canApply, reason } = canApplyDiscount(coupon);
    if (!canApply) {
      alert(reason);
      return;
    }

    const newAppliedDiscounts = [...appliedDiscounts, coupon];
    setAppliedDiscounts(newAppliedDiscounts);

    // 거래 정보 업데이트
    updateDealWithDiscounts(newAppliedDiscounts);

    setShowCouponModal(false);
  };

  // 개별 할인 취소
  const handleRemoveDiscount = (discountId: string) => {
    const newAppliedDiscounts = appliedDiscounts.filter(d => d.id !== discountId);
    setAppliedDiscounts(newAppliedDiscounts);

    // 거래 정보 업데이트
    updateDealWithDiscounts(newAppliedDiscounts);
  };

  // 전체 할인 취소
  const handleRemoveAllDiscounts = () => {
    setAppliedDiscounts([]);

    // 거래 정보 업데이트
    updateDealWithDiscounts([]);
  };

  // 할인 타입 라벨
  const getDiscountLabel = (discount: IDiscount): string => {
    if (discount.discountType === 'amount') {
      return `${discount.discountValue.toLocaleString()}원 할인`;
    } else {
      return `수수료 ${discount.discountValue}% 할인`;
    }
  };

  // 보완 요청 - 서류 재첨부 (확인 모달 표시)
  const handleDocumentRevisionRequest = () => {
    if (revisionAttachments.length === 0) {
      alert('최소 1개 이상의 파일을 업로드해주세요.');
      return;
    }
    setRevisionType('documents');
    setShowRevisionConfirmModal(true);
  };

  // 보완 요청 - 서류 재첨부 (실제 저장)
  const handleDocumentRevisionConfirm = () => {
    // 기존 첨부파일과 신규 첨부파일 병합
    const newAttachments = [...deal!.attachments];
    let filesProcessed = 0;

    revisionAttachments.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          newAttachments.push(e.target.result as string);
        }
        filesProcessed++;

        // 모든 파일이 읽혀진 후에 업데이트
        if (filesProcessed === revisionAttachments.length) {
          updateDeal(deal!.did, {
            status: 'reviewing',
            revisionType: undefined,
            attachments: newAttachments,
            history: [
              {
                timestamp: new Date().toISOString(),
                action: '서류 보완',
                description: '사용자가 서류를 재첨부했습니다.',
                actor: 'user',
                actorId: currentUser?.uid,
              },
              ...deal!.history,
            ],
          });

          setShowRevisionModal(false);
          setShowRevisionConfirmModal(false);
          setRevisionAttachments([]);
          setRevisionType(null);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // 보완 요청 - 수취인 정보 수정 (확인 모달 표시)
  const handleRecipientRevisionRequest = () => {
    if (!revisionRecipient.bank || !revisionRecipient.accountNumber || !revisionRecipient.accountHolder) {
      alert('수취인 정보를 모두 입력해주세요.');
      return;
    }
    setRevisionType('recipient');
    setShowRevisionConfirmModal(true);
  };

  // 수취인 정보 보완 - 계좌 인증
  const handleRevisionVerifyAccount = async () => {
    setIsVerifying(true);
    setRevisionVerificationFailed(false);

    // 1초 대기 (API 호출 시뮬레이션)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 계좌 정보 유효성 검사 (계좌번호 길이 확인)
    if (revisionRecipient.accountNumber.length < 10) {
      setRevisionVerificationFailed(true);
      setIsVerifying(false);
      return;
    }

    setRevisionRecipient({ ...revisionRecipient, isVerified: true });
    setIsVerifying(false);
  };

  // 보완 요청 - 수취인 정보 수정 (실제 저장)
  const handleRecipientRevisionConfirm = () => {
    updateDeal(deal!.did, {
      status: 'reviewing',
      revisionType: undefined,
      recipient: {
        ...revisionRecipient,
        isVerified: revisionRecipient.isVerified || false, // 인증된 정보는 유지, 미인증은 false
      },
      senderName: revisionRecipient.senderName,
      history: [
        {
          timestamp: new Date().toISOString(),
          action: '수취인 정보 보완',
          description: '사용자가 수취인 정보를 수정했습니다.',
          actor: 'user',
          actorId: currentUser?.uid,
        },
        ...deal!.history,
      ],
    });

    setShowRevisionModal(false);
    setShowRevisionConfirmModal(false);
    setRevisionRecipient({ bank: '', accountNumber: '', accountHolder: '', senderName: '' });
    setRevisionType(null);
  };

  // 기존 첨부파일 삭제 (확인 모달 표시)
  const handleDeleteExistingAttachment = (index: number) => {
    setDeleteConfirmIndex(index);
    setShowDeleteConfirmModal(true);
  };

  // 기존 첨부파일 삭제 (실제 삭제)
  const confirmDeleteAttachment = () => {
    if (deleteConfirmIndex === null) return;

    const newAttachments = deal!.attachments.filter((_, i) => i !== deleteConfirmIndex);
    updateDeal(deal!.did, {
      attachments: newAttachments,
    });

    setShowDeleteConfirmModal(false);
    setDeleteConfirmIndex(null);
  };

  return (
    <div className="relative min-h-screen bg-gray-50 pb-24">
      <Header title="거래 상세" showBack />

      {/* 상태 카드 */}
      <div className="bg-white px-5 py-6 mb-2">
        <div className="flex items-center gap-4 mb-4">
          <div className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center',
            statusColors[statusConfig.color]
          )}>
            <StatusIcon />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {deal.isPaid && (
                <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">
                  결제완료
                </span>
              )}
              <span className={cn(
                'inline-flex px-2 py-0.5 text-xs font-medium rounded-full',
                statusColors[statusConfig.color]
              )}>
                {statusConfig.name}
              </span>
            </div>
            <p className="text-sm text-gray-500">{deal.did}</p>
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-1">{deal.dealName}</h2>
        <p className="text-gray-500">{typeConfig.name}</p>

        {/* 결제 버튼 */}
        {deal.status === 'awaiting_payment' && !deal.isPaid && (
          <Link
            href={`/payment/${deal.did}`}
            className="
              mt-4 w-full h-14
              bg-primary-400 hover:bg-primary-500
              text-white font-semibold
              rounded-xl
              flex items-center justify-center gap-2
            "
          >
            <CreditCard className="w-5 h-5" />
            결제하기
          </Link>
        )}

        {/* 할인코드 & 쿠폰 섹션 - 결제대기 상태에서만 표시 */}
        {deal.status === 'awaiting_payment' && !deal.isPaid && (
          <div className="mt-4 space-y-3">
            {/* 적용된 할인 목록 */}
            {appliedDiscounts.length > 0 && (
              <div className="space-y-2">
                {appliedDiscounts.map((discount) => (
                  <div
                    key={discount.id}
                    className="p-3 bg-primary-50 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {discount.type === 'code' ? (
                        <Tag className="w-4 h-4 text-primary-500 flex-shrink-0" />
                      ) : (
                        <Ticket className="w-4 h-4 text-primary-500 flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm text-primary-700 font-medium truncate">
                          {discount.name}
                        </p>
                        <p className="text-xs text-primary-500">
                          {discount.type === 'code' && discount.code && `코드: ${discount.code} · `}
                          {getDiscountLabel(discount)} · ~{discount.expiry}
                          {!discount.canStack && ' · 단독 사용'}
                          {!discount.isReusable && ' · 1회용'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-semibold text-primary-500">
                        -{getDiscountAmount(discount.id).toLocaleString()}원
                      </span>
                      <button
                        onClick={() => handleRemoveDiscount(discount.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 할인코드 입력 */}
            <div className="flex gap-2">
              <input
                type="text"
                value={discountCodeInput}
                onChange={(e) => setDiscountCodeInput(e.target.value.toUpperCase())}
                placeholder="할인코드 입력"
                className="
                  flex-1 h-12 px-4
                  border border-gray-200 rounded-xl
                  focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400
                  text-sm
                "
              />
              <button
                onClick={handleApplyDiscountCode}
                className="h-12 px-4 bg-gray-900 text-white text-sm font-medium rounded-xl whitespace-nowrap"
              >
                적용
              </button>
            </div>

            {/* 쿠폰 적용하기 버튼 */}
            <button
              onClick={() => setShowCouponModal(true)}
              className="w-full h-12 border border-primary-400 text-primary-400 font-medium rounded-xl flex items-center justify-center gap-2 hover:bg-primary-50 transition-colors"
            >
              <Ticket className="w-5 h-5" />
              쿠폰 적용하기
              {availableCoupons.length > 0 && (
                <span className="bg-primary-400 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {availableCoupons.length}
                </span>
              )}
            </button>
          </div>
        )}

        {/* 보완 필요 안내 */}
        {deal.status === 'need_revision' && deal.revisionType === 'documents' && (
          <div className="mt-4 p-4 bg-red-50 rounded-xl">
            <p className="text-red-700 font-medium mb-2">서류 보완이 필요합니다</p>
            <p className="text-sm text-red-600 mb-3">
              제출하신 서류에 문제가 있습니다. 서류를 다시 확인하고 수정해주세요.
            </p>
            {deal.revisionMemo && (
              <div className="mb-3 p-3 bg-white rounded-lg border border-red-100">
                <p className="text-xs text-gray-600 font-medium mb-1">운영팀 메모</p>
                <p className="text-sm text-gray-900">{deal.revisionMemo}</p>
              </div>
            )}
            <button
              onClick={() => {
                setShowRevisionModal(true);
                setRevisionRecipient({ bank: '', accountNumber: '', accountHolder: '', senderName: '' });
              }}
              className="w-full h-12 bg-red-100 text-red-700 font-medium rounded-xl hover:bg-red-200 transition-colors"
            >
              서류 재첨부
            </button>
          </div>
        )}

        {/* 수취인 정보 보완 필요 안내 */}
        {deal.status === 'need_revision' && deal.revisionType === 'recipient' && (
          <div className="mt-4 p-4 bg-red-50 rounded-xl">
            <p className="text-red-700 font-medium mb-2">수취인 정보 보완이 필요합니다</p>
            <p className="text-sm text-red-600 mb-3">
              수취인 정보에 오류가 있습니다. 정보를 확인하고 수정해주세요.
            </p>
            {deal.revisionMemo && (
              <div className="mb-3 p-3 bg-white rounded-lg border border-red-100">
                <p className="text-xs text-gray-600 font-medium mb-1">운영팀 메모</p>
                <p className="text-sm text-gray-900">{deal.revisionMemo}</p>
              </div>
            )}
            <button
              onClick={() => {
                setShowRevisionModal(true);
                setRevisionRecipient({
                  bank: deal.recipient.bank,
                  accountNumber: deal.recipient.accountNumber,
                  accountHolder: deal.recipient.accountHolder,
                  senderName: deal.senderName || '',
                });
              }}
              className="w-full h-12 bg-red-100 text-red-700 font-medium rounded-xl hover:bg-red-200 transition-colors"
            >
              수취인 정보 수정
            </button>
          </div>
        )}
      </div>

      {/* 금액 정보 */}
      <div className="bg-white px-5 py-4 mb-2">
        <h3 className="font-semibold text-gray-900 mb-3">결제 정보</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-500">송금 금액</span>
            <span className="font-medium">{deal.amount.toLocaleString()}원</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">수수료 ({deal.feeRate}%)</span>
            <span className="font-medium">{deal.feeAmount.toLocaleString()}원</span>
          </div>

          {/* 적용된 할인 상세 표시 */}
          {appliedDiscounts.length > 0 && (
            <div className="pt-2 border-t border-gray-100 mt-2 space-y-1.5">
              {appliedDiscounts.map((discount) => (
                <div key={discount.id} className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    {discount.type === 'code' ? (
                      <Tag className="w-3.5 h-3.5 text-primary-400" />
                    ) : (
                      <Ticket className="w-3.5 h-3.5 text-primary-400" />
                    )}
                    <span className="text-sm text-primary-600">
                      {discount.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      ({getDiscountLabel(discount)})
                    </span>
                  </div>
                  <span className="text-sm font-medium text-primary-400">
                    -{getDiscountAmount(discount.id).toLocaleString()}원
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between pt-2 border-t border-gray-100 mt-2">
            <span className="font-semibold">총 결제금액</span>
            <div className="text-right">
              {appliedDiscounts.length > 0 && (
                <span className="text-sm text-gray-400 line-through mr-2">
                  {deal.totalAmount.toLocaleString()}원
                </span>
              )}
              <span className="font-bold text-primary-400">
                {(appliedDiscounts.length > 0 ? calculatedFinalAmount : deal.finalAmount).toLocaleString()}원
              </span>
            </div>
          </div>
        </div>

        {deal.isPaid && (
          <div className="mt-3 flex items-center gap-2 text-green-600">
            <Check className="w-4 h-4" />
            <span className="text-sm">결제 완료</span>
          </div>
        )}
      </div>

      {/* 수취인 정보 */}
      <div className="bg-white px-5 py-4 mb-2">
        <h3 className="font-semibold text-gray-900 mb-3">수취인 정보</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-500">은행</span>
            <span className="font-medium">{deal.recipient.bank}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">계좌번호</span>
            <span className="font-medium">{deal.recipient.accountNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">예금주</span>
            <span className="font-medium">{deal.recipient.accountHolder}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">보내는 분</span>
            <span className="font-medium">{deal.senderName || currentUser?.name || '-'}</span>
          </div>
        </div>

        {deal.isTransferred && (
          <div className="mt-3 flex items-center gap-2 text-green-600">
            <Check className="w-4 h-4" />
            <span className="text-sm">
              송금 완료 ({new Date(deal.transferredAt!).toLocaleDateString('ko-KR')})
            </span>
          </div>
        )}
      </div>

      {/* 첨부 서류 */}
      <div className="bg-white px-5 py-4 mb-2">
        <h3 className="font-semibold text-gray-900 mb-3">첨부 서류</h3>
        <div className="space-y-2">
          {deal.attachments.map((attachment, index) => {
            const isImage = attachment.startsWith('data:image/') || attachment.startsWith('blob:');
            const fileName = `첨부파일 ${index + 1}`;

            return (
              <button
                key={index}
                onClick={() => setPreviewAttachment({ url: attachment, name: fileName, index })}
                className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isImage ? (
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200">
                      <img src={attachment} alt={fileName} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <FileText className="w-5 h-5 text-gray-400" />
                  )}
                  <span className="text-sm text-gray-600">{fileName}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300" />
              </button>
            );
          })}
        </div>
      </div>

      {/* 첨부파일 미리보기 팝업 */}
      {mounted && previewAttachment && createPortal(
        <div
          className="absolute inset-0 bg-black/70 flex items-center justify-center z-[100] p-4"
          onClick={() => setPreviewAttachment(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 팝업 헤더 */}
            <div className="sticky top-0 flex items-center justify-between p-4 border-b border-gray-200 bg-white rounded-t-2xl">
              <h3 className="font-semibold text-gray-900 truncate text-sm">
                {previewAttachment.name}
              </h3>
              <button
                onClick={() => setPreviewAttachment(null)}
                className="flex-shrink-0 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* 팝업 컨텐츠 */}
            <div className="p-4">
              {previewAttachment.url.startsWith('data:image/') || previewAttachment.url.startsWith('blob:') ? (
                // 이미지 미리보기
                <img
                  src={previewAttachment.url}
                  alt={previewAttachment.name}
                  className="w-full rounded-lg"
                />
              ) : previewAttachment.url.startsWith('data:application/pdf') ? (
                // PDF 파일
                <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg">
                  <FileText className="w-16 h-16 text-blue-500 mb-4" />
                  <p className="text-gray-900 font-semibold mb-2">PDF 파일</p>
                  <p className="text-gray-500 text-sm mb-6 text-center">
                    {previewAttachment.name}
                  </p>
                  <a
                    href={previewAttachment.url}
                    download={previewAttachment.name}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-400 hover:bg-primary-500 text-white rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    다운로드
                  </a>
                </div>
              ) : (
                // 기타 파일
                <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg">
                  <FileText className="w-16 h-16 text-gray-400 mb-4" />
                  <p className="text-gray-900 font-semibold mb-2">첨부파일</p>
                  <p className="text-gray-500 text-sm mb-6 text-center">
                    {previewAttachment.name}
                  </p>
                  <a
                    href={previewAttachment.url}
                    download={previewAttachment.name}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-400 hover:bg-primary-500 text-white rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    다운로드
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.getElementById('mobile-frame')!
      )}

      {/* 쿠폰 선택 팝업 */}
      {mounted && showCouponModal && createPortal(
        <div
          className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCouponModal(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 팝업 헤더 - 고정 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
              <h3 className="font-semibold text-gray-900">쿠폰 선택</h3>
              <button
                onClick={() => setShowCouponModal(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* 쿠폰 목록 - 스크롤 영역 */}
            <div className="p-4 space-y-3 overflow-y-auto flex-1">
              {availableCoupons.length > 0 ? (
                availableCoupons.map((coupon) => {
                  const { canApply, reason } = canApplyDiscount(coupon);
                  const isAlreadyApplied = appliedDiscounts.some(d => d.id === coupon.id);
                  const isExpired = new Date(coupon.expiry) < new Date();

                  return (
                    <button
                      key={coupon.id}
                      onClick={() => canApply && handleSelectCoupon(coupon)}
                      disabled={!canApply}
                      className={cn(
                        'w-full p-4 rounded-xl border-2 text-left transition-colors',
                        isAlreadyApplied
                          ? 'border-green-300 bg-green-50'
                          : canApply
                            ? 'border-gray-200 hover:border-primary-400 hover:bg-primary-50'
                            : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                      )}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Ticket className={cn(
                            'w-5 h-5',
                            isAlreadyApplied ? 'text-green-500' : canApply ? 'text-primary-400' : 'text-gray-400'
                          )} />
                          <span className="font-semibold text-gray-900">{coupon.name}</span>
                        </div>
                        <span className={cn(
                          'text-lg font-bold',
                          isAlreadyApplied ? 'text-green-500' : canApply ? 'text-primary-400' : 'text-gray-400'
                        )}>
                          {coupon.discountType === 'amount'
                            ? `-${coupon.discountValue.toLocaleString()}원`
                            : `수수료 ${coupon.discountValue}% 할인`
                          }
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 space-y-0.5">
                        <p>{coupon.minAmount.toLocaleString()}원 이상 주문 시 사용 가능</p>
                        <p>유효기간: {coupon.expiry}까지</p>
                        <p>
                          {coupon.canStack ? '다른 할인과 중복 사용 가능' : '단독 사용만 가능'}
                          {' · '}
                          {coupon.isReusable ? '재사용 가능' : '1회 사용'}
                        </p>
                      </div>
                      {isAlreadyApplied && (
                        <p className="mt-2 text-xs text-green-600 font-medium flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          적용됨
                        </p>
                      )}
                      {!coupon.isReusable && coupon.isUsed && !isAlreadyApplied && (
                        <p className="mt-2 text-xs text-gray-500 font-medium">
                          사용 완료
                        </p>
                      )}
                      {!canApply && !isAlreadyApplied && !((!coupon.isReusable && coupon.isUsed)) && reason && (
                        <p className="mt-2 text-xs text-red-500">
                          {reason}
                        </p>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <Ticket className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500">사용 가능한 쿠폰이 없습니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.getElementById('mobile-frame')!
      )}

      {/* 거래 이력 */}
      <div className="bg-white px-5 py-4">
        <h3 className="font-semibold text-gray-900 mb-3">거래 이력</h3>
        <div className="space-y-4">
          {deal.history.map((item, index) => (
            <div key={index} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  index === 0 ? 'bg-primary-400' : 'bg-gray-300'
                )} />
                {index < deal.history.length - 1 && (
                  <div className="w-0.5 flex-1 bg-gray-200 my-1" />
                )}
              </div>
              <div className="flex-1 pb-4">
                <p className="font-medium text-gray-900">{item.action}</p>
                <p className="text-sm text-gray-500">{item.description}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(item.timestamp).toLocaleString('ko-KR')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 거래 취소 버튼 */}
      {['awaiting_payment', 'pending', 'reviewing', 'hold', 'need_revision'].includes(deal.status) && !deal.isPaid && (
        <div className="px-5 mt-4">
          <button
            onClick={handleCancel}
            className="w-full h-12 text-gray-500 hover:text-gray-700 font-medium"
          >
            거래 취소
          </button>
        </div>
      )}

      {/* 보완 요청 모달 - 서류 재첨부 */}
      {mounted && showRevisionModal && deal.revisionType === 'documents' && createPortal(
        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 mx-4 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">서류 재첨부</h3>
              <button onClick={() => setShowRevisionModal(false)}>
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            {/* 기존 첨부 파일 미리보기 */}
            {deal.attachments.length > 0 && (
              <div className="mb-8">
                <p className="text-sm font-medium text-gray-900 mb-4">기존 첨부 파일</p>
                <div className="space-y-4">
                  {deal.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center gap-4 p-5 bg-gray-50 rounded-lg">
                      <FileText className="w-8 h-8 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-600 flex-1 truncate">파일 {index + 1}</span>
                      <button
                        onClick={() => setPreviewAttachment({ url: attachment, name: `파일 ${index + 1}`, index })}
                        className="p-3 text-primary-400 hover:text-primary-500 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <Eye className="w-7 h-7" />
                      </button>
                      <button
                        onClick={() => handleDeleteExistingAttachment(index)}
                        className="p-3 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-7 h-7" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 신규 파일 업로드 */}
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-900 mb-2">추가 업로드</p>
              <label className="block w-full h-24 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors">
                <Plus className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                <span className="text-sm text-gray-600">파일을 클릭하거나 드래그하세요</span>
                <input
                  type="file"
                  multiple
                  onChange={(e) => {
                    if (e.target.files) {
                      const maxFileSize = 50 * 1024 * 1024; // 50MB
                      const maxFiles = 10;
                      const newFiles = Array.from(e.target.files);

                      // 개수 검증
                      if (deal.attachments.length + revisionAttachments.length + newFiles.length > maxFiles) {
                        alert(`최대 ${maxFiles}개까지만 첨부할 수 있습니다. (현재: 기존 ${deal.attachments.length}개 + 추가 예정 ${revisionAttachments.length}개)`);
                        return;
                      }

                      // 크기 검증
                      const oversizedFiles = newFiles.filter(file => file.size > maxFileSize);
                      if (oversizedFiles.length > 0) {
                        alert(`파일 크기가 50MB를 초과합니다: ${oversizedFiles.map(f => f.name).join(', ')}`);
                        return;
                      }

                      setRevisionAttachments([...revisionAttachments, ...newFiles]);
                    }
                  }}
                  className="hidden"
                />
              </label>
              <span className="text-xs text-gray-400 mt-1 block">최대 10개, 개별 파일 50MB 이하</span>
              {revisionAttachments.length > 0 && (
                <div className="mb-8">
                  <p className="text-sm font-medium text-gray-900 mb-4">추가 파일</p>
                  <div className="space-y-4">
                    {revisionAttachments.map((file, index) => (
                      <div key={index} className="flex items-center gap-4 p-5 bg-green-50 rounded-lg">
                        <FileText className="w-8 h-8 text-green-600 flex-shrink-0" />
                        <span className="text-sm text-gray-600 flex-1 truncate">{file.name}</span>
                        <button
                          onClick={() => {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                              setPreviewAttachment({
                                url: e.target?.result as string,
                                name: file.name,
                                index,
                                isNew: true
                              });
                            };
                            reader.readAsDataURL(file);
                          }}
                          className="p-3 text-primary-400 hover:text-primary-500 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          <Eye className="w-7 h-7" />
                        </button>
                        <button
                          onClick={() => setRevisionAttachments(revisionAttachments.filter((_, i) => i !== index))}
                          className="p-3 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-7 h-7" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 액션 버튼 */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowRevisionModal(false)}
                className="flex-1 h-12 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDocumentRevisionRequest}
                className="flex-1 h-12 bg-primary-400 text-white font-medium rounded-xl hover:bg-primary-500 transition-colors"
              >
                재첨부
              </button>
            </div>
          </div>
        </div>,
        document.getElementById('mobile-frame')!
      )}

      {/* 보완 요청 모달 - 수취인 정보 수정 */}
      {mounted && showRevisionModal && deal.revisionType === 'recipient' && createPortal(
        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 mx-4 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">수취인 정보 수정</h3>
              <button onClick={() => setShowRevisionModal(false)}>
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="space-y-3 mb-4">
              {/* 은행 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">은행</label>
                <select
                  value={revisionRecipient.bank}
                  onChange={(e) => setRevisionRecipient({ ...revisionRecipient, bank: e.target.value })}
                  className="w-full h-11 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/20"
                >
                  <option value="">은행을 선택하세요</option>
                  {['국민은행', '신한은행', '우리은행', '하나은행', '농협은행', 'KB국민은행', 'NH농협', 'IBK기업은행', '카카오뱅크', '토스뱅크', '케이뱅크'].map(bank => (
                    <option key={bank} value={bank}>{bank}</option>
                  ))}
                </select>
              </div>

              {/* 예금주 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">예금주</label>
                <input
                  type="text"
                  value={revisionRecipient.accountHolder}
                  onChange={(e) => setRevisionRecipient({ ...revisionRecipient, accountHolder: e.target.value })}
                  placeholder="예금주명 입력"
                  className="w-full h-11 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/20"
                />
              </div>

              {/* 계좌번호 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">계좌번호</label>
                <input
                  type="text"
                  value={revisionRecipient.accountNumber}
                  onChange={(e) => setRevisionRecipient({ ...revisionRecipient, accountNumber: e.target.value.replace(/\D/g, '') })}
                  placeholder="계좌번호 입력"
                  className="w-full h-11 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/20"
                />
              </div>

              {/* 보내는 분 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">보내는 분</label>
                <input
                  type="text"
                  value={revisionRecipient.senderName}
                  onChange={(e) => setRevisionRecipient({ ...revisionRecipient, senderName: e.target.value })}
                  placeholder={currentUser?.name || '이름 입력'}
                  className="w-full h-11 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/20"
                />
              </div>

              {/* 계좌 인증 버튼 */}
              <div className="flex gap-2 items-end">
                <button
                  onClick={handleRevisionVerifyAccount}
                  disabled={
                    !revisionRecipient.bank ||
                    revisionRecipient.accountNumber.length < 10 ||
                    !revisionRecipient.accountHolder ||
                    revisionRecipient.isVerified ||
                    isVerifying
                  }
                  className="h-11 px-4 bg-gray-900 text-white font-medium rounded-lg disabled:bg-gray-200 disabled:text-gray-400 whitespace-nowrap"
                >
                  {revisionRecipient.isVerified ? '인증완료' : '계좌확인'}
                </button>
              </div>

              {revisionRecipient.isVerified && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-green-700 font-medium flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4" />
                    계좌 확인이 완료되었습니다.
                  </p>
                </div>
              )}

              {revisionVerificationFailed && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-red-700 font-medium flex items-center gap-2 text-sm">
                    <X className="w-4 h-4" />
                    계좌 정보가 올바르지 않습니다.
                  </p>
                </div>
              )}
            </div>

            {/* 액션 버튼 */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowRevisionModal(false)}
                className="flex-1 h-12 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleRecipientRevisionRequest}
                disabled={!revisionRecipient.isVerified}
                className="flex-1 h-12 bg-primary-400 text-white font-medium rounded-xl hover:bg-primary-500 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                저장
              </button>
            </div>
          </div>
        </div>,
        document.getElementById('mobile-frame')!
      )}

      {/* 첨부파일 삭제 확인 모달 */}
      {mounted && showDeleteConfirmModal && createPortal(
        <div className="absolute inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-3">첨부파일 삭제</h3>
            <p className="text-gray-600 mb-6">
              첨부파일을 삭제하시겠습니까?<br />
              이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirmModal(false)}
                className="flex-1 h-11 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={confirmDeleteAttachment}
                className="flex-1 h-11 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>,
        document.getElementById('mobile-frame')!
      )}

      {/* 보완 요청 저장 확인 모달 */}
      {mounted && showRevisionConfirmModal && createPortal(
        <div className="absolute inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-3">거래신청 확인</h3>
            <p className="text-gray-600 mb-6">
              {revisionType === 'documents'
                ? '수정된 서류로 거래신청 하시겠습니까?'
                : '수정된 정보로 거래신청 하시겠습니까?'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowRevisionConfirmModal(false)}
                className="flex-1 h-11 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={revisionType === 'documents' ? handleDocumentRevisionConfirm : handleRecipientRevisionConfirm}
                className="flex-1 h-11 bg-primary-400 text-white font-medium rounded-xl hover:bg-primary-500 transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>,
        document.getElementById('mobile-frame')!
      )}
    </div>
  );
}
