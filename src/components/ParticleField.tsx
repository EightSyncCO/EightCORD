import { useCallback, useEffect, useState } from 'react'
import Particles, { initParticlesEngine } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import type { ISourceOptions } from '@tsparticles/engine'

interface ParticleFieldProps {
  enabled?: boolean
}

const options: ISourceOptions = {
  fullScreen: { enable: false },
  fpsLimit: 60,
  particles: {
    number: { value: 60, density: { enable: true } },
    color: { value: ['#6b7280', '#9ca3af', '#d1d5db', '#4b5563'] },
    shape: { type: 'circle' },
    opacity: {
      value: { min: 0.1, max: 0.5 },
      animation: { enable: true, speed: 0.5, sync: false },
    },
    size: {
      value: { min: 1, max: 3 },
      animation: { enable: true, speed: 1, sync: false },
    },
    move: {
      enable: true,
      speed: 0.3,
      direction: 'none',
      random: true,
      outModes: { default: 'out' },
    },
    links: {
      enable: true,
      distance: 120,
      color: '#4b5563',
      opacity: 0.15,
      width: 1,
    },
  },
  interactivity: {
    detectsOn: 'window',
    events: {
      onHover: { enable: true, mode: 'grab' },
      onClick: { enable: true, mode: 'push' },
    },
    modes: {
      grab: { distance: 150, links: { opacity: 0.3 } },
      push: { quantity: 3 },
    },
  },
  detectRetina: true,
}

export function ParticleField({ enabled = true }: ParticleFieldProps) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine)
    }).then(() => setReady(true))
  }, [])

  const particlesLoaded = useCallback(async () => {}, [])

  if (!enabled || !ready) return null

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <Particles
        id="showelgrays-particles"
        options={options}
        particlesLoaded={particlesLoaded}
        className="w-full h-full"
      />
    </div>
  )
}
