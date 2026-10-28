export default function MockBanner() {
  const isMock = process.env.WORKFLOWPILOT_DEMO_MODE !== 'false';
  if (!isMock) return null;
  return (
    <div className="bg-yellow-100 border-b border-yellow-300 text-yellow-900 text-sm text-center py-2">
      <strong>MOCK MODE</strong> — no live calls. Using deterministic mock LLM and mock Jira adapter.
    </div>
  );
}
