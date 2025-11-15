// frontend/src/pages/LoginPage.tsx
import { FormEvent, useState } from "react";
import { useNavigate, useLocation, Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Button,
  Container,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { LoginResponse } from "../types";
import { saveSession } from "../auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // si vienes de un redirect, podemos leer "from"
  const from = (location.state as any)?.from || "/";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError("Usuario y contraseña son obligatorios.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const msg = data?.detail || "Credenciales inválidas.";
        throw new Error(msg);
      }

      const data: LoginResponse = await res.json();
      saveSession(data);

      // Redirigir a donde venía o al home
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container
      maxWidth="sm"
      sx={{ display: "flex", justifyContent: "center", mt: 6, mb: 4 }}
    >
      <Paper component="form" onSubmit={handleSubmit} sx={{ p: 4, width: "100%" }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Iniciar sesión
        </Typography>
        <Stack spacing={2}>
          <TextField
            label="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            fullWidth
          />
          <TextField
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            fullWidth
          />
          {error && <Alert severity="error">{error}</Alert>}
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? "Ingresando..." : "Ingresar"}
          </Button>
          <Typography variant="body2" color="text.secondary">
            Esta sección es para operarios del sistema. Los ciudadanos reportan desde el
            formulario de reporte.
          </Typography>
          <Link component={RouterLink} to="/" underline="hover">
            Volver al inicio
          </Link>
        </Stack>
      </Paper>
    </Container>
  );
}
