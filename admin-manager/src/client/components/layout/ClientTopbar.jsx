import Topbar from "../../../components/layout/Topbar.jsx";

export default function ClientTopbar({ onMenuClick, onToggleSidebar }) {
  return <Topbar onMenuClick={onMenuClick || onToggleSidebar} />;
}
