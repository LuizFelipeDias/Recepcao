import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Search, CheckCircle2, UserCheck } from "lucide-react";
import "../styles/pages/CheckinRapido.css";

const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api";
const MIN_LETRAS = 2;
const DEBOUNCE_MS = 250;

/**
 * Check-in rápido: a recepcionista digita as primeiras letras do nome,
 * escolhe com ↑/↓ (ou clique) e confirma com Enter. Se só houver um
 * resultado, Enter registra direto.
 */
export default function CheckinRapido() {
    const [termo, setTermo] = useState("");
    const [resultados, setResultados] = useState([]);
    const [selecionado, setSelecionado] = useState(0);
    const [buscando, setBuscando] = useState(false);
    const [registrando, setRegistrando] = useState(false);
    const [aviso, setAviso] = useState(null); // { tipo: "sucesso" | "info" | "erro", texto }
    const [totalHoje, setTotalHoje] = useState(null);

    const inputRef = useRef(null);
    const buscaAtual = useRef(null);

    const atualizarTotal = useCallback(async () => {
        try {
            const { data } = await axios.get(`${API_URL}/checkin/hoje`);
            setTotalHoje(data.total);
        } catch {
            // O contador é informativo; falha aqui não bloqueia o check-in.
        }
    }, []);

    useEffect(() => {
        atualizarTotal();
    }, [atualizarTotal]);

    // Busca com debounce; cancela a requisição anterior se o termo mudar.
    useEffect(() => {
        const q = termo.trim();

        if (q.length < MIN_LETRAS) {
            setResultados([]);
            setBuscando(false);
            return undefined;
        }

        const timer = setTimeout(async () => {
            buscaAtual.current?.abort();
            const controller = new AbortController();
            buscaAtual.current = controller;
            setBuscando(true);

            try {
                const { data } = await axios.get(`${API_URL}/checkin/buscar`, {
                    params: { q },
                    signal: controller.signal,
                });
                setResultados(data.data);
                setSelecionado(0);
            } catch (err) {
                if (!axios.isCancel(err)) {
                    setAviso({ tipo: "erro", texto: "Não foi possível buscar. Verifique a conexão com o servidor." });
                }
            } finally {
                if (buscaAtual.current === controller) setBuscando(false);
            }
        }, DEBOUNCE_MS);

        return () => clearTimeout(timer);
    }, [termo]);

    // Some o aviso depois de alguns segundos.
    useEffect(() => {
        if (!aviso) return undefined;
        const timer = setTimeout(() => setAviso(null), 3500);
        return () => clearTimeout(timer);
    }, [aviso]);

    const registrar = async (pessoa) => {
        if (!pessoa || registrando) return;
        setRegistrando(true);

        try {
            const resposta = await axios.post(`${API_URL}/checkin`, { cadastro_id: pessoa.id });
            setAviso({
                tipo: resposta.status === 201 ? "sucesso" : "info",
                texto: resposta.data.message,
            });
            setTermo("");
            setResultados([]);
            atualizarTotal();
        } catch (err) {
            setAviso({
                tipo: "erro",
                texto: err.response?.data?.message || "Erro ao registrar a presença.",
            });
        } finally {
            setRegistrando(false);
            inputRef.current?.focus();
        }
    };

    const handleKeyDown = (e) => {
        if (resultados.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelecionado((i) => Math.min(i + 1, resultados.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelecionado((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            registrar(resultados[selecionado]);
        } else if (e.key === "Escape") {
            setTermo("");
        }
    };

    const qtdLetras = termo.trim().length;

    return (
        <div className="checkin-container">
            <div className="checkin-card">
                <header className="checkin-header">
                    <h1>Check-in do Culto</h1>
                    {totalHoje !== null && (
                        <span className="checkin-total">
                            <UserCheck size={16} /> {totalHoje} presente{totalHoje === 1 ? "" : "s"} hoje
                        </span>
                    )}
                </header>

                <div className="checkin-busca">
                    <Search className="checkin-busca-icone" />
                    <input
                        ref={inputRef}
                        className="checkin-input"
                        type="text"
                        placeholder="Digite as primeiras letras do nome"
                        value={termo}
                        onChange={(e) => setTermo(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        autoComplete="off"
                        aria-label="Buscar membro ou visitante"
                    />
                </div>

                {aviso && (
                    <div className={`checkin-aviso checkin-aviso--${aviso.tipo}`} role="status">
                        {aviso.texto}
                    </div>
                )}

                <ul className="checkin-resultados" role="listbox">
                    {resultados.map((pessoa, i) => (
                        <li
                            key={pessoa.id}
                            role="option"
                            aria-selected={i === selecionado}
                            className={[
                                "checkin-item",
                                i === selecionado && "checkin-item--selecionado",
                                pessoa.ja_presente && "checkin-item--presente",
                            ].filter(Boolean).join(" ")}
                            onMouseEnter={() => setSelecionado(i)}
                            onClick={() => registrar(pessoa)}
                        >
                            <div>
                                <strong>{pessoa.nome}</strong>
                                <span className="checkin-item-detalhe">
                                    {[pessoa.telefone, pessoa.cidade].filter(Boolean).join(" · ")}
                                </span>
                            </div>
                            {pessoa.ja_presente ? (
                                <span className="checkin-badge">
                                    <CheckCircle2 size={14} /> Presente
                                </span>
                            ) : (
                                <span className="checkin-acao">Enter ↵</span>
                            )}
                        </li>
                    ))}
                </ul>

                {qtdLetras >= MIN_LETRAS && !buscando && resultados.length === 0 && (
                    <p className="checkin-vazio">
                        Nenhum cadastro começando com “{termo.trim()}”.{" "}
                        <Link to="/cadastro">Cadastrar visitante</Link>
                    </p>
                )}

                {qtdLetras > 0 && qtdLetras < MIN_LETRAS && (
                    <p className="checkin-dica">Digite ao menos {MIN_LETRAS} letras.</p>
                )}
            </div>
        </div>
    );
}
