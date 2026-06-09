import { FormEvent, useEffect, useState } from 'react';
import { getDepartments } from '../services/departmentService';
import {
  createUser,
  deleteUser,
  getUsers,
  updateUser,
  updateUserLimits,
} from '../services/adminUserService';
import type { Department } from '../types/department';
import type { ManagedUser, UserPayload, UserRole } from '../types/user';

type SizeUnit = 'bytes' | 'MB' | 'GB';

const bytesFromUnit = (value: string, unit: SizeUnit) => {
  if (value.trim() === '') return null;

  const amount = Number(value);

  if (Number.isNaN(amount)) return null;
  if (unit === 'GB') return Math.round(amount * 1024 * 1024 * 1024);
  if (unit === 'MB') return Math.round(amount * 1024 * 1024);

  return Math.round(amount);
};

const valueFromBytes = (value?: number | null) => (value == null ? '' : String(value));

const formatBytes = (size?: number | null) => {
  if (size === null) return 'Unlimited';
  if (!size) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const unitIndex = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  const value = size / 1024 ** unitIndex;
  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

const usagePercent = (used?: number | null, limit?: number | null) => {
  if (!limit) return null;

  return Math.min(100, Math.round(((used ?? 0) / limit) * 100));
};

const progressTone = (percent: number | null) => {
  if (percent === null) return 'progress-neutral';
  if (percent >= 90) return 'progress-danger';
  if (percent >= 60) return 'progress-warning';

  return 'progress-success';
};

const LimitUsageCell = ({ used, limit }: { used?: number | null; limit?: number | null }) => {
  const percent = usagePercent(used, limit);

  return (
    <div className="limit-cell">
      <strong>{formatBytes(used)} / {formatBytes(limit)}</strong>
      <div className="usage-bar">
        <span className={progressTone(percent)} style={{ width: `${percent ?? 0}%` }} />
      </div>
      <small>{percent === null ? 'Unlimited' : `${percent}% used`}</small>
    </div>
  );
};

export function UserManagement() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [departmentId, setDepartmentId] = useState('');
  const [maxUploadChunkBytes, setMaxUploadChunkBytes] = useState('');
  const [maxUploadChunkUnit, setMaxUploadChunkUnit] = useState<SizeUnit>('MB');
  const [maxDownloadChunkBytes, setMaxDownloadChunkBytes] = useState('');
  const [maxDownloadChunkUnit, setMaxDownloadChunkUnit] = useState<SizeUnit>('MB');
  const [dailyUploadLimitBytes, setDailyUploadLimitBytes] = useState('');
  const [dailyUploadLimitUnit, setDailyUploadLimitUnit] = useState<SizeUnit>('GB');
  const [dailyDownloadLimitBytes, setDailyDownloadLimitBytes] = useState('');
  const [dailyDownloadLimitUnit, setDailyDownloadLimitUnit] = useState<SizeUnit>('GB');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadData = async () => {
    setError('');

    try {
      const [nextUsers, nextDepartments] = await Promise.all([getUsers(), getDepartments()]);
      setUsers(nextUsers);
      setDepartments(nextDepartments);
    } catch {
      setError('Could not load admin user data.');
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const resetForm = () => {
    setEditing(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('user');
    setDepartmentId('');
    setMaxUploadChunkBytes('');
    setMaxUploadChunkUnit('MB');
    setMaxDownloadChunkBytes('');
    setMaxDownloadChunkUnit('MB');
    setDailyUploadLimitBytes('');
    setDailyUploadLimitUnit('GB');
    setDailyDownloadLimitBytes('');
    setDailyDownloadLimitUnit('GB');
  };

  const limitsPayload = () => ({
    max_upload_chunk_bytes: bytesFromUnit(maxUploadChunkBytes, maxUploadChunkUnit),
    max_download_chunk_bytes: bytesFromUnit(maxDownloadChunkBytes, maxDownloadChunkUnit),
    daily_upload_limit_bytes: bytesFromUnit(dailyUploadLimitBytes, dailyUploadLimitUnit),
    daily_download_limit_bytes: bytesFromUnit(dailyDownloadLimitBytes, dailyDownloadLimitUnit),
  });

  const payload = (): UserPayload => ({
    name,
    email,
    password: password || undefined,
    role,
    department_id: departmentId ? Number(departmentId) : null,
    ...limitsPayload(),
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      if (editing) {
        await updateUser(editing.id, payload());
        setMessage('User updated.');
      } else {
        await createUser(payload());
        setMessage('User created.');
      }

      resetForm();
      await loadData();
    } catch {
      setError('User save failed. Check email uniqueness, role, and required fields.');
    }
  };

  const handleEdit = (user: ManagedUser) => {
    setEditing(user);
    setName(user.name);
    setEmail(user.email);
    setPassword('');
    setRole(user.role);
    setDepartmentId(user.department_id?.toString() ?? '');
    setMaxUploadChunkBytes(valueFromBytes(user.max_upload_chunk_bytes));
    setMaxUploadChunkUnit('bytes');
    setMaxDownloadChunkBytes(valueFromBytes(user.max_download_chunk_bytes));
    setMaxDownloadChunkUnit('bytes');
    setDailyUploadLimitBytes(valueFromBytes(user.daily_upload_limit_bytes));
    setDailyUploadLimitUnit('bytes');
    setDailyDownloadLimitBytes(valueFromBytes(user.daily_download_limit_bytes));
    setDailyDownloadLimitUnit('bytes');
  };

  const handleUpdateLimits = async () => {
    if (!editing) return;

    setMessage('');
    setError('');

    try {
      await updateUserLimits(editing.id, limitsPayload());
      setMessage(`Limits updated for ${editing.email}.`);
      await loadData();
    } catch {
      setError('Limit update failed. Check the limit values.');
    }
  };

  const handleDelete = async (user: ManagedUser) => {
    if (!window.confirm(`Delete ${user.email}?`)) return;

    setMessage('');
    setError('');

    try {
      await deleteUser(user.id);
      setMessage('User deleted.');
      await loadData();
    } catch {
      setError('User delete failed.');
    }
  };

  return (
    <section className="panel admin-card">
      <div className="panel-heading">
        <div>
          <h2>User Management</h2>
          <p>Create users, assign departments, roles, and transfer limits.</p>
        </div>
      </div>

      <form className="admin-form user-form" onSubmit={handleSubmit}>
        <label><span>Name</span><input required value={name} onChange={(event) => setName(event.target.value)} /></label>
        <label><span>Email</span><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label><span>Password</span><input required={!editing} type="password" value={password} placeholder={editing ? 'Leave blank to keep' : 'password'} onChange={(event) => setPassword(event.target.value)} /></label>
        <label>
          <span>Role</span>
          <select value={role} onChange={(event) => setRole(event.target.value as UserRole)}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <label>
          <span>Department</span>
          <select value={departmentId} onChange={(event) => setDepartmentId(event.target.value)}>
            <option value="">No department</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.code ? `${department.name} (${department.code})` : department.name}
              </option>
            ))}
          </select>
        </label>
        <label><span>Max upload chunk</span><input min="1" type="number" value={maxUploadChunkBytes} placeholder="Blank = unlimited" onChange={(event) => setMaxUploadChunkBytes(event.target.value)} /></label>
        <label><span>Unit</span><select value={maxUploadChunkUnit} onChange={(event) => setMaxUploadChunkUnit(event.target.value as SizeUnit)}><option value="MB">MB</option><option value="GB">GB</option><option value="bytes">Bytes</option></select></label>
        <label><span>Max download chunk</span><input min="1" type="number" value={maxDownloadChunkBytes} placeholder="Blank = unlimited" onChange={(event) => setMaxDownloadChunkBytes(event.target.value)} /></label>
        <label><span>Unit</span><select value={maxDownloadChunkUnit} onChange={(event) => setMaxDownloadChunkUnit(event.target.value as SizeUnit)}><option value="MB">MB</option><option value="GB">GB</option><option value="bytes">Bytes</option></select></label>
        <label><span>Daily upload limit</span><input min="1" type="number" value={dailyUploadLimitBytes} placeholder="Blank = unlimited" onChange={(event) => setDailyUploadLimitBytes(event.target.value)} /></label>
        <label><span>Unit</span><select value={dailyUploadLimitUnit} onChange={(event) => setDailyUploadLimitUnit(event.target.value as SizeUnit)}><option value="GB">GB</option><option value="MB">MB</option><option value="bytes">Bytes</option></select></label>
        <label><span>Daily download limit</span><input min="1" type="number" value={dailyDownloadLimitBytes} placeholder="Blank = unlimited" onChange={(event) => setDailyDownloadLimitBytes(event.target.value)} /></label>
        <label><span>Unit</span><select value={dailyDownloadLimitUnit} onChange={(event) => setDailyDownloadLimitUnit(event.target.value as SizeUnit)}><option value="GB">GB</option><option value="MB">MB</option><option value="bytes">Bytes</option></select></label>
        <div className="admin-form-actions">
          <button className="primary-button">{editing ? 'Update User' : 'Create User'}</button>
          {editing && <button type="button" onClick={() => void handleUpdateLimits()}>Update Limits Only</button>}
          {editing && <button type="button" onClick={resetForm}>Cancel</button>}
        </div>
      </form>

      {message && <div className="alert success">{message}</div>}
      {error && <div className="alert error">{error}</div>}

      <div className="admin-table-wrap">
        <table className="admin-table user-admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Department</th>
              <th>Max Upload Chunk</th>
              <th>Daily Upload Used / Limit</th>
              <th>Daily Download Used / Limit</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td><span className={`role-badge role-${user.role}`}>{user.role}</span></td>
                <td>{user.department?.name ?? '-'}</td>
                <td>{formatBytes(user.max_upload_chunk_bytes)}</td>
                <td>
                  <LimitUsageCell
                    used={user.daily_upload_used_bytes}
                    limit={user.daily_upload_limit_bytes}
                  />
                </td>
                <td>
                  <LimitUsageCell
                    used={user.daily_download_used_bytes}
                    limit={user.daily_download_limit_bytes}
                  />
                </td>
                <td>
                  <div className="action-buttons compact-actions">
                    <button className="info-button" type="button" onClick={() => handleEdit(user)}>Edit</button>
                    <button className="secondary-button" type="button" onClick={() => handleEdit(user)}>Update Limits</button>
                    <button className="danger-button" type="button" onClick={() => void handleDelete(user)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
