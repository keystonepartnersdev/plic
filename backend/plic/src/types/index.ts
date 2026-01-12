// User Types
export type TUserStatus = 'active' | 'suspended' | 'pending' | 'withdrawn';
export type TUserGrade = 'basic' | 'platinum' | 'b2b' | 'employee';
export type TSocialProvider = 'kakao' | 'naver' | 'google' | 'apple' | null;

export interface IUser {
  uid: string;
  name: string;
  phone: string;
  email?: string;
  authType: 'direct' | 'social';
  socialProvider: TSocialProvider;
  socialId?: string;
  isVerified: boolean;
  verifiedAt?: string;
  status: TUserStatus;
  grade: TUserGrade;
  feeRate: number;
  isGradeManual: boolean;
  monthlyLimit: number;
  usedAmount: number;
  agreements: {
    service: boolean;
    privacy: boolean;
    thirdParty: boolean;
    marketing: boolean;
  };
  totalPaymentAmount: number;
  totalDealCount: number;
  lastMonthPaymentAmount: number;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

// Deal Types
export type TDealStatus =
  | 'draft'
  | 'awaiting_payment'
  | 'pending'
  | 'reviewing'
  | 'hold'
  | 'need_revision'
  | 'cancelled'
  | 'completed';

export type TDealType =
  | 'product_purchase'
  | 'labor_cost'
  | 'service_fee'
  | 'construction'
  | 'rent'
  | 'monthly_rent'
  | 'maintenance'
  | 'deposit'
  | 'advertising'
  | 'shipping'
  | 'rental'
  | 'etc';

export interface IDeal {
  did: string;
  uid: string;
  dealName: string;
  dealType: TDealType;
  status: TDealStatus;
  amount: number;
  feeRate: number;
  feeAmount: number;
  totalAmount: number;
  discountCode?: string;
  discountAmount: number;
  finalAmount: number;
  recipient: {
    bank: string;
    accountNumber: string;
    accountHolder: string;
    isVerified: boolean;
  };
  senderName: string;
  attachments: string[];
  isPaid: boolean;
  paidAt?: string;
  isTransferred: boolean;
  transferredAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Admin Types
export type TAdminRole = 'super' | 'operator' | 'cs';
export type TAdminStatus = 'active' | 'inactive' | 'suspended';

export interface IAdmin {
  adminId: string;
  email: string;
  name: string;
  phone?: string;
  role: TAdminRole;
  status: TAdminStatus;
  isMaster: boolean;
  passwordHash: string;
  loginFailCount: number;
  isLocked: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  lastLoginAt?: string;
}

// Discount Types
export type TDiscountType = 'code' | 'coupon';
export type TDiscountValueType = 'amount' | 'feePercent';

export interface IDiscount {
  id: string;
  name: string;
  code?: string;
  type: TDiscountType;
  discountType: TDiscountValueType;
  discountValue: number;
  minAmount: number;
  startDate: string;
  expiry: string;
  canStack: boolean;
  isReusable: boolean;
  isActive: boolean;
  usageCount: number;
  allowedGrades?: TUserGrade[];
  targetGrades?: TUserGrade[];
  targetUserIds?: string[];
  createdAt: string;
  updatedAt: string;
}

// Content Types
export interface IBanner {
  pk: string;
  sk: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  isVisible: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface INotice {
  pk: string;
  sk: string;
  title: string;
  content: string;
  isVisible: boolean;
  isPinned: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface IFAQ {
  pk: string;
  sk: string;
  question: string;
  answer: string;
  category: string;
  isVisible: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}
