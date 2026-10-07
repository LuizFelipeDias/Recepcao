<?php

namespace App\Models;

//use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Cadastro extends Model
{
//    use HasFactory;

    /**
     * Define explicitamente o nome da tabela no banco de dados "Igreja".
     *
     * @var string
     */
    protected $table = 'recepcao';

    /**
     * Atributos que podem ser preenchidos em massa via API.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'nome',
        'cidade',
        'frequencia',
        'familiares',
        'telefone',
        'data_visita',
        'observacao'
    ];

    /**
     * Define os casts dos atributos para os tipos corretos do PHP.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'created_at'  => 'datetime'
        ];
    }

    public function presencas(): HasMany
    {
        return $this->hasMany(Presenca::class, 'recepcao_id');
    }
}
