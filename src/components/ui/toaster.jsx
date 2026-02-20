import { useToast } from "./use-toast"
import { X, CheckCircle, AlertCircle } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-[350px]">
      {toasts.map(function ({ id, title, description, variant }) {
        return (
          <div
            key={id}
            className={`
              flex items-start gap-3 rounded-lg border p-4 shadow-lg transition-all animate-in slide-in-from-right-full
              ${variant === 'destructive' ? 'bg-red-50 border-red-200 text-red-900' : 'bg-white border-slate-200 text-slate-900'}
            `}
          >
            {variant === 'destructive' ? <AlertCircle className="h-5 w-5 text-red-600" /> : <CheckCircle className="h-5 w-5 text-green-600" />}
            <div className="grid gap-1">
              {title && <h3 className="font-semibold leading-none tracking-tight">{title}</h3>}
              {description && <div className="text-sm opacity-90">{description}</div>}
            </div>
          </div>
        )
      })}
    </div>
  )
}