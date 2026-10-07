import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import type { ExaminationInput } from '../../api/horseApi';
import type { Horse, User } from '../../types';

const healthStatuses: Horse['healthStatus'][] = ['NOT_ASSESSED', 'ELIGIBLE', 'MONITORING', 'INJURED', 'ISOLATION'];
const healthStatusLabels: Record<Horse['healthStatus'], string> = {
  NOT_ASSESSED: 'Chưa đánh giá',
  ELIGIBLE: 'Đủ điều kiện',
  MONITORING: 'Theo dõi',
  INJURED: 'Chấn thương',
  ISOLATION: 'Cách ly',
};

interface PostExamStatusProps {
  horse: Horse;
  currentUser: User;
  owner?: User;
  onSaveDraft: (horseId: string, vet: User, input: ExaminationInput) => Promise<Horse>;
  onFinalize: (horseId: string, vet: User, input: ExaminationInput) => Promise<Horse>;
  onHorseSaved: (horse: Horse) => void;
}

function getInitialForm(horse: Horse, vetId: string): ExaminationInput {
  const existing = [...(horse.examinations ?? [])].reverse().find(
    (item) => item.vetId === vetId && (item.status === 'DRAFT' || item.status === 'FINALIZED'),
  );
  const assessment = horse.healthAssessment;
  const date = existing?.examinedAt ?? new Date().toISOString().slice(0, 10);

  return {
    examinedAt: date.slice(0, 10),
    weightKg: existing?.weightKg ?? assessment?.weightKg,
    heightCm: existing?.heightCm ?? assessment?.heightCm,
    symptoms: existing?.symptoms ?? assessment?.observations ?? '',
    diagnosis: existing?.diagnosis ?? assessment?.diagnosis ?? '',
    treatmentPlan: existing?.treatmentPlan ?? assessment?.treatmentPlan ?? '',
    conclusion: existing?.conclusion ?? assessment?.conclusion ?? '',
    healthStatus: existing?.healthStatus ?? horse.healthStatus,
    purpose: existing?.purpose ?? assessment?.purpose ?? (horse.profileStatus === 'PENDING_EXAM' ? 'INTAKE' : 'FOLLOW_UP'),
    exerciseRestrictions: existing?.exerciseRestrictions ?? assessment?.exerciseRestrictions ?? '',
    followUpDate: existing?.followUpDate ?? assessment?.followUpDate ?? '',
  };
}

function PostExamStatus({ horse, currentUser, owner, onSaveDraft, onFinalize, onHorseSaved }: PostExamStatusProps) {
  const [form, setForm] = useState<ExaminationInput>(() => getInitialForm(horse, currentUser.id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const isInitialIntake = horse.profileStatus === 'PENDING_EXAM';
  const profilePath = `/vet/horses/${horse.id}`;

  function updateField<K extends keyof ExaminationInput>(key: K, value: ExaminationInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function validateFinalization(): string | null {
    if (!form.examinedAt || Number.isNaN(Date.parse(form.examinedAt))) return 'Vui lòng nhập ngày khám hợp lệ.';
    if (new Date(form.examinedAt) > new Date()) return 'Ngày khám không được ở tương lai.';
    if (!form.healthStatus || form.healthStatus === 'NOT_ASSESSED') return 'Vui lòng chọn trạng thái sức khỏe kết luận.';
    if (!form.purpose.trim()) return 'Vui lòng nhập mục đích đánh giá.';
    if (!form.conclusion.trim()) return 'Vui lòng nhập kết luận khám.';
    return null;
  }

  async function handleSaveDraft() {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const savedHorse = await onSaveDraft(horse.id, currentUser, form);
      onHorseSaved(savedHorse);
      setMessage('Đã lưu phiếu khám ở trạng thái nháp. Trạng thái hồ sơ và kết luận chính thức chưa thay đổi.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Không thể lưu phiếu khám nháp.');
    } finally {
      setSaving(false);
    }
  }

  async function handleFinalize(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationMessage = validateFinalization();
    if (validationMessage) {
      setError(validationMessage);
      setMessage('');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');
    try {
      const savedHorse = await onFinalize(horse.id, currentUser, {
        ...form,
        symptoms: form.symptoms.trim(),
        diagnosis: form.diagnosis.trim(),
        treatmentPlan: form.treatmentPlan.trim(),
        conclusion: form.conclusion.trim(),
        purpose: form.purpose.trim(),
        exerciseRestrictions: form.exerciseRestrictions.trim(),
      });
      onHorseSaved(savedHorse);
      setMessage(isInitialIntake
        ? 'Đã chốt khám đầu vào. Hồ sơ đang chờ Manager hoàn tất tiếp nhận.'
        : 'Đã chốt kết luận khám theo dõi.');
    } catch (finalizeError) {
      setError(finalizeError instanceof Error ? finalizeError.message : 'Không thể chốt kết luận khám.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="page-content narrow-content">
      <div className="breadcrumb"><Link to={profilePath}>Hồ sơ ngựa</Link><span aria-hidden="true">/</span><span>Phiếu khám</span></div>
      <header className="page-heading">
        <div>
          <p className="eyebrow">BÁC SĨ THÚ Y · {isInitialIntake ? 'KHÁM ĐẦU VÀO' : 'KHÁM THEO DÕI'}</p>
          <h1>{horse.name}</h1>
          <p>Mã ngựa #{horse.code || horse.id} · {horse.breed} · Chủ sở hữu: {owner?.fullName || 'Chưa có thông tin'}</p>
        </div>
      </header>
      <section className="horse-context-card">
        <div><h2>{horse.name}</h2><p>Trạng thái hồ sơ: {horse.profileStatus}</p></div>
        <StatusBadge status={horse.healthStatus} label={healthStatusLabels[horse.healthStatus]} type="health" />
      </section>
      {error && <div className="alert-banner" role="alert" style={{ marginTop: 16, background: '#fff4f4', color: '#7a1d1d', border: '1px solid #f7c2c2', borderRadius: 8, padding: '10px 12px' }}>{error}</div>}
      {message && <p className="success-message" role="status">{message}</p>}
      <section className="panel form-panel post-exam-form-panel">
        <h2>Phiếu khám</h2>
        <form onSubmit={handleFinalize}>
          <label className="form-field"><span>Ngày khám</span><input type="date" required value={form.examinedAt} onChange={(event) => updateField('examinedAt', event.target.value)} /></label>
          <div className="horse-form-grid">
            <label className="form-field"><span>Cân nặng (kg)</span><input type="number" min="0" step="0.1" value={form.weightKg ?? ''} onChange={(event) => updateField('weightKg', event.target.value ? Number(event.target.value) : undefined)} /></label>
            <label className="form-field"><span>Chiều cao (cm)</span><input type="number" min="0" step="0.1" value={form.heightCm ?? ''} onChange={(event) => updateField('heightCm', event.target.value ? Number(event.target.value) : undefined)} /></label>
          </div>
          <label className="form-field"><span>Triệu chứng</span><textarea rows={3} value={form.symptoms} onChange={(event) => updateField('symptoms', event.target.value)} /></label>
          <label className="form-field"><span>Chẩn đoán</span><textarea rows={3} value={form.diagnosis} onChange={(event) => updateField('diagnosis', event.target.value)} /></label>
          <label className="form-field"><span>Xử trí</span><textarea rows={3} value={form.treatmentPlan} onChange={(event) => updateField('treatmentPlan', event.target.value)} /></label>
          <label className="form-field"><span>Kết luận</span><textarea rows={3} required value={form.conclusion} onChange={(event) => updateField('conclusion', event.target.value)} /></label>
          <div className="horse-form-grid">
            <label className="form-field"><span>Trạng thái sức khỏe kết luận</span><select required value={form.healthStatus} onChange={(event) => updateField('healthStatus', event.target.value as Horse['healthStatus'])}><option value="">Chọn trạng thái</option>{healthStatuses.filter((status) => status !== 'NOT_ASSESSED').map((status) => <option key={status} value={status}>{healthStatusLabels[status]}</option>)}</select></label>
            <label className="form-field"><span>Mục đích đánh giá</span><input required value={form.purpose} onChange={(event) => updateField('purpose', event.target.value)} /></label>
          </div>
          <label className="form-field"><span>Hạn chế vận động</span><textarea rows={2} value={form.exerciseRestrictions} onChange={(event) => updateField('exerciseRestrictions', event.target.value)} /></label>
          <label className="form-field"><span>Ngày tái khám</span><input type="date" value={form.followUpDate} onChange={(event) => updateField('followUpDate', event.target.value)} /></label>
          <div className="form-actions">
            <button className="button button-secondary" type="button" disabled={saving} onClick={() => void handleSaveDraft()}>{saving ? 'Đang lưu...' : 'Lưu nháp'}</button>
            <button className="button" type="submit" disabled={saving}>{saving ? 'Đang lưu...' : 'Chốt kết luận'}</button>
            <Link className="button button-secondary" to={profilePath}>Quay lại hồ sơ</Link>
          </div>
        </form>
      </section>
    </main>
  );
}

export default PostExamStatus;
