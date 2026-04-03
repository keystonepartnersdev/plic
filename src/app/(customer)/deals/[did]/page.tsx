'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDealStore, useUserStore, useSettingsStore } from '@/stores';
import { DealHelper } from '@/classes';
import { Header, Modal } from '@/components/common';
import {
  useDealDetail,
  StatusCard,
  AmountCard,
  RecipientCard,
  AttachmentsCard,
  DealHistory,
  DiscountSection,
  AttachmentPreviewModal,
  CouponModal,
  RevisionDocumentsModal,
  RevisionRecipientModal,
  RevisionConfirmModal,
  DeleteConfirmModal,
  EditDealModal,
} from '@/components/deal/detail';
import { DealDeleteModal } from './components/DealDeleteModal';
import { RevisionAlert } from './components/RevisionAlert';
import { DealActions } from './components/DealActions';
import { IDeal } from '@/types';

export default function DealDetailPage() {
  const params = useParams();
  const did = params.did as string;

  const {
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

    // 첨부파일 미리보기
    previewIndex,
    attachmentsTotalCount,
    handlePreviewNavigate,
    handleOpenPreview,
  } = useDealDetail(did);

  const router = useRouter();
  const { deals: allDeals } = useDealStore();
  const { settings } = useSettingsStore();

  // 결제 차단 모달 (결제 버튼 클릭 시)
  const [showBlockedModal, setShowBlockedModal] = useState<
    'hold' | 'pending_verification' | 'rejected' | null
  >(null);

  // 정지/탈퇴: 페이지 진입 자체 차단 (항상 렌더)
  const blockedOnLoad = currentUser?.status === 'suspended' || currentUser?.status === 'withdrawn';

  // 결제 버튼 클릭 시 차단 모달
  const handlePaymentBlocked = () => {
    if (currentUser?.status === 'pending') {
      setShowBlockedModal('hold');
    } else if (currentUser?.businessInfo?.verificationStatus === 'rejected') {
      setShowBlockedModal('rejected');
    } else {
      setShowBlockedModal('pending_verification');
    }
  };

  // 이번 달 사용 금액: 실제 완료 거래에서 계산 (DB 값은 취소 건 미반영 가능)
  const computedUsedAmount = useMemo(() => {
    if (!currentUser) return 0;
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return allDeals
      .filter(d => d.uid === currentUser.uid && d.status === 'completed' && d.createdAt?.startsWith(thisMonth))
      .reduce((sum, d) => sum + (d.amount || 0), 0);
  }, [allDeals, currentUser]);

  // 수정 모달 상태
  const [editModalType, setEditModalType] = useState<'amount' | 'recipient' | 'attachments' | null>(null);
  const [localDeal, setLocalDeal] = useState<IDeal | null>(null);

  // 로딩 상태
  if (!mounted || !_hasHydrated || !isLoggedIn || !deal) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400" />
      </div>
    );
  }

  // 실제 표시할 거래 데이터 (수정 후 반영)
  const displayDeal = localDeal || deal;

  // 수수료 우선순위 로직: 미결제 거래는 실시간 재계산
  const effectiveFeeRate = !displayDeal.isPaid && currentUser
    ? DealHelper.determineFeeRate(currentUser, displayDeal.dealType, settings?.feeSettings).feeRate
    : displayDeal.feeRate;

  const showDiscountSection = (displayDeal.status === 'draft' || displayDeal.status === 'awaiting_payment') && !displayDeal.isPaid;

  // 수정 가능 여부: 결제 전 & draft/awaiting_payment 상태일 때만
  const canEdit = !displayDeal.isPaid &&
    (displayDeal.status === 'draft' || displayDeal.status === 'awaiting_payment');

  const handleDealUpdate = (updatedDeal: IDeal) => {
    setLocalDeal(updatedDeal);
  };

  return (
    <div className="relative min-h-screen bg-gray-50 pb-24">
      <Header title="거래 상세" showBack />

      {/* 상태 카드 */}
      <StatusCard deal={deal} onPaymentBlocked={handlePaymentBlocked} />

      {/* 할인 섹션 */}
      {showDiscountSection && (
        <div className="bg-white px-5 py-4 -mt-2 mb-2">
          <DiscountSection
            appliedDiscounts={appliedDiscounts}
            discountCodeInput={discountCodeInput}
            onDiscountCodeChange={setDiscountCodeInput}
            onApplyCode={handleApplyDiscountCode}
            onRemoveDiscount={handleRemoveDiscount}
            onOpenCouponModal={() => setShowCouponModal(true)}
            getDiscountAmount={getDiscountAmount}
            getDiscountLabel={getDiscountLabel}
            availableCouponsCount={availableCoupons.length}
          />
        </div>
      )}

      {/* 보완 필요 안내 */}
      <RevisionAlert
        deal={deal}
        onDocumentRevision={() => {
          setShowRevisionModal(true);
          setRevisionRecipient({ bank: '', accountNumber: '', accountHolder: '', senderName: '' });
        }}
        onRecipientRevision={() => {
          setShowRevisionModal(true);
          setRevisionRecipient({
            bank: deal.recipient?.bank || '',
            accountNumber: deal.recipient?.accountNumber || '',
            accountHolder: deal.recipient?.accountHolder || '',
            senderName: deal.senderName || '',
          });
        }}
      />

      {/* 금액 정보 */}
      <div className="relative">
        <AmountCard
          deal={displayDeal}
          appliedDiscounts={appliedDiscounts}
          getDiscountLabel={getDiscountLabel}
          getDiscountAmount={getDiscountAmount}
          calculatedFinalAmount={calculatedFinalAmount}
          effectiveFeeRate={effectiveFeeRate}
        />
        {canEdit && (
          <button
            onClick={() => setEditModalType('amount')}
            className="absolute top-4 right-5 text-sm text-primary-400 font-medium hover:text-primary-500"
          >
            수정
          </button>
        )}
      </div>

      {/* 수취인 정보 */}
      <div className="relative">
        <RecipientCard deal={displayDeal} senderName={currentUser?.name} />
        {canEdit && (
          <button
            onClick={() => setEditModalType('recipient')}
            className="absolute top-4 right-5 text-sm text-primary-400 font-medium hover:text-primary-500"
          >
            수정
          </button>
        )}
      </div>

      {/* 첨부 서류 */}
      <div className="relative">
        <AttachmentsCard
          deal={displayDeal}
          onPreview={handleOpenPreview}
        />
        {canEdit && (
          <button
            onClick={() => setEditModalType('attachments')}
            className="absolute top-4 right-5 text-sm text-primary-400 font-medium hover:text-primary-500"
          >
            수정
          </button>
        )}
      </div>

      {/* 거래 이력 */}
      <DealHistory deal={deal} />

      {/* 거래 액션 버튼들 */}
      <DealActions
        deal={deal}
        onDelete={() => setShowDealDeleteModal(true)}
        onCancel={handleCancel}
      />

      {/* 모달들 */}
      {mounted && previewAttachment && (
        <AttachmentPreviewModal
          preview={previewAttachment}
          totalCount={attachmentsTotalCount}
          onClose={() => setPreviewAttachment(null)}
          onNavigate={handlePreviewNavigate}
        />
      )}

      {mounted && showCouponModal && (
        <CouponModal
          isOpen={showCouponModal}
          availableCoupons={availableCoupons}
          appliedDiscounts={appliedDiscounts}
          canApplyDiscount={canApplyDiscount}
          onSelectCoupon={handleSelectCoupon}
          onClose={() => setShowCouponModal(false)}
        />
      )}

      {mounted && showRevisionModal && deal.revisionType === 'documents' && (
        <RevisionDocumentsModal
          isOpen={showRevisionModal}
          onClose={() => setShowRevisionModal(false)}
          deal={deal}
          revisionAttachments={revisionAttachments}
          onRevisionAttachmentsChange={setRevisionAttachments}
          onPreviewAttachment={handleOpenPreview}
          onDeleteExistingAttachment={handleDeleteExistingAttachment}
          onSubmit={handleDocumentRevisionRequest}
        />
      )}

      {mounted && showRevisionModal && deal.revisionType === 'recipient' && (
        <RevisionRecipientModal
          isOpen={showRevisionModal}
          onClose={() => setShowRevisionModal(false)}
          revisionRecipient={revisionRecipient}
          onRecipientChange={setRevisionRecipient}
          onVerifyAccount={handleRevisionVerifyAccount}
          onSubmit={handleRecipientRevisionRequest}
          isVerifying={isVerifying}
          verificationFailed={revisionVerificationFailed}
          defaultSenderName={currentUser?.name}
        />
      )}

      {mounted && showDeleteConfirmModal && (
        <DeleteConfirmModal
          isOpen={showDeleteConfirmModal}
          onClose={() => setShowDeleteConfirmModal(false)}
          onConfirm={confirmDeleteAttachment}
          title="첨부파일 삭제"
          message="첨부파일을 삭제하시겠습니까?"
          warning="이 작업은 되돌릴 수 없습니다."
        />
      )}

      {mounted && showRevisionConfirmModal && revisionType && (
        <RevisionConfirmModal
          isOpen={showRevisionConfirmModal}
          onClose={() => setShowRevisionConfirmModal(false)}
          onConfirm={revisionType === 'documents' ? handleDocumentRevisionConfirm : handleRecipientRevisionConfirm}
          revisionType={revisionType}
        />
      )}

      {mounted && showDealDeleteModal && (
        <DealDeleteModal
          isDeleting={isDeleting}
          onConfirm={handleDeleteDeal}
          onCancel={() => setShowDealDeleteModal(false)}
        />
      )}

      {/* 정지/탈퇴 차단 모달 (페이지 진입 차단) */}
      {mounted && blockedOnLoad && (
        <Modal
          isOpen={true}
          onClose={() => router.back()}
          title={currentUser?.status === 'suspended' ? '계정 정지' : '탈퇴 계정'}
          showCloseButton={false}
          confirmText="돌아가기"
          onConfirm={() => router.back()}
        >
          <p className="whitespace-pre-line">
            {currentUser?.status === 'suspended'
              ? '계정이 정지되었습니다.\n고객센터로 문의해주세요.'
              : '탈퇴한 계정입니다.'}
          </p>
        </Modal>
      )}

      {/* 결제 차단 모달 (결제 버튼 클릭 시) */}
      {mounted && showBlockedModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowBlockedModal(null)}
          title={
            showBlockedModal === 'hold' ? '서비스 이용 불가' :
            showBlockedModal === 'rejected' ? '사업자 인증 거절' :
            '사업자 인증 대기'
          }
          confirmText={showBlockedModal === 'rejected' ? '사업자 등록증 재첨부' : '확인'}
          onConfirm={
            showBlockedModal === 'rejected'
              ? () => router.push('/mypage/edit')
              : () => setShowBlockedModal(null)
          }
          showCancel={showBlockedModal === 'rejected'}
          cancelText="닫기"
          onCancel={() => setShowBlockedModal(null)}
        >
          <p className="whitespace-pre-line">
            {showBlockedModal === 'hold' && '서비스 이용이 불가합니다.\n고객센터로 문의해주세요.'}
            {showBlockedModal === 'pending_verification' && '사업자 인증 진행중입니다.\n영업일 기준 당일 내에 검토가 완료됩니다.'}
            {showBlockedModal === 'rejected' && (
              <>
                사업자 인증이 거절되었습니다.
                {currentUser?.businessInfo?.verificationMemo && (
                  <>
                    {'\n\n'}거절 사유: {currentUser.businessInfo.verificationMemo}
                  </>
                )}
                {'\n\n'}사업자 등록증을 다시 첨부해주세요.
              </>
            )}
          </p>
        </Modal>
      )}

      {/* 수정 모달 */}
      {mounted && editModalType && (
        <EditDealModal
          isOpen={!!editModalType}
          onClose={() => setEditModalType(null)}
          deal={displayDeal}
          onUpdate={handleDealUpdate}
          editType={editModalType}
          monthlyLimit={currentUser?.monthlyLimit || 20000000}
          usedAmount={computedUsedAmount}
          perTransactionLimit={currentUser?.perTransactionLimit || 2000000}
          effectiveFeeRate={effectiveFeeRate}
        />
      )}
    </div>
  );
}
