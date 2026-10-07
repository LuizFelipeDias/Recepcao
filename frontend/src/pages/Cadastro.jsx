import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "../styles/pages/Cadastro.css";
import {
    User,
    Phone,
    MapPin,
    Mail,
    Users,
    Clock,
    FileText,
} from "lucide-react";

import ListaTotal from "./ListaTotal";

export default function Cadastro() {
    const [formData, setFormData] = useState({
        nome: "",
        email: "",
        cidade: "",
        telefone: "",
        familiares: "",
        observacao: "",
        frequencia: "",
    });

    const maskTelefone = (value) => {
        return value
            .replace(/\D/g, "")
            .replace(/^(\d{2})(\d)/g, "($1) $2")
            .replace(/(\d)(\d{4})$/, "$1-$2")
            .slice(0, 15);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        const newValue = name === "telefone" ? maskTelefone(value) : value;
        setFormData((prev) => ({ ...prev, [name]: newValue }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        console.log("=== INICIANDO ENVIO ===");
        console.log("1. Dados exatos do state formData:", formData);

        try {
            const response = await axios.post("http://127.0.0.1:8000/api/Cadastrar", formData);
            console.log("3. Sucesso! Resposta do Laravel:", response.data);

            alert("Cadastro realizado com sucesso!");
            setFormData({ nome: "", telefone: "", cidade: "", email: "", familiares: "", frequencia: "", observacao: "" });
        } catch (error) {
            console.error("3. Erro na requisição Axios:", error);
            if (error.response) {
                console.error("Status do Erro:", error.response.status);
                console.error("Detalhes do Erro do Laravel:", error.response.data);
            }
            alert("Ocorreu um erro ao realizar o cadastro. Verifique o console.");
        }
    };

    return (
        <div className="cadastro-container">
            {/* ─── Painel Esquerdo: Formulário ─── */}
            <div className="form-panel">
                <div className="form-content">
                    <div className="form-header">
                        <h1>Cadastre o Visitante</h1>
                    </div>

                    <form onSubmit={handleSubmit} className="register-form">
                        <div className="input-group">
                            <User className="input-icon" />
                            <input className="input-field" type="text" name="nome" placeholder="Nome completo" value={formData.nome} onChange={handleChange} required />
                        </div>

                        <div className="input-group">
                            <Phone className="input-icon" />
                            <input className="input-field" type="tel" name="telefone" placeholder="Número de contato" value={formData.telefone} onChange={handleChange} required />
                        </div>

                        <div className="input-group">
                            <MapPin className="input-icon" />
                            <input className="input-field" type="text" name="cidade" placeholder="Cidade" value={formData.cidade} onChange={handleChange} required />
                        </div>

                        <div className="input-group">
                            <Mail className="input-icon" />
                            <input className="input-field" type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
                        </div>

                        <div className="input-group">
                            <Users className="input-icon" />
                            <input className="input-field" type="text" name="familiares" placeholder="Familiares" value={formData.familiares} onChange={handleChange} required />
                        </div>

                        <div className="input-group">
                            <Clock className="input-icon" />
                            <input className="input-field" type="text" name="frequencia" placeholder="Frequência" value={formData.frequencia} onChange={handleChange} />
                        </div>

                        <div className="input-group textarea-group">
                            <FileText className="input-icon textarea-icon" />
                            <textarea className="input-field textarea-field" name="observacao" placeholder="Observação" value={formData.observacao} onChange={handleChange} />
                        </div>

                        <button type="submit" className="submit-btn">
                            FINALIZAR CADASTRO
                        </button>

                        <Link to="/lista" className="link-ver-cadastrados">
                            Ver Cadastrados
                        </Link>
                    </form>
                </div>
            </div>

            {/* ─── Painel Direito: Logo PIPPG ─── */}
            <div className="info-panel">
                <img
                    src="https://pippg.org.br/wp-content/uploads/2024/09/icone-logo-pippg-azul.svg"
                    alt="Logo PIPPG"
                    className="right-panel-image"
                />
            </div>
        </div>
    );
}