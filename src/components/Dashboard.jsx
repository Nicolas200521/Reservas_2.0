import { isAdmin } from '../utils/roles';
import AdminDashboard from './AdminDashboard';
import UserDashboard from './UserDashboard';

function Dashboard({ user, onLogout }) {
  const userIsAdmin = isAdmin(user);

  // Renderizar el dashboard correspondiente según el rol
  if (userIsAdmin) {
    return <AdminDashboard user={user} onLogout={onLogout} />;
  }

  return <UserDashboard user={user} onLogout={onLogout} />;
}

export default Dashboard;

