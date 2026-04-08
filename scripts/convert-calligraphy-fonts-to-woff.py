from pathlib import Path

from fontTools.ttLib import TTFont


def main() -> None:
    repo = Path(__file__).resolve().parents[1]
    src_dir = repo.parent / 'chinesecalligraphy' / 'public' / 'fonts'
    out_dir = repo / 'public' / 'calligraphy-fonts-woff'
    out_dir.mkdir(parents=True, exist_ok=True)

    inputs = sorted(
        path
        for path in src_dir.iterdir()
        if path.is_file() and path.suffix.lower() in {'.ttf', '.otf', '.woff', '.woff2'}
    )

    for src in inputs:
        out = out_dir / f'{src.stem}.woff'
        font = TTFont(src)
        font.flavor = 'woff'
        font.save(out)
        print(f'{src.name} -> {out.name}')


if __name__ == '__main__':
    main()
