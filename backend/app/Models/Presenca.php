<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Presenca extends Model
{
    protected $table = 'presencas';

    protected $fillable = [
        'recepcao_id',
        'culto_data',
    ];

    // culto_data fica como string 'Y-m-d' (sem cast 'date'): assim o valor
    // gravado é idêntico em MySQL, PostgreSQL e SQLite e as buscas por data batem.

    public function cadastro(): BelongsTo
    {
        return $this->belongsTo(Cadastro::class, 'recepcao_id');
    }
}
