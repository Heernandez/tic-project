import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import type { Report, ReportStatus } from "../types";

const statusLabels: Record<ReportStatus, string> = {
  nuevo: "Nuevo",
  en_progreso: "En progreso",
  reasignado: "Reasignado",
  finalizado: "Finalizado",
};

const statusColors: Record<ReportStatus, "default" | "success" | "warning" | "info"> = {
  nuevo: "info",
  en_progreso: "warning",
  reasignado: "default",
  finalizado: "success",
};

export default function ReportListPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReports() {
      try {
        setLoading(true);
        const res = await fetch("/api/reports/");
        if (!res.ok) {
          throw new Error("Error al cargar reportes");
        }
        const data: Report[] = await res.json();
        setReports(data);
      } catch (err: any) {
        setError(err.message || "Error inesperado");
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

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

  if (reports.length === 0) {
    return <Typography>No hay reportes aún. Crea el primero desde “Nuevo reporte”.</Typography>;
  }

  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>
        Listado de reportes
      </Typography>
      <Grid container spacing={2}>
        {reports.map((r) => (
          <Grid item xs={12} md={6} key={r.public_id}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="h6">Reporte #{r.id}</Typography>
                  <Chip label={statusLabels[r.status]} color={statusColors[r.status]} size="small" />
                </Stack>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  {r.description.length > 140
                    ? r.description.slice(0, 140) + "..."
                    : r.description}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Lat: {r.latitude.toFixed(5)} | Lng: {r.longitude.toFixed(5)}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: "flex-end" }}>
                <Button component={RouterLink} to={`/reportes/${r.public_id}`}>
                  Ver detalle
                </Button>
                <Button
                  component={RouterLink}
                  to={`/reportes/actualizacion/${r.public_id}`}
                  variant="contained"
                  size="small"
                >
                  Agregar comentario
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
