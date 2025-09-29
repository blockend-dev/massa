import {
  Context,
  Storage,
  generateEvent,
  Address,
} from '@massalabs/massa-as-sdk';
import {
  Args,
  Serializable,
  Result,
} from '@massalabs/as-types';
import {
  setOwner,
} from '@massalabs/sc-standards/assembly/contracts/utils/ownership';

// Storage prefixes
const PROJECT_PREFIX: StaticArray<u8> = [80]; // b'P'
const PROJECT_COUNTER_KEY: StaticArray<u8> = [80, 88]; // b'PX'
const USER_PROJECTS_PREFIX: StaticArray<u8> = [85, 80]; // b'UP'
const MILESTONE_PREFIX: StaticArray<u8> = [77]; // b'M'
const RATING_PREFIX: StaticArray<u8> = [82]; // b'R'
const DISPUTE_PREFIX: StaticArray<u8> = [68]; // b'D'

// Enums
const enum ProjectStatus {
  Open = 0,
  InProgress = 1,
  Completed = 2,
  Cancelled = 3,
  Disputed = 4
}

const enum DisputeStatus {
  None = 0,
  Opened = 1,
  ResolvedForClient = 2,
  ResolvedForFreelancer = 3
}

const enum MilestoneStatus {
  Pending = 0,
  Completed = 1,
  Approved = 2,
  Paid = 3
}

// Custom class to handle array storage
class U64ArrayWrapper implements Serializable {
  constructor(public values: Array<u64> = []) {}

  serialize(): StaticArray<u8> {
    const args = new Args();
    args.add(this.values.length as u32);
    for (let i = 0; i < this.values.length; i++) {
      args.add(this.values[i]);
    }
    return args.serialize();
  }

  deserialize(data: StaticArray<u8>, offset: i32 = 0): Result<i32> {
    const args = new Args(data, offset);
    const length = args.nextU32().expect("U64ArrayWrapper length missing");
    this.values = new Array<u64>();
    for (let i: u32 = 0; i < length; i++) {
      this.values.push(args.nextU64().expect("U64ArrayWrapper value missing"));
    }
    return new Result(args.offset);
  }
}

// Serializable Classes
class Project implements Serializable {
  constructor(
    public id: u64 = 0,
    public client: Address = new Address(),
    public freelancer: Address = new Address(),
    public title: string = '',
    public description: string = '',
    public budget: u64 = 0,
    public deadline: u64 = 0,
    public status: ProjectStatus = ProjectStatus.Open,
    public createdAt: u64 = 0,
    public category: string = '',
    public skills: string[] = []
  ) {}

  serialize(): StaticArray<u8> {
    const args = new Args();
    args.add(this.id);
    args.add(this.client);
    args.add(this.freelancer);
    args.add(this.title);
    args.add(this.description);
    args.add(this.budget);
    args.add(this.deadline);
    args.add(u8(this.status));
    args.add(this.createdAt);
    args.add(this.category);
    
    // Serialize skills array
    args.add(this.skills.length as u32);
    for (let i = 0; i < this.skills.length; i++) {
      args.add(this.skills[i]);
    }
    
    return args.serialize();
  }

  deserialize(data: StaticArray<u8>, offset: i32 = 0): Result<i32> {
    const args = new Args(data, offset);
    this.id = args.nextU64().expect("Project.id missing");
    this.client = args.nextSerializable<Address>().expect("Project.client missing");
    this.freelancer = args.nextSerializable<Address>().expect("Project.freelancer missing");
    this.title = args.nextString().expect("Project.title missing");
    this.description = args.nextString().expect("Project.description missing");
    this.budget = args.nextU64().expect("Project.budget missing");
    this.deadline = args.nextU64().expect("Project.deadline missing");
    
    const status = args.nextU8().expect("Project.status missing");
    assert(status <= u8(ProjectStatus.Disputed));
    this.status = status;
    
    this.createdAt = args.nextU64().expect("Project.createdAt missing");
    this.category = args.nextString().expect("Project.category missing");
    
    // Deserialize skills array
    const skillsLength = args.nextU32().expect("Project.skills length missing");
    this.skills = new Array<string>();
    for (let i: u32 = 0; i < skillsLength; i++) {
      this.skills.push(args.nextString().expect("Project.skill missing"));
    }
    
    return new Result(args.offset);
  }
}

class Milestone implements Serializable {
  constructor(
    public id: u64 = 0,
    public projectId: u64 = 0,
    public title: string = '',
    public description: string = '',
    public amount: u64 = 0,
    public deadline: u64 = 0,
    public status: MilestoneStatus = MilestoneStatus.Pending,
    public deliverables: string = '',
    public completedAt: u64 = 0,
    public paidAt: u64 = 0
  ) {}

  serialize(): StaticArray<u8> {
    const args = new Args();
    args.add(this.id);
    args.add(this.projectId);
    args.add(this.title);
    args.add(this.description);
    args.add(this.amount);
    args.add(this.deadline);
    args.add(u8(this.status));
    args.add(this.deliverables);
    args.add(this.completedAt);
    args.add(this.paidAt);
    return args.serialize();
  }

  deserialize(data: StaticArray<u8>, offset: i32 = 0): Result<i32> {
    const args = new Args(data, offset);
    this.id = args.nextU64().expect("Milestone.id missing");
    this.projectId = args.nextU64().expect("Milestone.projectId missing");
    this.title = args.nextString().expect("Milestone.title missing");
    this.description = args.nextString().expect("Milestone.description missing");
    this.amount = args.nextU64().expect("Milestone.amount missing");
    this.deadline = args.nextU64().expect("Milestone.deadline missing");
    
    const status = args.nextU8().expect("Milestone.status missing");
    assert(status <= u8(MilestoneStatus.Paid));
    this.status = status;
    
    this.deliverables = args.nextString().expect("Milestone.deliverables missing");
    this.completedAt = args.nextU64().expect("Milestone.completedAt missing");
    this.paidAt = args.nextU64().expect("Milestone.paidAt missing");
    return new Result(args.offset);
  }
}

class Rating implements Serializable {
  constructor(
    public id: u64 = 0,
    public from: Address = new Address(),
    public to: Address = new Address(),
    public projectId: u64 = 0,
    public score: u8 = 0,
    public comment: string = '',
    public timestamp: u64 = 0
  ) {}

  serialize(): StaticArray<u8> {
    const args = new Args();
    args.add(this.id);
    args.add(this.from);
    args.add(this.to);
    args.add(this.projectId);
    args.add(this.score);
    args.add(this.comment);
    args.add(this.timestamp);
    return args.serialize();
  }

  deserialize(data: StaticArray<u8>, offset: i32 = 0): Result<i32> {
    const args = new Args(data, offset);
    this.id = args.nextU64().expect("Rating.id missing");
    this.from = args.nextSerializable<Address>().expect("Rating.from missing");
    this.to = args.nextSerializable<Address>().expect("Rating.to missing");
    this.projectId = args.nextU64().expect("Rating.projectId missing");
    this.score = args.nextU8().expect("Rating.score missing");
    this.comment = args.nextString().expect("Rating.comment missing");
    this.timestamp = args.nextU64().expect("Rating.timestamp missing");
    return new Result(args.offset);
  }
}

class Dispute implements Serializable {
  constructor(
    public id: u64 = 0,
    public projectId: u64 = 0,
    public openedBy: Address = new Address(),
    public reason: string = '',
    public status: DisputeStatus = DisputeStatus.None,
    public openedAt: u64 = 0,
    public resolvedAt: u64 = 0,
    public resolvedBy: Address = new Address()
  ) {}

  serialize(): StaticArray<u8> {
    const args = new Args();
    args.add(this.id);
    args.add(this.projectId);
    args.add(this.openedBy);
    args.add(this.reason);
    args.add(u8(this.status));
    args.add(this.openedAt);
    args.add(this.resolvedAt);
    args.add(this.resolvedBy);
    return args.serialize();
  }

  deserialize(data: StaticArray<u8>, offset: i32 = 0): Result<i32> {
    const args = new Args(data, offset);
    this.id = args.nextU64().expect("Dispute.id missing");
    this.projectId = args.nextU64().expect("Dispute.projectId missing");
    this.openedBy = args.nextSerializable<Address>().expect("Dispute.openedBy missing");
    this.reason = args.nextString().expect("Dispute.reason missing");
    
    const status = args.nextU8().expect("Dispute.status missing");
    assert(status <= u8(DisputeStatus.ResolvedForFreelancer));
    this.status = status;
    
    this.openedAt = args.nextU64().expect("Dispute.openedAt missing");
    this.resolvedAt = args.nextU64().expect("Dispute.resolvedAt missing");
    this.resolvedBy = args.nextSerializable<Address>().expect("Dispute.resolvedBy missing");
    return new Result(args.offset);
  }
}

// Main Contract Functions
export function constructor(_args: StaticArray<u8>): void {
  assert(Context.isDeployingContract());
  setOwner(new Args().add(Context.caller()).serialize());
  
  // Initialize counters
  Storage.set(PROJECT_COUNTER_KEY, new Args().add(0 as u64).serialize());
  generateEvent("FreelancePlatform contract deployed");
}

/**
 * Create a new project
 */
export function createProject(args: StaticArray<u8>): StaticArray<u8> {
  const argsDeser = new Args(args);
  const title = argsDeser.nextString().expect("title required");
  const description = argsDeser.nextString().expect("description required");
  const budget = argsDeser.nextU64().expect("budget required");
  const deadline = argsDeser.nextU64().expect("deadline required");
  const category = argsDeser.nextString().expect("category required");
  
  // Handle skills array manually
  const skillsLength = argsDeser.nextU32().expect("skills length required");
  const skills: string[] = [];
  for (let i: u32 = 0; i < skillsLength; i++) {
    skills.push(argsDeser.nextString().expect("skill required"));
  }

  const client = Context.caller();
  
  // Get next project ID
  const projectCounterBytes = Storage.get(PROJECT_COUNTER_KEY);
  const projectCounter = new Args(projectCounterBytes).nextU64().unwrap();
  const newProjectId = projectCounter + 1;
  
  // Create project
  const project = new Project(
    newProjectId,
    client,
    new Address(), // empty freelancer initially
    title,
    description,
    budget,
    deadline,
    ProjectStatus.Open,
    Context.timestamp(),
    category,
    skills
  );
  
  // Save project
  const projectKey = PROJECT_PREFIX.concat(new Args().add(newProjectId).serialize());
  Storage.set(projectKey, project.serialize());
  
  // Update user's projects list using U64ArrayWrapper
  const userProjectsKey = USER_PROJECTS_PREFIX.concat(client.serialize());
  let existingProjects: U64ArrayWrapper;
  
  if (Storage.has(userProjectsKey)) {
    const existingData = Storage.get(userProjectsKey);
    existingProjects = new Args(existingData).nextSerializable<U64ArrayWrapper>().unwrap();
  } else {
    existingProjects = new U64ArrayWrapper();
  }
  
  existingProjects.values.push(newProjectId);
  Storage.set(userProjectsKey, existingProjects.serialize());
  
  // Update counter
  Storage.set(PROJECT_COUNTER_KEY, new Args().add(newProjectId).serialize());
  
  generateEvent(`Project ${newProjectId} created by ${client}`);
  return new Args().add(newProjectId).serialize();
}

/**
 * Apply for a project as freelancer
 */
export function applyForProject(args: StaticArray<u8>): void {
  const argsDeser = new Args(args);
  const projectId = argsDeser.nextU64().expect("projectId required");
  
  const freelancer = Context.caller();
  const project = getProject(projectId);
  
  assert(project.status == ProjectStatus.Open, "Project not open");
  assert(project.freelancer.toString() == new Address().toString(), "Project already has freelancer");
  
  project.freelancer = freelancer;
  project.status = ProjectStatus.InProgress;
  
  const projectKey = PROJECT_PREFIX.concat(new Args().add(projectId).serialize());
  Storage.set(projectKey, project.serialize());
  
  generateEvent(`Freelancer ${freelancer} applied for project ${projectId}`);
}

/**
 * Add milestone to project
 */
export function addMilestone(args: StaticArray<u8>): void {
  const argsDeser = new Args(args);
  const projectId = argsDeser.nextU64().expect("projectId required");
  const title = argsDeser.nextString().expect("title required");
  const description = argsDeser.nextString().expect("description required");
  const amount = argsDeser.nextU64().expect("amount required");
  const deadline = argsDeser.nextU64().expect("deadline required");
  
  const caller = Context.caller();
  const project = getProject(projectId);
  
  assert(project.client.equals(caller), "Only client can add milestones");
  assert(project.status == ProjectStatus.InProgress, "Project not in progress");
  
  const milestoneId = getNextMilestoneId(projectId);
  const milestone = new Milestone(
    milestoneId,
    projectId,
    title,
    description,
    amount,
    deadline
  );
  
  const milestoneKey = MILESTONE_PREFIX.concat(new Args().add(projectId).add(milestoneId).serialize());
  Storage.set(milestoneKey, milestone.serialize());
  
  generateEvent(`Milestone ${milestoneId} added to project ${projectId}`);
}

/**
 * Complete a milestone
 */
export function completeMilestone(args: StaticArray<u8>): void {
  const argsDeser = new Args(args);
  const projectId = argsDeser.nextU64().expect("projectId required");
  const milestoneId = argsDeser.nextU64().expect("milestoneId required");
  const deliverables = argsDeser.nextString().expect("deliverables required");
  
  const caller = Context.caller();
  const project = getProject(projectId);
  const milestone = getMilestone(projectId, milestoneId);
  
  assert(project.freelancer.equals(caller), "Only freelancer can complete milestones");
  assert(milestone.status == MilestoneStatus.Pending, "Milestone already completed");
  
  milestone.status = MilestoneStatus.Completed;
  milestone.deliverables = deliverables;
  milestone.completedAt = Context.timestamp();
  
  const milestoneKey = MILESTONE_PREFIX.concat(new Args().add(projectId).add(milestoneId).serialize());
  Storage.set(milestoneKey, milestone.serialize());
  
  generateEvent(`Milestone ${milestoneId} completed for project ${projectId}`);
}

/**
 * Approve and pay milestone
 */
export function approveMilestone(args: StaticArray<u8>): void {
  const argsDeser = new Args(args);
  const projectId = argsDeser.nextU64().expect("projectId required");
  const milestoneId = argsDeser.nextU64().expect("milestoneId required");
  
  const caller = Context.caller();
  const project = getProject(projectId);
  const milestone = getMilestone(projectId, milestoneId);
  
  assert(project.client.equals(caller), "Only client can approve milestones");
  assert(milestone.status == MilestoneStatus.Completed, "Milestone not completed");
  
  // Transfer funds to freelancer (2% platform fee)
  const platformFee = milestone.amount * 2 / 100;
  const freelancerAmount = milestone.amount - platformFee;
  
  //  token transfers
  // transferCoins(project.freelancer, freelancerAmount);
  
  milestone.status = MilestoneStatus.Paid;
  milestone.paidAt = Context.timestamp();
  
  const milestoneKey = MILESTONE_PREFIX.concat(new Args().add(projectId).add(milestoneId).serialize());
  Storage.set(milestoneKey, milestone.serialize());
  
  generateEvent(`Milestone ${milestoneId} paid: ${freelancerAmount} to freelancer, ${platformFee} platform fee`);
}

/**
 * Add rating after project completion
 */
export function addRating(args: StaticArray<u8>): void {
  const argsDeser = new Args(args);
  const projectId = argsDeser.nextU64().expect("projectId required");
  const to = argsDeser.nextSerializable<Address>().expect("to address required");
  const score = argsDeser.nextU8().expect("score required");
  const comment = argsDeser.nextString().expect("comment required");
  
  const from = Context.caller();
  const project = getProject(projectId);
  
  assert(project.status == ProjectStatus.Completed, "Project not completed");
  assert(from.equals(project.client) || from.equals(project.freelancer), "Not a project participant");
  assert(score >= 1 && score <= 5, "Rating must be 1-5");
  
  const ratingId = Context.timestamp(); //  timestamp as unique ID
  const rating = new Rating(
    ratingId,
    from,
    to,
    projectId,
    score,
    comment,
    Context.timestamp()
  );
  
  const ratingKey = RATING_PREFIX.concat(new Args().add(to).add(ratingId).serialize());
  Storage.set(ratingKey, rating.serialize());
  
  generateEvent(`Rating ${score} added for ${to} on project ${projectId}`);
}

// View functions
export function getProjectView(args: StaticArray<u8>): StaticArray<u8> {
  const argsDeser = new Args(args);
  const projectId = argsDeser.nextU64().expect("projectId required");
  const project = getProject(projectId);
  return project.serialize();
}

export function getProjectsByUser(args: StaticArray<u8>): StaticArray<u8> {
  const argsDeser = new Args(args);
  const user = argsDeser.nextSerializable<Address>().expect("user address required");
  
  const userProjectsKey = USER_PROJECTS_PREFIX.concat(user.serialize());
  if (!Storage.has(userProjectsKey)) {
    return new Args().addSerializableObjectArray(new Array<Project>()).serialize();
  }
  
  const existingData = Storage.get(userProjectsKey);
  const projectIdsWrapper = new Args(existingData).nextSerializable<U64ArrayWrapper>().unwrap();
  const projects = new Array<Project>();
  
  for (let i = 0; i < projectIdsWrapper.values.length; i++) {
    const project = getProject(projectIdsWrapper.values[i]);
    projects.push(project);
  }
  
  return new Args().addSerializableObjectArray(projects).serialize();
}

export function getOpenProjects(_args: StaticArray<u8>): StaticArray<u8> {
  const allProjects = getAllProjects();
  const openProjects = new Array<Project>();
  
  for (let i = 0; i < allProjects.length; i++) {
    if (allProjects[i].status == ProjectStatus.Open) {
      openProjects.push(allProjects[i]);
    }
  }
  
  return new Args().addSerializableObjectArray(openProjects).serialize();
}

// Helper functions
function getProject(projectId: u64): Project {
  const projectKey = PROJECT_PREFIX.concat(new Args().add(projectId).serialize());
  assert(Storage.has(projectKey), "Project not found");
  const projectBytes = Storage.get(projectKey);
  return new Args(projectBytes).nextSerializable<Project>().unwrap();
}

function getMilestone(projectId: u64, milestoneId: u64): Milestone {
  const milestoneKey = MILESTONE_PREFIX.concat(new Args().add(projectId).add(milestoneId).serialize());
  assert(Storage.has(milestoneKey), "Milestone not found");
  const milestoneBytes = Storage.get(milestoneKey);
  return new Args(milestoneBytes).nextSerializable<Milestone>().unwrap();
}

function getNextMilestoneId(projectId: u64): u64 {
  //  proper counter later
  return Context.timestamp();
}

function getAllProjects(): Array<Project> {
  const projectKeys = Storage.getKeys(PROJECT_PREFIX);
  const projects = new Array<Project>();
  
  for (let i = 0; i < projectKeys.length; i++) {
    const projectBytes = Storage.get(projectKeys[i]);
    const project = new Args(projectBytes).nextSerializable<Project>().unwrap();
    projects.push(project);
  }
  
  return projects;
}