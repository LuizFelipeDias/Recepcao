import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import CheckinRapido from "./CheckinRapido";

// O Jest 27 do react-scripts não resolve o pacote do react-router v7; o
// componente só usa <Link>, então um stub simples basta para o teste.
jest.mock(
    "react-router-dom",
    () => ({ Link: ({ to, children }) => <a href={to}>{children}</a> }),
    { virtual: true }
);

jest.mock("axios", () => ({
    get: jest.fn(),
    post: jest.fn(),
    isCancel: () => false,
}));

const renderizar = () => render(<CheckinRapido />);

beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockImplementation((url) => {
        if (url.endsWith("/checkin/hoje")) {
            return Promise.resolve({ data: { total: 0, data: [] } });
        }
        return Promise.resolve({
            data: {
                data: [
                    { id: 1, nome: "Joana Souza", telefone: "(42) 99999-0001", cidade: "PG", ja_presente: false },
                    { id: 2, nome: "João Silva", telefone: "(42) 99999-0002", cidade: "PG", ja_presente: true },
                ],
            },
        });
    });
});

test("busca pelo prefixo digitado e mostra quem já está presente", async () => {
    renderizar();

    await userEvent.type(screen.getByLabelText(/buscar membro/i), "Jo");

    expect(await screen.findByText("Joana Souza")).toBeInTheDocument();
    expect(screen.getByText("Presente")).toBeInTheDocument();
    expect(axios.get).toHaveBeenCalledWith(
        expect.stringMatching(/\/checkin\/buscar$/),
        expect.objectContaining({ params: { q: "Jo" } })
    );
});

test("não busca com menos de duas letras", async () => {
    renderizar();

    await userEvent.type(screen.getByLabelText(/buscar membro/i), "J");

    expect(screen.getByText(/ao menos 2 letras/i)).toBeInTheDocument();
    await new Promise((r) => setTimeout(r, 400));
    expect(axios.get).not.toHaveBeenCalledWith(expect.stringMatching(/buscar$/), expect.anything());
});

test("Enter registra a presença do item selecionado e limpa a busca", async () => {
    axios.post.mockResolvedValue({ status: 201, data: { message: "Presença de Joana Souza registrada." } });
    renderizar();

    const input = screen.getByLabelText(/buscar membro/i);
    await userEvent.type(input, "Jo");
    await screen.findByText("Joana Souza");
    await userEvent.type(input, "{enter}");

    await waitFor(() =>
        expect(axios.post).toHaveBeenCalledWith(expect.stringMatching(/\/checkin$/), { cadastro_id: 1 })
    );
    expect(await screen.findByText("Presença de Joana Souza registrada.")).toBeInTheDocument();
    expect(input).toHaveValue("");
});
