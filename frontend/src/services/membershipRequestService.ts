/**
 * Membership Request Service
 * Handles API calls for membership request functionality
 */

export interface MembershipRequestStatus {
    hasRequested: boolean;
}

/**
 * Check if the current user has already requested membership
 */
export async function checkMembershipRequest(): Promise<MembershipRequestStatus> {
    const response = await fetch('/api/membership-request', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
}

/**
 * Create a membership request for the current user
 */
export async function createMembershipRequest(): Promise<{ success: boolean }> {
    const response = await fetch('/api/membership-request', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
}

