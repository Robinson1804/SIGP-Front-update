"use client";

import { type ReactNode, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronRight,
  Home,
  LogOut,
  Menu,
  User,
  FileText,
  Target,
  Users as UsersIcon,
  BarChart,
  Bell,
} from "lucide-react";
import { usePathname } from 'next/navigation';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { paths } from "@/lib/paths";
import { MODULES, type Role, ROLES } from "@/lib/definitions";
import { canAccessModule } from "@/lib/permissions";
import { useAuth } from "@/stores";
import { SidebarProvider, useSidebar } from "@/contexts/sidebar-context";
import { getNotificaciones } from "@/lib/services/notificaciones.service";


// Mapeo de roles a nombres legibles
const ROLE_DISPLAY_NAMES: Record<Role, string> = {
  [ROLES.ADMIN]: 'Administrador',
  [ROLES.PMO]: 'PMO',
  [ROLES.SCRUM_MASTER]: 'Scrum Master',
  [ROLES.DESARROLLADOR]: 'Desarrollador',
  [ROLES.IMPLEMENTADOR]: 'Implementador',
  [ROLES.COORDINADOR]: 'Coordinador',
  [ROLES.USUARIO]: 'Usuario',
  [ROLES.PATROCINADOR]: 'Patrocinador',
};

function UserProfile() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-3 text-white">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200/50">
            <User className="h-6 w-6 text-white" />
          </div>
          <div className="text-left hidden md:block">
            <p className="font-bold">{user.name.toUpperCase()}</p>
            <p className="text-xs">{ROLE_DISPLAY_NAMES[user.role]}</p>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuItem asChild>
          <Link href={paths.perfil}>
            <User className="mr-2 h-4 w-4" />
            <span>Ir a perfil</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Cerrar sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type NavItemConfig = {
  label: string;
  icon: React.ElementType;
  href: string;
  module: typeof MODULES[keyof typeof MODULES];
};

// Todos los items de navegación con su módulo asociado
const allNavItems: NavItemConfig[] = [
  { label: "PGD", icon: FileText, href: paths.pgd.base, module: MODULES.PGD },
  { label: "POI", icon: Target, href: paths.poi.base, module: MODULES.POI },
  { label: "RECURSOS HUMANOS", icon: UsersIcon, href: paths.recursosHumanos, module: MODULES.RECURSOS_HUMANOS },
  { label: "DASHBOARD", icon: BarChart, href: paths.dashboard.base, module: MODULES.DASHBOARD },
  { label: "NOTIFICACIONES", icon: Bell, href: paths.notificaciones, module: MODULES.NOTIFICACIONES },
];

// Función para obtener los items de navegación según el rol
function getNavItemsForRole(role: Role): NavItemConfig[] {
  return allNavItems.filter(item => canAccessModule(role, item.module));
}

type AppLayoutProps = {
  children: ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  secondaryHeader?: ReactNode;
};

function AppLayoutContent({
  children,
  breadcrumbs,
  secondaryHeader,
}: AppLayoutProps) {
  const { sidebarOpen, setSidebarOpen } = useSidebar();
  const pathname = usePathname();
  const { user } = useAuth();

  // Obtener items de navegación según el rol del usuario
  const navItems = user ? getNavItemsForRole(user.role) : [];

  // DESARROLLADOR e IMPLEMENTADOR no tienen sidebar (solo tienen acceso a POI)
  // También ocultar sidebar si no hay usuario (durante logout)
  const isDeveloper = user?.role === ROLES.DESARROLLADOR;
  const isImplementador = user?.role === ROLES.IMPLEMENTADOR;
  const hideSidebar = isDeveloper || isImplementador;
  const showSidebar = user && !hideSidebar && sidebarOpen;

  // Conteo de notificaciones no leídas
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const response = await getNotificaciones({ leida: false });
      setUnreadNotifCount(response.noLeidas);
    } catch {
      // silently ignore
    }
  }, [user]);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000); // Actualizar cada 60s
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  return (
    <div className="flex h-screen w-full bg-[#F9F9F9] font-body flex-col">
      <header className="bg-[#004272] text-white p-2 flex items-center justify-between w-full z-30 h-16 shrink-0">
        <div className="flex-1 flex items-center"></div>
        <div className="flex-1 text-center">
          <h1 className="text-xl font-bold">
            SISTEMA DE ADMINISTRACIÓN DE PROYECTO - OTIN
          </h1>
        </div>
        <div className="flex-1 flex justify-end pr-4">
          <UserProfile />
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - No se muestra para DESARROLLADOR, IMPLEMENTADOR ni cuando no hay usuario */}
        {user && !hideSidebar && (
          <aside
            className={`bg-[#EEEEEE] text-black transition-all duration-300 ${
              showSidebar ? "w-64" : "w-0"
            } overflow-hidden h-full z-20 flex flex-col shrink-0`}
          >
            <div className="p-2 flex justify-end">
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 rounded hover:bg-gray-400/50"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-grow p-4 space-y-[25px]">
              {navItems.map((item) => {
                const isActive = item.href === paths.pgd.base ? pathname.startsWith(paths.pgd.base) : pathname.startsWith(item.href.split('?')[0]);
                return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "flex items-center p-2 rounded-md border",
                    isActive
                      ? "bg-[#005999] text-white border-transparent"
                      : "bg-white text-[#004272] border-[#7E7E7E]"
                  )}
                >
                  <item.icon className={cn("h-5 w-5 mr-3", !isActive ? 'text-[#004272]' : '')} />
                  <span className="flex-1">{item.label}</span>
                  {item.module === MODULES.NOTIFICACIONES && unreadNotifCount > 0 && (
                    <span className="flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-red-500 text-white text-xs font-bold">
                      {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                    </span>
                  )}
                </Link>
              )})}
            </nav>
            <div className="p-4 mt-auto flex justify-center">
                <Image
                  src="/images/logo_inei.svg"
                  alt="INEI institution logo"
                  width={100}
                  height={50}
                />
              </div>
          </aside>
        )}

        <div className="flex flex-1 flex-col overflow-y-auto">
          <div className="sticky top-0 z-10 bg-background">
            <div className="bg-[#D5D5D5]">
              <div className="p-2 flex items-center gap-2 w-full">
                {/* Botón de menú - No se muestra para DESARROLLADOR, IMPLEMENTADOR ni cuando no hay usuario */}
                {user && !hideSidebar && !showSidebar && (
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-1 rounded hover:bg-gray-700/20"
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                )}
                <Home className="h-5 w-5" />
                {breadcrumbs?.map((crumb, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-gray-600" />
                    {crumb.href ? (
                      <Link href={crumb.href} className="font-semibold hover:underline">
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="font-semibold">{crumb.label}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {secondaryHeader}
          </div>
          <main className="flex-1 flex flex-col">{children}</main>
        </div>
      </div>
    </div>
  );
}

export default function AppLayout(props: AppLayoutProps) {
  return (
    <SidebarProvider>
      <AppLayoutContent {...props} />
    </SidebarProvider>
  );
}
