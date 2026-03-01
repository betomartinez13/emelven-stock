import { useAuthStore } from '../../stores/auth.store';

export default function DashboardPage() {
  const user = useAuthStore(s => s.user);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800">
        Bienvenido, {user?.nombre}
      </h1>
      <p className="text-gray-500 mt-1">
        Sistema de Control de Inventario — EMELVEN
      </p>
    </div>
  );
}
