/**
 * Generate CSV template with headers
 */
export function generateCSVTemplate(): string {
  return 'item_name,category\n';
}

/**
 * Parse CSV text into array of items
 * Expected format: item_name,category
 * First row is header (skipped)
 */
export function parseCSV(
  csvText: string
): Array<{ name: string; category: string }> {
  const lines = csvText.trim().split('\n');

  if (lines.length < 2) {
    throw new Error(
      'CSV file must contain at least a header row and one data row'
    );
  }

  // Validate header
  const header = lines[0].toLowerCase().trim();
  if (!header.includes('item_name') || !header.includes('category')) {
    throw new Error('CSV must have "item_name" and "category" columns');
  }

  const items: Array<{ name: string; category: string }> = [];
  const errors: string[] = [];

  // Parse data rows (skip header)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines

    const parts = parseCSVLine(line);

    if (parts.length < 2) {
      errors.push(`Row ${i + 1}: Missing required columns`);
      continue;
    }

    const name = parts[0].trim();
    const category = parts[1].trim();

    if (!name) {
      errors.push(`Row ${i + 1}: item_name cannot be empty`);
      continue;
    }

    items.push({
      name,
      category: category || 'Uncategorized',
    });
  }

  if (errors.length > 0) {
    throw new Error(`CSV parsing errors:\n${errors.join('\n')}`);
  }

  if (items.length === 0) {
    throw new Error('No valid items found in CSV file');
  }

  return items;
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      // Handle escaped quotes ("")
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

/**
 * Download a file with given content
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string = 'text/csv'
) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
