import { useEffect, useRef } from 'react'

interface Star {
  x: number
  y: number
  size: number
  opacity: number
  speed: number
  twinkleSpeed: number
  twinkleOffset: number
}

interface Nebula {
  x: number
  y: number
  radius: number
  color: string
  driftX: number
  driftY: number
}

interface SpaceBackgroundProps {
  animated?: boolean
}

export function SpaceBackground({ animated = true }: SpaceBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    let stars: Star[] = []
    let nebulae: Nebula[] = []
    let shootingStars: { x: number; y: number; len: number; speed: number; opacity: number }[] = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initStars()
      initNebulae()
    }

    const initStars = () => {
      stars = Array.from({ length: 300 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random(),
        speed: Math.random() * 0.02 + 0.005,
        twinkleSpeed: Math.random() * 0.03 + 0.01,
        twinkleOffset: Math.random() * Math.PI * 2,
      }))
    }

    const initNebulae = () => {
      nebulae = [
        { x: canvas.width * 0.2, y: canvas.height * 0.3, radius: 200, color: 'rgba(75, 85, 99, 0.08)', driftX: 0.1, driftY: 0.05 },
        { x: canvas.width * 0.7, y: canvas.height * 0.6, radius: 250, color: 'rgba(55, 65, 81, 0.06)', driftX: -0.08, driftY: 0.07 },
        { x: canvas.width * 0.5, y: canvas.height * 0.8, radius: 180, color: 'rgba(107, 114, 128, 0.05)', driftX: 0.05, driftY: -0.06 },
      ]
    }

    const draw = (time: number) => {
      ctx.fillStyle = '#0a0a0f'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      nebulae.forEach((n) => {
        if (animated) {
          n.x += n.driftX
          n.y += n.driftY
        }
        const gradient = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.radius)
        gradient.addColorStop(0, n.color)
        gradient.addColorStop(1, 'transparent')
        ctx.fillStyle = gradient
        ctx.fillRect(n.x - n.radius, n.y - n.radius, n.radius * 2, n.radius * 2)
      })

      stars.forEach((star) => {
        const twinkle = animated
          ? 0.3 + 0.7 * Math.abs(Math.sin(time * star.twinkleSpeed + star.twinkleOffset))
          : star.opacity
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(220, 220, 230, ${twinkle})`
        ctx.fill()

        if (animated && star.size > 1.5) {
          ctx.beginPath()
          ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(156, 163, 175, ${twinkle * 0.15})`
          ctx.fill()
        }
      })

      if (animated && Math.random() < 0.003) {
        shootingStars.push({
          x: Math.random() * canvas.width * 0.5,
          y: Math.random() * canvas.height * 0.3,
          len: Math.random() * 80 + 40,
          speed: Math.random() * 8 + 4,
          opacity: 1,
        })
      }

      shootingStars = shootingStars.filter((ss) => {
        ctx.beginPath()
        ctx.moveTo(ss.x, ss.y)
        ctx.lineTo(ss.x + ss.len * 0.7, ss.y + ss.len * 0.7)
        ctx.strokeStyle = `rgba(200, 210, 230, ${ss.opacity})`
        ctx.lineWidth = 1.5
        ctx.stroke()
        ss.x += ss.speed
        ss.y += ss.speed
        ss.opacity -= 0.015
        return ss.opacity > 0
      })

      if (animated) {
        animationId = requestAnimationFrame(draw)
      }
    }

    resize()
    window.addEventListener('resize', resize)
    draw(0)

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationId)
    }
  }, [animated])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-20"
      aria-hidden="true"
    />
  )
}
