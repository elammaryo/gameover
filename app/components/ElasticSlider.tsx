import React, { useEffect, useRef, useState } from 'react'
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform
} from 'motion/react'
import { cn } from '@/lib/utils'

const MAX_OVERFLOW = 8

interface ElasticSliderProps {
  value?: number
  onChange?: (value: number) => void
  defaultValue?: number
  startingValue?: number
  maxValue?: number
  className?: string
  isStepped?: boolean
  stepSize?: number
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  label?: string
}

const ElasticSlider: React.FC<ElasticSliderProps> = ({
  value: controlledValue,
  onChange,
  defaultValue = 50,
  startingValue = 0,
  maxValue = 100,
  className = '',
  isStepped = false,
  stepSize = 1,
  leftIcon = null,
  rightIcon = null,
  label = 'Volume'
}) => {
  return (
    <div
      className={cn('flex w-40 items-center justify-center', className)}
    >
      <Slider
        value={controlledValue}
        onChange={onChange}
        defaultValue={defaultValue}
        startingValue={startingValue}
        maxValue={maxValue}
        isStepped={isStepped}
        stepSize={stepSize}
        leftIcon={leftIcon}
        rightIcon={rightIcon}
        label={label}
      />
    </div>
  )
}

interface SliderProps {
  value?: number
  onChange?: (value: number) => void
  defaultValue: number
  startingValue: number
  maxValue: number
  isStepped: boolean
  stepSize: number
  leftIcon: React.ReactNode
  rightIcon: React.ReactNode
  label: string
}

const Slider: React.FC<SliderProps> = ({
  value: controlledValue,
  onChange,
  defaultValue,
  startingValue,
  maxValue,
  isStepped,
  stepSize,
  leftIcon,
  rightIcon,
  label
}) => {
  const [internalValue, setInternalValue] = useState<number>(defaultValue)
  const value = controlledValue !== undefined ? controlledValue : internalValue

  const sliderRef = useRef<HTMLDivElement>(null)
  const [region, setRegion] = useState<'left' | 'middle' | 'right'>('middle')
  const clientX = useMotionValue(0)
  const overflow = useMotionValue(0)
  const scale = useMotionValue(1)

  useEffect(() => {
    if (controlledValue === undefined) {
      setInternalValue(defaultValue)
    }
  }, [defaultValue, controlledValue])

  useMotionValueEvent(clientX, 'change', (latest: number) => {
    if (sliderRef.current) {
      const { left, right } = sliderRef.current.getBoundingClientRect()
      let newValue: number
      if (latest < left) {
        setRegion('left')
        newValue = left - latest
      } else if (latest > right) {
        setRegion('right')
        newValue = latest - right
      } else {
        setRegion('middle')
        newValue = 0
      }
      overflow.jump(decay(newValue, MAX_OVERFLOW))
    }
  })

  const commit = (next: number) => {
    let newValue = next
    if (isStepped) {
      newValue = Math.round(newValue / stepSize) * stepSize
    }
    newValue = Math.min(Math.max(newValue, startingValue), maxValue)
    if (onChange) {
      onChange(newValue)
    } else {
      setInternalValue(newValue)
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons > 0 && sliderRef.current) {
      const { left, width } = sliderRef.current.getBoundingClientRect()
      commit(
        startingValue +
          ((e.clientX - left) / width) * (maxValue - startingValue)
      )
      clientX.jump(e.clientX)
    }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    handlePointerMove(e)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerUp = () => {
    animate(overflow, 0, { type: 'spring', bounce: 0.5 })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = (maxValue - startingValue) / 20
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') commit(value + step)
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown')
      commit(value - step)
    else if (e.key === 'Home') commit(startingValue)
    else if (e.key === 'End') commit(maxValue)
    else return
    e.preventDefault()
  }

  const getRangePercentage = (): number => {
    const totalRange = maxValue - startingValue
    if (totalRange === 0) return 0
    return ((value - startingValue) / totalRange) * 100
  }

  // motion values (hoisted so hook order never depends on which icons render)
  const opacity = useTransform(scale, [1, 1.12], [0.8, 1])
  const leftX = useTransform(() =>
    region === 'left' ? -overflow.get() / scale.get() : 0
  )
  const rightX = useTransform(() =>
    region === 'right' ? overflow.get() / scale.get() : 0
  )
  const trackScaleX = useTransform(() => {
    if (sliderRef.current) {
      const { width } = sliderRef.current.getBoundingClientRect()
      return 1 + overflow.get() / width
    }
    return 1
  })
  const trackScaleY = useTransform(overflow, [0, MAX_OVERFLOW], [1, 0.8])
  const trackOrigin = useTransform(() => {
    if (sliderRef.current) {
      const { left, width } = sliderRef.current.getBoundingClientRect()
      return clientX.get() < left + width / 2 ? 'right' : 'left'
    }
    return 'center'
  })
  const trackHeight = useTransform(scale, [1, 1.12], [4, 7])
  const trackMargin = useTransform(scale, [1, 1.12], [0, -1.5])

  return (
    <motion.div
      onHoverStart={() => animate(scale, 1.12)}
      onHoverEnd={() => animate(scale, 1)}
      onTouchStart={() => animate(scale, 1.12)}
      onTouchEnd={() => animate(scale, 1)}
      style={{ scale, opacity }}
      className='flex w-full touch-none items-center justify-center gap-3 select-none'
    >
      {leftIcon && (
        <motion.div
          animate={{
            scale: region === 'left' ? [1, 1.4, 1] : 1,
            transition: { duration: 0.25 }
          }}
          style={{ x: leftX }}
          className='text-bone-dim'
        >
          {leftIcon}
        </motion.div>
      )}

      <div
        ref={sliderRef}
        role='slider'
        tabIndex={0}
        aria-label={label}
        aria-valuemin={startingValue}
        aria-valuemax={maxValue}
        aria-valuenow={Math.round(value)}
        className='relative flex w-full max-w-xs flex-grow cursor-grab touch-none items-center rounded-full py-3 select-none active:cursor-grabbing'
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onKeyDown={handleKeyDown}
      >
        <motion.div
          style={{
            scaleX: trackScaleX,
            scaleY: trackScaleY,
            transformOrigin: trackOrigin,
            height: trackHeight,
            marginTop: trackMargin,
            marginBottom: trackMargin
          }}
          className='flex flex-grow'
        >
          <div className='relative h-full flex-grow overflow-hidden rounded-full bg-white/15'>
            <div
              className='absolute h-full rounded-full bg-bone'
              style={{ width: `${getRangePercentage()}%` }}
            />
          </div>
        </motion.div>
      </div>

      {rightIcon && (
        <motion.div
          animate={{
            scale: region === 'right' ? [1, 1.4, 1] : 1,
            transition: { duration: 0.25 }
          }}
          style={{ x: rightX }}
          className='text-bone-dim'
        >
          {rightIcon}
        </motion.div>
      )}
    </motion.div>
  )
}

function decay(value: number, max: number): number {
  if (max === 0) {
    return 0
  }
  const entry = value / max
  const sigmoid = 2 * (1 / (1 + Math.exp(-entry)) - 0.5)
  return sigmoid * max
}

export default ElasticSlider
