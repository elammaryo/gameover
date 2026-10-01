import {
  Crown,
  Disc3,
  Flag,
  Flame,
  Gamepad2,
  ListMusic,
  Map as MapIcon,
  Moon,
  Play,
  RotateCcw,
  Speaker,
  Target
} from 'lucide-react'
import type { TrophyId } from '@/lib/trophies'

const ICONS: Record<TrophyId, React.ComponentType<{ className?: string }>> = {
  'press-start': Gamepad2,
  'first-drop': Play,
  'stage-clear': Flag,
  explorer: MapIcon,
  'crate-digger': Disc3,
  setlist: ListMusic,
  'night-owl': Moon,
  'on-beat': Target,
  combo: Flame,
  continue: RotateCcw,
  'big-808': Speaker,
  completionist: Crown
}

export function TrophyIcon({ id, className }: { id: TrophyId; className?: string }) {
  const Icon = ICONS[id]
  return <Icon className={className} aria-hidden />
}
