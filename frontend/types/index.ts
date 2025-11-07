export interface FabricInventory {
  id?: string;
  fabricCode: string;
  fabricDesign: string;
  width: number;
  lotNumber: string;
  inwardDate: Date;
  rollNumber: number;
  quantity: number;
  location: string;
  colorCategory: string;
  status: 'active' | 'consumed';
  remainingQuantity: number;
}

export interface FabricMovement {
  id?: string;
  rollId: string;
  movementType: 'inward' | 'outward';
  quantity: number;
  date: Date;
  relatedJobCard?: string;
  notes?: string;
}

export interface DyeingOrder {
  id?: string;
  orderNumber: string;
  date: Date;
  fabricCode: string;
  fabricType: string;
  width: number;
  quantity: number;
  color: string;
  dyeingHouse: string;
  location: string;
  received: boolean;
}

export interface JobCardSpec {
  slNo: number;
  drop: string;
  ready: string;
  width: string;
  setPieces: string;
  meters: string;
  notes: string;
}

export interface JobCard {
  id?: string;
  jobCardNumber: string;
  poNumber: string;
  customerName: string;
  issuedOn: Date;
  delivery: Date;
  fabricCode: string;
  fabricDesign: string;
  fabricWidth: number;
  specifications: JobCardSpec[];
  totalSets: number;
  hangingMechanism: string;
  sideFold: string;
  velcroQuantity: number;
  velcroColour: string;
  otherSpecs: string;
  otherComments: string;
  completedOn?: Date;
  approvedBy: string;
  currentStage: number;
  stageStatus: StageStatus[];
}

export interface StageStatus {
  stage: number;
  name: string;
  completed: boolean;
  completedDate?: Date;
}

export interface StitchingSpec {
  slNo: number;
  drop: string;
  ready: string;
  width: string;
  pieces: string;
  receipt: string;
  stitchingSpecification: string;
}

export interface StitchingWorkOrder {
  id?: string;
  workOrderNumber: string;
  referenceJobCardId: string;
  referenceJobCardNumber: string;
  issuedOn: Date;
  issuedTo: string;
  fabricColour: string;
  specifications: StitchingSpec[];
  otherComments: string;
  completedOn?: Date;
  total: number;
}
