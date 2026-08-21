import { calculateFinancialHealth } from './financial-health'
import { formatCurrency } from '../format'
import type {
  FinancialDecisionRequest,
  FinancialDecisionResult,
  DecisionAlternative,
  GoalImpactDetails,
} from '../types'

/**
 * Deterministic Financial Decision Engine
 * Evaluates financial queries against actual user data, Safe-to-Spend, upcoming obligations, and active goals.
 */
export async function evaluateFinancialDecision(
  userId: string,
  request: FinancialDecisionRequest
): Promise<FinancialDecisionResult> {
  const health = await calculateFinancialHealth(userId)
  const currency = 'INR'

  const requestedAmount = request.amount || 0
  const description = request.description || 'Purchase'
  const safeToSpend = health.safeToSpend
  const remainingSafeToSpend = Number((safeToSpend - requestedAmount).toFixed(2))

  // Base confidence inherited from Financial Health Engine
  const confidence = health.dataConfidence === 'high' ? 0.95 : health.dataConfidence === 'medium' ? 0.85 : 0.65

  // ─────────────────────────────────────────────────────────────
  // 1. PURCHASE & AFFORDABILITY EVALUATION
  // ─────────────────────────────────────────────────────────────
  if (request.type === 'PURCHASE' || request.type === 'AFFORDABILITY') {
    let decision: 'SAFE' | 'CAUTION' | 'NOT_RECOMMENDED' = 'SAFE'
    let riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW'
    const keyFactors: string[] = []

    // Evaluate Goal Impact (Financially Correct: Reduces future saving capacity)
    const goalImpact: GoalImpactDetails = { affected: false }

    if (health.goalBreakdown.length > 0) {
      const activeGoal = health.goalBreakdown[0]
      const goalRemaining = activeGoal.targetAmount - activeGoal.savedAmount

      if (goalRemaining > 0) {
        // Calculate original completion timeline in days
        const currentMonthlyCapacity = Math.max(1, health.monthlyIncome - health.monthlyEssentialExpenses - health.upcomingObligations)
        const currentMonthsToGoal = goalRemaining / currentMonthlyCapacity
        const currentDaysToGoal = Math.ceil(currentMonthsToGoal * 30)

        // Calculate post-purchase monthly capacity
        // Purchase reduces available liquid buffer for the current month
        const postPurchaseCapacity = Math.max(1, currentMonthlyCapacity - requestedAmount / 3)
        const newMonthsToGoal = goalRemaining / postPurchaseCapacity
        const newDaysToGoal = Math.ceil(newMonthsToGoal * 30)

        const daysDelayed = Math.max(0, newDaysToGoal - currentDaysToGoal)

        if (daysDelayed > 0 || requestedAmount > safeToSpend) {
          goalImpact.affected = true
          goalImpact.goalName = activeGoal.name
          goalImpact.daysDelayed = daysDelayed
          goalImpact.previousRequiredMonthlyContribution = activeGoal.requiredMonthlyContribution
          goalImpact.newRequiredMonthlyContribution = Number(
            (activeGoal.requiredMonthlyContribution * (1 + requestedAmount / Math.max(1, safeToSpend))).toFixed(2)
          )
          goalImpact.note = `Reduces future monthly saving capacity, delaying '${activeGoal.name}' by approx. ${daysDelayed} days.`
        }
      }
    }

    // Determine Decision Outcome & Risk Level
    if (requestedAmount <= safeToSpend) {
      if (remainingSafeToSpend < 5000 || goalImpact.affected) {
        decision = 'CAUTION'
        riskLevel = 'MODERATE'
        keyFactors.push(`Purchase fits within Safe-to-Spend (₹${safeToSpend.toLocaleString()}), but leaves a tight margin of ₹${remainingSafeToSpend.toLocaleString()}.`)
        if (goalImpact.affected) {
          keyFactors.push(`Reduces future saving capacity, potentially delaying '${goalImpact.goalName}' by ${goalImpact.daysDelayed} days.`)
        }
      } else {
        decision = 'SAFE'
        riskLevel = 'LOW'
        keyFactors.push(`Fully affordable within your Safe-to-Spend limit of ₹${safeToSpend.toLocaleString()}.`)
        keyFactors.push(`Leaves a comfortable remaining Safe-to-Spend of ₹${remainingSafeToSpend.toLocaleString()}.`)
        keyFactors.push(`Safety reserve (₹${health.safetyReserve.toLocaleString()}) and active goals remain protected.`)
      }
    } else {
      // Requested amount exceeds Safe-to-Spend
      if (requestedAmount <= health.estimatedAvailableBalance) {
        decision = 'CAUTION'
        riskLevel = 'HIGH'
        keyFactors.push(`Exceeds your Safe-to-Spend limit by ₹${Math.abs(remainingSafeToSpend).toLocaleString()}.`)
        keyFactors.push(`Encroaches into your Safety Reserve (₹${health.safetyReserve.toLocaleString()}) or goal allocations.`)
      } else {
        decision = 'NOT_RECOMMENDED'
        riskLevel = 'CRITICAL'
        keyFactors.push(`Exceeds your Estimated Available Balance of ₹${health.estimatedAvailableBalance.toLocaleString()}.`)
        keyFactors.push(`Would cause financial over-commitment and liquid shortfall.`)
      }
    }

    // Generate Calculated Alternatives (Honest: No imaginary product inventions)
    const alternatives: DecisionAlternative[] = []

    if (decision !== 'SAFE') {
      // Option A: Wait until next income cycle
      const daysToWait = Math.min(30, Math.ceil((requestedAmount - Math.max(0, safeToSpend)) / Math.max(100, health.monthlyIncome / 30)))
      alternatives.push({
        title: 'Wait for Next Income Cycle',
        optionType: 'WAIT',
        description: `Delaying this purchase by approx. ${daysToWait} days allows your liquidity buffer to recover cleanly.`,
        riskLevel: 'LOW',
        financialImpactNote: 'Protects safety reserve and preserves goal deadlines.',
        calculatedSavingsOrDelay: `Wait ~${daysToWait} days`,
      })

      // Option B: Honest Lower-Cost Threshold
      if (safeToSpend > 0) {
        alternatives.push({
          title: 'Limit Purchase to Safe-to-Spend Threshold',
          optionType: 'LOWER_COST',
          description: `Consider a purchase under ₹${safeToSpend.toLocaleString()} to remain 100% within your safe liquidity limit.`,
          riskLevel: 'LOW',
          financialImpactNote: `Keeps your remaining Safe-to-Spend positive.`,
          calculatedSavingsOrDelay: `Max budget: ₹${safeToSpend.toLocaleString()}`,
        })
      }

      // Option C: Save incrementally over months
      const monthsToSave = Math.ceil(requestedAmount / Math.max(1000, safeToSpend > 0 ? safeToSpend : 3000))
      const monthlyRate = Math.round(requestedAmount / monthsToSave)
      alternatives.push({
        title: `Save ₹${monthlyRate.toLocaleString()}/month for ${monthsToSave} Months`,
        optionType: 'SAVE_MORE',
        description: `Set aside ₹${monthlyRate.toLocaleString()} monthly to fund this purchase safely without impacting existing goals.`,
        riskLevel: 'LOW',
        financialImpactNote: `Zero impact on safety reserve.`,
        calculatedSavingsOrDelay: `₹${monthlyRate.toLocaleString()}/mo for ${monthsToSave} mos`,
      })
    }

    // Construct Human Explanation
    const reason =
      decision === 'SAFE'
        ? `The ₹${requestedAmount.toLocaleString()} purchase for '${description}' is safe and fully affordable within your Safe-to-Spend limit.`
        : decision === 'CAUTION'
        ? `The ₹${requestedAmount.toLocaleString()} purchase for '${description}' is technically possible, but tightens your liquidity margin.`
        : `The ₹${requestedAmount.toLocaleString()} purchase for '${description}' exceeds your safe spending capacity and is not recommended right now.`

    const explanation = `${reason} Your Estimated Available Balance is ₹${health.estimatedAvailableBalance.toLocaleString()} with a Safe-to-Spend limit of ₹${safeToSpend.toLocaleString()}.`

    return {
      decision,
      riskLevel,
      requestedAmount,
      description,
      safeToSpend,
      remainingSafeToSpend,
      goalImpact,
      obligationImpact: {
        affected: requestedAmount > safeToSpend,
        reserveViolation: requestedAmount > (health.estimatedAvailableBalance - health.safetyReserve),
        notes: requestedAmount > safeToSpend ? 'May reduce safety reserve buffer if unexpected bills arise.' : undefined,
      },
      reason,
      explanation,
      keyFactors,
      alternatives,
      confidence,
      dataConfidence: health.dataConfidence,
      confidenceNote: health.confidenceNote,
      createdAt: new Date().toISOString(),
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 2. INCOME SHOCK SIMULATION ("What if my income falls 20%?")
  // ─────────────────────────────────────────────────────────────
  if (request.type === 'INCOME_SHOCK') {
    const shockPercent = request.percentageChange || 20
    const newMonthlyIncome = health.monthlyIncome * (1 - shockPercent / 100)
    const incomeReduction = health.monthlyIncome - newMonthlyIncome

    const simulatedDiscretionary = Math.max(0, newMonthlyIncome - health.monthlyEssentialExpenses - health.upcomingObligations)
    const simulatedSafeToSpend = Math.max(0, health.estimatedAvailableBalance - health.upcomingObligations - health.goalCommitments - health.safetyReserve)

    const decision = simulatedDiscretionary < health.goalCommitments ? 'CAUTION' : 'SAFE'
    const riskLevel = simulatedDiscretionary < health.goalCommitments ? 'HIGH' : 'MODERATE'

    const reason = `A ${shockPercent}% income reduction reduces monthly income from ₹${health.monthlyIncome.toLocaleString()} to ₹${Math.round(newMonthlyIncome).toLocaleString()} (-₹${Math.round(incomeReduction).toLocaleString()}).`
    const explanation = `${reason} Monthly discretionary capacity decreases to ₹${Math.round(simulatedDiscretionary).toLocaleString()}. Your safety reserve (₹${health.safetyReserve.toLocaleString()}) provides temporary protection.`

    return {
      decision,
      riskLevel,
      requestedAmount: incomeReduction,
      description: `${shockPercent}% Income Reduction Simulation`,
      safeToSpend,
      remainingSafeToSpend: simulatedSafeToSpend,
      reason,
      explanation,
      keyFactors: [
        `Monthly income drops by ₹${Math.round(incomeReduction).toLocaleString()} to ₹${Math.round(newMonthlyIncome).toLocaleString()}.`,
        `Discretionary cash flow reduced to ₹${Math.round(simulatedDiscretionary).toLocaleString()}/month.`,
        `Safety reserve of ₹${health.safetyReserve.toLocaleString()} covers approx. ${Math.round(health.safetyReserve / Math.max(1, health.monthlyEssentialExpenses))} month(s) of essential expenses.`,
      ],
      alternatives: [
        {
          title: 'Trim Non-Essential Subscriptions & Dining',
          optionType: 'LOWER_COST',
          description: 'Reducing discretionary dining and subscriptions can offset the income shock.',
          riskLevel: 'LOW',
          financialImpactNote: 'Preserves active goal commitments.',
          calculatedSavingsOrDelay: 'Offset income gap',
        },
      ],
      confidence,
      dataConfidence: health.dataConfidence,
      confidenceNote: health.confidenceNote,
      createdAt: new Date().toISOString(),
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 3. EXPENSE SHOCK SIMULATION ("What if expenses increase by 5,000?")
  // ─────────────────────────────────────────────────────────────
  if (request.type === 'EXPENSE_SHOCK' || request.type === 'SCENARIO') {
    const extraExpense = requestedAmount || 5000
    const newMonthlySpending = health.monthlySpending + extraExpense
    const simulatedSafeToSpend = Number((safeToSpend - extraExpense).toFixed(2))

    const decision = simulatedSafeToSpend >= 0 ? 'SAFE' : 'CAUTION'
    const riskLevel = simulatedSafeToSpend >= 0 ? 'LOW' : 'HIGH'

    const reason = `An extra ₹${extraExpense.toLocaleString()}/month increases monthly spending to ₹${newMonthlySpending.toLocaleString()}.`
    const explanation = `${reason} Safe-to-Spend changes from ₹${safeToSpend.toLocaleString()} to ₹${Math.max(0, simulatedSafeToSpend).toLocaleString()}.`

    return {
      decision,
      riskLevel,
      requestedAmount: extraExpense,
      description: `Monthly Expense Increase (+₹${extraExpense.toLocaleString()})`,
      safeToSpend,
      remainingSafeToSpend: Math.max(0, simulatedSafeToSpend),
      reason,
      explanation,
      keyFactors: [
        `Monthly expenses rise to ₹${newMonthlySpending.toLocaleString()}.`,
        `Remaining Safe-to-Spend becomes ₹${Math.max(0, simulatedSafeToSpend).toLocaleString()}.`,
      ],
      alternatives: [],
      confidence,
      dataConfidence: health.dataConfidence,
      confidenceNote: health.confidenceNote,
      createdAt: new Date().toISOString(),
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 4. GOAL DEADLINE DECISION ("Can I reach 1 Lakh in 6 months?")
  // ─────────────────────────────────────────────────────────────
  const targetGoalAmount = request.targetAmount || requestedAmount || 100000
  const targetMonths = request.deadline ? parseInt(request.deadline) || 6 : 6
  const requiredMonthly = Math.round(targetGoalAmount / targetMonths)
  const currentDiscretionary = Math.max(0, health.monthlyIncome - health.monthlyEssentialExpenses - health.upcomingObligations)

  const isAchievable = currentDiscretionary >= requiredMonthly
  const shortfall = isAchievable ? 0 : requiredMonthly - currentDiscretionary

  const decision = isAchievable ? 'SAFE' : 'NOT_RECOMMENDED'
  const riskLevel = isAchievable ? 'LOW' : 'HIGH'

  const reason = isAchievable
    ? `Your target of ₹${targetGoalAmount.toLocaleString()} in ${targetMonths} months requires ₹${requiredMonthly.toLocaleString()}/month, which fits your discretionary capacity of ₹${Math.round(currentDiscretionary).toLocaleString()}/month.`
    : `Targeting ₹${targetGoalAmount.toLocaleString()} in ${targetMonths} months requires ₹${requiredMonthly.toLocaleString()}/month, creating a monthly shortfall of ₹${shortfall.toLocaleString()}.`

  const explanation = `${reason}`

  const alternatives: DecisionAlternative[] = []
  if (!isAchievable) {
    const realisticMonths = Math.ceil(targetGoalAmount / Math.max(1, currentDiscretionary))
    alternatives.push({
      title: `Extend Goal Deadline to ${realisticMonths} Months`,
      optionType: 'ADJUST_GOAL',
      description: `Adjusting the deadline to ${realisticMonths} months requires ₹${Math.round(currentDiscretionary).toLocaleString()}/month, matching your current savings capacity.`,
      riskLevel: 'LOW',
      financialImpactNote: 'Achievable without over-committing.',
      calculatedSavingsOrDelay: `Extend to ${realisticMonths} mos`,
    })
  }

  return {
    decision,
    riskLevel,
    requestedAmount: targetGoalAmount,
    description: `Goal Target ₹${targetGoalAmount.toLocaleString()} in ${targetMonths} Months`,
    safeToSpend,
    remainingSafeToSpend: safeToSpend,
    reason,
    explanation,
    keyFactors: [
      `Required monthly savings: ₹${requiredMonthly.toLocaleString()}/month.`,
      `Current monthly savings capacity: ₹${Math.round(currentDiscretionary).toLocaleString()}/month.`,
      shortfall > 0 ? `Monthly shortfall: ₹${shortfall.toLocaleString()}/month.` : 'Capacity is sufficient.',
    ],
    alternatives,
    confidence,
    dataConfidence: health.dataConfidence,
    confidenceNote: health.confidenceNote,
    createdAt: new Date().toISOString(),
  }
}
