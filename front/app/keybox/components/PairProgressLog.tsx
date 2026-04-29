'use client'
import { useRef, useEffect } from "react"
import type { PairStep } from "../hooks/usePairKeybox"

type Props = {
  steps: PairStep[]
}

export function PairProgressLog({ steps }: Props) {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [steps])

  if (steps.length === 0) return null

  return (
    <div className="border rounded-md p-4 space-y-2">
      <p className="text-sm font-medium">Pairing progress</p>
      <ul
        className="space-y-1 overflow-y-auto font-mono bg-black rounded p-2"
        style={{ height: "50vh" }}
      >
        {steps.map((step, i) => (
          <li key={i} className="flex items-center gap-2 text-sm">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${step.done ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className={step.done ? 'text-green-400' : 'text-red-400'}>{step.label}</span>
          </li>
        ))}
        <div ref={endRef} />
      </ul>
    </div>
  )
}
