import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import useValidatedRoles from "@/hooks/useValidatedRoles";
import {
  Building2,
  LayoutDashboard,
  Users,
  UserCheck,
  FileSearch,
  Settings,
  ChevronLeft,
  ChevronRight,
  Map,
  MapPin,
  Banknote,
  MessageSquareText,
  Layers,
  Monitor,
  FolderLock,
  Home,
  ShieldAlert,
  Calendar,
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  isMobile: boolean;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
  group?: string;
}

const Sidebar = ({
  collapsed,
  open,
  onToggle,
  onClose,
  isMobile,
}: SidebarProps) => {
  const { user } = useAuth();
  const { roles } = useValidatedRoles(true);
  const location = useLocation();

  const navigationItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["admin", "employee", "super_admin"],
    },
    // Audit Process Sections A through G
    {
      title: "A. Cash & Cheque",
      href: "/cash-norms",
      icon: Banknote,
      roles: ["admin", "employee", "super_admin"],
      group: "Audit Process (A-G)",
    },
    {
      title: "B. Operational Aspects",
      href: "/operational-aspects",
      icon: Layers,
      roles: ["admin", "employee", "super_admin"],
    },
    {
      title: "C. Customer Mgmt",
      href: "/customer-management",
      icon: UserCheck,
      roles: ["admin", "employee", "super_admin"],
    },
    {
      title: "D. Display & Reg.",
      href: "/display-regulatory",
      icon: Monitor,
      roles: ["admin", "employee", "super_admin"],
    },
    {
      title: "E. Document Mgmt",
      href: "/document-management",
      icon: FolderLock,
      roles: ["admin", "employee", "super_admin"],
    },
    {
      title: "F. Admin & Housekeeping",
      href: "/admin-housekeeping",
      icon: Home,
      roles: ["admin", "employee", "super_admin"],
    },
    {
      title: "G. Information Security",
      href: "/information-security",
      icon: ShieldAlert,
      roles: ["admin", "employee", "super_admin"],
    },
    // Review & Reports
    {
      title: "Scorecard",
      href: "/scorecard",
      icon: FileSearch,
      roles: ["admin", "employee", "super_admin"],
      group: "Review & Reports",
    },
    {
      title: "Feedback",
      href: "/feedback",
      icon: MessageSquareText,
      roles: ["admin", "employee", "super_admin"],
    },
    {
      title: "Employees",
      href: "/employees",
      icon: Users,
      roles: ["admin", "super_admin"],
    },
    // Master data
    {
      title: "States",
      href: "/states",
      icon: Map,
      roles: ["super_admin"],
      group: "Master",
    },
    {
      title: "Cities",
      href: "/cities",
      icon: MapPin,
      roles: ["super_admin"],
    },
    {
      title: "Branches",
      href: "/branches",
      icon: Building2,
      roles: ["super_admin"],
    },
    {
      title: "Scoring Master",
      href: "/scoring-master",
      icon: Settings,
      roles: ["admin", "super_admin"],
      group: roles?.includes("super_admin") ? undefined : "Master",
    },
    {
      title: "Holiday Master",
      href: "/holiday-master",
      icon: Calendar,
      roles: ["admin", "super_admin"],
    },
  ];

  const filteredItems = navigationItems.filter((item) => {
    if (!user) return false;
    if (!roles) return false;
    return item.roles.some((r) => roles.includes(r));
  });

  const isActive = (path: string) => location.pathname === path;

  const handleNavClick = () => {
    if (isMobile) {
      onClose();
    }
  };

  return (
    <div
      className={cn(
        "fixed top-0 left-0 bottom-0 z-50 overflow-hidden bg-card/60 backdrop-blur-md border-r border-border/50 transition-all duration-300 flex flex-col",
        isMobile
          ? cn(
              "w-64",
              open ? "translate-x-0" : "-translate-x-full"
            )
          : collapsed
          ? "w-16"
          : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50 shrink-0">
        {(!collapsed || (isMobile && open)) && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center shadow-sm">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-sm leading-none">Audit CRM</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">HO Admin Portal</p>
            </div>
          </div>
        )}

        <button
          onClick={isMobile ? onClose : onToggle}
          className="p-1.5 rounded-md hover:bg-muted/60 transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isMobile ? (
            <ChevronLeft className="w-4 h-4" />
          ) : collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation list with smooth vertical scrolling */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden">
        {filteredItems.map((item) => {
          const IconComponent = item.icon;
          const active = isActive(item.href);

          return (
            <div key={item.href}>
              {item.group && (!collapsed || isMobile) && (
                <div className="mt-3.5 mb-1 px-3 text-[10px] font-bold tracking-wider text-muted-foreground/80 uppercase">
                  {item.group}
                </div>
              )}
              <NavLink
                to={item.href}
                className={cn("sidebar-nav-item py-2 text-xs font-medium", active && "active")}
                onClick={handleNavClick}
                title={collapsed && !isMobile ? item.title : undefined}
              >
                <IconComponent
                  className={cn(
                    "w-4 h-4 shrink-0",
                    collapsed && !isMobile ? "mx-auto" : "mr-2.5"
                  )}
                />
                {(!collapsed || isMobile) && (
                  <span className="truncate">{item.title}</span>
                )}
              </NavLink>
            </div>
          );
        })}
      </nav>

      {/* User Info footer */}
      {(!collapsed || isMobile) && user && (
        <div className="p-3 border-t border-border/50 shrink-0 bg-muted/20">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 bg-primary/15 rounded-full flex items-center justify-center text-primary font-bold text-xs shrink-0">
              {user.name ? user.name.slice(0, 2).toUpperCase() : 'HO'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate text-foreground">{user.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">
                {user.email || 'HO Auditor'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
