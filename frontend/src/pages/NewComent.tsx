import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { getToken } from "../auth";
import type { Report, ReportComment, ReportStatus } from "../types";

const statusLabels: Record<ReportStatus, string> = {
  nuevo: "Nuevo",
  en_progreso: "En progreso",
  reasignado: "Reasignado",
  finalizado: "Finalizado",
};

export default function ReportDetailPage() {
  const { publicId } = useParams<{ publicId: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [content, setContent] = useState("");
  const [evidences, setEvidences] = useState<FileList | null>(null);
  const [sendingComment, setSendingComment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!publicId) return;

    async function fetchReport() {
      try {
        setLoading(true);
        const res = await fetch(`/api/reports/${publicId}`);
        if (!res.ok) {
          throw new Error("Reporte no encontrado");
        }
        const data: Report = await res.json();
        setReport(data);
      } catch (err: any) {
        setError(err.message || "Error al cargar el reporte");
      } finally {
        setLoading(false);
      }
    }

    fetchReport();
  }, [publicId]);

  const handleStatusChange = async (event: any) => {
    const newStatus = event.target.value as ReportStatus;
    if (!publicId) return;

    try {
      setUpdatingStatus(true);
      const token = getToken();
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/reports/${publicId}/status`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail || "Error al actualizar estado");
      }

      const updated: Report = await res.json();
      setReport(updated);
    } catch (err: any) {
      setError(err.message || "Error actualizando estado");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEvidences(event.target.files);
  };

  const handleSubmitComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!publicId || !content.trim()) return;

    try {
      setSendingComment(true);
      const formData = new FormData();
      formData.append("content", content.trim());

      if (evidences) {
        Array.from(evidences).forEach((file) => formData.append("evidences", file));
      }

      const token = getToken();
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/reports/${publicId}/comments`, {
        method: "POST",
        headers,
        body: formData,
      });

      if (res.status === 401) {
        throw new Error("No autorizado. Inicia sesión.");
      }

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail || "Error al enviar comentario");
      }

      const created: ReportComment = await res.json();
      setReport((prev) =>
        prev
          ? { ...prev, comments: [...prev.comments, created], updated_at: new Date().toISOString() }
          : prev
      );
      setContent("");
      setEvidences(null);
    } catch (err: any) {
      setError(err.message || "Error al enviar comentario");
    } finally {
      setSendingComment(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!report) {
    return <Typography>No se encontró el reporte.</Typography>;
  }

  return (
    <Container maxWidth="md" sx={{ mb: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Reporte #{report.id}
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Ciudadano
            </Typography>
            <Typography>{report.citizen_email || "N/D"}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select
                value={report.status}
                label="Estado"
                onChange={handleStatusChange}
                disabled={updatingStatus}
              >
                {Object.entries(statusLabels).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">
              Descripción
            </Typography>
            <Typography>{report.description}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">
              Ubicación
            </Typography>
            <Typography>
              Lat {report.latitude} / Lng {report.longitude}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Adjuntos del reporte
        </Typography>
        {report.media.length === 0 ? (
          <Typography>No hay imágenes ni videos.</Typography>
        ) : (
          <Stack direction="row" flexWrap="wrap" gap={2}>
            {report.media.map((m) => {
              const src = `/media/${m.file_name}`;
              if (m.media_type === "video") {
                return <video key={m.id} src={src} controls style={{ maxWidth: 240, borderRadius: 8 }} />;
              }
              return (
                <Box
                  component="img"
                  key={m.id}
                  src={src}
                  alt={m.file_name}
                  sx={{ maxWidth: 240, borderRadius: 2 }}
                />
              );
            })}
          </Stack>
        )}
      </Paper>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Comentarios
        </Typography>
        {report.comments.length === 0 ? (
          <Typography>No hay comentarios aún. Agrega el primero.</Typography>
        ) : (
          <Stack spacing={2}>
            {report.comments.map((c) => (
              <Card key={c.id} variant="outlined">
                <CardContent>
                  <Typography fontWeight={600}>{c.author || "Operario"}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(c.created_at).toLocaleString()}
                  </Typography>
                  <Typography sx={{ mt: 1 }}>{c.content}</Typography>
                  {c.media.length > 0 && (
                    <Box mt={2}>
                      <Typography fontWeight={600} gutterBottom>
                        Evidencias
                      </Typography>
                      <Stack direction="row" flexWrap="wrap" gap={1.5}>
                        {c.media.map((m) => {
                          const src = `/media-operator/${m.file_name}`;
                          if (m.media_type === "video") {
                            return (
                              <video
                                key={m.id}
                                src={src}
                                controls
                                style={{ maxWidth: 200, borderRadius: 6 }}
                              />
                            );
                          }
                          return (
                            <Box
                              component="img"
                              key={m.id}
                              src={src}
                              alt={m.file_name}
                              sx={{ maxWidth: 200, borderRadius: 1 }}
                            />
                          );
                        })}
                      </Stack>
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Agregar comentario
        </Typography>
        <Box component="form" onSubmit={handleSubmitComment}>
          <Stack spacing={2}>
            <TextField
              label="Comentario"
              multiline
              minRows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
            <Button variant="outlined" component="label">
              Adjuntar evidencias
              <input type="file" hidden multiple accept="image/*,video/*" onChange={handleFileChange} />
            </Button>
            {evidences && evidences.length > 0 && (
              <Typography variant="body2" color="text.secondary">
                {evidences.length} archivo(s) seleccionado(s)
              </Typography>
            )}
            {error && <Alert severity="error">{error}</Alert>}
            <Button type="submit" variant="contained" disabled={sendingComment}>
              {sendingComment ? "Enviando..." : "Agregar comentario"}
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Container>
  );
}
