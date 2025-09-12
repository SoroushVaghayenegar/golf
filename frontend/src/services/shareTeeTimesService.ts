import { type TeeTime } from "./teeTimeService";

export interface CreateShareResponse {
    token: string;
}

export interface ShareTeeTime {
    id: number;
    created_at: string;
    share_id: number;
    approvals: string[];
    disapprovals: string[];
    tee_time_object: TeeTime;
    available: boolean;
}

export interface GetShareResponse {
    share_id: number;
    token: string;
    tee_times: ShareTeeTime[];
}

export const createTeeTimesShare = async (teeTimes: TeeTime[]): Promise<CreateShareResponse> => {
    try {
        // Validate input
        if (!Array.isArray(teeTimes)) {
            throw new Error('Input must be an array of TeeTime objects');
        }
        
        if (teeTimes.length === 0) {
            throw new Error('At least 1 TeeTime object is required');
        }
        
        if (teeTimes.length > 5) {
            throw new Error('Maximum 5 TeeTime objects allowed');
        }

        const response = await fetch('/api/create-share-plan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(teeTimes),
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        const data: CreateShareResponse = await response.json();
        return data;
    } catch (error) {
        console.error('Error creating tee times share:', error);
        throw error;
    }
};

export const getSharedTeeTimes = async (token: string): Promise<GetShareResponse> => {
    try {
        // Validate input
        if (!token || typeof token !== 'string') {
            throw new Error('Valid token is required');
        }
        
        const response = await fetch(`/api/get-share-plan?token=${encodeURIComponent(token)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        const data: GetShareResponse = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching shared tee times:', error);
        throw error;
    }
};

export interface VoteShareTeeTimeRequest {
    share_tee_time_id: number;
    client_id: string;
    approval: boolean;
}

export interface VoteShareTeeTimeResponse {
    success: boolean;
    message: string;
    updated_approvals: string[];
    updated_disapprovals: string[];
}

export const voteOnSharedTeeTime = async (
    shareTeeTimeId: number, 
    clientId: string, 
    approval: boolean
): Promise<VoteShareTeeTimeResponse> => {
    try {
        // Validate input
        if (!shareTeeTimeId || typeof shareTeeTimeId !== 'number') {
            throw new Error('Valid share tee time ID is required');
        }
        
        if (!clientId || typeof clientId !== 'string') {
            throw new Error('Valid client ID is required');
        }
        
        if (typeof approval !== 'boolean') {
            throw new Error('Approval must be a boolean value');
        }

        const requestBody: VoteShareTeeTimeRequest = {
            share_tee_time_id: shareTeeTimeId,
            client_id: clientId,
            approval: approval
        };
        
        const response = await fetch('/api/vote-share-tee-time', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        const data: VoteShareTeeTimeResponse = await response.json();
        return data;
    } catch (error) {
        console.error('Error voting on shared tee time:', error);
        throw error;
    }
};
