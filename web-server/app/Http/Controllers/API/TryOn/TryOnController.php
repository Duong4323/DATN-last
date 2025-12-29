<?php

namespace App\Http\Controllers\API\TryOn;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class TryOnController extends Controller
{
    protected string $tryOnServiceUrl = 'http://127.0.0.1:8001/try-on';

    public function requestTryOn(Request $request)
    {
        $request->validate([
            'person_image_url' => 'required|url',
            'cloth_image_url'  => 'required|url',
            'base_steps'       => 'nullable|integer|min:1|max:64',
            'image_count'      => 'nullable|integer|min:1|max:4',
        ]);

        try {
            /* ===============================
             * 1️⃣ LẤY ẢNH NGƯỜI DÙNG (LOCAL)
             * =============================== */
            $personUrlPath = parse_url($request->person_image_url, PHP_URL_PATH);
            $personPath = ltrim(str_replace('/storage/', '', $personUrlPath), '/');

            if (!Storage::disk('public')->exists($personPath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy ảnh người dùng',
                    'path'    => $personPath,
                ], 404);
            }

            $personImage = Storage::disk('public')->get($personPath);

            /* ===============================
             * 2️⃣ LẤY ẢNH SẢN PHẨM
             * =============================== */
            $clothUrlPath = parse_url($request->cloth_image_url, PHP_URL_PATH);
            $clothPath = ltrim(str_replace('/storage/', '', $clothUrlPath), '/');

            if (Storage::disk('public')->exists($clothPath)) {
                // ảnh local
                $clothImage = Storage::disk('public')->get($clothPath);
            } else {
                // ảnh external
                $clothResponse = Http::timeout(20)->get($request->cloth_image_url);
                if (!$clothResponse->successful()) {
                    throw new \Exception('Không tải được ảnh sản phẩm');
                }
                $clothImage = $clothResponse->body();
            }

            /* ===============================
             * 3️⃣ GỬI SANG PYTHON SERVICE
             * =============================== */
            $response = Http::timeout(180)
                ->asMultipart()
                ->post($this->tryOnServiceUrl, [
                    [
                        'name'     => 'person_image',
                        'contents' => $personImage,
                        'filename' => 'person.jpg',
                    ],
                    [
                        'name'     => 'cloth_image',
                        'contents' => $clothImage,
                        'filename' => 'cloth.jpg',
                    ],
                    [
                        'name'     => 'base_steps',
                        'contents' => $request->input('base_steps', 32),
                    ],
                    [
                        'name'     => 'image_count',
                        'contents' => $request->input('image_count', 1),
                    ],
                ]);

            if (!$response->successful()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Try-On service error',
                    'detail'  => $response->body(),
                ], $response->status());
            }

            return response()->json($response->json(), 200);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Try-On service error',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }
}
