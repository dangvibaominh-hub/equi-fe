import type { Examination, Horse, User } from '../types';
import { apiGet, apiPost, apiPut } from './apiClient';

export async function getHorses(): Promise<Horse[]> {
  return apiGet<Horse[]>('/horses');
}

export async function getHorseById(horseId: string): Promise<Horse> {
  return apiGet<Horse>(`/horses/${horseId}`);
}

export async function createHorse(payload: Partial<Horse>): Promise<Horse> {
  return apiPost<Horse>('/horses', payload);
}

export async function updateHorse(horseId: string, payload: Partial<Horse>): Promise<Horse> {
  return apiPut<Horse>(`/horses/${horseId}`, payload);
}

export interface ExaminationInput {
  examinedAt: string;
  weightKg?: number;
  heightCm?: number;
  symptoms: string;
  diagnosis: string;
  treatmentPlan: string;
  conclusion: string;
  healthStatus: Horse['healthStatus'];
  purpose: string;
  exerciseRestrictions: string;
  followUpDate: string;
}

type HorseApiRecord = Horse & Record<string, unknown>;
type HorseInputRecord = Partial<Horse> & {
  receivedDate?: unknown;
  assignedVetId?: unknown;
  examinationStatus?: unknown;
  handoverNotes?: unknown;
  completedAt?: unknown;
  completedBy?: unknown;
};

async function getLatestHorse(horseId: string): Promise<HorseApiRecord> {
  const response = await apiGet<HorseApiRecord>(`/horses/${horseId}`);
  return { ...response, ...normalizeHorse(response) };
}

async function putHorsePreservingData(horse: HorseApiRecord, updates: Partial<Horse>): Promise<Horse> {
  const payload: HorseApiRecord = { ...horse, ...updates };
  const {
    registrationStatus: _registrationStatus,
    currentHealthStatus: _currentHealthStatus,
    horseId: _horseId,
    horseName: _horseName,
    ownerId: _ownerId,
    gender: _gender,
    ...canonicalPayload
  } = payload;
  const response = await updateHorse(horse.id, canonicalPayload);
  return normalizeHorse(response);
}

function toExamination(input: ExaminationInput, vetId: string, status: 'DRAFT' | 'FINALIZED', existing?: Examination): Examination {
  const now = new Date().toISOString();
  return {
    ...existing,
    id: existing?.id ?? `exam-${now.replace(/\D/g, '')}`,
    examinedAt: input.examinedAt,
    vetId,
    weightKg: input.weightKg,
    heightCm: input.heightCm,
    symptoms: input.symptoms,
    diagnosis: input.diagnosis,
    treatmentPlan: input.treatmentPlan,
    conclusion: input.conclusion,
    healthStatus: input.healthStatus,
    purpose: input.purpose,
    exerciseRestrictions: input.exerciseRestrictions,
    followUpDate: input.followUpDate || undefined,
    status,
    createdAt: existing?.createdAt ?? now,
    createdBy: vetId,
  };
}

export async function saveExaminationDraft(horseId: string, vet: User, input: ExaminationInput): Promise<Horse> {
  const horse = await getLatestHorse(horseId);
  if (horse.profileStatus === 'ARCHIVED') throw new Error('Không thể lưu phiếu khám cho hồ sơ đã lưu trữ.');

  const examinations = [...(horse.examinations ?? [])];
  const existingIndex = examinations.findIndex((item) => item.status === 'DRAFT' && item.vetId === vet.id);
  const draft = toExamination(input, vet.id, 'DRAFT', existingIndex >= 0 ? examinations[existingIndex] : undefined);
  if (existingIndex >= 0) examinations[existingIndex] = draft;
  else examinations.push(draft);

  return putHorsePreservingData(horse, { examinations });
}

export async function finalizeExamination(horseId: string, vet: User, input: ExaminationInput): Promise<Horse> {
  const horse = await getLatestHorse(horseId);
  if (horse.profileStatus === 'ARCHIVED') throw new Error('Không thể chốt khám cho hồ sơ đã lưu trữ.');
  if (horse.intake?.assignedVetId !== vet.id || horse.clubId !== vet.clubId) {
    throw new Error('Tài khoản Vet hiện tại không được phân công cho ngựa này.');
  }

  const now = new Date().toISOString();
  const examinations = [...(horse.examinations ?? [])];
  const draftIndex = examinations.findIndex((item) => item.status === 'DRAFT' && item.vetId === vet.id);
  const finalized = toExamination(input, vet.id, 'FINALIZED', draftIndex >= 0 ? examinations[draftIndex] : undefined);
  if (draftIndex >= 0) examinations[draftIndex] = finalized;
  else examinations.push(finalized);

  const isInitialIntake = horse.profileStatus === 'PENDING_EXAM';
  const intake = {
    ...(horse.intake ?? {}),
    ...(isInitialIntake ? { examinationStatus: 'COMPLETED' } : {}),
  };
  const auditLogs = [
    ...(horse.auditLogs ?? []),
    {
      id: `log-${now.replace(/\D/g, '')}`,
      actorId: vet.id,
      action: isInitialIntake ? 'FINALIZE_INTAKE_EXAMINATION' : 'FINALIZE_FOLLOW_UP_EXAMINATION',
      summary: isInitialIntake ? 'Chốt kết luận khám đầu vào' : 'Chốt kết luận khám theo dõi',
      createdAt: now,
    },
  ];

  return putHorsePreservingData(horse, {
    examinations,
    healthAssessment: {
      ...(horse.healthAssessment ?? {}),
      examinationId: finalized.id,
      vetId: vet.id,
      healthStatus: input.healthStatus,
      purpose: input.purpose,
      conclusion: input.conclusion,
      exerciseRestrictions: input.exerciseRestrictions,
      followUpDate: input.followUpDate || undefined,
      finalizedAt: now,
      updatedAt: now,
      weightKg: input.weightKg,
      heightCm: input.heightCm,
      observations: input.symptoms,
      diagnosis: input.diagnosis,
      treatmentPlan: input.treatmentPlan,
    },
    healthStatus: input.healthStatus,
    intake,
    profileStatus: isInitialIntake ? 'PENDING_COMPLETION' : horse.profileStatus,
    updatedAt: now,
    auditLogs,
  });
}

export async function completeHorseIntake(horseId: string, managerId: string): Promise<Horse> {
  const horse = await getLatestHorse(horseId);
  if (horse.profileStatus !== 'PENDING_COMPLETION') {
    throw new Error('Chỉ hồ sơ đang chờ hoàn tất mới được tiếp nhận.');
  }
  if (horse.healthAssessment?.healthStatus !== 'ELIGIBLE') {
    throw new Error('Theo chính sách tiếp nhận, hồ sơ cần có kết luận đủ điều kiện.');
  }

  const now = new Date().toISOString();
  return putHorsePreservingData(horse, {
    profileStatus: 'RECEIVED',
    intake: {
      ...(horse.intake ?? {}),
      completedAt: now,
      completedBy: managerId,
    },
    updatedAt: now,
    auditLogs: [
      ...(horse.auditLogs ?? []),
      {
        id: `log-${now.replace(/\D/g, '')}`,
        actorId: managerId,
        action: 'COMPLETE_INTAKE',
        summary: 'Manager hoàn tất tiếp nhận ngựa',
        createdAt: now,
      },
    ],
  });
}

export function isHorseAssignedToVet(horse: Horse, user: User | null | undefined): boolean {
  return user?.role === 'VET'
    && String(horse.clubId) === String(user.clubId)
    && String(horse.intake?.assignedVetId ?? '') === String(user.id);
}

export function normalizeHorse(record: HorseInputRecord): Horse {
  const horseId = String(record.id ?? '');
  const ownerUserId = String(record.ownerUserId ?? '');
  const profileStatus = String(record.profileStatus ?? 'DRAFT');
  const healthStatus = String(record.healthStatus ?? 'NOT_ASSESSED');
  const sexValue = String(record.sex ?? 'MALE');

  const intakeRecord = (record.intake as Horse['intake'] | undefined) ?? {
    receivedDate: record.receivedDate ? String(record.receivedDate) : undefined,
    assignedVetId: record.assignedVetId ? String(record.assignedVetId) : undefined,
    examinationStatus: record.examinationStatus ? String(record.examinationStatus) : undefined,
    handoverNotes: record.handoverNotes ? String(record.handoverNotes) : undefined,
    completedAt: record.completedAt ? String(record.completedAt) : undefined,
    completedBy: record.completedBy ? String(record.completedBy) : undefined,
  };
  const intake = {
    ...intakeRecord,
    assignedVetId: intakeRecord.assignedVetId ? String(intakeRecord.assignedVetId) : undefined,
  };

  return {
    id: horseId,
    clubId: String(record.clubId ?? ''),
    code: String(record.code ?? horseId),
    name: String(record.name ?? 'Chưa có tên'),
    breed: String(record.breed ?? ''),
    dateOfBirth: String(record.dateOfBirth ?? ''),
    sex: (sexValue.toUpperCase() as Horse['sex']) || 'MALE',
    coatColor: String(record.coatColor ?? ''),
    registrationNumber: String(record.registrationNumber ?? ''),
    microchipNumber: String(record.microchipNumber ?? ''),
    sireId: record.sireId ? String(record.sireId) : undefined,
    damId: record.damId ? String(record.damId) : undefined,
    ownerUserId: ownerUserId || undefined,
    profileStatus: (profileStatus.toUpperCase() as Horse['profileStatus']) || 'DRAFT',
    healthStatus: (healthStatus.toUpperCase() as Horse['healthStatus']) || 'NOT_ASSESSED',
    archiveReason: record.archiveReason ? String(record.archiveReason) : undefined,
    createdAt: String(record.createdAt ?? new Date().toISOString()),
    updatedAt: String(record.updatedAt ?? record.createdAt ?? new Date().toISOString()),
    intake,
    healthAssessment: (record.healthAssessment as Horse['healthAssessment']) ?? undefined,
    ownershipHistory: Array.isArray(record.ownershipHistory) ? (record.ownershipHistory as Horse['ownershipHistory']) : [],
    examinations: Array.isArray(record.examinations) ? (record.examinations as Horse['examinations']) : [],
    medicalRecords: Array.isArray(record.medicalRecords) ? (record.medicalRecords as Horse['medicalRecords']) : [],
    vaccinations: Array.isArray(record.vaccinations) ? (record.vaccinations as Horse['vaccinations']) : [],
    documents: Array.isArray(record.documents) ? (record.documents as Horse['documents']) : [],
    correctionRequests: Array.isArray(record.correctionRequests) ? (record.correctionRequests as Horse['correctionRequests']) : [],
    auditLogs: Array.isArray(record.auditLogs) ? (record.auditLogs as Horse['auditLogs']) : [],
  };
}

export function normalizeUser(record: Partial<User> & Record<string, unknown>): User & { ownerId?: string } {
  const normalizedRole = (String(record.role ?? 'OWNER').toUpperCase() as User['role']) || 'OWNER';
  const idValue = String(record.id ?? '');

  return {
    id: idValue,
    clubId: String(record.clubId ?? ''),
    fullName: String(record.fullName ?? ''),
    email: String(record.email ?? ''),
    phone: String(record.phone ?? ''),
    address: String(record.address ?? ''),
    createdAt: String(record.createdAt ?? new Date().toISOString()),
    role: normalizedRole,
    isActive: typeof record.isActive === 'boolean' ? record.isActive : true,
    ownerId: idValue,
  };
}
