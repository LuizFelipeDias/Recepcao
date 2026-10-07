<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Índices para a busca por prefixo do check-in (WHERE nome LIKE 'Jo%')
 * e para a busca por telefone.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('recepcao', function (Blueprint $table) {
            $table->index('nome', 'recepcao_nome_index');
            $table->index('telefone', 'recepcao_telefone_index');
        });
    }

    public function down(): void
    {
        Schema::table('recepcao', function (Blueprint $table) {
            $table->dropIndex('recepcao_nome_index');
            $table->dropIndex('recepcao_telefone_index');
        });
    }
};
