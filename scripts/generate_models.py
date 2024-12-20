import argparse
import subprocess
import re
import shutil
from pathlib import Path

block_start = '// AUTOGENERATED BY generate_models.py -- do not edit'
block_end = '// END AUTOGENERATED BY generate_models.py'
out_file = Path('src') / 'models.ts'

def make_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser()
    parser.add_argument('--db', help="Database file!", required=True)
    return parser

def main():
    parser = make_parser()
    args = parser.parse_args()

    if Path('.env').exists():
        shutil.copy(Path(".env"), Path(".env.bak"))

    with open('.env', 'w') as envfile:
        env_line = f"DATABASE_URL={str(args.db)}"
        envfile.write(env_line)

    # generate models
    subprocess.run([
        'kysely-codegen',
        '--out-file',
        str(out_file)
    ], shell=True)

    versions = subprocess.run([
        'sqlite3',
        str(args.db),
        'select * from version;',
        '.exit'
        ],
      capture_output=True)
    version_lines = versions.stdout.decode('utf-8').split('\n')
    versions = {line.split('|')[0]: int(line.split('|')[1]) for line in version_lines if len(line.split('|'))==2}

    version_vars = [
      f"  {k}: {v},"
      for k,v in versions.items()
    ]

    version_insert = "\n".join([
        block_start,
        "export const MODEL_VERSIONS = {",
        *version_vars,
        "};",
        block_end,
    ])

    with open(out_file, 'r') as ofile:
        model_file = ofile.read()

    model_file = re.sub(rf"{block_start}.*{block_end}", version_insert, model_file, flags=re.DOTALL)

    with open(out_file, 'w') as ofile:
        ofile.write(model_file)


if __name__ == "__main__":
    main()
