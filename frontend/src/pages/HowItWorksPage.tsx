import { Container, Paper, Stack, Typography, List, ListItem, ListItemText } from "@mui/material";

export default function HowItWorksPage() {
  const steps = [
    {
      title: "1. Completa el formulario de reporte",
      description:
        "Describe la situación, carga fotos o videos y proporciona la ubicación exacta. Puedes usar el botón “Usar mi ubicación actual” para autocompletar latitud y longitud.",
    },
    {
      title: "2. Valida tu correo con un código OTP",
      description:
        "La app envía un código temporal (OTP) a tu correo. Debes ingresarlo en el formulario para confirmar que eres el titular del reporte. El código expira en pocos minutos para mayor seguridad.",
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
          <Typography color="text.secondary">
            Esta guía rápida explica el flujo completo para ciudadanos y operarios, incluyendo la verificación
            por correo y el seguimiento de cambios.
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
