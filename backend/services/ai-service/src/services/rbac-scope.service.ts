import { IAuthPayload } from '@procurement/types';
import { User } from '@procurement/identity-service';

// Resolves what data a given caller is allowed to see, so AI features never
// assemble context (or return analysis) from rows the caller shouldn't access.
//
// Today only the `vendor` role is restricted to its own data; every other role
// (admin/procurement_manager/finance/auditor/employee) is treated as having
// org-wide read for AI purposes, consistent with how their existing list
// endpoints behave. Vendor identity comes from the Identity_User.vendorId field
// (added in Phase 0); if it is unset we FAIL CLOSED — the vendor sees nothing —
// rather than guessing by email.

export interface CallerScope {
  role: string;
  isVendor: boolean;
  /** For a vendor caller, the Procurement_Vendor._id they are allowed to see; undefined otherwise. */
  vendorId?: string;
  /** True when the caller is a vendor whose vendorId could NOT be resolved (deny everything). */
  unresolvedVendor: boolean;
}

export const resolveCallerScope = async (user: IAuthPayload): Promise<CallerScope> => {
  if (user.role !== 'vendor') {
    return { role: user.role, isVendor: false, unresolvedVendor: false };
  }

  let vendorId: string | undefined;
  try {
    const u: any = await User.get(user.userId);
    vendorId = u?.vendorId || undefined;
  } catch {
    vendorId = undefined;
  }

  return {
    role: user.role,
    isVendor: true,
    vendorId,
    unresolvedVendor: !vendorId,
  };
};

/** True if a vendor-owned record (by its vendorId) is visible to this caller. */
export const canAccessVendorData = (scope: CallerScope, recordVendorId?: string): boolean => {
  if (!scope.isVendor) return true; // non-vendor roles: org-wide read
  if (scope.unresolvedVendor || !scope.vendorId) return false; // fail closed
  return !!recordVendorId && recordVendorId === scope.vendorId;
};
