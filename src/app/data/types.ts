export interface Show {
  title: string;
  image: string;
  date: string;
  scope: string;
  stack: string;
  impact: string;
  role: string;
}

export interface BookingStep {
  number: number;
  title: string;
  description: string;
}

export interface PerformanceTime {
  time: string;
  type: 'matinee' | 'evening';
  available: number;
}

export interface Performance {
  date: Date;
  times: PerformanceTime[];
}
