import * as React from "react"
import { cn } from "../../utils"
import { PanelLeft } from "lucide-react"

const SidebarContext = React.createContext({ open: true, setOpen: () => {} })

export function SidebarProvider({ children }) {
  const [open, setOpen] = React.useState(true)
  return <SidebarContext.Provider value={{ open, setOpen }}>{children}</SidebarContext.Provider>
}

export function Sidebar({ className, children }) {
  const { open } = React.useContext(SidebarContext)
  return (
    <aside className={cn("bg-white border-r border-slate-200 transition-all duration-300 flex flex-col h-full", open ? "w-64" : "w-0 overflow-hidden md:w-0", className)}>
      {children}
    </aside>
  )
}

export function SidebarTrigger({ className }) {
  const { setOpen } = React.useContext(SidebarContext)
  return (
    <button onClick={() => setOpen(prev => !prev)} className={cn("md:hidden", className)}>
      <PanelLeft className="w-6 h-6" />
    </button>
  )
}

export const SidebarHeader = ({ className, children }) => <div className={cn("", className)}>{children}</div>
export const SidebarContent = ({ className, children }) => <div className={cn("flex-1 overflow-auto", className)}>{children}</div>
export const SidebarFooter = ({ className, children }) => <div className={cn("", className)}>{children}</div>
export const SidebarGroup = ({ children }) => <div>{children}</div>
export const SidebarGroupContent = ({ children }) => <div>{children}</div>
export const SidebarMenu = ({ children }) => <ul className="space-y-1">{children}</ul>
export const SidebarMenuItem = ({ children }) => <li>{children}</li>
export const SidebarMenuButton = ({ asChild, className, children }) => {
  const Comp = asChild ? React.Fragment : "button"
  return <div className={cn("w-full", className)}>{children}</div>
}

