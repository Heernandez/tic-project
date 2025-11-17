import { useState } from "react";
import { Alert, Container, Stack, Typography } from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { getSession, getToken, type SessionData } from "../auth";
import { NewsForm, type NewsFormValues } from "../components/NewsForm";

export default function NewsCreatePage() {
  const [session] = useState<SessionData | null>(getSession());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  if (!session) {
    return (
      <Container maxWidth="md" sx={{ my: 4 }}>
        <Alert severity="warning">
          Debes iniciar sesión para crear una noticia.{" "}
          <RouterLink to="/login" style={{ color: "inherit", textDecoration: "underline" }}>
            Inicia sesión aquí.
          </RouterLink>
        </Alert>
      </Container>
    );
  }

  const handleSubmit = async (values: NewsFormValues) => {
    const token = getToken();
    if (!token) {
      const message = "Sesión inválida. Inicia sesión nuevamente.";
      setError(message);
      throw new Error(message);
    }

    const formData = new FormData();
    formData.append("title", values.title.trim());
    formData.append("description", values.description.trim());
    formData.append("start_date", values.startDate);
    formData.append("end_date", values.endDate);
    values.files.forEach((file) => formData.append("files", file));

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/news/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail || "No se pudo crear la noticia.");
      }

      setSuccess("Noticia creada correctamente.");
      // Navegar de regreso al listado después de un breve momento
      setTimeout(() => {
        navigate("/noticias");
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Error al crear la noticia.");
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      <Stack spacing={2} mb={2}>
        <Typography variant="h5" component="h2">
          Crear noticia
        </Typography>
        {success && <Alert severity="success">{success}</Alert>}
      </Stack>
      <NewsForm mode="create" submitting={submitting} error={error} onSubmit={handleSubmit} />
    </Container>
  );
}
