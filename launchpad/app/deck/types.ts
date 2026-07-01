export type Stage = "idea" | "build" | "launch" | "scale" | "parked";
export type Model = "oneoff" | "sub";

export interface HistoryPoint {
  m: string;
  rev: number;
  vis: number;
  units: number;
}

export interface Task {
  t: string;
  done: boolean;
}

export interface VEvent {
  ts: string;
  text: string;
}

export interface Traffic {
  src: string;
  pct: number;
}

export interface Venture {
  id: string;
  name: string;
  ideaN: number | null;
  cat: string;
  channel: string;
  model: Model;
  stage: Stage;
  goal: number;
  created: number;
  demo: boolean;
  prevStage?: Stage;
  traffic: Traffic[];
  tasks: Task[];
  history: HistoryPoint[];
  events: VEvent[];
}

export interface Persist {
  ventures: Venture[];
  isDemo: boolean;
}

export interface StageDef {
  k: Stage;
  label: string;
  sub: string;
  color: string;
}

export interface CatDef {
  k: string;
  label: string;
}

export type ModalMode = "launch" | "log" | "edit";
export interface ModalState {
  mode: ModalMode;
  id?: string;
}

export interface FormState {
  name?: string;
  cat?: string;
  channel?: string;
  model?: Model;
  stage?: Stage;
  goal?: string;
  startRev?: string;
  ideaN?: number | null;
  tasksText?: string;
  month?: string;
  rev?: string;
  vis?: string;
  units?: string;
}
