<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\TryOn\TryOnController;

Route::post('/try-on', [TryOnController::class, 'requestTryOn']);

