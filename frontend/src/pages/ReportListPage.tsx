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
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import type { Report, ReportStatus } from "../types";
import { getSession } from "../auth";

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
  const [hasSession, setHasSession] = useState<boolean>(!!getSession());
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "all">("all");

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

  useEffect(() => {
    const handleSessionChange = () => {
      setHasSession(!!getSession());
    };
    window.addEventListener("session-changed", handleSessionChange);
    window.addEventListener("storage", handleSessionChange);
    return () => {
      window.removeEventListener("session-changed", handleSessionChange);
      window.removeEventListener("storage", handleSessionChange);
    };
  }, []);

  useEffect(() => {
    if (!hasSession) {
      setStatusFilter("all");
    }
  }, [hasSession]);

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
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        textAlign="center"
        mt={4}
      >
        <Typography variant="h6" gutterBottom>
          No hay reportes aún
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Cuando existan registros los verás aquí. Mientras tanto, puedes crear el primero desde “Nuevo reporte”.
        </Typography>
        <img
          src="/sin_registros.png"
          alt="Sin reportes"
          style={{ maxWidth: 260, width: "100%", opacity: 0.85 }}
        />
      </Box>
    );
  }

  const filteredReports =
    statusFilter === "all"
      ? reports
      : reports.filter((report) => report.status === statusFilter);

  return (
    <Box>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        alignItems={{ xs: "flex-start", md: "center" }}
        justifyContent="space-between"
        mb={2}
        mt={2}
      >
        <Typography variant="h5" component="h2">
          Listado de reportes
        </Typography>
        {hasSession && (
          <FormControl size="small" sx={{ mt: "20px" }}>
            <InputLabel>Estado</InputLabel>
            <Select
              label="Estado"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as ReportStatus | "all")}
            >
              <MenuItem value="all">Todos</MenuItem>
              {Object.entries(statusLabels).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Stack>
      {filteredReports.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No hay reportes para el estado seleccionado.
        </Typography>
      ) : (
        <Grid container spacing={2} justifyContent="center">
          {filteredReports.map((r) => (
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
                  {!hasSession && (
                    <Button component={RouterLink} to={`/reportes/${r.public_id}`}>
                      Ver detalle
                    </Button>
                  )}
                  {hasSession && (
                    <Button
                      component={RouterLink}
                      to={`/reportes/actualizacion/${r.public_id}`}
                      variant="contained"
                      size="small"
                    >
                      Agregar comentario
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
