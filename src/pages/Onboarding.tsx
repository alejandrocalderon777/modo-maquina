import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import ChatBubble, { UserBubble } from '../components/ChatBubble'
import { GOAL_LABELS, LEVEL_LABELS, EQUIPMENT_LABELS } from '../assets/data'
import type { Goal, Level, Equipment } from '../types'

type Message = {
  id: number
  from: 'coach' | 'user'
  text: string
  delay?: number
}

type Step = {
  question: string
  delay: number
  type: 'choice' | 'number_choice'
  options?: { value: string; label: string; emoji: string }[]
  field: string
}

const STEPS: Step[] = [
  {
    question: '¡Modo máquina activado! Soy tu coach personal. Cuéntame: ¿cuál es tu objetivo principal?',
    delay: 400,
    type: 'choice',
    field: 'goal',
    options: [
      { value: 'lose_weight', label: 'Bajar de peso', emoji: '🔥' },
      { value: 'gain_muscle', label: 'Ganar músculo', emoji: '💪' },
      { value: 'health', label: 'Salud general', emoji: '❤️' },
      { value: 'endurance', label: 'Resistencia', emoji: '⚡' },
    ],
  },
  {
    question: '¿Cómo describirías tu nivel de actividad actual?',
    delay: 600,
    type: 'choice',
    field: 'level',
    options: [
      { value: 'sedentary', label: 'Sedentario', emoji: '🛋️' },
      { value: 'beginner', label: 'Principiante', emoji: '🌱' },
      { value: 'intermediate', label: 'Intermedio', emoji: '🏋️' },
      { value: 'advanced', label: 'Avanzado', emoji: '🚀' },
    ],
  },
  {
    question: '¿Dónde vas a entrenar principalmente?',
    delay: 600,
    type: 'choice',
    field: 'equipment',
    options: [
      { value: 'gym', label: 'Gimnasio', emoji: '🏟️' },
      { value: 'home', label: 'Casa', emoji: '🏠' },
      { value: 'outdoor', label: 'Aire libre', emoji: '🌲' },
      { value: 'none', label: 'Sin equipo', emoji: '🤸' },
    ],
  },
  {
    question: '¿Cuántos días a la semana puedes entrenar?',
    delay: 600,
    type: 'choice',
    field: 'daysPerWeek',
    options: [
      { value: '2', label: '2 días', emoji: '📅' },
      { value: '3', label: '3 días', emoji: '📅' },
      { value: '4', label: '4 días', emoji: '📅' },
      { value: '5', label: '5+ días', emoji: '📅' },
    ],
  },
]

export default function Onboarding() {
  const navigate = useNavigate()
  const setProfile = useAppStore((s) => s.setProfile)
  const profile = useAppStore((s) => s.profile)

  const [messages, setMessages] = useState<Message[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [showOptions, setShowOptions] = useState(false)
  const [answered, setAnswered] = useState<Record<number, string>>({})
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Initial greeting
  useEffect(() => {
    const greeting = profile.name
      ? `¡Hola ${profile.name}! 🤜 ${STEPS[0].question}`
      : `¡Hola! 🤜 ${STEPS[0].question}`

    setTimeout(() => setIsTyping(true), 300)
    setTimeout(() => {
      setIsTyping(false)
      setMessages([{ id: 0, from: 'coach', text: greeting }])
      setTimeout(() => setShowOptions(true), 1200)
    }, 1500)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, showOptions, isTyping])

  const handleAnswer = (value: string, label: string) => {
    if (answered[currentStep] !== undefined) return

    setAnswered((prev) => ({ ...prev, [currentStep]: value }))
    setShowOptions(false)

    // Add user bubble
    const step = STEPS[currentStep]
    const option = step.options?.find((o) => o.value === value)

    setMessages((prev) => [
      ...prev,
      { id: prev.length, from: 'user', text: `${option?.emoji} ${label}` },
    ])

    // Save to store
    const fieldVal =
      step.field === 'daysPerWeek' ? parseInt(value) : step.field === 'equipment' ? [value] : value
    setProfile({ [step.field]: fieldVal })

    // Next step or finish
    const nextStep = currentStep + 1
    if (nextStep < STEPS.length) {
      setTimeout(() => setIsTyping(true), 400)
      setTimeout(() => {
        setIsTyping(false)
        setMessages((prev) => [
          ...prev,
          { id: prev.length, from: 'coach', text: STEPS[nextStep].question, delay: 0 },
        ])
        setTimeout(() => {
          setCurrentStep(nextStep)
          setShowOptions(true)
        }, 800)
      }, 1200)
    } else {
      // Onboarding chat done → avatar selection
      setTimeout(() => setIsTyping(true), 400)
      setTimeout(() => {
        setIsTyping(false)
        setMessages((prev) => [
          ...prev,
          {
            id: prev.length,
            from: 'coach',
            text: '¡Perfecto! Ahora lo más importante: elige a quién quieres convertirte. 💥',
          },
        ])
        setTimeout(() => navigate('/avatar-select'), 2000)
      }, 1200)
    }
  }

  const currentOptions = STEPS[currentStep]?.options || []

  return (
    <div className="min-h-screen bg-carbon flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 border-b border-gray-800/50">
        <div className="w-8 h-8 rounded-full bg-volt flex items-center justify-center">
          <span className="text-carbon font-black text-sm">MM</span>
        </div>
        <div>
          <p className="font-display font-bold text-white text-sm uppercase tracking-wide">Coach Modo Máquina</p>
          <p className="font-mono text-xs text-volt">● En línea</p>
        </div>
        {/* Step counter */}
        <div className="ml-auto flex gap-1">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="w-6 h-1 rounded-full transition-colors"
              style={{
                background: i <= currentStep ? '#CEFF3C' : '#252933',
              }}
            />
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((msg, i) =>
          msg.from === 'coach' ? (
            <ChatBubble key={msg.id} message={msg.text} delay={0} />
          ) : (
            <UserBubble key={msg.id} text={msg.text} />
          )
        )}

        {isTyping && (
          <ChatBubble message="" isTyping={true} />
        )}

        <div ref={bottomRef} />
      </div>

      {/* Options */}
      {showOptions && (
        <div className="px-4 pb-8 pt-2 space-y-2 animate-slide-up">
          {currentOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleAnswer(opt.value, opt.label)}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all active:scale-98 text-left"
              style={{
                background: 'rgba(206,255,60,0.05)',
                borderColor: 'rgba(206,255,60,0.25)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(206,255,60,0.12)'
                e.currentTarget.style.borderColor = 'rgba(206,255,60,0.5)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(206,255,60,0.05)'
                e.currentTarget.style.borderColor = 'rgba(206,255,60,0.25)'
              }}
            >
              <span className="text-xl">{opt.emoji}</span>
              <span className="text-white font-body">{opt.label}</span>
              <span className="ml-auto text-gray-600">›</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
