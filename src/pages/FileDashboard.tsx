import { useEffect, useState } from 'react';
import { AdminOverview } from '../components/admin/AdminOverview';
import { AppShell } from '../components/layout/AppShell';
import { SectionHeader } from '../components/layout/SectionHeader';
import { ChunkUpload } from './ChunkUpload';
import { DepartmentQuotaCard } from './DepartmentQuotaCard';
import { DepartmentManagement } from './DepartmentManagement';
import { FileTable } from './FileTable';
import { Header } from './Header';
import { LoginPanel } from './LoginPanel';
import { UserOverview } from '../components/user/UserOverview';
import { UserManagement } from './UserManagement';
import { UserTransferQuotaCard } from './UserTransferQuotaCard';
import {
  ApiError,
  createPublicLink,
  deleteDepartmentShare,
  deleteFile,
  downloadFile,
  getFiles,
  removePublicLink,
  shareToDepartment,
  viewFile,
} from '../services/fileService';
import { getCurrentUser, logout } from '../services/authService';
import type { CurrentUser } from '../types/auth';
import type { ApiValidationErrors, Department, DepartmentSharePayload, FileItem } from '../types/file';

const formatError = (error: unknown) => {
  if (error instanceof ApiError) {
    const validationMessages = flattenValidationErrors(error.errors);

    return validationMessages.length > 0
      ? `${error.message}: ${validationMessages.join(' ')}`
      : error.message;
  }

  return 'Something went wrong. Please try again.';
};

const flattenValidationErrors = (errors?: ApiValidationErrors) => {
  if (!errors) {
    return [];
  }

  return Object.entries(errors).flatMap(([field, messages]) =>
    messages.map((message) => `${field}: ${message}`),
  );
};

export function FileDashboard() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [activeModule, setActiveModule] = useState('overview');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [listError, setListError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [departmentRefreshKey, setDepartmentRefreshKey] = useState(0);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

  const loadFiles = async () => {
    if (!user) {
      setFiles([]);
      setIsFetching(false);
      return;
    }

    setIsFetching(true);
    setListError('');

    try {
      const nextFiles = await getFiles();
      setFiles(nextFiles);
    } catch (error) {
      setListError(formatError(error));
    } finally {
      setIsFetching(false);
    }
  };

  const refreshCurrentUser = async () => {
    if (!user) {
      return;
    }

    try {
      const nextUser = await getCurrentUser();
      setUser(nextUser);
    } catch {
      // Keep the current session display if the refresh fails; the next API error will surface normally.
    }
  };

  useEffect(() => {
    if (user) {
      setSelectedDepartment(user.department ?? null);
      setActiveModule('overview');
      void loadFiles();
      return;
    }

    setFiles([]);
    setIsFetching(false);
    setSelectedDepartment(null);
    setActiveModule('overview');
  }, [user]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setActionMessage('');
    setActionError('');

    try {
      await logout();
      setUser(null);
      setFiles([]);
      setSelectedDepartment(null);
    } catch (error) {
      setActionError(formatError(error));
    } finally {
      setIsLoggingOut(false);
    }
  };

  const runAction = async (key: string, task: () => Promise<{ message: string }>) => {
    setActionId(key);
    setActionMessage('');
    setActionError('');

    try {
      const response = await task();
      setActionMessage(response.message);
      await loadFiles();
      await refreshCurrentUser();
      setDepartmentRefreshKey((key) => key + 1);
    } catch (error) {
      setActionError(formatError(error));
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = (id: number) => {
    const confirmed = window.confirm(`Delete file #${id}? This cannot be undone.`);

    if (!confirmed) {
      return;
    }

    void runAction(`delete-${id}`, () => deleteFile(id));
  };

  const handleView = async (id: number) => {
    setActionId(`view-${id}`);
    setActionError('');
    setActionMessage('');

    try {
      await viewFile(id);
    } catch (error) {
      setActionError(formatError(error));
    } finally {
      setActionId(null);
    }
  };

  const handleDownload = async (file: FileItem) => {
    setActionId(`download-${file.id}`);
    setActionError('');
    setActionMessage('');

    try {
      await downloadFile(file.id, file.name);
      await refreshCurrentUser();
    } catch (error) {
      setActionError(formatError(error));
    } finally {
      setActionId(null);
    }
  };

  const handleCreatePublicLink = async (id: number, expiresAt?: string) => {
    setActionId(`public-create-${id}`);
    setActionError('');
    setActionMessage('');

    try {
      const response = await createPublicLink(id, expiresAt);
      setActionMessage(`${response.message}: ${response.public.view_url}`);
      await loadFiles();
    } catch (error) {
      setActionError(formatError(error));
    } finally {
      setActionId(null);
    }
  };

  const handleRemovePublicLink = async (id: number) => {
    setActionId(`public-remove-${id}`);
    setActionError('');
    setActionMessage('');

    try {
      const response = await removePublicLink(id);
      setActionMessage(response.message);
      await loadFiles();
    } catch (error) {
      setActionError(formatError(error));
    } finally {
      setActionId(null);
    }
  };

  const handleCopyPublicLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setActionMessage('Public link copied to clipboard.');
      setActionError('');
    } catch {
      setActionError('Could not copy public link to clipboard.');
    }
  };

  const handleShareToDepartment = async (id: number, payload: DepartmentSharePayload) => {
    setActionId(`share-${id}`);
    setActionMessage('');
    setActionError('');

    try {
      const response = await shareToDepartment(id, payload);
      setActionMessage(response.message);
      await loadFiles();
    } catch (error) {
      setActionError(formatError(error));
      throw error;
    } finally {
      setActionId(null);
    }
  };

  const handleRemoveDepartmentShare = async (id: number, shareId: number) => {
    setActionId(`share-${id}`);
    setActionMessage('');
    setActionError('');

    try {
      const response = await deleteDepartmentShare(id, shareId);
      setActionMessage(response.message);
      await loadFiles();
    } catch (error) {
      setActionError(formatError(error));
      throw error;
    } finally {
      setActionId(null);
    }
  };

  const renderFilesPanel = (title: string, subtitle: string, tableFiles: FileItem[]) => (
    <section className="panel files-card">
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <button className="secondary-button" type="button" onClick={() => void loadFiles()}>
          Refresh
        </button>
      </div>

      {isFetching && <div className="empty-state">Loading files...</div>}
      {!isFetching && listError && <div className="alert error">{listError}</div>}
      {!isFetching && !listError && tableFiles.length === 0 && (
        <div className="empty-state">No files found.</div>
      )}
      {!isFetching && !listError && tableFiles.length > 0 && user && (
        <FileTable
          user={user}
          files={tableFiles}
          actionId={actionId}
          onView={(id) => void handleView(id)}
          onDownload={(id) => {
            const file = files.find((item) => item.id === id);

            if (file) {
              void handleDownload(file);
            }
          }}
          onShareToDepartment={handleShareToDepartment}
          onRemoveDepartmentShare={handleRemoveDepartmentShare}
          onCreatePublicLink={(id, expiresAt) => void handleCreatePublicLink(id, expiresAt)}
          onRemovePublicLink={(id) => void handleRemovePublicLink(id)}
          onCopyPublicLink={(url) => void handleCopyPublicLink(url)}
          onDelete={handleDelete}
        />
      )}
    </section>
  );

  const ownDepartmentFiles = files.filter((file) => file.source !== 'Shared With Us');
  const sharedDepartmentFiles = files.filter((file) => file.source === 'Shared With Us');

  const adminNavItems = [
    { id: 'overview', label: 'Overview', description: 'System stats' },
    { id: 'departments', label: 'Departments', description: 'Quota and codes' },
    { id: 'users', label: 'Users', description: 'Accounts and limits' },
    { id: 'files', label: 'Files', description: 'All stored files' },
    { id: 'upload', label: 'Upload', description: 'Chunk upload' },
    { id: 'sharing', label: 'Public Links / Sharing', description: 'File access tools' },
  ];

  const userNavItems = [
    { id: 'overview', label: 'Overview', description: 'Department summary' },
    { id: 'upload', label: 'Upload', description: 'Chunk upload' },
    { id: 'my-files', label: 'My Department Files', description: 'Own department' },
    { id: 'shared', label: 'Shared With Us', description: 'Incoming shares' },
    { id: 'limits', label: 'My Limits', description: 'Quota details' },
  ];

  const renderUploadModule = () => {
    if (!user) return null;

    return (
      <section className="module-stack">
        <SectionHeader
          title="Upload File"
          subtitle="Large-file chunk upload with pause, resume, cancel, and abort controls."
        />
        <ChunkUpload
          user={user}
          departmentRefreshKey={departmentRefreshKey}
          onComplete={async () => {
            await loadFiles();
            await refreshCurrentUser();
          }}
          onDepartmentChange={setSelectedDepartment}
          onQuotaChange={() => setDepartmentRefreshKey((key) => key + 1)}
        />
      </section>
    );
  };

  const renderAdminModule = () => {
    switch (activeModule) {
      case 'departments':
        return (
          <section className="module-stack">
            <SectionHeader
              title="Department Management"
              subtitle="Create departments, maintain codes, and monitor quota usage."
            />
            <DepartmentManagement />
          </section>
        );
      case 'users':
        return (
          <section className="module-stack">
            <SectionHeader
              title="User Management"
              subtitle="Create accounts, assign departments, and manage transfer limits."
            />
            <UserManagement />
          </section>
        );
      case 'files':
        return renderFilesPanel(
          'All Files',
          `${files.length} file${files.length === 1 ? '' : 's'} across all departments`,
          files,
        );
      case 'upload':
        return renderUploadModule();
      case 'sharing':
        return renderFilesPanel(
          'Public Links / Sharing',
          'Open a file row action to create public links or manage department shares.',
          files,
        );
      case 'overview':
      default:
        return <AdminOverview files={files} />;
    }
  };

  const renderUserModule = () => {
    if (!user) return null;

    switch (activeModule) {
      case 'upload':
        return renderUploadModule();
      case 'my-files':
        return renderFilesPanel(
          'My Department Files',
          `${ownDepartmentFiles.length} file${ownDepartmentFiles.length === 1 ? '' : 's'} from your department`,
          ownDepartmentFiles,
        );
      case 'shared':
        return renderFilesPanel(
          'Shared With Us',
          `${sharedDepartmentFiles.length} shared file${sharedDepartmentFiles.length === 1 ? '' : 's'} currently available`,
          sharedDepartmentFiles,
        );
      case 'limits':
        return (
          <section className="module-stack">
            <SectionHeader
              title="My Limits"
              subtitle="Detailed 24-hour transfer limits, chunk limits, and department storage quota."
            />
            <div className="quota-grid">
              <UserTransferQuotaCard user={user} />
              <DepartmentQuotaCard department={selectedDepartment ?? user.department ?? null} />
            </div>
          </section>
        );
      case 'overview':
      default:
        return (
          <UserOverview
            user={user}
            department={selectedDepartment ?? user.department ?? null}
            files={files}
          />
        );
    }
  };

  return (
    <>
      {!user ? (
        <>
          <Header user={user} isLoggingOut={isLoggingOut} onLogout={handleLogout} />
          <main className="app-shell login-main">
          <div className="login-shell">
            <LoginPanel onUserChange={setUser} />
          </div>
          </main>
        </>
      ) : (
        <AppShell
          user={user}
          isLoggingOut={isLoggingOut}
          navItems={user.role === 'admin' ? adminNavItems : userNavItems}
          activeModule={activeModule}
          onModuleChange={setActiveModule}
          onLogout={handleLogout}
        >
          <>
            {actionMessage && <div className="alert success">{actionMessage}</div>}
            {actionError && <div className="alert error">{actionError}</div>}

            {user.role === 'admin' ? renderAdminModule() : renderUserModule()}
          </>
        </AppShell>
      )}
    </>
  );
}
