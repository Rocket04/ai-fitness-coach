#!/usr/bin/env python3
"""Test script for match_skills.py"""

import subprocess
import sys
from pathlib import Path

# Test prompts with expected top matches
TEST_CASES = [
    ("fix this bug", "diagnose"),
    ("scrape this URL", "firecrawl-scrape"),
    ("design a landing page", "frontend-design"),
    ("test this first", "tdd"),
    ("make a plan", "planning-with-files"),
    ("crawl this site", "firecrawl-crawl"),
    ("clean up commits", "pr-ready"),
    ("check accessibility", "web-design-guidelines"),
    ("architecture diagram", "architecture-diagram"),
    ("something unclear xyz", None),  # Should have no clear match
]

def run_test(prompt, expected_skill):
    """Run a single test case."""
    script_path = Path(__file__).parent / "match_skills.py"
    agents_path = Path(__file__).parent.parent.parent.parent / "AGENTS.md"

    try:
        result = subprocess.run(
            [sys.executable, str(script_path), prompt, "--agents-md", str(agents_path)],
            capture_output=True,
            text=True,
            timeout=10
        )

        if result.returncode != 0:
            print(f"❌ '{prompt}': Script error")
            print(f"   stderr: {result.stderr[:200]}")
            return False

        import json
        data = json.loads(result.stdout)

        if not data.get('matches'):
            if expected_skill is None:
                print(f"✓ '{prompt}': No match as expected")
                return True
            print(f"❌ '{prompt}': No matches found, expected {expected_skill}")
            return False

        top_match = data['matches'][0]['skill']
        confidence = data['matches'][0]['confidence']

        if expected_skill and top_match == expected_skill:
            print(f"✓ '{prompt}' → {top_match} ({confidence}%) [expected: {expected_skill}]")
            return True
        elif expected_skill is None and confidence < 40:
            print(f"✓ '{prompt}' → {top_match} ({confidence}%) [low confidence as expected]")
            return True
        else:
            print(f"❌ '{prompt}' → {top_match} ({confidence}%) [expected: {expected_skill}]")
            return False

    except Exception as e:
        print(f"❌ '{prompt}': Exception - {e}")
        return False

def main():
    print("Testing auto-router skill matcher...")
    print()

    passed = 0
    failed = 0

    for prompt, expected in TEST_CASES:
        if run_test(prompt, expected):
            passed += 1
        else:
            failed += 1

    print()
    print(f"Results: {passed} passed, {failed} failed")
    return failed == 0

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
