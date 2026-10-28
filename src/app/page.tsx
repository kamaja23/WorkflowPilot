'use client';

import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    fetch('/api/workflows').then(r => r.json()).then(d => setWorkflows(d.workflows || []));
    fetch('/api/runs').then(r => r.json()).then(d => setRuns(d.runs || []));
    fetch('/api/evaluations/summary').then(r => r.json()).then(d => setSummary(d));
  }, []);

  const runDemo = async (case_id?: string) => {
    const wfId = workflows[0]?.id || '00000000-0000-0000-0000-000000000001';
    const res = await fetch(`/api/workflows/${wfId}/runs`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(case_id ? { case_id } : {}) });
    const data = await res.json();
    if (data.run?.id) window.location.href = `/runs/${data.run.id}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <div className="flex gap-2">
          <button onClick={() => runDemo()} className="bg-blue-600 text-white px-4 py-2 rounded">Run demo workflow</button>
          <button onClick={() => runDemo('support_bad_refund_01')} className="bg-red-600 text-white px-4 py-2 rounded">Run failure case</button>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <div className="border p-4 rounded"><div className="text-sm text-gray-600">Total Runs</div><div className="text-2xl font-bold">{runs.length}</div></div>
        <div className="border p-4 rounded"><div className="text-sm text-gray-600">Succeeded</div><div className="text-2xl font-bold text-green-600">{runs.filter(r => r.status === 'succeeded').length}</div></div>
        <div className="border p-4 rounded"><div className="text-sm text-gray-600">Failed</div><div className="text-2xl font-bold text-red-600">{runs.filter(r => r.status === 'failed').length}</div></div>
        <div className="border p-4 rounded"><div className="text-sm text-gray-600">Eval Pass Rate</div><div className="text-2xl font-bold">{summary?.totals ? Math.round(summary.totals.passRate * 100) + '%' : '-'}</div></div>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Recent Runs</h3>
        <div className="border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr><th className="text-left p-2">Run ID</th><th className="text-left p-2">Status</th><th className="text-left p-2">Started</th><th className="text-left p-2">Duration</th><th className="text-left p-2"></th></tr></thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id} className="border-t"><td className="p-2 font-mono text-xs">{r.id.slice(0,8)}...</td><td className="p-2">{r.status}</td><td className="p-2">{r.started_at ? new Date(r.started_at).toLocaleString() : '-'}</td><td className="p-2">{r.duration_ms ? r.duration_ms + 'ms' : '-'}</td><td className="p-2"><a href={`/runs/${r.id}`} className="text-blue-600">View</a></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
