import { authenticateMobileRequest } from '@/lib/mobile-auth'
import { getParentPredictions } from '@/lib/data/mobile.data'

export async function GET(req: Request) {
  const auth = await authenticateMobileRequest(req)
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const raw = await getParentPredictions(auth.userId)
    if (!raw) return Response.json({ error: 'Parent not found' }, { status: 404 })

    // Transform to the shape the mobile app expects:
    // PredictionsResponse { attendance, gpa, fees, meals }

    // --- Attendance ---
    const actualAttendance = raw.attendance.weeklyData.filter(w => !w.isForecast)
    const forecastAttendance = raw.attendance.weeklyData.filter(w => w.isForecast)
    const currentAttendance = actualAttendance.length > 0
      ? Math.round(actualAttendance[actualAttendance.length - 1].rate * 10) / 10
      : 0
    const predictedAttendance = forecastAttendance.length > 0
      ? Math.round(forecastAttendance[forecastAttendance.length - 1].rate * 10) / 10
      : currentAttendance

    const attendanceDataPoints = raw.attendance.weeklyData.map(w => ({
      label: new Date(w.week).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      value: w.rate,
      isForecast: w.isForecast,
    }))

    // --- GPA ---
    const currentGPA = raw.grades.overallGPA
    const predictedGPAs = raw.grades.subjects
      .filter(s => s.predictedScore !== s.currentScore)
      .map(s => s.predictedScore)
    const predictedGPA = predictedGPAs.length > 0
      ? Math.round((predictedGPAs.reduce((a, b) => a + b, 0) / predictedGPAs.length) * 10) / 10
      : currentGPA

    const gpaDataPoints = raw.grades.subjects.map(s => ({
      label: s.subjectCode,
      value: s.currentScore,
      isForecast: false,
    }))
    // Add predicted points
    for (const s of raw.grades.subjects.filter(s => s.predictedScore !== s.currentScore)) {
      gpaDataPoints.push({
        label: s.subjectCode + '*',
        value: s.predictedScore,
        isForecast: true,
      })
    }

    // --- Fees ---
    const overdueFees = raw.fees.predictions.filter(f => f.risk === 'overdue')
    const atRiskFees = raw.fees.predictions.filter(f => f.risk === 'at-risk')
    let feeStatus = 'All Clear'
    let feeRiskLevel = 'low'
    if (overdueFees.length > 0) {
      feeStatus = `${overdueFees.length} Overdue`
      feeRiskLevel = 'high'
    } else if (atRiskFees.length > 0) {
      feeStatus = `${atRiskFees.length} At Risk`
      feeRiskLevel = 'medium'
    } else if (raw.fees.predictions.length > 0) {
      feeStatus = `${raw.fees.predictions.length} Pending`
    }

    const nextDue = raw.fees.predictions
      .filter(f => f.status !== 'PAID')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0]

    // --- Meals ---
    const actualMeals = raw.meals.forecast.filter(m => !m.isForecast)
    const forecastMeals = raw.meals.forecast.filter(m => m.isForecast)
    const currentMealAvg = actualMeals.length > 0
      ? Math.round((actualMeals.reduce((s, m) => s + m.mealsPerDay, 0) / actualMeals.length) * 10) / 10
      : 0
    const predictedMealAvg = forecastMeals.length > 0
      ? Math.round((forecastMeals.reduce((s, m) => s + m.mealsPerDay, 0) / forecastMeals.length) * 10) / 10
      : currentMealAvg

    const mealDataPoints = raw.meals.forecast.map(m => ({
      label: new Date(m.week).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      value: m.mealsPerDay,
      isForecast: m.isForecast,
    }))

    const transformed = {
      attendance: {
        current: currentAttendance,
        predicted: predictedAttendance,
        trend: raw.attendance.trend === 'improving' ? 'up' : raw.attendance.trend === 'declining' ? 'down' : 'stable',
        dataPoints: attendanceDataPoints,
      },
      gpa: {
        current: currentGPA,
        predicted: predictedGPA,
        dataPoints: gpaDataPoints,
      },
      fees: {
        status: feeStatus,
        riskLevel: feeRiskLevel,
        nextDueDate: nextDue ? nextDue.dueDate : undefined,
      },
      meals: {
        currentAvg: currentMealAvg,
        predictedAvg: predictedMealAvg,
        trend: raw.meals.trend === 'improving' ? 'up' : raw.meals.trend === 'declining' ? 'down' : 'stable',
        dataPoints: mealDataPoints,
      },
    }

    return Response.json(transformed)
  } catch (error) {
    console.error('Predictions error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
