'use client';

// src/components/deal/detail/hooks/useDealDetail.ts
// 거래 상세 페이지 로직 커스텀 훅

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { dealsAPI } from '@/lib/api';
import { useUserStore, useDealStore, useDiscountStore } from '@/stores';
import { IDeal, IDiscount } from '@/types';
import { getErrorMessage } from '@/lib/utils';
import { AttachmentPreview, RevisionRecipient } from '../types';

export function useDealDetail(did: string) {
  const router = useRouter();
  const { currentUser, isLoggedIn, _hasHydrated, fetchCurrentUser } = useUserStore();
  const { updateDeal } = useDealStore();
  const { getDiscountByCode, getActiveCodes, getActiveCoupons, fetchUserCoupons } = useDiscountStore();

  // 기본 상태
  const [mounted, setMounted] = useState(false);
  const [deal, setDeal] = useState<IDeal | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<AttachmentPreview | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const dealFetchedRef = useRef(false);

  // 할인 관련 상태
  const [discountCodeInput, setDiscountCodeInput] = useState('');
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [appliedDiscounts, setAppliedDiscounts] = useState<IDiscount[]>([]);

  // 보완 요청 관련 상태
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionAttachments, setRevisionAttachments] = useState<File[]>([]);
  const [revisionRecipient, setRevisionRecipient] = useState<RevisionRecipient>({
    bank: '',
    accountNumber: '',
    accountHolder: '',
    senderName: '',
  });
  const [showRevisionConfirmModal, setShowRevisionConfirmModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);
  const [showDealDeleteModal, setShowDealDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [revisionType, setRevisionType] = useState<'documents' | 'recipient' | null>(null);
  const [revisionVerificationFailed, setRevisionVerificationFailed] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // 스토어에서 활성 할인코드/쿠폰 가져오기
  const availableDiscountCodes = getActiveCodes() || [];
  const availableCoupons = getActiveCoupons() || [];

  // 전체 할인 금액 계산
  const { total: totalDiscountAmount, details: discountDetails } = useMemo(() => {
    if (!deal) return { total: 0, details: new Map<string, number>() };

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
  }, [deal?.feeAmount, appliedDiscounts]);

  const calculatedFinalAmount = deal ? deal.totalAmount - totalDiscountAmount : 0;

  // 개별 할인 금액 조회
  const getDiscountAmount = (discountId: string): number => {
    return discountDetails.get(discountId) || 0;
  };

  // 할인 타입 라벨
  const getDiscountLabel = (discount: IDiscount): string => {
    if (discount.discountType === 'amount') {
      return `${discount.discountValue.toLocaleString()}원 할인`;
    } else {
      return `수수료 ${discount.discountValue}% 할인`;
    }
  };

  // 마운트 Effect + 최신 사용자 정보 가져오기 (어드민 상태 변경 즉시 반영)
  useEffect(() => {
    setMounted(true);
    if (isLoggedIn) {
      fetchCurrentUser();
    }
  }, [isLoggedIn, fetchCurrentUser]);

  // 거래 데이터 로드 Effect
  useEffect(() => {
    if (!mounted || !_hasHydrated || !isLoggedIn) {
      if (mounted && _hasHydrated && !isLoggedIn) {
        router.replace('/auth/login');
      }
      return;
    }

    if (dealFetchedRef.current) return;
    dealFetchedRef.current = true;

    dealsAPI.get(did).then(response => {
      if (response.deal) {
        const completeDeal = {
          ...response.deal,
          recipient: response.deal.recipient || {},
          attachments: response.deal.attachments || [],
          history: response.deal.history || [],
        };
        setDeal(completeDeal);

        // 저장된 할인 코드 복원
        if (completeDeal.discountCode) {
          const discountCodes = completeDeal.discountCode.split(', ').filter((code: string) => code.trim());
          const restoredDiscounts: IDiscount[] = [];
          discountCodes.forEach((code: string) => {
            const discountData = getDiscountByCode(code) || availableCoupons.find(c => c.name === code);
            if (discountData) {
              restoredDiscounts.push(discountData);
            }
          });
          if (restoredDiscounts.length > 0) {
            setAppliedDiscounts(restoredDiscounts);
          }
        }
      } else {
        router.replace('/deals');
      }
    }).catch(() => {
      router.replace('/deals');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, _hasHydrated, isLoggedIn, did, router]);

  // 쿠폰 목록 로드 Effect
  useEffect(() => {
    if (deal?.status === 'awaiting_payment' && !deal?.isPaid) {
      fetchUserCoupons();
    }
  }, [deal?.status, deal?.isPaid, fetchUserCoupons]);

  // 할인 적용 가능 여부 체크
  const canApplyDiscount = (discount: IDiscount): { canApply: boolean; reason?: string } => {
    if (appliedDiscounts.some(d => d.id === discount.id)) {
      return { canApply: false, reason: '이미 적용된 할인입니다.' };
    }
    if (!discount.isReusable && discount.isUsed) {
      return { canApply: false, reason: '이미 사용한 할인입니다. (재사용 불가)' };
    }
    if (deal && deal.amount < discount.minAmount) {
      return { canApply: false, reason: `최소 주문 금액 ${discount.minAmount.toLocaleString()}원 이상부터 사용 가능합니다.` };
    }
    if (new Date(discount.expiry) < new Date()) {
      return { canApply: false, reason: '유효기간이 만료된 할인입니다.' };
    }
    const remainingFee = (deal?.feeAmount || 0) - totalDiscountAmount;
    if (remainingFee === 0) {
      return { canApply: false, reason: '수수료가 이미 전액 할인되어 추가 할인을 적용할 수 없습니다.' };
    }
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

    let remainingFee = deal.feeAmount;
    let discountTotal = 0;

    const percentDiscounts = newAppliedDiscounts.filter(d => d.discountType === 'feePercent');
    const totalPercent = percentDiscounts.reduce((sum, d) => sum + d.discountValue, 0);
    const percentDiscount = Math.min(
      Math.floor(deal.feeAmount * (totalPercent / 100)),
      remainingFee
    );

    if (percentDiscount > 0) {
      remainingFee -= percentDiscount;
      discountTotal += percentDiscount;
    }

    const amountDiscounts = newAppliedDiscounts.filter(d => d.discountType === 'amount');
    amountDiscounts.forEach(d => {
      const discount = Math.min(d.discountValue, remainingFee);
      if (discount > 0) {
        discountTotal += discount;
        remainingFee -= discount;
      }
    });

    const newFinalAmount = deal.totalAmount - discountTotal;

    const allDiscountNames = [
      ...newAppliedDiscounts.filter(d => d.type === 'code').map(d => d.name || d.id),
      ...newAppliedDiscounts.filter(d => d.type === 'coupon').map(d => d.name)
    ].join(', ');

    updateDeal(deal.did, {
      discountCode: allDiscountNames || undefined,
      discountAmount: discountTotal,
      finalAmount: newFinalAmount,
    });
  };

  // 할인코드 적용
  const handleApplyDiscountCode = () => {
    if (!discountCodeInput.trim()) {
      alert('할인코드를 입력해주세요.');
      return;
    }

    const discountCode = getDiscountByCode(discountCodeInput);
    if (!discountCode) {
      alert('유효하지 않은 할인코드입니다.');
      return;
    }
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
    updateDealWithDiscounts(newAppliedDiscounts);
    alert('할인코드가 적용되었습니다.');
  };

  // 쿠폰 선택
  const handleSelectCoupon = (coupon: IDiscount) => {
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
    updateDealWithDiscounts(newAppliedDiscounts);
    setShowCouponModal(false);
  };

  // 개별 할인 취소
  const handleRemoveDiscount = (discountId: string) => {
    const newAppliedDiscounts = appliedDiscounts.filter(d => d.id !== discountId);
    setAppliedDiscounts(newAppliedDiscounts);
    updateDealWithDiscounts(newAppliedDiscounts);
  };

  // 거래 취소
  const handleCancel = () => {
    if (!deal) return;
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
          ...(deal.history || []),
        ],
      });
    }
  };

  // 거래 삭제
  const handleDeleteDeal = async () => {
    if (!deal) return;

    setIsDeleting(true);
    try {
      await dealsAPI.cancel(deal.did);
      alert('거래가 삭제되었습니다.');
      router.replace('/deals');
    } catch (error: unknown) {
      alert(getErrorMessage(error) || '거래 삭제에 실패했습니다.');
    } finally {
      setIsDeleting(false);
      setShowDealDeleteModal(false);
    }
  };

  // 서류 보완 요청
  const handleDocumentRevisionRequest = () => {
    if (revisionAttachments.length === 0) {
      alert('최소 1개 이상의 파일을 업로드해주세요.');
      return;
    }
    setRevisionType('documents');
    setShowRevisionConfirmModal(true);
  };

  // 서류 보완 확인
  const handleDocumentRevisionConfirm = () => {
    const newAttachments = [...(deal?.attachments || [])];
    let filesProcessed = 0;

    revisionAttachments.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          newAttachments.push(e.target.result as string);
        }
        filesProcessed++;

        if (filesProcessed === revisionAttachments.length && deal) {
          updateDeal(deal.did, {
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
              ...(deal.history || []),
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

  // 수취인 보완 요청
  const handleRecipientRevisionRequest = () => {
    if (!revisionRecipient.bank || !revisionRecipient.accountNumber || !revisionRecipient.accountHolder) {
      alert('수취인 정보를 모두 입력해주세요.');
      return;
    }
    setRevisionType('recipient');
    setShowRevisionConfirmModal(true);
  };

  // 계좌 인증
  const handleRevisionVerifyAccount = async () => {
    setIsVerifying(true);
    setRevisionVerificationFailed(false);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (!revisionRecipient.bank || !revisionRecipient.accountNumber || !revisionRecipient.accountHolder) {
      setRevisionVerificationFailed(true);
      setIsVerifying(false);
      return;
    }

    setRevisionRecipient({ ...revisionRecipient, isVerified: true });
    setIsVerifying(false);
  };

  // 수취인 보완 확인
  const handleRecipientRevisionConfirm = () => {
    if (!deal) return;

    updateDeal(deal.did, {
      status: 'reviewing',
      revisionType: undefined,
      recipient: {
        ...revisionRecipient,
        isVerified: revisionRecipient.isVerified || false,
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
        ...(deal.history || []),
      ],
    });

    setShowRevisionModal(false);
    setShowRevisionConfirmModal(false);
    setRevisionRecipient({ bank: '', accountNumber: '', accountHolder: '', senderName: '' });
    setRevisionType(null);
  };

  // 첨부파일 삭제
  const handleDeleteExistingAttachment = (index: number) => {
    setDeleteConfirmIndex(index);
    setShowDeleteConfirmModal(true);
  };

  const confirmDeleteAttachment = () => {
    if (deleteConfirmIndex === null || !deal) return;

    const newAttachments = (deal.attachments || []).filter((_, i) => i !== deleteConfirmIndex);
    updateDeal(deal.did, {
      attachments: newAttachments,
    });

    setShowDeleteConfirmModal(false);
    setDeleteConfirmIndex(null);
  };

  return {
    // 상태
    mounted,
    deal,
    isLoggedIn,
    _hasHydrated,
    currentUser,
    previewAttachment,
    setPreviewAttachment,

    // 할인
    discountCodeInput,
    setDiscountCodeInput,
    showCouponModal,
    setShowCouponModal,
    appliedDiscounts,
    availableCoupons,
    totalDiscountAmount,
    calculatedFinalAmount,
    getDiscountAmount,
    getDiscountLabel,
    canApplyDiscount,
    handleApplyDiscountCode,
    handleSelectCoupon,
    handleRemoveDiscount,

    // 보완 요청
    showRevisionModal,
    setShowRevisionModal,
    revisionAttachments,
    setRevisionAttachments,
    revisionRecipient,
    setRevisionRecipient,
    showRevisionConfirmModal,
    setShowRevisionConfirmModal,
    revisionType,
    revisionVerificationFailed,
    isVerifying,
    handleDocumentRevisionRequest,
    handleDocumentRevisionConfirm,
    handleRecipientRevisionRequest,
    handleRevisionVerifyAccount,
    handleRecipientRevisionConfirm,

    // 삭제
    showDeleteConfirmModal,
    setShowDeleteConfirmModal,
    deleteConfirmIndex,
    handleDeleteExistingAttachment,
    confirmDeleteAttachment,
    showDealDeleteModal,
    setShowDealDeleteModal,
    isDeleting,
    handleDeleteDeal,

    // 거래
    handleCancel,

    // 첨부파일 미리보기 네비게이션
    previewIndex,
    attachmentsTotalCount: deal?.attachments?.length || 0,
    handlePreviewNavigate: async (index: number) => {
      if (!deal?.attachments) return;
      const attachments = deal.attachments;
      if (index >= 0 && index < attachments.length) {
        setPreviewIndex(index);
        const attachment = attachments[index];
        const isLocalUrl = typeof attachment === 'string' && (attachment.startsWith('data:') || attachment.startsWith('blob:'));
        const isS3Key = typeof attachment === 'string' && !isLocalUrl;

        if (isS3Key) {
          // S3 fileKey → presigned URL 변환
          try {
            const res = await fetch('/api/uploads/download-url', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ fileKey: attachment }),
            });
            const result = await res.json();
            if (result.success) {
              setPreviewAttachment({
                url: result.data.downloadUrl,
                name: `첨부파일 ${index + 1}`,
                index,
              });
              return;
            }
          } catch (error) {
            console.error('[useDealDetail] presigned URL 오류:', error);
          }
        }

        setPreviewAttachment({
          url: isLocalUrl ? attachment : URL.createObjectURL(attachment as unknown as Blob),
          name: `첨부파일 ${index + 1}`,
          index,
        });
      }
    },
    handleOpenPreview: (attachment: AttachmentPreview) => {
      setPreviewAttachment(attachment);
      setPreviewIndex(attachment.index || 0);
    },
  };
}
