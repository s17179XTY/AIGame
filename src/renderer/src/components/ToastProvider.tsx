import React, { createContext, useContext, useState, useCallback } from 'react'

interface ToastItem {
  id: number
  message: string
  type: 'info' | 'confirm'
  resolve?: (value: boolean) => void
}

interface ToastContextType {
  show: (message: string) => void
  confirm: (message: string) => Promise<boolean>
}

const ToastContext = createContext<ToastContextType>({
  show: () => {},
  confirm: async () => false,
})

let toastId = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const show = useCallback((message: string) => {
    const id = ++toastId
    setToasts((prev) => [...prev, { id, message, type: 'info' }])
    setTimeout(() => remove(id), 3000)
  }, [remove])

  const confirm = useCallback((message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const id = ++toastId
      setToasts((prev) => [...prev, { id, message, type: 'confirm', resolve }])
    })
  }, [])

  const handleConfirm = (item: ToastItem, value: boolean) => {
    item.resolve?.(value)
    remove(item.id)
  }

  return (
    <ToastContext.Provider value={{ show, confirm }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none">
        {toasts.map((item) => (
          <div
            key={item.id}
            className="pointer-events-auto bg-game-panel border border-game-accent/30 rounded-xl px-5 py-3 shadow-2xl backdrop-blur-md flex items-center gap-4 max-w-md animate-slide-up"
          >
            <p className="text-sm text-game-text flex-1">{item.message}</p>
            {item.type === 'confirm' ? (
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handleConfirm(item, true)}
                  className="px-3 py-1 text-xs bg-game-highlight rounded-lg font-medium hover:bg-game-highlight/80 transition-colors"
                >
                  OK
                </button>
                <button
                  onClick={() => handleConfirm(item, false)}
                  className="px-3 py-1 text-xs border border-game-muted/30 rounded-lg text-game-muted hover:border-game-highlight transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => remove(item.id)}
                className="text-game-muted hover:text-game-text shrink-0 text-sm"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}