import { DepartmentManagement } from './DepartmentManagement';
import { UserManagement } from './UserManagement';

export function AdminDashboard() {
  return (
    <div className="admin-dashboard-shell">
      <section className="panel admin-overview">
        <div className="panel-heading compact-heading">
          <div>
            <h2>Admin Dashboard</h2>
            <p>Create departments, create users, assign departments, and manage transfer limits.</p>
          </div>
        </div>
      </section>

      <div className="admin-dashboard">
        <DepartmentManagement />
        <UserManagement />
      </div>
    </div>
  );
}
