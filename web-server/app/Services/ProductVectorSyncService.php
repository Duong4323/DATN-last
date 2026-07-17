<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductVectorSync;
use Illuminate\Support\Facades\Http;

class ProductVectorSyncService
{
    public function syncAllProducts(): void
    {
        if (!$this->isConfigured()) {
            return;
        }

        $this->ensureCollection();

        /** @var \Illuminate\Database\Eloquent\Collection<int, Product> $products */
        $products = Product::query()->with(['categories', 'images', 'shop'])->get();

        if ($products->isEmpty()) {
            return;
        }

        $points = [];
        $syncRecords = [];

        foreach ($products as $product) {
            /** @var Product $product */
            $syncData = $this->buildPointIfStale($product);

            if ($syncData) {
                $points[] = $syncData['point'];
                $syncRecords[] = $syncData['sync'];
            }
        }

        if (empty($points)) {
            return;
        }

        $response = $this->qdrantHttp()
            ->timeout(60)
            ->put($this->qdrantUrl() . '/collections/' . $this->collection() . '/points?wait=true', [
                'points' => $points,
            ]);

        if ($response->successful()) {
            foreach ($syncRecords as $syncRecord) {
                $this->markVectorSynced($syncRecord);
            }
        }
    }

    public function syncProduct(Product $product): void
    {
        if (!$this->isConfigured()) {
            return;
        }

        try {
            $this->ensureCollection();

            $product->loadMissing(['categories', 'images', 'shop']);
            $syncData = $this->buildPointIfStale($product, true);

            if (!$syncData) {
                return;
            }

            $response = $this->qdrantHttp()
                ->timeout(30)
                ->put($this->qdrantUrl() . '/collections/' . $this->collection() . '/points?wait=true', [
                    'points' => [$syncData['point']],
                ]);

            if ($response->successful()) {
                $this->markVectorSynced($syncData['sync']);
            }
        } catch (\Throwable $e) {
            report($e);
        }
    }

    public function deleteProduct(int $productId): void
    {
        if (!$this->isConfigured()) {
            return;
        }

        try {
            $this->qdrantHttp()
                ->timeout(30)
                ->post($this->qdrantUrl() . '/collections/' . $this->collection() . '/points/delete?wait=true', [
                    'points' => [$productId],
                ]);

            ProductVectorSync::where('product_id', $productId)->delete();
        } catch (\Throwable $e) {
            report($e);
        }
    }

    public function textToVector(string $text): array
    {
        $embeddingModel = config('services.ollama.embedding_model');

        if (blank($embeddingModel)) {
            return [];
        }

        try {
            $response = Http::timeout(30)->post(rtrim(config('services.ollama.url'), '/') . '/api/embeddings', [
                'model' => $embeddingModel,
                'prompt' => $text,
            ]);

            if ($response->successful()) {
                $embedding = $response->json('embedding') ?? [];
                return is_array($embedding) ? $embedding : [];
            }
        } catch (\Throwable $e) {
            report($e);
        }

        return [];
    }

    public function buildProductSearchText(Product $product): string
    {
        return collect([
            $product->name,
            $product->brand,
            $product->material,
            $product->origin,
            $product->design_style,
            $product->fashion_style,
            $product->description,
            is_array($product->colors) ? implode(' ', $product->colors) : '',
            $product->categories->pluck('name')->implode(' '),
            implode(' ', $product->available_sizes),
            implode(' ', $product->available_colors),
            $product->shop_name,
        ])->filter()->implode(' ');
    }

    private function buildPointIfStale(Product $product, bool $force = false): ?array
    {
        $searchText = $this->buildProductSearchText($product);
        $syncContent = $this->buildSyncContent($product, $searchText);
        $contentHash = hash('sha256', json_encode($syncContent, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
        $existingSync = ProductVectorSync::where('product_id', $product->id)->first();

        if (!$force && $existingSync && $existingSync->content_hash === $contentHash) {
            return null;
        }

        $vector = $this->textToVector($searchText);

        if (empty($vector)) {
            return null;
        }

        return [
            'point' => [
                'id' => $product->id,
                'vector' => $vector,
                'payload' => $syncContent,
            ],
            'sync' => [
                'product_id' => $product->id,
                'qdrant_point_id' => $product->id,
                'collection' => $this->collection(),
                'embedding_model' => config('services.ollama.embedding_model'),
                'content_hash' => $contentHash,
                'search_text' => $searchText,
            ],
        ];
    }

    private function markVectorSynced(array $syncRecord): void
    {
        ProductVectorSync::updateOrCreate(
            ['product_id' => $syncRecord['product_id']],
            array_merge($syncRecord, ['synced_at' => now()])
        );
    }

    private function buildSyncContent(Product $product, string $searchText): array
    {
        return [
            'product_id' => $product->id,
            'name' => $product->name,
            'price' => (float) $product->price,
            'brand' => $product->brand,
            'material' => $product->material,
            'origin' => $product->origin,
            'design_style' => $product->design_style,
            'fashion_style' => $product->fashion_style,
            'description' => $product->description,
            'colors' => $product->colors,
            'available_sizes' => $product->available_sizes,
            'available_colors' => $product->available_colors,
            'quantity' => (int) $product->quantity,
            'sold' => (int) $product->sold,
            'shop_name' => $product->shop_name,
            'categories' => $product->categories->pluck('name')->values()->toArray(),
            'text' => $searchText,
        ];
    }

    private function ensureCollection(): void
    {
        $this->qdrantHttp()
            ->timeout(30)
            ->put($this->qdrantUrl() . '/collections/' . $this->collection(), [
                'vectors' => [
                    'size' => (int) config('services.qdrant.vector_size'),
                    'distance' => config('services.qdrant.distance', 'Cosine'),
                ],
            ]);
    }

    private function qdrantHttp()
    {
        return Http::withHeaders([
            'api-key' => config('services.qdrant.api_key'),
            'Content-Type' => 'application/json',
        ]);
    }

    private function isConfigured(): bool
    {
        return filled(config('services.qdrant.url'))
            && filled(config('services.qdrant.api_key'))
            && filled(config('services.ollama.embedding_model'));
    }

    private function qdrantUrl(): string
    {
        return rtrim(config('services.qdrant.url'), '/');
    }

    private function collection(): string
    {
        return config('services.qdrant.collection');
    }
}
