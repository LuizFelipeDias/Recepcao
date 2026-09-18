import React, { useEffect, useState } from "react";
import "../styles/pages/ListaTotal.css";
import {Link} from "react-router-dom";

const PAGE_SIZE = 10;

const COLUMNS = [
    { key: "nome",       label: "Nome",       width: "200px" },
    { key: "email",      label: "Email",      width: "210px" },
    { key: "cidade",     label: "Cidade",     width: "130px" },
    { key: "telefone",   label: "Telefone",   width: "150px" },
    { key: "familiares", label: "Familiares", width: "110px" },
    { key: "frequencia", label: "Frequência", width: "130px" },
    { key: "observacao", label: "Observação", width: "1fr"   },
];

function TrashIcon() {
    return (
        <svg width="14" height="18" viewBox="0 0 14 18" fill="none">
            <path
                d="M1 16C1 17.1 1.9 18 3 18H11C12.1 18 13 17.1 13 16V4H1V16ZM3 6H11V16H3V6ZM10.5 1L9.5 0H4.5L3.5 1H0V3H14V1H10.5Z"
                fill="#ff4d4f"
            />
        </svg>
    );
}

function ChevronLeft() {
    return (
        <svg width="20" height="8" viewBox="0 0 21 7.364" fill="none">
            <path d="M10.5 7.364L0 0H21L10.5 7.364Z" fill="#a0a0a0" />
        </svg>
    );
}

function ChevronRight() {
    return (
        <svg width="20" height="8" viewBox="0 0 21 7.364" fill="none">
            <path d="M10.5 0L21 7.364H0L10.5 0Z" fill="#a0a0a0" />
        </svg>
    );
}

const gridTemplate = COLUMNS.map((c) => c.width).join(" ") + " 48px";

export default function ListaTotal() {
    const [data, setData]       = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState(null);
    const [page, setPage]       = useState(1);

    useEffect(() => {
        fetch("http://127.0.0.1:8000/api/Cadastrados")
            .then((res) => {
                if (!res.ok) throw new Error(`Erro ${res.status}`);
                return res.json();
            })
            .then((json) => {
                const rows = Array.isArray(json)
                    ? json
                    : (json.data ?? json.cadastros ?? json.recepcao ?? []);
                setData(rows);
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    // Função para deletar
    const handleDelete = async (id) => {
        if (!window.confirm("Tem certeza que deseja excluir este cadastro?")) {
            return;
        }

        try {
            // Supondo que a sua rota de exclusão no Laravel seja DELETE /api/Cadastrados/{id}
            const response = await fetch(`http://127.0.0.1:8000/api/Cadastrados/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error("Erro ao excluir o cadastro.");

            // Remove o item excluído do estado da tabela sem precisar recarregar a página
            setData(prevData => prevData.filter(item => item.id !== id));
            alert("Cadastro excluído com sucesso!");

        } catch (err) {
            console.error(err);
            alert("Erro ao excluir: Verifique se a rota DELETE está configurada no Laravel.");
        }
    };

    const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
    const pageData   = data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    function visiblePages() {
        if (totalPages <= 9) return Array.from({ length: totalPages }, (_, i) => i + 1);
        const pages = [];
        pages.push(1);
        if (page > 4) pages.push("...");
        for (let p = Math.max(2, page - 2); p <= Math.min(totalPages - 1, page + 2); p++) pages.push(p);
        if (page < totalPages - 3) pages.push("...");
        pages.push(totalPages);
        return pages;
    }

    return (
        <div className="lista-container">

            <Link to="/cadastro" className="link-ver-cadastrados">
                Ir para o Cadastro
            </Link>

            <div className="lista-content">

                {/* ── Table ── */}
                <div className="table-wrapper">
                    <div className="table-inner">

                        {/* Section label row */}
                        <div className="table-section-label">
                            <span>
                                Pessoas Cadastradas
                                {!loading && !error && (
                                    <span className="table-count">
                                        {data.length} {data.length === 1 ? "registro" : "registros"}
                                    </span>
                                )}
                            </span>
                        </div>

                        {/* Column header row */}
                        <div className="table-row table-header-row" style={{ gridTemplateColumns: gridTemplate }}>
                            {COLUMNS.map((col) => (
                                <div key={col.key} className="table-header-cell">
                                    <span>{col.label}</span>
                                </div>
                            ))}
                            <div />
                        </div>

                        {/* Loading */}
                        {loading && (
                            <div className="status-message">
                                <span>Carregando...</span>
                            </div>
                        )}

                        {/* Error */}
                        {!loading && error && (
                            <div className="status-message error">
                                <span>Erro: {error}</span>
                            </div>
                        )}

                        {/* Empty */}
                        {!loading && !error && data.length === 0 && (
                            <div className="status-message">
                                <span>Nenhum cadastro encontrado.</span>
                            </div>
                        )}

                        {/* Data rows */}
                        {!loading && !error && pageData.map((row, idx) => (
                            <div
                                key={row.id ?? idx}
                                className="table-row table-body-row"
                                style={{ gridTemplateColumns: gridTemplate }}
                            >
                                {COLUMNS.map((col) => (
                                    <div key={col.key} className="table-cell">
                                        <span title={String(row[col.key] ?? "")}>
                                            {String(row[col.key] ?? "—")}
                                        </span>
                                    </div>
                                ))}
                                <div className="action-cell">
                                    <button
                                        className="delete-btn"
                                        title="Excluir"
                                        onClick={() => handleDelete(row.id)} // Chamando a função de delete
                                    >
                                        <TrashIcon />
                                    </button>
                                </div>
                            </div>
                        ))}

                    </div>
                </div>

                {/* ── Pagination ── */}
                {!loading && !error && data.length > 0 && (
                    <div className="pagination-wrapper">
                        <div className="pagination-line" />
                        <div className="pagination-controls">

                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="page-btn-nav prev"
                            >
                                <ChevronLeft /> Anterior
                            </button>

                            {visiblePages().map((p, i) =>
                                p === "..." ? (
                                    <span key={`e${i}`} className="page-dots">...</span>
                                ) : (
                                    <button
                                        key={p}
                                        onClick={() => setPage(p)}
                                        className={`page-number ${p === page ? "active" : ""}`}
                                    >
                                        {p}
                                    </button>
                                )
                            )}

                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="page-btn-nav next"
                            >
                                Próxima <ChevronRight />
                            </button>

                            <div className="pagination-indicator" />
                        </div>
                    </div>
                )}

                {/* ── Footer ── */}
                <div className="footer">
                    <span>Sistema de Cadastro</span>
                    <span>Versão 1.0.0</span>
                </div>

            </div>
        </div>
    );
}