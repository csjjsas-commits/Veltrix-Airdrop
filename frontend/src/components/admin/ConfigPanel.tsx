import { useState } from 'react';
import { AdminConfig } from '../../types';

interface Props {
  config: AdminConfig;
  onSave: (data: Partial<AdminConfig>) => void;
}

export const ConfigPanel = ({ config, onSave }: Props) => {
  const [pool, setPool] = useState(config.totalAirdropPool);
  const [week, setWeek] = useState(config.currentWeek);

  return (
    <div className="rounded-3xl border border-brand-graphite/70 bg-brand-graphite/85 p-6 shadow-brand-soft">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-brand-pureWhite">Configuración del Airdrop</h3>
          <p className="mt-2 text-brand-softGray">Actualiza el total de tokens y la semana activa.</p>
        </div>
        <button
          onClick={() => onSave({ totalAirdropPool: pool, currentWeek: week })}
          className="rounded-2xl bg-brand-neonCyan px-5 py-3 text-sm font-semibold text-brand-blackVoid transition hover:bg-brand-electricBlue"
        >
          Guardar cambios
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm text-brand-softGray">
          Total token pool
          <input
            type="text"
            value={pool}
            onChange={(e) => setPool(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-brand-graphite/70 bg-brand-blackVoid/80 px-4 py-3 text-brand-pureWhite outline-none focus:border-brand-neonCyan"
          />
        </label>
        <label className="block text-sm text-brand-softGray">
          Semana actual
          <input
            type="number"
            value={week}
            onChange={(e) => setWeek(Number(e.target.value))}
            min={1}
            className="mt-2 w-full rounded-2xl border border-brand-graphite/70 bg-brand-blackVoid/80 px-4 py-3 text-brand-pureWhite outline-none focus:border-brand-neonCyan"
          />
        </label>
      </div>
      <div className="mt-6 rounded-3xl bg-brand-blackVoid/70 p-4 text-brand-softGray">
        <p>Total usuarios: {config.totalCommunityPoints > 0 ? 'calculado por backend' : 'no disponible'}</p>
        <p className="mt-2">Total community points: {config.totalCommunityPoints}</p>
      </div>
    </div>
  );
};
