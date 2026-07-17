import axios from "axios";
import { Product } from "./productApi";

const PRODUCT_ADVISOR_URL = `${import.meta.env.VITE_API_URL}/chatbot/product-advice`;

export interface ProductAdvisorResponse {
    reply: string;
    recommendations: Product[];
}

export interface ProductAdvisorContextMessage {
    role: "user" | "assistant";
    content: string;
}

export interface ProductAdvisorConversationContext {
    messages?: ProductAdvisorContextMessage[];
    recommended_product_ids?: number[];
}

const MAX_CONTEXT_MESSAGES = 4;
const MAX_CONTEXT_CONTENT_LENGTH = 600;

const sanitizeConversationContext = (
    conversationContext?: ProductAdvisorConversationContext
): ProductAdvisorConversationContext | undefined => {
    if (!conversationContext) {
        return undefined;
    }

    return {
        recommended_product_ids: conversationContext.recommended_product_ids?.slice(0, 10),
        messages: conversationContext.messages
            ?.slice(-MAX_CONTEXT_MESSAGES)
            .map((message) => ({
                role: message.role,
                content: message.content.slice(0, MAX_CONTEXT_CONTENT_LENGTH),
            })),
    };
};

export const askProductAdvisor = async (
    message: string,
    currentProductId?: number | string | null,
    conversationContext?: ProductAdvisorConversationContext
): Promise<ProductAdvisorResponse> => {
    const token = localStorage.getItem("token");

    const requestPayload = {
        message,
        current_product_id: currentProductId ?? undefined,
        conversation_context: sanitizeConversationContext(conversationContext),
    };

    const requestConfig = {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        timeout: 120000,
    };

    for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
            const response = await axios.post<ProductAdvisorResponse>(PRODUCT_ADVISOR_URL, {
                ...requestPayload,
            },
                requestConfig
            );

            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.data?.reply) {
                return error.response.data as ProductAdvisorResponse;
            }

            const canRetry =
                axios.isAxiosError(error) &&
                (!error.response || error.response.status >= 500 || error.code === "ECONNABORTED");

            if (attempt === 0 && canRetry) {
                await new Promise((resolve) => window.setTimeout(resolve, 900));
                continue;
            }

            throw error;
        }
    }

    throw new Error("Product advisor request failed");
};
