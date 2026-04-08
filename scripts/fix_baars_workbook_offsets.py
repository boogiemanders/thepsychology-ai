#!/usr/bin/env python3

from __future__ import annotations

import argparse
import sys
import zipfile
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from pathlib import Path

MAIN_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
NS = {"main": MAIN_NS}
ET.register_namespace("", MAIN_NS)


@dataclass(frozen=True)
class WorkbookPatch:
    source_path: Path
    output_path: Path
    formulas: dict[str, str]


WORKBOOK_PATCHES = [
    WorkbookPatch(
        source_path=Path("/Users/anderschan/Downloads/BAARS_IV_SR_Scorer.xlsx"),
        output_path=Path("/Users/anderschan/Downloads/BAARS_IV_SR_Scorer.corrected.xlsx"),
        formulas={
            "D4": (
                "'Item Entry'!$B$5+'Item Entry'!$B$6+'Item Entry'!$B$7+"
                "'Item Entry'!$B$8+'Item Entry'!$B$9+'Item Entry'!$B$10+"
                "'Item Entry'!$B$11+'Item Entry'!$B$12+'Item Entry'!$B$13"
            ),
            "D5": (
                "'Item Entry'!$B$15+'Item Entry'!$B$16+'Item Entry'!$B$17+"
                "'Item Entry'!$B$18+'Item Entry'!$B$19"
            ),
            "D6": (
                "'Item Entry'!$B$21+'Item Entry'!$B$22+'Item Entry'!$B$23+"
                "'Item Entry'!$B$24"
            ),
            "D7": (
                "'Item Entry'!$B$5+'Item Entry'!$B$6+'Item Entry'!$B$7+"
                "'Item Entry'!$B$8+'Item Entry'!$B$9+'Item Entry'!$B$10+"
                "'Item Entry'!$B$11+'Item Entry'!$B$12+'Item Entry'!$B$13+"
                "'Item Entry'!$B$15+'Item Entry'!$B$16+'Item Entry'!$B$17+"
                "'Item Entry'!$B$18+'Item Entry'!$B$19+'Item Entry'!$B$21+"
                "'Item Entry'!$B$22+'Item Entry'!$B$23+'Item Entry'!$B$24"
            ),
            "D8": (
                "'Item Entry'!$B$26+'Item Entry'!$B$27+'Item Entry'!$B$28+"
                "'Item Entry'!$B$29+'Item Entry'!$B$30+'Item Entry'!$B$31+"
                "'Item Entry'!$B$32+'Item Entry'!$B$33+'Item Entry'!$B$34"
            ),
        },
    ),
    WorkbookPatch(
        source_path=Path("/Users/anderschan/Downloads/BAARS_IV_Childhood_Scorer.xlsx"),
        output_path=Path("/Users/anderschan/Downloads/BAARS_IV_Childhood_Scorer.corrected.xlsx"),
        formulas={
            "D4": (
                "'Item Entry'!$B$5+'Item Entry'!$B$6+'Item Entry'!$B$7+"
                "'Item Entry'!$B$8+'Item Entry'!$B$9+'Item Entry'!$B$10+"
                "'Item Entry'!$B$11+'Item Entry'!$B$12+'Item Entry'!$B$13"
            ),
            "D5": (
                "'Item Entry'!$B$15+'Item Entry'!$B$16+'Item Entry'!$B$17+"
                "'Item Entry'!$B$18+'Item Entry'!$B$19+'Item Entry'!$B$20+"
                "'Item Entry'!$B$21+'Item Entry'!$B$22+'Item Entry'!$B$23"
            ),
            "D6": (
                "'Item Entry'!$B$5+'Item Entry'!$B$6+'Item Entry'!$B$7+"
                "'Item Entry'!$B$8+'Item Entry'!$B$9+'Item Entry'!$B$10+"
                "'Item Entry'!$B$11+'Item Entry'!$B$12+'Item Entry'!$B$13+"
                "'Item Entry'!$B$15+'Item Entry'!$B$16+'Item Entry'!$B$17+"
                "'Item Entry'!$B$18+'Item Entry'!$B$19+'Item Entry'!$B$20+"
                "'Item Entry'!$B$21+'Item Entry'!$B$22+'Item Entry'!$B$23"
            ),
        },
    ),
]


def patch_workbook_xml(xml_bytes: bytes) -> bytes:
    root = ET.fromstring(xml_bytes)
    calc_pr = root.find("main:calcPr", NS)

    if calc_pr is None:
        calc_pr = ET.SubElement(root, f"{{{MAIN_NS}}}calcPr")

    calc_pr.set("calcMode", "auto")
    calc_pr.set("fullCalcOnLoad", "1")
    calc_pr.set("forceFullCalc", "1")
    calc_pr.set("calcId", calc_pr.attrib.get("calcId", "999999"))

    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def patch_score_sheet(xml_bytes: bytes, formulas: dict[str, str]) -> bytes:
    root = ET.fromstring(xml_bytes)
    updated_refs: set[str] = set()

    for cell in root.findall(".//main:sheetData/main:row/main:c", NS):
        ref = cell.attrib.get("r")
        if ref not in formulas:
            continue

        formula = cell.find("main:f", NS)
        if formula is None:
            formula = ET.SubElement(cell, f"{{{MAIN_NS}}}f")
        formula.text = formulas[ref]

        value = cell.find("main:v", NS)
        if value is None:
            value = ET.SubElement(cell, f"{{{MAIN_NS}}}v")
        if value.text is None:
            value.text = "0"

        updated_refs.add(ref)

    missing_refs = sorted(set(formulas) - updated_refs)
    if missing_refs:
        raise RuntimeError(f"Missing expected score cells in sheet XML: {', '.join(missing_refs)}")

    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def write_corrected_workbook(patch: WorkbookPatch) -> None:
    if not patch.source_path.exists():
        raise FileNotFoundError(f"Source workbook not found: {patch.source_path}")

    with zipfile.ZipFile(patch.source_path, "r") as source_zip:
        members = source_zip.infolist()
        payloads = {
            member.filename: source_zip.read(member.filename)
            for member in members
        }

    workbook_xml_path = "xl/workbook.xml"
    subscale_sheet_path = "xl/worksheets/sheet2.xml"

    payloads[workbook_xml_path] = patch_workbook_xml(payloads[workbook_xml_path])
    payloads[subscale_sheet_path] = patch_score_sheet(payloads[subscale_sheet_path], patch.formulas)

    with zipfile.ZipFile(patch.output_path, "w", compression=zipfile.ZIP_DEFLATED) as output_zip:
        for member in members:
            output_zip.writestr(member, payloads[member.filename])


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate corrected BAARS scorer workbooks with fixed Item Entry row references.",
    )
    parser.add_argument(
        "--verify-only",
        action="store_true",
        help="Validate that the corrected workbook files already exist.",
    )
    args = parser.parse_args()

    if args.verify_only:
        missing = [str(patch.output_path) for patch in WORKBOOK_PATCHES if not patch.output_path.exists()]
        if missing:
            print("Missing corrected workbook(s):", file=sys.stderr)
            for path in missing:
                print(f"  - {path}", file=sys.stderr)
            return 1

        print("All corrected BAARS workbooks exist.")
        return 0

    for patch in WORKBOOK_PATCHES:
        write_corrected_workbook(patch)
        print(f"Wrote {patch.output_path}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
