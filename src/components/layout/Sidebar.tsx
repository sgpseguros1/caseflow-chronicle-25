import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Users,
  UserCog,
  Building2,
  Scale,
  Briefcase,
  Calendar,
  BarChart3,
  Phone,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  Gavel,
  UserCheck,
  Shield,
  Bell,
  MessageSquare,
  Bot,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface MenuItem {
  icon: React.ElementType;
  label: string;
  path?: string;
  adminOnly?: boolean;
  children?: { icon: React.ElementType; label: string; path: string }[];
}

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Painel', path: '/' },
  {
    icon: Users,
    label: 'Cadastros',
    children: [
      { icon: UserCog, label: 'Gestores', path: '/cadastros/gestores' },
      { icon: Users, label: 'Clientes', path: '/clientes' },
      { icon: Gavel, label: 'Advogados', path: '/cadastros/advogados' },
      { icon: Building2, label: 'Seguradoras', path: '/cadastros/seguradoras' },
      { icon: UserCheck, label: 'Peritos', path: '/cadastros/peritos' },
    ],
  },
  { icon: FileText, label: 'Processos', path: '/processos' },
  { icon: Calendar, label: 'Calendário', path: '/calendario' },
  { icon: Briefcase, label: 'Funcionários', path: '/funcionarios' },
  { icon: BarChart3, label: 'Métricas Diárias', path: '/metricas' },
  { icon: Phone, label: 'Centro de Atendimento', path: '/call-center' },
  { icon: Bell, label: 'Alertas', path: '/alertas' },
  { icon: MessageSquare, label: 'Comunicação', path: '/comunicacao' },
  { icon: Bot, label: 'Módulo IA', path: '/ia' },
  { icon: Scale, label: 'Relatórios', path: '/relatorios', adminOnly: true },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Cadastros']);
  const location = useLocation();
  const { signOut, profile } = useAuth();

  const isAdmin = profile?.role === 'admin' || profile?.role === 'gestor';

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  const isMenuActive = (item: MenuItem) => {
    if (item.path) {
      return location.pathname === item.path;
    }
    if (item.children) {
      return item.children.some((child) => location.pathname.startsWith(child.path));
    }
    return false;
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300 flex flex-col',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
              <Shield className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-sidebar-accent-foreground">JUS PRO</h1>
              <p className="text-[10px] text-sidebar-foreground/60">Gestão Jurídica</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
            <Shield className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null;

            const isActive = isMenuActive(item);
            const isExpanded = expandedMenus.includes(item.label);
            const Icon = item.icon;

            // Menu with children (expandable)
            if (item.children) {
              return (
                <li key={item.label}>
                  <button
                    onClick={() => !collapsed && toggleMenu(item.label)}
                    className={cn(
                      'sidebar-item w-full',
                      isActive && 'bg-sidebar-accent/50',
                      collapsed && 'justify-center px-2'
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        <ChevronDown
                          className={cn(
                            'h-4 w-4 transition-transform',
                            isExpanded && 'rotate-180'
                          )}
                        />
                      </>
                    )}
                  </button>
                  {!collapsed && isExpanded && (
                    <ul className="ml-4 mt-1 space-y-1 border-l border-sidebar-border pl-3">
                      {item.children.map((child) => {
                        const isChildActive = location.pathname === child.path;
                        const ChildIcon = child.icon;
                        return (
                          <li key={child.path}>
                            <Link
                              to={child.path}
                              className={cn(
                                'sidebar-item text-sm py-2',
                                isChildActive && 'active'
                              )}
                            >
                              <ChildIcon className="h-4 w-4 shrink-0" />
                              <span>{child.label}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            }

            // Regular menu item
            return (
              <li key={item.path}>
                <Link
                  to={item.path!}
                  className={cn(
                    'sidebar-item',
                    isActive && 'active',
                    collapsed && 'justify-center px-2'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Section */}
      <div className="border-t border-sidebar-border p-4">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground font-medium">
              {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-accent-foreground truncate">
                {profile?.name || 'Usuário'}
              </p>
              <p className="text-xs text-sidebar-foreground/60 capitalize">
                {profile?.role || 'Usuário'}
              </p>
            </div>
            <button
              onClick={() => signOut()}
              className="p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground font-medium">
              {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <button
              onClick={() => signOut()}
              className="p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border bg-card text-muted-foreground shadow-sm hover:bg-muted transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>
    </aside>
  );
}
