/**
 * Subtitle SRT & VTT Engine
 */

export interface SubtitleCue {
  id: string;
  index: number;
  startTimeMs: number;
  endTimeMs: number;
  text: string;
}

function formatTime(ms: number, isVtt = false): string {
  const totalSecs = Math.floor(ms / 1000);
  const hours = Math.floor(totalSecs / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;
  const millis = ms % 1000;

  const hStr = String(hours).padStart(2, '0');
  const mStr = String(minutes).padStart(2, '0');
  const sStr = String(seconds).padStart(2, '0');
  const msStr = String(millis).padStart(3, '0');

  const delim = isVtt ? '.' : ',';
  return `${hStr}:${mStr}:${sStr}${delim}${msStr}`;
}

function parseTime(timeStr: string): number {
  const parts = timeStr.trim().replace(',', '.').split(':');
  if (parts.length === 3) {
    const hours = parseFloat(parts[0]) || 0;
    const minutes = parseFloat(parts[1]) || 0;
    const seconds = parseFloat(parts[2]) || 0;
    return Math.round((hours * 3600 + minutes * 60 + seconds) * 1000);
  } else if (parts.length === 2) {
    const minutes = parseFloat(parts[0]) || 0;
    const seconds = parseFloat(parts[1]) || 0;
    return Math.round((minutes * 60 + seconds) * 1000);
  }
  return 0;
}

export function parseSrt(srtContent: string): SubtitleCue[] {
  const blocks = srtContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n\n');
  const cues: SubtitleCue[] = [];

  blocks.forEach((block, idx) => {
    const lines = block.trim().split('\n');
    if (lines.length >= 2) {
      let timeLine = lines[1];
      let textLines = lines.slice(2);

      // Handle cases where index number is omitted
      if (lines[0].includes('-->')) {
        timeLine = lines[0];
        textLines = lines.slice(1);
      }

      if (timeLine && timeLine.includes('-->')) {
        const [startStr, endStr] = timeLine.split('-->');
        cues.push({
          id: `cue-${idx + 1}`,
          index: idx + 1,
          startTimeMs: parseTime(startStr),
          endTimeMs: parseTime(endStr),
          text: textLines.join('\n').trim(),
        });
      }
    }
  });

  return cues;
}

export function exportToSrt(cues: SubtitleCue[]): string {
  return cues
    .map((cue, idx) => {
      const start = formatTime(cue.startTimeMs, false);
      const end = formatTime(cue.endTimeMs, false);
      return `${idx + 1}\n${start} --> ${end}\n${cue.text}`;
    })
    .join('\n\n');
}

export function exportToVtt(cues: SubtitleCue[]): string {
  const body = cues
    .map((cue) => {
      const start = formatTime(cue.startTimeMs, true);
      const end = formatTime(cue.endTimeMs, true);
      return `${start} --> ${end}\n${cue.text}`;
    })
    .join('\n\n');
  return `WEBVTT\n\n${body}`;
}

export function shiftSubtitleTiming(cues: SubtitleCue[], offsetMs: number): SubtitleCue[] {
  return cues.map((c) => ({
    ...c,
    startTimeMs: Math.max(0, c.startTimeMs + offsetMs),
    endTimeMs: Math.max(0, c.endTimeMs + offsetMs),
  }));
}
