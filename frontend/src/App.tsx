import { useEffect, useState } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import ReportListPage from "./pages/ReportListPage";
import NewReportPage from "./pages/NewReportPage";
import ReportDetailPage from "./pages/ReportDetailPage";
import NewComent from "./pages/NewComent";
import LoginPage from "./pages/LoginPage";
import NearbyReportsPage from "./pages/NearbyReportsPage";
import NewsPage from "./pages/NewsPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import { clearSession, getSession, type SessionData } from "./auth";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";

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
    <Box
      sx={{
        fontFamily: "system-ui, sans-serif",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#f5f5f5",
      }}
    >
      <AppBar position="static" color="primary" sx={{ flexShrink: 0 }} elevation={0}>
        <Toolbar sx={{ flexWrap: "wrap", gap: 2 }}>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Reportes Ciudadanos
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center">
            <Button color="inherit" component={Link} to="/">
              Listado
            </Button>
            <Button color="inherit" component={Link} to="/reportes/nuevo">
              Nuevo reporte
            </Button>
            <Button color="inherit" component={Link} to="/reportes/cercanos">
              Cerca de mí
            </Button>
            <Button color="inherit" component={Link} to="/como-funciona">
              Cómo funciona
            </Button>
            <Button color="inherit" component={Link} to="/noticias">
              Noticias
            </Button>
          </Stack>
          {session ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2">Hola, {session.username}</Typography>
              <Button variant="outlined" color="inherit" size="small" onClick={handleLogout}>
                Logout
              </Button>
            </Stack>
          ) : (
            <Button color="inherit" component={Link} to="/login">
              Eres funcionario? Accede aqui
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Box component="main" sx={{ maxWidth: 900, mx: "auto", p: 2, width: "100%", flexGrow: 1 }}>
        <Routes>
          <Route path="/" element={<ReportListPage />} />
          <Route path="/reportes/nuevo" element={<NewReportPage />} />
          <Route path="/reportes/:publicId" element={<ReportDetailPage />} />
          <Route path="/reportes/actualizacion/:publicId" element={<NewComent />} />
          <Route path="/reportes/cercanos" element={<NearbyReportsPage />} />
          <Route path="/como-funciona" element={<HowItWorksPage />} />
          <Route path="/noticias" element={<NewsPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </Box>
    </Box>
  );
}

export default App;
