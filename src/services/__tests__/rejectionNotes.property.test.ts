/**
 * Property-Based Tests for Rejection Notes Lifecycle
 * Property 12: Rejection Notes Lifecycle
 * 
 * Validates: Requirements 6.1, 6.3
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Mock types
interface MedicineWithApproval {
  id: string;
  name: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionNotes: string | null;
  reviewedBy: string | null;
  reviewedAt: Date | null;
}

/**
 * Simulate rejecting a medicine
 */
function rejectMedicine(
  medicine: MedicineWithApproval,
  reviewerId: string,
  notes: string
): MedicineWithApproval {
  if (medicine.status !== 'pending' && medicine.status !== 'rejected') {
    throw new Error('Cannot reject approved medicine');
  }

  if (!notes || notes.trim().length < 5) {
    throw new Error('Rejection notes must be at least 5 characters');
  }

  return {
    ...medicine,
    status: 'rejected',
    rejectionNotes: notes,
    reviewedBy: reviewerId,
    reviewedAt: new Date(),
  };
}

/**
 * Simulate approving a medicine
 */
function approveMedicine(
  medicine: MedicineWithApproval,
  reviewerId: string
): MedicineWithApproval {
  if (medicine.status === 'approved') {
    throw new Error('Medicine already approved');
  }

  return {
    ...medicine,
    status: 'approved',
    rejectionNotes: null, // Clear rejection notes on approval
    reviewedBy: reviewerId,
    reviewedAt: new Date(),
  };
}

/**
 * Simulate updating a rejected medicine
 */
function updateRejectedMedicine(
  medicine: MedicineWithApproval,
  updates: Partial<MedicineWithApproval>
): MedicineWithApproval {
  if (medicine.status !== 'rejected' && medicine.status !== 'pending') {
    throw new Error('Can only update pending or rejected medicines');
  }

  // When updating, reset to pending and clear review info
  return {
    ...medicine,
    ...updates,
    status: 'pending',
    rejectionNotes: null,
    reviewedBy: null,
    reviewedAt: null,
  };
}

describe('Property 12: Rejection Notes Lifecycle', () => {
  /**
   * Property: Rejected medicines must have rejection notes
   */
  it('should always have rejection notes when status is rejected', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 1, maxLength: 100 }),
          status: fc.constant('pending' as const),
          rejectionNotes: fc.constant(null),
          reviewedBy: fc.constant(null),
          reviewedAt: fc.constant(null),
        }),
        fc.uuid(),
        fc.string({ minLength: 5, maxLength: 500 }),
        (medicine, reviewerId, notes) => {
          const rejected = rejectMedicine(medicine, reviewerId, notes);

          // Must have rejection notes
          expect(rejected.rejectionNotes).not.toBeNull();
          expect(rejected.rejectionNotes).toBe(notes);
          expect(rejected.status).toBe('rejected');
          expect(rejected.reviewedBy).toBe(reviewerId);
          expect(rejected.reviewedAt).not.toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Rejection notes must be at least 5 characters
   */
  it('should reject medicines with notes shorter than 5 characters', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 1, maxLength: 100 }),
          status: fc.constant('pending' as const),
          rejectionNotes: fc.constant(null),
          reviewedBy: fc.constant(null),
          reviewedAt: fc.constant(null),
        }),
        fc.uuid(),
        fc.string({ minLength: 0, maxLength: 4 }),
        (medicine, reviewerId, shortNotes) => {
          // Should throw error for short notes
          expect(() => rejectMedicine(medicine, reviewerId, shortNotes)).toThrow();
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Approved medicines should not have rejection notes
   */
  it('should clear rejection notes when approving a medicine', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 1, maxLength: 100 }),
          status: fc.constantFrom('pending', 'rejected'),
          rejectionNotes: fc.option(fc.string({ minLength: 5, maxLength: 500 }), { nil: null }),
          reviewedBy: fc.option(fc.uuid(), { nil: null }),
          reviewedAt: fc.option(fc.date(), { nil: null }),
        }),
        fc.uuid(),
        (medicine, reviewerId) => {
          const approved = approveMedicine(medicine, reviewerId);

          // Should not have rejection notes
          expect(approved.rejectionNotes).toBeNull();
          expect(approved.status).toBe('approved');
          expect(approved.reviewedBy).toBe(reviewerId);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Updating rejected medicine clears rejection notes and resets to pending
   */
  it('should clear rejection notes and reset to pending when updating', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 1, maxLength: 100 }),
          status: fc.constant('rejected' as const),
          rejectionNotes: fc.string({ minLength: 5, maxLength: 500 }),
          reviewedBy: fc.uuid(),
          reviewedAt: fc.date(),
        }),
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 100 }),
        }),
        (medicine, updates) => {
          const updated = updateRejectedMedicine(medicine, updates);

          // Should clear rejection info and reset to pending
          expect(updated.rejectionNotes).toBeNull();
          expect(updated.reviewedBy).toBeNull();
          expect(updated.reviewedAt).toBeNull();
          expect(updated.status).toBe('pending');
          expect(updated.name).toBe(updates.name);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Cannot reject already approved medicine
   */
  it('should not allow rejecting approved medicines', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 1, maxLength: 100 }),
          status: fc.constant('approved' as const),
          rejectionNotes: fc.constant(null),
          reviewedBy: fc.uuid(),
          reviewedAt: fc.date(),
        }),
        fc.uuid(),
        fc.string({ minLength: 5, maxLength: 500 }),
        (medicine, reviewerId, notes) => {
          // Should throw error
          expect(() => rejectMedicine(medicine, reviewerId, notes)).toThrow();
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Can re-reject a rejected medicine with new notes
   */
  it('should allow re-rejecting with updated notes', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 1, maxLength: 100 }),
          status: fc.constant('rejected' as const),
          rejectionNotes: fc.string({ minLength: 5, maxLength: 500 }),
          reviewedBy: fc.uuid(),
          reviewedAt: fc.date(),
        }),
        fc.uuid(),
        fc.string({ minLength: 5, maxLength: 500 }),
        (medicine, newReviewerId, newNotes) => {
          const reRejected = rejectMedicine(medicine, newReviewerId, newNotes);

          // Should update with new notes
          expect(reRejected.rejectionNotes).toBe(newNotes);
          expect(reRejected.reviewedBy).toBe(newReviewerId);
          expect(reRejected.status).toBe('rejected');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Rejection notes are preserved until explicitly cleared
   */
  it('should preserve rejection notes until approval or update', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.uuid(),
        fc.string({ minLength: 5, maxLength: 500 }),
        (id, name, reviewerId, notes) => {
          const pending: MedicineWithApproval = {
            id,
            name,
            status: 'pending',
            rejectionNotes: null,
            reviewedBy: null,
            reviewedAt: null,
          };

          const rejected = rejectMedicine(pending, reviewerId, notes);

          // Notes should be preserved
          expect(rejected.rejectionNotes).toBe(notes);

          // Create a copy - notes should still be there
          const copy = { ...rejected };
          expect(copy.rejectionNotes).toBe(notes);

          // Only approval or update should clear them
          const approved = approveMedicine(copy, reviewerId);
          expect(approved.rejectionNotes).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});
