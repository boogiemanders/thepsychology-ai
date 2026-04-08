# BAARS-IV Self-Report: Current Symptoms

> Parsed from: `/Users/anderschan/Downloads/BAARS-ADHD-questionnaire-PLEASE-COMPLETE-with-respect-to-symptoms-while-OFF-ADHD-medication.pdf`
>
> Source pages used: 1-3
>
> Notes:
> - This is the questionnaire wording needed to build the lab demo form.
> - Response anchors for items 1-27 are the same across sections.
> - "Office Use Only" score rows were omitted because they are worksheet output, not form questions.

## Header Fields

- Name
- Date
- Sex
  - Male
  - Female
- Age

## Instructions

For the first 27 items, please circle the number next to each item below that best describes your behavior DURING THE PAST 6 MONTHS. Then answer the remaining three questions. Please ignore the sections marked "Office Use Only."

## Response Scale For Items 1-27

| Value | Label |
|---|---|
| 1 | Never or rarely |
| 2 | Sometimes |
| 3 | Often |
| 4 | Very often |

## Section 1: Inattention

1. Fail to give close attention to details or make careless mistakes in my work or other activities
2. Difficulty sustaining my attention in tasks or fun activities
3. Don't listen when spoken to directly
4. Don't follow through on instructions and fail to finish work or chores
5. Have difficulty organizing tasks and activities
6. Avoid, dislike, or am reluctant to engage in tasks that require sustained mental effort
7. Lose things necessary for tasks or activities
8. Easily distracted by extraneous stimuli or irrelevant thoughts
9. Forgetful in daily activities

## Section 2: Hyperactivity

10. Fidget with hands or feet or squirm in seat
11. Leave my seat in classrooms or in other situations in which remaining seated is expected
12. Shift around excessively or feel restless or hemmed in
13. Have difficulty engaging in leisure activities quietly (feel uncomfortable, or am loud or noisy)
14. I am "on the go" or act as if "driven by a motor" (or I feel like I have to be busy or always doing something)

## Section 3: Impulsivity

15. Talk excessively (in social situations)
16. Blurt out answers before questions have been completed, complete others' sentences, or jump the gun
17. Have difficulty awaiting my turn
18. Interrupt or intrude on others (butt into conversations or activities without permission or take over what others are doing)

## Section 4: Sluggish Cognitive Tempo

19. Prone to daydreaming when I should be concentrating on something or working
20. Have trouble staying alert or awake in boring situations
21. Easily confused
22. Easily bored
23. Spacey or "in a fog"
24. Lethargic, more tired than others
25. Underactive or have less energy than others
26. Slow moving
27. I don't seem to process information as quickly or as accurately as others

## Section 5: Follow-Up Questions

28. Did you experience any of these 27 symptoms at least "Often" or more frequently (Did you circle a 3 or a 4 above)?
   - Response options: `No`, `Yes`

29. If so, how old were you when those symptoms began?
   - Response type: integer age in years

30. If so, in which of these settings did those symptoms impair your functioning? Place a check mark next to all of the areas that apply to you.
   - School
   - Home
   - Work
   - Social Relationships

## Form-Build Notes

- The main symptom form consists of 27 Likert items plus 3 follow-up items.
- The natural lab demo structure is:
  - Step 1: respondent metadata
  - Step 2: sections 1-4 with shared 1-4 response anchors
  - Step 3: section 5 follow-up questions
- Section totals and symptom counts should be derived separately from the scorer workbook, not from this questionnaire file alone.
