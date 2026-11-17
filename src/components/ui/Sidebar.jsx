import { NavLink } from 'react-router-dom'
import { Tooltip } from '@mui/material'
import MenuOpenIcon from '@mui/icons-material/MenuOpen'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import HistoryIcon from '@mui/icons-material/History'
import SyncIcon from '@mui/icons-material/Sync'
import { UI_CLASSES } from '../../theme'

/**
 * Navegação lateral corporativa Hapvida com tokens de design,
 * modo retrátil (248px ↔ 72px) e efeito slide-in de pré-seleção no hover.
 */
export function Sidebar({
  sections = [],
  collapsed = false,
  onToggleCollapse,
  brandTitle = 'Abs Modular',
  logoSrc = '/images/Hapvida_novo.png',
  compactLogoSrc = '/images/hapvidaicon.png',
  syncStatus
}) {
  return (
    <aside
      className={`w-sidebar-collapsed ${
        collapsed ? 'md:w-sidebar-collapsed' : 'md:w-sidebar'
      } shrink-0 bg-slate-50/80 border-r border-slate-200 flex flex-col sticky top-0 h-screen z-sidebar transition-all duration-200 ease-out`}
    >
      {/* Cabeçalho da marca + controle de recolhimento */}
      <div className="p-3 md:px-4 md:py-4 bg-white border-b border-slate-200 flex items-center justify-between gap-2 min-h-topbar">
        <div className={`flex flex-col gap-1 min-w-0 ${collapsed ? 'md:items-center md:w-full' : ''}`}>
          <img
            src={collapsed ? compactLogoSrc : logoSrc}
            alt="Hapvida NotreDame Intermédica"
            referrerPolicy="no-referrer"
            className={`${collapsed ? 'h-7 w-7 object-contain' : 'h-logo w-auto'} self-start block`}
          />
          {!collapsed && (
            <span className={UI_CLASSES.sidebarBrandTitle}>
              {brandTitle}
            </span>
          )}
        </div>

        <Tooltip title={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'} placement="right">
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
            aria-expanded={!collapsed}
            className="hidden md:inline-flex items-center justify-center w-8 h-8 rounded-control text-slate-500 hover:bg-slate-100 hover:text-hapvida-navy transition-all duration-150 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hapvida-blue/40"
          >
            {collapsed ? <ChevronRightIcon sx={{ fontSize: 18 }} /> : <MenuOpenIcon sx={{ fontSize: 18 }} />}
          </button>
        </Tooltip>
      </div>

      {/* Lista de módulos por seção */}
      <nav
        aria-label="Navegação principal"
        className="flex-1 py-4 px-2 md:px-3 overflow-y-auto [scrollbar-width:thin] flex flex-col gap-5"
      >
        {sections.map((sec, secIdx) => (
          <div key={sec.title}>
            {!collapsed ? (
              <div className="hidden md:flex items-center justify-between px-2 mb-2">
                <span className="text-label font-semibold text-slate-500 tracking-wide">
                  {sec.title}
                </span>
                <span className="text-label font-mono tabular-nums text-slate-400">
                  {sec.items.length}
                </span>
              </div>
            ) : (
              secIdx > 0 && <div className="hidden md:block my-2 border-t border-slate-200" />
            )}

            <div className="flex flex-col gap-1">
              {sec.items.map(({ to, label, sublabel, Icon, badge }) => (
                <Tooltip
                  key={to}
                  title={badge ? `${label} (${badge})` : label}
                  placement="right"
                  arrow
                  disableInteractive
                  disableHoverListener={!collapsed}
                >
                  <NavLink
                    to={to}
                    aria-label={label}
                    className={({ isActive }) =>
                      `group relative overflow-hidden flex items-center ${
                        collapsed ? 'justify-center px-2 py-2.5' : 'justify-center md:justify-between px-3 py-2.5'
                      } gap-2 rounded-card no-underline border transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hapvida-blue/40 ${
                        isActive
                          ? 'bg-white text-hapvida-navy border-hapvida-navy/35 shadow-card'
                          : 'bg-transparent text-slate-700 border-transparent hover:border-slate-300/90 hover:shadow-card hover:text-slate-900'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {/* Camada slide-in de pré-seleção no hover */}
                        {!isActive && (
                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 rounded-card bg-white/95 transform -translate-x-full opacity-0 transition-all duration-200 ease-out group-hover:translate-x-0 group-hover:opacity-100"
                          />
                        )}

                        <div
                          className={`relative z-10 flex items-center gap-3 min-w-0 flex-1 transform transition-all duration-200 ease-out ${
                            collapsed
                              ? 'justify-center'
                              : isActive
                                ? 'translate-x-0'
                                : 'group-hover:translate-x-1'
                          }`}
                        >
                          <div className="relative shrink-0 flex items-center justify-center">
                            <Icon
                              sx={{ fontSize: 19 }}
                              className={`transform transition-all duration-200 ease-out ${
                                isActive
                                  ? 'text-hapvida-navy'
                                  : 'text-slate-500 group-hover:text-hapvida-blue group-hover:scale-110'
                              }`}
                            />
                            {collapsed && badge && (
                              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                            )}
                          </div>
                          {!collapsed && (
                            <div className="hidden md:flex flex-col min-w-0">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span
                                  className={`text-body leading-tight whitespace-nowrap transition-colors duration-150 ${
                                    isActive
                                      ? 'font-semibold text-hapvida-navy'
                                      : 'font-medium text-slate-800 group-hover:text-slate-950'
                                  }`}
                                >
                                  {label}
                                </span>
                                {badge && (
                                  <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs whitespace-nowrap shrink-0">
                                    {badge}
                                  </span>
                                )}
                              </div>
                              {sublabel && (
                                <span
                                  className={`font-mono text-label leading-tight truncate mt-1 transition-colors duration-150 ${
                                    isActive
                                      ? 'text-hapvida-blue'
                                      : 'text-slate-500 group-hover:text-slate-600'
                                  }`}
                                >
                                  {sublabel}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {!collapsed && (
                          <ChevronRightIcon
                            sx={{ fontSize: 16 }}
                            aria-hidden="true"
                            className={`relative z-10 hidden md:block shrink-0 transform transition-all duration-200 ease-out ${
                              isActive
                                ? 'text-hapvida-navy opacity-80 translate-x-0'
                                : 'text-hapvida-orange opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'
                            }`}
                          />
                        )}
                      </>
                    )}
                  </NavLink>
                </Tooltip>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Rodapé discreto de sincronização */}
      {!collapsed && syncStatus && (
        <div className={UI_CLASSES.sidebarFooter}>
          {syncStatus.isHistorical ? (
            <div className={UI_CLASSES.historicalBox}>
              <HistoryIcon sx={{ fontSize: 16 }} className="text-amber-600 shrink-0" />
              <span>Histórico: {syncStatus.formattedLastTsDate}</span>
            </div>
          ) : (
            <Tooltip
              title={
                <div className="p-1 text-xs tabular-nums">
                  <div>
                    <strong>Último log:</strong> {syncStatus.formattedLastTsTime} ({syncStatus.formattedLastTsDate})
                  </div>
                  <div>
                    <strong>Próxima leitura:</strong> {syncStatus.formattedNextSlotTime} (em {syncStatus.countdownText})
                  </div>
                </div>
              }
              arrow
            >
              <div className={UI_CLASSES.syncBox}>
                <div className="flex items-center gap-2 mb-1">
                  <SyncIcon sx={{ fontSize: 15 }} className="text-emerald-600 shrink-0" />
                  <span className="text-xs font-semibold text-slate-900 tabular-nums">
                    Sincronizado {syncStatus.formattedLastTsTime}
                  </span>
                </div>
                <p className="m-0 text-label text-slate-600 pl-6 tabular-nums">
                  Próxima às {syncStatus.formattedNextSlotTime} ({syncStatus.countdownText})
                </p>
              </div>
            </Tooltip>
          )}
        </div>
      )}
    </aside>
  )
}

export default Sidebar
