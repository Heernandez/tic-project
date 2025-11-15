import { Container, Paper, Stack, Typography, List, ListItem, ListItemText } from "@mui/material";

export default function HowItWorksPage() {
  const steps = [
    {
      title: "1. Completa el formulario de reporte",
      description:
        "Describe la situación, carga fotos o videos y proporciona la ubicación exacta. Puedes usar el botón “Usar mi ubicación actual” para autocompletar latitud y longitud.",
    },
    {
      title: "2. Confirma tu correo con un código",
      description:
        "La app envía un código temporal a tu correo. Debes escribirlo en el formulario para demostrar que la dirección es tuya y evitar reportes falsos. Este código caduca en pocos minutos para mayor seguridad.",
    },
    {
      title: "3. Sigue el estado",
      description:
        "Los reportes se crean con estado “Nuevo”. Los operarios pueden agregar comentarios y evidencias, además de cambiar el estado (En progreso, Reasignado, Finalizado).",
    },
    {
      title: "4. Consulta cambios y comentarios",
      description:
        "Desde el detalle de cada reporte puedes ver la media adjunta y la bitácora de comentarios. Si eres operario (sesión iniciada), puedes agregar actualizaciones y evidencias.",
    },
  ];

  return (
    <Container maxWidth="md" sx={{ mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Stack spacing={3}>
          <Typography variant="h5" component="h2">
            ¿Cómo funciona la app?
          </Typography>
          <Typography>
            Esta aplicación permite que cualquier ciudadano reporte un problema en la vía pública (por ejemplo,
            un hueco o un poste dañado), adjunte fotos/ videos y comparta la ubicación exacta. Los operarios del
            municipio reciben el reporte, lo revisan, dejan comentarios y cambian el estado para que siempre sepas
            en qué etapa va la atención del caso. Por ahora empezamos con la ciudad de Pereira (Risaralda), pero
            el modelo puede replicarse en otras ciudades.
          </Typography>
          <Typography color="text.secondary">
            Antes de crear un nuevo reporte, puedes abrir la pestaña "Cerca de mí" para comprobar si ya existe uno
            en la misma ubicación; así evitamos duplicados y facilitamos la gestión.
          </Typography>
          <Typography color="text.secondary">
            Sigue estos pasos sencillos para crear y consultar reportes:
          </Typography>
          <List>
            {steps.map((step) => (
              <ListItem key={step.title} alignItems="flex-start">
                <ListItemText
                  primary={
                    <Typography variant="subtitle1" fontWeight={600}>
                      {step.title}
                    </Typography>
                  }
                  secondary={<Typography color="text.secondary">{step.description}</Typography>}
                />
              </ListItem>
            ))}
          </List>
        </Stack>
      </Paper>
    </Container>
  );
}
