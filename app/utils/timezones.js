import moment from 'moment-timezone';

// Get all available timezones
const timezones = moment.tz.names();

// Group timezones by region
const groupedTimezones = timezones.reduce((groups, timezone) => {
    // Extract the region from the timezone (the part before the slash)
    const region = timezone.split('/')[0];

    // Add the timezone to the appropriate region group
    if (!groups[region]) {
        groups[region] = [];
    }
    groups[region].push(timezone);

    return groups;
}, {});

// Format grouped timezones into the desired structure
export const timezoneList = Object.keys(groupedTimezones).map((region) => ({
    label: region,
    options: groupedTimezones[region].map((timezone) => ({
        value: timezone,
        label: timezone.replace('_', ' '), // Optional: replaces underscores with spaces for readability
    })),
}));

