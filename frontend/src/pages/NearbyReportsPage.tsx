import { useEffect, useMemo, useState } from "react";
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
  Container,
  Grid,
  Paper,
  Slider,
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

type Coordinates = { lat: number; lng: number };

function haversineDistanceKm(from: Coordinates, lat: number, lng: number): number {
  const R = 6371;
  const dLat = ((lat - from.lat) * Math.PI) / 180;
  const dLng = ((lng - from.lng) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((from.lat * Math.PI) / 180) *
      Math.cos((lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function NearbyReportsPage() {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [radiusKm, setRadiusKm] = useState(1);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError("La geolocalización no es soportada por este navegador.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setGeoError(null);
      },
      (err) => {
        setGeoError(err.message || "No fue posible obtener tu ubicación.");
      }
    );
  }, []);

  useEffect(() => {
    if (!coords) return;

    async function fetchNearby() {
      setFetchError(null);
      setLoading(true);
      try {
        const params = new URLSearchParams({
          lat: coords.lat.toString(),
          lng: coords.lng.toString(),
          radius_km: radiusKm.toString(),
        });
        const res = await fetch(`/api/reports/nearby?${params.toString()}`);
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.detail || "No se pudieron cargar los reportes cercanos.");
        }
        const data: Report[] = await res.json();
        setReports(data);
      } catch (err: any) {
        setFetchError(err.message || "Error inesperado al buscar reportes cercanos.");
      } finally {
        setLoading(false);
      }
    }
    fetchNearby();
  }, [coords, radiusKm]);

  const sortedReports = useMemo(() => {
    if (!coords) return reports;
    return [...reports].sort((a, b) => {
      const distA = haversineDistanceKm(coords, a.latitude, a.longitude);
      const distB = haversineDistanceKm(coords, b.latitude, b.longitude);
      return distA - distB;
    });
  }, [coords, reports]);

  return (
    <Container maxWidth="md" sx={{ mb: 4 }}>
      <Stack spacing={2} mb={3}>
        <Typography variant="h5" component="h2">
          Reportes cercanos a mí
        </Typography>
        <Paper sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Ajusta el radio para buscar reportes cercanos a tu ubicación actual y evitar duplicados.
            </Typography>
            <Slider
              value={radiusKm}
              min={0.5}
              max={10}
              step={0.5}
              marks={[
                { value: 0.5, label: "0.5 km" },
                { value: 5, label: "5 km" },
                { value: 10, label: "10 km" },
              ]}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${value} km`}
              onChange={(_, val) => setRadiusKm(val as number)}
              disabled={!coords}
            />
            {coords && (
              <Typography variant="body2" color="text.secondary">
                Buscando en un radio de {radiusKm} km alrededor de ({coords.lat.toFixed(4)},{" "}
                {coords.lng.toFixed(4)})
              </Typography>
            )}
            {geoError && <Alert severity="warning">{geoError}</Alert>}
          </Stack>
        </Paper>
      </Stack>

      {loading && (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      )}

      {fetchError && <Alert severity="error">{fetchError}</Alert>}

      {!loading && coords && sortedReports.length === 0 && (
        <Typography>No encontramos reportes en este radio. Intenta ampliarlo.</Typography>
      )}

      <Grid container spacing={2}>
        {sortedReports.map((report) => {
          const distanceKm = coords
            ? haversineDistanceKm(coords, report.latitude, report.longitude)
            : null;

          return (
            <Grid item xs={12} key={report.public_id}>
              <Card>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">Reporte #{report.id}</Typography>
                    <Chip label={statusLabels[report.status]} color={statusColors[report.status]} />
                  </Stack>
                  {distanceKm !== null && (
                    <Typography variant="body2" color="text.secondary">
                      A {distanceKm.toFixed(2)} km de tu ubicación
                    </Typography>
                  )}
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {report.description.length > 160
                      ? `${report.description.slice(0, 160)}...`
                      : report.description}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Coordenadas: {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: "flex-end" }}>
                  <Button
                    component="a"
                    href={`https://www.google.com/maps?q=${report.latitude},${report.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Ver en Google Maps
                  </Button>
                  <Button component={RouterLink} to={`/reportes/${report.public_id}`}>
                    Ver detalle
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Container>
  );
}
