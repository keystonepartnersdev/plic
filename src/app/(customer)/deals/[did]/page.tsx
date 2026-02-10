'use client';

import { useParams } from 'next/navigation';
import { Header } from '@/components/common';
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
} from '@/components/deal/detail';
import { DealDeleteModal } from './components/DealDeleteModal';
import { RevisionAlert } from './components/RevisionAlert';
import { DealActions } from './components/DealActions';

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

  // 로딩 상태
  if (!mounted || !_hasHydrated || !isLoggedIn || !deal) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400" />
      </div>
    );
  }

  const showDiscountSection = (deal.status === 'draft' || deal.status === 'awaiting_payment') && !deal.isPaid;

  return (
    <div className="relative min-h-screen bg-gray-50 pb-24">
      <Header title="거래 상세" showBack />

      {/* 상태 카드 */}
      <StatusCard deal={deal} />

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
      <AmountCard
        deal={deal}
        appliedDiscounts={appliedDiscounts}
        getDiscountLabel={getDiscountLabel}
        getDiscountAmount={getDiscountAmount}
        calculatedFinalAmount={calculatedFinalAmount}
      />

      {/* 수취인 정보 */}
      <RecipientCard deal={deal} senderName={currentUser?.name} />

      {/* 첨부 서류 */}
      <AttachmentsCard
        deal={deal}
        onPreview={handleOpenPreview}
      />

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
    </div>
  );
}
