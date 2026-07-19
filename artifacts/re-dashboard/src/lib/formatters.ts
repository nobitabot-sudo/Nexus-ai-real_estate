import { formatDuration, intervalToDuration } from "date-fns"

export function formatSecondsToDuration(seconds: number | undefined | null): string {
  if (!seconds && seconds !== 0) return "--"
  const duration = intervalToDuration({ start: 0, end: seconds * 1000 })
  
  if (!duration.minutes && !duration.hours) {
    return `${duration.seconds || 0}s`
  }
  
  const parts = []
  if (duration.hours) parts.push(`${duration.hours}h`)
  if (duration.minutes) parts.push(`${duration.minutes}m`)
  if (duration.seconds) parts.push(`${duration.seconds}s`)
  
  return parts.join(" ")
}
