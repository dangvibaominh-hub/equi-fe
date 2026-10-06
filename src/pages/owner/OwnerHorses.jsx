import { Link } from 'react-router-dom'
import EmptyState from '../../components/common/EmptyState.jsx'
import StatusBadge from '../../components/common/StatusBadge.jsx'
import { mockCurrentOwnerId } from '../../mock/workflow.js'
import { owners } from '../../mock/owners.js'
import { formatHorseGender } from '../../components/horse/horseLabels.js'

function OwnerHorses({ horses }) {
  const ownedHorses = horses.filter((horse) => horse.ownerId === mockCurrentOwnerId)
  const owner = owners.find((item) => item.ownerId === mockCurrentOwnerId)

  return (
    <main className="page-content">
      <nav className="breadcrumb" aria-label="Đường dẫn">Ngựa của tôi</nav>
      <header className="page-heading"><div><p className="eyebrow">CHỦ SỞ HỮU NGỰA · {owner?.fullName || 'CHỦ SỞ HỮU'}</p><h1>Ngựa của tôi</h1><p>Theo dõi hồ sơ và tình trạng sức khỏe của những ngựa thuộc sở hữu của bạn.</p></div></header>
      {ownedHorses.length === 0 ? <EmptyState title="Bạn chưa có ngựa nào trong hệ thống" description="Các ngựa thuộc quyền sở hữu của bạn sẽ xuất hiện tại đây." /> : (
        <div className="card-grid">
          {ownedHorses.map((horse) => <article className="panel horse-card" key={horse.horseId}>
            <span className="profile-id">Mã ngựa #{horse.horseId}</span><h2>{horse.horseName}</h2><p>{horse.breed} · {formatHorseGender(horse.gender)}</p>
            <dl className="card-statuses"><div><dt>Trạng thái hồ sơ</dt><dd><StatusBadge status={horse.registrationStatus} type="registration" /></dd></div><div><dt>Sức khỏe</dt><dd><StatusBadge status={horse.currentHealthStatus} type="health" /></dd></div></dl>
            <Link className="button" to={`/owner/horses/${horse.horseId}`}>Mở hồ sơ và sức khỏe</Link>
          </article>)}
        </div>
      )}
    </main>
  )
}

export default OwnerHorses
