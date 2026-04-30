# Inzinna Build Summary. Week of April 30 - May 6, 2026

> For leadership meeting, May 6, 2026

## Items to flag

### Insurance list in the Clinic Manual is out of date

While building the public-facing visitor chatbot for drinzinna.com, I cross-checked the insurance list and found a mismatch.

**What the internal Clinic Manual says we accept:**
- Aetna, United, BCBS

**What Zocdoc actually shows we accept:**
- Aetna
- Cigna
- Oscar Health Insurance
- UnitedHealthcare (including Oxford, UMR, UnitedHealthOne)
- Harvard Pilgrim Health Care
- Caterpillar

**Two issues:**

1. **BCBS is in the Clinic Manual but not in Zocdoc.** Either we stopped accepting BCBS and the manual was never updated, or we still accept it but Zocdoc was never updated.
2. **Cigna, Oscar, Harvard Pilgrim, and Caterpillar are in Zocdoc but not in the Clinic Manual.** Same problem the other way.

**Why it matters:**
- Staff using the internal chatbot will get wrong answers when patients ask about insurance.
- The new public-facing chatbot mirrors Zocdoc, so it may contradict what staff tell patients.
- Patients who call asking about Cigna or Oscar might be turned away even though we accept them.

**Ask:** Confirm the actual current list, then update whichever source (Clinic Manual or Zocdoc) is wrong so they match.
