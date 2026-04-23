"use client";

import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  Users,
  School,
  FlaskConical,
  BarChart,
  LayoutDashboard,
  LogOut,
  FileText,
  BookOpen,
  ScrollText,
  Download,
  ClipboardList,
  Bot,
  Network,
  FolderOpen,
  Moon,
  Sun,
} from "lucide-react";
import { Icons } from "@/components/icons";
import { useAuth } from "@/hooks/use-auth";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/components/theme-provider";

const adminNav = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/dashboard/users", icon: Users, label: "User Management" },
  { href: "/dashboard/subjects", icon: BookOpen, label: "Subject Management" },
  { href: "/dashboard/materials", icon: FolderOpen, label: "Subject Materials" },
  { href: "/dashboard/logs", icon: ScrollText, label: "System Logs" },
  { href: "/dashboard/export", icon: Download, label: "Data Export" },
];

// teachers dashboard: content analyzer, test generator and students analysis and manager
const teacherNav = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/dashboard/classes", icon: School, label: "Student Manager" },
  { href: "/dashboard/materials", icon: FolderOpen, label: "Subject Materials" },
  { href: "/dashboard/content", icon: FlaskConical, label: "Content Analyzer" },
  { href: "/dashboard/worksheets", icon: FileText, label: "Test Generator" },
  { href: "/dashboard/progress", icon: BarChart, label: "Student Analysis" },
];

// student dashboard: tests, ask ganesha, concept visualizer, progress
const studentNav = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/dashboard/classes", icon: School, label: "My Classes" },
  { href: "/dashboard/tests", icon: ClipboardList, label: "Tests" },
  { href: "/dashboard/ask-ganesha", icon: Bot, label: "Ask Ganesha" },
  { href: "/dashboard/concept-visualizer", icon: Network, label: "Concept Map" },
  { href: "/dashboard/progress", icon: BarChart, label: "My Progress" },
];

const navItemsByUserType = {
  admin: adminNav,
  teacher: teacherNav,
  student: studentNav,
};

export function DashboardSidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const navItems = user ? navItemsByUserType[user.user_type] : [];

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="h-20 flex items-center px-4 py-4 mb-2">
        <Link href="/dashboard" className="flex items-center gap-3 transition-opacity hover:opacity-90">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 shadow-sm">
            <Icons.logo className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-headline font-bold text-gradient-sahayak group-data-[collapsible=icon]:hidden notranslate">
            Sahayak
          </h1>
        </Link>
      </SidebarHeader>

      <SidebarMenu className="flex-1 px-3 space-y-1">
        {navItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith(item.href) && (item.href === '/dashboard' ? pathname === item.href : true)}
              tooltip={item.label}
              className="transition-all duration-200 hover:scale-[1.02] active:scale-95"
            >
              <Link href={item.href} className="flex items-center gap-3">
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>

      <SidebarFooter className="p-3 border-t border-sidebar-border/50">
        <SidebarMenuItem>
          <SidebarMenuButton
            onClick={toggleTheme}
            tooltip={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="hover:bg-primary/10"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
            <span className="font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            onClick={logout}
            tooltip="Logout from account"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarFooter>
    </Sidebar>
  );
}
