'use client';

import { useEffect, useState } from 'react';

export default function RunDetail({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string>('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { params.then(p => setId(p.id)); }, [params]);

  const load = async () => {
    if (!id) return;
    const res = await fetch(`/api/runs/${id}`);
    setData(await res.json());
    setLoading(false);
  };

  useEffect(() => { if (id) { load(); const t = setInterval(load, 2000); return () => clearInterval(t); } }, [id]);

  const retry = async (stepId: string) => {
    if (!id) return;
    await fetch(`/api/runs/${id}/steps/${stepId}/retry`, { method: 'POST' });
    load();
  };
  const review = async (stepId: string, decision: string) => {
    if (!id) return;
    const note = prompt('Review note (optional):') || '';
    await fetch(`/api/runs/${id}/steps/${stepId}/review`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ decision, note }) });
    load();
  };
  const escalate = async () => {
    if (!id) return;
    await fetch(`/api/runs/${id}/escalate`, { method: 'POST' });
    alert('Escalation created (mock)');
    load();
  };

  if (loading) return <div>Loading...</div>;
  const run = data?.run;
  const steps = data?.steps || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Run Detail</h2>
        <button onClick={escalate} className="bg-orange-600 text-white px-3 py-1 rounded">Escalate (mock)</button>
      </div>
      <div className="border p-4 rounded">
        <div className="grid grid-cols-4 gap-2 text-sm">
          <div><span className="text-gray-600">Run ID:</span> <span className="font-mono text-xs">{run?.id}</span></div>
          <div><span className="text-gray-600">Status:</span> {run?.status}</div>
          <div><span className="text-gray-600">Started:</span> {run?.started_at ? new Date(run.started_at).toLocaleString() : '-'}</div>
          <div><span className="text-gray-600">Duration:</span> {run?.duration_ms ? run.duration_ms + 'ms' : '-'}</div>
        </div>
        {run?.error_summary && <div className="mt-2 text-red-600 text-sm">{run.error_summary}</div>}
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Steps</h3>
        <div className="space-y-2">
          {steps.map((step: any) => (
            <div key={step.id} className="border rounded p-3">
              <div className="flex items-center justify-between">
                <div><span className="font-semibold">{step.position}. {step.step_name}</span> <span className="text-xs text-gray-600">({step.step_key})</span> <span className="ml-2 text-sm">[{step.status}]</span> <span className="text-xs text-gray-600 ml-2">attempt {step.attempt}</span></div>
                <div className="flex gap-2">
                  {step.status === 'failed' && <button onClick={() => retry(step.id)} className="text-xs bg-blue-100 px-2 py-1 rounded">Retry</button>}
                  {step.status === 'needs_review' && <>
                    <button onClick={() => review(step.id, 'approve')} className="text-xs bg-green-100 px-2 py-1 rounded">Approve</button>
                    <button onClick={() => review(step.id, 'reject')} className="text-xs bg-red-100 px-2 py-1 rounded">Reject</button>
                  </>}
                </div>
              </div>
              {step.output && <details className="mt-2"><summary className="cursor-pointer text-sm">Output</summary><pre className="text-xs bg-gray-50 p-2 mt-1 overflow-auto">{JSON.stringify(step.output, null, 2)}</pre></details>}
              {step.validation && <details className="mt-2"><summary className="cursor-pointer text-sm">Validation</summary><pre className="text-xs bg-gray-50 p-2 mt-1 overflow-auto">{JSON.stringify(step.validation, null, 2)}</pre></details>}
              {step.error_message && <div className="mt-2 text-sm text-red-600">{step.error_message}</div>}
              {step.attempts && step.attempts.length > 0 && <details className="mt-2"><summary className="cursor-pointer text-xs">Attempt History ({step.attempts.length})</summary><div className="mt-1 space-y-1">{step.attempts.map((a:any)=><div key={a.id} className="text-xs border p-1">attempt {a.attempt}: {a.status}</div>)}</div></details>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
