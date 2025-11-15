import { useEffect, useState } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import ReportListPage from "./pages/ReportListPage";
import NewReportPage from "./pages/NewReportPage";
import ReportDetailPage from "./pages/ReportDetailPage";
import NewComent from "./pages/NewComent";
import LoginPage from "./pages/LoginPage";
import NearbyReportsPage from "./pages/NearbyReportsPage";
import { clearSession, getSession, type SessionData } from "./auth";

function App() {
  const navigate = useNavigate();
  const [session, setSession] = useState<SessionData | null>(getSession());

  useEffect(() => {
    const handleSessionChange = () => {
      setSession(getSession());
    };
    window.addEventListener("session-changed", handleSessionChange);
    window.addEventListener("storage", handleSessionChange);
    return () => {
      window.removeEventListener("session-changed", handleSessionChange);
      window.removeEventListener("storage", handleSessionChange);
    };
  }, []);

  const handleLogout = () => {
    clearSession();
    setSession(null);
    navigate("/");
  };

  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }}>
      <header
        style={{
          padding: "1rem",
          borderBottom: "1px solid #ddd",
          marginBottom: "1rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "1.5rem" }}>Reportes Ciudadanos</h1>
        <nav style={{ display: "flex", gap: "1rem" }}>
          <Link to="/">Listado</Link>
          <Link to="/reportes/nuevo">Nuevo reporte</Link>
          <Link to="/reportes/cercanos">Cerca de mí</Link>
          {session ? (
            <>
              <span style={{ fontWeight: 600 }}>Hola, {session.username}</span>
              <button onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <Link to="/login">Eres funcionario? Accede aqui</Link>
          )}

        </nav>
      </header>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "0 1rem 2rem" }}>
        <Routes>
          <Route path="/" element={<ReportListPage />} />
          <Route path="/reportes/nuevo" element={<NewReportPage />} />
          <Route path="/reportes/:publicId" element={<ReportDetailPage />} />
          <Route path="/reportes/actualizacion/:publicId" element={<NewComent />} />
          <Route path="/reportes/cercanos" element={<NearbyReportsPage />} />
          <Route path="/login" element={<LoginPage />} />    {/* 👈 ruta login */}

        </Routes>
      </main>
    </div>
  );
}

export default App;
