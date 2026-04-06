'use client';

// src/components/deal/detail/hooks/useDealDetail.ts
// 거래 상세 페이지 로직 커스텀 훅
// DB 기반 1거래 1할인 원칙 — 모든 할인 상태는 deal 레코드에서만 읽음

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { dealsAPI } from '@/lib/api';
import { useUserStore, useDealStore } from '@/stores';

// DynamoDB 직접 조회 (Lambda는 finalAmount/discountAmount 미반환)
async function fetchDealDirect(did: string) {
  const res = await fetch(`/api/deals/${did}/detail`);
  const result = await res.json();
  if (result.success && result.data?.deal) return result.data.deal;
  return null;
}
import { IDeal, IDiscount } from '@/types';
import { getErrorMessage } from '@/lib/utils';
import { AttachmentPreview, RevisionRecipient } from '../types';

interface UserCouponAsDiscount extends IDiscount {
  userCouponId?: string;
}

export function useDealDetail(did: string) {
  const router = useRouter();
  const { currentUser, isLoggedIn, _hasHydrated, fetchCurrentUser } = useUserStore();
  const { updateDeal } = useDealStore();

  // 기본 상태
  const [mounted, setMounted] = useState(false);
  const [deal, setDeal] = useState<IDeal | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<AttachmentPreview | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const dealFetchedRef = useRef(false);

  // 할인 관련 상태 (DB 기반 — 1거래 1할인)
  const [discountCodeInput, setDiscountCodeInput] = useState('');
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [applyingDiscount, setApplyingDiscount] = useState(false);

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

  // 사용자별 지급 쿠폰 (plic-user-coupons)
  const [userCoupons, setUserCoupons] = useState<UserCouponAsDiscount[]>([]);
  useEffect(() => {
    if (!currentUser?.uid || !deal) return;
    // 이미 할인 적용된 거래면 쿠폰 목록 불필요
    if (deal.appliedCouponId) return;
    // 결제 전 상태에서만 쿠폰 조회
    if (!['draft', 'awaiting_payment'].includes(deal.status) || deal.isPaid) return;

    fetch(`/api/users/me/coupons?uid=${currentUser.uid}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.available) {
          const converted: UserCouponAsDiscount[] = data.data.available.map((uc: { id: string; discountId: string; discountSnapshot: { name: string; discountType: string; discountValue: number; applicableDealTypes?: string[] }; expiresAt: string; maxUsage: number }) => ({
            id: uc.discountId,
            userCouponId: uc.id,
            name: uc.discountSnapshot.name,
            type: 'coupon' as const,
            discountType: uc.discountSnapshot.discountType as IDiscount['discountType'],
            discountValue: uc.discountSnapshot.discountValue,
            minAmount: 0,
            startDate: '',
            expiry: uc.expiresAt,
            canStack: false,
            isActive: true,
            isReusable: uc.maxUsage > 1,
            usageCount: 0,
            createdAt: '',
            updatedAt: '',
            usageType: 'single' as const,
            issueMethod: 'manual' as const,
          }));
          setUserCoupons(converted);
        }
      })
      .catch(() => {});
  }, [currentUser?.uid, deal?.did, deal?.appliedCouponId, deal?.status, deal?.isPaid]);

  const availableCoupons = userCoupons;

  // DB 기반: 할인 적용 여부는 deal.appliedCouponId 존재 여부로 판단
  const hasDiscount = !!(deal?.appliedCouponId && (deal?.discountAmount ?? 0) > 0);

  // 할인 적용 가능 여부 (1거래 1할인)
  const canApplyDiscount = (coupon: IDiscount): { canApply: boolean; reason?: string } => {
    if (hasDiscount) {
      return { canApply: false, reason: '이미 할인이 적용된 거래입니다.' };
    }
    if (deal && deal.amount < coupon.minAmount) {
      return { canApply: false, reason: `최소 주문 금액 ${coupon.minAmount.toLocaleString()}원 이상부터 사용 가능합니다.` };
    }
    if (coupon.expiry && new Date(coupon.expiry) < new Date()) {
      return { canApply: false, reason: '유효기간이 만료된 할인입니다.' };
    }
    return { canApply: true };
  };

  // 마운트 Effect + 최신 사용자 정보 가져오기 (어드민 상태 변경 즉시 반영)
  useEffect(() => {
    setMounted(true);
    if (isLoggedIn) {
      fetchCurrentUser();
    }
  }, [isLoggedIn, fetchCurrentUser]);

  // 거래 데이터 로드 Effect (DB 직접 조회 — 할인 상태도 DB에서 읽음)
  useEffect(() => {
    if (!mounted || !_hasHydrated || !isLoggedIn) {
      if (mounted && _hasHydrated && !isLoggedIn) {
        router.replace('/auth/login');
      }
      return;
    }

    if (dealFetchedRef.current) return;
    dealFetchedRef.current = true;

    fetchDealDirect(did).then(dealData => {
      if (dealData) {
        const completeDeal = {
          ...dealData,
          recipient: dealData.recipient || {},
          attachments: dealData.attachments || [],
          history: dealData.history || [],
        };
        setDeal(completeDeal);
        // 할인 상태는 deal 레코드에 모두 포함되어 있으므로 별도 복원 불필요
      } else {
        router.replace('/deals');
      }
    }).catch(() => {
      router.replace('/deals');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, _hasHydrated, isLoggedIn, did, router]);

  // 할인코드 적용 → 서버 API 호출 (DB 직접 업데이트)
  const handleApplyDiscountCode = async () => {
    if (!deal || !discountCodeInput.trim()) {
      alert('할인코드를 입력해주세요.');
      return;
    }
    if (hasDiscount) {
      alert('이미 할인이 적용된 거래입니다. 기존 할인을 해제한 후 다시 시도해주세요.');
      return;
    }

    setApplyingDiscount(true);
    try {
      const res = await fetch(`/api/deals/${deal.did}/discount`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: discountCodeInput.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        const refreshed = await fetchDealDirect(deal.did);
        if (refreshed) setDeal(refreshed);
        setDiscountCodeInput('');
        alert('할인코드가 적용되었습니다.');
      } else {
        alert(data.error || '할인코드 적용에 실패했습니다.');
      }
    } catch {
      alert('할인코드 적용 중 오류가 발생했습니다.');
    } finally {
      setApplyingDiscount(false);
    }
  };

  // 쿠폰 선택 → 서버 API 호출 (DB 직접 업데이트)
  const handleSelectCoupon = async (coupon: IDiscount) => {
    if (!deal) return;

    const { canApply, reason } = canApplyDiscount(coupon);
    if (!canApply) {
      alert(reason);
      return;
    }

    const couponWithId = coupon as UserCouponAsDiscount;
    const userCouponId = couponWithId.userCouponId || coupon.id;

    setApplyingDiscount(true);
    try {
      const res = await fetch(`/api/deals/${deal.did}/coupon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userCouponId }),
      });
      const data = await res.json();
      if (data.success) {
        // DB 반영 완료 → deal 재조회로 동기화 (유일한 source of truth)
        const refreshed = await fetchDealDirect(deal.did);
        if (refreshed) setDeal(refreshed);
      } else {
        alert(data.error || '쿠폰 적용에 실패했습니다.');
      }
    } catch {
      alert('쿠폰 적용 중 오류가 발생했습니다.');
    } finally {
      setApplyingDiscount(false);
      setShowCouponModal(false);
    }
  };

  // 할인 해제 → 서버 API 호출 (쿠폰/할인코드 공통)
  const handleRemoveDiscount = async () => {
    if (!deal) return;
    setApplyingDiscount(true);
    try {
      const res = await fetch(`/api/deals/${deal.did}/coupon`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        const refreshed = await fetchDealDirect(deal.did);
        if (refreshed) setDeal(refreshed);
      } else {
        alert(data.error || '할인 해제에 실패했습니다.');
      }
    } catch {
      alert('할인 해제 중 오류가 발생했습니다.');
    } finally {
      setApplyingDiscount(false);
    }
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
            statusHistory: [
              { prevStatus: 'need_revision', newStatus: 'reviewing', changedAt: new Date().toISOString(), changedBy: 'user', reason: '서류 보완 제출' },
              ...(deal.statusHistory || []),
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

  // 계좌 인증 (팝빌 API)
  const handleRevisionVerifyAccount = async () => {
    if (!revisionRecipient.bank || !revisionRecipient.accountNumber || !revisionRecipient.accountHolder) {
      setRevisionVerificationFailed(true);
      return;
    }

    setIsVerifying(true);
    setRevisionVerificationFailed(false);

    try {
      const response = await fetch('/api/popbill/account/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankName: revisionRecipient.bank,
          accountNumber: revisionRecipient.accountNumber,
          accountHolder: revisionRecipient.accountHolder,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setRevisionVerificationFailed(true);
        return;
      }

      const { isMatch } = result.data;

      if (isMatch) {
        setRevisionRecipient({ ...revisionRecipient, isVerified: true });
      } else {
        setRevisionVerificationFailed(true);
      }
    } catch {
      setRevisionVerificationFailed(true);
    } finally {
      setIsVerifying(false);
    }
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
      statusHistory: [
        { prevStatus: 'need_revision', newStatus: 'reviewing', changedAt: new Date().toISOString(), changedBy: 'user', reason: '수취인 정보 보완 제출' },
        ...(deal.statusHistory || []),
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

  // DB에서 거래 재조회 (금액 수정 후 쿠폰 해제 등 deal 상태 갱신용)
  const refreshDeal = async () => {
    const refreshed = await fetchDealDirect(did);
    if (refreshed) setDeal(refreshed);
    return refreshed;
  };

  return {
    // 상태
    mounted,
    deal,
    refreshDeal,
    isLoggedIn,
    _hasHydrated,
    currentUser,
    previewAttachment,
    setPreviewAttachment,

    // 할인 (DB 기반 1거래 1할인)
    discountCodeInput,
    setDiscountCodeInput,
    showCouponModal,
    setShowCouponModal,
    hasDiscount,
    applyingDiscount,
    availableCoupons,
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
