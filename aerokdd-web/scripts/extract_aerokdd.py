import json
import re
from pathlib import Path
from openpyxl import load_workbook

# --- Configuration ---
RAW_DIR = Path("raw_data")
OUT_DIR = Path("public/data")
OUT_DIR.mkdir(parents=True, exist_ok=True)


def clean_str(val) -> str:
    if val is None:
        return ""
    return str(val).strip()


def normalize_subsystem(raw_code: str, raw_name: str = "") -> str:
    s = (raw_code or raw_name).upper().strip()
    if "FAN" in s or "SOUFFL" in s:
        return "FAN"
    if "BOOST" in s or s in ("CBP", "LPC") or "LPC" in s:
        return "BOOSTER"
    if "HPC" in s or s == "CHP":
        return "HPC"
    if "COMB" in s or s == "CC" or "CHAMBRE" in s:
        return "COMB"
    if "HPT" in s:
        return "HPT"
    if "LPT" in s:
        return "LPT"
    if "NOZZ" in s or "TUY" in s:
        return "NOZZLE"
    if "COOL" in s or "REFROID" in s:
        return "COOLING"
    if "ELEC" in s or "LECTR" in s:
        return "ELECTRICAL"
    if "OIL" in s or "LUB" in s or "HUIL" in s:
        return "OIL"
    return s or "NON CLASSE"


def canonical_key(id_txt: str) -> str:
    if "-" not in id_txt:
        return ""
    parts = id_txt.split("-", 1)
    prefix = normalize_subsystem(parts[0])
    digits = re.sub(r"\D", "", parts[1])
    return f"{prefix}|{int(digits)}" if digits else ""


def find_header_row(ws, keywords: tuple[str, ...], max_row: int = 10, max_col: int = 6) -> int:
    for r in range(1, max_row + 1):
        for c in range(1, max_col + 1):
            txt = clean_str(ws.cell(r, c).value).upper()
            if any(k in txt for k in keywords):
                return r
    return 1


def extract_spec_statuses(wb) -> dict[str, str]:
    """Reads 'Statut KDD (Filtre)' from all SPEC-* sheets keyed by canonical ID."""
    status_by_key: dict[str, str] = {}

    for ws in wb.worksheets:
        if not ws.title.upper().strip().startswith("SPEC"):
            continue

        sys_raw = ws.title.split("-", 1)[1].strip() if "-" in ws.title else ws.title[4:].strip()
        sys_code = normalize_subsystem(sys_raw)
        h_row = find_header_row(ws, ("NOM KDD", "ID KDD", "#"))

        col_id, col_nom, col_statut = 1, 2, 11
        for c in range(1, 26):
            hdr = clean_str(ws.cell(h_row, c).value).upper()
            if hdr in ("#", "ID", "ID KDD"):
                col_id = c
            elif "NOM" in hdr and len(hdr) < 25:
                col_nom = c
            elif hdr == "STATUT KDD (FILTRE)":
                col_statut = c

        seq = 0
        for r in range(h_row + 1, ws.max_row + 1):
            id_val = clean_str(ws.cell(r, col_id).value)
            nom_val = clean_str(ws.cell(r, col_nom).value)
            if not nom_val or id_val.upper().startswith("FAMILLE") or nom_val.upper().startswith("FAMILLE") or id_val == "#":
                continue

            seq += 1
            statut_val = clean_str(ws.cell(r, col_statut).value)
            if "-" in id_val:
                ck = canonical_key(id_val)
            elif id_val.isdigit():
                ck = f"{sys_code}|{int(id_val)}"
            else:
                ck = f"{sys_code}|{seq}"

            if ck and statut_val:
                status_by_key[ck] = statut_val

    return status_by_key


def extract_kdds(wb, status_by_key: dict[str, str]) -> list[dict]:
    ws = wb["DATA-KDDs"]
    kdds = []
    for r in range(2, ws.max_row + 1):
        kdd_id = clean_str(ws.cell(r, 1).value)
        if not kdd_id:
            continue

        code_sys = normalize_subsystem(clean_str(ws.cell(r, 3).value), clean_str(ws.cell(r, 4).value))
        ck = canonical_key(kdd_id)

        kdds.append({
            "id": kdd_id,
            "selectionKey": clean_str(ws.cell(r, 2).value) or f"{kdd_id} | {clean_str(ws.cell(r, 8).value)}",
            "subsystemCode": code_sys,
            "subsystemLabel": clean_str(ws.cell(r, 4).value),
            "specSheet": clean_str(ws.cell(r, 5).value),
            "family": clean_str(ws.cell(r, 6).value),
            "number": int(ws.cell(r, 7).value) if str(ws.cell(r, 7).value).isdigit() else None,
            "name": clean_str(ws.cell(r, 8).value),
            "definition": clean_str(ws.cell(r, 9).value),
            "type": clean_str(ws.cell(r, 10).value),
            "classification": clean_str(ws.cell(r, 11).value),
            "level": clean_str(ws.cell(r, 12).value),
            "importance": clean_str(ws.cell(r, 13).value),
            "techChoices": clean_str(ws.cell(r, 14).value),
            "locks": clean_str(ws.cell(r, 15).value),
            "lockNature": clean_str(ws.cell(r, 16).value),
            "specRef": clean_str(ws.cell(r, 17).value),
            "statutKdd": status_by_key.get(ck, ""),
        })
    return kdds


def extract_relations(wb) -> list[dict]:
    ws = wb["KDD - Relations"]
    h_row = find_header_row(ws, ("ID RELATION", "ID KDD SOURCE"))
    relations = []
    for r in range(h_row + 1, ws.max_row + 1):
        src_id = clean_str(ws.cell(r, 2).value)
        tgt_id = clean_str(ws.cell(r, 5).value)
        if not src_id or not tgt_id:
            continue

        relations.append({
            "id": clean_str(ws.cell(r, 1).value) or f"REL-{len(relations) + 1:03d}",
            "sourceId": src_id,
            "sourceName": clean_str(ws.cell(r, 3).value),
            "sourceSubsystem": clean_str(ws.cell(r, 4).value),
            "targetId": tgt_id,
            "targetName": clean_str(ws.cell(r, 6).value),
            "targetSubsystem": clean_str(ws.cell(r, 7).value),
            "nature": clean_str(ws.cell(r, 8).value),
            "influence": clean_str(ws.cell(r, 9).value),
            "justification": clean_str(ws.cell(r, 10).value),
            "equation": clean_str(ws.cell(r, 11).value),
            "requiredData": clean_str(ws.cell(r, 12).value),
            "sourceRef": clean_str(ws.cell(r, 13).value),
            "validationStatus": clean_str(ws.cell(r, 14).value),
            "notes": clean_str(ws.cell(r, 15).value),
        })
    return relations


def extract_bibliotheque(wb) -> list[dict]:
    ws = wb["BIBLIOTHEQUE DES RELATIONS-KDD"]
    h_row = find_header_row(ws, ("ID RELATION", "ID KDD SOURCE"))
    bib = []
    for r in range(h_row + 1, ws.max_row + 1):
        src_id = clean_str(ws.cell(r, 2).value)
        tgt_id = clean_str(ws.cell(r, 6).value)
        if not src_id or not tgt_id:
            continue

        bib.append({
            "id": clean_str(ws.cell(r, 1).value),
            "sourceId": src_id,
            "sourceName": clean_str(ws.cell(r, 3).value),
            "sourceSubsystem": clean_str(ws.cell(r, 4).value),
            "sourceFamily": clean_str(ws.cell(r, 5).value),
            "targetId": tgt_id,
            "targetName": clean_str(ws.cell(r, 7).value),
            "targetSubsystem": clean_str(ws.cell(r, 8).value),
            "targetFamily": clean_str(ws.cell(r, 9).value),
            "nature": clean_str(ws.cell(r, 10).value),
            "influence": clean_str(ws.cell(r, 11).value),
            "justification": clean_str(ws.cell(r, 12).value),
            "equation": clean_str(ws.cell(r, 13).value),
            "requiredData": clean_str(ws.cell(r, 14).value),
            "sourceRef": clean_str(ws.cell(r, 15).value),
            "validationStatus": clean_str(ws.cell(r, 16).value),
            "scope": clean_str(ws.cell(r, 17).value),
            "maturity": clean_str(ws.cell(r, 18).value),
            "reviewAction": clean_str(ws.cell(r, 19).value),
            "notes": clean_str(ws.cell(r, 20).value),
        })
    return bib


def extract_sources(wb) -> list[dict]:
    ws = wb["SOURCES_REL"]
    h_row = find_header_row(ws, ("ID SOURCE", "ORGANISME"))
    sources = []
    for r in range(h_row + 1, ws.max_row + 1):
        src_id = clean_str(ws.cell(r, 1).value)
        if not src_id:
            continue

        sources.append({
            "id": src_id,
            "organization": clean_str(ws.cell(r, 2).value),
            "title": clean_str(ws.cell(r, 3).value),
            "domains": clean_str(ws.cell(r, 4).value),
            "url": clean_str(ws.cell(r, 5).value),
            "scopeLimits": clean_str(ws.cell(r, 6).value),
        })
    return sources


def main():
    xlsm_files = list(RAW_DIR.glob("*.xlsm"))
    if not xlsm_files:
        raise FileNotFoundError(f"No .xlsm workbook found in {RAW_DIR.resolve()}")

    wb_path = xlsm_files[0]
    print(f"Loading workbook: {wb_path.name} ...")
    wb = load_workbook(wb_path, data_only=True, read_only=False)

    status_map = extract_spec_statuses(wb)
    datasets = {
        "kdds.json": extract_kdds(wb, status_map),
        "relations.json": extract_relations(wb),
        "bibliotheque.json": extract_bibliotheque(wb),
        "sources.json": extract_sources(wb),
    }

    for filename, payload in datasets.items():
        out_path = OUT_DIR / filename
        out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"Wrote {out_path} ({len(payload)} records)")


if __name__ == "__main__":
    main()