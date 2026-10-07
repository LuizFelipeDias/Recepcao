<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela de cadastros (membros e visitantes) usada pelo Model Cadastro.
 *
 * O repositório não tinha migration para ela; se a tabela já existir no banco
 * (criada manualmente), esta migration não faz nada.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('recepcao')) {
            return;
        }

        Schema::create('recepcao', function (Blueprint $table) {
            $table->id();
            $table->string('nome');
            $table->string('cidade');
            $table->string('frequencia', 20)->nullable();
            $table->string('familiares')->nullable();
            $table->string('telefone')->nullable();
            $table->date('data_visita')->nullable();
            $table->text('observacao')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        // Não remove a tabela: ela pode ter sido criada fora desta migration
        // e contém os dados de produção.
    }
};
