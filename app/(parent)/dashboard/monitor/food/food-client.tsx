'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const MEAL_CONFIG: Record<string, { label: string; window: string; icon: string; order: number }> = {
  BREAKFAST: { label: 'Breakfast', window: '7:00 AM - 10:00 AM', icon: '\u2615', order: 0 },
  LUNCH: { label: 'Lunch', window: '12:00 PM - 2:00 PM', icon: '\uD83C\uDF5B', order: 1 },
  SNACKS: { label: 'Snacks', window: '3:00 PM - 5:00 PM', icon: '\uD83C\uDF6A', order: 2 },
  DINNER: { label: 'Dinner', window: '7:00 PM - 9:00 PM', icon: '\uD83C\uDF5C', order: 3 },
}

const MEAL_HOURS: Record<string, { start: number; end: number }> = {
  BREAKFAST: { start: 7, end: 10 },
  LUNCH: { start: 12, end: 14 },
  SNACKS: { start: 15, end: 17 },
  DINNER: { start: 19, end: 21 },
}

type Meal = {
  id: string
  mealType: string
  items: string
  vendor: string
  amount: number
  time: string
}

type Props = {
  studentName: string
  todayMeals: Meal[]
  missedMeals: string[]
  dailySpend: { day: string; amount: number }[]
  mealFrequency: { day: string; count: number }[]
  todayTotalSpend: number
  todayMealCount: number
  currentHour: number
}

function getNutritionColor(mealCount: number) {
  if (mealCount >= 3) return '#22C55E'
  if (mealCount === 2) return '#F59E0B'
  return '#EF4444'
}

function getNutritionLabel(mealCount: number) {
  if (mealCount >= 3) return 'Good'
  if (mealCount === 2) return 'Fair'
  return 'Poor'
}

export default function FoodClient({
  studentName,
  todayMeals,
  missedMeals,
  dailySpend,
  mealFrequency,
  todayTotalSpend,
  todayMealCount,
  currentHour,
}: Props) {
  const allMealTypes = ['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER']
  const mealsByType: Record<string, Meal[]> = {}
  for (const m of todayMeals) {
    if (!mealsByType[m.mealType]) mealsByType[m.mealType] = []
    mealsByType[m.mealType].push(m)
  }

  const nutritionColor = getNutritionColor(todayMealCount)

  return (
    <div className="px-5 pt-5 pb-28 min-h-screen" style={{ backgroundColor: 'var(--pms-bg)' }}>
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl font-bold" style={{ color: 'var(--pms-text)' }}>Food Monitor</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--pms-text-sec)' }}>{studentName} - Meal tracking and nutrition</p>
      </div>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
          <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--pms-text-muted)' }}>Today&apos;s Food Spend</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--pms-text)' }}>
            ₹{todayTotalSpend.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
          </p>
        </div>
        <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
          <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--pms-text-muted)' }}>Meals Today</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--pms-text)' }}>{todayMealCount}</p>
        </div>
        <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
          <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--pms-text-muted)' }}>Missed</p>
          <p className="text-2xl font-bold" style={{ color: missedMeals.length > 0 ? '#F59E0B' : '#22C55E' }}>
            {missedMeals.length}
          </p>
        </div>
        <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
          <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--pms-text-muted)' }}>Nutrition</p>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: nutritionColor }} />
            <span className="text-lg font-bold" style={{ color: nutritionColor }}>
              {getNutritionLabel(todayMealCount)}
            </span>
          </div>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--pms-text-muted)' }}>3+ meals = good</p>
        </div>
      </div>

      {/* Today's Meals Timeline */}
      <div className="rounded-2xl p-4 mb-4" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
        <h2 className="text-sm font-semibold mb-5" style={{ color: 'var(--pms-text)' }}>Today&apos;s Meals</h2>
        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-px" style={{ backgroundColor: 'var(--pms-border)' }} />

          <div className="space-y-6">
            {allMealTypes.map((mealType) => {
              const config = MEAL_CONFIG[mealType]
              const hours = MEAL_HOURS[mealType]
              const meals = mealsByType[mealType] || []
              const isMissed = missedMeals.includes(mealType)
              const isUpcoming = currentHour < hours.start
              const isCurrent = currentHour >= hours.start && currentHour < hours.end

              return (
                <div key={mealType} className="relative pl-12">
                  <div
                    className="absolute left-3.5 w-3 h-3 rounded-full border-2"
                    style={{
                      borderColor: isMissed ? '#F59E0B' : meals.length > 0 ? '#22C55E' : isUpcoming ? 'var(--pms-border)' : isCurrent ? 'var(--pms-brown)' : 'var(--pms-border)',
                      backgroundColor: meals.length > 0 ? '#22C55E' : 'transparent',
                    }}
                  />

                  {isMissed ? (
                    <div className="rounded-xl p-4" style={{ backgroundColor: '#F59E0B0D', border: '1px solid #F59E0B30' }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{config.icon}</span>
                          <span className="text-sm font-medium text-[#F59E0B]">{config.label} - MISSED</span>
                        </div>
                        <span className="text-xs" style={{ color: 'var(--pms-text-muted)' }}>{config.window}</span>
                      </div>
                      <p className="text-xs mt-1" style={{ color: '#F59E0B' }}>
                        Meal window has passed with no food log recorded.
                      </p>
                    </div>
                  ) : meals.length > 0 ? (
                    <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--pms-bg)', border: '1px solid var(--pms-border)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{config.icon}</span>
                          <span className="text-sm font-medium" style={{ color: 'var(--pms-text)' }}>{config.label}</span>
                        </div>
                        <span className="text-xs" style={{ color: 'var(--pms-text-muted)' }}>{config.window}</span>
                      </div>
                      {meals.map((meal) => (
                        <div key={meal.id} className="mt-2 pl-7">
                          <div className="flex items-center justify-between">
                            <p className="text-sm" style={{ color: 'var(--pms-text)' }}>{meal.items}</p>
                            <span className="text-sm font-medium" style={{ color: 'var(--pms-brown)' }}>₹{meal.amount}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs" style={{ color: 'var(--pms-text-muted)' }}>{meal.vendor}</span>
                            <span className="text-xs" style={{ color: 'var(--pms-text-muted)' }}>{meal.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl p-4" style={{ border: '1px dashed var(--pms-border)' }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg opacity-40">{config.icon}</span>
                          <span className="text-sm" style={{ color: 'var(--pms-text-muted)' }}>
                            {config.label}
                            {isUpcoming && ' - Upcoming'}
                            {isCurrent && ' - In Progress'}
                          </span>
                        </div>
                        <span className="text-xs" style={{ color: 'var(--pms-text-muted)' }}>{config.window}</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="space-y-3">
        {/* Weekly Food Spend */}
        <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--pms-text)' }}>Weekly Food Spend</h2>
          {dailySpend.every((d) => d.amount === 0) ? (
            <div className="h-[200px] flex items-center justify-center text-sm" style={{ color: 'var(--pms-text-muted)' }}>
              No food spending data this week
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dailySpend} barSize={24}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#A1A1AA', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#A1A1AA', fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)', borderRadius: '8px', color: 'var(--pms-text)' }}
                  formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Food Spend']}
                />
                <Bar dataKey="amount" fill="#A1A1AA" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Meal Frequency */}
        <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--pms-text)' }}>Meals Per Day (This Week)</h2>
          {mealFrequency.every((d) => d.count === 0) ? (
            <div className="h-[200px] flex items-center justify-center text-sm" style={{ color: 'var(--pms-text-muted)' }}>
              No meal data this week
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={mealFrequency} barSize={24}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#A1A1AA', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#A1A1AA', fontSize: 11 }} domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--pms-card)', border: '1px solid var(--pms-border)', borderRadius: '8px', color: 'var(--pms-text)' }}
                    formatter={(value) => [`${value} meals`, 'Count']}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#71717A" />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-around mt-3 px-2">
                {mealFrequency.map((d) => (
                  <div key={d.day} className="flex flex-col items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getNutritionColor(d.count) }} />
                    <span className="text-[9px]" style={{ color: 'var(--pms-text-muted)' }}>{d.day}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
