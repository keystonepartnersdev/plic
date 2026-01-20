'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, GripVertical, ChevronUp, ChevronDown, RefreshCw } from 'lucide-react';
import { contentAPI, adminAPI } from '@/lib/api';
import { IHomeBanner } from '@/types';
import { cn } from '@/lib/utils';

export default function AdminBannersPage() {
  // API 데이터 상태
  const [banners, setBanners] = useState<IHomeBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<IHomeBanner | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  // API에서 배너 목록 로드
  const fetchBanners = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await contentAPI.getBanners();
      setBanners(response.banners || []);
    } catch (err: any) {
      console.error('배너 목록 로드 실패:', err);
      setError(err.message || '배너 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const displayBanners = banners;

  // priority 기준으로 정렬
  const sortedBanners = [...displayBanners].sort((a, b) => a.priority - b.priority);

  const resetForm = () => {
    setTitle('');
    setImageUrl('');
    setLinkUrl('');
    setEditingBanner(null);
    setShowForm(false);
  };

  const handleEdit = (banner: IHomeBanner) => {
    setEditingBanner(banner);
    setTitle(banner.title);
    setImageUrl(banner.imageUrl);
    setLinkUrl(banner.linkUrl);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;

    setIsSaving(true);
    try {
      if (editingBanner) {
        await adminAPI.updateBanner(editingBanner.bannerId, {
          title,
          imageUrl,
          linkUrl,
        });
      } else {
        await adminAPI.createBanner({
          title,
          imageUrl,
          linkUrl,
          priority: sortedBanners.length + 1,
          isVisible: true,
        });
      }
      await fetchBanners();
      resetForm();
    } catch (err: any) {
      console.error('배너 저장 실패:', err);
      alert(err.message || '배너 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (bannerId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    setIsSaving(true);
    try {
      await adminAPI.deleteBanner(bannerId);
      await fetchBanners();
    } catch (err: any) {
      console.error('배너 삭제 실패:', err);
      alert(err.message || '배너 삭제에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleVisibility = async (banner: IHomeBanner) => {
    setIsSaving(true);
    try {
      await adminAPI.updateBanner(banner.bannerId, { isVisible: !banner.isVisible });
      await fetchBanners();
    } catch (err: any) {
      console.error('배너 상태 변경 실패:', err);
      alert(err.message || '배너 상태 변경에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 순서 변경 (위/아래 버튼)
  const handleMoveUp = async (index: number) => {
    if (index <= 0) return;
    const newBanners = [...sortedBanners];
    [newBanners[index - 1], newBanners[index]] = [newBanners[index], newBanners[index - 1]];
    await updatePriorities(newBanners);
  };

  const handleMoveDown = async (index: number) => {
    if (index >= sortedBanners.length - 1) return;
    const newBanners = [...sortedBanners];
    [newBanners[index], newBanners[index + 1]] = [newBanners[index + 1], newBanners[index]];
    await updatePriorities(newBanners);
  };

  // 드래그 앤 드롭
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const newBanners = [...sortedBanners];
      const [removed] = newBanners.splice(draggedIndex, 1);
      newBanners.splice(dragOverIndex, 0, removed);
      await updatePriorities(newBanners);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const updatePriorities = async (newOrder: IHomeBanner[]) => {
    setIsSaving(true);
    try {
      // 순서가 변경된 배너들의 priority 업데이트
      for (let i = 0; i < newOrder.length; i++) {
        const banner = newOrder[i];
        if (banner.priority !== i + 1) {
          await adminAPI.updateBanner(banner.bannerId, { priority: i + 1 });
        }
      }
      await fetchBanners();
    } catch (err: any) {
      console.error('배너 순서 변경 실패:', err);
      alert(err.message || '배너 순서 변경에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 로딩 상태
  if (loading && banners.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-900">배너 관리</h1>
          <p className="text-gray-500 mt-1">홈 화면 배너를 관리합니다. 드래그하여 순서를 변경하세요.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchBanners}
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
            배너 추가
          </button>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* 배너 등록/수정 폼 */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            {editingBanner ? '배너 수정' : '새 배너 등록'}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">제목</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="배너 제목"
                className="w-full h-10 px-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">이미지 URL</label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full h-10 px-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">링크 URL</label>
              <input
                type="text"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="/events/example 또는 https://example.com"
                className="w-full h-10 px-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400"
              />
            </div>
          </div>

          {/* 미리보기 */}
          {imageUrl && (
            <div className="mt-4">
              <label className="block text-sm text-gray-600 mb-2">미리보기</label>
              <img
                src={imageUrl}
                alt={title}
                className="max-w-[300px] h-auto rounded-xl border border-gray-200"
              />
            </div>
          )}

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
              disabled={!title.trim() || isSaving}
              className="flex-1 h-10 bg-gray-900 text-white rounded-lg font-medium disabled:bg-gray-200 disabled:text-gray-400"
            >
              {isSaving ? '저장 중...' : (editingBanner ? '수정' : '등록')}
            </button>
          </div>
        </div>
      )}

      {/* 배너 목록 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="w-16 text-left text-sm font-medium text-gray-500 px-6 py-4">순서</th>
                <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">배너</th>
                <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">링크</th>
                <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">노출</th>
                <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">순서 변경</th>
                <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">관리</th>
              </tr>
            </thead>
            <tbody>
              {sortedBanners.map((banner, index) => (
                <tr
                  key={banner.bannerId}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    'border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-move',
                    draggedIndex === index && 'opacity-50 bg-gray-100',
                    dragOverIndex === index && draggedIndex !== index && 'border-t-2 border-t-primary-400'
                  )}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-5 h-5 text-gray-300" />
                      <span className="text-sm font-medium text-gray-500">{index + 1}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {banner.imageUrl && (
                        <img
                          src={banner.imageUrl}
                          alt={banner.title}
                          className="w-[120px] h-[100px] rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{banner.title}</p>
                        <p className="text-sm text-gray-500">{banner.linkUrl || '-'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500 font-mono">{banner.linkUrl || '-'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleVisibility(banner)}
                      className={cn(
                        'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors',
                        banner.isVisible
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      )}
                    >
                      {banner.isVisible ? (
                        <>
                          <Eye className="w-3 h-3" />
                          노출
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3" />
                          숨김
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="위로 이동"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === sortedBanners.length - 1}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="아래로 이동"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(banner)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(banner.bannerId)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sortedBanners.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            등록된 배너가 없습니다.
          </div>
        )}
      </div>

      {/* 안내 */}
      <div className="mt-4 p-4 bg-blue-50 rounded-xl">
        <p className="text-sm text-blue-700">
          <strong>TIP:</strong> 배너의 순서는 홈 화면 슬라이더에 표시되는 순서입니다.
          드래그하거나 화살표 버튼을 눌러 순서를 변경할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
