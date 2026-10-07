export type UserRole = 'CLUB_MANAGER' | 'OWNER' | 'VET';
export type ProfileStatus = 'DRAFT' | 'PENDING_EXAM' | 'PENDING_COMPLETION' | 'RECEIVED' | 'ARCHIVED';
export type HealthStatus = 'NOT_ASSESSED' | 'ELIGIBLE' | 'MONITORING' | 'INJURED' | 'ISOLATION';
export type Sex = 'MALE' | 'FEMALE' | 'GELDING';

export interface User {
  id: string;
  clubId: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
  role: UserRole;
  isActive: boolean;
}

export interface Intake {
  receivedDate?: string;
  handoverNotes?: string;
  assignedVetId?: string;
  examinationStatus?: string;
  completedAt?: string;
  completedBy?: string;
  handoverDocuments?: Array<{ id?: string; fileName?: string; name?: string }>;
  intakeDate?: string;
  intakeNotes?: string;
}

export interface OwnershipRecord {
  id: string;
  ownerUserId: string;
  effectiveFrom: string;
  effectiveTo?: string;
  notes?: string;
}

export interface Examination {
  id?: string;
  examDate?: string;
  examinedAt?: string;
  vetId?: string;
  weightKg?: number;
  heightCm?: number;
  symptoms?: string;
  diagnosis?: string;
  treatment?: string;
  treatmentPlan?: string;
  conclusion?: string;
  healthStatus?: HealthStatus;
  assessmentPurpose?: string;
  purpose?: string;
  movementRestrictions?: string;
  exerciseRestrictions?: string;
  followUpDate?: string;
  createdAt?: string;
  createdBy?: string;
  status?: 'DRAFT' | 'FINALIZED' | string;
  isFinalized?: boolean;
}

export interface HealthAssessment {
  examinationId?: string;
  vetId?: string;
  healthStatus?: HealthStatus;
  purpose?: string;
  conclusion?: string;
  exerciseRestrictions?: string;
  followUpDate?: string;
  finalizedAt?: string;
  updatedAt?: string;
  weightKg?: number;
  heightCm?: number;
  observations?: string;
  diagnosis?: string;
  treatment?: string;
  treatmentPlan?: string;
  status?: HealthStatus;
  movementRestrictions?: string;
}

export interface MedicalRecord {
  id: string;
  recordType: string;
  createdAt: string;
  summary: string;
  ownerVisible?: boolean;
  createdBy?: string;
}

export interface Vaccination {
  id: string;
  name: string;
  vaccinationDate: string;
  reminderDate?: string;
  batchNumber?: string;
  notes?: string;
}

export interface HorseDocument {
  id: string;
  category: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  fileUrl: string;
  ownerVisible: boolean;
  uploadedBy: string;
  createdAt: string;
  relatedRecordId?: string;
}

export interface CorrectionRequest {
  id: string;
  requestedBy: string;
  horseId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason: string;
  evidenceDocumentIds: string[];
  changes: Array<{ field: string; oldValue: string; newValue: string }>;
  createdAt: string;
  rejectionReason?: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  action: string;
  createdAt: string;
  summary?: string;
  description?: string;
}

export interface Horse {
  id: string;
  clubId: string;
  code: string;
  name: string;
  breed: string;
  dateOfBirth: string;
  sex: Sex;
  coatColor: string;
  registrationNumber: string;
  microchipNumber: string;
  sireId?: string;
  damId?: string;
  ownerUserId?: string;
  profileStatus: ProfileStatus;
  healthStatus: HealthStatus;
  archiveReason?: string;
  createdAt: string;
  updatedAt: string;
  intake?: Intake;
  healthAssessment?: HealthAssessment;
  ownershipHistory?: OwnershipRecord[];
  examinations?: Examination[];
  medicalRecords?: MedicalRecord[];
  vaccinations?: Vaccination[];
  documents?: HorseDocument[];
  correctionRequests?: CorrectionRequest[];
  auditLogs?: AuditLog[];
}
