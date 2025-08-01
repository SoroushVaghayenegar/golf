"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchCourseTeeTimes = fetchCourseTeeTimes;
exports.fetchTeeTimesFromChronoLightspeed = fetchTeeTimesFromChronoLightspeed;
exports.batchUpsertTeeTimes = batchUpsertTeeTimes;
const TeeTime_1 = require("./TeeTime");
const Sentry = __importStar(require("@sentry/aws-serverless"));
const CHRONO_LIGHTSPEED = "CHRONO_LIGHTSPEED";
async function fetchCourseTeeTimes(course, searchDate) {
    if (course.external_api !== CHRONO_LIGHTSPEED) {
        throw new Error(`Unsupported external API: ${course.external_api}`);
    }
    // For CHRONO/LIGHTSPEED, fetch tee times for each course_holes value
    const courseHolesArray = course.external_api_attributes.course_holes;
    const clubId = course.external_api_attributes.club_id;
    const courseId = course.external_api_attributes.course_id;
    const affiliationTypeId = course.external_api_attributes.affiliation_type_id;
    const clubLinkName = course.external_api_attributes.club_link_name;
    // Parallelize fetching for each course holes value
    const teeTimesPromises = courseHolesArray.map(holes => fetchTeeTimesFromChronoLightspeed(course.name, clubId, courseId, affiliationTypeId, holes, searchDate, clubLinkName));
    const teeTimesResults = await Promise.all(teeTimesPromises);
    const allTeeTimes = teeTimesResults.flat();
    return {
        courseId: course.id,
        date: searchDate.toISOString().split('T')[0],
        teeTimes: allTeeTimes
    };
}
async function fetchTeeTimesFromChronoLightspeed(courseName, club_id, course_id, affiliation_type_id, course_holes, searchDate, clubLinkName) {
    // format to '%Y-%m-%d'
    const dateString = searchDate.toISOString().split('T')[0];
    const baseUrl = `https://www.chronogolf.com/marketplace/clubs/${club_id}/teetimes?date=${dateString}&course_id=${course_id}&nb_holes=${course_holes}`;
    const teeTimesMap = new Map();
    // Parallelize fetching for different player counts
    const playerCounts = [4, 3, 2, 1];
    const fetchPromises = playerCounts.map(async (players) => {
        let fullUrl = baseUrl;
        for (let i = 0; i < players; i++) {
            fullUrl += `&affiliation_type_ids%5B%5D=${affiliation_type_id}`;
        }
        try {
            const response = await fetchWithRetry(courseName, club_id, fullUrl, {}, 5, 6000, 1000);
            const teeTimes = await response.json();
            return { players, teeTimes };
        }
        catch (error) {
            Sentry.captureException(error);
            console.error(error);
            return { players, teeTimes: [] };
        }
        // This should never be reached, but TypeScript needs it
        return { players, teeTimes: [] };
    });
    const results = await Promise.all(fetchPromises);
    // Process all results
    for (const { teeTimes } of results) {
        for (const teeTime of teeTimes) {
            if (teeTime["out_of_capacity"] == true || teeTime["restrictions"].length > 0) {
                continue;
            }
            const startTime = teeTime["start_time"];
            if (!teeTimesMap.has(startTime)) {
                teeTimesMap.set(startTime, teeTime);
            }
        }
    }
    const teeTimes = [];
    for (const teeTime of teeTimesMap.values()) {
        const startDateTime = new Date(teeTime["date"] + "T" + teeTime["start_time"]);
        const playersAvailable = teeTime["green_fees"].length;
        const price = teeTime["green_fees"][0]["green_fee"];
        const bookingLink = getChronoLightspeedBookingLink(clubLinkName, course_id, course_holes, searchDate, affiliation_type_id, playersAvailable, teeTime["id"]);
        teeTimes.push(new TeeTime_1.TeeTime(startDateTime, playersAvailable, course_holes, price, bookingLink));
    }
    return teeTimes;
}
function getChronoLightspeedBookingLink(clubLinkName, courseId, nbHoles, date, affiliationTypeId, numberOfPlayers, teetimeId) {
    const dateStr = date.toISOString().split('T')[0];
    const affiliationTypeIds = Array(numberOfPlayers).fill(affiliationTypeId).join(',');
    return `https://www.chronogolf.ca/club/${clubLinkName}/booking/?source=club&medium=widget#/teetime/review?course_id=${courseId}&nb_holes=${nbHoles}&date=${dateStr}&affiliation_type_ids=${affiliationTypeIds}&teetime_id=${teetimeId}&is_deal=false&new_user=false`;
}
async function fetchWithRetry(courseName, clubId, url, headers, maxRetries = 5, maxDelay = 19000, minDelay = 2000) {
    // Add to headers to pretend this is from a safari browser
    headers["User-Agent"] = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15";
    headers["Accept"] = "application/json";
    headers["Content-Type"] = "application/json";
    headers["Accept-Language"] = "en-CA,en-US;q=0.9,en;q=0.8";
    headers["Accept-Encoding"] = "gzip, deflate, br";
    headers["Connection"] = "keep-alive";
    headers["Sec-Fetch-Dest"] = "empty";
    headers["Sec-Fetch-Mode"] = "cors";
    headers["referer"] = `https://www.chronogolf.ca/en/club/${clubId}/widget?medium=widget&source=club`;
    headers["cookie"] = `__cf_bm=3OuOH.CupPbfALo7qfMwZmgIwKkC1U5fAlmQlBSUvUg-1754073952-1.0.1.1-h8fDWjQ2banh2hyiFyIAGRTgf.SxBQgQ_yOiA0HGjOE5wSZGbdiNKNTeBtNrI1U3rKaat_2p3zUG9PcD8KEUN_8f80BViGsgRsXRCp8CxNc; cf_clearance=OBACPqL0StpzKJQiqzvo4nigiEHIloCwcEJXS0RLsZA-1754073957-1.2.1.1-1THq6g5DG2O6qHkE1v6yB_Kl8.AlGyituOX3_7F6SK0rP2AdW0_4.1j9ttzUdVi5nvGq0GGYHGLTBdyeuifeTOt6pu3mmWOljg1cXcr36bI5ASYJSD.o0CRdFrzcz6LCNmkYX5d0KuVKOk0xotzSX1I.WXePdTGrkcz6plJ.6TwOd_UFWjyu_kq0akbi.7d0R5ocZ5NnyeoNfpBDzOm8jDmLvUaI674GiPyxTf1vZbc; _chronogolf_session=X4xS%2BBTwZWgnjHkhClbwztpT5KNT9857YIR8vjH2bzL9PG3WMy1bFmrS1VY0V2cdF04UL8LhOsOmTvViLaNe19gNIoc5RbLmUv7hMdN%2BLAhLUDGtN9v7uJ3btL6oJLCH3EUsZ5%2Bx5hk5PIL1N%2FWBDpfA7y2loMmDHp4U78m7C%2FsLRiBsHw7pjiJvKfqAH1LHzXJwtq44hea3qtkviTx%2FIcyWo1ozJ8DS808Je2pzvxGwxWH8LlwNbd298Q118bZU%2FR9%2B1BldLdPep1BvknzAnpuvPtJLrCzQxpnkTdTB34aT96mXHThB5o7qrBOkewB5NS1KXbHFv%2BgWACMt0xqcL0akK0ICdFCGFRNxLXjiLIBHup7WFackqBLR8xN16T6h6CV6GtkH%2BaHtTAM%3D--FEDLYYU3hKYnauuF--z5jiqLQCUzt1cxktPfhSpA%3D%3D`;
    headers["x-csrf-token"] = "fMW9yPZCtZgtCAk5u3OecSnwokDYOnEbyLDdnw2nkkhNno_HNYJSK0PKdbK0MZz3A3t8vS54EfIHwQ0EfqI_g";
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(url, { headers: headers });
            if (!response.ok) {
                let errorBody = '';
                try {
                    // Try to read the response body for error details
                    errorBody = await response.text();
                    // Limit error body length to avoid huge logs
                    // if (errorBody.length > 500) {
                    //     errorBody = errorBody.substring(0, 500) + '...';
                    // }
                }
                catch (bodyError) {
                    errorBody = 'Unable to read response body';
                }
                const errorMessage = `Error fetching ${courseName}: ${response.status} ${response.statusText} ${errorBody ? ` - ${errorBody}` : ''}`;
                if (attempt === maxRetries) {
                    Sentry.captureMessage(errorMessage);
                    console.error(`Error status: ${response.status} [${courseName}] ${response.statusText} ${errorBody ? ` - ${errorBody}` : ''}`);
                }
                throw new Error(errorMessage);
            }
            return response;
        }
        catch (error) {
            if (attempt < maxRetries) {
                const delay = Math.floor(Math.random() * maxDelay) + minDelay; // Random delay between 1000-15000ms
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    throw new Error(`[${courseName}] Failed to fetch after ${maxRetries} attempts`);
}
/**
 * Batch upsert tee times data to Supabase with conflict resolution
 * @param supabase - Supabase client instance
 * @param results - Array of results from fetchCourseTeeTimes
 * @param batchSize - Number of records to process in each batch (default: 100)
 * @returns Promise with summary of the operation
 */
async function batchUpsertTeeTimes(supabase, results, batchSize = 100) {
    // Transform results into upsert format
    const upsertData = results.map(result => ({
        course_id: result.courseId,
        date: result.date,
        tee_times_data: result.teeTimes,
        tee_times_count: result.teeTimes.length,
        updated_at: new Date().toISOString()
    }));
    const totalRecords = upsertData.length;
    const totalBatches = Math.ceil(totalRecords / batchSize);
    const errors = [];
    console.log(`Starting batch upsert: ${totalRecords} records in ${totalBatches} batches of ${batchSize}`);
    // Process in batches
    for (let i = 0; i < totalBatches; i++) {
        const startIndex = i * batchSize;
        const endIndex = Math.min(startIndex + batchSize, totalRecords);
        const batch = upsertData.slice(startIndex, endIndex);
        try {
            console.log(`Processing batch ${i + 1}/${totalBatches} (${batch.length} records)`);
            const { error: upsertError } = await supabase
                .from('tee_times')
                .upsert(batch, {
                onConflict: ['course_id', 'date'],
                ignoreDuplicates: false // This ensures updates happen on conflict
            });
            if (upsertError) {
                const errorMsg = `Batch ${i + 1} failed: ${upsertError.message}`;
                console.error(errorMsg);
                errors.push({ batch: i + 1, error: upsertError.message });
            }
            else {
                console.log(`Batch ${i + 1}/${totalBatches} completed successfully`);
            }
        }
        catch (error) {
            const errorMsg = `Batch ${i + 1} failed with exception: ${error instanceof Error ? error.message : String(error)}`;
            console.error(errorMsg);
            errors.push({ batch: i + 1, error: errorMsg });
        }
    }
    const result = {
        totalProcessed: totalRecords,
        totalBatches: totalBatches,
        errors: errors
    };
    console.log(`Batch upsert completed: ${totalRecords} records processed, ${errors.length} batches with errors`);
    return result;
}
