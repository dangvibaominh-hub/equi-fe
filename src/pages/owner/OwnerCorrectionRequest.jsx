import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import EmptyState from '../../components/common/EmptyState.jsx'
import StatusBadge from '../../components/common/StatusBadge.jsx'
import { mockCurrentOwnerId } from '../../mock/workflow.js'

const fields = [
  ['horseName', 'Tên ngựa'], ['breed', 'Giống'], ['dateOfBirth', 'Ngày sinh'], ['coatColor', 'Màu lông'], ['gender', 'Giới tính'], ['pedigree', 'Dòng dõi'],
]
const requestStatusLabels = { Pending: 'Chờ xử lý', Approved: 'Đã chấp nhận', Rejected: 'Bị từ chối' }

function OwnerCorrectionRequest({ horses, requests = [], onSubmitRequest }) {
  const { horseId } = useParams()
  const horse = horses.find((item) => item.horseId === Number(horseId) && item.ownerId === mockCurrentOwnerId)
  const [field, setField] = useState('')
  const [requestedValue, setRequestedValue] = useState('')
  const [reason, setReason] = useState('')
  const [evidenceFiles, setEvidenceFiles] = useState([])
  const [submitted, setSubmitted] = useState(false)
  const currentValue = field && horse ? horse[field] ?? 'Chưa có thông tin' : ''
  const horseRequests = useMemo(() => requests.filter((request) => request.horseId === Number(horseId)), [requests, horseId])

  if (!horse) return <main className="page-content"><section className="panel"><h1>Không tìm thấy ngựa</h1><Link to="/owner/horses">Quay lại danh sách ngựa</Link></section></main>

  function handleSubmit(event) {
    event.preventDefault()
    onSubmitRequest({ ownerId: mockCurrentOwnerId, horseId: horse.horseId, field, requestedValue, reason, evidenceFiles, createdAt: new Date().toISOString() })
    setSubmitted(true)
  }

  return (
    <main className="page-content">
      <div className="breadcrumb"><Link to={`/owner/horses/${horse.horseId}`}>Hồ sơ và sức khỏe</Link><span aria-hidden="true">/</span><span>Yêu cầu hiệu chỉnh lý lịch</span></div>
      <header className="page-heading"><div><p className="eyebrow">CHỦ SỞ HỮU NGỰA · HIỆU CHỈNH LÝ LỊCH</p><h1>Yêu cầu hiệu chỉnh lý lịch</h1><p>Gửi thông tin cần sửa và bằng chứng để câu lạc bộ xem xét.</p></div></header>
      <section className="horse-context-card"><div><h2>{horse.horseName}</h2><p>Mã ngựa #{horse.horseId} · {horse.breed}</p></div><StatusBadge status={horse.registrationStatus} type="registration" /></section>
      <section className="panel form-panel">
        {submitted && <p className="success-message" role="status">Yêu cầu đã được ghi nhận trong danh sách bên dưới nhưng chưa được chuyển đến câu lạc bộ.</p>}
        <form onSubmit={handleSubmit}>
          <label className="form-field"><span>Thông tin cần sửa</span><select required value={field} onChange={(event) => setField(event.target.value)}><option value="">Chọn thông tin</option>{fields.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
          {field && <div className="current-value"><span>Giá trị hiện tại</span><strong>{currentValue}</strong></div>}
          <label className="form-field"><span>Giá trị đề nghị</span><input required value={requestedValue} onChange={(event) => setRequestedValue(event.target.value)} maxLength={200} /></label>
          <label className="form-field"><span>Lý do</span><textarea required rows="3" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={1000} /></label>
          <label className="form-field"><span>Bằng chứng đính kèm</span><input type="file" accept=".pdf,.jpg,.jpeg,.png" multiple onChange={(event) => setEvidenceFiles(Array.from(event.target.files || [], (file) => file.name))} /><small>Chọn tài liệu PDF hoặc hình ảnh liên quan.</small></label>
          {evidenceFiles.length > 0 && <ul className="attachment-list" aria-label="Tệp đã chọn">{evidenceFiles.map((fileName) => <li key={fileName}>{fileName}</li>)}</ul>}
          <div className="form-actions"><button className="button" type="submit">Gửi yêu cầu hiệu chỉnh</button><Link className="button button-secondary" to={`/owner/horses/${horse.horseId}`}>Hủy</Link></div>
        </form>
      </section>
      <section className="panel request-history">
        <div className="section-title"><h2>Trạng thái yêu cầu</h2></div>
        {horseRequests.length === 0 ? <EmptyState title="Bạn chưa có yêu cầu hiệu chỉnh nào" description="Các yêu cầu gửi đi sẽ hiển thị tại đây." /> : <div className="request-list">
          {horseRequests.map((request) => <article className="request-item" key={request.requestId}>
            <div className="request-item-heading"><div><strong>{fields.find(([key]) => key === request.field)?.[1] || 'Thông tin hồ sơ'}</strong><small>{request.createdAt}</small></div><StatusBadge status={request.status} type="request" label={requestStatusLabels[request.status] || request.status} /></div>
            <p className="request-value">Giá trị đề nghị: {request.requestedValue}</p>
            {request.evidenceFiles?.length > 0 && <p className="request-evidence">Bằng chứng: {request.evidenceFiles.join(', ')}</p>}
            {request.status === 'Rejected' && request.rejectionReason && <div className="rejection-reason"><strong>Lý do từ chối</strong><p>{request.rejectionReason}</p></div>}
          </article>)}
        </div>}
      </section>
    </main>
  )
}

export default OwnerCorrectionRequest
