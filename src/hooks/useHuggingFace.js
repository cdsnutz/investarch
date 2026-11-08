import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

const HF_CONNECTOR_ID = '6af0a4ce163a9d18edd2e5f1';

// App-user Hugging Face connection: a successful status call means the user has consented.
export default function useHuggingFace() {
  const [connected, setConnected] = useState(false);
  const [checking, setChecking] = useState(true);

  const check = useCallback(async () => {
    try {
      await base44.functions.invoke('hfInference', { action: 'status' });
      setConnected(true);
      return true;
    } catch {
      setConnected(false);
      return false;
    }
  }, []);

  useEffect(() => {
    base44.auth
      .isAuthenticated()
      .then((authed) => (authed ? check() : null))
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [check]);

  const connect = async () => {
    const url = await base44.connectors.connectAppUser(HF_CONNECTOR_ID);
    const popup = window.open(url, '_blank');
    const timer = setInterval(async () => {
      if (!popup || popup.closed) {
        clearInterval(timer);
        await check();
      }
    }, 500);
  };

  const disconnect = async () => {
    await base44.connectors.disconnectAppUser(HF_CONNECTOR_ID);
    setConnected(false);
  };

  const run = async (payload) => {
    const res = await base44.functions.invoke('hfInference', payload);
    return res.data;
  };

  return { connected, checking, connect, disconnect, run, refresh: check };
}