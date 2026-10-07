import StatusBadge from '../common/StatusBadge.jsx'
import { formatHorseGender } from './horseLabels.js'

function Value({ label, children }) {
  return <div className="info-item"><span>{label}</span><strong>{children ?? '—'}</strong></div>
}

function HorseBasicInfo({ horse }) {
  return (
    <section className="profile-section">
      <div className="section-title"><h2>Thông tin lý lịch</h2></div>
      <div className="info-grid">
        <Value label="Mã ngựa">{horse.horseId}</Value>
        <Value label="Tên ngựa">{horse.horseName}</Value>
        <Value label="Giống">{horse.breed}</Value>
        <Value label="Ngày sinh">{horse.dateOfBirth}</Value>
        <Value label="Giới tính">{formatHorseGender(horse.gender)}</Value>
        <Value label="Màu lông">{horse.coatColor}</Value>
        <Value label="Trạng thái hồ sơ"><StatusBadge status={horse.registrationStatus} type="registration" /></Value>
        <Value label="Mã câu lạc bộ">{horse.clubId}</Value>
        <Value label="Ngày tạo">{horse.createdAt}</Value>
        <Value label="Cập nhật lần cuối">{horse.updatedAt}</Value>
      </div>
    </section>
  )
}

export default HorseBasicInfo
