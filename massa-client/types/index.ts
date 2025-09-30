export interface Project {
  id: BigInt;
  client: string;
  freelancer: string;
  title: string;
  description: string;
  budget: BigInt;
  deadline: BigInt;
  status: string;
  createdAt: BigInt;
  category: string;
  skills: string[];
}

export interface Milestone {
  id: number;
  projectId: number;
  title: string;
  description: string;
  amount: number;
  deadline: number;
  status: number;
  deliverables: string;
  completedAt: number;
  paidAt: number;
}

export interface Rating {
  id: number;
  from: string;
  to: string;
  projectId: number;
  score: number;
  comment: string;
  timestamp: number;
}

export enum ProjectStatus {
  Open = 0,
  InProgress = 1,
  Completed = 2,
  Cancelled = 3,
  Disputed = 4
}

export enum MilestoneStatus {
  Pending = 0,
  Completed = 1,
  Approved = 2,
  Paid = 3
}