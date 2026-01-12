// src/classes/ContentHelper.ts

import { IHomeBanner, INotice, IFAQ } from '@/types/content';

export class ContentHelper {
  static generateBannerId(): string {
    return `BNR${Date.now().toString(36).toUpperCase()}`;
  }

  static generateNoticeId(): string {
    return `NTC${Date.now().toString(36).toUpperCase()}`;
  }

  static generateFAQId(): string {
    return `FAQ${Date.now().toString(36).toUpperCase()}`;
  }

  static FAQ_CATEGORIES = [
    { id: 'service', name: '서비스 이용' },
    { id: 'payment', name: '결제/수수료' },
    { id: 'account', name: '계정/회원' },
    { id: 'transfer', name: '송금/입금' },
    { id: 'etc', name: '기타' },
  ];

  // 신규 배너 생성
  static createNewBanner(
    title: string,
    imageUrl: string,
    linkUrl: string,
    createdBy: string,
    options?: {
      linkTarget?: '_self' | '_blank';
      priority?: number;
      startDate?: string;
      endDate?: string;
    }
  ): IHomeBanner {
    const now = new Date().toISOString();
    return {
      bannerId: this.generateBannerId(),
      title,
      imageUrl,
      linkUrl,
      linkTarget: options?.linkTarget || '_self',
      isVisible: true,
      priority: options?.priority || 0,
      startDate: options?.startDate,
      endDate: options?.endDate,
      createdAt: now,
      createdBy,
      updatedAt: now,
    };
  }

  // 신규 공지사항 생성
  static createNewNotice(
    title: string,
    content: string,
    createdBy: string,
    options?: {
      isPinned?: boolean;
      priority?: number;
    }
  ): INotice {
    const now = new Date().toISOString();
    return {
      noticeId: this.generateNoticeId(),
      title,
      content,
      isVisible: true,
      isPinned: options?.isPinned || false,
      priority: options?.priority || 0,
      viewCount: 0,
      createdAt: now,
      createdBy,
      updatedAt: now,
    };
  }

  // 신규 FAQ 생성
  static createNewFAQ(
    question: string,
    answer: string,
    createdBy: string,
    options?: {
      category?: string;
      priority?: number;
      isHomeFeatured?: boolean;
    }
  ): IFAQ {
    const now = new Date().toISOString();
    return {
      faqId: this.generateFAQId(),
      question,
      answer,
      category: options?.category,
      isVisible: true,
      isHomeFeatured: options?.isHomeFeatured || false,
      priority: options?.priority || 0,
      createdAt: now,
      createdBy,
      updatedAt: now,
    };
  }
}
