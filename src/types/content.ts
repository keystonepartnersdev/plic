// src/types/content.ts

export interface IHomeBanner {
  bannerId: string;
  title: string;
  imageUrl: string;  // Blob URL
  linkUrl: string;
  linkTarget: '_self' | '_blank';
  isVisible: boolean;
  priority: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
}

export interface INotice {
  noticeId: string;
  title: string;
  content: string;
  isVisible: boolean;
  isPinned: boolean;
  priority: number;
  viewCount: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
}

export interface IFAQ {
  faqId: string;
  question: string;
  answer: string;
  category?: string;
  isVisible: boolean;
  isHomeFeatured?: boolean; // 홈 화면에 노출 여부
  priority: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
}
