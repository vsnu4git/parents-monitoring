import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Settings,
  Wallet,
  Target,
  Clock,
  Bell,
  CheckCircle,
  AlertTriangle,
  Save,
} from 'lucide-react-native'
import { getParentControls, updateParentControls, getDashboard } from '../api/endpoints'
import { LoadingScreen } from '../components/LoadingScreen'
import { useTheme } from '../hooks/useTheme'
import Animated, { FadeInDown } from 'react-native-reanimated'

// ─── Custom Toggle Component (theme-aware) ───
function CustomToggle({
  value,
  onValueChange,
  trackOn,
  trackOff,
  knobOn,
  knobOff,
}: {
  value: boolean
  onValueChange: (v: boolean) => void
  trackOn: string
  trackOff: string
  knobOn: string
  knobOff: string
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onValueChange(!value)}
      style={[
        toggleStyles.track,
        { backgroundColor: value ? trackOn : trackOff },
      ]}
    >
      <View
        style={[
          toggleStyles.knob,
          {
            backgroundColor: value ? knobOn : knobOff,
            left: value ? 25 : 3,
          },
        ]}
      />
    </TouchableOpacity>
  )
}

const toggleStyles = StyleSheet.create({
  track: {
    width: 48,
    height: 26,
    borderRadius: 13,
    position: 'relative',
    flexShrink: 0,
    marginLeft: 16,
  },
  knob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    position: 'absolute',
    top: 3,
  },
})

// ─── Toggle Row Component ───
function ToggleRow({
  label,
  description,
  value,
  onChange,
  labelColor,
  descColor,
  dividerColor,
  trackOn,
  trackOff,
  knobOn,
  knobOff,
}: {
  label: string
  description: string
  value: boolean
  onChange: (v: boolean) => void
  labelColor: string
  descColor: string
  dividerColor: string
  trackOn: string
  trackOff: string
  knobOn: string
  knobOff: string
}) {
  return (
    <View style={[s.toggleRow, { borderBottomColor: dividerColor }]}>
      <View style={s.toggleTextWrap}>
        <Text style={[s.toggleLabel, { color: labelColor }]}>{label}</Text>
        <Text style={[s.toggleDesc, { color: descColor }]}>{description}</Text>
      </View>
      <CustomToggle
        value={value}
        onValueChange={onChange}
        trackOn={trackOn}
        trackOff={trackOff}
        knobOn={knobOn}
        knobOff={knobOff}
      />
    </View>
  )
}

// ─── Main Screen ───
export function ControlsScreen() {
  const { c, spacing } = useTheme()
  const queryClient = useQueryClient()

  const { data: dashboard } = useQuery({ queryKey: ['dashboard'], queryFn: getDashboard })
  const students = dashboard?.students || []

  const { data: controls, isLoading } = useQuery({
    queryKey: ['parentControls'],
    queryFn: getParentControls,
  })

  const [dailyLimit, setDailyLimit] = useState('')
  const [weeklyLimit, setWeeklyLimit] = useState('')
  const [attendanceTarget, setAttendanceTarget] = useState('75')
  const [curfewTime, setCurfewTime] = useState('21:00')
  const [geofenceAlerts, setGeofenceAlerts] = useState(true)
  const [mealAlerts, setMealAlerts] = useState(true)
  const [spendingAlerts, setSpendingAlerts] = useState(true)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (controls) {
      setDailyLimit(controls.spendingLimitDaily?.toString() || '')
      setWeeklyLimit(controls.spendingLimitWeekly?.toString() || '')
      setAttendanceTarget(controls.attendanceTarget?.toString() || '75')
      setCurfewTime(controls.curfewTime || '21:00')
      setGeofenceAlerts(controls.geofenceAlerts)
      setMealAlerts(controls.mealAlerts)
      setSpendingAlerts(controls.spendingAlerts)
    }
  }, [controls])

  const mutation = useMutation({
    mutationFn: updateParentControls,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parentControls'] })
      setMessage({ text: 'Controls saved successfully', type: 'success' })
      setTimeout(() => setMessage(null), 4000)
    },
    onError: () => {
      setMessage({ text: 'Failed to save controls', type: 'error' })
      setTimeout(() => setMessage(null), 4000)
    },
  })

  const handleSave = () => {
    mutation.mutate({
      spendingLimitDaily: dailyLimit ? parseFloat(dailyLimit) : null,
      spendingLimitWeekly: weeklyLimit ? parseFloat(weeklyLimit) : null,
      attendanceTarget: attendanceTarget ? parseInt(attendanceTarget, 10) : null,
      curfewTime: curfewTime || null,
      geofenceAlerts,
      mealAlerts,
      spendingAlerts,
    })
  }

  // Clamp attendance between 50-100
  const handleAttendanceSlider = (text: string) => {
    const num = parseInt(text, 10)
    if (isNaN(num)) {
      setAttendanceTarget('')
      return
    }
    setAttendanceTarget(Math.max(50, Math.min(100, num)).toString())
  }

  if (isLoading) return <LoadingScreen />

  const studentName = students[0]?.name || ''

  return (
    <ScrollView
      style={[s.container, { backgroundColor: c.background }]}
      contentContainerStyle={[s.content, { padding: spacing.lg }]}
    >
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400).delay(0).springify().damping(18).stiffness(180)} style={s.headerSection}>
        <View style={s.headerRow}>
          <Settings size={24} color={c.primary} />
          <Text style={[s.headerTitle, { color: c.primary }]}>Parent Controls</Text>
        </View>
        {studentName ? (
          <Text style={[s.headerSubtitle, { color: c.textTertiary }]}>
            Settings for {studentName}
          </Text>
        ) : null}
      </Animated.View>

      {/* Message banner */}
      {message && (
        <View
          style={[
            s.messageBanner,
            {
              backgroundColor: message.type === 'success' ? c.successLight : c.errorLight,
              borderColor: message.type === 'success' ? c.successBorder : c.dangerBorder,
            },
          ]}
        >
          {message.type === 'success' ? (
            <CheckCircle size={16} color={c.success} />
          ) : (
            <AlertTriangle size={16} color={c.error} />
          )}
          <Text
            style={[
              s.messageBannerText,
              { color: message.type === 'success' ? c.success : c.error },
            ]}
          >
            {message.text}
          </Text>
        </View>
      )}

      {/* Spending Limits card */}
      <Animated.View entering={FadeInDown.duration(400).delay(60).springify().damping(18).stiffness(180)} style={[s.card, { backgroundColor: c.cardGlow, borderColor: c.cardBorder }]}>
        <View style={s.cardTitleRow}>
          <Wallet size={18} color={c.primary} />
          <Text style={[s.cardTitle, { color: c.primary }]}>Spending Limits</Text>
        </View>

        <View style={s.inputRow}>
          <Text style={[s.inputLabel, { color: c.text }]}>Daily Limit</Text>
          <View style={s.inputRight}>
            <Text style={[s.currencySymbol, { color: c.textTertiary }]}>{'\u20B9'}</Text>
            <TextInput
              style={[
                s.input,
                {
                  backgroundColor: c.inputBg,
                  borderColor: c.inputBorder,
                  color: c.text,
                },
              ]}
              value={dailyLimit}
              onChangeText={setDailyLimit}
              placeholder="500"
              placeholderTextColor={c.textMuted}
              keyboardType="numeric"
              textAlign="right"
            />
          </View>
        </View>

        <View style={[s.inputRow, { marginBottom: 0 }]}>
          <Text style={[s.inputLabel, { color: c.text }]}>Weekly Limit</Text>
          <View style={s.inputRight}>
            <Text style={[s.currencySymbol, { color: c.textTertiary }]}>{'\u20B9'}</Text>
            <TextInput
              style={[
                s.input,
                {
                  backgroundColor: c.inputBg,
                  borderColor: c.inputBorder,
                  color: c.text,
                },
              ]}
              value={weeklyLimit}
              onChangeText={setWeeklyLimit}
              placeholder="2500"
              placeholderTextColor={c.textMuted}
              keyboardType="numeric"
              textAlign="right"
            />
          </View>
        </View>
      </Animated.View>

      {/* Attendance Target card */}
      <Animated.View entering={FadeInDown.duration(400).delay(120).springify().damping(18).stiffness(180)} style={[s.card, { backgroundColor: c.cardGlow, borderColor: c.cardBorder }]}>
        <View style={s.cardTitleRow}>
          <Target size={18} color={c.primary} />
          <Text style={[s.cardTitle, { color: c.primary }]}>Attendance Target</Text>
        </View>

        <View style={[s.inputRow, { marginBottom: 0 }]}>
          <Text style={[s.inputLabel, { color: c.text }]}>Target %</Text>
          <View style={s.sliderRight}>
            <View style={s.sliderInputWrap}>
              <TextInput
                style={[
                  s.sliderInput,
                  {
                    backgroundColor: c.inputBg,
                    borderColor: c.inputBorder,
                    color: c.text,
                  },
                ]}
                value={attendanceTarget}
                onChangeText={handleAttendanceSlider}
                keyboardType="numeric"
                maxLength={3}
                textAlign="center"
                placeholderTextColor={c.textMuted}
              />
            </View>
            <Text style={[s.attendancePercent, { color: c.primary }]}>
              {attendanceTarget || '0'}%
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Curfew Time card */}
      <Animated.View entering={FadeInDown.duration(400).delay(180).springify().damping(18).stiffness(180)} style={[s.card, { backgroundColor: c.cardGlow, borderColor: c.cardBorder }]}>
        <View style={s.cardTitleRow}>
          <Clock size={18} color={c.primary} />
          <Text style={[s.cardTitle, { color: c.primary }]}>Curfew Time</Text>
        </View>

        <View style={[s.inputRow, { marginBottom: 0 }]}>
          <Text style={[s.inputLabel, { color: c.text }]}>Return by</Text>
          <TextInput
            style={[
              s.input,
              s.curfewInput,
              {
                backgroundColor: c.inputBg,
                borderColor: c.inputBorder,
                color: c.text,
              },
            ]}
            value={curfewTime}
            onChangeText={setCurfewTime}
            placeholder="21:00"
            placeholderTextColor={c.textMuted}
            textAlign="center"
          />
        </View>
      </Animated.View>

      {/* Alert Preferences card */}
      <Animated.View entering={FadeInDown.duration(400).delay(240).springify().damping(18).stiffness(180)} style={[s.card, { backgroundColor: c.cardGlow, borderColor: c.cardBorder }]}>
        <View style={s.cardTitleRow}>
          <Bell size={18} color={c.primary} />
          <Text style={[s.cardTitle, { color: c.primary }]}>Alert Preferences</Text>
        </View>

        <ToggleRow
          label="Geofence Alerts"
          description="Notify when student leaves campus"
          value={geofenceAlerts}
          onChange={setGeofenceAlerts}
          labelColor={c.text}
          descColor={c.textTertiary}
          dividerColor={c.cardBorder}
          trackOn={c.toggleOn}
          trackOff={c.toggleOff}
          knobOn={c.toggleKnobOn}
          knobOff={c.toggleKnobOff}
        />
        <ToggleRow
          label="Meal Alerts"
          description="Notify about meal activity"
          value={mealAlerts}
          onChange={setMealAlerts}
          labelColor={c.text}
          descColor={c.textTertiary}
          dividerColor={c.cardBorder}
          trackOn={c.toggleOn}
          trackOff={c.toggleOff}
          knobOn={c.toggleKnobOn}
          knobOff={c.toggleKnobOff}
        />
        <ToggleRow
          label="Spending Alerts"
          description="Notify on spending limit breach"
          value={spendingAlerts}
          onChange={setSpendingAlerts}
          labelColor={c.text}
          descColor={c.textTertiary}
          dividerColor={c.cardBorder}
          trackOn={c.toggleOn}
          trackOff={c.toggleOff}
          knobOn={c.toggleKnobOn}
          knobOff={c.toggleKnobOff}
        />
      </Animated.View>

      {/* Save button */}
      <Animated.View entering={FadeInDown.duration(400).delay(300).springify().damping(18).stiffness(180)}>
      <TouchableOpacity
        style={[
          s.saveButton,
          { backgroundColor: c.primary },
          mutation.isPending && s.saveButtonDisabled,
        ]}
        onPress={handleSave}
        activeOpacity={0.7}
        disabled={mutation.isPending}
      >
        <Save size={20} color={c.buttonText} />
        <Text style={[s.saveButtonText, { color: c.buttonText }]}>
          {mutation.isPending ? 'Saving...' : 'Save Controls'}
        </Text>
      </TouchableOpacity>
      </Animated.View>

      <View style={{ height: spacing.xl }} />
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    gap: 16,
  },

  // ─── Header ───
  headerSection: {
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
    marginLeft: 34,
  },

  // ─── Message banner ───
  messageBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  messageBannerText: {
    fontSize: 14,
    textAlign: 'center',
  },

  // ─── Card ───
  card: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },

  // ─── Input rows ───
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  inputRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currencySymbol: {
    fontSize: 18,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    width: 140,
  },
  curfewInput: {
    width: 160,
  },

  // ─── Attendance slider area ───
  sliderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sliderInputWrap: {
    width: 80,
  },
  sliderInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  attendancePercent: {
    fontSize: 20,
    fontWeight: '700',
    minWidth: 48,
    textAlign: 'right',
  },

  // ─── Toggle rows ───
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  toggleTextWrap: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  toggleDesc: {
    fontSize: 12,
    marginTop: 2,
  },

  // ─── Save button ───
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: 16,
    borderRadius: 12,
    marginTop: 4,
    gap: 10,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
})
