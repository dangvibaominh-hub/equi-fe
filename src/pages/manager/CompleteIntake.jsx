import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import StatusBadge from '../../components/common/StatusBadge.jsx'
import HorseDocuments from '../../components/horse/HorseDocuments.jsx'
import { owners } from '../../mock/owners.js'

function CompleteIntake({ horses, intakeRecords, onUpdateHorse, onArchiveHorse, archiveRecord, documents = [] }) {
  const { horseId } = useParams()
  const horse = horses.find((item) => item.horseId === Number(horseId))
  const [archiveReason, setArchiveReason] = useState(archiveRecord?.reason || '')
  const [confirmArchive, setConfirmArchive] = useState(false)
  const [message, setMessage] = useState('')
  const owner = owners.find((item) => item.ownerId === horse?.ownerId)
  const intakeRecord = intakeRecords.find((item) => item.horseId === horse?.horseId)

  if (!horse) return <main className="page-content"><section className="panel"><h1>Không tìm thấy ngựa</h1><Link to="/manager/horses">Quay lại danh sách ngựa</Link></section></main>

  const identificationReady = Boolean(horse.horseName && horse.breed && horse.dateOfBirth && horse.gender)
  const ownerLinked = Boolean(owner)
  const vetConclusionReady = intakeRecord?.vetConclusionStatus === 'Eligible'
  const conditions = [
    { label: 'Thông tin nhận diện đầy đủ', met: identificationReady },
    { label: 'Chủ sở hữu đã được liên kết', met: ownerLinked },
    { label: 'Có kết luận đủ điều kiện từ bác sĩ thú y', met: vetConclusionReady },
  ]
  const blockingReasons = [
    ...(!identificationReady ? ['Thiếu thông tin nhận diện của ngựa.'] : []),
    ...(!ownerLinked ? ['Chưa liên kết được chủ sở hữu.'] : []),
    ...(!vetConclusionReady ? [intakeRecord?.blockingReason || 'Chưa có kết luận đủ điều kiện từ bác sĩ thú y.'] : []),
  ]
  const canComplete = horse.registrationStatus === 'Pending' && conditions.every((condition) => condition.met)
  const alreadyArchived = horse.registrationStatus === 'Inactive' || Boolean(archiveRecord)
  const canArchive = archiveReason.trim().length > 0 && confirmArchive && !alreadyArchived

  function completeIntake() {
    if (!canComplete) return
    onUpdateHorse(horse.horseId, { registrationStatus: 'Approved', updatedAt: new Date().toISOString() })
    setMessage('Đã hoàn tất tiếp nhận. Trạng thái đã cập nhật trên màn hình.')
  }

  function archiveHorse(event) {
    event.preventDefault()
    if (!canArchive) return
    onArchiveHorse(horse.horseId, archiveReason.trim())
    setMessage('Hồ sơ đã được chuyển sang trạng thái không hoạt động. Lịch sử hồ sơ vẫn được giữ nguyên.')
    setArchiveReason('')
    setConfirmArchive(false)
  }

  return (
    <main className="page-content">
      <div className="breadcrumb"><Link to={`/horses/${horse.horseId}`}>Hồ sơ ngựa</Link><span aria-hidden="true">/</span><span>Hoàn tất tiếp nhận</span></div>
      <header className="page-heading"><div><p className="eyebrow">QUẢN LÝ CÂU LẠC BỘ · VÒNG ĐỜI HỒ SƠ</p><h1>Hoàn tất tiếp nhận</h1><p>Kiểm tra điều kiện tiếp nhận và trạng thái hồ sơ trước khi hoàn tất.</p></div></header>
      <section className="horse-context-card"><div><h2>{horse.horseName}</h2><p>Mã ngựa #{horse.horseId} · {horse.breed} · {owner?.fullName || 'Chưa có chủ sở hữu'}</p></div><StatusBadge status={horse.registrationStatus} type="registration" /></section>
      <div className="intake-grid">
        <section className="panel intake-summary"><h2>Điều kiện hoàn tất</h2>
          <div className="intake-checklist"><div className="intake-checklist-head"><span>Điều kiện</span><span>Trạng thái</span></div>{conditions.map((condition) => <div className="intake-check" key={condition.label}><span>{condition.label}</span><strong className={condition.met ? 'check-met' : 'check-blocked'}>{condition.met ? 'Đạt' : 'Chưa đạt'}</strong></div>)}</div>
          <div className="intake-vet-conclusion"><h3>Kết luận bác sĩ thú y</h3><p>{intakeRecord?.vetConclusion || 'Chưa có kết luận.'}</p></div>
          {blockingReasons.length > 0 && <div className="intake-blockers"><h3>Chưa thể hoàn tất</h3><ul>{blockingReasons.map((reason) => <li key={reason}>{reason}</li>)}</ul></div>}
          {horse.registrationStatus === 'Approved' && <p className="profile-copy">Hồ sơ đã hoàn tất tiếp nhận.</p>}
          <button className="button" type="button" onClick={completeIntake} disabled={!canComplete}>Hoàn tất tiếp nhận</button>
        </section>
        <section className="panel"><HorseDocuments documents={documents.filter((document) => document.horseId === horse.horseId)} /></section>
      </div>
      <section className="panel archive-panel"><h2>Lưu trữ hồ sơ</h2>
        <form onSubmit={archiveHorse}>
          <label className="form-field" htmlFor="archive-reason"><span>Lý do lưu trữ</span><textarea id="archive-reason" rows="3" required placeholder="Nhập lý do lưu trữ..." value={archiveReason} onChange={(event) => setArchiveReason(event.target.value)} maxLength={500} /></label>
          <label className="check-field"><input type="checkbox" required checked={confirmArchive} onChange={(event) => setConfirmArchive(event.target.checked)} /><span>Tôi xác nhận lưu trữ hồ sơ và giữ nguyên lịch sử liên quan.</span></label>
          <button className="button archive-submit" type="submit" disabled={!canArchive}>{alreadyArchived ? 'Đã lưu trữ hồ sơ' : 'Lưu trữ hồ sơ'}</button>
        </form>
        {archiveRecord && <div className="archive-history"><strong>Lý do lưu trữ: {archiveRecord.reason}</strong><span>Thời điểm lưu trữ: {archiveRecord.archivedAt}</span></div>}
      </section>
      {message && <p className="success-message" role="status">{message}</p>}
    </main>
  )
}

export default CompleteIntake
