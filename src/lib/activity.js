import { base44 } from '@/api/base44Client';

export function logActivity(action, detail = '') {
  return base44.entities.ActivityEvent.create({ action, detail, timestamp: new Date().toISOString() }).catch(() => {});
}