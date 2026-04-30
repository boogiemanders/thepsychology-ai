# ADHD-RS Home Scorer Workbook

Parsed from `/Users/anderschan/Downloads/ADHD_RS_Home_Scorer2.xlsx` on 2026-04-09.

## Workbook Structure

The workbook contains 3 visible sheets:

1. `Item Entry`
2. `Subscale Scores`
3. `Impairment Subscales`

There are no hidden sheets, no data validation rules, and no lookup or norms sheets embedded in the workbook.

## Sheet 1: Item Entry

Purpose: raw manual score entry.

Top note:

`Enter scores 0–3 in the Score column. All calculations update automatically.`

### Layout

- `Items 1–9` = IA core symptoms
- `Items 10–15` = IA impairment items
- `Items 16–24` = HI core symptoms
- `Items 25–30` = HI impairment items

### Row Mapping

| Item # | Score Cell |
| --- | --- |
| 1 | `B5` |
| 2 | `B6` |
| 3 | `B7` |
| 4 | `B8` |
| 5 | `B9` |
| 6 | `B10` |
| 7 | `B11` |
| 8 | `B12` |
| 9 | `B13` |
| 10 | `B15` |
| 11 | `B16` |
| 12 | `B17` |
| 13 | `B18` |
| 14 | `B19` |
| 15 | `B20` |
| 16 | `B22` |
| 17 | `B23` |
| 18 | `B24` |
| 19 | `B25` |
| 20 | `B26` |
| 21 | `B27` |
| 22 | `B28` |
| 23 | `B29` |
| 24 | `B30` |
| 25 | `B32` |
| 26 | `B33` |
| 27 | `B34` |
| 28 | `B35` |
| 29 | `B36` |
| 30 | `B37` |

## Sheet 2: Subscale Scores

Purpose: sum IA, HI, and Total raw scores and assign a severity label.

### Raw Score Formulas

- `D4` IA raw score:

```excel
'Item Entry'!$B$5+'Item Entry'!$B$6+'Item Entry'!$B$7+'Item Entry'!$B$8+'Item Entry'!$B$9+'Item Entry'!$B$10+'Item Entry'!$B$11+'Item Entry'!$B$12+'Item Entry'!$B$13
```

- `D5` HI raw score:

```excel
'Item Entry'!$B$22+'Item Entry'!$B$23+'Item Entry'!$B$24+'Item Entry'!$B$25+'Item Entry'!$B$26+'Item Entry'!$B$27+'Item Entry'!$B$28+'Item Entry'!$B$29+'Item Entry'!$B$30
```

- `D6` Total raw score:

```excel
=D4+D5
```

### Threshold Text Stored In Sheet

- IA:
  - `>=11` possible subclinical elevation
  - `>=17` guaranteed mild elevation or higher
  - `>=22` guaranteed moderate elevation or higher
  - `>=25` guaranteed high elevation
- HI:
  - `>=4` possible subclinical elevation
  - `>=17` guaranteed mild elevation or higher
  - `>=18` guaranteed moderate elevation or higher
  - `>=24` guaranteed high elevation
- Total:
  - `>=15` possible subclinical elevation
  - `>=31` guaranteed mild elevation or higher
  - `>=38` guaranteed moderate elevation or higher
  - `>=45` guaranteed high elevation

### Interpretation Formulas

- `F4`

```excel
=IF(D4>=11,"Possible subclinical elevation (age/gender dependent)",IF(D4>=17,"Guaranteed mild elevation or higher",IF(D4>=22,"Guaranteed moderate elevation or higher",IF(D4>=25,"Guaranteed high elevation","—"))))
```

- `F5`

```excel
=IF(D5>=4,"Possible subclinical elevation (age/gender dependent)",IF(D5>=17,"Guaranteed mild elevation or higher",IF(D5>=18,"Guaranteed moderate elevation or higher",IF(D5>=24,"Guaranteed high elevation","—"))))
```

- `F6`

```excel
=IF(D6>=15,"Possible subclinical elevation (age/gender dependent)",IF(D6>=31,"Guaranteed mild elevation or higher",IF(D6>=38,"Guaranteed moderate elevation or higher",IF(D6>=45,"Guaranteed high elevation","—"))))
```

## Sheet 3: Impairment Subscales

Purpose: pull paired IA and HI impairment values for 6 domains:

1. Family Relations
2. Peer Relations
3. Homework
4. Academics
5. Behavior
6. Self-Esteem

### Intended Item Mapping Listed In Sheet

- IA items: `10–15`
- HI items: `25–30`

### Actual Formulas In Workbook

- `D4 = 'Item Entry'!$B$13`
- `F4 = 'Item Entry'!$B$28`
- `D5 = 'Item Entry'!$B$14`
- `F5 = 'Item Entry'!$B$29`
- `D6 = 'Item Entry'!$B$15`
- `F6 = 'Item Entry'!$B$30`
- `D7 = 'Item Entry'!$B$16`
- `F7 = 'Item Entry'!$B$31`
- `D8 = 'Item Entry'!$B$17`
- `F8 = 'Item Entry'!$B$32`
- `D9 = 'Item Entry'!$B$18`
- `F9 = 'Item Entry'!$B$33`

### Expected vs Actual

Based on the `Item Entry` layout, the expected references should be:

| Domain | Expected IA Cell | Actual IA Cell | Expected HI Cell | Actual HI Cell |
| --- | --- | --- | --- | --- |
| Family Relations | `B15` | `B13` | `B32` | `B28` |
| Peer Relations | `B16` | `B14` | `B33` | `B29` |
| Homework | `B17` | `B15` | `B34` | `B30` |
| Academics | `B18` | `B16` | `B35` | `B31` |
| Behavior | `B19` | `B17` | `B36` | `B32` |
| Self-Esteem | `B20` | `B18` | `B37` | `B33` |

So the impairment sheet appears offset and does not line up with the item-entry structure.

## Conditional Formatting

### Subscale Scores

The sheet uses conditional formatting thresholds on both the raw score cells and interpretation cells:

- IA: `>=11`, `>=17`, `>=22`, `>=25`
- HI: `>=4`, `>=17`, `>=18`, `>=24`
- Total: `>=15`, `>=31`, `>=38`, `>=45`

### Impairment Subscales

Each pulled impairment score cell is highlighted when:

```excel
>=1
```

## Important Findings

### 1. The workbook is not truly age/gender-aware

The sheet text says:

`Severity thresholds vary by age and gender.`

But the workbook contains:

- no age input used in formulas
- no gender input used in formulas
- no norms lookup sheet
- no lookup formulas (`VLOOKUP`, `INDEX/MATCH`, `XLOOKUP`, etc.)

So this scorer is not a dynamic norms engine. It is a fixed-threshold scorer.

### 2. The interpretation formulas are logically wrong

The nested `IF` formulas check thresholds from lowest to highest.

Example:

```excel
=IF(D4>=11,"Possible...",IF(D4>=17,"Mild...",IF(D4>=22,"Moderate...",IF(D4>=25,"High...","—"))))
```

That means:

- any IA score `>=11` returns `Possible...`
- the formula never reaches the `>=17`, `>=22`, or `>=25` branches

The same issue exists for HI and Total.

So the text interpretation cells will under-classify elevated scores.

### 3. The impairment formulas appear miswired

The workbook states that IA impairment items are `10–15` and HI impairment items are `25–30`, but the formulas point to earlier rows that do not align with those items.

This means the impairment subscale sheet should not be trusted as-is.

### 4. Input is not constrained

There are no data validation rules on the entry sheet, so the workbook does not enforce `0–3` entries.

## Bottom Line

This workbook is useful as:

- a rough raw-score entry template
- a clue about intended IA / HI / Total thresholds
- a clue about intended impairment domain structure

It should not be treated as a clean reference implementation without fixes.

If used for the app, the main issues to correct are:

1. replace hardcoded interpretation logic with proper norms-aware lookup
2. fix the severity formula ordering
3. fix impairment item references
4. add explicit 0-3 input constraints
