import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { Report } from "../types";

export default function ReportDetailPage() {
  const { publicId } = useParams<{ publicId: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicId) return;

    async function fetchReport() {
      try {
        setLoading(true);
        const res = await fetch(`/api/reports/${publicId}`);
        if (!res.ok) {
          throw new Error("Reporte no encontrado");
        }
        const data: Report = await res.json();
        setReport(data);
      } catch (err: any) {
        setError(err.message || "Error al cargar el reporte");
      } finally {
        setLoading(false);
      }
    }

    fetchReport();
  }, [publicId]);



  if (loading) return <p>Cargando reporte...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!report) return <p>No se encontró el reporte.</p>;

  return (
    <div>
      <h2>Reporte #{report.id}</h2>
      <p>
        <strong>Ciudadano:</strong> {report.citizen_email || "N/D"}
      </p>
      <p>
        <strong>Estado: </strong>{report.status}
      </p>

      <p>
        <strong>Descripción:</strong> {report.description}
      </p>
      <p>
        <strong>Ubicación:</strong> Lat {report.latitude} / Lng{" "}
        {report.longitude}
      </p>

      <section style={{ marginTop: "1rem" }}>
        <h3>Media del reporte</h3>
        {report.media.length === 0 && <p>No hay imágenes ni videos.</p>}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
          {report.media.map((m) => {
            const src = `/media/${m.file_name}`;
            if (m.media_type === "video") {
              return (
                <video
                  key={m.id}
                  src={src}
                  controls
                  style={{ maxWidth: 240, borderRadius: 8 }}
                />
              );
            }
            return (
              <img
                key={m.id}
                src={src}
                alt={m.file_name}
                style={{ maxWidth: 240, borderRadius: 8 }}
              />
            );
          })}
        </div>
      </section>

      <section style={{ marginTop: "1.5rem" }}>
        <h3>Comentarios</h3>

        {report.comments.length === 0 && (
          <p>No hay comentarios aún. Agrega el primero.</p>
        )}

        <ul style={{ listStyle: "none", padding: 0 }}>
          {report.comments.map((c) => (
            <li
              key={c.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: 8,
                padding: "0.75rem 1rem",
                marginBottom: "0.75rem",
              }}
            >
              <p style={{ marginBottom: "0.25rem" }}>
                <strong>{c.author || "Operario"}</strong>{" "}
                <span style={{ fontSize: "0.8rem", color: "#666" }}>
                  {new Date(c.created_at).toLocaleString()}
                </span>
              </p>
              <p style={{ marginTop: 0 }}>{c.content}</p>

              {c.media.length > 0 && (
                <div>
                  <p style={{ fontWeight: "bold", marginBottom: "0.25rem" }}>
                    Evidencias:
                  </p>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "0.5rem",
                    }}
                  >
                    {c.media.map((m) => {
                      const src = `/media-operator/${m.file_name}`;
                      if (m.media_type === "video") {
                        return (
                          <video
                            key={m.id}
                            src={src}
                            controls
                            style={{ maxWidth: 200, borderRadius: 6 }}
                          />
                        );
                      }
                      return (
                        <img
                          key={m.id}
                          src={src}
                          alt={m.file_name}
                          style={{ maxWidth: 200, borderRadius: 6 }}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
