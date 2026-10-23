import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { selfServiceApi } from "../../api/endpoints/selfService";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function ProfilePage() {
  const navigate = useNavigate();

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ["self-service-profile"],
    queryFn: selfServiceApi.getProfile,
  });

  const { data: balance, isLoading: loadingBalance } = useQuery({
    queryKey: ["self-service-balance"],
    queryFn: selfServiceApi.getMyBalance,
  });
  const queryClient = useQueryClient();
  const [editingContact, setEditingContact] = useState(false);
  const [contactForm, setContactForm] = useState({ phone: '', address: '' });
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactSuccess, setContactSuccess] = useState(false);

  const contactMutation = useMutation({
    mutationFn: selfServiceApi.updateContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['self-service-profile'] });
      setEditingContact(false);
      setContactSuccess(true);
      setTimeout(() => setContactSuccess(false), 3000);
    },
    onError: () => setContactError('Error al guardar los datos de contacto.'),
  });

  const openContact = () => {
    setContactForm({
      phone: profile?.phone ?? '',
      address: profile?.address ?? '',
    });
    setContactError(null);
    setEditingContact(true);
  };
  if (loadingProfile || loadingBalance) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#f8fafc" }}
      >
        <p style={{ color: "#64748b" }}>Cargando perfil...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#f8fafc" }}>
      <header
        className="bg-white border-b px-6 py-4 flex items-center gap-4"
        style={{ borderColor: "#e2e8f0" }}
      >
        <button
          onClick={() => navigate("/dashboard")}
          className="text-sm font-medium px-3 py-1.5 rounded-lg"
          style={{ color: "#2563eb", background: "#eff6ff" }}
        >
          ← Dashboard
        </button>
        <h1 className="text-lg font-semibold" style={{ color: "#0f172a" }}>
          Mi Perfil
        </h1>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
        {/* Datos personales */}
        <div
          className="bg-white rounded-xl p-6"
          style={{ border: "1px solid #e2e8f0" }}
        >
          <h2
            className="text-base font-semibold mb-4"
            style={{ color: "#0f172a" }}
          >
            Datos del empleado
          </h2>
          <div className="grid grid-cols-1 gap-4">
            <Row
              label="Nombre"
              value={`${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`}
            />
            <Row label="Email" value={profile?.email ?? "—"} />
            <Row label="DPI" value={profile?.dpi ?? "—"} />
            <Row label="Teléfono" value={profile?.phone ?? "—"} />
            <Row
              label="Departamento"
              value={profile?.department?.name ?? "—"}
            />
            <Row label="Puesto" value={profile?.position?.name ?? "—"} />
            <Row
              label="Fecha de ingreso"
              value={profile?.hireDate ? profile.hireDate.split("T")[0] : "—"}
            />
            <Row label="Estado" value={profile?.status ?? "—"} />
          </div>
        </div>
        {/* Datos de contacto */}
        <div className="bg-white rounded-xl p-6" style={{ border: "1px solid #e2e8f0" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold" style={{ color: "#0f172a" }}>Datos de contacto</h2>
            {!editingContact && (
              <button onClick={openContact}
                className="text-xs px-3 py-1.5 rounded-lg font-medium"
                style={{ background: "#eff6ff", color: "#2563eb" }}>
                Editar
              </button>
            )}
          </div>

          {!editingContact ? (
            <div className="grid grid-cols-1 gap-4">
              <Row label="Teléfono" value={profile?.phone ?? "—"} />
              <Row label="Dirección" value={profile?.address ?? "—"} />
  
            </div>
          ) : (
            <div className="space-y-4">
              {[
                { label: 'Teléfono', key: 'phone' as const },
                { label: 'Dirección', key: 'address' as const },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="text-xs font-medium block mb-1" style={{ color: "#64748b" }}>{label}</label>
                  <input
                    type="text"
                    value={contactForm[key]}
                    onChange={e => setContactForm({ ...contactForm, [key]: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                    style={{ border: "1px solid #e2e8f0", background: "#f8fafc", color: "#0f172a" }}
                  />
                </div>
              ))}

              {contactError && (
                <p className="text-xs" style={{ color: "#dc2626" }}>{contactError}</p>
              )}

              <div className="flex gap-3">
                <button onClick={() => setEditingContact(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                  style={{ background: "#f1f5f9", color: "#64748b" }}>
                  Cancelar
                </button>
                <button
                  onClick={() => contactMutation.mutate(contactForm)}
                  disabled={contactMutation.isPending}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: "#2563eb", opacity: contactMutation.isPending ? 0.7 : 1 }}>
                  {contactMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          )}

          {contactSuccess && (
            <p className="text-xs mt-3" style={{ color: "#059669" }}>✓ Datos de contacto actualizados</p>
          )}
        </div>
        {/* Saldo de vacaciones */}
        <div
          className="bg-white rounded-xl p-6"
          style={{ border: "1px solid #e2e8f0" }}
        >
          <h2
            className="text-base font-semibold mb-4"
            style={{ color: "#0f172a" }}
          >
            Saldo de vacaciones
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <Stat
              label="Días disponibles"
              value={balance?.availableDays ?? 0}
              color="#059669"
            />
            <Stat
              label="Días usados"
              value={balance?.usedDays ?? 0}
              color="#d97706"
            />
            <Stat
              label="Días totales"
              value={balance?.totalDays ?? 0}
              color="#2563eb"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex justify-between items-center py-2"
      style={{ borderBottom: "1px solid #f1f5f9" }}
    >
      <span className="text-sm" style={{ color: "#64748b" }}>
        {label}
      </span>
      <span className="text-sm font-medium" style={{ color: "#0f172a" }}>
        {value}
      </span>
    </div>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      className="rounded-lg p-4"
      style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
    >
      <p className="text-2xl font-bold" style={{ color }}>
        {value}
      </p>
      <p className="text-xs mt-1" style={{ color: "#64748b" }}>
        {label}
      </p>
    </div>
  );
}
