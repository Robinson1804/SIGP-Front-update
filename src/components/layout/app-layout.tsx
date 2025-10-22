
"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronRight,
  Home,
  LogOut,
  Menu,
  User,
} from "lucide-react";
import { usePathname } from 'next/navigation';

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { signOut } from "@/lib/actions";


const ineiLogo = PlaceHolderImages.find((img) => img.id === "inei-logo");

const UserProfile = () => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button className="flex items-center gap-3 text-white">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200/50">
          <User className="h-6 w-6 text-white" />
        </div>
        <div className="text-left hidden md:block">
          <p className="font-bold">EDUARDO CORILLA</p>
          <p className="text-xs">PMO</p>
        </div>
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent className="w-56" align="end">
      <DropdownMenuItem asChild>
        <Link href="/perfil">
          <User className="mr-2 h-4 w-4" />
          <span>Ir a perfil</span>
        </Link>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <form action={signOut}>
        <DropdownMenuItem asChild>
            <button type="submit" className="w-full">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar sesión</span>
            </button>
        </DropdownMenuItem>
      </form>
    </DropdownMenuContent>
  </DropdownMenu>
);

type NavItem = {
    label: string;
    icon: React.ElementType;
    href: string;
};

type AppLayoutProps = {
  children: ReactNode;
  navItems?: NavItem[];
  breadcrumbs: { label: string; href?: string }[];
};

export default function AppLayout({
  children,
  navItems = [],
  breadcrumbs,
}: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();
  
  let activeNavItemLabel;
  const pgdSubmodules = ['/oei-dashboard', '/ogd-dashboard', '/oegd-dashboard', '/ae-dashboard'];
  const activeItem = navItems.find(item => item.href === pathname);
  
  if (activeItem) {
    activeNavItemLabel = activeItem.label;
  } else if (pgdSubmodules.some(submodule => pathname.startsWith(submodule))) {
    activeNavItemLabel = 'PGD';
  }

  return (
    <div className="flex h-screen w-full bg-[#F9F9F9] font-body flex-col">
      <header className="bg-[#004272] text-white p-2 flex items-center justify-between w-full z-20 h-16 shrink-0">
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
        <aside
          className={`bg-[#EEEEEE] text-black transition-all duration-300 ${
            sidebarOpen ? "w-64" : "w-0"
          } overflow-hidden h-full z-10 flex flex-col shrink-0`}
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
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={`flex items-center p-2 rounded-md border ${
                  activeNavItemLabel === item.label
                    ? "bg-[#005999] text-white border-transparent"
                    : "bg-white text-[#004272] border-[#7E7E7E]"
                }`}
              >
                <item.icon className={`h-5 w-5 mr-3 ${activeNavItemLabel !== item.label ? 'text-[#004272]' : ''}`} />
                <span className="flex-1">{item.label}</span>
              </a>
            ))}
          </nav>
          {ineiLogo && (
            <div className="p-4 mt-auto flex justify-center">
              <Image
                src={ineiLogo.imageUrl}
                alt={ineiLogo.description}
                width={100}
                height={50}
                data-ai-hint={ineiLogo.imageHint}
              />
            </div>
          )}
        </aside>

        <div className="flex flex-1 flex-col overflow-y-auto">
          <div className="sticky top-0 z-10 bg-[#D5D5D5]">
            <div className="p-2 flex items-center gap-2 w-full">
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-1 rounded hover:bg-gray-700/20"
                >
                  <Menu className="h-5 w-5" />
                </button>
              )}
              <Home className="h-5 w-5" />
              {breadcrumbs.map((crumb, index) => (
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
          <main className="flex-1 flex flex-col">{children}</main>
        </div>
      </div>
    </div>
  );
}
