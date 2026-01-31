/**
 * API 응답 타입 정의
 *
 * 모든 API 호출은 이 타입을 사용하여 타입 안전성 확보
 */

import { IUser } from './user';
import { IDeal } from './deal';
import { IPayment } from './payment';
import { IHomeBanner, INotice, IFAQ } from './content';
import { IDiscount } from './discount';
import { IAdmin } from './admin';

// ===== 공통 응답 구조 =====

export interface ApiResponse<T> {
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ===== 인증 API =====

export interface LoginRequest {
  phone: string;
  verificationCode?: string;
}

export interface LoginResponse {
  token: string;
  user: IUser;
  isNewUser: boolean;
}

export interface SignupRequest {
  phone: string;
  name: string;
  email?: string;
  agreeTerms: boolean;
  agreePrivacy: boolean;
  agreeMarketing?: boolean;
}

export interface SignupResponse {
  token: string;
  user: IUser;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

// ===== 사용자 API =====

export interface GetUserResponse extends IUser {}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  bankCode?: string;
  accountNumber?: string;
}

export interface UpdateUserResponse extends IUser {}

export interface UserGradeResponse {
  grade: IUser['grade'];
  feeRate: number;
  monthlyLimit: number;
  perDealLimit: number;
  totalDealAmount: number;
  totalDealCount: number;
}

// ===== 거래 API =====

export interface CreateDealRequest {
  type: 'personal' | 'business';
  amount: number;
  recipientName: string;
  recipientPhone: string;
  recipientBankCode: string;
  recipientAccount: string;
  businessNumber?: string;
  files?: string[]; // S3 URLs
}

export interface CreateDealResponse extends IDeal {}

export interface ListDealsRequest {
  status?: IDeal['status'];
  page?: number;
  limit?: number;
}

export interface ListDealsResponse extends PaginatedResponse<IDeal> {}

export interface GetDealResponse extends IDeal {}

export interface CancelDealRequest {
  reason?: string;
}

export interface CancelDealResponse {
  success: boolean;
  deal: IDeal;
}

// ===== 결제 API =====

export interface CreatePaymentRequest {
  dealId: string;
  method: 'card' | 'billing';
  billingKeyId?: string;
}

export interface CreatePaymentResponse extends IPayment {}

export interface PaymentCallbackData {
  trxId: string;
  status: 'success' | 'failed';
  message?: string;
  trackId?: string;
  amount?: number;
}

export interface BillingKeyCreateRequest {
  payerName: string;
  payerEmail: string;
  payerTel: string;
  device?: 'mobile' | 'pc';
  userId?: string;
}

export interface BillingKeyCreateResponse {
  trackId: string;
  payUrl: string;
}

export interface BillingKeyPayRequest {
  billingKey: string;
  amount: number;
  goodsName: string;
  payerName?: string;
  payerEmail?: string;
  payerTel?: string;
  dealId?: string;
  userId?: string;
}

export interface BillingKeyPayResponse {
  success: boolean;
  trxId: string;
  trackId: string;
  amount: number;
  transactionDate?: string;
  authCd?: string;
  cardNo?: string;
  issuer?: string;
  dealId?: string;
}

// ===== 할인 API =====

export interface ValidateDiscountRequest {
  code: string;
  dealId?: string;
}

export interface ValidateDiscountResponse {
  valid: boolean;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  discountAmount?: number;
  minAmount?: number;
  maxDiscount?: number;
  message?: string;
}

export interface ListCouponsResponse {
  coupons: Array<{
    couponId: string;
    code: string;
    name: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    maxDiscount?: number;
    minAmount?: number;
    expiresAt: string;
    isUsed: boolean;
  }>;
}

// ===== 컨텐츠 API =====

export interface ListBannersResponse {
  banners: IHomeBanner[];
}

export interface ListNoticesRequest {
  page?: number;
  limit?: number;
}

export interface ListNoticesResponse extends PaginatedResponse<INotice> {}

export interface GetNoticeResponse extends INotice {}

export interface ListFaqsRequest {
  category?: string;
}

export interface ListFaqsResponse {
  faqs: IFAQ[];
}

// ===== 파일 업로드 API =====

export interface PresignedUrlRequest {
  fileName: string;
  fileType: string;
  fileSize: number;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  fileUrl: string;
  key: string;
  expiresIn: number;
}

// ===== 관리자 API =====

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AdminLoginResponse {
  token: string;
  admin: {
    adminId: string;
    email: string;
    name: string;
    role: 'super' | 'manager' | 'viewer';
    status: string;
    isMaster: boolean;
    loginFailCount: number;
    isLocked: boolean;
    createdAt: string;
    createdBy: string;
    updatedAt: string;
  };
}

export interface AdminListUsersRequest {
  search?: string;
  status?: IUser['status'];
  grade?: IUser['grade'];
  page?: number;
  limit?: number;
}

export interface AdminListUsersResponse extends PaginatedResponse<IUser> {}

export interface AdminGetUserRequest {
  userId: string;
}

export interface AdminGetUserResponse extends IUser {
  deals?: IDeal[];
  payments?: IPayment[];
}

export interface AdminUpdateUserRequest {
  status?: IUser['status'];
  grade?: IUser['grade'];
  email?: string;
  name?: string;
}

export interface AdminUpdateUserResponse extends IUser {}

export interface AdminListDealsRequest {
  search?: string;
  status?: IDeal['status'];
  type?: IDeal['type'];
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface AdminListDealsResponse extends PaginatedResponse<IDeal> {}

export interface AdminGetDealResponse extends IDeal {
  user?: IUser;
  payment?: IPayment;
}

export interface AdminUpdateDealRequest {
  status?: IDeal['status'];
  reviewNote?: string;
}

export interface AdminUpdateDealResponse extends IDeal {}

export interface AdminStatsResponse {
  totalUsers: number;
  activeUsers: number;
  totalDeals: number;
  totalAmount: number;
  todayDeals: number;
  todayAmount: number;
  pendingDeals: number;
  completedDeals: number;
  failedDeals: number;
}

// ===== Popbill API (계좌 인증) =====

export interface VerifyBusinessRequest {
  businessNumber: string;
}

export interface VerifyBusinessResponse {
  valid: boolean;
  companyName?: string;
  ceoName?: string;
  message?: string;
}

export interface VerifyAccountRequest {
  bankCode: string;
  accountNumber: string;
  accountHolder: string;
}

export interface VerifyAccountResponse {
  valid: boolean;
  accountHolder?: string;
  bankName?: string;
  message?: string;
}
