import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import StatusBadge from '../../components/common/StatusBadge.jsx'

function CompleteIntake({ horses, horse: horseOverride, archiveRecord, onUpdateHorse, onCompleteIntake, onArchiveHorse, users = [], currentUser }) {
  const { horseId } = useParams()
  const horse = horseOverride ?? horses.find((item) => String(item.id) === String(horseId))
  const [receivedDate, setReceivedDate] = useState(horse?.intake?.receivedDate || new Date().toISOString().slice(0, 10))
  const [assignedVetId, setAssignedVetId] = useState(horse?.intake?.assignedVetId || '')
  const [handoverNotes, setHandoverNotes] = useState(horse?.intake?.handoverNotes || '')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [archiveReason, setArchiveReason] = useState(archiveRecord?.reason || '')
  const [confirmArchive, setConfirmArchive] = useState(false)

  const vetOptions = useMemo(() => users.filter((user) => user.role === 'VET'), [users])
  const ownerLinked = users.some((user) => user.role === 'OWNER' && user.id === horse?.ownerUserId && user.clubId === horse?.clubId)
  const identityComplete = Boolean(horse?.name.trim() && horse.breed.trim() && horse.dateOfBirth && horse.sex)
  const eligibleByPolicy = horse?.healthAssessment?.healthStatus === 'ELIGIBLE'
  const canComplete = horse?.profileStatus === 'PENDING_COMPLETION' && identityComplete && ownerLinked && eligibleByPolicy
  const canAssignVet = horse?.profileStatus !== 'RECEIVED'
    && horse?.profileStatus !== 'ARCHIVED'
    && horse?.profileStatus !== 'PENDING_COMPLETION'
    && horse?.intake?.examinationStatus !== 'COMPLETED'

  if (!horse) {
    return <main className="page-content"><section className="panel"><h1>Không tìm thấy ngựa</h1><Link to="/manager/horses">Quay lại danh sách ngựa</Link></section></main>
  }

  async function saveAssignment() {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await onUpdateHorse(horse.id, {
      intake: {
        ...(horse.intake ?? {}),
        receivedDate,
        assignedVetId,
        handoverNotes,
        examinationStatus: horse.intake?.examinationStatus || 'PENDING',
      },
      profileStatus: horse.profileStatus === 'DRAFT' ? 'PENDING_EXAM' : horse.profileStatus,
      updatedAt: new Date().toISOString(),
      auditLogs: [
        ...(horse.auditLogs ?? []),
        { id: `log-${Date.now()}`, actorId: currentUser?.id ?? '', action: 'ASSIGN_VET', description: 'Phân công Vet và tiếp nhận ngựa', createdAt: new Date().toISOString() },
      ],
      })
      setMessage('Đã lưu thông tin tiếp nhận và phân công Vet.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Không thể lưu thông tin tiếp nhận.')
    } finally {
      setSaving(false)
    }
  }

  async function completeIntake() {
    if (!canComplete || !currentUser?.id) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await onCompleteIntake(horse.id, currentUser.id)
      setMessage('Đã hoàn tất tiếp nhận. Trạng thái hồ sơ đã chuyển sang Đã tiếp nhận.')
    } catch (completeError) {
      setError(completeError instanceof Error ? completeError.message : 'Không thể hoàn tất tiếp nhận.')
    } finally {
      setSaving(false)
    }
  }

  function archiveHorse(event) {
    event.preventDefault()
    if (!archiveReason.trim()) return
    onArchiveHorse(horse.id, archiveReason)
    setArchiveReason('')
    setConfirmArchive(false)
    setMessage('Hồ sơ đã được lưu trữ.')
  }

  return (
    <main className="page-content">
      <div className="breadcrumb"><Link to={`/horses/${horse.id}`}>Hồ sơ ngựa</Link><span aria-hidden="true">/</span><span>Tiếp nhận / Phân công Vet</span></div>
      <header className="page-heading"><div><p className="eyebrow">QUẢN LÝ CÂU LẠC BỘ · TIẾP NHẬN</p><h1>Tiếp nhận và phân công Vet</h1><p>Ghi nhận ngày tiếp nhận, chú thích bàn giao và chỉ định bác sĩ thú y.</p></div></header>
      <section className="panel">
        <div className="horse-context-card"><div><h2>{horse.name}</h2><p>Mã ngựa #{horse.code || horse.id} · {horse.breed}</p></div><StatusBadge status={horse.profileStatus} type="registration" /></div>
        <div className="horse-form-grid" style={{ marginTop: 16 }}>
          <label className="form-field"><span>Ngày tiếp nhận</span><input type="date" value={receivedDate} onChange={(event) => setReceivedDate(event.target.value)} /></label>
          <label className="form-field"><span>Vet được phân công</span><select value={assignedVetId} onChange={(event) => setAssignedVetId(event.target.value)}>
            <option value="">Chọn bác sĩ thú y</option>
            {vetOptions.map((user) => <option key={user.id} value={user.id}>{user.fullName}</option>)}
          </select></label>
          <label className="form-field" style={{ gridColumn: '1 / -1' }}><span>Ghi chú bàn giao</span><textarea rows="4" value={handoverNotes} onChange={(event) => setHandoverNotes(event.target.value)} /></label>
          <div className="form-field" style={{ gridColumn: '1 / -1' }}>
            <button className="button" type="button" disabled={!canAssignVet || saving} onClick={() => void saveAssignment()}>{saving ? 'Đang lưu...' : 'Lưu thông tin tiếp nhận / phân công'}</button>
          </div>
        </div>
        {horse.intake?.handoverDocuments?.length > 0 && <div className="profile-section"><h3>Tài liệu bàn giao</h3><ul>{horse.intake.handoverDocuments.map((document, index) => <li key={document.id || index}>{document.fileName || document.name || 'Tài liệu bàn giao'}</li>)}</ul></div>}
        {horse.profileStatus === 'PENDING_COMPLETION' && <section className="profile-section">
          <h2>Điều kiện hoàn tất tiếp nhận</h2>
          <ul>
            <li>{identityComplete ? 'Đủ' : 'Thiếu'} thông tin lý lịch ngựa</li>
            <li>{ownerLinked ? 'Đã' : 'Chưa'} liên kết Owner cùng câu lạc bộ</li>
            <li>{eligibleByPolicy ? 'Đạt' : 'Chưa đạt'} chính sách tiếp nhận (kết luận sức khỏe phải là Đủ điều kiện)</li>
          </ul>
          <button className="button" type="button" disabled={!canComplete || saving} onClick={() => void completeIntake()}>{saving ? 'Đang lưu...' : 'Hoàn tất tiếp nhận'}</button>
        </section>}
        {horse.profileStatus === 'RECEIVED' && <p className="success-message">Hồ sơ đã được Manager hoàn tất tiếp nhận.</p>}
        {error && <p className="error-message" role="alert">{error}</p>}
        {message && <p className="success-message" role="status">{message}</p>}
      </section>

      <section className="panel archive-panel" style={{ marginTop: 24 }}>
        <h2>Lưu trữ hồ sơ</h2>
        <form onSubmit={archiveHorse}>
          <label className="form-field" htmlFor="archive-reason"><span>Lý do lưu trữ</span><textarea id="archive-reason" rows="3" required placeholder="Nhập lý do lưu trữ..." value={archiveReason} onChange={(event) => setArchiveReason(event.target.value)} maxLength={500} /></label>
          <label className="check-field"><input type="checkbox" required checked={confirmArchive} onChange={(event) => setConfirmArchive(event.target.checked)} /><span>Tôi xác nhận lưu trữ hồ sơ và giữ nguyên lịch sử liên quan.</span></label>
          <button className="button archive-submit" type="submit" disabled={!archiveReason.trim()}>Lưu trữ hồ sơ</button>
        </form>
        {archiveRecord && <div className="archive-history"><strong>Lý do lưu trữ: {archiveRecord.reason}</strong><span>Thời điểm lưu trữ: {archiveRecord.archivedAt}</span></div>}
      </section>
    </main>
  )
}

export default CompleteIntake
