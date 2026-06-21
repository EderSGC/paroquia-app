import { useState } from "react";
import {
  LayoutDashboard, CalendarDays,
  User, Home, Building2, Users2,
  Heart, BookOpen,
  Droplets, Star, Flame, Users, Activity, BookMarked,
  DollarSign, Package,
  FileText, Settings, LogOut, Sun, Moon,
  ChevronDown,
  ClipboardList, GraduationCap, CalendarCheck, UserCheck,
  Mail, Briefcase, Receipt, BadgeCheck, ShieldCheck, BarChart2, ScrollText, FileEdit,
  type LucideIcon,
} from "lucide-react";
import { AppLogo } from "@core/ui/AppLogo";
import type { Paroquia, Usuario, PapelUsuario } from "@core/types/app.types";
import { LABEL_PAPEL } from "@core/types/app.types";
import { canAccessModule, hasPermission } from "@core/auth/permissions";
import { useWorkspace, type ModuleId } from "@/layouts/WorkspaceContext";

interface NavItem {
  id: ModuleId | "__logout" | "__theme";
  label: string;
  icon: LucideIcon;
  group: string;
  papeis?: PapelUsuario[];
  sub?: string;
  isAction?: boolean;
}

const NAV_ITEMS: readonly NavItem[] = [
  // PRINCIPAL
  { id: "dashboard",   label: "Dashboard",        group: "Principal",   icon: LayoutDashboard, papeis: ["admin","paroquia","vigario","secretaria"] },
  { id: "agenda",      label: "Agenda",            group: "Principal",   icon: CalendarDays,    papeis: ["admin","paroquia","vigario","secretaria"] },
  // COMUNIDADE
  { id: "fieis",       label: "Fiéis",             group: "Comunidade",  icon: User },
  { id: "familias",    label: "Famílias",           group: "Comunidade",  icon: Home },
  { id: "comunidades", label: "Comunidades",        group: "Comunidade",  icon: Building2 },
  { id: "grupos",      label: "Grupos",             group: "Comunidade",  icon: Users2 },
  // PASTORAL
  { id: "pastorais",   label: "Pastorais",          group: "Pastoral",    icon: Heart },
  { id: "catequese",   label: "Catequese",          group: "Pastoral",    icon: BookOpen },
  // SACRAMENTOS
  { id: "batismo",     label: "Batismo",            group: "Sacramentos", icon: Droplets,        papeis: ["admin","paroquia","vigario","secretaria"], sub: "BATISMO" },
  { id: "eucaristia",  label: "Eucaristia",         group: "Sacramentos", icon: Star,            papeis: ["admin","paroquia","vigario","secretaria"], sub: "EUCARISTIA" },
  { id: "crisma",      label: "Crisma",             group: "Sacramentos", icon: Flame,           papeis: ["admin","paroquia","vigario","secretaria"], sub: "CRISMA" },
  { id: "matrimonio",  label: "Matrimônio",         group: "Sacramentos", icon: Users,           papeis: ["admin","paroquia","vigario","secretaria"], sub: "MATRIMONIO" },
  { id: "uncao",       label: "Unção dos Enfermos", group: "Sacramentos", icon: Activity,        papeis: ["admin","paroquia","vigario","secretaria"] },
  { id: "obitos",      label: "Óbitos / Exéquias",  group: "Sacramentos", icon: BookMarked,      papeis: ["admin","paroquia","vigario","secretaria"] },
  // GESTÃO
  { id: "financeiro",  label: "Financeiro",         group: "Gestão",      icon: DollarSign },
  { id: "patrimonio",  label: "Patrimônio",         group: "Gestão",      icon: Package },
  // SISTEMA
  { id: "documentos",  label: "Documentos",         group: "Sistema",     icon: FileText,        papeis: ["admin","paroquia","vigario","secretaria"] },
  { id: "config",      label: "Configurações",      group: "Sistema",     icon: Settings,        papeis: ["admin","paroquia","vigario","secretaria"] },
  { id: "__logout",    label: "Sair",               group: "Sistema",     icon: LogOut,          isAction: true },
];

const GROUPS = ["Principal", "Comunidade", "Pastoral", "Sacramentos", "Gestão", "Sistema"] as const;

const CATEQUESE_SUBS: { label: string; sub: string; icon: LucideIcon }[] = [
  { label: "Matrículas",  sub: "MATRÍCULAS",   icon: ClipboardList },
  { label: "Turmas",      sub: "TURMAS",        icon: GraduationCap },
  { label: "Presença",    sub: "PRESENÇA",      icon: CalendarCheck },
  { label: "Catequistas", sub: "CATEQUISTAS",   icon: UserCheck },
];

const DOCUMENTOS_SUBS: { label: string; sub: string; icon: LucideIcon }[] = [
  { label: "Memorando",       sub: "memorando",            icon: FileEdit },
  { label: "Ficha Inscrição", sub: "ficha",                icon: ClipboardList },
  { label: "Ata Paroquial",   sub: "ata",                  icon: ScrollText },
  { label: "Cartas",          sub: "cartas",               icon: Mail },
  { label: "Ofícios",         sub: "oficios",              icon: Briefcase },
  { label: "Contratos",       sub: "contratos",            icon: FileText },
  { label: "Recibos",         sub: "recibos",              icon: Receipt },
  { label: "Licenças",        sub: "licencas",             icon: BadgeCheck },
  { label: "Autorizações",    sub: "autorizacoes",         icon: ShieldCheck },
  { label: "Diocese",         sub: "diocese",              icon: Building2 },
  { label: "Comunidades",     sub: "comunidades",          icon: Users },
  { label: "Relatórios",      sub: "relatorios_pastorais", icon: BarChart2 },
];

interface Props {
  paroquia: Paroquia;
  usuario: Usuario;
  isDark: boolean;
  onLogout: () => void;
  onToggleTheme: () => void;
}

export function AppSidebar({ paroquia, usuario, isDark, onLogout, onToggleTheme }: Props) {
  const { activeModule, subPage, navigate } = useWorkspace();
  const isAdmin = hasPermission(usuario.papel, "configuracoes", "gerenciar_usuarios");
  const [expandedGroup, setExpandedGroup] = useState<"catequese" | "documentos" | null>(null);

  const isCatequeseOpen = activeModule === "catequese" && expandedGroup === "catequese";
  const isDocumentosOpen = activeModule === "documentos" && expandedGroup === "documentos";

  function handleAccordionClick(id: "catequese" | "documentos") {
    if (activeModule === id && expandedGroup === id) {
      setExpandedGroup(null);
    } else {
      navigate(id as ModuleId);
      setExpandedGroup(id);
    }
  }

  function canView(item: NavItem): boolean {
    if (!item.papeis) return true;
    return item.papeis.includes(usuario.papel);
  }

  function canAccess(id: string): boolean {
    const baseId = id.replace(/^(batismo|eucaristia|crisma|matrimonio|uncao|obitos)$/, "sacramentos");
    return canAccessModule(usuario.papel, baseId);
  }

  function handleClick(item: NavItem) {
    if (item.id === "__logout") { onLogout(); return; }
    if (item.id === "__theme") { onToggleTheme(); return; }
    if (!canAccess(item.id)) return;
    navigate(item.id, item.sub);
  }

  function isActive(item: NavItem): boolean {
    if (item.isAction) return false;
    return activeModule === item.id;
  }

  function renderAccordion(
    item: NavItem,
    subs: { label: string; sub: string; icon: LucideIcon }[],
    isOpen: boolean,
  ) {
    const Icon = item.icon;
    return (
      <div key={item.id}>
        <button
          className={["sidebar-item", activeModule === item.id ? "sidebar-item--active" : ""].filter(Boolean).join(" ")}
          onClick={() => handleAccordionClick(item.id as "catequese" | "documentos")}
        >
          <Icon size={14} className="sidebar-item-icon" />
          {item.label}
          <ChevronDown
            size={11}
            className={["sidebar-accordion-chevron", isOpen ? "sidebar-accordion-chevron--open" : ""].filter(Boolean).join(" ")}
          />
        </button>
        {isOpen && subs.map(s => {
          const SubIcon = s.icon;
          const subActive = subPage === s.sub;
          return (
            <button
              key={s.sub}
              className={["sidebar-item sidebar-item--sub", subActive ? "sidebar-item--active" : ""].filter(Boolean).join(" ")}
              onClick={() => navigate(item.id as ModuleId, s.sub)}
            >
              <SubIcon size={13} className="sidebar-item-icon" />
              {s.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <aside className="sidebar-root" style={{ display: "flex", flexDirection: "column" }}>
      {/* Titlebar / traffic lights */}
      <div className="draggable-region sidebar-header">
        <div className="no-drag sidebar-brand">
          <AppLogo
            logoPath={paroquia.logo_path}
            alt="Logo"
            size={26}
            radius={7}
            fallbackText={paroquia.nome?.[0] ?? "P"}
            background="#FFFFFF"
            padding={2}
          />
          <span className="sidebar-brand-name" style={{ fontSize: 12, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {paroquia.nome}
          </span>
        </div>
      </div>

      {/* User badge */}
      <div className="no-drag sidebar-user">
        <div className="sidebar-avatar" style={{ background: isAdmin ? "#007AFF" : "#34C759" }}>
          {usuario.nome[0]?.toUpperCase()}
        </div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{usuario.nome}</div>
          <div className="sidebar-user-role">{LABEL_PAPEL[usuario.papel] ?? usuario.papel}</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav mac-scrollbar no-drag" style={{ flex: 1, overflowY: "auto" }}>
        {GROUPS.map((grupo) => {
          const itens = NAV_ITEMS.filter(i => i.group === grupo && canView(i));
          if (itens.length === 0) return null;
          return (
            <div key={grupo} className="sidebar-group">
              <div className="sidebar-group-label">{grupo}</div>
              {itens.map(item => {
                if (item.id === "catequese") {
                  return renderAccordion(item, CATEQUESE_SUBS, isCatequeseOpen);
                }
                if (item.id === "documentos") {
                  return renderAccordion(item, DOCUMENTOS_SUBS, isDocumentosOpen);
                }

                const Icon = item.icon;
                const ativo = isActive(item);
                return (
                  <button
                    key={item.id}
                    className={[
                      "sidebar-item",
                      ativo ? "sidebar-item--active" : "",
                    ].filter(Boolean).join(" ")}
                    onClick={() => handleClick(item)}
                    style={item.id === "__logout" ? { color: "var(--accent-red)", marginTop: 4 } : undefined}
                  >
                    <Icon size={14} className="sidebar-item-icon" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="no-drag sidebar-footer">
        <button className="sidebar-item" onClick={onToggleTheme}>
          {isDark ? <Sun size={14} className="sidebar-item-icon" /> : <Moon size={14} className="sidebar-item-icon" />}
          {isDark ? "Modo Claro" : "Modo Escuro"}
        </button>
      </div>
    </aside>
  );
}
