# Automated Tests

## `server/tests/auditEngine.test.ts`

1. `accepts a valid payload`  
Covers input validation via `auditInputSchema` with a valid audit request body.

2. `recommends downgrade for small-team enterprise plan`  
Covers downgrade logic when enterprise plans are used for very small seat counts.

3. `recommends copilot individual for single-seat business`  
Covers same-vendor plan optimization for GitHub Copilot single-seat input.

4. `recommends credits for high direct anthropic api spend`  
Covers credits recommendation logic for high direct API spend cases.

5. `keeps plan when no clear savings rule applies`  
Covers no-change behavior when engine cannot defensibly recommend savings.

6. `aggregates monthly and annual savings across tools`  
Covers roll-up math for total monthly and annual savings.

## How to Run

```bash
npm test --prefix server
```
