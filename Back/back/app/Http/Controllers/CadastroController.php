<?php

namespace App\Http\Controllers;

use App\Models\Cadastro;
use Illuminate\Http\Request;

class CadastroController extends Controller
{
    public function index()
    {
        $cadastrados = Cadastro::all();

        return response()->json($cadastrados, 200);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nome'        => 'required|string|max:255',
            'cidade'      => 'required|string|max:255',
            'frequencia'  => 'nullable|string|max:20',
            'familiares'  => 'nullable|string|max:255',
            'telefone'    => 'nullable|string|max:255',
            'data_visita' => 'nullable|date',
            'observacao'  => 'nullable|string',
        ]);

        $cadastro = Cadastro::create($validated);

        return response()->json([
            'message' => 'Cadastro realizado com sucesso!',
            'data' => $cadastro
        ], 201);
    }

    public function destroy(string $id)
    {
        // Busca o cadastro pelo ID usando o Model
        $cadastro = Cadastro::find($id);

        // Se não encontrar, retorna erro 404
        if (!$cadastro) {
            return response()->json([
                'message' => 'Cadastro não encontrado.'
            ], 404);
        }

        // Deleta o registro
        $cadastro->delete();

        // Retorna sucesso
        return response()->json([
            'message' => 'Cadastro excluído com sucesso!'
        ], 200);
    }
}
