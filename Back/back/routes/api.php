<?php

use App\Http\Controllers\CadastroController;
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
