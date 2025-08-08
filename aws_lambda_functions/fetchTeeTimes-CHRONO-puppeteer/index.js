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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const Course_1 = require("./Course");
const utils_1 = require("./utils");
const supabase_js_1 = require("@supabase/supabase-js");
const Sentry = __importStar(require("@sentry/aws-serverless"));
const chromium_1 = __importDefault(require("@sparticuz/chromium"));
const puppeteer_core_1 = __importDefault(require("puppeteer-core"));
Sentry.init({
    dsn: "https://baa965932d0a9dbd6f12c98dd937d526@o4509770601332736.ingest.us.sentry.io/4509778658000896",
    // Send structured logs to Sentry
    enableLogs: true,
    // Setting this option to true will send default PII data to Sentry.
    // For example, automatic IP address collection on events
    sendDefaultPii: true,
});
const handler = async (event) => {
    // Start timer
    const startTime = performance.now();
    // Create Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey);
    // Create browser and page once
    const browser = await puppeteer_core_1.default.launch({
        args: [
            ...chromium_1.default.args,
            '--disable-blink-features=AutomationControlled',
            '--hide-scrollbars',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
        ],
        defaultViewport: null,
        executablePath: await chromium_1.default.executablePath(),
        headless: true,
    });
    const page = await browser.newPage();
    // Set realistic browser headers
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15');
    await page.goto('https://www.chronogolf.ca', {
        waitUntil: 'domcontentloaded',
    });
    // Fetch courses from the database with city name
    const { data: coursesData, error } = await supabase
        .from('courses')
        .select(`
    *,
    cities!inner(name)
  `)
        .eq('external_api', 'CHRONO_LIGHTSPEED');
    // .limit(30)
    if (error) {
        throw new Error(`Error fetching courses: ${error.message}`);
    }
    // Convert to Course objects
    const courses = coursesData.map(courseData => Course_1.Course.fromObject(courseData));
    console.log(`Fetched ${courses.length} courses`);
    // Get current date in Vancouver timezone 
    const getDate = (timezone) => {
        const date = new Date(new Date().toLocaleString('en', { timeZone: timezone }).split(",")[0]);
        return date;
    };
    const get24HourFormat = (timezone) => {
        const time = new Date(new Date().toLocaleString('en', { timeZone: timezone }));
        const hours = time.getHours().toString().padStart(2, '0');
        const minutes = time.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    };
    // Process all courses and dates in parallel
    const promises = courses.flatMap(course => {
        const startDate = getDate(course.timezone);
        return Array.from({ length: course.booking_visibility_days + 1 }, (_, i) => {
            if (i === course.booking_visibility_days && course.booking_visibility_start_time) {
                const bookingVisibilityStartTime = (0, utils_1.timeStringToMinutes)(course.booking_visibility_start_time);
                const currentTime = (0, utils_1.timeStringToMinutes)(get24HourFormat(course.timezone));
                if (currentTime < bookingVisibilityStartTime) {
                    // Return null to be filtered out later, instead of invalid structure
                    return null;
                }
            }
            const searchDate = new Date(startDate);
            searchDate.setDate(searchDate.getDate() + i);
            return (0, utils_1.fetchCourseTeeTimes)(page, course, searchDate);
        });
    }).filter(promise => promise !== null);
    console.log(`Fetching tee times for ${promises.length} dates`);
    // Add progress tracking with zero performance impact
    let completed = 0;
    const total = promises.length;
    const trackedPromises = promises.map((promise, index) => promise.then(result => {
        // console.log(`Progress: ${++completed}/${total} (${Math.round((completed/total)*100)}%)`)
        return result;
    }));
    const results = await Promise.all(trackedPromises);
    const teeTimes = results.flat();
    await page.close();
    await browser.close();
    // Batch upsert all results to database
    console.log(`Saving ${results.length} course/date combinations to database`);
    const upsertResult = await (0, utils_1.batchUpsertTeeTimes)(supabase, results);
    // Check if there were any errors during batch upsert
    const hasErrors = upsertResult.errors.length > 0;
    if (hasErrors) {
        console.error(`Batch upsert completed with ${upsertResult.errors.length} batch errors`);
        upsertResult.errors.forEach(error => {
            console.error(`Batch ${error.batch}: ${error.error}`);
        });
    }
    // End timer and calculate execution time
    const endTime = performance.now();
    const executionTime = (endTime - startTime) / 1000;
    // Log final summary
    console.log(`=== EXECUTION SUMMARY ===`);
    console.log(`Execution time: ${executionTime.toFixed(2)}s`);
    console.log(`Total courses processed: ${courses.length}`);
    console.log(`Total course/date combinations: ${results.length}`);
    console.log(`Total tee times found: ${teeTimes.length}`);
    console.log(`Database batches processed: ${upsertResult.totalBatches}`);
    console.log(`Database errors: ${upsertResult.errors.length}`);
    console.log(`Status: ${hasErrors ? 'COMPLETED WITH ERRORS' : 'SUCCESS'}`);
    console.log(`========================`);
    const response = {
        statusCode: hasErrors ? 500 : 200,
        body: JSON.stringify({
            success: !hasErrors,
            message: hasErrors
                ? `Completed with ${upsertResult.errors.length} batch errors`
                : "Success"
        }),
    };
    return response;
};
exports.handler = handler;
