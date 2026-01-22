'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { contentAPI } from '@/lib/api';
import { cn } from '@/lib/utils';

interface IBanner {
  bannerId: string;
  title: string;
  imageUrl: string;
  linkUrl?: string;
  isVisible: boolean;
  priority: number;
}

export function BannerSlider() {
  const [banners, setBanners] = useState<IBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await contentAPI.getBanners();
        setBanners(response.banners || []);
      } catch (error) {
        console.error('배너 로드 실패:', error);
        setBanners([]);
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, []);

  // priority 기준으로 정렬
  const sortedBanners = [...banners].sort((a, b) => a.priority - b.priority);

  const bannerWidth = 300;
  const bannerHeight = 250;

  const goToSlide = useCallback((index: number) => {
    if (index < 0) {
      setCurrentIndex(sortedBanners.length - 1);
    } else if (index >= sortedBanners.length) {
      setCurrentIndex(0);
    } else {
      setCurrentIndex(index);
    }
  }, [sortedBanners.length]);

  // 자동 슬라이드 (5초마다)
  useEffect(() => {
    if (sortedBanners.length <= 1) return;

    const timer = setInterval(() => {
      if (!isDragging) {
        setCurrentIndex((prev) => (prev + 1) % sortedBanners.length);
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [isDragging, sortedBanners.length]);

  // 터치/마우스 이벤트 핸들러
  const handleDragStart = (clientX: number) => {
    setIsDragging(true);
    setStartX(clientX);
    setTranslateX(0);
  };

  const handleDragMove = (clientX: number) => {
    if (!isDragging) return;
    const diff = clientX - startX;
    setTranslateX(diff);
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const threshold = 50;

    if (translateX > threshold) {
      goToSlide(currentIndex - 1);
    } else if (translateX < -threshold) {
      goToSlide(currentIndex + 1);
    }

    setTranslateX(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleDragMove(e.clientX);
  };

  const handleMouseUp = () => {
    handleDragEnd();
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      handleDragEnd();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    handleDragEnd();
  };

  if (loading) {
    return (
      <div className="w-full flex justify-center">
        <div
          className="rounded-xl bg-gray-200 animate-pulse"
          style={{ width: bannerWidth, height: bannerHeight }}
        />
      </div>
    );
  }

  if (sortedBanners.length === 0) return null;

  const prevIndex = currentIndex === 0 ? sortedBanners.length - 1 : currentIndex - 1;
  const nextIndex = currentIndex === sortedBanners.length - 1 ? 0 : currentIndex + 1;

  return (
    <div className="w-full flex flex-col items-center">
      <div className="relative w-full flex justify-center overflow-hidden">
        {/* 좌측 미리보기 배너 */}
        <div className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 z-0">
          <div
            className="rounded-xl overflow-hidden flex-shrink-0 opacity-50"
            style={{
              width: bannerWidth * 0.7,
              height: bannerHeight * 0.7,
            }}
          >
            <BannerContent banner={sortedBanners[prevIndex]} />
          </div>
        </div>

        {/* 중앙 배너 슬라이더 */}
        <div
          ref={containerRef}
          className="relative overflow-hidden rounded-xl cursor-grab active:cursor-grabbing z-10"
          style={{ width: bannerWidth, height: bannerHeight }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="flex transition-transform ease-out"
            style={{
              transform: `translateX(calc(-${currentIndex * 100}% + ${translateX}px))`,
              transitionDuration: isDragging ? '0ms' : '300ms',
            }}
          >
            {sortedBanners.map((banner) => (
              <div
                key={banner.bannerId}
                className="flex-shrink-0 flex items-center justify-center"
                style={{ minWidth: '100%' }}
              >
                {banner.linkUrl ? (
                  <Link
                    href={banner.linkUrl}
                    className="block"
                    onClick={(e) => {
                      if (Math.abs(translateX) > 5) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <div
                      className="rounded-xl overflow-hidden"
                      style={{ width: bannerWidth, height: bannerHeight }}
                    >
                      <BannerContent banner={banner} />
                    </div>
                  </Link>
                ) : (
                  <div
                    className="rounded-xl overflow-hidden"
                    style={{ width: bannerWidth, height: bannerHeight }}
                  >
                    <BannerContent banner={banner} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 우측 미리보기 배너 */}
        <div className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 z-0">
          <div
            className="rounded-xl overflow-hidden flex-shrink-0 opacity-50"
            style={{
              width: bannerWidth * 0.7,
              height: bannerHeight * 0.7,
            }}
          >
            <BannerContent banner={sortedBanners[nextIndex]} />
          </div>
        </div>
      </div>

      {/* 인디케이터 */}
      {sortedBanners.length > 1 && (
        <div className="flex gap-1.5 mt-3 z-20">
          {sortedBanners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                'w-2 h-2 rounded-full transition-all duration-300',
                currentIndex === index
                  ? 'bg-[#2563EB] w-4'
                  : 'bg-gray-300 hover:bg-gray-400'
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BannerContent({ banner }: { banner: { title: string; imageUrl: string; linkUrl?: string } }) {
  return (
    <div className="w-full h-full flex flex-col justify-center px-6 select-none bg-gradient-to-r from-[#2563EB] to-[#3B82F6]">
      {banner.imageUrl ? (
        <img
          src={banner.imageUrl}
          alt={banner.title}
          className="w-full h-full object-cover"
          draggable={false}
        />
      ) : (
        <p className="text-white font-bold text-xl">{banner.title}</p>
      )}
    </div>
  );
}
