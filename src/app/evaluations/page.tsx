'use client';

import { useEffect, useState } from 'react';

export default function Evaluations() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { fetch('/api/evaluations/summary').then(r => r.json()).then(setData); }, []);
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Reliability / Evaluations</h2>
      <div className="grid grid-cols-3 gap-4">
        <div className="border p-4 rounded"><div className="text-sm text-gray-600">Total Eval Results</div><div className="text-2xl font-bold">{data?.totals?.total || 0}</div></div>
        <div className="border p-4 rounded"><div className="text-sm text-gray-600">Passed</div><div className="text-2xl font-bold text-green-600">{data?.totals?.passed || 0}</div></div>
        <div className="border p-4 rounded"><div className="text-sm text-gray-600">Pass Rate</div><div className="text-2xl font-bold">{data?.totals ? Math.round(data.totals.passRate * 100) + '%' : '-'}</div></div>
      </div>
      <div className="border p-4 rounded">
        <div className="text-sm">Sample scope: {data?.totals?.total || 0} cases total. Time scope: {data?.timeScope?.first_run ? new Date(data.timeScope.first_run).toLocaleDateString() : '-'} to {data?.timeScope?.last_run ? new Date(data.timeScope.last_run).toLocaleDateString() : '-'}</div>
      </div>
      <div className="border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr><th className="text-left p-2">Dataset</th><th className="text-left p-2">Total</th><th className="text-left p-2">Passed</th></tr></thead>
          <tbody>
            {(data?.summary || []).map((s: any, i: number) => (
              <tr key={i} className="border-t"><td className="p-2">{s.dataset_name}</td><td className="p-2">{s.total}</td><td className="p-2">{s.passed}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
