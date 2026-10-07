import { useState } from 'react'
import { Link } from 'react-router-dom'
import StatusBadge from '../../components/common/StatusBadge.jsx'
import { owners } from '../../mock/owners.js'

const healthStatuses = ['Unknown', 'Healthy', 'Monitor', 'Injured', 'Recovering', 'Isolated']
const healthStatusLabels = { Unknown: 'Chưa xác định', Healthy: 'Khỏe mạnh', Monitor: 'Theo dõi', Injured: 'Chấn thương', Recovering: 'Đang hồi phục', Isolated: 'Cách ly' }

function PostExamStatus({ horse, exam, viewerRole, onUpdateHorse, onUpdateExam }) {
  const [status, setStatus] = useState(horse?.currentHealthStatus || '')
  const [message, setMessage] = useState('')
  const canUpdate = viewerRole === 'vet'
  const ownerName = owners.find((owner) => owner.ownerId === horse?.ownerId)?.fullName
  const profilePath = viewerRole === 'owner' ? `/owner/horses/${horse?.horseId}` : viewerRole === 'vet' ? `/horses/${horse?.horseId}?role=vet${exam ? `&examId=${exam.examId}` : ''}` : `/horses/${horse?.horseId}`
  const lastUpdated = [horse?.updatedAt, exam?.updatedAt].filter(Boolean).sort().at(-1)

  if (!horse) return <main className="page-content"><section className="panel"><h1>{viewerRole === 'owner' ? 'Không tìm thấy hồ sơ thuộc quyền sở hữu của bạn' : 'Không tìm thấy ngựa hoặc yêu cầu khám'}</h1><Link to={viewerRole === 'owner' ? '/owner/horses' : viewerRole === 'vet' ? '/vet/horses-needing-exam' : '/manager/horses'}>Quay lại</Link></section></main>

  function handleSubmit(event) {
    event.preventDefault()
    if (!canUpdate || !status) return
    const updatedAt = new Date().toISOString()
    onUpdateHorse(horse.horseId, { currentHealthStatus: status, updatedAt })
    if (exam && onUpdateExam) onUpdateExam(exam.examId, { status: 'Examined', updatedAt })
    setMessage('Đã cập nhật tình trạng sức khỏe và làm mới thông tin hồ sơ.')
  }

  const viewerSummary = viewerRole === 'owner'
    ? 'Tình trạng sức khỏe hiện tại của ngựa thuộc sở hữu của bạn.'
    : viewerRole === 'manager'
      ? 'Thông tin trạng thái phục vụ theo dõi hồ sơ câu lạc bộ.'
      : 'Kết quả sức khỏe và trạng thái yêu cầu khám được phân công.'

  return (
    <main className="page-content narrow-content">
      <div className="breadcrumb"><Link to={profilePath}>Hồ sơ ngựa</Link><span aria-hidden="true">/</span><span>Trạng thái sau khám</span></div>
      <header className="page-heading"><div><p className="eyebrow">{viewerRole === 'owner' ? 'CHỦ SỞ HỮU NGỰA' : viewerRole === 'manager' ? 'QUẢN LÝ CÂU LẠC BỘ' : 'BÁC SĨ THÚ Y'} · TRẠNG THÁI SAU KHÁM</p><h1>{horse.horseName}</h1><p>Mã ngựa #{horse.horseId} · {horse.breed} · Chủ sở hữu: {ownerName || `#${horse.ownerId}`}</p></div></header>
      <section className="horse-context-card"><div><h2>{horse.horseName}</h2><p>Mã ngựa #{horse.horseId} · {exam ? `Yêu cầu khám ${exam.examId}` : 'Tóm tắt hồ sơ'}</p></div>{exam && <StatusBadge status={exam.status} label={exam.status === 'Waiting' ? 'Chờ khám' : 'Đã khám'} type="exam" />}</section>
      <div className="post-exam-status-grid">
        <section className="panel"><span className="eyebrow">TRẠNG THÁI HỒ SƠ</span><StatusBadge status={horse.registrationStatus} type="registration" /></section>
        <section className="panel"><span className="eyebrow">TRẠNG THÁI SỨC KHỎE</span><StatusBadge status={horse.currentHealthStatus} type="health" /></section>
      </div>
      <section className="panel latest-update-panel"><div className="section-title"><h2>Cập nhật gần nhất</h2></div><strong>{lastUpdated || 'Chưa có thông tin'}</strong></section>
      <section className="panel role-summary-panel"><div className="section-title"><h2>Thông tin sức khỏe</h2></div><p>{viewerSummary}</p>{viewerRole === 'vet' && <p className="profile-copy">Chưa có ghi chú khám chi tiết được cung cấp.</p>}</section>
      {canUpdate && <section className="panel form-panel post-exam-form-panel">
        <h2>Ghi nhận kết quả khám</h2>
        <form onSubmit={handleSubmit}>
          <label className="form-field"><span>Trạng thái sức khỏe sau khám</span><select required value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Chọn trạng thái</option>{healthStatuses.map((value) => <option key={value} value={value}>{healthStatusLabels[value]}</option>)}</select></label>
          {message && <p className="success-message" role="status">{message}</p>}
          <div className="form-actions"><button className="button" type="submit">Lưu kết quả</button><Link className="button button-secondary" to={profilePath}>Quay lại hồ sơ</Link></div>
        </form>
      </section>}
      {!canUpdate && <Link className="button button-secondary" to={profilePath}>Quay lại hồ sơ</Link>}
    </main>
  )
}

export default PostExamStatus
