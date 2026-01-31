'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { contentAPI, adminAPI } from '@/lib/api';
import { ContentHelper } from '@/classes';
import { IFAQ } from '@/types';
import { cn } from '@/lib/utils';

export default function AdminFAQsPage() {
  // API 데이터 상태
  const [faqs, setFaqs] = useState<IFAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<IFAQ | null>(null);
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Form state
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState('service');
  const [isHomeFeatured, setIsHomeFeatured] = useState(false);

  const categories = ContentHelper.FAQ_CATEGORIES;

  // API에서 FAQ 목록 로드
  const fetchFaqs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await contentAPI.getFaqs();
      setFaqs(response.faqs || []);
    } catch (err: any) {
      console.error('FAQ 목록 로드 실패:', err);
      setError(err.message || 'FAQ 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const displayFAQs = faqs;

  const filteredFAQs = filterCategory === 'all'
    ? displayFAQs
    : displayFAQs.filter(faq => faq.category === filterCategory);

  const resetForm = () => {
    setQuestion('');
    setAnswer('');
    setCategory('service');
    setIsHomeFeatured(false);
    setEditingFAQ(null);
    setShowForm(false);
  };

  const handleEdit = (faq: IFAQ) => {
    setEditingFAQ(faq);
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setCategory(faq.category || 'service');
    setIsHomeFeatured(faq.isHomeFeatured || false);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!question.trim() || !answer.trim()) return;

    setIsSaving(true);
    try {
      if (editingFAQ) {
        await adminAPI.updateFaq(editingFAQ.faqId, {
          question,
          answer,
          category,
          isHomeFeatured,
        });
      } else {
        await adminAPI.createFaq({
          question,
          answer,
          category,
          isHomeFeatured,
          isVisible: true,
        });
      }
      await fetchFaqs();
      resetForm();
    } catch (err: any) {
      console.error('FAQ 저장 실패:', err);
      alert(err.message || 'FAQ 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (faqId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    setIsSaving(true);
    try {
      await adminAPI.deleteFaq(faqId);
      await fetchFaqs();
    } catch (err: any) {
      console.error('FAQ 삭제 실패:', err);
      alert(err.message || 'FAQ 삭제에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleVisibility = async (faq: IFAQ) => {
    setIsSaving(true);
    try {
      await adminAPI.updateFaq(faq.faqId, { isVisible: !faq.isVisible });
      await fetchFaqs();
    } catch (err: any) {
      console.error('FAQ 상태 변경 실패:', err);
      alert(err.message || 'FAQ 상태 변경에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const getCategoryName = (categoryId?: string) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.name : categoryId || '기타';
  };

  const getCategoryColor = (categoryId?: string): string => {
    const colors: Record<string, string> = {
      service: 'bg-blue-100 text-blue-700',
      payment: 'bg-green-100 text-green-700',
      transfer: 'bg-purple-100 text-purple-700',
      account: 'bg-orange-100 text-orange-700',
    };
    return colors[categoryId || ''] || 'bg-gray-100 text-gray-700';
  };

  // 로딩 상태
  if (loading && faqs.length === 0) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400" />
      </div>
    );
  }

  return (
    <div>
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">FAQ 관리</h1>
          <p className="text-gray-500 mt-1">자주 묻는 질문을 관리합니다.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchFaqs}
            disabled={loading || isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            새로고침
          </button>
          <button
            onClick={() => setShowForm(true)}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-primary-400 text-white rounded-lg hover:bg-primary-500 transition-colors disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
            FAQ 등록
          </button>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* FAQ 등록/수정 폼 */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            {editingFAQ ? 'FAQ 수정' : '새 FAQ 등록'}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">카테고리</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 px-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400 bg-white"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">질문</label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="자주 묻는 질문을 입력하세요"
                className="w-full h-10 px-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">답변</label>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="답변 내용을 입력하세요"
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400 resize-none"
              />
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <input
                type="checkbox"
                id="isHomeFeatured"
                checked={isHomeFeatured}
                onChange={(e) => setIsHomeFeatured(e.target.checked)}
                className="w-4 h-4 text-primary-400 border-gray-300 rounded cursor-pointer"
              />
              <label htmlFor="isHomeFeatured" className="text-sm text-gray-700 cursor-pointer">
                홈 화면에 표시 (자주 묻는 질문 섹션)
              </label>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={resetForm}
              disabled={isSaving}
              className="flex-1 h-10 border border-gray-200 rounded-lg text-gray-600 font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={!question.trim() || !answer.trim() || isSaving}
              className="flex-1 h-10 bg-gray-900 text-white rounded-lg font-medium disabled:bg-gray-200 disabled:text-gray-400"
            >
              {isSaving ? '저장 중...' : (editingFAQ ? '수정' : '등록')}
            </button>
          </div>
        </div>
      )}

      {/* 카테고리 필터 */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setFilterCategory('all')}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
              filterCategory === 'all'
                ? 'bg-primary-400 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            전체
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                filterCategory === cat.id
                  ? 'bg-primary-400 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ 목록 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {filteredFAQs.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredFAQs.map((faq) => (
              <div key={faq.faqId} className="hover:bg-gray-50">
                <div className="flex items-center justify-between p-4">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => setExpandedFAQ(expandedFAQ === faq.faqId ? null : faq.faqId)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        'inline-flex px-2 py-0.5 text-xs font-medium rounded',
                        getCategoryColor(faq.category)
                      )}>
                        {getCategoryName(faq.category)}
                      </span>
                      {!faq.isVisible && (
                        <span className="inline-flex px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-medium rounded">
                          숨김
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-gray-900">{faq.question}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleVisibility(faq)}
                      className={cn(
                        'p-2 rounded-lg transition-colors',
                        faq.isVisible
                          ? 'text-green-600 bg-green-50'
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                      )}
                    >
                      {faq.isVisible ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleEdit(faq)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(faq.faqId)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setExpandedFAQ(expandedFAQ === faq.faqId ? null : faq.faqId)}
                      className="p-2 text-gray-400"
                    >
                      {expandedFAQ === faq.faqId ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                {expandedFAQ === faq.faqId && (
                  <div className="px-4 pb-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-600 text-sm whitespace-pre-line">{faq.answer}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-gray-500">
            {filterCategory !== 'all' ? '해당 카테고리의 FAQ가 없습니다.' : '등록된 FAQ가 없습니다.'}
          </div>
        )}
      </div>
    </div>
  );
}
