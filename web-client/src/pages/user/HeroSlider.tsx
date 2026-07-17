import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SLIDES = [
    { id: 1, key: 'home', name: 'Trang chủ', url: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=1200', title: 'Bộ Sưu Tập Mới' },
    { id: 2, key: 'ao', name: 'Áo', url: 'https://images.unsplash.com/photo-1523381294911-8d3cead13475?auto=format&fit=crop&q=80&w=1200', title: 'Áo Thời Trang' },
    { id: 3, key: 'vaydam', name: 'Váy/Đầm', url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=1200', title: 'Váy Đầm Sang Trọng' },
    { id: 4, key: 'dothethao', name: 'Đồ thể thao', url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=1200', title: 'Thời Trang Thể Thao' },
    { id: 5, key: 'phukien', name: 'Phụ kiện', url: 'https://images.unsplash.com/photo-1506629905607-d9c36e0a3f74?auto=format&fit=crop&q=80&w=1200', title: 'Phụ Kiện Nổi Bật' },
];

interface HeroSliderProps {
    onCategorySelect: (key: string, name: string) => void;
}

const HeroSlider: React.FC<HeroSliderProps> = ({ onCategorySelect }) => {
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const autoSlideInterval = 8000;

    const goToNext = () => {
        setCurrentSlideIndex((prev) => (prev + 1) % SLIDES.length);
    };

    const goToPrev = () => {
        setCurrentSlideIndex((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
    };

    useEffect(() => {
        const intervalId = setInterval(goToNext, autoSlideInterval);
        return () => clearInterval(intervalId);
    }, [currentSlideIndex]);

    return (
        <div className="relative w-full overflow-hidden rounded-2xl shadow-lg h-[250px] md:h-[400px] bg-gray-900 group/slider">
            {SLIDES.map((slide, index) => (
                <div
                    key={slide.id}
                    className={`absolute inset-0 transition-all duration-700 ease-in-out transform ${
                        index === currentSlideIndex
                            ? 'opacity-100 scale-100'
                            : 'opacity-0 scale-105 pointer-events-none'
                    }`}
                    style={{ zIndex: index === currentSlideIndex ? 10 : 1 }}
                >
                    <div
                        onClick={() => onCategorySelect(slide.key, slide.name)}
                        className="relative block w-full h-full cursor-pointer overflow-hidden"
                    >
                        <img
                            src={slide.url}
                            alt={slide.title}
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover/slider:scale-110"
                        />

                        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent flex items-center">
                            <div className="pl-10 md:pl-20 max-w-2xl text-white">
                                <h2 className="text-2xl md:text-5xl font-extrabold leading-tight mb-2 drop-shadow-lg">
                                    {slide.title}
                                </h2>
                                <p className="text-xs md:text-lg font-light text-gray-200 uppercase tracking-[0.2em] mb-6 opacity-90">
                                    Thời trang mới - ưu đãi nổi bật
                                </p>
                                <button className="inline-block bg-white text-black px-6 py-2.5 rounded-full text-xs md:text-sm font-bold uppercase tracking-wider hover:bg-indigo-600 hover:text-white transition-all duration-300 shadow-xl transform group-hover/slider:translate-y-[-4px]">
                                    Khám phá ngay
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            <button
                onClick={(event) => { event.stopPropagation(); goToPrev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 bg-white/10 backdrop-blur-md text-white rounded-full hover:bg-white/30 transition-all opacity-0 group-hover/slider:opacity-100"
                aria-label="Previous"
            >
                <ChevronLeft size={24} />
            </button>

            <button
                onClick={(event) => { event.stopPropagation(); goToNext(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 bg-white/10 backdrop-blur-md text-white rounded-full hover:bg-white/30 transition-all opacity-0 group-hover/slider:opacity-100"
                aria-label="Next"
            >
                <ChevronRight size={24} />
            </button>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex space-x-2">
                {SLIDES.map((_, index) => (
                    <button
                        key={index}
                        onClick={(event) => { event.stopPropagation(); setCurrentSlideIndex(index); }}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                            index === currentSlideIndex
                                ? 'w-8 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]'
                                : 'w-2 bg-white/40 hover:bg-white/60'
                        }`}
                    />
                ))}
            </div>
        </div>
    );
};

export default HeroSlider;
