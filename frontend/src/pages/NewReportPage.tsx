import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import { Icon } from "leaflet";
import { Link as RouterLink } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  Container,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { Report } from "../types";

const defaultCenter: [number, number] = [4.81333, -75.69611]; // Pereira, Risaralda como fallback

const markerIcon = new Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function MapClickHandler({
  onSelect,
}: {
  onSelect: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapCenterUpdater({ lat, lng }: { lat?: number; lng?: number }) {
  const map = useMap();
  useEffect(() => {
    if (typeof lat === "number" && typeof lng === "number") {
      map.setView([lat, lng], map.getZoom());
    }
  }, [lat, lng, map]);
  return null;
}

export default function NewReportPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [description, setDescription] = useState("");
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");
  const [files, setFiles] = useState<File[]>([]);

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
        setError(null);
      },
      (err) => {
        setError(
          `No fue posible obtener la ubicación automáticamente (código ${err.code} - ${err.message}). ` +
            "Seleccionála en el mapa o ingrésala manualmente."
        );
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
    if (!e.target.files) return;
    const selected = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selected]);
    e.target.value = "";
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
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

      files.forEach((file) => {
        formData.append("files", file);
      });

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
      <Alert severity="info" sx={{ mb: 2 }}>
        Antes de enviar un nuevo reporte, revisa la pestaña {" "}
        <Link component={RouterLink} to="/reportes/cercanos" underline="hover">
              Cerca de mí
        </Link>{" "} 
        para confirmar si alguien ya reportó el
        mismo punto. Así evitamos duplicados y agilizamos la atención.
      </Alert>
      <Paper component="form" onSubmit={handleSubmit} sx={{ p: 4 }}>
        <Stack spacing={3}>
          <TextField
            label="Descripción"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            minRows={4}
            required
            fullWidth
          />
          <Box sx={{ height: 320, borderRadius: 2, overflow: "hidden" }}>
            <MapContainer
              center={
                latitude && longitude
                  ? [parseFloat(latitude), parseFloat(longitude)]
                  : defaultCenter
              }
              zoom={14}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {(latitude && longitude) && (
                <Marker
                  position={[parseFloat(latitude), parseFloat(longitude)]}
                  icon={markerIcon}
                />
              )}
              <MapCenterUpdater
                lat={latitude ? parseFloat(latitude) : undefined}
                lng={longitude ? parseFloat(longitude) : undefined}
              />
              <MapClickHandler
                onSelect={(lat, lng) => {
                  setLatitude(lat.toString());
                  setLongitude(lng.toString());
                  setError(null);
                }}
              />
            </MapContainer>
          </Box>
          <Button type="button" variant="text" onClick={handleUseCurrentLocation}>
            Usar mi ubicación actual
          </Button>
          <Box>
            <Button variant="outlined" component="label">
              Seleccionar archivos
              <input type="file" hidden multiple accept="image/*,video/*" onChange={handleFileChange} />
            </Button>
            {files.length > 0 && (
              <Stack spacing={1} mt={1}>
                <Typography variant="body2" color="text.secondary">
                  Archivos seleccionados:
                </Typography>
                {files.map((file, idx) => (
                  <Stack
                    key={`${file.name}-${idx}`}
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ border: "1px solid #ddd", borderRadius: 1, p: 1 }}
                  >
                    <Typography variant="body2" sx={{ mr: 2 }}>
                      {file.name}
                    </Typography>
                    <Button size="small" color="error" onClick={() => handleRemoveFile(idx)}>
                      Quitar
                    </Button>
                  </Stack>
                ))}
              </Stack>
            )}
          </Box>
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
          {error && <Alert severity="error">{error}</Alert>}
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? "Enviando..." : "Crear reporte"}
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}
