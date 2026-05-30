#!/usr/bin/env python3
"""
Skill matcher for auto-router.
Matches user prompts against trigger phrases from AGENTS.md.
"""

import re
import sys
import json
import argparse
from pathlib import Path
from typing import List, Dict, Tuple, Optional

# Try to import thefuzz for fuzzy matching, fallback to simple matching
try:
    from thefuzz import fuzz, process
    HAS_THEFUZZ = True
except ImportError:
    HAS_THEFUZZ = False


def parse_agents_md(filepath: str) -> List[Dict[str, any]]:
    """Parse AGENTS.md and extract the trigger-word table."""
    skills = []
    current_category = None

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the Agent Skills / Trigger Words section
    skills_section = re.search(
        r'## Agent Skills / Trigger Words\s*\n.*?\n(.*?)(?:\n## |\Z)',
        content,
        re.DOTALL
    )

    if not skills_section:
        return skills

    section_content = skills_section.group(1)

    # Parse category headers and tables
    lines = section_content.split('\n')
    table_lines = []
    in_table = False

    for line in lines:
        # Check for category header
        cat_match = re.match(r'### (.+)', line)
        if cat_match:
            current_category = cat_match.group(1).strip()
            continue

        # Table header separator
        if re.match(r'\|[-\s|]+\|', line):
            in_table = True
            continue

        # Table row
        if in_table and line.strip().startswith('|'):
            table_lines.append((line, current_category))
        elif in_table and not line.strip().startswith('|'):
            in_table = False

    # Parse table rows
    for line, category in table_lines:
        # Skip header row
        if 'Trigger phrase' in line or 'Skill' in line:
            continue

        # Parse pipe-delimited cells
        cells = [cell.strip() for cell in line.split('|')[1:-1]]
        if len(cells) >= 3:
            trigger_phrases = [p.strip().strip('"') for p in cells[0].split(',')]
            skill_name = cells[1].strip().strip('`')
            description = cells[2]

            skills.append({
                'name': skill_name,
                'category': category or 'General',
                'trigger_phrases': trigger_phrases,
                'description': description
            })

    return skills


def calculate_confidence(user_prompt: str, skill: Dict) -> int:
    """Calculate confidence score (0-100) for a skill match."""
    prompt_lower = user_prompt.lower()

    if HAS_THEFUZZ:
        # Use fuzzy matching if available
        scores = []
        for phrase in skill['trigger_phrases']:
            # Token set ratio handles word order variations better
            token_score = fuzz.token_set_ratio(prompt_lower, phrase.lower())
            # Partial ratio for substring matches
            partial_score = fuzz.partial_ratio(prompt_lower, phrase.lower())
            scores.append(max(token_score, partial_score))

        return max(scores) if scores else 0
    else:
        # Fallback to simple keyword matching
        max_score = 0
        for phrase in skill['trigger_phrases']:
            phrase_lower = phrase.lower()

            # Exact match = 100
            if prompt_lower == phrase_lower:
                return 100

            # Contains phrase = 90
            if phrase_lower in prompt_lower:
                max_score = max(max_score, 90)
                continue

            # Word overlap
            prompt_words = set(prompt_lower.split())
            phrase_words = set(phrase_lower.split())

            if phrase_words:
                overlap = len(prompt_words & phrase_words)
                coverage = overlap / len(phrase_words)
                score = int(coverage * 80)
                max_score = max(max_score, score)

        return max_score


def find_matches(user_prompt: str, skills: List[Dict], top_n: int = 5) -> Dict:
    """Find top matching skills for a user prompt."""
    scored_skills = []

    for skill in skills:
        confidence = calculate_confidence(user_prompt, skill)
        if confidence > 0:
            scored_skills.append({
                **skill,
                'confidence': confidence
            })

    # Sort by confidence descending
    scored_skills.sort(key=lambda x: x['confidence'], reverse=True)

    # Get top N
    top_matches = scored_skills[:top_n]

    # Determine if we have a clear match
    has_clear_match = len(top_matches) > 0 and top_matches[0]['confidence'] >= 70
    is_high_confidence = len(top_matches) > 0 and top_matches[0]['confidence'] >= 90

    # Find similar skills in same category for "no match" case
    suggested = []
    if top_matches and top_matches[0]['confidence'] >= 40:
        suggested = [s['name'] for s in top_matches[:3]]
    elif top_matches:
        # Get skills from same category as best partial match
        best_category = top_matches[0].get('category', 'General')
        suggested = [s['name'] for s in skills if s.get('category') == best_category][:3]

    return {
        'matches': [
            {
                'skill': m['name'],
                'confidence': m['confidence'],
                'category': m.get('category', 'General'),
                'trigger_phrases': m['trigger_phrases'],
                'description': m['description']
            }
            for m in top_matches
        ],
        'top_match': {
            'skill': top_matches[0]['name'] if top_matches else None,
            'confidence': top_matches[0]['confidence'] if top_matches else 0
        } if top_matches else None,
        'has_clear_match': has_clear_match,
        'is_high_confidence': is_high_confidence,
        'suggested_skills': suggested,
        'total_skills_checked': len(skills)
    }


def find_agents_md() -> Optional[str]:
    """Find AGENTS.md in common locations."""
    search_paths = [
        'AGENTS.md',
        '../AGENTS.md',
        '../../AGENTS.md',
        'docs/AGENTS.md',
        '.kilo/AGENTS.md'
    ]

    for path in search_paths:
        if Path(path).exists():
            return path

    return None


def main():
    parser = argparse.ArgumentParser(
        description='Match user prompts against skill trigger phrases'
    )
    parser.add_argument('prompt', help='User prompt to match')
    parser.add_argument(
        '--agents-md',
        help='Path to AGENTS.md (auto-detected if not provided)'
    )
    parser.add_argument(
        '--top-n',
        type=int,
        default=5,
        help='Number of top matches to return'
    )
    parser.add_argument(
        '--format',
        choices=['json', 'text'],
        default='json',
        help='Output format'
    )

    args = parser.parse_args()

    # Find AGENTS.md
    agents_path = args.agents_md or find_agents_md()
    if not agents_path:
        print(json.dumps({
            'error': 'Could not find AGENTS.md. Provide path with --agents-md'
        }), file=sys.stderr)
        sys.exit(1)

    # Parse skills
    skills = parse_agents_md(agents_path)
    if not skills:
        print(json.dumps({
            'error': f'No skills found in {agents_path}'
        }), file=sys.stderr)
        sys.exit(1)

    # Find matches
    result = find_matches(args.prompt, skills, args.top_n)

    # Output
    if args.format == 'json':
        print(json.dumps(result, indent=2))
    else:
        if result['matches']:
            print(f"Top {len(result['matches'])} matches for: '{args.prompt}'")
            print()
            for i, m in enumerate(result['matches'], 1):
                confidence_bar = '█' * (m['confidence'] // 10) + '░' * (10 - m['confidence'] // 10)
                print(f"{i}. {m['skill']} ({m['confidence']}%) {confidence_bar}")
                print(f"   {m['description']}")
                print(f"   Triggers: {', '.join(m['trigger_phrases'])}")
                print()

            if result['is_high_confidence']:
                print(f"💡 High confidence match: {result['top_match']['skill']}")
            elif result['has_clear_match']:
                print(f"✓ Clear match found")
            else:
                print("? No clear match — consider clarifying with user")
        else:
            print(f"No matches found for: '{args.prompt}'")
            print("Consider asking the user to clarify their request.")


if __name__ == '__main__':
    main()
