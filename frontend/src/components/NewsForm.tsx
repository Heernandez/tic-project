import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { News } from "../types";

export interface NewsFormValues {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  files: File[];
}

interface NewsFormProps {
  mode: "create" | "edit";
  initialValues?: Partial<Omit<NewsFormValues, "files">>;
  existingMedia?: News["media"];
  submitting: boolean;
  error?: string | null;
  onSubmit: (values: NewsFormValues) => Promise<void>;
}

const formatDateInput = (value?: string | null) => {
  if (!value) return "";
  return value.slice(0, 10);
};

const defaultValues: NewsFormValues = {
  title: "",
  description: "",
  startDate: "",
  endDate: "",
  files: [],
};

export function NewsForm({
  mode,
  initialValues,
  existingMedia,
  submitting,
  error,
  onSubmit,
}: NewsFormProps) {
  const [values, setValues] = useState<NewsFormValues>(() => ({
    ...defaultValues,
    title: initialValues?.title ?? "",
    description: initialValues?.description ?? "",
    startDate: formatDateInput(initialValues?.startDate),
    endDate: formatDateInput(initialValues?.endDate),
  }));
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (initialValues) {
      setValues((prev) => ({
        ...prev,
        title: initialValues.title ?? prev.title,
        description: initialValues.description ?? prev.description,
        startDate: formatDateInput(initialValues.startDate) ?? "",
        endDate: formatDateInput(initialValues.endDate) ?? "",
      }));
    }
  }, [initialValues?.title, initialValues?.description, initialValues?.startDate, initialValues?.endDate]);

  const handleChange = (field: keyof Omit<NewsFormValues, "files">) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
    const selected = Array.from(event.target.files);
    setValues((prev) => ({ ...prev, files: [...prev.files, ...selected] }));
    event.target.value = "";
  };

  const handleRemoveFile = (index: number) => {
    setValues((prev) => ({
      ...prev,
      files: prev.files.filter((_, idx) => idx !== index),
    }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLocalError(null);

    if (!values.title.trim()) {
      setLocalError("El título es obligatorio.");
      return;
    }

    const hasDescription = !!values.description.trim();
    const hasMedia = values.files.length > 0 || (existingMedia?.length ?? 0) > 0;

    if (!hasDescription && !hasMedia) {
      setLocalError("Debes ingresar una descripción o adjuntar al menos un archivo.");
      return;
    }

    try {
      await onSubmit(values);
      if (mode === "create") {
        setValues({ ...defaultValues });
      } else {
        setValues((prev) => ({ ...prev, files: [] }));
      }
    } catch {
      // El componente padre maneja los errores de red/servidor.
    }
  };

  return (
    <Paper sx={{ p: 4 }}>
      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <div>
            <Typography variant="body2" color="text.secondary">
              El título y el contenido (descripción o archivos) son obligatorios para publicar una noticia.
            </Typography>
          </div>
          <TextField
            label="Título"
            value={values.title}
            onChange={handleChange("title")}
            required
            fullWidth
          />
          <TextField
            label="Descripción"
            value={values.description}
            onChange={handleChange("description")}
            multiline
            minRows={4}
            placeholder="Describe la novedad o deja este campo vacío si solo adjuntarás contenido multimedia."
            fullWidth
          />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Inicio de publicación"
              type="date"
              value={values.startDate}
              onChange={handleChange("startDate")}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Fin de publicación"
              type="date"
              value={values.endDate}
              onChange={handleChange("endDate")}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Stack>
          <div>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Puedes adjuntar imágenes o videos para complementar el contenido.
            </Typography>
            <Button variant="outlined" component="label">
              Adjuntar archivos
              <input type="file" hidden multiple accept="image/*,video/*" onChange={handleFileChange} />
            </Button>
            {values.files.length > 0 && (
              <Stack spacing={1} mt={1}>
                <Typography variant="body2" color="text.secondary">
                  Archivos nuevos:
                </Typography>
                {values.files.map((file, idx) => (
                  <Stack
                    key={`${file.name}-${idx}`}
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ border: "1px solid #ddd", borderRadius: 1, p: 1 }}
                  >
                    <Typography variant="body2">{file.name}</Typography>
                    <Button size="small" color="error" onClick={() => handleRemoveFile(idx)}>
                      Quitar
                    </Button>
                  </Stack>
                ))}
              </Stack>
            )}
          </div>
          {existingMedia && existingMedia.length > 0 && (
            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary">
                Recursos actuales:
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1.5}>
                {existingMedia.map((media) => {
                  const src = `/media-news/${media.file_name}`;
                  if (media.media_type === "video") {
                    return <video key={media.id} src={src} controls style={{ maxWidth: 200, borderRadius: 6 }} />;
                  }
                  return (
                    <Box
                      component="img"
                      key={media.id}
                      src={src}
                      alt={media.file_name}
                      sx={{ maxWidth: 200, borderRadius: 1 }}
                    />
                  );
                })}
              </Stack>
            </Stack>
          )}
          {localError && <Alert severity="warning">{localError}</Alert>}
          {error && <Alert severity="error">{error}</Alert>}
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? "Guardando..." : mode === "create" ? "Crear noticia" : "Actualizar noticia"}
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
}
