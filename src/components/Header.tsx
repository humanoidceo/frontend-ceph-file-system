import type { CurrentUser } from '../types/auth';

interface HeaderProps {
  user: CurrentUser | null;
  isLoggingOut: boolean;
  onLogout: () => void;
}

export function Header({ user, isLoggingOut, onLogout }: HeaderProps) {
  return (
    <header className="topbar app-header">
      <div>
        <p className="eyebrow">Local testing</p>
        <h1>MOPH Ceph File Storage</h1>
      </div>

      {user && (
        <div className="topbar-user">
          <div>
            <strong>
              {user.name}
              <span className={`role-badge role-${user.role}`}>{user.role}</span>
            </strong>
            <span>{user.email}</span>
            <span className="department-badge">{user.department ? user.department.name : 'No department'}</span>
          </div>
          <button className="secondary-button" type="button" onClick={onLogout} disabled={isLoggingOut}>
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      )}
    </header>
  );
}
