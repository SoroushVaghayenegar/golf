"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchForecast = fetchForecast;
exports.batchUpsertForecasts = batchUpsertForecasts;
const Forecast_1 = require("./Forecast");
const DAYS_IN_FUTURE = 14;
async function fetchForecast(city, startDate) {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + DAYS_IN_FUTURE);
    const startDateString = startDate.toISOString().split('T')[0];
    const endDateString = endDate.toISOString().split('T')[0];
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}&hourly=temperature_2m,wind_speed_10m,wind_gusts_10m,weather_code,precipitation_probability,cloud_cover,uv_index,precipitation&timezone=America%2FLos_Angeles&start_date=${startDateString}&end_date=${endDateString}`;
    const response = await fetchWithRetry(city.name, url, {}, 5, 20000, 2000);
    const data = await response.json();
    const forecasts = [];
    for (let i = 0; i < DAYS_IN_FUTURE; i++) {
        // For each object in data.hourly, grab from the array 24 items from i*24
        const temperature_2m = {
            unit: data.hourly_units.temperature_2m,
            data: data.hourly.temperature_2m.slice(i * 24, (i + 1) * 24)
        };
        const wind_speed_10m = {
            unit: data.hourly_units.wind_speed_10m,
            data: data.hourly.wind_speed_10m.slice(i * 24, (i + 1) * 24)
        };
        const wind_gusts_10m = {
            unit: data.hourly_units.wind_gusts_10m,
            data: data.hourly.wind_gusts_10m.slice(i * 24, (i + 1) * 24)
        };
        const weather_code = {
            unit: data.hourly_units.weather_code,
            data: data.hourly.weather_code.slice(i * 24, (i + 1) * 24)
        };
        const precipitation_probability = {
            unit: data.hourly_units.precipitation_probability,
            data: data.hourly.precipitation_probability.slice(i * 24, (i + 1) * 24)
        };
        const cloud_cover = {
            unit: data.hourly_units.cloud_cover,
            data: data.hourly.cloud_cover.slice(i * 24, (i + 1) * 24)
        };
        const uv_index = {
            unit: data.hourly_units.uv_index,
            data: data.hourly.uv_index.slice(i * 24, (i + 1) * 24)
        };
        const precipitation = {
            unit: data.hourly_units.precipitation,
            data: data.hourly.precipitation.slice(i * 24, (i + 1) * 24)
        };
        // from data.hourly.time get first object of that slice, and the date is in format "2025-07-10T00:00", so just get string before T
        const date = data.hourly.time[i * 24].split('T')[0];
        const forecast = new Forecast_1.Forecast(city.id, date, temperature_2m, wind_speed_10m, wind_gusts_10m, weather_code, precipitation_probability, cloud_cover, uv_index, precipitation);
        forecasts.push(forecast);
    }
    return forecasts;
}
async function fetchWithRetry(cityName, url, headers, maxRetries = 5, maxDelay = 19000, minDelay = 2000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(url, { headers: headers });
            if (!response.ok) {
                let errorBody = '';
                try {
                    // Try to read the response body for error details
                    errorBody = await response.text();
                    // Limit error body length to avoid huge logs
                    if (errorBody.length > 500) {
                        errorBody = errorBody.substring(0, 500) + '...';
                    }
                }
                catch (bodyError) {
                    errorBody = 'Unable to read response body';
                }
                const errorMessage = `Error fetching ${cityName}: ${response.status} ${response.statusText} ${errorBody ? ` - ${errorBody}` : ''}`;
                if (attempt === maxRetries) {
                    console.error(`Error status: ${response.status} [${cityName}]`);
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
    throw new Error(`[${cityName}] Failed to fetch after ${maxRetries} attempts`);
}
/**
 * Batch upsert tee times data to Supabase with conflict resolution
 * @param supabase - Supabase client instance
 * @param results - Array of results from fetchCourseTeeTimes
 * @param batchSize - Number of records to process in each batch (default: 100)
 * @returns Promise with summary of the operation
 */
async function batchUpsertForecasts(supabase, results, batchSize = 100) {
    // Transform results into upsert format
    const upsertData = results.map(result => ({
        city_id: result.city_id,
        date: result.date,
        temperature_2m: result.temperature_2m,
        wind_speed_10m: result.wind_speed_10m,
        wind_gusts_10m: result.wind_gusts_10m,
        weather_code: result.weather_code,
        precipitation_probability: result.precipitation_probability,
        cloud_cover: result.cloud_cover,
        uv_index: result.uv_index,
        precipitation: result.precipitation,
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
                .from('forecasts')
                .upsert(batch, {
                onConflict: ['city_id', 'date'],
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
