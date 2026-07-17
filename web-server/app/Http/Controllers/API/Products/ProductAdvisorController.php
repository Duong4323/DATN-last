<?php

namespace App\Http\Controllers\API\Products;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\SizeChart;
use App\Models\ShopMonthlyStatistic;
use App\Services\ProductVectorSyncService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class ProductAdvisorController extends Controller
{
    private const RECOMMENDATION_LIMIT = 10;

    private array $categoryHints = [
        'ao' => ['ao', 'shirt', 'top', 'hoodie', 'sweater'],
        'quan' => ['quan', 'pants', 'jean', 'short'],
        'vaydam' => ['vay', 'dam', 'dress', 'skirt'],
        'aokhoac' => ['khoac', 'jacket', 'coat', 'blazer'],
        'dothethao' => ['the thao', 'gym', 'sport', 'yoga'],
        'docongso' => ['cong so', 'office', 'di lam', 'lich su'],
        'dongu' => ['do ngu', 'pijama', 'pajama'],
        'dolot' => ['do lot', 'noi y'],
        'giaydep' => ['giay', 'giay dep', 'sneaker', 'shoe', 'sandal'],
        'tuixach' => ['tui', 'tui xach', 'bag'],
        'phukien' => [
            'phu kien',
            'that lung',
            'belt',
            'mu',
            'non',
            'hat',
            'cap',
            'kinh',
            'glasses',
            'sunglasses',
            'khan',
            'scarf',
            'tat',
            'vo',
            'socks',
            'trang suc',
            'jewelry',
            'nhan',
            'vong',
            'day chuyen',
            'bong tai',
            'kep toc',
            'buoc toc',
            'hair',
        ],
        'setdo' => ['set do', 'bo do', 'outfit'],
    ];

    private array $categoryIds = [
        'ao' => [1],
        'quan' => [2],
        'vaydam' => [3],
        'giaydep' => [4],
        'tuixach' => [5],
        'phukien' => [6],
        'setdo' => [7],
        'dongu' => [8],
        'dolot' => [9],
        'aokhoac' => [10],
        'dothethao' => [11],
        'docongso' => [12],
    ];

    public function advise(Request $request)
    {
        $validated = $request->validate([
            'message' => 'required|string|max:500',
            'current_product_id' => 'nullable|integer|exists:products,id',
            'conversation_context' => 'nullable|array',
            'conversation_context.messages' => 'nullable|array',
            'conversation_context.messages.*.role' => 'nullable|string',
            'conversation_context.messages.*.content' => 'nullable|string|max:12000',
            'conversation_context.recommended_product_ids' => 'nullable|array',
            'conversation_context.recommended_product_ids.*' => 'integer|exists:products,id',
        ]);

        try {
        if ($this->isLikelyUnaccentedVietnameseInput($validated['message'])) {
            return response()->json([
                'reply' => "Bạn vui lòng nhập tiếng Việt có dấu để chatbot hiểu chính xác hơn. Ví dụ: \"tôi cần tìm mua áo giá dưới 100k\".",
                'recommendations' => [],
            ]);
        }

        $message = $this->normalize($validated['message']);
        $budget = $this->extractBudget($message);
        $size = $this->extractSize($message);
        $color = $this->extractColor($message);
        $strictProductTypeCategoryIds = $this->detectStrictProductTypeCategoryIds($message);
        $requiredProductPhrases = $this->detectRequiredProductPhrases($message);
        $categoryIds = $this->detectCategoryIds($message);
        $contextProductId = $this->resolveContextProductId($message, $validated);
        $sizeAdviceProducts = $this->resolveProductsForSizeAdvice($validated, $contextProductId);
        $measurements = $this->extractBodyMeasurements($validated['message'], $sizeAdviceProducts);

        if (!empty($measurements)) {
            if ($sizeAdviceProducts->isNotEmpty()) {
                return response()->json([
                    'reply' => $this->buildSizeAdviceReply($sizeAdviceProducts, $measurements),
                    'recommendations' => $sizeAdviceProducts,
                ]);
            }
        }

        if ($contextProductId && $this->isProductFollowUpQuestion($message) && !$this->isNewProductSearchRequest($message)) {
            $product = Product::with(['categories', 'images', 'shop'])->find($contextProductId);

            if ($product) {
                return response()->json([
                    'reply' => $this->answerProductFollowUp($product, $message),
                    'recommendations' => [$product],
                ]);
            }
        }

        if ($this->isShopAnalyticsQuestion($message)) {
            return response()->json([
                'reply' => $this->answerShopAnalyticsQuestion($message),
                'recommendations' => [],
            ]);
        }

        if ($this->isProductCountQuestion($message)) {
            return response()->json([
                'reply' => $this->answerProductCount($message),
                'recommendations' => [],
            ]);
        }

        if ($this->isFashionAdviceQuestion($message)) {
            return response()->json([
                'reply' => $this->askOllamaForFashionAdvice($validated['message']),
                'recommendations' => [],
            ]);
        }

        if ($this->shouldAskForMoreShoppingContext($message, $budget, $size, $color, $requiredProductPhrases)) {
            return response()->json([
                'reply' => $this->buildShoppingClarificationQuestion($message, $budget, $size),
                'recommendations' => [],
            ]);
        }

        $currentProductId = $validated['current_product_id'] ?? null;
        $shouldSearchDatabaseFirst = !empty($categoryIds)
            || !empty($requiredProductPhrases)
            || $budget !== null
            || $size !== null
            || $color !== null;

        $products = $shouldSearchDatabaseFirst
            ? $this->searchProductsFromDatabase($message, $budget, $size, $color, $categoryIds, $requiredProductPhrases, $currentProductId)
            : collect();

        if ($products->isEmpty()) {
            $products = $this->searchProductsWithQdrant(
                $validated['message'],
                $message,
                $budget,
                $size,
                $color,
                $categoryIds,
                $requiredProductPhrases,
                $currentProductId
            );
        }

        if ($products->isEmpty() && !$shouldSearchDatabaseFirst) {
            $products = $this->searchProductsFromDatabase($message, $budget, $size, $color, $categoryIds, $requiredProductPhrases, $currentProductId);
        }

        if ($products->isEmpty() && $budget !== null && !empty($categoryIds)) {
            $products = $this->searchProductsFromDatabase($message, $budget, $size, $color, [], $requiredProductPhrases, $currentProductId);
        }

        if ($products->isEmpty()) {
            if ($budget !== null || $color !== null || !empty($requiredProductPhrases)) {
                return response()->json([
                    'reply' => $this->buildNoProductDataReply($budget, $requiredProductPhrases),
                    'recommendations' => [],
                ]);
            }

            $query = Product::with(['categories', 'images', 'shop'])->orderByDesc('sold');

            if (!empty($categoryIds)) {
                $query->whereHas('categories', function ($categoryQuery) use ($categoryIds) {
                    $categoryQuery->whereIn('categories.id', $categoryIds);
                });
            }

            $products = $query->get()
                ->filter(fn (Product $product) => $this->productHasStock($product))
                ->take(self::RECOMMENDATION_LIMIT)
                ->values();
        }

        $reply = $shouldSearchDatabaseFirst || $this->isPriceSensitiveProductQuestion($message, $budget) || !empty($strictProductTypeCategoryIds) || $this->hasSemanticShoppingSignal($message)
            ? $this->buildProductRecommendationReply($products, $budget, $size, $requiredProductPhrases)
            : $this->askOllama($validated['message'], $products, $budget, $size, $color);

        $reply = $this->appendSizeMeasurementPrompt($reply, $products);

        return response()->json([
            'reply' => $reply,
            'recommendations' => $products,
        ]);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'reply' => "Hiện tôi chưa có dữ liệu sản phẩm phù hợp với yêu cầu của bạn.",
                'recommendations' => [],
            ]);
        }
    }

    private function scoreProduct(Product $product, string $message, ?float $budget, ?string $size, ?string $color, array $requiredProductPhrases = []): int
    {
        $haystack = $this->normalize(collect([
            $product->name,
            $product->brand,
            $product->material,
            $product->origin,
            $product->design_style,
            $product->fashion_style,
            $product->description,
            $product->categories->pluck('name')->implode(' '),
            is_array($product->colors) ? implode(' ', $product->colors) : '',
        ])->filter()->implode(' '));

        $score = 0;

        if (!empty($requiredProductPhrases)) {
            if (!$this->productMatchesRequiredPhrases($product, $requiredProductPhrases)) {
                return -1000;
            }

            $score += 20;
        }

        foreach (preg_split('/\s+/', $message) as $token) {
            if (Str::length($token) >= 3) {
                if (Str::contains($this->normalize((string) $product->name), $token)) {
                    $score += 6;
                }

                if (Str::contains($this->normalize($product->categories->pluck('name')->implode(' ')), $token)) {
                    $score += 5;
                }

                if (Str::contains($this->normalize((string) $product->description), $token)) {
                    $score += 4;
                }

                if (Str::contains($this->normalize(collect([$product->brand, $product->material, $product->origin, $product->design_style, $product->fashion_style])->filter()->implode(' ')), $token)) {
                    $score += 3;
                }

                if (Str::contains($haystack, $token)) {
                    $score += 1;
                }
            }
        }

        foreach ($this->categoryHints as $hints) {
            foreach ($hints as $hint) {
                $normalizedHint = $this->normalizeSearchTerm($hint);

                if (Str::contains($message, $normalizedHint) && Str::contains($haystack, $normalizedHint)) {
                    $score += 8;
                }
            }
        }

        if ($budget !== null) {
            $score += (float) $product->price <= $budget ? 5 : -4;
        }

        if ($size && in_array($size, $product->available_sizes, true)) {
            $score += 5;
        }

        if ($color && $this->productMatchesColor($product, $color)) {
            $score += 8;
        }

        if ((int) $product->sold > 0) {
            $score += min(4, (int) floor($product->sold / 10) + 1);
        }

        return $score;
    }

    private function searchProductsFromDatabase(
        string $message,
        ?float $budget,
        ?string $size,
        ?string $color,
        array $categoryIds,
        array $requiredProductPhrases,
        ?int $currentProductId
    ) {
        $query = Product::with(['categories', 'images', 'shop']);

        if (!empty($categoryIds)) {
            $query->whereHas('categories', function ($categoryQuery) use ($categoryIds) {
                $categoryQuery->whereIn('categories.id', $categoryIds);
            });
        }

        if ($budget !== null) {
            $query->where('price', '<=', $budget);
        }

        return $query->get()
            ->map(function (Product $product) use ($message, $budget, $size, $color, $requiredProductPhrases, $currentProductId) {
                $score = $this->scoreProduct($product, $message, $budget, $size, $color, $requiredProductPhrases);

                if ($currentProductId === $product->id) {
                    $score += 6;
                }

                $product->advisor_score = $score;

                return $product;
            })
            ->filter(fn (Product $product) => ($product->advisor_score > 0 || $budget !== null) && $this->productHasStock($product) && $this->productMatchesColor($product, $color) && $this->productMatchesRequiredPhrases($product, $requiredProductPhrases) && $this->productMatchesRequestedGenericType($product, $message) && $this->productMatchesRequestRestrictions($product, $message))
            ->sortByDesc('advisor_score')
            ->take(self::RECOMMENDATION_LIMIT)
            ->values();
    }

    private function resolveContextProductId(string $message, array $validated): ?int
    {
        if (!empty($validated['current_product_id'])) {
            return (int) $validated['current_product_id'];
        }

        $recommendedIds = data_get($validated, 'conversation_context.recommended_product_ids', []);

        if (!is_array($recommendedIds) || empty($recommendedIds)) {
            return null;
        }

        if (preg_match('/(?:#|ma|id)\s*(\d+)/i', $message, $match)) {
            $explicitId = (int) $match[1];

            if (in_array($explicitId, array_map('intval', $recommendedIds), true)) {
                return $explicitId;
            }
        }

        return (int) $recommendedIds[0];
    }

    private function isProductFollowUpQuestion(string $message): bool
    {
        return Str::contains($message, [
            "cái đó",
            "sản phẩm đó",
            "sản phẩm này",
            "màu này",
            "cái này",
            "nó có",
            "chất liệu",
            'size',
            "màu",
            'shop',
            "thương hiệu",
            "phù hợp",
            "có hợp",
            "nên mua",
            "mô tả",
            "tồn kho",
            "còn hàng",
        ]);
    }

    private function isNewProductSearchRequest(string $message): bool
    {
        return Str::contains($message, [
            "t\u{00F4}i c\u{1EA7}n",
            "c\u{1EA7}n t\u{00EC}m",
            "c\u{1EA7}n mua",
            "t\u{00EC}m mua",
            "mu\u{1ED1}n mua",
            "g\u{1EE3}i \u{00FD}",
            "t\u{00F4}i mu\u{1ED1}n t\u{00EC}m",
            "mu\u{1ED1}n t\u{00EC}m",
            "t\u{00F4}i mu\u{1ED1}n mua",
            "t\u{00EC}m ki\u{1EBF}m",
        ]);
    }

    private function answerProductFollowUp(Product $product, string $message): string
    {
        $lines = [
            "Mình đang tư vấn thêm về: " . $product->name,
            "- Link chi tiết: " . $this->productDetailPath($product),
            "- Giá: " . $this->formatCurrency((float) $product->price),
        ];

        if (Str::contains($message, ["chất liệu", "vải"])) {
            $lines[] = "- Chất liệu: " . ($product->material ?: "Hiện chưa có dữ liệu chất liệu.");
        }

        if (Str::contains($message, ['size', "kích cỡ"])) {
            $lines[] = !empty($product->available_sizes)
                ? "- Size còn hàng: " . implode(', ', $product->available_sizes)
                : "- Hiện chưa có dữ liệu size còn hàng.";
        }

        if (Str::contains($message, ["màu"])) {
            $lines[] = !empty($product->available_colors)
                ? "- Màu còn hàng: " . implode(', ', $product->available_colors)
                : "- Hiện chưa có dữ liệu màu còn hàng.";
        }

        if (Str::contains($message, ['shop', "cửa hàng"])) {
            $lines[] = "- Cửa hàng: " . ($product->shop_name ?: "Đang cập nhật.");
        }

        if (Str::contains($message, ["thương hiệu", 'brand'])) {
            $lines[] = "- Thương hiệu: " . ($product->brand ?: "Đang cập nhật.");
        }

        if (Str::contains($message, ["phù hợp", "có hợp", "nên mua", "vì sao"])) {
            $lines[] = "- Lý do phù hợp: " . $this->productFitReason($product);
        }

        if (Str::contains($message, ["mô tả", "chi tiết"])) {
            $lines[] = "- Mô tả: " . ($product->description ? Str::limit(trim(preg_replace('/\s+/', ' ', $product->description)), 220) : "Hiện chưa có mô tả chi tiết.");
        }

        if (count($lines) <= 3) {
            $lines[] = "- Lý do phù hợp: " . $this->productFitReason($product);
            if ($product->description) {
                $lines[] = "- Mô tả ngắn: " . Str::limit(trim(preg_replace('/\s+/', ' ', $product->description)), 180);
            }
        }

        return implode("\n", $lines);
    }

    private function productFitReason(Product $product): string
    {
        $reasons = [];

        if ($product->design_style) {
            $reasons[] = "ki\u{1EC3}u d\u{00E1}ng " . $product->design_style;
        }

        if ($product->fashion_style) {
            $reasons[] = "phong c\u{00E1}ch " . $product->fashion_style;
        }

        if ($product->material) {
            $reasons[] = "ch\u{1EA5}t li\u{1EC7}u " . $product->material;
        }

        if (!empty($product->available_sizes)) {
            $reasons[] = "c\u{00F2}n size " . implode(', ', $product->available_sizes);
        }

        if (!empty($product->available_colors)) {
            $reasons[] = "c\u{00F3} m\u{00E0}u " . implode(', ', $product->available_colors);
        }

        return !empty($reasons)
            ? implode('; ', array_slice($reasons, 0, 4)) . '.'
            : "S\u{1EA3}n ph\u{1EA9}m c\u{00F2}n trong d\u{1EEF} li\u{1EC7}u hi\u{1EC7}n c\u{00F3}, b\u{1EA1}n c\u{00F3} th\u{1EC3} xem chi ti\u{1EBF}t \u{0111}\u{1EC3} \u{0111}\u{00E1}nh gi\u{00E1} th\u{00EA}m.";
    }



    private function productSearchHaystack(Product $product): string
    {
        return $this->normalize(collect([
            $product->name,
            $product->brand,
            $product->material,
            $product->origin,
            $product->design_style,
            $product->fashion_style,
            $product->description,
            $product->categories->pluck('name')->implode(' '),
            is_array($product->colors) ? implode(' ', $product->colors) : '',
            implode(' ', $product->available_sizes),
            implode(' ', $product->available_colors),
            $product->shop_name,
        ])->filter()->implode(' '));
    }

    private function productMatchesRequiredPhrases(Product $product, array $requiredProductPhrases): bool
    {
        if (empty($requiredProductPhrases)) {
            return true;
        }

        $haystack = $this->productSearchHaystack($product);

        foreach ($requiredProductPhrases as $phraseGroup) {
            $matchedGroup = false;

            foreach ((array) $phraseGroup as $phrase) {
                if (Str::contains($haystack, $this->normalizeSearchTerm($phrase))) {
                    $matchedGroup = true;
                    break;
                }
            }

            if (!$matchedGroup) {
                return false;
            }
        }

        return true;
    }

    private function productMatchesRequestedGenericType(Product $product, string $message): bool
    {
        $genericTerms = [
            'ao',
            'quan',
            'vay',
            'dam',
            'giay',
            'tui',
            'phu kien',
            'do ngu',
            'do the thao',
        ];

        $requestedTerms = collect($genericTerms)
            ->filter(fn (string $term) => $this->containsSearchTerm($message, $term))
            ->values();

        if ($requestedTerms->isEmpty()) {
            return true;
        }

        $haystack = $this->productSearchHaystack($product);

        return $requestedTerms->contains(fn (string $term) => $this->containsSearchTerm($haystack, $term));
    }

    private function productMatchesRequestRestrictions(Product $product, string $message): bool
    {
        $haystack = $this->productSearchHaystack($product);

        if ($this->isPartyElegantRequest($message)) {
            if ($this->containsAnySearchTerm($haystack, [
                "\u{0111}\u{00F9}i",
                "qu\u{1EA7}n \u{0111}\u{00F9}i",
                "qu\u{1EA7}n c\u{1ED9}c",
                "c\u{1ED9}c",
                'short',
                'sneaker',
                "th\u{1EC3} thao",
                'sport',
                'sporty',
                'gym',
                "v\u{0103}n ph\u{00F2}ng",
                "c\u{00F4}ng s\u{1EDF}",
                "m\u{1EB7}c nh\u{00E0}",
                "\u{1EDF} nh\u{00E0}",
                "\u{0111}\u{1ED3} ng\u{1EE7}",
                'pajama',
                'pijama',
            ])) {
                return false;
            }

            return $this->containsAnySearchTerm($haystack, [
                "d\u{1EF1} ti\u{1EC7}c",
                "\u{0111}i ti\u{1EC7}c",
                "ti\u{1EC7}c",
                'party',
                "sang tr\u{1ECD}ng",
                "l\u{1EC5} h\u{1ED9}i",
                "ph\u{1ED1}i ren",
                "ren hoa",
            ]);
        }

        if ($this->isOfficeOrPoliteRequest($message)) {
            return !$this->containsAnySearchTerm($haystack, [
                "\u{0111}\u{00F9}i",
                "qu\u{1EA7}n \u{0111}\u{00F9}i",
                "qu\u{1EA7}n c\u{1ED9}c",
                "c\u{1ED9}c",
                'short',
                'sneaker',
                "th\u{1EC3} thao",
                'sport',
                'sporty',
                "d\u{1EF1} ti\u{1EC7}c",
                "\u{0111}i ti\u{1EC7}c",
                "\u{0111}i ch\u{01A1}i",
                "h\u{1EB9}n h\u{00F2}",
                "l\u{1EC5} h\u{1ED9}i",
                "m\u{1EB7}c nh\u{00E0}",
                "\u{1EDF} nh\u{00E0}",
                "\u{0111}\u{1ED3} ng\u{1EE7}",
                'pajama',
                'pijama',
            ]);
        }

        if (
            ($this->containsSearchTerm($message, 'quan di lam')
                || $this->containsSearchTerm($message, 'quan cong so')
                || ($this->containsSearchTerm($message, 'quan') && $this->containsSearchTerm($message, 'cong so')))
        ) {
            return !Str::contains($haystack, [
                "quần đùi",
                "đùi",
                "quần cộc",
                "cộc",
                'short',
            ]);
        }

        return true;
    }

    private function containsAnySearchTerm(string $haystack, array $terms): bool
    {
        foreach ($terms as $term) {
            if ($this->containsSearchTerm($haystack, $term)) {
                return true;
            }
        }

        return false;
    }

    private function isOfficeOrPoliteRequest(string $message): bool
    {
        return Str::contains($message, [
            "v\u{0103}n ph\u{00F2}ng",
            "l\u{1ECB}ch s\u{1EF1}",
            "c\u{00F4}ng s\u{1EDF}",
            "\u{0111}i l\u{00E0}m",
            "ph\u{1ECF}ng v\u{1EA5}n",
            "g\u{1EB7}p kh\u{00E1}ch",
            "ch\u{1EC9}n chu",
            'office',
            'formal',
        ]);
    }

    private function isPartyElegantRequest(string $message): bool
    {
        return Str::contains($message, [
            "\u{0111}i ti\u{1EC7}c",
            "d\u{1EF1} ti\u{1EC7}c",
            "ti\u{1EC7}c",
            "sang tr\u{1ECD}ng",
            "l\u{1EC5} h\u{1ED9}i",
            'party',
        ]);
    }

    private function productMatchesColor(Product $product, ?string $color): bool
    {
        if (!$color) {
            return true;
        }

        $colors = collect([
            is_array($product->colors) ? implode(' ', $product->colors) : '',
            implode(' ', $product->available_colors),
        ])->filter()->implode(' ');

        return Str::contains($this->normalize($colors), $this->normalizeSearchTerm($color));
    }

    private function productHasStock(Product $product): bool
    {
        if ((int) $product->remaining <= 0) {
            return false;
        }

        if (is_array($product->size_details) && !empty($product->size_details)) {
            return collect($product->size_details)->sum(function ($value) {
                return is_array($value) ? collect($value)->sum(fn ($qty) => (int) $qty) : (int) $value;
            }) > 0;
        }

        return (int) $product->quantity > 0;
    }

    private function shouldAskForMoreShoppingContext(string $message, ?float $budget, ?string $size, ?string $color, array $requiredProductPhrases): bool
    {
        if ($budget !== null || $size !== null || $color !== null || !empty($requiredProductPhrases)) {
            return false;
        }

        if ($this->hasSemanticShoppingSignal($message)) {
            return false;
        }

        if (!Str::contains($message, ["tôi cần", "cần mua", "tìm", "gợi ý", "muốn mua"])) {
            return false;
        }

        $specificSignals = [
            "đi tiệc",
            "dự tiệc",
            "đi chơi",
            "đi làm",
            "công sở",
            "thể thao",
            'gym',
            "ngủ",
            'hoodie',
            "sơ mi",
            "áo phông",
            "áo thun",
            "quần jean",
            "quần tây",
            'sneaker',
            'sandal',
            "túi xách",
            "thắt lưng",
            "kính",
            "khăn",
            "trang sức",
        ];

        return !Str::contains($message, $specificSignals);
    }


    private function hasSemanticShoppingSignal(string $message): bool
    {
        return Str::contains($message, [
            "\u{0111}i ti\u{1EC7}c",
            "d\u{1EF1} ti\u{1EC7}c",
            "v\u{0103}n ph\u{00F2}ng",
            "l\u{1ECB}ch s\u{1EF1}",
            "sang tr\u{1ECD}ng",
            "thanh l\u{1ECB}ch",
            "tho\u{1EA3}i m\u{00E1}i",
            "n\u{0103}ng \u{0111}\u{1ED9}ng",
            "d\u{1EC5} ph\u{1ED1}i",
            "\u{0111}i l\u{00E0}m",
            "\u{0111}i ch\u{01A1}i",
            "t\u{1EAD}p gym",
            "ch\u{1EA1}y b\u{1ED9}",
            "m\u{00F9}a h\u{00E8}",
            "m\u{00F9}a \u{0111}\u{00F4}ng",
            "ph\u{1ECF}ng v\u{1EA5}n",
            "h\u{1EB9}n h\u{00F2}",
            "cu\u{1ED1}i tu\u{1EA7}n",
            "\u{0111}\u{00F4}i n\u{00E0}o",
        ]);
    }

    private function buildShoppingClarificationQuestion(string $message, ?float $budget, ?string $size): string
    {
        $missing = [];

        if ($budget === null) {
            $missing[] = "ngân sách";
        }

        if ($size === null) {
            $missing[] = 'size';
        }

        $missing[] = "phong cách hoặc dịp sử dụng";

        return "Bạn cho mình biết thêm " . implode(', ', array_unique($missing)) . " nhé. Ví dụ: \"áo phông size M dưới 150k phong cách basic\" hoặc \"váy đi tiệc dưới 500k\".";
    }

    private function isPriceSensitiveProductQuestion(string $message, ?float $budget): bool
    {
        return $budget !== null || Str::contains($message, [
            "giá",
            'vnd',
            "đồng",
            "ngân sách",
            "dưới",
            "trên",
            "rẻ hơn",
            "đắt hơn",
            "khoảng giá",
        ]);
    }

    private function buildProductRecommendationReply($products, ?float $budget, ?string $size, array $requiredProductPhrases = []): string
    {
        if ($products->isEmpty()) {
            return $this->buildNoProductDataReply($budget, $requiredProductPhrases);
        }

        $lines = [];

        if ($budget !== null) {
            $lines[] = "M\u{00EC}nh t\u{00EC}m th\u{1EA5}y c\u{00E1}c s\u{1EA3}n ph\u{1EA9}m c\u{00F3} gi\u{00E1} kh\u{00F4}ng v\u{01B0}\u{1EE3}t qu\u{00E1} " . $this->formatCurrency($budget) . ':';
        } else {
            $lines[] = "M\u{00EC}nh t\u{00EC}m th\u{1EA5}y c\u{00E1}c s\u{1EA3}n ph\u{1EA9}m ph\u{00F9} h\u{1EE3}p t\u{1EEB} d\u{1EEF} li\u{1EC7}u hi\u{1EC7}n c\u{00F3}:";
        }

        foreach ($products->take(self::RECOMMENDATION_LIMIT)->values() as $index => $product) {
            $lines[] = '';
            $lines[] = ($index + 1) . '. ' . $product->name;
            $lines[] = '   - ' . "Link chi ti\u{1EBF}t: " . $this->productDetailPath($product);
            $lines[] = '   - ' . "Gi\u{00E1}: " . $this->formatCurrency((float) $product->price);

            if ($product->brand) {
                $lines[] = '   - ' . "Th\u{01B0}\u{01A1}ng hi\u{1EC7}u: " . $product->brand;
            }

            if ($product->material) {
                $lines[] = '   - ' . "Ch\u{1EA5}t li\u{1EC7}u: " . $product->material;
            }

            if ($product->design_style) {
                $lines[] = '   - ' . "Ki\u{1EC3}u d\u{00E1}ng: " . $product->design_style;
            }

            if ($product->fashion_style) {
                $lines[] = '   - ' . "Phong c\u{00E1}ch: " . $product->fashion_style;
            }

            $lines[] = '   - ' . "L\u{00FD} do ph\u{00F9} h\u{1EE3}p: " . $this->productFitReason($product);

            if ($size && in_array($size, $product->available_sizes, true)) {
                $lines[] = '   - ' . "Size ph\u{00F9} h\u{1EE3}p: " . $size;
            } elseif (!empty($product->available_sizes)) {
                $lines[] = '   - ' . "Size c\u{00F2}n h\u{00E0}ng: " . implode(', ', $product->available_sizes);
            }

            if (!empty($product->available_colors)) {
                $lines[] = '   - ' . "M\u{00E0}u c\u{00F2}n h\u{00E0}ng: " . implode(', ', $product->available_colors);
            }

            if ($product->description) {
                $lines[] = '   - ' . "M\u{00F4} t\u{1EA3}: " . Str::limit(trim(preg_replace('/\\s+/', ' ', $product->description)), 180);
            }
        }

        $lines[] = '';
        $lines[] = "Th\u{00F4}ng tin tr\u{00EA}n \u{0111}\u{01B0}\u{1EE3}c l\u{1EA5}y tr\u{1EF1}c ti\u{1EBF}p t\u{1EEB} t\u{00EA}n, danh m\u{1EE5}c, m\u{00F4} t\u{1EA3}, gi\u{00E1} v\u{00E0} t\u{1ED3}n kho s\u{1EA3}n ph\u{1EA9}m; b\u{1EA1}n c\u{00F3} th\u{1EC3} b\u{1EA5}m v\u{00E0}o th\u{1EBB} g\u{1EE3}i \u{00FD} \u{0111}\u{1EC3} xem chi ti\u{1EBF}t.";

        return implode("\n", $lines);
    }



    private function productDetailPath(Product $product): string
    {
        return '/?productId=' . $product->id;
    }

    private function buildNoProductDataReply(?float $budget, array $requiredProductPhrases = []): string
    {
        $conditions = [];

        if (!empty($requiredProductPhrases)) {
            $conditions[] = "c\u{1EE5}m s\u{1EA3}n ph\u{1EA9}m \"" . implode(' ', array_map(fn ($group) => $this->normalizeSearchTerm($group[0] ?? ''), $requiredProductPhrases)) . '"';
        }

        if ($budget !== null) {
            $conditions[] = "ng\u{00E2}n s\u{00E1}ch d\u{01B0}\u{1EDB}i " . $this->formatCurrency($budget);
        }

        return empty($conditions)
            ? "Hi\u{1EC7}n t\u{1EA1}i t\u{00F4}i ch\u{01B0}a c\u{00F3} d\u{1EEF} li\u{1EC7}u s\u{1EA3}n ph\u{1EA9}m ph\u{00F9} h\u{1EE3}p."
            : "Hi\u{1EC7}n t\u{00F4}i ch\u{01B0}a c\u{00F3} d\u{1EEF} li\u{1EC7}u s\u{1EA3}n ph\u{1EA9}m ph\u{00F9} h\u{1EE3}p v\u{1EDB}i " . implode(" v\u{00E0} ", $conditions) . '.';
    }



    private function detectCategoryIds(string $message): array
    {
        $strictProductTypeCategoryIds = $this->detectStrictProductTypeCategoryIds($message);

        if (!empty($strictProductTypeCategoryIds)) {
            return $strictProductTypeCategoryIds;
        }

        $rules = [
            'giaydep' => ['giay di lam', 'giay cong so', 'giay van phong', 'giay dep', 'giay', 'sneaker', 'shoe', 'sandal'],
            'docongso' => ['do cong so', 'cong so', 'di lam', 'office'],
            'dothethao' => ['do the thao', 'the thao', 'gym', 'sport', 'yoga'],
            'dongu' => ['do ngu', 'pijama', 'pajama'],
            'dolot' => ['do lot', 'noi y'],
            'tuixach' => ['tui xach', 'tui', 'bag'],
            'phukien' => ['phu kien', 'that lung', 'belt', 'mu', 'non', 'hat', 'cap', 'kinh', 'glasses', 'sunglasses', 'khan', 'scarf', 'tat', 'vo', 'socks', 'trang suc', 'jewelry', 'nhan', 'vong', 'day chuyen', 'bong tai', 'kep toc', 'buoc toc', 'hair'],
            'setdo' => ['set do', 'bo do', 'outfit'],
        ];

        foreach ($rules as $categoryKey => $keywords) {
            foreach ($keywords as $keyword) {
                if ($this->containsSearchTerm($message, $keyword)) {
                    return $this->categoryIdsForKey($categoryKey);
                }
            }
        }

        $dynamicCategoryIds = $this->detectDynamicCategoryIds($message);

        if (!empty($dynamicCategoryIds)) {
            return $dynamicCategoryIds;
        }

        return [];
    }

    private function detectDynamicCategoryIds(string $message): array
    {
        return Category::query()
            ->get(['id', 'name', 'slug'])
            ->filter(function (Category $category) use ($message) {
                $terms = array_filter([
                    $category->name,
                    $category->slug,
                    $category->slug ? str_replace('-', ' ', $category->slug) : null,
                ]);

                foreach ($terms as $term) {
                    $normalizedTerm = $this->normalizeSearchTerm((string) $term);

                    if ($normalizedTerm !== '' && $this->containsSearchTerm($message, $normalizedTerm)) {
                        return true;
                    }
                }

                return false;
            })
            ->pluck('id')
            ->values()
            ->toArray();
    }

    private function detectStrictProductTypeCategoryIds(string $message): array
    {
        $rules = [
            'giaydep' => ['giay di lam', 'giay cong so', 'giay van phong', 'giay dep', 'giay', 'sneaker', 'shoe', 'sandal'],
            'aokhoac' => ['ao khoac', 'khoac', 'jacket', 'coat', 'blazer'],
            'quan' => ['quan', 'pants', 'jean', 'short'],
            'vaydam' => ['vay', 'dam', 'dress', 'skirt'],
            'ao' => ['ao', 'shirt', 'top', 'hoodie', 'sweater'],
        ];

        foreach ($rules as $categoryKey => $keywords) {
            foreach ($keywords as $keyword) {
                if ($this->containsSearchTerm($message, $keyword)) {
                    return $this->categoryIdsForKey($categoryKey);
                }
            }
        }

        $dynamicCategoryIds = $this->detectDynamicCategoryIds($message);

        if (!empty($dynamicCategoryIds)) {
            return $dynamicCategoryIds;
        }

        return [];
    }

    private function categoryIdsForKey(string $categoryKey): array
    {
        $keywords = $this->categoryHints[$categoryKey] ?? [];

        $dynamicIds = Category::query()
            ->get(['id', 'name', 'slug'])
            ->filter(function (Category $category) use ($keywords) {
                $categoryText = $this->normalize(collect([
                    $category->name,
                    $category->slug,
                    $category->slug ? str_replace('-', ' ', $category->slug) : null,
                ])->filter()->implode(' '));

                foreach ($keywords as $keyword) {
                    $normalizedKeyword = $this->normalizeSearchTerm($keyword);

                    if ($normalizedKeyword !== '' && Str::contains($categoryText, $normalizedKeyword)) {
                        return true;
                    }
                }

                return false;
            })
            ->pluck('id')
            ->values()
            ->toArray();

        return !empty($dynamicIds) ? $dynamicIds : ($this->categoryIds[$categoryKey] ?? []);
    }

    private function detectRequiredProductPhrases(string $message): array
    {
        $rules = [
            [['ao so mi', 'so mi'], ['ao', 'shirt'], ['so mi']],
            [['ao phong', 'ao thun', 't shirt', 'tee'], ['ao', 'shirt', 'top'], ['phong', 'thun', 't shirt', 'tee']],
            [['ao khoac gio', 'windbreaker'], ['ao', 'khoac', 'jacket'], ['gio', 'windbreaker']],
            [['ao hoodie', 'hoodie'], ['ao', 'hoodie'], ['hoodie']],
            [['ao the thao', 'ao gym', 'sport shirt'], ['ao', 'shirt', 'top'], ['the thao', 'sport', 'gym', 'sporty']],
            [['ao di choi', 'ao casual'], ['ao', 'shirt', 'top'], ['di choi', 'casual', 'basic', 'co ban', 'nang dong', 'toi gian', 'duong pho', 'streetwear', 'han quoc']],
            [['ao gia re', 'ao re', 'ao binh dan'], ['ao', 'shirt', 'top']],

            [['quan tay', 'quan au', 'trouser', 'dress pants'], ['quan', 'pants', 'trouser'], ['tay', 'au', 'trouser', 'dress pants', 'cong so', 'di lam', 'office']],
            [['quan di lam', 'quan cong so', 'office pants'], ['quan', 'pants', 'trouser'], ['di lam', 'cong so', 'office', 'tay', 'au', 'trouser', 'dress pants']],
            [['quan jean', 'jeans', 'denim'], ['quan', 'pants', 'jean'], ['jean', 'denim']],
            [['quan short', 'short'], ['quan', 'pants', 'short'], ['short']],
            [['quan the thao', 'quan gym', 'sport pants'], ['quan', 'pants', 'short'], ['the thao', 'sport', 'gym', 'yoga', 'sporty']],

            [['giay the thao'], ['giay', 'sneaker', 'shoe'], ['the thao', 'sport', 'sporty', 'sneaker']],
            [['giay di lam', 'giay cong so', 'giay van phong'], ['giay', 'shoe'], ['di lam', 'cong so', 'office', 'derby', 'giay tay', 'basic']],
            [['giay sandal', 'sandal'], ['giay', 'sandal'], ['sandal']],
            [['sneaker'], ['sneaker']],
            [['shoe'], ['shoe', 'sneaker']],

            [['dam du tiec', 'vay du tiec', 'dam di tiec', 'vay di tiec', 'party dress'], ['vay', 'dam', 'dress'], ['du tiec', 'di tiec', 'party']],
            [['vay cong so', 'dam cong so', 'vay di lam', 'dam di lam', 'office dress'], ['vay', 'dam', 'dress'], ['cong so', 'di lam', 'office']],
            [['chan vay', 'skirt'], ['chan vay', 'skirt']],

            [['do ngu', 'pijama', 'pajama'], ['do ngu', 'pijama', 'pajama']],
            [['do the thao', 'set the thao', 'bo the thao'], ['the thao', 'sport', 'gym', 'yoga', 'sporty']],
            [['tui xach di lam', 'tui cong so', 'office bag'], ['tui', 'bag'], ['di lam', 'cong so', 'office']],
            [['tui xach', 'bag'], ['tui', 'bag']],
            [['that lung', 'belt'], ['that lung', 'belt']],
            [['mu luoi trai', 'non luoi trai', 'cap'], ['mu', 'non', 'hat', 'cap'], ['luoi trai', 'cap']],
            [['mu', 'non', 'hat'], ['mu', 'non', 'hat', 'cap']],
            [['kinh ram', 'kinh mat', 'sunglasses'], ['kinh', 'glasses', 'sunglasses'], ['ram', 'mat', 'sunglasses']],
            [['kinh', 'glasses'], ['kinh', 'glasses', 'sunglasses']],
            [['khan choang', 'khan quang', 'scarf'], ['khan', 'scarf']],
            [['tat', 'vo', 'socks'], ['tat', 'vo', 'socks']],
            [['trang suc', 'jewelry'], ['trang suc', 'jewelry', 'nhan', 'vong', 'day chuyen', 'bong tai']],
            [['nhan'], ['nhan', 'ring']],
            [['vong tay', 'bracelet'], ['vong tay', 'bracelet']],
            [['day chuyen', 'vong co', 'necklace'], ['day chuyen', 'vong co', 'necklace']],
            [['bong tai', 'khuyen tai', 'earring'], ['bong tai', 'khuyen tai', 'earring']],
            [['kep toc', 'buoc toc', 'phu kien toc', 'hair accessory'], ['kep toc', 'buoc toc', 'phu kien toc', 'hair']],
            [['phu kien'], ['phu kien', 'that lung', 'belt', 'mu', 'non', 'hat', 'cap', 'kinh', 'glasses', 'sunglasses', 'khan', 'scarf', 'tat', 'vo', 'socks', 'trang suc', 'jewelry', 'nhan', 'vong', 'day chuyen', 'bong tai', 'kep toc', 'buoc toc', 'hair']],
        ];

        $requiredGroups = [];

        foreach ($rules as $rule) {
            $triggers = $rule[0] ?? [];
            $phraseGroups = array_slice($rule, 1);

            foreach ($triggers as $trigger) {
                if ($this->containsSearchTerm($message, $trigger)) {
                    foreach ($phraseGroups as $requiredPhrases) {
                        $requiredGroups[] = $requiredPhrases;
                    }
                    break;
                }
            }
        }

        return $requiredGroups;
    }

    private function normalizeSearchTerm(string $term): string
    {
        $term = $this->normalize($term);

        return strtr($term, [
            'ao so mi' => "\u{00E1}o s\u{01A1} mi",
            'so mi' => "s\u{01A1} mi",
            'ao phong' => "\u{00E1}o ph\u{00F4}ng",
            'ao thun' => "\u{00E1}o thun",
            'ao khoac gio' => "\u{00E1}o kho\u{00E1}c gi\u{00F3}",
            'ao khoac' => "\u{00E1}o kho\u{00E1}c",
            'ao the thao' => "\u{00E1}o th\u{1EC3} thao",
            'ao di choi' => "\u{00E1}o \u{0111}i ch\u{01A1}i",
            'ao gia re' => "\u{00E1}o gi\u{00E1} r\u{1EBB}",
            'ao re' => "\u{00E1}o r\u{1EBB}",
            'ao binh dan' => "\u{00E1}o b\u{00EC}nh d\u{00E2}n",
            'ao' => "\u{00E1}o",
            'quan tay' => "qu\u{1EA7}n t\u{00E2}y",
            'quan au' => "qu\u{1EA7}n \u{00E2}u",
            'quan jean' => "qu\u{1EA7}n jean",
            'quan the thao' => "qu\u{1EA7}n th\u{1EC3} thao",
            'quan di lam' => "qu\u{1EA7}n \u{0111}i l\u{00E0}m",
            'quan cong so' => "qu\u{1EA7}n c\u{00F4}ng s\u{1EDF}",
            'quan short' => "qu\u{1EA7}n short",
            'quan' => "qu\u{1EA7}n",
            'vay du tiec' => "v\u{00E1}y d\u{1EF1} ti\u{1EC7}c",
            'vay di tiec' => "v\u{00E1}y \u{0111}i ti\u{1EC7}c",
            'vay cong so' => "v\u{00E1}y c\u{00F4}ng s\u{1EDF}",
            'vay di lam' => "v\u{00E1}y \u{0111}i l\u{00E0}m",
            'chan vay' => "ch\u{00E2}n v\u{00E1}y",
            'vay' => "v\u{00E1}y",
            'dam du tiec' => "\u{0111}\u{1EA7}m d\u{1EF1} ti\u{1EC7}c",
            'dam di tiec' => "\u{0111}\u{1EA7}m \u{0111}i ti\u{1EC7}c",
            'dam cong so' => "\u{0111}\u{1EA7}m c\u{00F4}ng s\u{1EDF}",
            'dam di lam' => "\u{0111}\u{1EA7}m \u{0111}i l\u{00E0}m",
            'dam' => "\u{0111}\u{1EA7}m",
            'giay dep' => "gi\u{00E0}y d\u{00E9}p",
            'giay the thao' => "gi\u{00E0}y th\u{1EC3} thao",
            'giay di lam' => "gi\u{00E0}y \u{0111}i l\u{00E0}m",
            'giay cong so' => "gi\u{00E0}y c\u{00F4}ng s\u{1EDF}",
            'giay van phong' => "gi\u{00E0}y v\u{0103}n ph\u{00F2}ng",
            'giay tay' => "gi\u{00E0}y t\u{00E2}y",
            'giay' => "gi\u{00E0}y",
            'tui xach' => "t\u{00FA}i x\u{00E1}ch",
            'tui' => "t\u{00FA}i",
            'phu kien' => "ph\u{1EE5} ki\u{1EC7}n",
            'do the thao' => "\u{0111}\u{1ED3} th\u{1EC3} thao",
            'do cong so' => "\u{0111}\u{1ED3} c\u{00F4}ng s\u{1EDF}",
            'do ngu' => "\u{0111}\u{1ED3} ng\u{1EE7}",
            'do lot' => "\u{0111}\u{1ED3} l\u{00F3}t",
            'the thao' => "th\u{1EC3} thao",
            'cong so' => "c\u{00F4}ng s\u{1EDF}",
            'di lam' => "\u{0111}i l\u{00E0}m",
            'di choi' => "\u{0111}i ch\u{01A1}i",
            'di tiec' => "\u{0111}i ti\u{1EC7}c",
            'du tiec' => "d\u{1EF1} ti\u{1EC7}c",
            'gia re' => "gi\u{00E1} r\u{1EBB}",
            'duoi' => "d\u{01B0}\u{1EDB}i",
            'tren' => "tr\u{00EA}n",
            'den' => "\u{0111}en",
            'trang' => "tr\u{1EAF}ng",
            'do' => "\u{0111}\u{1ECF}",
            'vang' => "v\u{00E0}ng",
            'hong' => "h\u{1ED3}ng",
            'tim' => "t\u{00ED}m",
            'nau' => "n\u{00E2}u",
            'xam' => "x\u{00E1}m",
        ]);
    }


    private function containsSearchTerm(string $message, string $term): bool
    {
        $normalizedTerm = preg_quote($this->normalizeSearchTerm($term), '/');

        return $normalizedTerm !== ''
            && preg_match('/(^|\s)' . $normalizedTerm . '($|\s)/u', $message) === 1;
    }

    private function isLikelyUnaccentedVietnameseInput(string $message): bool
    {
        $lowerMessage = Str::lower($message);

        if (preg_match('/[\x{00E0}\x{00E1}\x{1EA1}\x{1EA3}\x{00E3}\x{00E2}\x{1EA7}\x{1EA5}\x{1EAD}\x{1EA9}\x{1EAB}\x{0103}\x{1EB1}\x{1EAF}\x{1EB7}\x{1EB3}\x{1EB5}\x{00E8}\x{00E9}\x{1EB9}\x{1EBB}\x{1EBD}\x{00EA}\x{1EC1}\x{1EBF}\x{1EC7}\x{1EC3}\x{1EC5}\x{00EC}\x{00ED}\x{1ECB}\x{1EC9}\x{0129}\x{00F2}\x{00F3}\x{1ECD}\x{1ECF}\x{00F5}\x{00F4}\x{1ED3}\x{1ED1}\x{1ED9}\x{1ED5}\x{1ED7}\x{01A1}\x{1EDD}\x{1EDB}\x{1EE3}\x{1EDF}\x{1EE3}\x{00F9}\x{00FA}\x{1EE5}\x{1EE7}\x{0169}\x{01B0}\x{1EEB}\x{1EE9}\x{1EF1}\x{1EED}\x{1EEF}\x{1EF3}\x{00FD}\x{1EF5}\x{1EF7}\x{1EF9}\x{0111}]/u', $lowerMessage)) {
            return false;
        }

        return preg_match('/\b(toi|can|tim|mua|ao|quan|vay|dam|giay|tui|gia|duoi|tren|re|mau|den|trang|do|tim|xanh|vang|hong|nau|phu kien|the thao|cong so)\b/u', $lowerMessage) === 1;
    }

    private function searchProductsWithQdrant(
        string $rawMessage,
        string $normalizedMessage,
        ?float $budget,
        ?string $size,
        ?string $color,
        array $categoryIds,
        array $requiredProductPhrases,
        ?int $currentProductId
    ) {
        try {
            if (!$this->isQdrantConfigured()) {
                return collect();
            }

            $qdrantUrl = rtrim(config('services.qdrant.url'), '/');
            $collection = config('services.qdrant.collection');
            $searchLimit = max(self::RECOMMENDATION_LIMIT, (int) config('services.qdrant.search_limit', 12));
            $candidateLimit = max(self::RECOMMENDATION_LIMIT, (int) config('services.qdrant.candidate_limit', self::RECOMMENDATION_LIMIT));
            
            $vector = app(ProductVectorSyncService::class)->textToVector($rawMessage);
            if (empty($vector)) {
                return collect();
            }

            $response = $this->qdrantHttp()
                ->timeout(30)
                ->post("{$qdrantUrl}/collections/{$collection}/points/search", [
                    'vector' => $vector,
                    'limit' => $searchLimit,
                    'with_payload' => true,
                ]);

            if (!$response->successful()) {
                return collect();
            }

            $matches = collect($response->json('result') ?? []);
            $productIds = $matches
                ->pluck('id')
                ->map(fn ($id) => (int) $id)
                ->filter()
                ->values();

            if ($productIds->isEmpty()) {
                return collect();
            }

            $qdrantScores = $matches->mapWithKeys(function ($match) {
                return [(int) $match['id'] => (float) ($match['score'] ?? 0)];
            });

            $query = Product::with(['categories', 'images', 'shop'])
                ->whereIn('id', $productIds)
                ->when($budget !== null, function ($productQuery) use ($budget) {
                    $productQuery->where('price', '<=', $budget);
                })
                ->when(!empty($categoryIds), function ($productQuery) use ($categoryIds) {
                    $productQuery->whereHas('categories', function ($categoryQuery) use ($categoryIds) {
                        $categoryQuery->whereIn('categories.id', $categoryIds);
                    });
                });

            return $query->get()
                ->map(function (Product $product) use ($normalizedMessage, $budget, $size, $color, $requiredProductPhrases, $currentProductId, $qdrantScores) {
                    $score = $this->scoreProduct($product, $normalizedMessage, $budget, $size, $color, $requiredProductPhrases);
                    $score += (float) ($qdrantScores[$product->id] ?? 0) * 10;

                    if ($currentProductId === $product->id) {
                        $score += 6;
                    }

                    $product->advisor_score = $score;

                    return $product;
                })
                ->filter(fn (Product $product) => $this->productHasStock($product) && $product->advisor_score > 0 && $this->productMatchesColor($product, $color) && $this->productMatchesRequiredPhrases($product, $requiredProductPhrases) && $this->productMatchesRequestedGenericType($product, $normalizedMessage) && $this->productMatchesRequestRestrictions($product, $normalizedMessage))
                ->sortByDesc('advisor_score')
                ->take($candidateLimit)
                ->values();
        } catch (\Throwable $e) {
            report($e);

            return collect();
        }
    }

    private function qdrantHttp()
    {
        return Http::withHeaders([
            'api-key' => config('services.qdrant.api_key'),
            'Content-Type' => 'application/json',
        ]);
    }

    private function isQdrantConfigured(): bool
    {
        return filled(config('services.qdrant.url')) && filled(config('services.qdrant.api_key'));
    }

    private function isFashionAdviceQuestion(string $message): bool
    {
        if ($this->isNewProductSearchRequest($message)) {
            return false;
        }

        return Str::contains($message, [
            "n\u{00EA}n ch\u{1ECD}n",
            "n\u{00EA}n ph\u{1ED1}i",
            "ph\u{1ED1}i \u{0111}\u{1ED3}",
            "ch\u{1EA5}t li\u{1EC7}u n\u{00E0}o",
            "m\u{00E0}u g\u{00EC}",
            "m\u{00E0}u n\u{00E0}o",
            "form n\u{00E0}o",
            "ki\u{1EC3}u n\u{00E0}o",
            "d\u{00E1}ng ng\u{01B0}\u{1EDD}i",
            "m\u{1EB7}c m\u{00F9}a h\u{00E8}",
            "m\u{1EB7}c m\u{00F9}a \u{0111}\u{00F4}ng",
            "m\u{1EB7}c \u{0111}i ph\u{1ECF}ng v\u{1EA5}n",
            "phong c\u{00E1}ch n\u{00E0}o",
            "l\u{00E0}m sao \u{0111}\u{1EC3} ch\u{1ECD}n",
        ]);
    }

    private function askOllamaForFashionAdvice(string $userMessage): string
    {
        $ollamaUrl = rtrim(config('services.ollama.url'), '/');
        $model = config('services.ollama.model');

        $systemPrompt = implode("\n", [
            'Bạn là chatbot AI tư vấn thời trang cho website thương mại điện tử.',
            'Người dùng đang hỏi kiến thức tư vấn chung, không bắt buộc phải trả danh sách sản phẩm.',
            'Trả lời bằng tiếng Việt có dấu, ngắn gọn, thực tế, dễ áp dụng.',
            'Không tự bịa sản phẩm, giá, màu, size hoặc tồn kho nếu không có dữ liệu sản phẩm.',
            'Nếu phù hợp, hãy gợi ý các tiêu chí chọn sản phẩm như chất liệu, form dáng, màu sắc, phong cách và dịp sử dụng.',
            // 'Ưu tiên giải thích theo dạng: nên chọn gì, vì sao phù hợp, và lưu ý khi phối đồ.',
            // 'Nếu câu hỏi liên quan đến dáng người, hãy tư vấn theo chiều cao, cân nặng hoặc số đo nếu người dùng cung cấp.',
            ''
        ]);

        try {
            $response = Http::timeout(60)->post($ollamaUrl . '/api/chat', [
                'model' => $model,
                'stream' => false,
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => $userMessage],
                ],
                'options' => [
                    'temperature' => 0.35,
                    'top_p' => 0.9,
                    'top_k' => 40,
                    'repeat_penalty' => 1.1,
                    'num_ctx' => 2048,
                    'num_predict' => 300,
                ],
            ]);

            if ($response->successful()) {
                $content = data_get($response->json(), 'message.content');

                if (is_string($content) && trim($content) !== '') {
                    return trim($content);
                }
            }
        } catch (\Throwable $e) {
            report($e);
        }

        return 'Mình chưa thể gọi Ollama để tư vấn lúc này. Với câu hỏi chung về thời trang, bạn có thể hỏi lại sau khi Ollama đang chạy.';
    }

    private function askOllama(string $userMessage, $products, ?float $budget, ?string $size, ?string $color): string
    {
        $ollamaUrl = rtrim(config('services.ollama.url'), '/');
        $model = config('services.ollama.model');
        $catalogStats = $this->catalogStats();
        $productContext = $products->map(function (Product $product) {
            return [
                'id' => $product->id,
                'name' => $product->name,
                'price' => (float) $product->price,
                'price_vnd' => (int) round((float) $product->price),
                'formatted_price' => $this->formatCurrency((float) $product->price),
                'brand' => $product->brand,
                'material' => $product->material,
                'origin' => $product->origin,
                'design_style' => $product->design_style,
                'fashion_style' => $product->fashion_style,
                'description' => $product->description,
                'colors' => $product->colors,
                'colors_in_stock' => $product->available_colors,
                'sizes_in_stock' => $product->available_sizes,
                'quantity' => (int) $product->quantity,
                'remaining' => (int) $product->remaining,
                'sold' => (int) $product->sold,
                'shop_name' => $product->shop_name,
                'categories' => $product->categories->pluck('name')->values(),
            ];
        })->values()->toArray();

        $systemPrompt = implode("\n", [
            'Bạn là chatbot AI tư vấn sản phẩm cho website thương mại điện tử thời trang.',
            'Mục tiêu: hiểu nhu cầu khách hàng, hỏi lại khi thiếu thông tin quan trọng, và đề xuất sản phẩm phù hợp nhất từ dữ liệu có sẵn.',
            'Chỉ trả lời dựa trên dữ liệu JSON được cung cấp trong context.',
            'Tuyệt đối không tự bịa tên sản phẩm, số lượng sản phẩm, giá, màu, size hoặc tồn kho.',
            'Khi nói về giá, phải copy đúng formatted_price từ candidate_products; không tự thêm bớt chữ số, không làm tròn, không ước lượng.',
            'Nếu context không có dữ liệu để trả lời, hãy nói rõ: Hiện tôi chưa có dữ liệu phù hợp.',
            'Nếu detected_budget có giá trị, chỉ được đề xuất sản phẩm có price nhỏ hơn hoặc bằng detected_budget; không bao giờ nói sản phẩm vượt ngân sách là phù hợp.',
            'Nếu khách hỏi số lượng/tổng số sản phẩm, chỉ dùng catalog_stats, không ước lượng.',
            'Nếu khách hỏi doanh thu, đơn hàng, thống kê cửa hàng thì chỉ dùng shop_analytics nếu có; nếu không có shop_analytics thì nói rằng cần tài khoản chủ cửa hàng.',
            'Khi tư vấn sản phẩm, ưu tiên đúng ngân sách, size, màu, chất liệu, thương hiệu, kiểu dáng, phong cách, danh mục, số lượng đã bán và tồn kho.',
            'Nếu có nhiều sản phẩm phù hợp, so sánh ngắn gọn 2-4 lựa chọn và nêu lý do.',
            'Trả lời bằng tiếng Việt tự nhiên, ngắn gọn, dễ đọc; không nói về JSON hay context với người dùng.',
            'Nếu thiếu thông tin như ngân sách, size, phong cách, dịp sử dụng, hãy hỏi thêm 1 câu ngắn gọn thay vì đoạn dài.',
            // 'Khi đề xuất sản phẩm, mỗi sản phẩm phải có: tên, giá, link chi tiết, lý do phù hợp.',
        ]);

        $userPrompt = json_encode([
            'customer_message' => $userMessage,
            'detected_budget' => $budget,
            'detected_size' => $size,
            'detected_color' => $color,
            'catalog_stats' => $catalogStats,
            'candidate_products' => $productContext,
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        try {
            $response = Http::timeout(90)->post($ollamaUrl . '/api/chat', [
                'model' => $model,
                'stream' => false,
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => $userPrompt],
                ],
                'options' => [
                    'temperature' => 0.25,
                    'top_p' => 0.9,
                    'top_k' => 40,
                    'repeat_penalty' => 1.12,
                    'num_ctx' => 4096,
                    'num_predict' => 450,
                ],
            ]);

            if ($response->successful()) {
                $content = data_get($response->json(), 'message.content');

                if (is_string($content) && trim($content) !== '') {
                    return trim($content);
                }
            }
        } catch (\Throwable $e) {
            report($e);
        }

        return 'Ollama hiện chưa phản hồi. Hãy kiểm tra Ollama đã chạy và model đã được pull, ví dụ: ollama pull ' . $model . '.';
    }

    private function isProductCountQuestion(string $message): bool
    {
        return Str::contains($message, [
            'bao nhiêu sản phẩm',
            'có mấy sản phẩm',
            'tổng số sản phẩm',
            'số lượng sản phẩm',
            'đếm sản phẩm',
            'hiện có bao nhiêu',
        ]);
    }

    private function answerProductCount(string $message): string
    {
        $stats = $this->catalogStats($this->shouldUseShopScope($message));
        $scopeLabel = $stats['scope'] === 'shop' ? 'của cửa hàng bạn' : 'trên hệ thống';

        return "Hiện {$scopeLabel} có {$stats['total_products']} sản phẩm, trong đó {$stats['in_stock_products']} sản phẩm còn hàng.";
    }

    private function catalogStats(bool $shopScope = false): array
    {
        $query = Product::query();
        $scope = 'all';

        if ($shopScope) {
            $user = $this->currentUser();
            if ($user && $user->shop) {
                $query->where('shop_id', $user->shop->id);
                $scope = 'shop';
            }
        }

        $total = (clone $query)->count();
        $inStock = (clone $query)
            ->where(function ($stockQuery) {
                $stockQuery->whereNull('quantity')->orWhere('quantity', '>', 0);
            })
            ->count();

        return [
            'scope' => $scope,
            'total_products' => $total,
            'in_stock_products' => $inStock,
        ];
    }

    private function shouldUseShopScope(string $message): bool
    {
        $user = $this->currentUser();

        if (!$user || $user->role !== 'shop_owner') {
            return false;
        }

        if (Str::contains($message, ['toàn hệ thống', 'tất cả cửa hàng', 'tất cả shop'])) {
            return false;
        }

        return true;
    }

    private function isShopAnalyticsQuestion(string $message): bool
    {
        return Str::contains($message, [
            'doanh thu',
            'doanh số',
            'đơn hàng',
            'đơn chưa xử lý',
            'chưa xử lý',
            'chờ xử lý',
            'sản phẩm đã bán',
            'đã bán được bao nhiêu',
            'thống kê',
            'theo tháng',
            'tháng này',
        ]);
    }

    private function answerShopAnalyticsQuestion(string $message): string
    {
        $user = $this->currentUser();

        if (!$user || $user->role !== 'shop_owner') {
            return 'Chức năng thống kê đơn hàng và doanh thu chỉ dành cho tài khoản chủ cửa hàng.';
        }

        if (!$user->shop) {
            return 'Tài khoản này chưa có cửa hàng nên chưa có dữ liệu đơn hàng/doanh thu.';
        }

        $productOrdersReply = $this->answerShopProductOrdersQuestion($message, (int) $user->shop->id, (string) $user->shop->name);
        if ($productOrdersReply !== null) {
            return $productOrdersReply;
        }

        $this->ensureShopStatistics((int) $user->shop->id);

        $statistics = ShopMonthlyStatistic::where('shop_id', $user->shop->id)
            ->orderBy('month')
            ->get();
        $currentMonth = now()->format('Y-m');
        $currentMonthStatistic = $statistics->firstWhere('month', $currentMonth);

        $totalRevenue = (float) $statistics->sum('revenue');
        $soldProducts = (int) $statistics->sum('sold_products');
        $pendingOrders = (int) $statistics->sum('pending_orders');
        $completedOrders = (int) $statistics->sum('completed_orders');
        $totalOrders = (int) $statistics->sum('total_orders');
        $monthRevenue = (float) ($currentMonthStatistic->revenue ?? 0);
        $monthCompletedOrders = (int) ($currentMonthStatistic->completed_orders ?? 0);
        $monthSoldProducts = (int) ($currentMonthStatistic->sold_products ?? 0);

        $lines = [
            "Thống kê cửa hàng {$user->shop->name}:",
            "- Tổng doanh thu từ đơn hoàn thành: " . $this->formatCurrency($totalRevenue),
            "- Tổng đơn hàng: {$totalOrders}",
            "- Đơn hàng chưa xử lý: {$pendingOrders}",
            "- Đơn đã hoàn thành: {$completedOrders}",
            "- Sản phẩm đã bán từ đơn hoàn thành: {$soldProducts}",
            "- Tháng {$currentMonth}: {$monthCompletedOrders} đơn hoàn thành, doanh thu " . $this->formatCurrency($monthRevenue) . ", đã bán {$monthSoldProducts} sản phẩm.",
        ];

        if (Str::contains($message, ['theo tháng', 'từng tháng', 'mỗi tháng', 'các tháng'])) {
            $monthlyLines = $statistics
                ->sortByDesc('month')
                ->take(6)
                ->map(function (ShopMonthlyStatistic $statistic) {
                    return "- {$statistic->month}: {$statistic->completed_orders} đơn hoàn thành, doanh thu " . $this->formatCurrency((float) $statistic->revenue) . ", đã bán {$statistic->sold_products} sản phẩm.";
                })
                ->values()
                ->toArray();

            if (!empty($monthlyLines)) {
                $lines[] = "Chi tiết theo tháng gần nhất:";
                $lines = array_merge($lines, $monthlyLines);
            }
        }

        if ($statistics->isEmpty() || $totalOrders === 0) {
            return "Cửa hàng {$user->shop->name} hiện chưa có dữ liệu thống kê đơn hàng. Hãy tạo/cập nhật đơn hàng hoặc mở trang dashboard để đồng bộ thống kê.";
        }

        return implode("\n", $lines);
    }

    private function answerShopProductOrdersQuestion(string $message, int $shopId, string $shopName): ?string
    {
        if (!Str::contains($message, ['đơn hàng', 'đơn'])) {
            return null;
        }

        $categoryIds = $this->detectCategoryIds($message);
        $requiredProductPhrases = $this->detectRequiredProductPhrases($message);

        if (empty($categoryIds) && empty($requiredProductPhrases)) {
            return null;
        }

        $orders = Order::with(['details.product.categories', 'user'])
            ->where('shop_id', $shopId)
            ->latest()
            ->get();

        $matchedOrders = $orders
            ->map(function (Order $order) use ($message, $categoryIds, $requiredProductPhrases) {
                $matchedDetails = $order->details->filter(function ($detail) use ($message, $categoryIds, $requiredProductPhrases) {
                    $product = $detail->product;

                    if ($product) {
                        $matchesCategory = empty($categoryIds)
                            || $product->categories->pluck('id')->map(fn ($id) => (int) $id)->intersect($categoryIds)->isNotEmpty();

                        return $matchesCategory
                            && $this->productMatchesRequiredPhrases($product, $requiredProductPhrases)
                            && $this->productMatchesRequestedGenericType($product, $message);
                    }

                    $productName = $this->normalize((string) $detail->product_name);
                    if ($productName === '') {
                        return false;
                    }

                    if (!empty($requiredProductPhrases)) {
                        foreach ($requiredProductPhrases as $phraseGroup) {
                            $matchedGroup = false;

                            foreach ((array) $phraseGroup as $phrase) {
                                if (Str::contains($productName, $this->normalizeSearchTerm($phrase))) {
                                    $matchedGroup = true;
                                    break;
                                }
                            }

                            if (!$matchedGroup) {
                                return false;
                            }
                        }

                        return true;
                    }

                    foreach ($this->categoryHints as $hints) {
                        foreach ($hints as $hint) {
                            if ($this->containsSearchTerm($message, $hint) && Str::contains($productName, $this->normalizeSearchTerm($hint))) {
                                return true;
                            }
                        }
                    }

                    return false;
                })->values();

                $order->matched_details_for_advisor = $matchedDetails;

                return $matchedDetails->isNotEmpty() ? $order : null;
            })
            ->filter()
            ->values();

        $filterLabel = $this->orderProductFilterLabel($message, $categoryIds, $requiredProductPhrases);

        if ($matchedOrders->isEmpty()) {
            return "Cửa hàng {$shopName} hiện chưa có đơn hàng nào chứa sản phẩm phù hợp với {$filterLabel}.";
        }

        $matchedDetails = $matchedOrders->flatMap(fn (Order $order) => $order->matched_details_for_advisor);
        $totalQuantity = $matchedDetails->sum(fn ($detail) => (int) $detail->quantity);
        $totalValue = $matchedDetails->sum(fn ($detail) => (float) $detail->price * (int) $detail->quantity);
        $pendingOrders = $matchedOrders->filter(fn (Order $order) => in_array($order->status, ['pending', 'processing'], true))->count();
        $completedOrders = $matchedOrders
            ->filter(fn (Order $order) => in_array($order->status, ['completed', 'delivered'], true) && $order->payment_status === 'paid')
            ->count();

        $lines = [
            "Đơn hàng của cửa hàng {$shopName} có sản phẩm phù hợp với {$filterLabel}:",
            "- Số đơn hàng: " . $matchedOrders->count(),
            "- Số lượng sản phẩm trong các đơn này: {$totalQuantity}",
            "- Giá trị sản phẩm tương ứng: " . $this->formatCurrency($totalValue),
            "- Đơn chưa xử lý/đang xử lý: {$pendingOrders}",
            "- Đơn đã hoàn thành: {$completedOrders}",
            '',
            'Một số đơn gần nhất:',
        ];

        foreach ($matchedOrders->take(5) as $order) {
            $names = $order->matched_details_for_advisor
                ->map(fn ($detail) => $detail->product_name . ' x' . (int) $detail->quantity)
                ->implode(', ');

            $lines[] = "- Đơn #{$order->id} ({$order->status}, {$order->payment_status}) - {$names} - " . $order->created_at->format('d/m/Y H:i');
        }

        return implode("\n", $lines);
    }

    private function orderProductFilterLabel(string $message, array $categoryIds, array $requiredProductPhrases): string
    {
        if (!empty($requiredProductPhrases)) {
            $phrases = collect($requiredProductPhrases)
                ->map(fn ($group) => $this->normalizeSearchTerm((string) ($group[0] ?? '')))
                ->filter()
                ->unique()
                ->values()
                ->implode(', ');

            if ($phrases !== '') {
                return '"' . $phrases . '"';
            }
        }

        if (!empty($categoryIds)) {
            $categoryNames = Category::whereIn('id', $categoryIds)
                ->pluck('name')
                ->filter()
                ->values()
                ->implode(', ');

            if ($categoryNames !== '') {
                return '"' . $categoryNames . '"';
            }
        }

        return 'yêu cầu của bạn';
    }

    private function sumOrderQuantity(Order $order): int
    {
        $items = is_string($order->order_details)
            ? json_decode($order->order_details, true)
            : $order->order_details;

        return collect($items)->sum(fn ($item) => (int) ($item['quantity'] ?? 0));
    }

    private function ensureShopStatistics(int $shopId): void
    {
        $months = Order::where('shop_id', $shopId)
            ->selectRaw("distinct to_char(created_at, 'YYYY-MM') as month")
            ->pluck('month');

        foreach ($months as $month) {
            if (ShopMonthlyStatistic::where('shop_id', $shopId)->where('month', $month)->exists()) {
                continue;
            }

            $orders = Order::where('shop_id', $shopId)
                ->whereRaw("to_char(created_at, 'YYYY-MM') = ?", [$month])
                ->get();

            $completedOrders = $orders->filter(function (Order $order) {
                return $order->status === 'delivered' && $order->payment_status === 'paid';
            });

            ShopMonthlyStatistic::updateOrCreate(
                [
                    'shop_id' => $shopId,
                    'month' => $month,
                ],
                [
                    'total_orders' => $orders->count(),
                    'pending_orders' => $orders->where('status', 'pending')->count(),
                    'completed_orders' => $completedOrders->count(),
                    'sold_products' => $completedOrders->sum(fn (Order $order) => $this->sumOrderQuantity($order)),
                    'revenue' => $completedOrders->sum('total_amount'),
                ]
            );
        }
    }

    private function resolveProductsForSizeAdvice(array $validated, ?int $contextProductId)
    {
        $ids = collect(data_get($validated, 'conversation_context.recommended_product_ids', []))
            ->push($contextProductId)
            ->push($validated['current_product_id'] ?? null)
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        if ($ids->isEmpty()) {
            return collect();
        }

        return Product::with(['categories', 'images', 'shop'])
            ->whereIn('id', $ids)
            ->get()
            ->sortBy(fn (Product $product) => $ids->search((int) $product->id))
            ->values();
    }

    private function extractBodyMeasurements(string $message, $contextProducts = null): array
    {
        $measurements = [];
        $normalizedMessage = $this->normalize($message);

        if (preg_match('/(?:cao|chiều cao)\s*(\d(?:[,.]\d{1,2})|\d{2,3})\s*(m|cm)?/iu', $normalizedMessage, $match)) {
            $height = (float) str_replace(',', '.', $match[1]);
            $measurements['height_cm'] = $height < 3 ? $height * 100 : $height;
        } elseif (preg_match('/(\d{2,3})\s*cm/iu', $normalizedMessage, $match) && Str::contains($normalizedMessage, ['cao', 'chiều cao'])) {
            $measurements['height_cm'] = (float) $match[1];
        }

        if (preg_match('/(?:nặng|cân nặng)\s*(\d{2,3}(?:[,.]\d)?)\s*kg/iu', $normalizedMessage, $match)) {
            $measurements['weight_kg'] = (float) str_replace(',', '.', $match[1]);
        } elseif (preg_match('/(\d{2,3}(?:[,.]\d)?)\s*kg/iu', $normalizedMessage, $match)) {
            $measurements['weight_kg'] = (float) str_replace(',', '.', $match[1]);
        }

        if (preg_match('/(?:vòng ngực|ngực)\s*(\d{2,3}(?:[,.]\d)?)/iu', $normalizedMessage, $match)) {
            $measurements['chest_cm'] = (float) str_replace(',', '.', $match[1]);
        }

        if (preg_match('/(?:vòng eo|eo)\s*(\d{2,3}(?:[,.]\d)?)/iu', $normalizedMessage, $match)) {
            $measurements['waist_cm'] = (float) str_replace(',', '.', $match[1]);
        }

        if (preg_match('/(?:vòng hông|hông|mông)\s*(\d{2,3}(?:[,.]\d)?)/iu', $normalizedMessage, $match)) {
            $measurements['hip_cm'] = (float) str_replace(',', '.', $match[1]);
        }

        if (preg_match('/(?:bàn chân|chiều dài chân|dài chân|chân dài)\s*(\d{2}(?:[,.]\d)?)\s*cm?/iu', $normalizedMessage, $match)) {
            $measurements['foot_length_cm'] = (float) str_replace(',', '.', $match[1]);
        }

        if (
            !isset($measurements['foot_length_cm'])
            && $this->isShoeSizeAdviceContext($contextProducts)
            && preg_match('/(?:khoảng|tầm|cỡ|size)?\s*(\d{2}(?:[,.]\d)?)\s*cm\b/iu', $normalizedMessage, $match)
        ) {
            $footLength = (float) str_replace(',', '.', $match[1]);

            if ($footLength >= 20 && $footLength <= 32) {
                $measurements['foot_length_cm'] = $footLength;
            }
        }

        return $measurements;
    }

    private function isShoeSizeAdviceContext($products): bool
    {
        if (!$products || $products->isEmpty()) {
            return false;
        }

        return $products->contains(function (Product $product) {
            return $product->categories->contains(function (Category $category) {
                $categoryName = $this->normalize((string) $category->name);

                return (int) $category->id === 4
                    || Str::contains($categoryName, ['giày', 'giay']);
            });
        });
    }

    private function buildSizeAdviceReply($products, array $measurements): string
    {
        $lines = [
            'Mình dựa trên bảng size đang lưu trong hệ thống để gợi ý như sau:',
        ];

        foreach ($products->take(self::RECOMMENDATION_LIMIT)->values() as $index => $product) {
            $lines[] = '';
            $lines[] = ($index + 1) . '. ' . $product->name;
            $lines[] = '   - Link chi tiết: ' . $this->productDetailPath($product);

            if (empty($product->available_sizes)) {
                $lines[] = '   - Sản phẩm này hiện không có size cần chọn hoặc chưa có tồn kho theo size.';
                continue;
            }

            $charts = $this->sizeChartsForProduct($product);

            if ($charts->isEmpty()) {
                $lines[] = '   - Hiện chưa có bảng size cho loại sản phẩm này.';
                $lines[] = '   - Size còn hàng: ' . implode(', ', $product->available_sizes);
                continue;
            }

            $matchedChart = $this->bestSizeChartMatch($charts, $measurements, $product->available_sizes);

            if (!$matchedChart) {
                $lines[] = '   - Mình chưa đủ số đo để chọn size chắc chắn.';
                $lines[] = '   - Size còn hàng: ' . implode(', ', $product->available_sizes);
                $lines[] = '   - Bạn gửi thêm ' . $this->missingMeasurementHint($product, $measurements) . ' nhé.';
                continue;
            }

            $lines[] = '   - Size nên chọn: ' . $matchedChart->size;
            $lines[] = '   - Lý do: số đo của bạn nằm gần/thuộc khoảng size ' . $matchedChart->size . ' trong bảng size.';

            if ($matchedChart->note) {
                $lines[] = '   - Ghi chú: ' . $matchedChart->note;
            }
        }

        $lines[] = '';
        $lines[] = 'Nếu bạn thích mặc rộng hơn hoặc sản phẩm có form ôm, có thể cân nhắc tăng thêm 1 size.';

        return implode("\n", $lines);
    }

    private function sizeChartsForProduct(Product $product)
    {
        $categoryIds = $product->categories->pluck('id')->map(fn ($id) => (int) $id)->values()->toArray();
        $availableSizes = collect($product->available_sizes)->map(fn ($size) => (string) $size)->values()->toArray();

        return SizeChart::query()
            ->when(!empty($categoryIds), fn ($query) => $query->whereIn('category_id', $categoryIds))
            ->when(!empty($availableSizes), fn ($query) => $query->whereIn('size', $availableSizes))
            ->orderBy('category_id')
            ->orderBy('id')
            ->get();
    }

    private function bestSizeChartMatch($charts, array $measurements, array $availableSizes): ?SizeChart
    {
        $availableSizes = array_map('strval', $availableSizes);
        $bestChart = null;
        $bestScore = null;

        foreach ($charts as $chart) {
            if (!in_array((string) $chart->size, $availableSizes, true)) {
                continue;
            }

            $score = $this->scoreSizeChart($chart, $measurements);

            if ($score === null) {
                continue;
            }

            if ($bestScore === null || $score > $bestScore) {
                $bestScore = $score;
                $bestChart = $chart;
            }
        }

        return $bestScore !== null && $bestScore >= 1 ? $bestChart : null;
    }

    private function scoreSizeChart(SizeChart $chart, array $measurements): ?int
    {
        $fields = [
            'height_cm' => ['min_height_cm', 'max_height_cm'],
            'weight_kg' => ['min_weight_kg', 'max_weight_kg'],
            'chest_cm' => ['min_chest_cm', 'max_chest_cm'],
            'waist_cm' => ['min_waist_cm', 'max_waist_cm'],
            'hip_cm' => ['min_hip_cm', 'max_hip_cm'],
            'foot_length_cm' => ['min_foot_length_cm', 'max_foot_length_cm'],
        ];

        $score = 0;
        $checked = 0;

        foreach ($fields as $measurementKey => [$minKey, $maxKey]) {
            if (!array_key_exists($measurementKey, $measurements) || $chart->{$minKey} === null || $chart->{$maxKey} === null) {
                continue;
            }

            $checked++;
            $value = (float) $measurements[$measurementKey];
            $min = (float) $chart->{$minKey};
            $max = (float) $chart->{$maxKey};

            if ($value >= $min && $value <= $max) {
                $score += 3;
            } elseif ($value >= ($min - 3) && $value <= ($max + 3)) {
                $score += 1;
            } else {
                $score -= 3;
            }
        }

        return $checked > 0 ? $score : null;
    }

    private function missingMeasurementHint(Product $product, array $measurements): string
    {
        $categoryText = $this->normalize($product->categories->pluck('name')->implode(' '));

        if (Str::contains($categoryText, ['giày', 'giay'])) {
            return 'chiều dài bàn chân tính bằng cm';
        }

        $missing = [];

        if (!isset($measurements['height_cm'])) {
            $missing[] = 'chiều cao';
        }

        if (!isset($measurements['weight_kg'])) {
            $missing[] = 'cân nặng';
        }

        if (!isset($measurements['chest_cm']) && Str::contains($categoryText, ['áo', 'ao'])) {
            $missing[] = 'vòng ngực';
        }

        if (!isset($measurements['waist_cm']) && Str::contains($categoryText, ['quần', 'quan', 'váy', 'vay', 'đầm', 'dam'])) {
            $missing[] = 'vòng eo';
        }

        if (!isset($measurements['hip_cm']) && Str::contains($categoryText, ['quần', 'quan', 'váy', 'vay', 'đầm', 'dam'])) {
            $missing[] = 'vòng hông';
        }

        return !empty($missing) ? implode(', ', array_unique($missing)) : 'chiều cao, cân nặng và số đo cơ thể';
    }

    private function appendSizeMeasurementPrompt(string $reply, $products): string
    {
        if ($products->isEmpty() || !$this->productsHaveSizeChart($products)) {
            return $reply;
        }

        $firstProduct = $products->first();
        $categoryText = $this->normalize($firstProduct->categories->pluck('name')->implode(' '));

        $question = Str::contains($categoryText, ["gi\u{00E0}y", 'giay'])
            ? "B\u{1EA1}n c\u{00F3} th\u{1EC3} g\u{1EED}i chi\u{1EC1}u d\u{00E0}i b\u{00E0}n ch\u{00E2}n t\u{00ED}nh b\u{1EB1}ng cm \u{0111}\u{1EC3} m\u{00EC}nh g\u{1EE3}i \u{00FD} size gi\u{00E0}y ph\u{00F9} h\u{1EE3}p theo b\u{1EA3}ng size."
            : "B\u{1EA1}n c\u{00F3} th\u{1EC3} g\u{1EED}i chi\u{1EC1}u cao, c\u{00E2}n n\u{1EB7}ng, v\u{00F2}ng ng\u{1EF1}c/eo/h\u{00F4}ng \u{0111}\u{1EC3} m\u{00EC}nh g\u{1EE3}i \u{00FD} size ph\u{00F9} h\u{1EE3}p theo b\u{1EA3}ng size.";

        return rtrim($reply) . "\n\n" . $question;
    }


    private function productsHaveSizeChart($products): bool
    {
        return $products->take(self::RECOMMENDATION_LIMIT)->contains(function (Product $product) {
            return !empty($product->available_sizes) && $this->sizeChartsForProduct($product)->isNotEmpty();
        });
    }

    private function formatCurrency(float $amount): string
    {
        return number_format($amount, 0, ',', '.') . ' VND';
    }

    private function currentUser()
    {
        return Auth::guard('sanctum')->user() ?? Auth::user();
    }

    private function extractBudget(string $message): ?float
    {
        if (Str::contains($message, ["giá vừa phải", "vừa phải", "tầm giá vừa", "không quá đắt", "bình dân"])) {
            return 300000;
        }

        if (Str::contains($message, ["giá rẻ", "rẻ tiền", "rẻ hơn"])) {
            if ($this->containsSearchTerm($message, "giày")) {
                return 150000;
            }

            return 150000;
        }

        if (!preg_match('/(\d+(?:[.,]\d+)*)\s*(tri\x{1EC7}u|tr|k|ngh\x{00EC}n|ng\x{00E0}n|vnd|\x{0111})?/u', $message, $match)) {
            return null;
        }

        $rawValue = $match[1];
        $unit = $match[2] ?? '';

        if (in_array($unit, ["triệu", 'tr'], true)) {
            $value = (float) str_replace(',', '.', $rawValue);
            return $value * 1000000;
        }

        if (in_array($unit, ['k', "nghìn", "ngàn"], true)) {
            $value = (float) str_replace(',', '.', $rawValue);
            return $value * 1000;
        }

        $value = preg_match('/^\d{1,3}([.,]\d{3})+$/', $rawValue)
            ? (float) str_replace(['.', ','], '', $rawValue)
            : (float) str_replace(',', '.', $rawValue);

        return $value >= 10000 ? $value : null;
    }

    private function extractSize(string $message): ?string
    {
        if (preg_match('/(?:\bsize\s*|\bc\x{1EE1}\s*)(xs|s|m|l|xl|xxl|3xl|free size)\b/iu', $message, $match)) {
            return strtoupper($match[1]);
        }

        if (preg_match('/(^|\s)(xs|xl|xxl|3xl|free size)($|\s)/iu', $message, $match)) {
            return strtoupper($match[2]);
        }

        return null;
    }

    private function extractColor(string $message): ?string
    {
        $colors = [
            "đen",
            "trắng",
            "đỏ",
            'xanh than',
            'xanh navy',
            'xanh',
            "vàng",
            "hồng",
            "tím",
            "nâu",
            'be',
            'beige',
            'kem',
            "xám",
            'ghi',
            'cam',
        ];

        foreach ($colors as $color) {
            if ($color === "tím" && !$this->hasPurpleColorIntent($message)) {
                continue;
            }

            if ($this->containsSearchTerm($message, $color)) {
                return $color;
            }
        }

        return null;
    }

    private function hasPurpleColorIntent(string $message): bool
    {
        if ($this->containsSearchTerm($message, "màu tím")) {
            return true;
        }

        return preg_match('/(^|\s)(\x{00E1}o|qu\x{1EA7}n|v\x{00E1}y|\x{0111}\x{1EA7}m|gi\x{00E0}y|t\x{00FA}i|ph\x{1EE5} ki\x{1EC7}n|\x{0111}\x{1ED3})\s+t\x{00ED}m($|\s)/u', $message) === 1;
    }

    private function normalize(string $value): string
    {
        $value = Str::lower($value);

        return trim(preg_replace('/\s+/', ' ', $value));
    }

    private function normalizeWithAccents(string $value): string
    {
        $value = Str::lower($value);

        return trim(preg_replace('/\s+/', ' ', $value));
    }

    private function containsSearchTermWithAccents(string $message, string $term): bool
    {
        $normalizedTerm = preg_quote($this->normalizeWithAccents($term), '/');

        return $normalizedTerm !== ''
            && preg_match('/(^|\s)' . $normalizedTerm . '($|\s)/u', $message) === 1;
    }
}
