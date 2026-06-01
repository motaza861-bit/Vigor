import React, { useState } from 'react'
import { View, Text, ScrollView } from 'react-native'
import Animated from 'react-native-reanimated'
import { useTheme } from '../../contexts/ThemeContext'
import { Card } from '../../components/ui/Card'
import { TierGate } from '../../components/ui/TierGate'
import { useFadeSlideIn } from '../../hooks/useFadeSlideIn'
import { spacing, fontSize, radius } from '../../theme/tokens'
import { ThemeTokens } from '../../theme/themes'
import { loadWorkoutLogs, WorkoutLog } from '../../stores/workoutStore'
import { loadDayLog } from '../../stores/nutritionStore'
import { last90Days } from '../../lib/dateUtils'

export default function ProgressScreen() {
  const { theme } = useTheme()

  const last90 = last90Days()
  const workoutLogs = loadWorkoutLogs(last90)
  const nonNullLogs = workoutLogs.filter((l): l is WorkoutLog => l !== null)

  const last30 = last90.slice(60)
  const bodyweightPoints = last30
    .map((date) => ({ date, weight: loadDayLog(date).bodyweight }))
    .filter((p): p is { date: string; weight: number } => p.weight !== undefined)

  const weeklyVolumes = [0, 1, 2, 3].map((w) => {
    const slice = workoutLogs.slice(62 + w * 7, 62 + (w + 1) * 7)
    return slice.reduce((sum, log) => {
      if (!log) return sum
      return sum + log.exercises.reduce((exSum, ex) =>
        exSum + ex.sets.reduce((setSum, s) => setSum + s.reps * s.weight, 0), 0)
    }, 0)
  })

  const prMap: Record<string, number> = {}
  nonNullLogs.forEach((log) => {
    log.exercises.forEach((ex) => {
      if (ex.sets.length === 0) return
      const maxWeight = Math.max(...ex.sets.map((s) => s.weight))
      if (!prMap[ex.name] || maxWeight > prMap[ex.name]) {
        prMap[ex.name] = maxWeight
      }
    })
  })
  const prs = Object.entries(prMap).slice(0, 5)

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bg }}
      contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.xxl, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      <ProgressHeader theme={theme} />

      <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md }}>
        <BodyweightCard theme={theme} points={bodyweightPoints} index={1} />
        <WeeklyVolumeCard theme={theme} volumes={weeklyVolumes} index={2} />
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <ConsistencyHeatmapCard theme={theme} logs={workoutLogs.slice(60)} index={3} />
        <PRTimelineCard theme={theme} prs={prs} index={4} />
      </View>
    </ScrollView>
  )
}

function ProgressHeader({ theme }: { theme: ThemeTokens }) {
  const { animatedStyle } = useFadeSlideIn(0)
  return (
    <Animated.View style={[{ marginBottom: spacing.xl }, animatedStyle]}>
      <Text style={{ color: theme.textMuted, fontSize: fontSize.sm, fontWeight: '600', letterSpacing: 0.8, marginBottom: 4 }}>
        OVERVIEW
      </Text>
      <Text style={{ color: theme.text, fontSize: fontSize.display, fontWeight: '900', lineHeight: fontSize.display + 4 }}>
        Progress
      </Text>
    </Animated.View>
  )
}

function BodyweightCard({
  theme,
  points,
  index,
}: {
  theme: ThemeTokens
  points: { date: string; weight: number }[]
  index: number
}) {
  const { animatedStyle } = useFadeSlideIn(index)
  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      <Card style={{ flex: 1 }}>
        <Text style={{ color: theme.textMuted, fontSize: fontSize.xs, fontWeight: '600', letterSpacing: 0.8, marginBottom: spacing.sm }}>
          BODYWEIGHT
        </Text>
        <TierGate requiredTier="Base">
          {points.length === 0 ? (
            <Text style={{ color: theme.textMuted, fontSize: fontSize.xs, textAlign: 'center', paddingVertical: spacing.md }}>
              No data yet
            </Text>
          ) : (
            <MiniLineChart theme={theme} points={points.map((p) => p.weight)} height={80} />
          )}
        </TierGate>
      </Card>
    </Animated.View>
  )
}

function WeeklyVolumeCard({
  theme,
  volumes,
  index,
}: {
  theme: ThemeTokens
  volumes: number[]
  index: number
}) {
  const { animatedStyle } = useFadeSlideIn(index)
  const maxV = Math.max(...volumes, 1)
  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      <Card style={{ flex: 1 }}>
        <Text style={{ color: theme.textMuted, fontSize: fontSize.xs, fontWeight: '600', letterSpacing: 0.8, marginBottom: spacing.sm }}>
          WEEKLY VOL.
        </Text>
        <TierGate requiredTier="Base">
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 80 }}>
            {volumes.map((v, i) => (
              <View key={i} style={{ flex: 1, alignItems: 'center', gap: 2 }}>
                <View style={{ width: '100%', height: (v / maxV) * 72, backgroundColor: theme.accent, borderRadius: radius.sm }} />
                <Text style={{ color: theme.textMuted, fontSize: 9 }}>W{i + 1}</Text>
              </View>
            ))}
          </View>
        </TierGate>
      </Card>
    </Animated.View>
  )
}

function ConsistencyHeatmapCard({
  theme,
  logs,
  index,
}: {
  theme: ThemeTokens
  logs: Array<WorkoutLog | null>
  index: number
}) {
  const { animatedStyle } = useFadeSlideIn(index)
  const rows = Array.from({ length: 5 }, (_, r) => logs.slice(r * 6, (r + 1) * 6))
  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      <Card style={{ flex: 1 }}>
        <Text style={{ color: theme.textMuted, fontSize: fontSize.xs, fontWeight: '600', letterSpacing: 0.8, marginBottom: spacing.sm }}>
          CONSISTENCY
        </Text>
        <TierGate requiredTier="Base">
          <View style={{ gap: 3 }}>
            {rows.map((row, ri) => (
              <View key={ri} style={{ flexDirection: 'row', gap: 3 }}>
                {row.map((log, ci) => (
                  <View
                    key={ci}
                    style={{
                      flex: 1,
                      height: 12,
                      borderRadius: 2,
                      backgroundColor: log ? theme.accent : theme.border,
                    }}
                  />
                ))}
              </View>
            ))}
          </View>
        </TierGate>
      </Card>
    </Animated.View>
  )
}

function PRTimelineCard({
  theme,
  prs,
  index,
}: {
  theme: ThemeTokens
  prs: [string, number][]
  index: number
}) {
  const { animatedStyle } = useFadeSlideIn(index)
  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      <Card style={{ flex: 1 }}>
        <Text style={{ color: theme.textMuted, fontSize: fontSize.xs, fontWeight: '600', letterSpacing: 0.8, marginBottom: spacing.sm }}>
          TOP PRs
        </Text>
        <TierGate requiredTier="Base">
          {prs.length === 0 ? (
            <Text style={{ color: theme.textMuted, fontSize: fontSize.xs, textAlign: 'center', paddingVertical: spacing.sm }}>
              No data yet
            </Text>
          ) : (
            prs.map(([name, weight]) => (
              <View key={name} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ color: theme.text, fontSize: fontSize.xs, flex: 1 }} numberOfLines={1}>{name}</Text>
                <Text style={{ color: theme.accent, fontSize: fontSize.xs, fontWeight: '700' }}>{weight}kg</Text>
              </View>
            ))
          )}
        </TierGate>
      </Card>
    </Animated.View>
  )
}

function MiniLineChart({ theme, points, height }: { theme: ThemeTokens; points: number[]; height: number }) {
  const [containerWidth, setContainerWidth] = useState(0)

  if (points.length < 2) {
    return <Text style={{ color: theme.textMuted, fontSize: fontSize.xs, textAlign: 'center' }}>{points[0]}kg</Text>
  }
  const minV = Math.min(...points)
  const maxV = Math.max(...points)
  const range = maxV - minV || 1

  return (
    <View
      style={{ height, position: 'relative' }}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {containerWidth > 0 && points.map((v, i) => {
        if (i === 0) return null
        const stepX = containerWidth / (points.length - 1)
        const x1 = (i - 1) * stepX
        const x2 = i * stepX
        const y1 = height - ((points[i - 1] - minV) / range) * (height - 8)
        const y2 = height - ((v - minV) / range) * (height - 8)
        const dx = x2 - x1
        const dy = y2 - y1
        const len = Math.sqrt(dx * dx + dy * dy)
        const angle = Math.atan2(dy, dx) * (180 / Math.PI)
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: x1,
              top: y1,
              width: len,
              height: 2,
              backgroundColor: theme.accent,
              transform: [{ rotate: `${angle}deg` }],
              transformOrigin: 'left center',
            }}
          />
        )
      })}
      <View style={{ position: 'absolute', bottom: 0, right: 0 }}>
        <Text style={{ color: theme.textMuted, fontSize: 9 }}>{points[points.length - 1]}kg</Text>
      </View>
    </View>
  )
}
