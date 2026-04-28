import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { saveWallet } from '../../services/api';

export const WalletPanel = () => {
  const { user, setUser } = useAuth();
  const [walletAddress, setWalletAddress] = useState(user?.walletAddress || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress.trim()) {
      setError('Ingresa una dirección de wallet');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await saveWallet(walletAddress.trim());
      setUser(response.user);
      setSuccess('¡Wallet guardada exitosamente! Las tareas de wallet se completaron automáticamente.');
    } catch (err: any) {
      setError(err?.message || 'Error al guardar la wallet');
    } finally {
      setIsLoading(false);
    }
  };

  if (user?.walletAddress) {
    return (
      <div className="rounded-3xl border border-brand-neonCyan/30 bg-brand-neonCyan/10 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="text-2xl">👛</div>
          <div>
            <h3 className="text-lg font-semibold text-brand-pureWhite">Wallet Conectada</h3>
            <p className="text-sm text-brand-softGray">
              {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-brand-electricBlue/30 bg-brand-electricBlue/10 px-6 py-5">
      <div className="flex items-start gap-3">
        <div className="text-2xl">👛</div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-brand-pureWhite mb-2">Agregar Wallet Address</h3>
          <p className="text-sm text-brand-softGray mb-4">
            Agrega tu dirección de wallet BSC para participar en el airdrop y completar tareas automáticamente.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="0x..."
              className="w-full rounded-2xl border border-brand-graphite/70 bg-brand-blackVoid/80 px-4 py-3 text-brand-pureWhite outline-none focus:border-brand-electricBlue placeholder:text-brand-softGray/50"
              disabled={isLoading}
            />

            {error && <p className="text-sm text-red-400">{error}</p>}
            {success && <p className="text-sm text-green-400">{success}</p>}

            <button
              type="submit"
              disabled={isLoading || !walletAddress.trim()}
              className="w-full rounded-2xl bg-brand-electricBlue px-4 py-3 text-sm font-semibold text-brand-blackVoid transition hover:bg-brand-electricBlue/80 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Guardando...' : 'Guardar Wallet'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};