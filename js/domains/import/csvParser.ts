export interface ParsedBiometrics {
  date: string;
  sleepHours?: number;
  restHR?: number;
  hrv?: number;
}

const DATE_FORMAT_ISO = /^(\d{4})-(\d{2})-(\d{2})/;
const DATE_FORMAT_DOTS = /^(\d{4})\.(\d{2})\.(\d{2})/;
const DATE_FORMAT_DDMM = /^(\d{2})\.(\d{2})\.(\d{4})/;
const DATE_FORMAT_MMDD = /^(\d{2})\/(\d{2})\/(\d{4})/;
const DATE_FORMAT_COMPACT = /^(\d{8})$/;

function normalizeDate(raw: string): string | null {
  const s = raw.trim().split(' ')[0];
  let m: RegExpMatchArray | null;

  m = s.match(DATE_FORMAT_ISO);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;

  m = s.match(DATE_FORMAT_DOTS);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;

  m = s.match(DATE_FORMAT_DDMM);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;

  m = s.match(DATE_FORMAT_MMDD);
  if (m) return `${m[3]}-${m[1]}-${m[2]}`;

  m = s.match(DATE_FORMAT_COMPACT);
  if (m) return `${m[1].slice(0, 4)}-${m[1].slice(4, 6)}-${m[1].slice(6, 8)}`;

  return null;
}

function detectDelimiter(firstLine: string): string {
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  if (semicolonCount > commaCount && semicolonCount > tabCount) return ';';
  if (tabCount > commaCount && tabCount > semicolonCount) return '\t';
  return ',';
}

function parseLine(line: string, delimiter: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === delimiter && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

const SLEEP_KEYWORDS = ['sleep', 'сон', 'duration', 'продолжительность'];
const RESTHR_KEYWORDS = ['resting heart rate', 'resting hr', 'rhr', 'resthr', 'чсс покоя', 'частота сердечных сокращений в покое', 'пульс покоя', 'heart rate', 'hr'];
const HRV_KEYWORDS = ['hrv', 'вср', 'rmssd', 'variability', 'изменчивость сердечного ритма'];
const DATE_KEYWORDS = ['date', 'дата'];

function isSleepColumn(header: string): boolean {
  const h = header.toLowerCase();
  return SLEEP_KEYWORDS.some(k => h.includes(k));
}

function isRestHRColumn(header: string): boolean {
  const h = header.toLowerCase();
  return RESTHR_KEYWORDS.some(k => h.includes(k));
}

function isHrvColumn(header: string): boolean {
  const h = header.toLowerCase();
  return HRV_KEYWORDS.some(k => h.includes(k));
}

function isDateColumn(header: string): boolean {
  const h = header.toLowerCase();
  return DATE_KEYWORDS.some(k => h === k);
}

function hasUnitSeconds(header: string): boolean {
  const h = header.toLowerCase();
  return h.includes('секунд') || h.includes('second');
}

function hasUnitMinutes(header: string): boolean {
  const h = header.toLowerCase();
  return h.includes('минут') || h.includes('minute');
}

function convertSleepValue(value: number, header: string): number {
  if (hasUnitSeconds(header)) return value / 3600;
  if (hasUnitMinutes(header) || value > 24) return value / 60;
  return value;
}

function mapHeaders(headers: string[]): { dateIdx: number; sleepIdx: number; restHRIdx: number; hrvIdx: number } {
  let dateIdx = -1, sleepIdx = -1, restHRIdx = -1, hrvIdx = -1;

  for (let i = 0; i < headers.length; i++) {
    const h = headers[i];
    if (isDateColumn(h)) dateIdx = i;
    else if (isSleepColumn(h)) sleepIdx = i;
    else if (isHrvColumn(h)) hrvIdx = i;
    else if (isRestHRColumn(h)) restHRIdx = i;
  }

  if (restHRIdx < 0 && hrvIdx < 0) {
    for (let i = 0; i < headers.length; i++) {
      const h = headers[i].toLowerCase();
      if ((h.includes('heart') || h.includes('hr') || h.includes('пульс') || h.includes('чсс')) && !h.includes('hrv') && !h.includes('вср')) {
        if (i !== hrvIdx && i !== sleepIdx && i !== dateIdx) {
          restHRIdx = i;
          break;
        }
      }
    }
  }

  return { dateIdx, sleepIdx, restHRIdx, hrvIdx };
}

export function parseHealthSyncCSV(csvContent: string): ParsedBiometrics[] {
  if (!csvContent || !csvContent.trim()) return [];

  const cleaned = csvContent.replace(/^\uFEFF/, '');

  const rawLines = cleaned.split(/\r?\n/);

  if (rawLines.length < 2) return [];

  const lines: string[] = [];
  for (const line of rawLines) {
    const trimmed = line.trim();
    if (trimmed) lines.push(trimmed);
  }

  if (lines.length < 2) return [];

  const delimiter = detectDelimiter(lines[0]);
  const headers = parseLine(lines[0], delimiter);
  const { dateIdx, sleepIdx, restHRIdx, hrvIdx } = mapHeaders(headers);

  if (dateIdx < 0) return [];
  if (sleepIdx < 0 && restHRIdx < 0 && hrvIdx < 0) return [];

  const results: ParsedBiometrics[] = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = parseLine(lines[i], delimiter);
    const rawDate = vals[dateIdx] || '';
    const date = normalizeDate(rawDate);
    if (!date) continue;

    const entry: ParsedBiometrics = { date };

    if (sleepIdx >= 0 && vals[sleepIdx]) {
      const n = parseFloat(vals[sleepIdx].replace(',', '.'));
      if (!isNaN(n) && n > 0) {
        entry.sleepHours = convertSleepValue(n, headers[sleepIdx]);
      }
    }

    if (restHRIdx >= 0 && vals[restHRIdx]) {
      const n = parseFloat(vals[restHRIdx].replace(',', '.'));
      if (!isNaN(n) && n > 0) {
        entry.restHR = Math.round(n);
      }
    }

    if (hrvIdx >= 0 && vals[hrvIdx]) {
      const n = parseFloat(vals[hrvIdx].replace(',', '.'));
      if (!isNaN(n) && n > 0) {
        entry.hrv = Math.round(n);
      }
    }

    if (entry.sleepHours !== undefined || entry.restHR !== undefined || entry.hrv !== undefined) {
      results.push(entry);
    }
  }

  return results;
}
