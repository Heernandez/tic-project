import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { Report } from "../types";

export default function NewReportPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [description, setDescription] = useState("");
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");
  const [files, setFiles] = useState<FileList | null>(null);

  const [sendingCode, setSendingCode] = useState(false);
  const [codeMessage, setCodeMessage] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const geoTimeout = setTimeout(() => {
      handleUseCurrentLocation();
    }, 500);
    return () => clearTimeout(geoTimeout);
  }, []);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("La geolocalización no es soportada por este navegador.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toString());
        setLongitude(pos.coords.longitude.toString());
      },
      () => {
        setError("No fue posible obtener la ubicación.");
      }
    );
  };

  const handleSendCode = async () => {
    setError(null);
    setCodeMessage(null);

    if (!email.trim()) {
      setError("Debes ingresar un correo válido.");
      return;
    }

    try {
      setSendingCode(true);
      const res = await fetch("/api/auth/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const msg = data?.detail || "No se pudo enviar el código de verificación.";
        throw new Error(msg);
      }

      setCodeMessage("Código enviado. Revisa tu correo (tiene validez de 3 minutos).");
    } catch (err: any) {
      setError(err.message || "Error enviando el código.");
    } finally {
      setSendingCode(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("El correo es obligatorio.");
      return;
    }
    if (!otpCode.trim()) {
      setError("Debes ingresar el código de verificación enviado a tu correo.");
      return;
    }
    if (!description.trim()) {
      setError("La descripción es obligatoria.");
      return;
    }
    if (!latitude || !longitude) {
      setError("Debes indicar la latitud y longitud.");
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append("email", email.trim());
      formData.append("otp_code", otpCode.trim());
      formData.append("description", description);
      formData.append("latitude", latitude);
      formData.append("longitude", longitude);

      if (files) {
        Array.from(files).forEach((file) => {
          formData.append("files", file);
        });
      }

      const res = await fetch("/api/reports/", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const msg = data?.detail || "Error al crear el reporte (código o datos inválidos).";
        throw new Error(msg);
      }

      const created: Report = await res.json();
      navigate(`/reportes/${created.public_id}`);
    } catch (err: any) {
      setError(err.message || "Error inesperado al crear el reporte.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h5" component="h2" gutterBottom>
        Nuevo reporte
      </Typography>
      <Paper component="form" onSubmit={handleSubmit} sx={{ p: 4 }}>
        <Stack spacing={3}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Correo electrónico"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              required
            />
            <Button
              type="button"
              variant="outlined"
              onClick={handleSendCode}
              disabled={sendingCode}
              sx={{ minWidth: 160 }}
            >
              {sendingCode ? "Enviando..." : "Enviar código"}
            </Button>
          </Stack>
          {codeMessage && <Alert severity="success">{codeMessage}</Alert>}
          <TextField
            label="Código de verificación"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
            required
            fullWidth
          />
          <TextField
            label="Descripción"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            minRows={4}
            required
            fullWidth
          />
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Latitud"
                type="number"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Longitud"
                type="number"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                fullWidth
                required
              />
            </Grid>
          </Grid>
          <Button type="button" variant="text" onClick={handleUseCurrentLocation}>
            Usar mi ubicación actual
          </Button>
          <Box>
            <Button variant="outlined" component="label">
              Seleccionar archivos
              <input type="file" hidden multiple accept="image/*,video/*" onChange={handleFileChange} />
            </Button>
            {files && files.length > 0 && (
              <Typography variant="body2" color="text.secondary" mt={1}>
                {files.length} archivo(s) seleccionado(s)
              </Typography>
            )}
          </Box>
          {error && <Alert severity="error">{error}</Alert>}
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? "Enviando..." : "Crear reporte"}
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}
