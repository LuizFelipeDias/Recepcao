<?php

use App\Http\Controllers\CadastroController;
use App\Http\Controllers\CheckinController;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

/*
|--------------------------------------------------------------------------
| Rotas Públicas da API da Igreja
|--------------------------------------------------------------------------
*/

Route::get('/Cadastrados', [CadastroController::class, 'index']);
Route::post('/Cadastrar', [CadastroController::class, 'store']);

// Adicione esta linha:
Route::delete('/Cadastrados/{id}', [CadastroController::class, 'destroy']);

// Check-in rápido do culto do dia
Route::get('/checkin/buscar', [CheckinController::class, 'buscar']);
Route::get('/checkin/hoje', [CheckinController::class, 'hoje']);
Route::post('/checkin', [CheckinController::class, 'registrar']);
