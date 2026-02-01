'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, ChevronRight, Search, Copy, Check, Star } from 'lucide-react';
import { Header } from '@/components/common';
import { useUserStore, useDealStore } from '@/stores';
import { tokenManager } from '@/lib/api';
import { cn } from '@/lib/utils';

const API_BASE_URL = 'https://rz3vseyzbe.execute-api.ap-northeast-2.amazonaws.com/Prod';

// 은행 정보
const BANK_INFO: Record<string, { name: string; color: string }> = {
  '신한은행': { name: '신한', color: 'bg-blue-500' },
  '국민은행': { name: '국민', color: 'bg-yellow-500' },
  'KB국민은행': { name: '국민', color: 'bg-yellow-500' },
  '우리은행': { name: '우리', color: 'bg-blue-400' },
  '하나은행': { name: '하나', color: 'bg-green-500' },
  '농협은행': { name: '농협', color: 'bg-green-600' },
  'NH농협': { name: '농협', color: 'bg-green-600' },
  '기업은행': { name: '기업', color: 'bg-blue-600' },
  'IBK기업은행': { name: '기업', color: 'bg-blue-600' },
  '카카오뱅크': { name: '카카오', color: 'bg-yellow-400' },
  '토스뱅크': { name: '토스', color: 'bg-blue-700' },
  '케이뱅크': { name: '케이', color: 'bg-pink-500' },
  '새마을금고': { name: '새마을', color: 'bg-green-700' },
  '신협': { name: '신협', color: 'bg-blue-800' },
  '우체국': { name: '우체국', color: 'bg-orange-500' },
  '수협': { name: '수협', color: 'bg-blue-300' },
  'SC제일은행': { name: 'SC', color: 'bg-green-400' },
  '씨티은행': { name: '씨티', color: 'bg-blue-900' },
  '경남은행': { name: '경남', color: 'bg-red-500' },
  '광주은행': { name: '광주', color: 'bg-red-600' },
  '대구은행': { name: '대구', color: 'bg-blue-500' },
  '부산은행': { name: '부산', color: 'bg-orange-600' },
  '전북은행': { name: '전북', color: 'bg-green-500' },
  '제주은행': { name: '제주', color: 'bg-orange-400' },
};

interface UniqueAccount {
  bank: string;
  accountNumber: string;
  accountHolder: string;
  dealCount: number;
  totalAmount: number;
  lastUsedAt: string;
  isFavorite: boolean;
}

export default function AccountsPage() {
  const router = useRouter();
  const { currentUser, isLoggedIn } = useUserStore();
  const { deals } = useDealStore();

  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [favoriteAccounts, setFavoriteAccounts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch favorite accounts from API
  const fetchFavoriteAccounts = useCallback(async () => {
    const token = tokenManager.getAccessToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/me/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.success && data.data?.favoriteAccounts) {
        setFavoriteAccounts(data.data.favoriteAccounts);
      }
    } catch (error) {
      console.error('Failed to fetch favorite accounts:', error);
      // Fallback to localStorage
      const saved = localStorage.getItem('favoriteAccounts');
      if (saved) {
        try {
          setFavoriteAccounts(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse favorite accounts');
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save favorite accounts to API
  const saveFavoriteAccounts = useCallback(async (newFavorites: string[]) => {
    const token = tokenManager.getAccessToken();
    if (!token) return;

    try {
      await fetch(`${API_BASE_URL}/users/me/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ favoriteAccounts: newFavorites }),
      });
    } catch (error) {
      console.error('Failed to save favorite accounts:', error);
    }
    // Also save to localStorage as fallback
    localStorage.setItem('favoriteAccounts', JSON.stringify(newFavorites));
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchFavoriteAccounts();
  }, [fetchFavoriteAccounts]);

  useEffect(() => {
    if (mounted && !isLoggedIn) {
      router.replace('/auth/login');
    }
  }, [mounted, isLoggedIn, router]);

  // 사용자의 거래 내역에서 고유 계좌 추출
  const uniqueAccounts = useMemo(() => {
    if (!currentUser) return [];

    const userDeals = deals.filter((d) => d.uid === currentUser.uid);
    const accountMap = new Map<string, UniqueAccount>();

    userDeals.forEach((deal) => {
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
          accountHolder: deal.recipient.accountHolder,
          dealCount: 1,
          totalAmount: deal.amount,
          lastUsedAt: deal.createdAt,
          isFavorite: favoriteAccounts.includes(key),
        });
      }
    });

    // 즐겨찾기 우선, 그 다음 최근 사용순 정렬
    return Array.from(accountMap.values()).sort((a, b) => {
      const aKey = `${a.bank}-${a.accountNumber}`;
      const bKey = `${b.bank}-${b.accountNumber}`;
      const aFav = favoriteAccounts.includes(aKey);
      const bFav = favoriteAccounts.includes(bKey);

      if (aFav !== bFav) return aFav ? -1 : 1;
      return new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime();
    });
  }, [deals, currentUser, favoriteAccounts]);

  // 필터링된 계좌
  const filteredAccounts = useMemo(() => {
    if (!searchQuery) return uniqueAccounts;

    const query = searchQuery.toLowerCase();
    return uniqueAccounts.filter((account) =>
      (account.accountHolder && account.accountHolder.toLowerCase().includes(query)) ||
      (account.bank && account.bank.toLowerCase().includes(query)) ||
      (account.accountNumber && account.accountNumber.includes(query))
    );
  }, [uniqueAccounts, searchQuery]);

  // 통계 계산
  const stats = useMemo(() => {
    return {
      totalAccounts: uniqueAccounts.length,
      totalDeals: uniqueAccounts.reduce((sum, a) => sum + a.dealCount, 0),
      totalAmount: uniqueAccounts.reduce((sum, a) => sum + a.totalAmount, 0),
    };
  }, [uniqueAccounts]);

  if (!mounted || !isLoggedIn || !currentUser || isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400" />
      </div>
    );
  }

  const getBankInfo = (bankName: string) => {
    return BANK_INFO[bankName] || { name: bankName.slice(0, 2), color: 'bg-gray-500' };
  };

  const handleCopyAccount = async (account: UniqueAccount) => {
    const text = `${account.bank} ${account.accountNumber} ${account.accountHolder}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAccount(`${account.bank}-${account.accountNumber}`);
      setTimeout(() => setCopiedAccount(null), 2000);
    } catch (e) {
      alert('복사에 실패했습니다.');
    }
  };

  const toggleFavorite = (account: UniqueAccount) => {
    const key = `${account.bank}-${account.accountNumber}`;
    let newFavorites: string[];

    if (favoriteAccounts.includes(key)) {
      newFavorites = favoriteAccounts.filter((f) => f !== key);
    } else {
      newFavorites = [...favoriteAccounts, key];
    }

    setFavoriteAccounts(newFavorites);
    saveFavoriteAccounts(newFavorites);
  };

  const maskAccountNumber = (accountNumber: string) => {
    if (accountNumber.length <= 6) return accountNumber;
    const visible = accountNumber.slice(0, 3);
    const hidden = '*'.repeat(accountNumber.length - 6);
    const last = accountNumber.slice(-3);
    return `${visible}${hidden}${last}`;
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <Header title="거래 계좌내역" showBack />

      {/* 스크롤 가능한 콘텐츠 영역 */}
      <div className="flex-1 overflow-y-auto">
        {/* 통계 */}
        <div className="bg-white px-5 py-6 mb-2">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-500">{stats.totalAccounts}</p>
              <p className="text-xs text-gray-500">거래 계좌</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-700">{stats.totalDeals}</p>
              <p className="text-xs text-gray-500">총 거래</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-700">
                {stats.totalAmount >= 10000
                  ? `${Math.floor(stats.totalAmount / 10000).toLocaleString()}만`
                  : stats.totalAmount.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">총 송금액</p>
            </div>
          </div>
        </div>

        {/* 검색 */}
        <div className="bg-white px-5 py-4 mb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="예금주, 은행, 계좌번호 검색"
              className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400"
            />
          </div>
        </div>

        {/* 계좌 목록 */}
        <div className="bg-white">
          {filteredAccounts.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredAccounts.map((account) => {
                const bankInfo = getBankInfo(account.bank);
                const accountKey = `${account.bank}-${account.accountNumber}`;
                const isCopied = copiedAccount === accountKey;
                const isFavorite = favoriteAccounts.includes(accountKey);

                return (
                  <div
                    key={accountKey}
                    className="px-5 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {/* 은행 아이콘 */}
                      <div className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold',
                        bankInfo.color
                      )}>
                        {bankInfo.name}
                      </div>

                      {/* 계좌 정보 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{account.accountHolder}</p>
                          {isFavorite && (
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {account.bank} {maskAccountNumber(account.accountNumber)}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                          <span>{account.dealCount}회 거래</span>
                          <span>총 {account.totalAmount.toLocaleString()}원</span>
                        </div>
                      </div>

                      {/* 액션 버튼 */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleCopyAccount(account)}
                          className={cn(
                            'p-2 rounded-lg transition-colors',
                            isCopied
                              ? 'bg-green-100 text-green-600'
                              : 'hover:bg-gray-100 text-gray-400'
                          )}
                          title="계좌 복사"
                        >
                          {isCopied ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => toggleFavorite(account)}
                          className={cn(
                            'p-2 rounded-lg transition-colors',
                            isFavorite
                              ? 'bg-yellow-100 text-yellow-500'
                              : 'hover:bg-gray-100 text-gray-400'
                          )}
                          title={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                        >
                          <Star className={cn('w-4 h-4', isFavorite && 'fill-yellow-400')} />
                        </button>
                      </div>
                    </div>

                    {/* 마지막 거래일 */}
                    <p className="text-xs text-gray-400 mt-2 pl-13">
                      마지막 거래: {new Date(account.lastUsedAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-20 text-center">
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">
                {searchQuery
                  ? '검색 결과가 없습니다'
                  : '거래한 계좌가 없습니다'}
              </p>
              {!searchQuery && (
                <Link
                  href="/deals/new"
                  className="inline-flex items-center gap-1 text-primary-400 text-sm font-medium"
                >
                  첫 거래 시작하기 <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          )}
        </div>

        {/* 안내 */}
        {uniqueAccounts.length > 0 && (
          <div className="px-5 py-4">
            <p className="text-center text-xs text-gray-400">
              거래한 계좌는 즐겨찾기로 저장하여 빠르게 재사용할 수 있습니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
