export interface SidebarItem {
  id: string;
  label: string;
  description?: string;
}

interface SidebarProps {
  items: SidebarItem[];
  activeItem: string;
  onChange: (item: string) => void;
}

export function Sidebar({ items, activeItem, onChange }: SidebarProps) {
  return (
    <aside className="app-sidebar">
      <nav className="sidebar-nav" aria-label="Dashboard modules">
        {items.map((item) => (
          <button
            className={`sidebar-link ${activeItem === item.id ? 'active' : ''}`}
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
          >
            <span>{item.label}</span>
            {item.description && <small>{item.description}</small>}
          </button>
        ))}
      </nav>
    </aside>
  );
}
