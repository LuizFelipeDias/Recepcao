<?php

namespace App\Http\Controllers;

use App\Models\Cadastro;
use App\Models\Presenca;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Check-in rápido da recepção.
 *
 * Fluxo: a recepcionista digita as primeiras letras do nome (GET /checkin/buscar),
 * o sistema devolve os cadastros que começam com esse prefixo e marca quem já
 * tem presença no culto de hoje; ao escolher um (ou com Enter, se só houver um),
 * POST /checkin registra a presença.
 */
class CheckinController extends Controller
{
    private const LIMITE_RESULTADOS = 10;

    /**
     * GET /api/checkin/buscar?q=Jo
     */
    public function buscar(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'q' => 'required|string|min:2|max:100',
        ]);

        $prefixo = $this->escaparLike(trim($validated['q']));
        $hoje = $this->dataDoCulto();

        // Busca por prefixo ("Jo%") para aproveitar o índice em recepcao.nome.
        $cadastros = Cadastro::query()
            ->select(['id', 'nome', 'telefone', 'cidade'])
            ->whereRaw("nome LIKE ? ESCAPE '!'", [$prefixo . '%'])
            ->withExists(['presencas as ja_presente' => fn ($q) => $q->where('culto_data', $hoje)])
            ->orderBy('nome')
            ->limit(self::LIMITE_RESULTADOS)
            ->get();

        return response()->json([
            'culto_data' => $hoje,
            'data'       => $cadastros,
        ]);
    }

    /**
     * POST /api/checkin  { "cadastro_id": 123 }
     *
     * Idempotente: repetir o check-in no mesmo dia não duplica a presença.
     */
    public function registrar(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'cadastro_id' => 'required|integer|exists:recepcao,id',
        ]);

        $hoje = $this->dataDoCulto();

        // createOrFirst se apoia no índice único (recepcao_id, culto_data),
        // então dois cliques simultâneos não geram presença duplicada.
        $presenca = Presenca::createOrFirst([
            'recepcao_id' => $validated['cadastro_id'],
            'culto_data'  => $hoje,
        ]);

        $nome = Cadastro::whereKey($validated['cadastro_id'])->value('nome');

        if (! $presenca->wasRecentlyCreated) {
            return response()->json([
                'message' => "{$nome} já estava com presença registrada hoje.",
                'data'    => $presenca,
            ], 200);
        }

        return response()->json([
            'message' => "Presença de {$nome} registrada.",
            'data'    => $presenca,
        ], 201);
    }

    /**
     * GET /api/checkin/hoje — lista de presentes no culto de hoje.
     */
    public function hoje(): JsonResponse
    {
        $hoje = $this->dataDoCulto();

        $presencas = Presenca::query()
            ->with('cadastro:id,nome,telefone')
            ->where('culto_data', $hoje)
            ->latest()
            ->get();

        return response()->json([
            'culto_data' => $hoje,
            'total'      => $presencas->count(),
            'data'       => $presencas,
        ]);
    }

    /** Data do culto no fuso da igreja (o servidor roda em UTC). */
    private function dataDoCulto(): string
    {
        return now(config('app.culto_timezone'))->toDateString();
    }

    /**
     * Impede que % e _ digitados virem curingas do LIKE. Usa '!' como caractere
     * de escape porque ele se comporta igual em MySQL, PostgreSQL e SQLite.
     */
    private function escaparLike(string $valor): string
    {
        return str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $valor);
    }
}
