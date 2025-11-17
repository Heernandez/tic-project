import { useEffect, useState } from "react";
import { Alert, Box, CircularProgress, Container, Stack, Typography } from "@mui/material";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { getSession, getToken, type SessionData } from "../auth";
import { NewsForm, type NewsFormValues } from "../components/NewsForm";
import type { News } from "../types";

export default function NewsEditPage() {
  const { newsId } = useParams<{ newsId: string }>();
  const [session] = useState<SessionData | null>(getSession());
  const [news, setNews] = useState<News | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!newsId) return;

    const fetchNews = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/news/${newsId}?only_active=false`);
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.detail || "No se pudo cargar la noticia.");
        }
        const data: News = await res.json();
        setNews(data);
      } catch (err: any) {
        setError(err.message || "Error cargando la noticia.");
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [newsId]);

  if (!session) {
    return (
      <Container maxWidth="md" sx={{ my: 4 }}>
        <Alert severity="warning">
          Debes iniciar sesión para administrar noticias.{" "}
          <RouterLink to="/login" style={{ color: "inherit", textDecoration: "underline" }}>
            Inicia sesión aquí.
          </RouterLink>
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !news) {
    return (
      <Container maxWidth="md" sx={{ my: 4 }}>
        <Alert severity="error">{error || "No se encontró la noticia."}</Alert>
      </Container>
    );
  }

  const handleSubmit = async (values: NewsFormValues) => {
    const token = getToken();
    if (!token) {
      const message = "Sesión inválida. Inicia sesión nuevamente.";
      setSubmitError(message);
      throw new Error(message);
    }

    const formData = new FormData();
    formData.append("title", values.title.trim());
    formData.append("description", values.description.trim());
    formData.append("start_date", values.startDate);
    formData.append("end_date", values.endDate);
    values.files.forEach((file) => formData.append("files", file));

    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`/api/news/${news.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail || "No se pudo actualizar la noticia.");
      }

      const updated: News = await res.json();
      setNews(updated);
      setSuccess("Noticia actualizada correctamente.");
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
      setSubmitError(err.message || "Error al actualizar la noticia.");
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      <Stack spacing={2} mb={2}>
        <Typography variant="h5" component="h2">
          Administrar noticia
        </Typography>
        {success && <Alert severity="success">{success}</Alert>}
      </Stack>
      <NewsForm
        mode="edit"
        initialValues={{
          title: news.title,
          description: news.description ?? "",
          startDate: news.start_date ?? "",
          endDate: news.end_date ?? "",
        }}
        existingMedia={news.media}
        submitting={submitting}
        error={submitError}
        onSubmit={handleSubmit}
      />
    </Container>
  );
}
