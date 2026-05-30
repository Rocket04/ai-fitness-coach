#!/usr/bin/env python3
"""Package the auto-router skill into a distributable zip file."""

import zipfile
import os
from pathlib import Path

def package_skill():
    skill_dir = Path('.kilo/skills/auto-router')
    output_zip = Path('.kilo/skills/auto-router.zip')

    # Files to include
    files_to_package = [
        'SKILL.md',
        'scripts/match_skills.py',
        'scripts/test_matcher.py',
    ]

    with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as zf:
        for file_path in files_to_package:
            full_path = skill_dir / file_path
            if full_path.exists():
                # Store with relative path from skill directory
                zf.write(full_path, file_path)
                print(f"Added: {file_path}")
            else:
                print(f"Warning: {file_path} not found")

    print(f"\nCreated: {output_zip}")
    print(f"Size: {output_zip.stat().st_size} bytes")

if __name__ == '__main__':
    os.chdir('c:/Projects/fitness-tracker')
    package_skill()
