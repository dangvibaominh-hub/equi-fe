import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ApiError } from './api/apiClient'
import { completeHorseIntake as completeHorseIntakeApi, createHorse as createHorseApi, finalizeExamination as finalizeExaminationApi, getHorseById, getHorses, isHorseAssignedToVet, normalizeHorse, normalizeUser, saveExaminationDraft as saveExaminationDraftApi, updateHorse as updateHorseApi } from './api/horseApi'
import { createUser as createUserApi, getUsers } from './api/userApi'
import HorseList from './pages/manager/HorseList.jsx'
import CompleteIntake from './pages/manager/CompleteIntake.jsx'
import OwnerHorses from './pages/owner/OwnerHorses.jsx'
import OwnerCorrectionRequest from './pages/owner/OwnerCorrectionRequest.jsx'
import HorsesNeedingExam from './pages/vet/HorsesNeedingExam.jsx'
import VetExaminationForm from './pages/vet/VetExaminationForm'
import PostExamStatus from './pages/vet/PostExamStatus.jsx'
import HorseProfile from './components/horse/HorseProfile.jsx'
import StatusBadge from './components/common/StatusBadge.jsx'
import './App.css'

const demoRoleLabels = {
  manager: 'QUẢN LÝ CÂU LẠC BỘ',
  owner: 'CHỦ SỞ HỮU NGỰA',
  vet: 'BÁC SĨ THÚ Y',
}

const uiRoleFromUser = (role) => {
  if (role === 'CLUB_MANAGER') return 'manager'
  if (role === 'OWNER') return 'owner'
  if (role === 'VET') return 'vet'
  return 'manager'
}

function NavIcon({ kind }) {
  const common = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
  if (kind === 'owner') return <svg {...common}><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.5-3.5 3.1-5.5 7-5.5s6.5 2 7 5.5" /></svg>
  if (kind === 'vet') return <svg {...common}><rect x="4" y="4" width="16" height="16" rx="4" /><path d="M12 8v8M8 12h8" /></svg>
  return <svg {...common}><path d="M4 5h16M4 10h16M4 15h10M4 20h10" /><circle cx="19" cy="17.5" r="2.5" /></svg>
}

function ProfileRoute({ horses, owners, currentUser, loadingUser, loadError, onRetryUsers }) {
  const { horseId } = useParams()
  const [searchParams] = useSearchParams()
  const role = searchParams.get('role') === 'vet' ? 'vet' : 'manager'
  if (role === 'vet') {
    return <VetHorseRoute currentUser={currentUser} loadingUser={loadingUser} loadError={loadError} onRetryUsers={onRetryUsers} owners={owners} />
  }
  const horse = horses.find((item) => String(item.id) === String(horseId))
  return <HorseProfilePage horse={horse} role={role} exam={null} owners={owners} />
}

function HorseProfilePage({ horse, role, exam, owners }) {
  const owner = owners.find((item) => String(item.ownerId) === String(horse?.ownerUserId ?? horse?.ownerId ?? ''))
  const backTo = role === 'owner' ? '/owner/horses' : role === 'vet' ? '/vet/horses-needing-exam' : '/manager/horses'
  const intakeStatus = horse?.intake?.examinationStatus || 'PENDING'
  const healthContent = horse ? <div className="health-summary-grid">
    <div className="info-item"><span>Tình trạng sức khỏe hiện tại</span><StatusBadge status={horse.healthStatus} type="health" /></div>
    <div className="info-item"><span>Trạng thái khám</span><StatusBadge status={intakeStatus} label={intakeStatus === 'COMPLETED' ? 'Đã khám' : 'Chờ khám'} type="exam" /></div>
    <div className="info-item"><span>Cập nhật gần nhất</span><strong>{horse.updatedAt || 'Chưa có thông tin'}</strong></div>
    {role === 'vet' && <section className="profile-section">
      <div className="section-title"><h2>Tiền sử khám</h2></div>
      {horse.examinations?.length ? horse.examinations.map((examination, index) => (
        <article className="panel" key={examination.id || `${examination.examinedAt || examination.examDate || 'exam'}-${index}`}>
          <strong>{examination.examinedAt || examination.examDate || 'Chưa có ngày khám'}</strong>
          {examination.weightKg != null && <p>Cân nặng: {examination.weightKg} kg</p>}
          {examination.heightCm != null && <p>Chiều cao: {examination.heightCm} cm</p>}
          {examination.symptoms && <p>Triệu chứng: {examination.symptoms}</p>}
          {examination.diagnosis && <p>Chẩn đoán: {examination.diagnosis}</p>}
          {(examination.treatmentPlan || examination.treatment) && <p>Xử trí: {examination.treatmentPlan || examination.treatment}</p>}
          {examination.conclusion && <p>Kết luận: {examination.conclusion}</p>}
        </article>
      )) : <p className="profile-copy">Chưa có dữ liệu khám.</p>}
    </section>}
  </div> : undefined
  const postExamPath = role === 'vet' ? `/vet/horses/${horse?.id}/examination` : `/${role}/horses/${horse?.id}/post-exam`

  return (
    <main className="page-content">
      <div className="horse-actions">
        <Link className="breadcrumb-back-button" to={backTo}>← Quay lại danh sách ngựa</Link>
        {horse && <div className="profile-actions">
          {role === 'manager' && <Link className="button" to={`/manager/horses/${horse.id}/intake`}>Hoàn tất tiếp nhận</Link>}
          {role === 'owner' && <Link className="button button-secondary" to={`/owner/horses/${horse.id}/correction-request`}>Yêu cầu hiệu chỉnh lý lịch</Link>}
          {role === 'vet' && <Link className="button" to={postExamPath}>Nhập kết quả khám</Link>}
          {role !== 'vet' && <Link className="button button-secondary" to={postExamPath}>Trạng thái hồ sơ</Link>}
        </div>}
      </div>
      {exam && <section className="horse-context-card exam-context-card"><div><h2>Yêu cầu khám {exam.examId}</h2><p>Ngày phân công: {exam.assignedAt}</p></div><StatusBadge status={exam.status} label={exam.status === 'Waiting' ? 'Chờ khám' : 'Đã khám'} /></section>}
      <HorseProfile horse={horse} owner={owner} healthContent={healthContent} />
    </main>
  )
}

function VetHorseRoute({ currentUser, loadingUser, loadError, onRetryUsers, owners, onSaveDraft, onFinalize, examination = false }) {
  const { horseId } = useParams()
  const [horse, setHorse] = useState(null)
  const [loadingHorse, setLoadingHorse] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [forbidden, setForbidden] = useState(false)
  const [error, setError] = useState('')
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let isCurrent = true

    async function loadHorse() {
      setHorse(null)
      setNotFound(false)
      setForbidden(false)
      setError('')

      if (loadingUser) return
      if (!currentUser && loadError) {
        setLoadingHorse(false)
        setError(loadError)
        return
      }
      if (currentUser?.role !== 'VET') {
        setLoadingHorse(false)
        setForbidden(true)
        return
      }

      setLoadingHorse(true)
      try {
        const result = normalizeHorse(await getHorseById(String(horseId)))
        if (!isCurrent) return
        setHorse(result)
        setForbidden(!isHorseAssignedToVet(result, currentUser))
        setLoadingHorse(false)
      } catch (loadError) {
        if (!isCurrent) return
        setLoadingHorse(false)
        if (loadError instanceof ApiError && loadError.status === 404) {
          setNotFound(true)
        } else if (loadError instanceof ApiError && (loadError.status === 401 || loadError.status === 403)) {
          setForbidden(true)
        } else {
          setError(loadError instanceof Error ? loadError.message : 'Không thể tải hồ sơ ngựa.')
        }
      }
    }

    void loadHorse()
    return () => {
      isCurrent = false
    }
  }, [horseId, currentUser, loadingUser, loadError, retryCount])

  if (loadingUser || loadingHorse) {
    return <main className="page-content"><section className="panel" role="status">Đang tải hồ sơ ngựa...</section></main>
  }
  if (!currentUser && loadError) {
    return <main className="page-content"><section className="panel"><h1>Không thể tải tài khoản</h1><p>{loadError}</p><button className="button" type="button" onClick={onRetryUsers}>Thử lại</button></section></main>
  }
  if (error) {
    return <main className="page-content"><section className="panel"><h1>Không thể tải hồ sơ ngựa</h1><p>{error}</p><button className="button" type="button" onClick={() => setRetryCount((count) => count + 1)}>Thử lại</button></section></main>
  }
  if (notFound) {
    return <main className="page-content"><section className="panel"><h1>Không tìm thấy ngựa</h1><p>Không có hồ sơ ngựa với mã {horseId}.</p><Link className="button" to="/vet/horses-needing-exam">Quay lại danh sách</Link></section></main>
  }
  if (forbidden || !horse) {
    return <main className="page-content"><section className="panel"><h1>Không có quyền truy cập</h1><p>Ngựa không thuộc câu lạc bộ hoặc không được phân công cho tài khoản Vet hiện tại.</p><Link className="button" to="/vet/horses-needing-exam">Quay lại danh sách</Link></section></main>
  }

  if (examination) {
    const owner = owners.find((item) => String(item.ownerId) === String(horse.ownerUserId))
    return <VetExaminationForm horse={horse} currentUser={currentUser} owner={owner} onSaveDraft={onSaveDraft} onFinalize={onFinalize} onHorseSaved={setHorse} />
  }

  return <HorseProfilePage horse={horse} role="vet" exam={null} owners={owners} />
}

function DemoPicker({ currentRole, currentUserId, users, onChangeRole, onChangeUser }) {
  const labels = { manager: 'QUẢN LÝ CÂU LẠC BỘ', owner: 'CHỦ SỞ HỮU NGỰA', vet: 'BÁC SĨ THÚ Y' }
  if (!users.length) return null

  return (
    <div className="demo-picker" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Vai trò</span>
        <select value={currentRole} onChange={(event) => onChangeRole(event.target.value)}>
          {Object.entries(labels).map(([role, label]) => <option key={role} value={role}>{label}</option>)}
        </select>
      </label>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Tài khoản</span>
        <select value={currentUserId} onChange={(event) => onChangeUser(event.target.value)}>
          {users.filter((user) => uiRoleFromUser(user.role) === currentRole).map((user) => <option key={user.id} value={user.id}>{user.fullName}</option>)}
        </select>
      </label>
    </div>
  )
}

function AppContent() {
  const [horses, setHorses] = useState([])
  const [exams, setExams] = useState([])
  const [correctionRequests, setCorrectionRequests] = useState([])
  const [archiveRecords, setArchiveRecords] = useState([])
  const [users, setUsers] = useState([])
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadRetryCount, setLoadRetryCount] = useState(0)
  const [selectedRole, setSelectedRole] = useState(() => localStorage.getItem('equi-demo-role') || 'manager')
  const [selectedUserId, setSelectedUserId] = useState(() => localStorage.getItem('equi-demo-user-id') || '')
  const { pathname } = useLocation()

  function retryLoadDemoData() {
    setLoading(true)
    setApiError('')
    setLoadRetryCount((count) => count + 1)
  }

  useEffect(() => {
    let isMounted = true

    const loadDemoData = async () => {
      try {
        const [apiUsers, apiHorses] = await Promise.all([getUsers(), getHorses()])
        if (!isMounted) return

        const normalizedUsers = apiUsers.map((user) => normalizeUser(user))
        const normalizedHorses = apiHorses.map((horse) => normalizeHorse(horse))

        setUsers(normalizedUsers)
        setHorses(normalizedHorses)
        setApiError('')
        setLoading(false)

        if (!localStorage.getItem('equi-demo-user-id') && normalizedUsers.length) {
          const firstManager = normalizedUsers.find((user) => user.role === 'CLUB_MANAGER') || normalizedUsers[0]
          setSelectedUserId(firstManager.id)
          setSelectedRole(uiRoleFromUser(firstManager.role))
        }
      } catch (error) {
        if (!isMounted) return
        setUsers([])
        setHorses([])
        setApiError(error instanceof Error ? error.message : 'Không thể kết nối MockAPI.')
        setLoading(false)
      }
    }

    loadDemoData()
    return () => {
      isMounted = false
    }
  }, [loadRetryCount])

  const normalizedOwners = useMemo(
    () => users.filter((user) => user.role === 'OWNER').map((user) => ({ ownerId: user.id, fullName: user.fullName, id: user.id })),
    [users],
  )
  const workflowWarnings = useMemo(
    () => horses.filter((horse) => horse.profileStatus === 'PENDING_EXAM'
      && horse.intake?.examinationStatus === 'COMPLETED'
      && horse.healthAssessment?.purpose === 'INTAKE'
      && horse.examinations?.some((item) => item.status === 'FINALIZED'
        && (item.purpose === 'INTAKE' || !item.purpose))),
    [horses],
  )
  const availableUsersForRole = useMemo(() => users.filter((user) => uiRoleFromUser(user.role) === selectedRole), [users, selectedRole])

  useEffect(() => {
    localStorage.setItem('equi-demo-role', selectedRole)
  }, [selectedRole])

  useEffect(() => {
    if (selectedUserId) localStorage.setItem('equi-demo-user-id', selectedUserId)
  }, [selectedUserId])

  const currentUser = users.find((user) => user.id === selectedUserId) || availableUsersForRole[0] || users[0] || null
  const resolvedRole = currentUser ? uiRoleFromUser(currentUser.role) : selectedRole
  const home = resolvedRole === 'owner' ? '/owner/horses' : resolvedRole === 'vet' ? '/vet/horses-needing-exam' : '/manager/horses'
  const requestedProfileRole = new URLSearchParams(window.location.search).get('role')
  const routeAllowed = pathname.startsWith('/owner') ? resolvedRole === 'owner' : pathname.startsWith('/vet') ? resolvedRole === 'vet' : pathname.startsWith('/manager') ? resolvedRole === 'manager' : pathname.startsWith('/horses/') ? (requestedProfileRole === 'vet' ? resolvedRole === 'vet' : resolvedRole === 'manager') : true
  const date = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).formatToParts(new Date()).filter((part) => ['day', 'month', 'year'].includes(part.type)).map((part) => part.value).join(' / ')

  async function updateHorse(horseId, updates) {
    const currentHorse = horses.find((horse) => String(horse.id) === String(horseId))
    if (!currentHorse) return null

    const nextHorse = normalizeHorse({
      ...currentHorse,
      ...updates,
      intake: { ...(currentHorse.intake ?? {}), ...((updates.intake ?? {}) || {}) },
      ownershipHistory: updates.ownershipHistory ?? currentHorse.ownershipHistory,
    })

    const savedHorse = await updateHorseApi(String(horseId), nextHorse)
    const normalizedSavedHorse = normalizeHorse(savedHorse)
    setHorses((current) => current.map((horse) => String(horse.id) === String(horseId) ? normalizedSavedHorse : horse))
    return normalizedSavedHorse
  }

  function syncHorse(savedHorse) {
    const normalizedHorse = normalizeHorse(savedHorse)
    setHorses((current) => current.map((horse) => String(horse.id) === normalizedHorse.id ? normalizedHorse : horse))
    return normalizedHorse
  }

  async function saveExaminationDraft(horseId, vet, input) {
    return syncHorse(await saveExaminationDraftApi(horseId, vet, input))
  }

  async function finalizeExamination(horseId, vet, input) {
    return syncHorse(await finalizeExaminationApi(horseId, vet, input))
  }

  async function completeIntake(horseId, managerId) {
    return syncHorse(await completeHorseIntakeApi(horseId, managerId))
  }

  function updateExam(examId, updates) {
    setExams((current) => current.map((exam) => exam.examId === examId ? { ...exam, ...updates } : exam))
  }

  function addCorrectionRequest(request) {
    setCorrectionRequests((current) => [{ ...request, requestId: `CR-${Date.now()}`, status: 'Pending', rejectionReason: '' }, ...current])
  }

  function archiveHorse(horseId, reason) {
    const horse = horses.find((item) => String(item.id) === String(horseId))
    if (!horse || !reason.trim()) return

    const archivedAt = new Date().toISOString()
    updateHorse(horseId, { profileStatus: 'ARCHIVED', updatedAt: archivedAt })
    setArchiveRecords((current) => {
      if (current.some((record) => String(record.horseId) === String(horseId))) return current
      return [{ archiveId: `AR-${Date.now()}`, horseId, reason: reason.trim(), archivedAt, archivedByRole: 'Club Manager' }, ...current]
    })
  }

  const vetHorseCount = currentUser?.role === 'VET'
    ? horses.filter((horse) => isHorseAssignedToVet(horse, currentUser)).length
    : 0

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <Link className="brand" to={home}><span className="brand-mark">E</span><span><strong>EQUITRACK</strong><small>RACETRACK PERFORMANCE</small></span></Link>
        <p className="sidebar-label">KHÔNG GIAN LÀM VIỆC</p>
        <nav className="side-nav" aria-label="Điều hướng chính">
          {resolvedRole === 'manager' && <><NavLink end to="/manager/horses"><NavIcon kind="manager" /><span>Danh sách ngựa</span></NavLink>{(pathname.includes('/intake') || pathname.includes('/post-exam')) && <span className="nav-context"><NavIcon kind="manager" /><span>{pathname.includes('/intake') ? 'Tiếp nhận / lưu trữ' : 'Trạng thái sau khám'}</span></span>}</>}
          {resolvedRole === 'owner' && <><NavLink end to="/owner/horses"><NavIcon kind="owner" /><span>Ngựa của tôi</span></NavLink>{pathname.startsWith('/owner/horses/') && <span className="nav-context"><NavIcon kind="owner" /><span>{pathname.includes('correction-request') ? 'Hiệu chỉnh lý lịch' : pathname.includes('post-exam') ? 'Sức khỏe sau khám' : 'Hồ sơ và sức khỏe'}</span></span>}</>}
          {resolvedRole === 'vet' && <><NavLink end to="/vet/horses-needing-exam"><NavIcon kind="vet" /><span>Hồ sơ khám</span>{vetHorseCount > 0 && <span className="nav-badge">{vetHorseCount}</span>}</NavLink>{pathname.startsWith('/vet/horses/') && <span className="nav-context"><NavIcon kind="vet" /><span>Hồ sơ chuyên môn</span></span>}</>}
        </nav>
        <div className="sidebar-support"><strong>Cần hỗ trợ?</strong><span>Liên hệ quản lý câu lạc bộ</span><span className="support-link">Trung tâm hỗ trợ</span></div>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <div className="topbar-workspace"><span className="topbar-kicker">{demoRoleLabels[resolvedRole]}</span><strong>Câu lạc bộ Hoàng Gia</strong></div>
          <div className="topbar-account">
            <span className="topbar-date">{date}</span>
            <DemoPicker currentRole={resolvedRole} currentUserId={currentUser?.id || ''} users={users} onChangeRole={(value) => { setSelectedRole(value); const nextUser = users.find((user) => uiRoleFromUser(user.role) === value); if (nextUser) setSelectedUserId(nextUser.id) }} onChangeUser={setSelectedUserId} />
            <div className="topbar-user">
              <span className="avatar" aria-hidden="true">{(currentUser?.fullName || 'E').split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</span>
              <div className="account-name"><strong>{currentUser?.fullName || 'Demo manager'}</strong><span><i />{loading ? 'Đang tải...' : 'Đang hoạt động'}</span></div>
            </div>
          </div>
        </header>
        {apiError && <div className="alert-banner" style={{ margin: '12px 24px 0', background: '#fff4f4', color: '#7a1d1d', border: '1px solid #f7c2c2', borderRadius: 8, padding: '10px 12px' }}>{apiError}</div>}
        {workflowWarnings.length > 0 && <div className="alert-banner" role="alert" style={{ margin: '12px 24px 0', background: '#fff8e7', color: '#684b00', border: '1px solid #f0d58a', borderRadius: 8, padding: '10px 12px' }}>
          Dữ liệu quy trình lệch ở {workflowWarnings.map((horse) => `#${horse.code || horse.id}`).join(', ')}: đã có phiếu khám đầu vào FINALIZED và tiếp nhận khám COMPLETED nhưng hồ sơ vẫn PENDING_EXAM. Không tự sửa dữ liệu; Manager cần xác minh lịch sử rồi cập nhật có kiểm soát sang PENDING_COMPLETION.
        </div>}
        {!routeAllowed && (
          <main className="page-content"><section className="panel"><h1>Không có quyền truy cập</h1><p>Trang này không phù hợp với tài khoản hiện tại.</p><Link className="button" to={home}>Về trang chính</Link></section></main>
        )}
        {routeAllowed && <Routes>
          <Route path="/" element={<Navigate to={home} replace />} />
          <Route path="/manager/horses" element={<HorseList horses={horses} owners={normalizedOwners} currentUser={currentUser} />} />
          <Route path="/manager/horses/new" element={<ManagerHorseFormRoute currentUser={currentUser} users={users} horses={horses} onHorseCreated={(horse) => setHorses((current) => [normalizeHorse(horse), ...current])} onUserCreated={(user) => setUsers((current) => [normalizeUser(user), ...current])} />} />
          <Route path="/horses/:horseId" element={<ProfileRoute horses={horses} owners={normalizedOwners} currentUser={currentUser} loadingUser={loading} loadError={apiError} onRetryUsers={retryLoadDemoData} />} />
          <Route path="/manager/horses/:horseId/intake" element={<ManagerIntakeRoute horses={horses} users={users} currentUser={currentUser} archiveRecords={archiveRecords} onUpdateHorse={updateHorse} onCompleteIntake={completeIntake} onArchiveHorse={archiveHorse} />} />
          <Route path="/manager/horses/:horseId/post-exam" element={<RolePostExamRoute horses={horses} exams={exams} viewerRole="manager" onUpdateHorse={updateHorse} onUpdateExam={updateExam} />} />
          <Route path="/owner/horses" element={<OwnerHorses horses={horses} currentUser={currentUser} owners={normalizedOwners} />} />
          <Route path="/owner/horses/:horseId" element={<OwnerProfileRoute horses={horses} currentUser={currentUser} owners={normalizedOwners} />} />
          <Route path="/owner/horses/:horseId/correction-request" element={<OwnerCorrectionRoute horses={horses} requests={correctionRequests} onSubmitRequest={addCorrectionRequest} currentUser={currentUser} />} />
          <Route path="/owner/horses/:horseId/post-exam" element={<OwnerPostExamRoute horses={horses} exams={exams} onUpdateHorse={updateHorse} onUpdateExam={updateExam} currentUser={currentUser} />} />
          <Route path="/vet/horses-needing-exam" element={<HorsesNeedingExam horses={horses} currentUser={currentUser} owners={normalizedOwners} />} />
          <Route path="/vet/horses/:horseId" element={<VetHorseRoute currentUser={currentUser} loadingUser={loading} loadError={apiError} onRetryUsers={retryLoadDemoData} owners={normalizedOwners} />} />
          <Route path="/vet/horses/:horseId/examination" element={<VetHorseRoute currentUser={currentUser} loadingUser={loading} loadError={apiError} onRetryUsers={retryLoadDemoData} owners={normalizedOwners} onSaveDraft={saveExaminationDraft} onFinalize={finalizeExamination} examination />} />
          <Route path="*" element={<main className="page-content"><section className="panel"><h1>Không tìm thấy trang</h1><Link to={home}>Quay lại</Link></section></main>} />
        </Routes>}
        <footer className="app-footer">EQUITRACK · Quản lý đào tạo ngựa đua</footer>
      </div>
    </div>
  )
}

function ManagerHorseFormRoute({ currentUser, users, horses, onHorseCreated, onUserCreated }) {
  const navigate = useNavigate()
  const ownerOptions = users.filter((user) => user.role === 'OWNER' && String(user.clubId) === String(currentUser?.clubId ?? '1'))
  const [formState, setFormState] = useState({
    code: '', name: '', breed: '', dateOfBirth: '', sex: 'MALE', coatColor: '', registrationNumber: '', microchipNumber: '', sireId: '', damId: '', ownerUserId: ownerOptions[0]?.id || '',
  })
  const [ownerForm, setOwnerForm] = useState({ fullName: '', phone: '', email: '', address: '' })
  const [showOwnerForm, setShowOwnerForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChange = (field) => (event) => {
    setFormState((current) => ({ ...current, [field]: event.target.value }))
  }

  async function handleCreateOwner(event) {
    event.preventDefault()
    const fullName = ownerForm.fullName.trim()
    const email = ownerForm.email.trim()
    if (!fullName || !email) {
      setError('Vui lòng nhập đầy đủ họ tên và email cho chủ sở hữu mới.')
      return
    }

    setSubmitting(true)
    try {
      const payload = { clubId: String(currentUser?.clubId ?? '1'), fullName, phone: ownerForm.phone.trim(), email, address: ownerForm.address.trim(), role: 'OWNER', isActive: true }
      const created = await createUserApi(payload)
      const normalized = normalizeUser(created)
      onUserCreated(normalized)
      setFormState((current) => ({ ...current, ownerUserId: normalized.id }))
      setOwnerForm({ fullName: '', phone: '', email: '', address: '' })
      setShowOwnerForm(false)
      setSuccess('Đã tạo chủ sở hữu mới.')
      setError('')
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Không thể tạo chủ sở hữu mới.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const trimmed = {
      ...Object.fromEntries(Object.entries(formState).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])),
      ownerUserId: formState.ownerUserId.trim() || ownerOptions[0]?.id || '',
    }
    if (!trimmed.code || !trimmed.name || !trimmed.breed || !trimmed.dateOfBirth || !trimmed.ownerUserId) {
      setError('Vui lòng nhập mã ngựa, tên, giống, ngày sinh và chủ sở hữu.')
      return
    }

    const duplicateCode = horses.some((horse) => String(horse.clubId) === String(currentUser?.clubId ?? '1') && String(horse.code).toLowerCase() === String(trimmed.code).toLowerCase())
    if (duplicateCode) {
      setError('Mã ngựa đã tồn tại trong cùng câu lạc bộ.')
      return
    }

    const createdAt = new Date().toISOString()
    const payload = {
      clubId: String(currentUser?.clubId ?? '1'),
      code: trimmed.code,
      name: trimmed.name,
      breed: trimmed.breed,
      dateOfBirth: trimmed.dateOfBirth,
      sex: trimmed.sex,
      coatColor: trimmed.coatColor,
      registrationNumber: trimmed.registrationNumber,
      microchipNumber: trimmed.microchipNumber,
      sireId: trimmed.sireId || '',
      damId: trimmed.damId || '',
      ownerUserId: trimmed.ownerUserId,
      profileStatus: 'DRAFT',
      healthStatus: 'NOT_ASSESSED',
      intake: {},
      healthAssessment: {},
      ownershipHistory: [{ id: `own-${createdAt.replace(/\D/g, '')}`, ownerUserId: trimmed.ownerUserId, effectiveFrom: trimmed.dateOfBirth, effectiveTo: '' }],
      examinations: [],
      medicalRecords: [],
      vaccinations: [],
      documents: [],
      correctionRequests: [],
      auditLogs: [{ id: `log-${createdAt.replace(/\D/g, '')}`, actorId: currentUser?.id ?? 'system', action: 'CREATE_HORSE', description: 'Tạo hồ sơ ngựa mới', createdAt }],
      createdAt,
      updatedAt: createdAt,
    }

    setSubmitting(true)
    try {
      const createdHorse = await createHorseApi(payload)
      onHorseCreated(createdHorse)
      setSuccess('Tạo ngựa thành công.')
      setError('')
      navigate(`/horses/${createdHorse.id}`)
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Không thể tạo ngựa mới.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="page-content">
      <nav className="breadcrumb" aria-label="Đường dẫn">Quản lý <span aria-hidden="true">/</span> Thêm ngựa</nav>
      <header className="page-heading"><div><p className="eyebrow">DANH SÁCH NGỰA</p><h1>Thêm ngựa</h1><p>Nhập thông tin cơ bản và gắn chủ sở hữu trong cùng câu lạc bộ.</p></div></header>
      <section className="panel">
        {error && <div className="alert-banner" style={{ marginBottom: 12, background: '#fff4f4', color: '#7a1d1d', border: '1px solid #f7c2c2', borderRadius: 8, padding: '10px 12px' }}>{error}</div>}
        {success && <div className="alert-banner" style={{ marginBottom: 12, background: '#f1fff3', color: '#1b5e20', border: '1px solid #b7e4c1', borderRadius: 8, padding: '10px 12px' }}>{success}</div>}
        <form onSubmit={handleSubmit} className="horse-form-grid">
          <label className="form-field"><span>Mã ngựa</span><input value={formState.code} onChange={handleChange('code')} required /></label>
          <label className="form-field"><span>Tên ngựa</span><input value={formState.name} onChange={handleChange('name')} required /></label>
          <label className="form-field"><span>Giống</span><input value={formState.breed} onChange={handleChange('breed')} required /></label>
          <label className="form-field"><span>Ngày sinh</span><input type="date" value={formState.dateOfBirth} onChange={handleChange('dateOfBirth')} required /></label>
          <label className="form-field"><span>Giới tính</span><select value={formState.sex} onChange={handleChange('sex')}><option value="MALE">Nam</option><option value="FEMALE">Nữ</option><option value="GELDING">Gelding</option></select></label>
          <label className="form-field"><span>Màu lông</span><input value={formState.coatColor} onChange={handleChange('coatColor')} /></label>
          <label className="form-field"><span>Số đăng ký</span><input value={formState.registrationNumber} onChange={handleChange('registrationNumber')} /></label>
          <label className="form-field"><span>Microchip</span><input value={formState.microchipNumber} onChange={handleChange('microchipNumber')} /></label>
          <label className="form-field"><span>Cha</span><input value={formState.sireId} onChange={handleChange('sireId')} placeholder="ID cha" /></label>
          <label className="form-field"><span>Mẹ</span><input value={formState.damId} onChange={handleChange('damId')} placeholder="ID mẹ" /></label>
          <label className="form-field"><span>Chủ sở hữu</span><select value={formState.ownerUserId || ownerOptions[0]?.id || ''} onChange={handleChange('ownerUserId')}><option value="">Chọn chủ sở hữu</option>{ownerOptions.map((owner) => <option key={owner.id} value={owner.id}>{owner.fullName}</option>)}</select></label>
          <div className="form-field form-actions-inline" style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
            <button type="button" className="button button-secondary" onClick={() => setShowOwnerForm((current) => !current)}>{showOwnerForm ? 'Đóng' : 'Tạo Owner mới'}</button>
            <button type="submit" className="button" disabled={submitting}>{submitting ? 'Đang lưu...' : 'Lưu ngựa'}</button>
          </div>
        </form>
        {showOwnerForm && (
          <form onSubmit={handleCreateOwner} className="horse-form-grid" style={{ marginTop: 24 }}>
            <label className="form-field"><span>Họ tên chủ sở hữu</span><input value={ownerForm.fullName} onChange={(event) => setOwnerForm((current) => ({ ...current, fullName: event.target.value }))} required /></label>
            <label className="form-field"><span>Số điện thoại</span><input value={ownerForm.phone} onChange={(event) => setOwnerForm((current) => ({ ...current, phone: event.target.value }))} /></label>
            <label className="form-field"><span>Email</span><input type="email" value={ownerForm.email} onChange={(event) => setOwnerForm((current) => ({ ...current, email: event.target.value }))} required /></label>
            <label className="form-field"><span>Địa chỉ</span><input value={ownerForm.address} onChange={(event) => setOwnerForm((current) => ({ ...current, address: event.target.value }))} /></label>
            <div className="form-field form-actions-inline"><button type="submit" className="button" disabled={submitting}>Lưu Owner</button></div>
          </form>
        )}
      </section>
    </main>
  )
}

function OwnerProfileRoute({ horses, currentUser, owners }) {
  const { horseId } = useParams()
  const horse = horses.find((item) => String(item.id) === String(horseId) && String(item.ownerUserId) === String(currentUser?.id || ''))
  return <HorseProfilePage horse={horse} role="owner" exam={null} owners={owners} />
}

function OwnerCorrectionRoute({ horses, requests, onSubmitRequest, currentUser }) {
  const { horseId } = useParams()
  const ownedHorses = horses.filter((item) => String(item.ownerUserId) === String(currentUser?.id || ''))
  const horse = ownedHorses.find((item) => String(item.id) === String(horseId))
  return <OwnerCorrectionRequest horses={ownedHorses} requests={requests.filter((request) => String(request.ownerId) === String(currentUser?.id || ''))} onSubmitRequest={onSubmitRequest} currentUser={currentUser} horseOverride={horse} />
}

function ManagerIntakeRoute({ horses, users, currentUser, archiveRecords, onUpdateHorse, onCompleteIntake, onArchiveHorse }) {
  const { horseId } = useParams()
  const horse = horses.find((item) => String(item.id) === String(horseId))
  const archiveRecord = archiveRecords.find((record) => String(record.horseId) === String(horseId))
  return <CompleteIntake horses={horses} horse={horse} users={users} currentUser={currentUser} archiveRecord={archiveRecord} onUpdateHorse={onUpdateHorse} onCompleteIntake={onCompleteIntake} onArchiveHorse={onArchiveHorse} />
}

function OwnerPostExamRoute({ horses, exams, currentUser, onUpdateHorse, onUpdateExam }) {
  const { horseId } = useParams()
  const horse = horses.find((item) => String(item.id) === String(horseId) && String(item.ownerUserId) === String(currentUser?.id || ''))
  const exam = exams.find((item) => String(item.horseId) === String(horse?.id))
  return <PostExamStatus horse={horse} exam={exam} viewerRole="owner" onUpdateHorse={onUpdateHorse} onUpdateExam={onUpdateExam} />
}

function RolePostExamRoute({ horses, exams, viewerRole, onUpdateHorse, onUpdateExam }) {
  const { horseId, examId } = useParams()
  const exam = viewerRole === 'vet'
    ? exams.find((item) => (examId ? item.examId === examId : String(item.horseId) === String(horseId)))
    : exams.find((item) => String(item.horseId) === String(horseId))
  const resolvedHorseId = viewerRole === 'vet' ? exam?.horseId : horseId
  const horse = horses.find((item) => String(item.id) === String(resolvedHorseId))
  return <PostExamStatus horse={horse} exam={exam} viewerRole={viewerRole} onUpdateHorse={onUpdateHorse} onUpdateExam={onUpdateExam} />
}

function App() {
  return <BrowserRouter><AppContent /></BrowserRouter>
}

export default App
