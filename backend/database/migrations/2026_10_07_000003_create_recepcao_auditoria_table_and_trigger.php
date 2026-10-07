<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Auditoria no próprio banco: toda alteração (UPDATE) de um registro da tabela
 * recepcao grava uma linha em recepcao_auditoria com os valores antes e depois.
 *
 * Por ser trigger, o log é gravado mesmo quando a alteração é feita fora da
 * API (SQL direto, ferramenta de banco, outro sistema).
 *
 * A sintaxe de trigger muda por banco; esta migration suporta MySQL/MariaDB,
 * PostgreSQL e SQLite (usado nos testes e no .env.example).
 */
return new class extends Migration
{
    private const CAMPOS = [
        'nome', 'cidade', 'frequencia', 'familiares',
        'telefone', 'data_visita', 'observacao',
    ];

    public function up(): void
    {
        Schema::create('recepcao_auditoria', function (Blueprint $table) {
            $table->id();
            // Sem FK de propósito: o log deve sobreviver à exclusão do cadastro.
            $table->unsignedBigInteger('recepcao_id')->index();
            $table->string('operacao', 10);
            $table->json('dados_anteriores');
            $table->json('dados_novos');
            $table->timestamp('alterado_em')->useCurrent();
        });

        match (DB::getDriverName()) {
            'mysql', 'mariadb' => $this->criarTriggerMysql(),
            'pgsql'            => $this->criarTriggerPostgres(),
            'sqlite'           => $this->criarTriggerSqlite(),
            default            => throw new RuntimeException(
                'Trigger de auditoria não implementada para o driver ' . DB::getDriverName()
            ),
        };
    }

    public function down(): void
    {
        match (DB::getDriverName()) {
            'pgsql' => DB::unprepared(<<<'SQL'
                DROP TRIGGER IF EXISTS trg_recepcao_auditoria_update ON recepcao;
                DROP FUNCTION IF EXISTS fn_recepcao_auditoria_update();
            SQL),
            default => DB::unprepared('DROP TRIGGER IF EXISTS trg_recepcao_auditoria_update'),
        };

        Schema::dropIfExists('recepcao_auditoria');
    }

    /** Monta "'nome', X.nome, 'cidade', X.cidade, ..." para JSON_OBJECT/json_object. */
    private function paresJson(string $alias): string
    {
        return collect(self::CAMPOS)
            ->map(fn ($c) => "'{$c}', {$alias}.{$c}")
            ->implode(', ');
    }

    private function criarTriggerMysql(): void
    {
        // DB::unprepared envia o corpo inteiro de uma vez, então não precisa de DELIMITER.
        DB::unprepared("
            CREATE TRIGGER trg_recepcao_auditoria_update
            AFTER UPDATE ON recepcao
            FOR EACH ROW
            INSERT INTO recepcao_auditoria (recepcao_id, operacao, dados_anteriores, dados_novos, alterado_em)
            VALUES (
                OLD.id,
                'UPDATE',
                JSON_OBJECT({$this->paresJson('OLD')}),
                JSON_OBJECT({$this->paresJson('NEW')}),
                CURRENT_TIMESTAMP
            )
        ");
    }

    private function criarTriggerPostgres(): void
    {
        DB::unprepared(<<<'SQL'
            CREATE OR REPLACE FUNCTION fn_recepcao_auditoria_update()
            RETURNS trigger AS $$
            BEGIN
                INSERT INTO recepcao_auditoria (recepcao_id, operacao, dados_anteriores, dados_novos, alterado_em)
                VALUES (OLD.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), CURRENT_TIMESTAMP);
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            CREATE TRIGGER trg_recepcao_auditoria_update
            AFTER UPDATE ON recepcao
            FOR EACH ROW
            EXECUTE FUNCTION fn_recepcao_auditoria_update();
        SQL);
    }

    private function criarTriggerSqlite(): void
    {
        DB::unprepared("
            CREATE TRIGGER trg_recepcao_auditoria_update
            AFTER UPDATE ON recepcao
            FOR EACH ROW
            BEGIN
                INSERT INTO recepcao_auditoria (recepcao_id, operacao, dados_anteriores, dados_novos, alterado_em)
                VALUES (
                    OLD.id,
                    'UPDATE',
                    json_object({$this->paresJson('OLD')}),
                    json_object({$this->paresJson('NEW')}),
                    CURRENT_TIMESTAMP
                );
            END
        ");
    }
};
