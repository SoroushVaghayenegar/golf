# Event tracking report

This document lists all PostHog events that have been automatically added to your Next.js application.

## Events by File

### src/app/page.tsx

- **region_changed**: Fired when a user selects a new region from the sidebar filter.
- **tee_times_searched**: Fired when a user clicks the 'Get Tee Times' button to search for available tee times.

### src/app/auth/sign-up/page.tsx

- **navigated-home-from-signup**: Fired when a user clicks the logo link to navigate to the homepage from the sign-up page.

### src/components/Navbar.tsx

- **navbar-logo-clicked**: Fired when a user clicks the main logo in the navigation bar to return to the homepage.
- **navbar-signup-clicked**: Fired when an unauthenticated user clicks the 'Sign up' link in the navigation bar.
- **navbar-login-clicked**: Fired when an unauthenticated user clicks the 'Login' link in the navigation bar.

### src/components/SubscriptionSignup.tsx

- **subscription-created**: Fired when a user successfully submits the subscription form.
- **subscription-form-dismissed**: Fired when a user clicks the 'No thanks' button to close the subscription dialog.

### src/components/TeeTimeCard.tsx

- **course_removed_from_filters**: Fired when a user clicks the 'X' button to remove a course from their search filters.
- **booking_link_clicked**: Fired when a user clicks the booking link to navigate to an external booking website.

### src/components/CompactCalendar.tsx

- **calendar_date_selected**: Fired when a user selects one or more dates in the calendar.
- **calendar_date_removed**: Fired when a user removes a previously selected date from the calendar.

### src/components/FeatureRequest.tsx

- **feature_request_submitted**: Fired when a user successfully submits the feature or city/course request form.
- **bug_report_submitted**: Fired when a user successfully submits the bug report form.

### src/components/logout-button.tsx

- **user-logged-out**: Fired when a user clicks the logout button to sign out of their account.


## Events still awaiting implementation
- (human: you can fill these in)
---

## Next Steps

1. Review the changes made to your files
2. Test that events are being captured correctly
3. Create insights and dashboards in PostHog
4. Make a list of events we missed above. Knock them out yourself, or give this file to an agent.

Learn more about what to measure with PostHog and why: https://posthog.com/docs/new-to-posthog/getting-hogpilled
