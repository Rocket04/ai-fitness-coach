# Fixing Malformed package.json in Static PWAs

## Problem
The project's package.json file contains two separate JSON objects, causing parsing errors when running `npx serve` or any npm command.

## Symptoms
- Error: `Unexpected non-whitespace character after JSON at position X`
- The file appears to have two top-level objects separated by whitespace or a newline.

## Solution
1. Backup the original file: `cp package.json package.json.backup`
2. Combine the two JSON objects into one valid JSON structure.
   - Typically, one object contains `devDependencies` and `scripts`, the other contains `dependencies`.
   - Merge them under a single root object.
3. Ensure the final JSON is valid by checking with a JSON validator or using Node.js:
   ```bash
   node -e "require('./package.json')"
   ```
   If no error, the JSON is valid.

## Example
**Before:**
```json
{
  "devDependencies": {
    "@types/node": "^25.8.0",
    "knip": "^6.14.1",
    "typescript": "^6.0.3"
  },
  "scripts": {
    "knip": "knip"
  }
}

{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "dexie": "^4.0.8"
  }
}
```

**After:**
```json
{
  "devDependencies": {
    "@types/node": "^25.8.0",
    "knip": "^6.14.1",
    "typescript": "^6.0.3"
  },
  "scripts": {
    "knip": "knip"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "dexie": "^4.0.8"
  }
}
```

## Prevention
- Use a JSON linter in your editor (e.g., ESLint with json plugin, Prettier).
- Validate package.json after manual edits.
- Consider using `npm install` or `yarn add` to manage dependencies, which keeps the file valid.