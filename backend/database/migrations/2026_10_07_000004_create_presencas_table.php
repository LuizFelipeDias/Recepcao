<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Presença de um cadastro (membro/visitante) no culto de uma data.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('presencas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recepcao_id')->constrained('recepcao')->cascadeOnDelete();
            $table->date('culto_data');
            $table->timestamps();

            // Uma presença por pessoa por culto: check-in repetido não duplica.
            $table->unique(['recepcao_id', 'culto_data']);
            $table->index('culto_data');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('presencas');
    }
};
