import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { CheckCircle2, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";

export default function ThankYou() {
  const { user } = useAuth();
  const [state, setState] = useState('pending'); // pending | active

  useEffect(() => {
    if (!user) return;
    let tries = 0;
    const check = async () => {
      try {
        const page = await base44.entities.SimulatorAccess.filter({ status: 'active' }, { limit: 1 });
        if ((page.items || []).length) { setState('active'); return; }
      } catch (_) { /* keep polling */ }
      tries += 1;
      if (tries < 10) setTimeout(check, 3000);
    };
    check();
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8 text-center">
        {state === 'active' ? (
          <>
            <CheckCircle2 className="size-12 text-emerald-600 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-slate-900 mb-2">Simulator Pro is active</h1>
            <p className="text-sm text-slate-600 mb-6">Payment confirmed. Full access to the Precision Business Simulator is unlocked.</p>
            <Button asChild className="w-full bg-slate-950 text-white hover:bg-slate-800">
              <Link to="/simulator">Open the Simulator</Link>
            </Button>
          </>
        ) : (
          <>
            {user ? <Loader2 className="size-8 text-slate-400 mx-auto mb-4 animate-spin" /> : <Clock className="size-8 text-slate-400 mx-auto mb-4" />}
            <h1 className="text-xl font-semibold text-slate-900 mb-2">Confirming your payment</h1>
            <p className="text-sm text-slate-600 mb-6">
              Your subscription is being activated. This usually takes a moment; you can safely leave this page.
            </p>
            {!user && (
              <p className="text-xs text-slate-500 mb-6">
                Paid without an account? <Link to="/register" className="text-slate-900 underline">Create your account</Link> with the email you used at checkout to claim access.
              </p>
            )}
            <Button asChild variant="outline" className="w-full">
              <Link to="/simulator">Back to the Simulator</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}