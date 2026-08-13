export function calculateClosingTotal(
  payments: ReadonlyArray<{ amount: number }>,
) {
  return payments.reduce((total, payment) => total + payment.amount, 0);
}
