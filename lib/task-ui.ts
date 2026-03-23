export type TaskStatus = 'in_progress' | 'paused' | 'finished' | 'sem_card' | string;

export function normalizeTaskStatus(status?: string | null): TaskStatus {
  const normalized = status?.trim().toLowerCase();

  switch (normalized) {
    case 'em_andamento':
    case 'in_progress':
      return 'in_progress';
    case 'pausado':
    case 'paused':
      return 'paused';
    case 'finalizado':
    case 'finished':
      return 'finished';
    case 'sem_card':
      return 'sem_card';
    default:
      return normalized ?? 'sem_card';
  }
}

export function formatStatus(status: TaskStatus) {
  const normalizedStatus = normalizeTaskStatus(status);
  const labels: Record<string, string> = {
    in_progress: 'Em desenvolvimento',
    paused: 'Pausado',
    finished: 'Concluido',
    sem_card: 'Sem card',
  };

  return labels[normalizedStatus] ?? normalizedStatus.replaceAll('_', ' ');
}

export function statusPalette(status: TaskStatus) {
  switch (normalizeTaskStatus(status)) {
    case 'in_progress':
      return { bg: '#dfe9e2', fg: '#0f6158', accent: '#6b4b2f' };
    case 'paused':
      return { bg: '#ece6de', fg: '#7b6a58', accent: '#0a6d62' };
    case 'finished':
      return { bg: '#f6d8cf', fg: '#9d4b3e', accent: '#6b4b2f' };
    default:
      return { bg: '#ede9e1', fg: '#7c6d5d', accent: '#6b4b2f' };
  }
}

export function formatDurationDisplay(value?: string | null) {
  const raw = value?.trim();
  if (!raw) return '00:00:00';

  const parts = raw.split(':');
  if (parts.length === 2) return raw;
  if (parts.length !== 3) return raw;

  const [hours, minutes, seconds] = parts;
  return seconds === '00' ? `${hours}:${minutes}` : raw;
}

export function parseDurationToSeconds(value?: string | null) {
  const raw = value?.trim();
  if (!raw) return 0;

  const parts = raw.split(':').map((part) => Number(part));
  if (parts.some((part) => Number.isNaN(part))) return 0;

  if (parts.length === 2) {
    const [hours, minutes] = parts;
    return (hours * 3600) + (minutes * 60);
  }

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return (hours * 3600) + (minutes * 60) + seconds;
  }

  return 0;
}

export function formatSecondsDisplay(totalSeconds: number) {
  const normalizedSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(normalizedSeconds / 3600);
  const minutes = Math.floor((normalizedSeconds % 3600) / 60);
  const seconds = normalizedSeconds % 60;

  return formatDurationDisplay(
    `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
  );
}

export function formatDateDisplay(value?: string | null) {
  if (!value) return 'Sem registro';
  return value.replace('T', ' ').replace('Z', '');
}
