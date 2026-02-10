// src/classes/DealHelper.ts

import { IDeal, TDealType, TDealStatus } from '@/types/deal';

interface IDealTypeConfig {
  name: string;
  icon: string;
  requiredDocs: string[];
  optionalDocs: string[];
  description: string;
}

interface IStatusConfig {
  name: string;
  color: string;
  tab: 'progress' | 'revision' | 'completed';
}

export class DealHelper {
  // 거래 종류 설정
  static DEAL_TYPE_CONFIG: Record<TDealType, IDealTypeConfig> = {
    product_purchase: {
      name: '물품매입',
      icon: 'Package',
      requiredDocs: ['세금계산서 또는 거래명세서'],
      optionalDocs: ['물품 사진', '발주서'],
      description: '물품 구매를 증명할 수 있는 서류를 첨부해주세요.',
    },
    labor_cost: {
      name: '인건비',
      icon: 'Users',
      requiredDocs: ['급여명세서 또는 인건비 지급 내역서'],
      optionalDocs: ['근로계약서', '4대보험 가입증명원'],
      description: '인건비 지급 대상과 금액을 확인할 수 있는 서류를 첨부해주세요.',
    },
    service_fee: {
      name: '용역대금',
      icon: 'FileText',
      requiredDocs: ['용역계약서 또는 세금계산서'],
      optionalDocs: ['용역 완료 보고서', '견적서'],
      description: '용역 계약 내용을 확인할 수 있는 서류를 첨부해주세요.',
    },
    construction: {
      name: '공사대금',
      icon: 'HardHat',
      requiredDocs: ['공사계약서 또는 세금계산서'],
      optionalDocs: ['공사 견적서', '공정표', '현장 사진'],
      description: '공사 계약 및 진행 내용을 확인할 수 있는 서류를 첨부해주세요.',
    },
    rent: {
      name: '임대료',
      icon: 'Building2',
      requiredDocs: ['임대차계약서'],
      optionalDocs: ['사업자등록증', '임대료 청구서'],
      description: '임대차 계약 내용을 확인할 수 있는 서류를 첨부해주세요.',
    },
    monthly_rent: {
      name: '월세',
      icon: 'Home',
      requiredDocs: ['임대차계약서'],
      optionalDocs: ['월세 납부 영수증'],
      description: '월세 계약 내용을 확인할 수 있는 서류를 첨부해주세요.',
    },
    maintenance: {
      name: '관리비',
      icon: 'Wrench',
      requiredDocs: ['관리비 고지서 또는 청구서'],
      optionalDocs: ['관리비 내역서'],
      description: '관리비 청구 내역을 확인할 수 있는 서류를 첨부해주세요.',
    },
    deposit: {
      name: '보증금',
      icon: 'ShieldCheck',
      requiredDocs: ['임대차계약서 또는 보증금 약정서'],
      optionalDocs: ['부동산 등기부등본'],
      description: '보증금 계약 내용을 확인할 수 있는 서류를 첨부해주세요.',
    },
    advertising: {
      name: '광고비',
      icon: 'Megaphone',
      requiredDocs: ['광고계약서 또는 세금계산서'],
      optionalDocs: ['광고 시안', '매체 게재 확인서'],
      description: '광고 계약 내용을 확인할 수 있는 서류를 첨부해주세요.',
    },
    shipping: {
      name: '운송비',
      icon: 'Truck',
      requiredDocs: ['운송계약서 또는 운송장'],
      optionalDocs: ['화물 인수증'],
      description: '운송 내역을 확인할 수 있는 서류를 첨부해주세요.',
    },
    rental: {
      name: '렌트/렌탈',
      icon: 'Car',
      requiredDocs: ['렌탈계약서 또는 리스계약서'],
      optionalDocs: ['렌탈료 청구서'],
      description: '렌탈/리스 계약 내용을 확인할 수 있는 서류를 첨부해주세요.',
    },
    etc: {
      name: '기타',
      icon: 'MoreHorizontal',
      requiredDocs: ['거래 증빙 서류'],
      optionalDocs: ['계약서', '청구서', '세금계산서'],
      description: '거래 내용을 증명할 수 있는 관련 서류를 첨부해주세요.',
    },
  };

  // 거래 상태 설정
  static STATUS_CONFIG: Record<TDealStatus, IStatusConfig> = {
    draft: { name: '작성중', color: 'orange', tab: 'progress' },
    awaiting_payment: { name: '결제대기', color: 'orange', tab: 'progress' },
    pending: { name: '진행중', color: 'blue', tab: 'progress' },
    reviewing: { name: '검토중', color: 'yellow', tab: 'progress' },
    hold: { name: '보류', color: 'orange', tab: 'progress' },
    need_revision: { name: '보완필요', color: 'red', tab: 'revision' },
    cancelled: { name: '거래취소', color: 'gray', tab: 'completed' },
    completed: { name: '거래완료', color: 'green', tab: 'completed' },
  };

  // DID 생성
  static generateDID(): string {
    const date = new Date();
    const yy = date.getFullYear().toString().slice(-2);
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `D${yy}${mm}${dd}${random}`;
  }

  // 파일 -> Blob URL 변환 (업로드 시뮬레이션)
  static createPreviewUrl(file: File): string {
    return URL.createObjectURL(file);
  }

  // Blob URL 해제 (메모리 관리)
  static revokePreviewUrl(url: string): void {
    URL.revokeObjectURL(url);
  }

  // 수수료 및 총액 계산
  static calculateTotal(amount: number, feeRate: number, discountAmount: number = 0) {
    const feeAmount = Math.floor(amount * (feeRate / 100));
    const totalAmount = amount + feeAmount;
    const finalAmount = totalAmount - discountAmount;
    return { feeAmount, totalAmount, finalAmount };
  }

  // 히스토리 추가
  static addHistory(
    deal: IDeal,
    action: string,
    description: string,
    actor: 'user' | 'system' | 'admin',
    actorId?: string
  ): IDeal {
    return {
      ...deal,
      history: [
        {
          timestamp: new Date().toISOString(),
          action,
          description,
          actor,
          actorId,
        },
        ...(deal.history || []),
      ],
      updatedAt: new Date().toISOString(),
    };
  }

  // 거래 종류 설정 반환
  static getDealTypeConfig(dealType: TDealType): IDealTypeConfig {
    return this.DEAL_TYPE_CONFIG[dealType];
  }

  // 거래 상태 설정 반환
  static getStatusConfig(status: TDealStatus): IStatusConfig {
    return this.STATUS_CONFIG[status];
  }
}
