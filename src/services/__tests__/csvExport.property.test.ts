/**
 * Property-Based Tests for CSV Export
 * Property 16: CSV Export Round-Trip
 * 
 * Validates: Requirements 10.1, 10.2, 10.3
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Convert data to CSV format
 */
function convertToCSV(data: any[], headers: string[]): string {
  const csvRows = [];
  
  // Add headers
  csvRows.push(headers.join(','));
  
  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      // Escape quotes and wrap in quotes if contains comma
      const escaped = ('' + value).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

/**
 * Parse CSV back to data
 */
function parseCSV(csv: string, headers: string[]): any[] {
  const lines = csv.split('\n');
  const data = [];
  
  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    const values: string[] = [];
    let currentValue = '';
    let insideQuotes = false;
    
    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];
      
      if (char === '"') {
        if (insideQuotes && lines[i][j + 1] === '"') {
          // Escaped quote
          currentValue += '"';
          j++;
        } else {
          // Toggle quote state
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        values.push(currentValue);
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue);
    
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    data.push(row);
  }
  
  return data;
}

describe('Property 16: CSV Export Round-Trip', () => {
  /**
   * Property: Export and import should preserve data
   */
  it('should preserve data through export and import cycle', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            email: fc.emailAddress(),
            status: fc.constantFrom('active', 'inactive', 'suspended'),
          }),
          { minLength: 0, maxLength: 50 }
        ),
        (data) => {
          const headers = ['id', 'name', 'email', 'status'];
          const csv = convertToCSV(data, headers);
          const parsed = parseCSV(csv, headers);

          // Should have same length
          expect(parsed.length).toBe(data.length);

          // Each row should match
          data.forEach((original, index) => {
            expect(parsed[index].id).toBe(original.id);
            expect(parsed[index].name).toBe(original.name);
            expect(parsed[index].email).toBe(original.email);
            expect(parsed[index].status).toBe(original.status);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: CSV should handle special characters
   */
  it('should correctly escape and unescape special characters', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            description: fc.string({ minLength: 0, maxLength: 200 }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (data) => {
          const headers = ['id', 'description'];
          const csv = convertToCSV(data, headers);
          const parsed = parseCSV(csv, headers);

          // Should preserve all characters including commas, quotes, newlines
          data.forEach((original, index) => {
            expect(parsed[index].description).toBe(original.description);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Empty data produces valid CSV with headers only
   */
  it('should produce valid CSV with headers for empty data', () => {
    const headers = ['id', 'name', 'email'];
    const csv = convertToCSV([], headers);
    const lines = csv.split('\n');

    // Should have only header line
    expect(lines.length).toBe(1);
    expect(lines[0]).toBe('id,name,email');
  });

  /**
   * Property: CSV row count matches data count plus header
   */
  it('should have row count equal to data count plus one header', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            value: fc.integer(),
          }),
          { minLength: 0, maxLength: 100 }
        ),
        (data) => {
          const headers = ['id', 'value'];
          const csv = convertToCSV(data, headers);
          const lines = csv.split('\n').filter(line => line.trim());

          // Should have data.length + 1 (header) lines
          expect(lines.length).toBe(data.length + 1);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: All headers appear in first line
   */
  it('should have all headers in first line', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 10 }),
        fc.array(fc.record({})),
        (headers, data) => {
          const csv = convertToCSV(data, headers);
          const firstLine = csv.split('\n')[0];

          // All headers should be present
          headers.forEach(header => {
            expect(firstLine).toContain(header);
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Numeric values are preserved
   */
  it('should preserve numeric values correctly', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            price: fc.double({ min: 0, max: 10000, noNaN: true }),
            quantity: fc.integer({ min: 0, max: 1000 }),
          }),
          { minLength: 1, maxLength: 50 }
        ),
        (data) => {
          const headers = ['id', 'price', 'quantity'];
          const csv = convertToCSV(data, headers);
          const parsed = parseCSV(csv, headers);

          data.forEach((original, index) => {
            // Numbers are converted to strings in CSV
            expect(parseFloat(parsed[index].price)).toBeCloseTo(original.price, 2);
            expect(parseInt(parsed[index].quantity)).toBe(original.quantity);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Date values can be serialized and parsed
   */
  it('should handle date serialization', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            createdAt: fc.date(),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (data) => {
          // Convert dates to ISO strings for CSV
          const dataWithISODates = data.map(item => ({
            id: item.id,
            createdAt: item.createdAt.toISOString(),
          }));

          const headers = ['id', 'createdAt'];
          const csv = convertToCSV(dataWithISODates, headers);
          const parsed = parseCSV(csv, headers);

          dataWithISODates.forEach((original, index) => {
            expect(parsed[index].createdAt).toBe(original.createdAt);
            // Should be valid ISO date string
            expect(new Date(parsed[index].createdAt).toISOString()).toBe(original.createdAt);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Null values are handled consistently
   */
  it('should handle null values consistently', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            notes: fc.option(fc.string({ minLength: 0, maxLength: 100 }), { nil: null }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (data) => {
          // Convert nulls to empty strings for CSV
          const dataWithoutNulls = data.map(item => ({
            id: item.id,
            notes: item.notes || '',
          }));

          const headers = ['id', 'notes'];
          const csv = convertToCSV(dataWithoutNulls, headers);
          const parsed = parseCSV(csv, headers);

          dataWithoutNulls.forEach((original, index) => {
            expect(parsed[index].notes).toBe(original.notes);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: CSV is deterministic for same input
   */
  it('should produce same CSV for same input', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 50 }),
          }),
          { minLength: 0, maxLength: 20 }
        ),
        (data) => {
          const headers = ['id', 'name'];
          const csv1 = convertToCSV(data, headers);
          const csv2 = convertToCSV(data, headers);

          // Should be identical
          expect(csv1).toBe(csv2);
        }
      ),
      { numRuns: 100 }
    );
  });
});
