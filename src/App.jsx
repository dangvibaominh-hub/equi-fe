import { useState } from 'react'
import { BrowserRouter, Link, NavLink, Route, Routes, useLocation, useParams, useSearchParams } from 'react-router-dom'
import HorseList from './pages/manager/HorseList.jsx'
import CompleteIntake from './pages/manager/CompleteIntake.jsx'
import OwnerHorses from './pages/owner/OwnerHorses.jsx'
import OwnerCorrectionRequest from './pages/owner/OwnerCorrectionRequest.jsx'
import HorsesNeedingExam from './pages/vet/HorsesNeedingExam.jsx'
import PostExamStatus from './pages/vet/PostExamStatus.jsx'
import HorseProfile from './components/horse/HorseProfile.jsx'
import StatusBadge from './components/common/StatusBadge.jsx'
import { horses as initialHorses } from './mock/horses.js'
import { owners } from './mock/owners.js'
import { mockCurrentOwnerId } from './mock/workflow.js'
import { examAssignments, mockCurrentVetId } from './mock/exams.js'
import { intakeRecords } from './mock/intakeRecords.js'
import { correctionRequestRecords } from './mock/correctionRequests.js'
import { initialHorseArchives } from './mock/horseArchives.js'
import './App.css'

const usersByRole = {
  manager: { label: 'QUẢN LÝ CÂU LẠC BỘ', name: 'H. Minh Hoàng', initials: 'MH', notificationCount: 3 },
  owner: { label: 'CHỦ SỞ HỮU NGỰA', name: owners.find((owner) => owner.ownerId === mockCurrentOwnerId)?.fullName || 'Nguyễn Minh Anh', initials: 'NA', notificationCount: 3 },
  vet: { label: 'BÁC SĨ THÚ Y', name: 'Trần Quốc Bảo', initials: 'TB', notificationCount: 3 },
}

function NavIcon({ kind }) {
  const common = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
  if (kind === 'owner') return <svg {...common}><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.5-3.5 3.1-5.5 7-5.5s6.5 2 7 5.5" /></svg>
  if (kind === 'vet') return <svg {...common}><rect x="4" y="4" width="16" height="16" rx="4" /><path d="M12 8v8M8 12h8" /></svg>
  return <svg {...common}><path d="M4 5h16M4 10h16M4 15h10M4 20h10" /><circle cx="19" cy="17.5" r="2.5" /></svg>
}

function ProfileRoute({ horses, exams }) {
  const { horseId } = useParams()
  const [searchParams] = useSearchParams()
  const role = searchParams.get('role') === 'vet' ? 'vet' : 'manager'
  const exam = exams.find((item) => item.examId === searchParams.get('examId') && item.assignedVetId === mockCurrentVetId)
  const horse = role === 'vet' && !exam
    ? undefined
    : horses.find((item) => item.horseId === Number(horseId) && (!exam || exam.horseId === item.horseId))
  return <HorseProfilePage horse={horse} role={role} exam={exam} />
}

function HorseProfilePage({ horse, role, exam }) {
  const owner = owners.find((item) => item.ownerId === horse?.ownerId)
  const backTo = role === 'owner' ? '/owner/horses' : role === 'vet' ? '/vet/horses-needing-exam' : '/manager/horses'
  const healthContent = horse ? <div className="health-summary-grid">
    <div className="info-item"><span>Tình trạng sức khỏe hiện tại</span><StatusBadge status={horse.currentHealthStatus} type="health" /></div>
    <div className="info-item"><span>Cập nhật gần nhất</span><strong>{horse.updatedAt || 'Chưa có thông tin'}</strong></div>
    {role === 'vet' && <p className="profile-copy">Chưa có tiền sử khám chi tiết.</p>}
  </div> : undefined
  const postExamPath = role === 'vet' && exam ? `/vet/exams/${exam.examId}/post-exam` : `/${role}/horses/${horse?.horseId}/post-exam`

  return (
    <main className="page-content">
      <div className="horse-actions">
        <Link className="breadcrumb-back-button" to={backTo}>← Quay lại danh sách ngựa</Link>
        {horse && <div className="profile-actions">
          {role === 'manager' && <Link className="button" to={`/manager/horses/${horse.horseId}/intake`}>Hoàn tất tiếp nhận</Link>}
          {role === 'owner' && <Link className="button button-secondary" to={`/owner/horses/${horse.horseId}/correction-request`}>Yêu cầu hiệu chỉnh lý lịch</Link>}
          {role === 'vet' && <Link className="button" to={postExamPath}>Nhập kết quả khám</Link>}
          {role !== 'vet' && <Link className="button button-secondary" to={postExamPath}>Trạng thái hồ sơ</Link>}
        </div>}
      </div>
      {exam && <section className="horse-context-card exam-context-card"><div><h2>Yêu cầu khám {exam.examId}</h2><p>Ngày phân công: {exam.assignedAt}</p></div><StatusBadge status={exam.status} label={exam.status === 'Waiting' ? 'Chờ khám' : 'Đã khám'} /></section>}
      <HorseProfile horse={horse} owner={owner} healthContent={healthContent} />
    </main>
  )
}

function AppContent() {
  const [horses, setHorses] = useState(initialHorses)
  const [exams, setExams] = useState(examAssignments)
  const [correctionRequests, setCorrectionRequests] = useState(correctionRequestRecords)
  const [archiveRecords, setArchiveRecords] = useState(initialHorseArchives)
  const { pathname } = useLocation()
  const profileRole = new URLSearchParams(window.location.search).get('role')
  const role = pathname.startsWith('/owner') ? 'owner' : pathname.startsWith('/vet') || (pathname.startsWith('/horses/') && profileRole === 'vet') ? 'vet' : 'manager'
  const currentUser = usersByRole[role]
  const home = role === 'owner' ? '/owner/horses' : role === 'vet' ? '/vet/horses-needing-exam' : '/manager/horses'
  const date = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    .formatToParts(new Date())
    .filter((part) => ['day', 'month', 'year'].includes(part.type))
    .map((part) => part.value)
    .join(' / ')

  function updateHorse(horseId, updates) {
    setHorses((current) => current.map((horse) => horse.horseId === horseId ? { ...horse, ...updates } : horse))
  }
  function updateExam(examId, updates) {
    setExams((current) => current.map((exam) => exam.examId === examId ? { ...exam, ...updates } : exam))
  }
  function addCorrectionRequest(request) {
    setCorrectionRequests((current) => [{ ...request, requestId: `CR-${Date.now()}`, status: 'Pending', rejectionReason: '' }, ...current])
  }
  function archiveHorse(horseId, reason) {
    const horse = horses.find((item) => item.horseId === horseId)
    if (!horse || horse.registrationStatus === 'Inactive' || !reason.trim()) return

    const archivedAt = new Date().toISOString()
    updateHorse(horseId, { registrationStatus: 'Inactive', updatedAt: archivedAt })
    setArchiveRecords((current) => {
      if (current.some((record) => record.horseId === horseId)) return current
      return [{ archiveId: `AR-${Date.now()}`, horseId, reason: reason.trim(), archivedAt, archivedByRole: 'Club Manager' }, ...current]
    })
  }

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <Link className="brand" to={home}><span className="brand-mark">E</span><span><strong>EQUITRACK</strong><small>RACETRACK PERFORMANCE</small></span></Link>
        <p className="sidebar-label">KHÔNG GIAN LÀM VIỆC</p>
        <nav className="side-nav" aria-label="Điều hướng chính">
          {role === 'manager' && <><NavLink end to="/manager/horses"><NavIcon kind="manager" /><span>Danh sách ngựa</span></NavLink>{(pathname.includes('/intake') || pathname.includes('/post-exam')) && <span className="nav-context"><NavIcon kind="manager" /><span>{pathname.includes('/intake') ? 'Tiếp nhận / lưu trữ' : 'Trạng thái sau khám'}</span></span>}</>}
          {role === 'owner' && <><NavLink end to="/owner/horses"><NavIcon kind="owner" /><span>Ngựa của tôi</span></NavLink>{pathname.startsWith('/owner/horses/') && <span className="nav-context"><NavIcon kind="owner" /><span>{pathname.includes('correction-request') ? 'Hiệu chỉnh lý lịch' : pathname.includes('post-exam') ? 'Sức khỏe sau khám' : 'Hồ sơ và sức khỏe'}</span></span>}</>}
          {role === 'vet' && <><NavLink end to="/vet/horses-needing-exam"><NavIcon kind="vet" /><span>Hồ sơ khám</span></NavLink>{(pathname.includes('post-exam') || pathname.startsWith('/horses/')) && <span className="nav-context"><NavIcon kind="vet" /><span>{pathname.includes('post-exam') ? 'Cập nhật sau khám' : 'Hồ sơ ngựa'}</span></span>}</>}
        </nav>
        <div className="sidebar-support"><strong>Cần hỗ trợ?</strong><span>Liên hệ quản lý câu lạc bộ</span><span className="support-link">Trung tâm hỗ trợ</span></div>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <div className="topbar-workspace"><span className="topbar-kicker">{currentUser.label}</span><strong>Câu lạc bộ Hoàng Gia</strong></div>
          <div className="topbar-account">
            <span className="topbar-date">{date}</span>
            <span className="notification-indicator" aria-label={`${currentUser.notificationCount} thông báo`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>
              <span>{currentUser.notificationCount}</span>
            </span>
            <div className="topbar-user">
              <span className="avatar" aria-hidden="true">{currentUser.initials}</span>
              <div className="account-name"><strong>{currentUser.name}</strong><span><i />Đang hoạt động</span></div>
            </div>
          </div>
        </header>
        <Routes>
          <Route path="/" element={<HorseList horses={horses} />} />
          <Route path="/manager/horses" element={<HorseList horses={horses} />} />
          <Route path="/horses/:horseId" element={<ProfileRoute horses={horses} exams={exams} />} />
          <Route path="/manager/horses/:horseId/intake" element={<ManagerIntakeRoute horses={horses} archiveRecords={archiveRecords} onUpdateHorse={updateHorse} onArchiveHorse={archiveHorse} />} />
          <Route path="/manager/horses/:horseId/post-exam" element={<RolePostExamRoute horses={horses} exams={exams} viewerRole="manager" onUpdateHorse={updateHorse} onUpdateExam={updateExam} />} />
          <Route path="/owner/horses" element={<OwnerHorses horses={horses} />} />
          <Route path="/owner/horses/:horseId" element={<OwnerProfileRoute horses={horses} />} />
          <Route path="/owner/horses/:horseId/correction-request" element={<OwnerCorrectionRoute horses={horses} requests={correctionRequests} onSubmitRequest={addCorrectionRequest} />} />
          <Route path="/owner/horses/:horseId/post-exam" element={<OwnerPostExamRoute horses={horses} exams={exams} onUpdateHorse={updateHorse} onUpdateExam={updateExam} />} />
          <Route path="/vet/horses-needing-exam" element={<HorsesNeedingExam horses={horses} exams={exams} />} />
          <Route path="/vet/exams/:examId/post-exam" element={<RolePostExamRoute horses={horses} exams={exams} viewerRole="vet" onUpdateHorse={updateHorse} onUpdateExam={updateExam} />} />
          <Route path="/vet/horses/:horseId/post-exam" element={<RolePostExamRoute horses={horses} exams={exams} viewerRole="vet" onUpdateHorse={updateHorse} onUpdateExam={updateExam} />} />
          <Route path="*" element={<main className="page-content"><section className="panel"><h1>Không tìm thấy trang</h1><Link to={home}>Quay lại</Link></section></main>} />
        </Routes>
        <footer className="app-footer">EQUITRACK · Quản lý đào tạo ngựa đua</footer>
      </div>
    </div>
  )
}

function OwnerProfileRoute({ horses }) {
  const { horseId } = useParams()
  const horse = horses.find((item) => item.horseId === Number(horseId) && item.ownerId === mockCurrentOwnerId)
  return <HorseProfilePage horse={horse} role="owner" />
}

function OwnerCorrectionRoute({ horses, requests, onSubmitRequest }) {
  const ownedHorses = horses.filter((item) => item.ownerId === mockCurrentOwnerId)
  return <OwnerCorrectionRequest horses={ownedHorses} requests={requests.filter((request) => request.ownerId === mockCurrentOwnerId)} onSubmitRequest={onSubmitRequest} />
}

function ManagerIntakeRoute({ horses, archiveRecords, onUpdateHorse, onArchiveHorse }) {
  const { horseId } = useParams()
  const archiveRecord = archiveRecords.find((record) => record.horseId === Number(horseId))
  return <CompleteIntake horses={horses} intakeRecords={intakeRecords} archiveRecord={archiveRecord} onUpdateHorse={onUpdateHorse} onArchiveHorse={onArchiveHorse} />
}

function OwnerPostExamRoute({ horses, exams }) {
  const { horseId } = useParams()
  const horse = horses.find((item) => item.horseId === Number(horseId) && item.ownerId === mockCurrentOwnerId)
  const exam = exams.find((item) => item.horseId === horse?.horseId)
  return <PostExamStatus horse={horse} exam={exam} viewerRole="owner" />
}

function RolePostExamRoute({ horses, exams, viewerRole, onUpdateHorse, onUpdateExam }) {
  const { horseId, examId } = useParams()
  const exam = viewerRole === 'vet'
    ? exams.find((item) => (examId ? item.examId === examId : item.horseId === Number(horseId)) && item.assignedVetId === mockCurrentVetId)
    : exams.find((item) => item.horseId === Number(horseId))
  const resolvedHorseId = viewerRole === 'vet' ? exam?.horseId : Number(horseId)
  const horse = horses.find((item) => item.horseId === resolvedHorseId)
  if (viewerRole === 'owner' && horse?.ownerId !== mockCurrentOwnerId) return <PostExamStatus viewerRole="owner" />
  return <PostExamStatus horse={horse} exam={exam} viewerRole={viewerRole} onUpdateHorse={onUpdateHorse} onUpdateExam={onUpdateExam} />
}

function App() {
  return <BrowserRouter><AppContent /></BrowserRouter>
}

export default App
