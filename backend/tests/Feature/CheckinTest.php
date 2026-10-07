<?php

namespace Tests\Feature;

use App\Models\Cadastro;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class CheckinTest extends TestCase
{
    use RefreshDatabase;

    private function cadastro(string $nome): Cadastro
    {
        return Cadastro::create(['nome' => $nome, 'cidade' => 'Ponta Grossa', 'telefone' => '(42) 99999-0000']);
    }

    public function test_busca_por_prefixo_e_marca_quem_ja_esta_presente(): void
    {
        $joao = $this->cadastro('João Silva');
        $this->cadastro('Joana Souza');
        $this->cadastro('Maria Lima');

        $this->postJson('/api/checkin', ['cadastro_id' => $joao->id])->assertCreated();

        $resposta = $this->getJson('/api/checkin/buscar?q=Jo')->assertOk();

        $this->assertSame(['Joana Souza', 'João Silva'], array_column($resposta->json('data'), 'nome'));
        $porNome = collect($resposta->json('data'))->keyBy('nome');
        $this->assertFalse((bool) $porNome['Joana Souza']['ja_presente']);
        $this->assertTrue((bool) $porNome['João Silva']['ja_presente']);
    }

    public function test_curingas_digitados_nao_viram_curinga_no_like(): void
    {
        $this->cadastro('Maria Lima');

        $this->getJson('/api/checkin/buscar?q=%25%25')->assertOk()->assertJsonCount(0, 'data');
        $this->getJson('/api/checkin/buscar?q=M_')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_busca_exige_ao_menos_duas_letras(): void
    {
        $this->getJson('/api/checkin/buscar?q=J')->assertUnprocessable();
    }

    public function test_checkin_repetido_no_mesmo_dia_nao_duplica(): void
    {
        $joao = $this->cadastro('João Silva');

        $this->postJson('/api/checkin', ['cadastro_id' => $joao->id])->assertCreated();
        $this->postJson('/api/checkin', ['cadastro_id' => $joao->id])
            ->assertOk()
            ->assertJsonPath('message', 'João Silva já estava com presença registrada hoje.');

        $this->assertSame(1, DB::table('presencas')->count());
        $this->getJson('/api/checkin/hoje')->assertJsonPath('total', 1);
    }

    public function test_checkin_de_cadastro_inexistente_retorna_422(): void
    {
        $this->postJson('/api/checkin', ['cadastro_id' => 999])->assertUnprocessable();
    }

    public function test_trigger_audita_alteracao_do_cadastro(): void
    {
        $visitante = $this->cadastro('Visitante Antigo');

        $visitante->update(['nome' => 'Visitante Novo', 'telefone' => '(42) 98888-1111']);

        $log = DB::table('recepcao_auditoria')->sole();
        $this->assertSame($visitante->id, (int) $log->recepcao_id);
        $this->assertSame('UPDATE', $log->operacao);
        $this->assertSame('Visitante Antigo', json_decode($log->dados_anteriores, true)['nome']);
        $this->assertSame('Visitante Novo', json_decode($log->dados_novos, true)['nome']);
        $this->assertSame('(42) 98888-1111', json_decode($log->dados_novos, true)['telefone']);
    }

    public function test_insert_nao_gera_log_de_auditoria(): void
    {
        $this->cadastro('Novo Visitante');

        $this->assertSame(0, DB::table('recepcao_auditoria')->count());
    }
}
