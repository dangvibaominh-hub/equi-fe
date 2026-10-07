import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../../components/common/EmptyState.jsx'
import StatusBadge from '../../components/common/StatusBadge.jsx'
import { owners } from '../../mock/owners.js'
import { mockCurrentVetId } from '../../mock/exams.js'
import { formatHorseGender } from '../../components/horse/horseLabels.js'

const examStatusLabels = { Waiting: 'Chờ khám', Examined: 'Đã khám' }

function HorsesNeedingExam({ horses, exams }) {
  const [statusFilter, setStatusFilter] = useState('All')
  const assignedExams = useMemo(() => exams.filter((exam) => exam.assignedVetId === mockCurrentVetId), [exams])
  const visibleExams = assignedExams.filter((exam) => statusFilter === 'All' || exam.status === statusFilter)
  const tableRows = visibleExams.map((exam) => ({ exam, horse: horses.find((item) => item.horseId === exam.horseId) })).filter((row) => row.horse)

  return (
    <main className="page-content">
      <nav className="breadcrumb" aria-label="Đường dẫn">Hồ sơ khám <span aria-hidden="true">/</span> Ngựa cần khám</nav>
      <header className="page-heading"><div><p className="eyebrow">BÁC SĨ THÚ Y · HỒ SƠ KHÁM</p><h1>Ngựa cần khám</h1><p>Theo dõi ngựa và yêu cầu khám được phân công.</p></div></header>
      <section className="filter-card exam-filter-card"><label className="filter-field" htmlFor="exam-status-filter"><span>Trạng thái khám</span><select id="exam-status-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="All">Tất cả</option><option value="Waiting">Chờ khám</option><option value="Examined">Đã khám</option></select></label></section>
      {tableRows.length === 0 ? <EmptyState title="Không có ngựa cần khám trong trạng thái đã chọn" description="Chọn trạng thái khác để xem các hồ sơ được phân công." /> : (
        <div className="table-card"><div className="table-wrap"><table className="data-table"><thead><tr><th scope="col">Mã ngựa</th><th scope="col">Tên ngựa</th><th scope="col">Chủ sở hữu</th><th scope="col">Trạng thái khám</th><th scope="col">Cập nhật</th><th scope="col">Thao tác</th></tr></thead>
          <tbody>{tableRows.map(({ exam, horse }) => <tr key={exam.examId}><td>#{horse.horseId}</td><td><strong>{horse.horseName}</strong><small>{horse.breed} · {formatHorseGender(horse.gender)}</small></td><td>{owners.find((owner) => owner.ownerId === horse.ownerId)?.fullName || `#${horse.ownerId}`}</td><td><StatusBadge status={exam.status} label={examStatusLabels[exam.status]} type="exam" /></td><td>{exam.updatedAt}</td><td className="row-actions"><Link to={`/horses/${horse.horseId}?role=vet&examId=${exam.examId}`}>Mở hồ sơ</Link></td></tr>)}</tbody>
        </table></div></div>
      )}
    </main>
  )
}

export default HorsesNeedingExam
