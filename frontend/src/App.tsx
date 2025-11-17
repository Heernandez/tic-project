import { useEffect, useState } from "react";
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from "react-router-dom";
import ReportListPage from "./pages/ReportListPage";
import NewReportPage from "./pages/NewReportPage";
import ReportDetailPage from "./pages/ReportDetailPage";
import NewComent from "./pages/NewComent";
import LoginPage from "./pages/LoginPage";
import NearbyReportsPage from "./pages/NearbyReportsPage";
import NewsPage from "./pages/NewsPage";
import NewsCreatePage from "./pages/NewsCreatePage";
import NewsEditPage from "./pages/NewsEditPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import { clearSession, getSession, type SessionData } from "./auth";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";


function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState<SessionData | null>(getSession());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [visitCount, setVisitCount] = useState<number | null>(null);

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
    { label: "Nuevo reporte", to: "/reportes/nuevo" },
    { label: "Listado", to: "/reportes" },
    { label: "Cerca de mí", to: "/reportes/cercanos" },
    { label: "Noticias", to: "/noticias" },
  ];

  const isActive = (path: string) => {
    if (path === "/como-funciona") {
      return location.pathname === "/" || location.pathname === path;
    }
    return location.pathname === path;
  };

  useEffect(() => {
    const tokenKey = "visitor_token";
    const generateToken = () => {
      if (window.crypto?.randomUUID) return window.crypto.randomUUID();
      return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    };

    let token = localStorage.getItem(tokenKey);
    if (!token) {
      token = generateToken();
      localStorage.setItem(tokenKey, token);
    }

    const registerVisit = async () => {
      try {
        await fetch("/api/analytics/visits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ device_token: token }),
        });
      } catch (error) {
        console.error("No se pudo registrar la visita", error);
      }

      try {
        const res = await fetch("/api/analytics/visits/count");
        if (res.ok) {
          const data = await res.json();
          setVisitCount(data.total);
        }
      } catch (error) {
        console.error("No se pudo obtener el contador de visitas", error);
      }
    };

    registerVisit();
  }, []);

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
            GOBERNANZA DIGITAL
          </Typography>
          <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
            justifyContent="center"
            sx={{ display: { xs: "none", sm: "flex" } }}
          >
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
          <IconButton
            color="inherit"
            onClick={() => setDrawerOpen(true)}
            sx={{ display: { xs: "flex", sm: "none" } }}
            aria-label="Abrir menú"
          >
            <span style={{ fontSize: 24 }}>☰</span>
          </IconButton>
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
      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 260, p: 2 }} role="presentation">
          <Typography variant="h6" sx={{ mb: 2 }}>
            Menú
          </Typography>
          <Stack spacing={1}>
            {navLinks.map((link) => (
              <Button
                key={link.to}
                component={Link}
                to={link.to}
                fullWidth
                onClick={() => setDrawerOpen(false)}
                sx={{ justifyContent: "flex-start" }}
              >
                {link.label}
              </Button>
            ))}
          </Stack>
          <Box mt={3}>
            {session ? (
              <Button variant="outlined" onClick={() => { setDrawerOpen(false); handleLogout(); }} fullWidth>
                Logout
              </Button>
            ) : (
              <Button
                component={Link}
                to="/login"
                fullWidth
                onClick={() => setDrawerOpen(false)}
                variant="outlined"
              >
                Eres funcionario? Accede aqui
              </Button>
            )}
          </Box>
        </Box>
      </Drawer>

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
          <Route path="/noticias/nueva" element={<NewsCreatePage />} />
          <Route path="/noticias/:newsId/editar" element={<NewsEditPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </Box>
      <Box
        component="footer"
        sx={{
          mt: 4,
          py: 3,
          px: 2,
          backgroundColor: "#102a43",
          color: "#fff",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems="center"
          justifyContent="center"
          textAlign="center"
        >
          <Box component="img" src="/UTP.png" alt="Logo UTP" sx={{ height: 48 }} />
          <Typography variant="body2">
            Proyecto de Grado TIC: "DISEÑO DE PLATAFORMA DE GOBIERNO DIGITAL PARA REPORTES Y COMUNICACIÓN CIUDADANA EN
            PEREIRA" — Luis Hernández — 2025 ©
          </Typography>
        </Stack>
        {visitCount !== null && (
          <Typography variant="body2" textAlign="center" mt={1}>
            Visitas registradas: {visitCount}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

export default App;
