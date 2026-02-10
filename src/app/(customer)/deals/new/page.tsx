'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronRight, Upload, X, Check, Building2, AlertCircle, FileText, Download, Eye, History } from 'lucide-react';
import { Header, Modal } from '@/components/common';
import { dealsAPI } from '@/lib/api';
import { uploadFile, validateFile, UploadResult } from '@/lib/upload';
import { useUserStore, useDealStore, useDealDraftStore } from '@/stores';
import { DealHelper } from '@/classes';
import { TDealType, TDealStep, IDeal, IRecipientAccount, IDraftDocument } from '@/types';
import { cn, getErrorMessage } from '@/lib/utils';

type Step = 'type' | 'amount' | 'recipient' | 'docs' | 'confirm';

// Base64 인코딩 함수
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

// Base64에서 File 객체로 변환
const base64ToFile = (base64Data: string, fileName: string, mimeType: string): File => {
  const arr = base64Data.split(',');
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], fileName, { type: mimeType });
};

const BANKS = [
  '국민은행', '신한은행', '우리은행', '하나은행', '농협은행',
  'SC제일은행', '씨티은행', '카카오뱅크', '토스뱅크', '케이뱅크',
  '기업은행', '수협은행', '대구은행', '부산은행', '경남은행',
  '광주은행', '전북은행', '제주은행', '새마을금고', '신협',
];

// 최소 송금 금액
const MIN_AMOUNT = 1;

function NewDealContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, isLoggedIn, _hasHydrated } = useUserStore();
  const { addDeal } = useDealStore();
  const { currentDraft, startNewDraft, updateDraft, setCurrentStep, submitDraft, loadDraft, clearCurrentDraft } = useDealDraftStore();
  // useAdminUserStore 제거 - currentUser에서 직접 한도 정보 사용

  const [step, setStep] = useState<Step>('type');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [draftInitialized, setDraftInitialized] = useState(false);

  // Step 1: 거래 유형
  const [dealType, setDealType] = useState<TDealType | null>(null);

  // Step 2: 금액
  const [amount, setAmount] = useState('');
  const [discountCode, setDiscountCode] = useState('');

  // Step 3: 수취인 정보
  const [recipient, setRecipient] = useState<IRecipientAccount>({
    bank: '',
    accountNumber: '',
    accountHolder: '',
    isVerified: false,
  });
  const [verificationFailed, setVerificationFailed] = useState(false);
  const [verificationError, setVerificationError] = useState<string>('');
  const [verifiedHolderName, setVerifiedHolderName] = useState<string>(''); // 실제 예금주명 (팝빌 조회)
  const [senderName, setSenderName] = useState('');

  // Step 4: 서류 첨부
  interface AttachmentFile {
    id: string;
    file: File;
    name: string;
    type: string;
    preview: string; // 이미지의 경우 미리보기 URL
    base64Data?: string; // Base64 인코딩된 데이터 (레거시, 드래프트 복원용)
    fileKey?: string; // S3 파일 키
    uploadStatus: 'pending' | 'uploading' | 'completed' | 'error';
    uploadProgress?: number;
  }
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [attachmentsRestored, setAttachmentsRestored] = useState(false);
  const [previewFile, setPreviewFile] = useState<AttachmentFile | null>(null);
  const [uploadingCount, setUploadingCount] = useState(0);

  // 기존 거래 내역 조회
  interface PreviousAccount {
    bank: string;
    accountNumber: string;
    accountHolder: string;
    dealCount: number;
    totalAmount: number;
    lastUsedAt: string;
  }
  const [showPreviousAccounts, setShowPreviousAccounts] = useState(false);
  const [previousAccounts, setPreviousAccounts] = useState<PreviousAccount[]>([]);

  // 기존 거래 내역 조회 함수
  const handleLoadPreviousAccounts = () => {
    if (!currentUser) return;

    const { deals } = useDealStore.getState();
    const userDeals = deals.filter((d) => d.uid === currentUser.uid);
    const accountMap = new Map<string, PreviousAccount>();

    userDeals.forEach((deal) => {
      if (!deal.recipient?.bank || !deal.recipient?.accountNumber) return;

      const key = `${deal.recipient.bank}-${deal.recipient.accountNumber}`;
      const existing = accountMap.get(key);

      if (existing) {
        existing.dealCount += 1;
        existing.totalAmount += deal.amount;
        if (new Date(deal.createdAt) > new Date(existing.lastUsedAt)) {
          existing.lastUsedAt = deal.createdAt;
        }
      } else {
        accountMap.set(key, {
          bank: deal.recipient.bank,
          accountNumber: deal.recipient.accountNumber,
          accountHolder: deal.recipient.accountHolder || '',
          dealCount: 1,
          totalAmount: deal.amount,
          lastUsedAt: deal.createdAt,
        });
      }
    });

    const sortedAccounts = Array.from(accountMap.values()).sort(
      (a, b) => new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime()
    );

    setPreviousAccounts(sortedAccounts);
    setShowPreviousAccounts(true);
  };

  // 기존 계좌 선택 함수
  const handleSelectPreviousAccount = (account: PreviousAccount) => {
    setRecipient({
      ...recipient,
      bank: account.bank,
      accountNumber: account.accountNumber,
      accountHolder: account.accountHolder,
      isVerified: false,
    });
    setVerificationFailed(false);
    setShowPreviousAccounts(false);
  };

  // 초기화: Draft 로드 또는 생성
  useEffect(() => {
    if (!mounted || !currentUser) return;

    // URL에서 draft ID 확인
    const draftId = searchParams.get('draft');
    if (draftId) {
      // 기존 draft 로드
      const loaded = loadDraft(draftId);
      if (loaded) {
        setDraftInitialized(true);
        return;
      }
    }

    // 새 draft 시작 또는 현재 draft 사용
    if (!currentDraft) {
      startNewDraft(currentUser.uid);
    }
    setDraftInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, currentUser]);

  // Draft 데이터로 상태 복원
  useEffect(() => {
    if (!draftInitialized || !currentDraft) return;

    // Draft에서 데이터 복원
    if (currentDraft.dealType) {
      setDealType(currentDraft.dealType);
    }
    if (currentDraft.amount) {
      setAmount(currentDraft.amount.toLocaleString('ko-KR'));
    }
    if (currentDraft.discountCode) {
      setDiscountCode(currentDraft.discountCode);
    }
    if (currentDraft.recipient) {
      setRecipient({
        bank: currentDraft.recipient.bank || '',
        accountNumber: currentDraft.recipient.accountNumber || '',
        accountHolder: currentDraft.recipient.accountHolder || '',
        isVerified: currentDraft.recipient.isVerified || false,
      });
    }
    if (currentDraft.senderName) {
      setSenderName(currentDraft.senderName);
    }
    // 현재 단계로 이동
    if (currentDraft.currentStep) {
      setStep(currentDraft.currentStep);
    }

    // 첨부파일 복원 (base64Data 또는 fileKey가 있는 파일)
    if (currentDraft.documents && currentDraft.documents.length > 0 && !attachmentsRestored) {
      const restoredFiles: AttachmentFile[] = currentDraft.documents
        .filter((doc) => doc.base64Data || doc.fileKey) // base64Data 또는 fileKey가 있는 파일만 복원
        .map((doc) => {
          // base64Data가 있으면 File 객체 생성, 없으면 빈 Blob으로 대체
          const file = doc.base64Data
            ? base64ToFile(doc.base64Data, doc.name, doc.type)
            : new File([new Blob()], doc.name, { type: doc.type });
          const preview = doc.type.startsWith('image/') && doc.base64Data ? doc.base64Data : '';
          return {
            id: doc.id,
            file,
            name: doc.name,
            type: doc.type,
            preview,
            base64Data: doc.base64Data,
            fileKey: doc.fileKey,
            uploadStatus: 'completed' as const, // 복원된 파일은 이미 업로드 완료 상태
          };
        });
      if (restoredFiles.length > 0) {
        setAttachments(restoredFiles);
      }
      setAttachmentsRestored(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftInitialized, currentDraft?.id, attachmentsRestored]);

  // URL 파라미터에서 금액 확인
  useEffect(() => {
    setMounted(true);

    const amountParam = searchParams.get('amount');
    if (amountParam && !searchParams.get('draft')) {
      const numericAmount = Number(amountParam);
      const formattedAmount = numericAmount.toLocaleString('ko-KR');
      setAmount(formattedAmount);
    }
  }, [searchParams]);

  // 단계 변경 시 Draft 업데이트
  const handleStepChange = (newStep: Step) => {
    setStep(newStep);
    setCurrentStep(newStep as TDealStep);
  };

  // 데이터 변경 시 Draft에 저장 (디바운스)
  useEffect(() => {
    if (!draftInitialized || !currentDraft) return;

    const timer = setTimeout(() => {
      const numericAmt = Number(amount.replace(/,/g, '')) || 0;
      updateDraft({
        dealType: dealType || undefined,
        dealTypeLabel: dealType ? DealHelper.getDealTypeConfig(dealType).name : undefined,
        amount: numericAmt > 0 ? numericAmt : undefined,
        discountCode: discountCode || undefined,
        recipient: {
          bank: recipient.bank || undefined,
          accountNumber: recipient.accountNumber || undefined,
          accountHolder: recipient.accountHolder || undefined,
          isVerified: recipient.isVerified,
        },
        senderName: senderName || undefined,
        documents: attachments
          .filter((a) => a.uploadStatus === 'completed')
          .map((a) => ({
            id: a.id,
            name: a.name,
            type: a.type,
            size: a.file.size,
            base64Data: a.base64Data,
            fileKey: a.fileKey,
          })),
      });
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealType, amount, discountCode, recipient, senderName, attachments, draftInitialized]);

  useEffect(() => {
    if (mounted && _hasHydrated && !isLoggedIn) {
      router.replace('/auth/login');
    }
  }, [mounted, _hasHydrated, isLoggedIn, router]);

  if (!mounted || !_hasHydrated || !isLoggedIn || !currentUser) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400" />
      </div>
    );
  }

  const numericAmount = Number(amount.replace(/,/g, '')) || 0;
  const { feeAmount, totalAmount, finalAmount } = DealHelper.calculateTotal(
    numericAmount,
    currentUser?.feeRate || 0,
    0
  );

  // 한도 검증을 위한 사용자 데이터 조회 - DB값을 Single Source of Truth로 사용
  const usedAmount = currentUser.usedAmount || 0;
  const monthlyLimit = currentUser?.monthlyLimit || 20000000;
  const remainingLimit = Math.max(monthlyLimit - usedAmount, 0);
  const isOverLimit = numericAmount > remainingLimit;
  const wouldExceedLimit = usedAmount + numericAmount > monthlyLimit;

  const dealTypes = Object.entries(DealHelper.DEAL_TYPE_CONFIG).map(([key, config]) => ({
    type: key as TDealType,
    ...config,
  }));

  const selectedTypeConfig = dealType ? DealHelper.getDealTypeConfig(dealType) : null;

  const formatAmount = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, '');
    if (!numericValue) return '';
    return Number(numericValue).toLocaleString('ko-KR');
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const maxFiles = 10;
    const validFiles: { file: File; id: string; preview: string }[] = [];

    for (const file of Array.from(files)) {
      // 최대 파일 개수 검증
      if (attachments.length + validFiles.length >= maxFiles) {
        alert(`최대 ${maxFiles}개까지만 첨부할 수 있습니다.`);
        break;
      }

      // 파일 검증 (타입 + 크기)
      const validation = validateFile(file);
      if (!validation.valid) {
        alert(`${file.name}: ${validation.error}`);
        continue;
      }

      // 이미지 파일인 경우 미리보기 URL 생성
      const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : '';

      validFiles.push({
        file,
        id: crypto.randomUUID(),
        preview,
      });
    }

    // 파일 추가 (pending 상태로)
    const newAttachments: AttachmentFile[] = validFiles.map(({ file, id, preview }) => ({
      id,
      file,
      name: file.name,
      type: file.type,
      preview,
      uploadStatus: 'pending' as const,
    }));

    setAttachments((prev) => [...prev, ...newAttachments]);
    e.target.value = '';

    // S3에 업로드 시작 (백그라운드)
    for (const attachment of newAttachments) {
      uploadFileToS3(attachment);
    }
  };

  // S3 업로드 함수
  const uploadFileToS3 = async (attachment: AttachmentFile) => {
    setUploadingCount((prev) => prev + 1);

    // 상태를 uploading으로 변경
    setAttachments((prev) =>
      prev.map((a) =>
        a.id === attachment.id ? { ...a, uploadStatus: 'uploading' as const, uploadProgress: 0 } : a
      )
    );

    try {
      const result = await uploadFile(
        attachment.file,
        'temp', // 임시 업로드, 거래 생성 시 실제 경로로 이동
        undefined,
        {
          onProgress: (progress) => {
            setAttachments((prev) =>
              prev.map((a) =>
                a.id === attachment.id ? { ...a, uploadProgress: progress.percentage } : a
              )
            );
          },
        }
      );

      // 업로드 성공
      setAttachments((prev) =>
        prev.map((a) =>
          a.id === attachment.id
            ? { ...a, uploadStatus: 'completed' as const, fileKey: result.fileKey, uploadProgress: 100 }
            : a
        )
      );
    } catch (error) {
      console.error('파일 업로드 실패:', error);

      // 업로드 실패 - Base64 폴백 시도
      try {
        const base64Data = await fileToBase64(attachment.file);
        setAttachments((prev) =>
          prev.map((a) =>
            a.id === attachment.id
              ? { ...a, uploadStatus: 'completed' as const, base64Data }
              : a
          )
        );
      } catch {
        // Base64도 실패하면 에러 상태로
        setAttachments((prev) =>
          prev.map((a) =>
            a.id === attachment.id ? { ...a, uploadStatus: 'error' as const } : a
          )
        );
      }
    } finally {
      setUploadingCount((prev) => prev - 1);
    }
  };

  const removeAttachment = (id: string) => {
    const file = attachments.find((f) => f.id === id);
    if (!file) return;

    if (confirm(`${file.name} 삭제하시겠습니까?`)) {
      setAttachments((prev) => {
        const fileToRemove = prev.find((f) => f.id === id);
        if (fileToRemove?.preview) {
          URL.revokeObjectURL(fileToRemove.preview);
        }
        return prev.filter((f) => f.id !== id);
      });
    }
  };

  // 은행별 계좌번호 자릿수 검증
  const validateAccountNumber = (bank: string, accountNumber: string): boolean => {
    const digits = accountNumber.replace(/[^0-9]/g, '');
    const bankFormats: Record<string, number[]> = {
      '국민은행': [14],
      '신한은행': [11, 12],
      '우리은행': [13],
      '하나은행': [14],
      '농협은행': [13, 14],
      'NH농협': [13, 14],
      '기업은행': [14],
      'IBK기업은행': [14],
      '카카오뱅크': [13],
      '토스뱅크': [12],
      'SC제일은행': [11],
      '씨티은행': [13],
      '케이뱅크': [13],
      '수협은행': [13, 14],
      '대구은행': [13],
      '부산은행': [13],
      '광주은행': [13],
      '경남은행': [13],
      '전북은행': [13],
      '제주은행': [13],
      '새마을금고': [13, 14],
      '신협': [13, 14],
      '우체국': [14],
    };
    
    const validLengths = bankFormats[bank];
    if (!validLengths) return digits.length >= 10 && digits.length <= 16;
    return validLengths.includes(digits.length);
  };

  const handleVerifyAccount = async () => {
    setIsLoading(true);
    setVerificationFailed(false);
    setVerificationError('');
    setVerifiedHolderName('');

    // 기본 입력값 확인
    if (!recipient.bank || !recipient.accountNumber || !recipient.accountHolder) {
      setVerificationFailed(true);
      setVerificationError('은행, 계좌번호, 예금주를 모두 입력해주세요.');
      setIsLoading(false);
      return;
    }

    try {
      // 팝빌 계좌 예금주 조회 API 호출
      const response = await fetch('/api/popbill/account/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankName: recipient.bank,
          accountNumber: recipient.accountNumber,
          accountHolder: recipient.accountHolder,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        // API 오류
        setVerificationFailed(true);
        setVerificationError(result.error?.message || '계좌 조회에 실패했습니다.');
        setIsLoading(false);
        return;
      }

      // 실제 예금주명 저장
      setVerifiedHolderName(result.data.accountHolder);

      // 예금주 일치 여부 확인
      if (result.data.isMatch) {
        // 일치: 인증 성공
        setRecipient({
          ...recipient,
          isVerified: true,
          verifiedAt: new Date().toISOString(),
        });
      } else {
        // 불일치: 인증 실패, 실제 예금주 안내
        setVerificationFailed(true);
        setVerificationError(
          `입력한 예금주(${recipient.accountHolder})와 실제 예금주(${result.data.accountHolder})가 일치하지 않습니다. 예금주명을 수정해주세요.`
        );
      }
    } catch (error) {
      console.error('계좌 인증 오류:', error);
      setVerificationFailed(true);
      setVerificationError('계좌 조회 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!dealType) return;

    // 업로드 중인 파일이 있는지 확인
    if (uploadingCount > 0) {
      alert('파일 업로드가 완료될 때까지 기다려주세요.');
      return;
    }

    // 업로드 실패한 파일이 있는지 확인
    const failedUploads = attachments.filter((a) => a.uploadStatus === 'error');
    if (failedUploads.length > 0) {
      alert('업로드에 실패한 파일이 있습니다. 파일을 삭제하고 다시 시도해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      // S3 파일 키 또는 Base64 데이터 수집
      const attachmentData = attachments
        .filter((a) => a.uploadStatus === 'completed')
        .map((a) => a.fileKey || a.base64Data || a.name);

      const dealData = {
        dealName: `${selectedTypeConfig?.name} - ${recipient.accountHolder}`,
        dealType,
        amount: numericAmount,
        recipient: {
          bank: recipient.bank,
          accountNumber: recipient.accountNumber,
          accountHolder: recipient.accountHolder,
          isVerified: recipient.isVerified,
        },
        senderName: senderName || currentUser?.name || '',
        attachments: attachmentData,
      };

      console.log('[NewDeal] Creating deal with data:', JSON.stringify(dealData, null, 2));
      const response = await dealsAPI.create(dealData);
      console.log('[NewDeal] API response:', { did: response.deal?.did, status: response.deal?.status, isPaid: response.deal?.isPaid });

      // Draft 제출 완료 후 삭제
      submitDraft();

      // API 응답에 누락된 필드가 있을 수 있으므로 보낸 데이터와 병합
      // status는 항상 'awaiting_payment'로 설정 (결제 전이므로)
      const completeDeal = {
        ...response.deal,
        did: response.deal.did,
        uid: response.deal.uid || currentUser?.uid,
        status: 'awaiting_payment' as const, // 항상 결제대기 상태
        dealType: response.deal.dealType || dealData.dealType,
        dealName: response.deal.dealName || dealData.dealName,
        amount: response.deal.amount || dealData.amount,
        recipient: response.deal.recipient || dealData.recipient,
        attachments: response.deal.attachments || dealData.attachments,
        senderName: response.deal.senderName || dealData.senderName,
        history: response.deal.history || [],
        isPaid: false, // 항상 미결제 상태
        isTransferred: false,
        feeRate: response.deal.feeRate ?? (currentUser?.feeRate || 0),
        feeAmount: response.deal.feeAmount ?? feeAmount,
        totalAmount: response.deal.totalAmount ?? totalAmount,
        finalAmount: response.deal.finalAmount ?? finalAmount,
        discountAmount: response.deal.discountAmount ?? 0,
        createdAt: response.deal.createdAt || new Date().toISOString(),
        updatedAt: response.deal.updatedAt || new Date().toISOString(),
      };

      // store에 추가 (백엔드 응답 기반)
      addDeal(completeDeal);

      router.replace(`/deals/${response.deal.did}`);
    } catch (error: unknown) {
      console.error('거래 생성 실패:', error);
      alert(getErrorMessage(error) || '거래 생성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const isBelowMinimum = numericAmount > 0 && numericAmount < MIN_AMOUNT;
  const canProceedAmount = numericAmount >= MIN_AMOUNT && !isOverLimit;
  const canProceedRecipient =
    recipient.bank &&
    recipient.accountNumber.length >= 10 &&
    recipient.accountHolder &&
    recipient.isVerified;
  const canProceedDocs = attachments.length > 0 &&
    attachments.every((a) => a.uploadStatus === 'completed') &&
    uploadingCount === 0;

  const getStepTitle = () => {
    switch (step) {
      case 'type': return '거래 유형 선택';
      case 'amount': return '송금 금액 입력';
      case 'recipient': return '수취인 정보';
      case 'docs': return '서류 첨부';
      case 'confirm': return '거래 확인';
    }
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      <Header
        title={getStepTitle()}
        showBack
        onBack={() => {
          if (step === 'amount') handleStepChange('type');
          else if (step === 'recipient') handleStepChange('amount');
          else if (step === 'docs') handleStepChange('recipient');
          else if (step === 'confirm') handleStepChange('docs');
          else router.back();
        }}
      />

      {/* Progress */}
      <div className="px-5 py-4">
        <div className="flex gap-1">
          {['type', 'amount', 'recipient', 'docs', 'confirm'].map((s, i) => (
            <div
              key={s}
              className={cn(
                'flex-1 h-1 rounded-full',
                ['type', 'amount', 'recipient', 'docs', 'confirm'].indexOf(step) >= i
                  ? 'bg-primary-400'
                  : 'bg-gray-200'
              )}
            />
          ))}
        </div>
      </div>

      <div className="px-5">
        {/* Step 1: 거래 유형 */}
        {step === 'type' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              어떤 거래인가요?
            </h2>
            <p className="text-gray-500 mb-6">
              거래 유형에 따라 필요한 서류가 달라집니다.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {dealTypes.filter(item => item && item.name).map((item) => (
                <button
                  key={item.type}
                  onClick={() => {
                    setDealType(item.type);
                    handleStepChange('amount');
                  }}
                  className={cn(
                    'p-4 rounded-xl border-2 text-left transition-colors',
                    dealType === item.type
                      ? 'border-primary-400 bg-primary-50'
                      : 'border-gray-100 hover:border-gray-200'
                  )}
                >
                  <p className="font-semibold text-gray-900 mb-1">{item.name}</p>
                  <p className="text-xs text-gray-500 line-clamp-2">{item.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: 금액 */}
        {step === 'amount' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              얼마를 송금하시나요?
            </h2>
            <p className="text-gray-500 mb-6">
              송금하실 금액을 입력해주세요.
            </p>

            <div className="bg-gray-50 rounded-2xl p-5 mb-4">
              <label className="block text-sm text-gray-500 mb-2">송금 금액</label>
              <div className="relative">
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(formatAmount(e.target.value))}
                  placeholder="0"
                  className={cn(
                    "w-full text-3xl font-bold bg-transparent border-none outline-none",
                    isOverLimit ? "text-red-500" : isBelowMinimum ? "text-yellow-600" : "text-gray-900"
                  )}
                />
                <span className="absolute right-0 top-1/2 -translate-y-1/2 text-xl text-gray-400">원</span>
              </div>

              {numericAmount > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-sm text-gray-500 mb-1">
                    <span>수수료 ({currentUser?.feeRate || 0}%)</span>
                    <span>{feeAmount.toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between font-semibold text-gray-900">
                    <span>총 결제금액</span>
                    <span className="text-primary-400">{totalAmount.toLocaleString()}원</span>
                  </div>
                </div>
              )}
            </div>

            {/* 월 한도 현황 */}
            <div className={cn(
              "rounded-xl p-4 mb-6",
              isOverLimit ? "bg-red-50" : "bg-blue-50"
            )}>
              <div className="flex items-center justify-between mb-2">
                <span className={cn(
                  "text-sm font-medium",
                  isOverLimit ? "text-red-700" : "text-blue-700"
                )}>
                  이번 달 한도
                </span>
                <span className={cn(
                  "text-sm",
                  isOverLimit ? "text-red-600" : "text-blue-600"
                )}>
                  {usedAmount.toLocaleString()}원 / {monthlyLimit.toLocaleString()}원
                </span>
              </div>
              <div className="w-full bg-white/50 rounded-full h-2 mb-2">
                <div
                  className={cn(
                    "h-2 rounded-full transition-all",
                    isOverLimit ? "bg-red-400" : "bg-blue-400"
                  )}
                  style={{ width: `${Math.min((usedAmount / monthlyLimit) * 100, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs">
                <span className={isOverLimit ? "text-red-600" : "text-blue-600"}>
                  잔여 한도: {remainingLimit.toLocaleString()}원
                </span>
                {wouldExceedLimit && numericAmount > 0 && (
                  <span className="text-red-600 font-medium">
                    {(numericAmount - remainingLimit).toLocaleString()}원 초과
                  </span>
                )}
              </div>
              {isOverLimit && (
                <div className="mt-3 flex items-start gap-2 text-red-700">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p className="text-xs">
                    월 한도를 초과하여 거래를 진행할 수 없습니다.
                    한도 상향이 필요하시면 고객센터로 문의해 주세요.
                  </p>
                </div>
              )}
            </div>

            {/* 최소 금액 안내 */}
            {isBelowMinimum && (
              <div className="rounded-xl p-4 mb-6 bg-yellow-50">
                <div className="flex items-start gap-2 text-yellow-700">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">
                    최소 송금 금액은 <strong>{MIN_AMOUNT.toLocaleString()}원</strong>입니다.
                  </p>
                </div>
              </div>
            )}

            {/* 선택된 거래 유형 표시 - 클릭 시 이전 페이지로 이동 및 금액 저장 */}
            <button
              onClick={() => {
                if (numericAmount > 0) {
                  updateDraft({ amount: numericAmount });
                }
                setStep('type');
              }}
              className="w-full mb-6 text-left"
            >
              <p className="text-sm text-gray-500 mb-2">거래 유형</p>
              <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 hover:bg-primary-100 transition-colors">
                <p className="font-semibold text-primary-700">
                  {dealTypes.find((t) => t.type === dealType)?.name}
                </p>
              </div>
            </button>

            <button
              onClick={() => handleStepChange('recipient')}
              disabled={!canProceedAmount}
              className="
                w-full h-14
                bg-primary-400 hover:bg-primary-500
                disabled:bg-gray-200 disabled:text-gray-400
                text-white font-semibold text-lg
                rounded-xl transition-colors
              "
            >
              다음
            </button>
          </div>
        )}

        {/* Step 3: 수취인 정보 */}
        {step === 'recipient' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              누구에게 송금하시나요?
            </h2>
            <p className="text-gray-500 mb-6">
              송금받을 분의 계좌 정보를 입력해주세요.
            </p>

            {/* 기존 거래 내역 조회 버튼 */}
            <button
              onClick={handleLoadPreviousAccounts}
              className="w-full mb-6 h-14 bg-primary-400 hover:bg-primary-500 rounded-xl flex items-center justify-center gap-2 transition-colors text-white font-semibold"
            >
              <History className="w-5 h-5" />
              기존 거래 내역 조회
            </button>

            {/* 은행 선택 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                은행 선택
              </label>
              <select
                value={recipient.bank}
                onChange={(e) => {
                  setRecipient({ ...recipient, bank: e.target.value, isVerified: false });
                  setVerificationFailed(false);
                  setVerificationError('');
                  setVerifiedHolderName('');
                }}
                className="
                  w-full h-14 px-4
                  border border-gray-200 rounded-xl
                  focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400
                  bg-white
                "
              >
                <option value="">은행을 선택하세요</option>
                {BANKS.map((bank) => (
                  <option key={bank} value={bank}>{bank}</option>
                ))}
              </select>
            </div>

            {/* 계좌번호 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                계좌번호
              </label>
              <input
                type="text"
                value={recipient.accountNumber}
                onChange={(e) => {
                  setRecipient({
                    ...recipient,
                    accountNumber: e.target.value.replace(/\D/g, ''),
                    isVerified: false
                  });
                  setVerificationFailed(false);
                  setVerificationError('');
                  setVerifiedHolderName('');
                }}
                placeholder="- 없이 숫자만 입력"
                className="
                  w-full h-14 px-4
                  border border-gray-200 rounded-xl
                  focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400
                "
              />
            </div>

            {/* 예금주 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                예금주
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={recipient.accountHolder}
                  onChange={(e) => {
                    setRecipient({
                      ...recipient,
                      accountHolder: e.target.value,
                      isVerified: false
                    });
                    setVerificationFailed(false);
                    setVerificationError('');
                  }}
                  placeholder="예금주명 입력"
                  className="
                    flex-1 h-14 px-4
                    border border-gray-200 rounded-xl
                    focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400
                  "
                />
                <button
                  onClick={handleVerifyAccount}
                  disabled={
                    !recipient.bank ||
                    recipient.accountNumber.length < 10 ||
                    !recipient.accountHolder ||
                    recipient.isVerified ||
                    isLoading
                  }
                  className="
                    h-14 px-5
                    bg-primary-400 hover:bg-primary-500
                    text-white font-semibold
                    rounded-xl transition-colors
                    disabled:bg-gray-200 disabled:text-gray-400
                    whitespace-nowrap
                    flex items-center justify-center gap-2
                  "
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      확인 중...
                    </>
                  ) : recipient.isVerified ? '인증완료' : '계좌확인'}
                </button>
              </div>
            </div>

            {recipient.isVerified && (
              <div className="p-4 bg-green-50 rounded-xl mb-6">
                <p className="text-green-700 font-medium flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  계좌 확인이 완료되었습니다.
                </p>
              </div>
            )}

            {verificationFailed && (
              <div className="p-4 bg-red-50 rounded-xl mb-6">
                <div className="flex items-start gap-2">
                  <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-700 font-medium">계좌 확인 실패</p>
                    {verificationError && (
                      <p className="text-sm text-red-600 mt-1">{verificationError}</p>
                    )}
                    {verifiedHolderName && !recipient.isVerified && (
                      <button
                        onClick={() => {
                          setRecipient({ ...recipient, accountHolder: verifiedHolderName, isVerified: false });
                          setVerificationFailed(false);
                          setVerificationError('');
                        }}
                        className="mt-2 text-sm text-red-700 underline hover:no-underline"
                      >
                        실제 예금주({verifiedHolderName})로 자동 수정
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 보내는 분 이름 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                보내는 분 이름 (선택)
              </label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder={currentUser?.name || ''}
                className="
                  w-full h-14 px-4
                  border border-gray-200 rounded-xl
                  focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400
                "
              />
              <p className="text-xs text-gray-400 mt-1">
                입금자명으로 표시됩니다. 미입력시 회원명이 사용됩니다.
              </p>
            </div>

            <button
              onClick={() => handleStepChange('docs')}
              disabled={!canProceedRecipient}
              className="
                w-full h-14
                bg-primary-400 hover:bg-primary-500
                disabled:bg-gray-200 disabled:text-gray-400
                text-white font-semibold text-lg
                rounded-xl transition-colors
              "
            >
              다음
            </button>
          </div>
        )}

        {/* Step 4: 서류 첨부 */}
        {step === 'docs' && selectedTypeConfig && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              증빙 서류를 첨부해주세요
            </h2>
            <p className="text-gray-500 mb-6">
              {selectedTypeConfig.description}
            </p>

            {/* 필수 서류 안내 */}
            <div className="bg-primary-50 rounded-xl p-4 mb-6">
              <p className="font-medium text-primary-700 mb-2">필수 서류</p>
              <ul className="text-sm text-primary-600 space-y-1">
                {selectedTypeConfig.requiredDocs.map((doc, i) => (
                  <li key={i}>• {doc}</li>
                ))}
              </ul>
              {selectedTypeConfig.optionalDocs.length > 0 && (
                <>
                  <p className="font-medium text-primary-700 mt-3 mb-2">선택 서류</p>
                  <ul className="text-sm text-primary-600 space-y-1">
                    {selectedTypeConfig.optionalDocs.map((doc, i) => (
                      <li key={i}>• {doc}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            {/* 파일 업로드 */}
            <label className="
              flex flex-col items-center justify-center
              w-full h-32
              border-2 border-dashed border-gray-200 rounded-xl
              cursor-pointer hover:border-primary-400 transition-colors
              mb-4
            ">
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-500">탭하여 파일 선택</span>
              <span className="text-xs text-gray-400 mt-1">개별 파일 50MB 이하</span>
              <input
                type="file"
                multiple
                accept="image/*,.heic,.heif,.pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>

            {/* 파일 미리보기 */}
            {attachments.length > 0 && (
              <div className="mb-6">
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 lg:mx-0 lg:px-0 scrollbar-hide">
                  {attachments.map((file) => (
                    <div
                      key={file.id}
                      className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex-shrink-0 cursor-pointer group"
                      onClick={() => setPreviewFile(file)}
                    >
                      {/* 이미지 미리보기 */}
                      {file.type.startsWith('image/') && file.preview ? (
                        <img
                          src={file.preview}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        // 비이미지 파일 (PDF 등)
                        <div className="w-full h-full flex flex-col items-center justify-center bg-blue-50">
                          <FileText className="w-6 h-6 text-blue-500" />
                          <span className="text-xs text-gray-500 mt-0.5">
                            {file.type === 'application/pdf'
                              ? 'PDF'
                              : file.name.split('.').pop()?.toUpperCase() || 'FILE'}
                          </span>
                        </div>
                      )}

                      {/* 업로드 진행률 오버레이 */}
                      {(file.uploadStatus === 'uploading' || file.uploadStatus === 'pending') && (
                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-20">
                          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          {file.uploadProgress !== undefined && (
                            <span className="text-white text-xs mt-1">{file.uploadProgress}%</span>
                          )}
                        </div>
                      )}

                      {/* 업로드 에러 오버레이 */}
                      {file.uploadStatus === 'error' && (
                        <div className="absolute inset-0 bg-red-500/70 flex items-center justify-center z-20">
                          <AlertCircle className="w-6 h-6 text-white" />
                        </div>
                      )}

                      {/* 삭제 버튼 - 최상위 z-index */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAttachment(file.id);
                        }}
                        className="absolute top-1 right-1 w-5 h-5 bg-primary-400 hover:bg-primary-500 rounded-full flex items-center justify-center transition-colors z-30"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>

                      {/* 미리보기 아이콘 오버레이 (완료된 파일만) */}
                      {file.uploadStatus === 'completed' && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-colors z-5">
                          <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {/* 파일 개수 및 업로드 상태 안내 */}
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-500">
                    {attachments.length}/10
                  </p>
                  {uploadingCount > 0 && (
                    <p className="text-xs text-primary-500">
                      {uploadingCount}개 파일 업로드 중...
                    </p>
                  )}
                  {uploadingCount === 0 && attachments.some((a) => a.uploadStatus === 'error') && (
                    <p className="text-xs text-red-500">
                      업로드 실패한 파일이 있습니다
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* 미리보기 팝업 */}
            {previewFile && (
              <div
                className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
                onClick={() => setPreviewFile(null)}
              >
                <div
                  className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* 팝업 헤더 */}
                  <div className="sticky top-0 flex items-center justify-between p-4 border-b border-gray-200 bg-white rounded-t-2xl">
                    <h3 className="font-semibold text-gray-900 truncate text-sm">
                      {previewFile.name}
                    </h3>
                    <button
                      onClick={() => setPreviewFile(null)}
                      className="flex-shrink-0 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>

                  {/* 팝업 컨텐츠 */}
                  <div className="p-4">
                    {previewFile.type.startsWith('image/') && previewFile.preview ? (
                      // 이미지 미리보기
                      <img
                        src={previewFile.preview}
                        alt={previewFile.name}
                        className="w-full rounded-lg"
                      />
                    ) : previewFile.type === 'application/pdf' ? (
                      // PDF 미리보기
                      <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg">
                        <FileText className="w-16 h-16 text-blue-500 mb-4" />
                        <p className="text-gray-900 font-semibold mb-2">PDF 파일</p>
                        <p className="text-gray-500 text-sm mb-6 text-center">
                          {previewFile.name}
                        </p>
                        <a
                          href={URL.createObjectURL(previewFile.file)}
                          download={previewFile.name}
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
                        <p className="text-gray-900 font-semibold mb-2">
                          {previewFile.name.split('.').pop()?.toUpperCase()} 파일
                        </p>
                        <p className="text-gray-500 text-sm mb-6 text-center">
                          {previewFile.name}
                        </p>
                        <a
                          href={URL.createObjectURL(previewFile.file)}
                          download={previewFile.name}
                          className="flex items-center gap-2 px-4 py-2 bg-primary-400 hover:bg-primary-500 text-white rounded-lg transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          다운로드
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => handleStepChange('confirm')}
              disabled={!canProceedDocs}
              className="
                w-full h-14
                bg-primary-400 hover:bg-primary-500
                disabled:bg-gray-200 disabled:text-gray-400
                text-white font-semibold text-lg
                rounded-xl transition-colors
              "
            >
              다음
            </button>
          </div>
        )}

        {/* Step 5: 확인 */}
        {step === 'confirm' && selectedTypeConfig && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              거래 내용을 확인해주세요
            </h2>

            <div className="space-y-4">
              {/* 거래 유형 */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500 mb-1">거래 유형</p>
                <p className="font-semibold text-gray-900">{selectedTypeConfig.name}</p>
              </div>

              {/* 금액 정보 */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500 mb-2">결제 정보</p>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">송금 금액</span>
                    <span className="font-medium">{numericAmount.toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">수수료 ({currentUser?.feeRate || 0}%)</span>
                    <span className="font-medium">{feeAmount.toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
                    <span className="font-semibold">총 결제금액</span>
                    <span className="font-bold text-primary-400">{totalAmount.toLocaleString()}원</span>
                  </div>
                </div>
              </div>

              {/* 수취인 정보 */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500 mb-2">수취인 정보</p>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">은행</span>
                    <span className="font-medium">{recipient.bank}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">계좌번호</span>
                    <span className="font-medium">{recipient.accountNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">예금주</span>
                    <span className="font-medium">{recipient.accountHolder}</span>
                  </div>
                </div>
              </div>

              {/* 첨부 서류 */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500 mb-1">첨부 서류</p>
                <p className="font-semibold text-gray-900">{attachments.length}개 파일</p>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="
                w-full h-14 mt-6
                bg-primary-400 hover:bg-primary-500
                disabled:bg-gray-200 disabled:text-gray-400
                text-white font-semibold text-lg
                rounded-xl transition-colors
                flex items-center justify-center gap-2
              "
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  신청 중...
                </>
              ) : '거래 신청하기'}
            </button>
          </div>
        )}
      </div>

      {/* 기존 거래 내역 조회 모달 */}
      <Modal
        isOpen={showPreviousAccounts}
        onClose={() => setShowPreviousAccounts(false)}
        title="기존 거래 내역"
      >
        {previousAccounts.length > 0 ? (
          <div className="space-y-3">
            {previousAccounts.map((account, index) => (
              <button
                key={`${account.bank}-${account.accountNumber}`}
                onClick={() => handleSelectPreviousAccount(account)}
                className="w-full text-left p-4 border border-gray-200 rounded-xl hover:border-primary-400 hover:bg-primary-50 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">{account.accountHolder}</p>
                    <p className="text-sm text-gray-500">{account.bank} {account.accountNumber}</p>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>거래: {account.dealCount}건</span>
                  <span>총액: {(account.totalAmount / 10000).toLocaleString()}만원</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">거래 내역이 없습니다.</p>
        )}
      </Modal>
    </div>
  );
}

export default function NewDealPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400" />
      </div>
    }>
      <NewDealContent />
    </Suspense>
  );
}
