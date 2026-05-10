# Metrics Plan

The North Star metric is **qualified completed audits per week**. A completed audit only counts as qualified if the user enters at least two paid tools or at least $100/month of AI spend and receives a valid recommendation screen. This fits the product better than DAU or page views because AISpendAudit is not a daily habit product. It is a periodic decision tool that creates value when a founder sees a credible savings estimate and decides whether to act.

The three input metrics I would watch first are:

1. Audit start rate from landing/app visit
2. Audit completion rate from started forms
3. High-savings lead capture rate from completed audits with >$500/month savings

The first instrumentation pass should track: page view, tool row added, audit started, audit submitted, audit result rendered, summary generated, lead submitted, share link created, and high-savings CTA viewed. I would also log anonymous aggregate fields like team size bucket, tool count, total monthly spend bucket, and savings bucket. I would avoid storing email/company name in analytics events because the public/share loop should stay privacy-conscious.

Healthy week-one numbers: 30% of visitors start an audit, 55% of starters complete it, 35% of completed audits submit email, and 40% of high-savings users click/save the Credex follow-up path. If starts are low, positioning is unclear. If starts are high but completion is low, the form is too slow or asks for too much too early. If completions are high but lead capture is low, the report is not valuable enough to save.

The pivot trigger is two consecutive weeks below 15 qualified completed audits despite at least 250 targeted visitors per week. That would mean the wedge is too narrow, the audience does not recognize the pain, or the audit is not producing enough credible savings. The first pivot would be from "AI spend audit" to a narrower "AI devtool seat audit" for engineering teams, because subscriptions are easier to understand than API token economics.

