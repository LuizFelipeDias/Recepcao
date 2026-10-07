import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

/* Páginas */
import Cadastro from "../pages/Cadastro";
import ListaTotal from "../pages/ListaTotal";
import CheckinRapido from "../pages/CheckinRapido";

function App() {
    return (
        <Router>
            <Routes>

                <Route element={<RotaPublica />}>
                    <Route path="/" element={<Login />} />
                </Route>

                <Route element={<RotaProtegida/>}>
                    <Route path='/cadastro' element={<Cadastro />} />
                    <Route path='/lista' element={<ListaTotal />} />
                    <Route path='/checkin' element={<CheckinRapido />} />
                </Route>

            </Routes>
        </Router>
    );
}

export default App;