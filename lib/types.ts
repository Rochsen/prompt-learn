export type Grade = "S" | "A" | "B" | "C" | "D" | "F";

export type Dimension = {
  name: string;
  score: number;
  max: number;
  reason: string;
};

export type CriticalIssue = {
  problem: string;
  consequence: string;
  fix: string;
};

export type PromptChange = {
  point: string;
  before: string;
  after: string;
  benefit: string;
};

export type Evaluation = {
  id: string;
  createdAt: number;
  promptText: string;
  taskContext?: string;
  totalScore: number;
  grade: Grade;
  summary: string;
  dimensions: Dimension[];
  criticalIssues: CriticalIssue[];
  failurePredictions: string[];
  improvedPrompt: string;
  changes: PromptChange[];
  nextStep: string;
  parentId?: string;
};
