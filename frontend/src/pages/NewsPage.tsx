import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import type { News } from "../types";
import { getSession, type SessionData } from "../auth";

const formatDate = (value?: string | null) => {
  if (!value) return null;
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function NewsPage() {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mediaIndexes, setMediaIndexes] = useState<Record<number, number>>({});
  const [session, setSession] = useState<SessionData | null>(getSession());

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/news/");
        if (!res.ok) {
          throw new Error("No se pudieron cargar las noticias.");
        }
        const data: News[] = await res.json();
        setNews(data);
      } catch (err: any) {
        setError(err.message || "Error inesperado al cargar las noticias.");
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

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

  const handleMediaNav = (newsId: number, step: number, total: number) => {
    if (total <= 1) return;
    setMediaIndexes((prev) => {
      const current = prev[newsId] ?? 0;
      let next = current + step;
      if (next < 0) next = total - 1;
      if (next >= total) next = 0;
      return { ...prev, [newsId]: next };
    });
  };

  const renderMedia = (item: News) => {
    if (item.media.length === 0) return null;
    const activeIndex = mediaIndexes[item.id] ?? 0;
    const activeMedia = item.media[activeIndex];
    const mediaUrl = `/media-news/${activeMedia.file_name}`;

    return (
      <Box sx={{ position: "relative", mt: 2 }}>
        {activeMedia.media_type === "video" ? (
          <Box
            component="video"
            src={mediaUrl}
            controls
            sx={{ width: "100%", borderRadius: 2, maxHeight: 340, objectFit: "cover" }}
          />
        ) : (
          <Box
            component="img"
            src={mediaUrl}
            alt={activeMedia.file_name}
            sx={{ width: "100%", borderRadius: 2, maxHeight: 340, objectFit: "cover" }}
          />
        )}
        {item.media.length > 1 && (
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ position: "absolute", top: "50%", left: 0, right: 0, px: 1 }}
          >
            <Button
              variant="contained"
              size="small"
              onClick={() => handleMediaNav(item.id, -1, item.media.length)}
            >
              ◀
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={() => handleMediaNav(item.id, 1, item.media.length)}
            >
              ▶
            </Button>
          </Stack>
        )}
        {item.media.length > 1 && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", textAlign: "center", mt: 1 }}
          >
            {activeIndex + 1} / {item.media.length}
          </Typography>
        )}
      </Box>
    );
  };

  return (
    <Container maxWidth="md" sx={{ mb: 4,mt:2 }}>
      <Stack spacing={3}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2}>
          <Typography variant="h5" component="h2">
            Noticias y publicaciones
          </Typography>
          {session && (
            <Button variant="contained" component={RouterLink} to="/noticias/nueva">
              Crear noticia
            </Button>
          )}
        </Stack>

        {loading && (
          <Box display="flex" justifyContent="center" mt={4}>
            <CircularProgress />
          </Box>
        )}

        {error && <Alert severity="error">{error}</Alert>}

        {!loading && !error && news.length === 0 && (
          <Paper sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="h6" gutterBottom>
              Aún no hay noticias disponibles
            </Typography>
            <Typography color="text.secondary">
              Cuando publiquemos novedades aparecerán en esta sección.
            </Typography>
          </Paper>
        )}

        {!loading &&
          !error &&
          news.map((item) => {
            const start = formatDate(item.start_date);
            const end = formatDate(item.end_date);

            return (
              <Card key={item.id}>
                <CardContent>
                  <Stack spacing={1}>
                    <Typography variant="h6">{item.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Publicado el {formatDate(item.created_at)}{" "}
                      {start || end ? `• Vigente ${start ?? "siempre"}${end ? ` - ${end}` : ""}` : ""}
                    </Typography>
                    {item.description && (
                      <Typography color="text.primary" sx={{ mt: 1 }}>
                        {item.description}
                      </Typography>
                    )}
                    {!item.description && item.media.length === 0 && (
                      <Typography color="text.secondary">
                        Esta publicación no tiene descripción ni archivos asociados.
                      </Typography>
                    )}
                    {renderMedia(item)}
                  </Stack>
                </CardContent>
                {session && (
                  <CardActions sx={{ justifyContent: "flex-end" }}>
                    <Button
                      variant="outlined"
                      size="small"
                      component={RouterLink}
                      to={`/noticias/${item.id}/editar`}
                    >
                      Administrar noticia
                    </Button>
                  </CardActions>
                )}
              </Card>
            );
          })}
      </Stack>
    </Container>
  );
}
