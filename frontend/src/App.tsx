import { useEffect, useState } from "react";
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from "react-router-dom";
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
  const location = useLocation();
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

  const navLinks = [
    { label: "Cómo funciona", to: "/como-funciona" },
    { label: "Listado", to: "/reportes" },
    { label: "Nuevo reporte", to: "/reportes/nuevo" },
    { label: "Cerca de mí", to: "/reportes/cercanos" },
    { label: "Noticias", to: "/noticias" },
  ];

  const isActive = (path: string) => {
    if (path === "/como-funciona") {
      return location.pathname === "/" || location.pathname === path;
    }
    return location.pathname === path;
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
            {navLinks.map((link) => {
              const active = isActive(link.to);
              return (
                <Button
                  key={link.to}
                  color="inherit"
                  component={Link}
                  to={link.to}
                  sx={{
                    borderBottom: active ? "2px solid #fff" : "2px solid transparent",
                    borderRadius: 0,
                    px: 1.5,
                    color: "#fff",
                  }}
                >
                  {link.label}
                </Button>
              );
            })}
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

      <Box
        component="main"
        sx={{
          maxWidth: 900,
          mx: "auto",
          px: 0,
          py: 0,
          width: "100%",
          flexGrow: 1,
        }}
      >
        <Routes>
          <Route path="/" element={<Navigate to="/como-funciona" replace />} />
          <Route path="/reportes" element={<ReportListPage />} />
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
