import { Container, Paper, Stack, Typography } from "@mui/material";

export default function NewsPage() {
  return (
    <Container maxWidth="md" sx={{ mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Stack spacing={2} alignItems="center">
          <Typography variant="h5" component="h2">
            Noticias
          </Typography>
          <Typography color="text.secondary" align="center">
            Estamos trabajando en esta sección para compartir novedades y avisos importantes.
          </Typography>
          <img
            src="/in-construccion.png"
            alt="Sección en construcción"
            style={{ maxWidth: "280px", width: "100%" }}
          />
        </Stack>
      </Paper>
    </Container>
  );
}
