import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import { Icon } from "leaflet";
import type { Report } from "../types";

const markerIcon = new Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

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
        <strong>Estado: </strong>{report.status}
      </p>

      <p>
        <strong>Descripción:</strong> {report.description}
      </p>
      <section style={{ marginTop: "1rem" }}>
        <h3>Ubicación</h3>
        <div style={{ height: 320, borderRadius: 8, overflow: "hidden" }}>
          <MapContainer
            center={[report.latitude, report.longitude]}
            zoom={15}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={false}
            doubleClickZoom={false}
            dragging={false}
            boxZoom={false}
            keyboard={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[report.latitude, report.longitude]} icon={markerIcon} />
          </MapContainer>
        </div>
      </section>

      <section style={{ marginTop: "1rem" }}>
        <h3>Archivos adjuntos</h3>
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
          <p>No hay comentarios aún.</p>
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
