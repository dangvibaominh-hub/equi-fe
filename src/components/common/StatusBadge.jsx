const statusLabels = {
  Approved: 'Đã duyệt',
  Pending: 'Chờ duyệt',
  Rejected: 'Từ chối',
  Inactive: 'Không hoạt động',
  Unknown: 'Chưa xác định',
  Healthy: 'Khỏe mạnh',
  Monitor: 'Theo dõi',
  Injured: 'Chấn thương',
  Recovering: 'Đang hồi phục',
  Isolated: 'Cách ly',
}

function StatusBadge({ status, type = 'default', label }) {
  const normalizedStatus = status?.toLowerCase()

  return <span className={`status-badge status-${type}-${normalizedStatus}`}>{label || statusLabels[status] || status || 'Chưa xác định'}</span>
}

export default StatusBadge
