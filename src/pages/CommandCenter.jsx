import { useState } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import PipelinePanel from '@/components/command/PipelinePanel';
import SimulatorPanel from '@/components/command/SimulatorPanel';
import HunterPanel from '@/components/command/HunterPanel';
import LedgerPanel from '@/components/command/LedgerPanel';

export default function CommandCenter() {
  const [refreshKey, setRefreshKey] = useState(0);
  return (
    <div className="bg-paper min-h-[calc(100vh-3.5rem)] md:min-h-screen p-6 md:p-10 max-w-7xl mx-auto space-y-6">
      <PageHeader title="Command Center" subtitle="Pipeline state, entitlement, open market seeds, and the operations ledger." />
      <div className="grid lg:grid-cols-2 gap-6">
        <PipelinePanel refreshKey={refreshKey} />
        <SimulatorPanel />
        <HunterPanel onChange={() => setRefreshKey((k) => k + 1)} />
        <LedgerPanel />
      </div>
    </div>
  );
}