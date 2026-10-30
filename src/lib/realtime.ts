import { supabase } from './supabase/client';

export function subscribeToRun(runId: string, onUpdate: () => void) {
  if (!supabase) return () => {};
  const sb: any = supabase;
  const channel = sb
    .channel(`run-${runId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'workflow_runs', filter: `id=eq.${runId}` }, onUpdate)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'workflow_steps', filter: `run_id=eq.${runId}` }, onUpdate)
    .subscribe();
  return () => { sb.removeChannel(channel); };
}

export function subscribeToRuns(onUpdate: () => void) {
  if (!supabase) return () => {};
  const sb: any = supabase;
  const channel = sb
    .channel('runs-list')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'workflow_runs' }, onUpdate)
    .subscribe();
  return () => { sb.removeChannel(channel); };
}
