import { Wifi, WifiOff } from 'lucide-react';

interface NetworkStatusBannerProps {
  isOnline: boolean;
}

export function NetworkStatusBanner({ isOnline }: NetworkStatusBannerProps) {
  const Icon = isOnline ? Wifi : WifiOff;
  const title = isOnline ? 'Conexion activa' : 'Sin conexion';
  const detail = isOnline
    ? 'La API y las busquedas funcionan en linea.'
    : 'Las busquedas intentaran resolverse desde cache local.';

  return (
    <aside
      className={`network-status-pill ${isOnline ? 'is-online' : 'is-offline'}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <p className="network-status-pill-title">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {title}
      </p>
      <p className="network-status-pill-detail">{detail}</p>
    </aside>
  );
}
