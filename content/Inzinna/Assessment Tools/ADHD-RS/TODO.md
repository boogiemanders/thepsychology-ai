# ADHD-RS — TODO

## Current Priority
- Build the school form next. This is the highest-leverage product move now that the home parent scorer is working.

## Next Steps
1. Document the interpretation policy in `PLAN.md`
   - Add Bret's percentile descriptor bands
   - Add the rule that impairment score `0` stays `No Problem` without percentile labeling
2. QA the home norm tables once against the source PDF
   - Verify symptom lookups
   - Verify impairment lookups
   - Freeze the home tables after the verification pass
3. Build the school scorer
   - Use the parsed school survey content
   - Use the parsed school norm tables
   - Match the same UX and result structure as the home form
4. Build the parent vs teacher agreement view
   - Compare home and school results side by side
   - Surface discrepancies clearly
5. Add regression tests for norm lookups
   - Symptom percentile lookup tests
   - Impairment percentile lookup tests
   - Descriptor band tests

## Notes
- Home parent symptom norms are live
- Home parent impairment norms are live
- Remaining major product gaps are school form and agreement view
