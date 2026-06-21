export interface SampleScript {
  id: string;
  name: string;
  path: string;
}

/** Built-in demo script for the StarleyDesign design component tab */
export const SAMPLE_SCRIPTS: SampleScript[] = [
  {
    id: 'importance-of-being-earnest',
    name: 'The Importance of Being Earnest (Sample)',
    path: '/samples/Importance-of-Being-Earnest-Sample.txt',
  },
];

function sampleFetchUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`
    .split('/')
    .map((segment, index) =>
      index === 0 || !segment ? segment : encodeURIComponent(segment)
    )
    .join('/');
}

export async function loadSampleScript(
  sample: SampleScript
): Promise<{ text: string; fileName: string }> {
  const response = await fetch(sampleFetchUrl(sample.path));
  if (!response.ok) {
    throw new Error(`Could not load "${sample.name}" (${response.status})`);
  }
  const text = await response.text();
  if (!text.trim()) {
    throw new Error(`"${sample.name}" is empty on the server.`);
  }
  return { text, fileName: `${sample.name}.txt` };
}

export const DEFAULT_SAMPLE = SAMPLE_SCRIPTS[0];
