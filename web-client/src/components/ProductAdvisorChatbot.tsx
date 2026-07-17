import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bot, ExternalLink, MessageCircle, Send, ShoppingBag, X } from "lucide-react";
import { askProductAdvisor } from "@/api/productAdvisorApi";
import { Product } from "@/api/productApi";

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

interface ProductAdvisorChatbotProps {
    currentProductId?: number | null;
    onViewDetail?: (productId: number) => void;
}

const starterPrompts = [
    "Tôi cần váy đi tiệc dưới 500k",
    "Gợi ý áo khoác mùa đông size L",
    "Nên phối đồ công sở như thế nào?",
];

const initialMessages: ChatMessage[] = [
    {
        role: "assistant",
        content:
            "Xin chào tôi là trợ lý ảo của bạn, tôi có thể giúp gì cho bạn",
    },
];

const getCurrentUserKey = () => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
        return "guest";
    }

    try {
        const user = JSON.parse(storedUser);
        return `${user.role || "unknown"}:${user.id || user.username || "unknown"}`;
    } catch {
        return "guest";
    }
};

const ProductAdvisorChatbot: React.FC<ProductAdvisorChatbotProps> = ({
    currentProductId,
    onViewDetail,
}) => {
    const location = useLocation();
    const navigate = useNavigate();
    const activeUserKeyRef = useRef(getCurrentUserKey());
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
    const [recommendations, setRecommendations] = useState<Product[]>([]);

    const canSubmit = useMemo(() => input.trim().length > 0 && !isLoading, [input, isLoading]);

    const resetConversationIfUserChanged = () => {
        const nextUserKey = getCurrentUserKey();

        if (activeUserKeyRef.current === nextUserKey) {
            return;
        }

        activeUserKeyRef.current = nextUserKey;
        setInput("");
        setIsLoading(false);
        setRecommendations([]);
        setMessages(initialMessages);
    };

    useEffect(() => {
        resetConversationIfUserChanged();
    }, [location.pathname]);

    useEffect(() => {
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === "user" || event.key === "token") {
                resetConversationIfUserChanged();
            }
        };

        window.addEventListener("storage", handleStorageChange);

        return () => {
            window.removeEventListener("storage", handleStorageChange);
        };
    }, []);

    const submitMessage = async (messageText = input) => {
        const trimmed = messageText.trim();
        if (!trimmed || isLoading) return;

        setInput("");
        setIsLoading(true);
        setMessages((prev) => [...prev, { role: "user", content: trimmed }]);

        try {
            const response = await askProductAdvisor(trimmed, currentProductId, {
                messages: messages.slice(-6),
                recommended_product_ids: recommendations.slice(0, 10).map((product) => product.id),
            });
            setMessages((prev) => [...prev, { role: "assistant", content: response.reply }]);
            setRecommendations(response.recommendations);
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content:
                        "Hiện tôi chưa có dữ liệu sản phẩm phù hợp hoặc chưa kết nối được máy chủ tư vấn. Bạn thử lại sau ít phút nhé.",
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const openProductDetail = (productId: number) => {
        if (onViewDetail) {
            onViewDetail(productId);
        } else {
            navigate(`/?productId=${productId}`);
        }

        setIsOpen(false);
    };

    const renderMessageContent = (content: string) => {
        const parts = content.split(/(\/\?productId=\d+)/g);

        return parts.map((part, index) => {
            const match = part.match(/^\/\?productId=(\d+)$/);

            if (!match) {
                return <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>;
            }

            const productId = Number(match[1]);

            return (
                <button
                    key={`${part}-${index}`}
                    type="button"
                    onClick={() => openProductDetail(productId)}
                    className="inline-flex items-center gap-1 font-bold text-indigo-600 underline underline-offset-2 hover:text-indigo-800"
                >
                    Xem chi tiết #{productId}
                    <ExternalLink size={12} />
                </button>
            );
        });
    };

    return (
        <div className="fixed bottom-5 right-5 z-50">
            {isOpen && (
                <div className="mb-4 w-[calc(100vw-40px)] max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
                    <div className="flex items-center justify-between bg-gray-900 px-4 py-3 text-white">
                        <div className="flex items-center gap-2 font-bold">
                            <Bot size={20} />
                           Tư vấn sản phẩm AI
                        </div>
                        <button
                            aria-label="Đóng chatbot"
                            onClick={() => setIsOpen(false)}
                            className="rounded-full p-1 text-gray-300 transition hover:bg-white/10 hover:text-white"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="max-h-80 space-y-3 overflow-y-auto bg-gray-50 p-4">
                        {messages.map((message, index) => (
                            <div
                                key={`${message.role}-${index}`}
                                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[82%] rounded-2xl px-4 py-2 text-sm leading-6 ${
                                        message.role === "user"
                                            ? "bg-indigo-600 text-white"
                                            : "border border-gray-100 bg-white text-gray-700 whitespace-pre-line"
                                    }`}
                                >
                                    {message.role === "assistant" ? renderMessageContent(message.content) : message.content}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="w-fit rounded-2xl border border-gray-100 bg-white px-4 py-2 text-sm text-gray-500">
                                Đang phân tích nhu cầu...
                            </div>
                        )}
                    </div>

                    {recommendations.length > 0 && (
                        <div className="border-t border-gray-100 bg-white p-3">
                            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">
                                Gợi ý phù hợp
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {recommendations.slice(0, 10).map((product) => (
                                    <button
                                        key={product.id}
                                        onClick={() => openProductDetail(product.id)}
                                        className="flex gap-2 rounded-xl border border-gray-100 p-2 text-left transition hover:border-indigo-300 hover:bg-indigo-50"
                                    >
                                        <img
                                            src={
                                                product.thumbnail_url ||
                                                "https://placehold.co/120x120/eeeeee/777777?text=No+Image"
                                            }
                                            alt={product.name}
                                            className="h-12 w-12 rounded-lg object-cover"
                                        />
                                        <div className="min-w-0">
                                            <div className="truncate text-xs font-bold text-gray-800">
                                                {product.name}
                                            </div>
                                            <div className="text-xs font-semibold text-red-600">
                                                {Number(product.price).toLocaleString("vi-VN")} VND
                                            </div>
                                            <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-indigo-600">
                                                Xem chi tiết <ExternalLink size={11} />
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="border-t border-gray-100 bg-white p-3">
                        <div className="mb-3 flex flex-wrap gap-2">
                            {starterPrompts.map((prompt) => (
                                <button
                                    key={prompt}
                                    onClick={() => submitMessage(prompt)}
                                    className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 transition hover:bg-indigo-100 hover:text-indigo-700"
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                value={input}
                                onChange={(event) => setInput(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") submitMessage();
                                }}
                                placeholder="Nhập nhu cầu, size, ngân sách..."
                                className="h-11 flex-1 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-indigo-500"
                            />
                            <button
                                disabled={!canSubmit}
                                onClick={() => submitMessage()}
                                className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {!isOpen && (
                <div className="mb-3 max-w-[260px] rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-lg">
                    Xin chào tôi là trợ lý ảo của bạn, tôi có thể giúp gì cho bạn
                </div>
            )}

            <button
                onClick={() => setIsOpen((value) => !value)}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-900 text-white shadow-2xl transition hover:bg-indigo-600"
                aria-label="Mở chatbot tư vấn sản phẩm"
            >
                {isOpen ? <ShoppingBag size={24} /> : <MessageCircle size={24} />}
            </button>
        </div>
    );
};

export default ProductAdvisorChatbot;
