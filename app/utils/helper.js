export function generateSKUCode(details = [], old_sku_code = '') {
    // Helper function to create short codes (3 characters max)
    const createShortCode = (str) => {
        return str ? str.replace(/\s+/g, '').substring(0, 3).toUpperCase() : '';
    };

    // Helper function to generate a random 4-digit number
    const generateRandomFourDigit = () => {
        return Math.floor(1000 + Math.random() * 9000); // Ensures a number between 1000 and 9999
    };

    // Initialize SKU parts with "SKU-" as the starting prefix
    let skuParts = ['SKU'];

    // Process the details array: each detail will be an object with 'key' and 'value'
    details.forEach(detail => {
        if (detail.value) { // Check if the value is not empty
            const shortCode = createShortCode(detail.value);
            skuParts.push(shortCode);
        }
    });

    // Add a 4-digit random number to ensure uniqueness
    skuParts.push(generateRandomFourDigit());

    // Join all parts together to form the final SKU code (separated by hyphens)
    return skuParts.join('-');
}

export const generateCouponCode = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
};

export function maskNumber(phoneNumber, visibleDigits = 4) {
    const lastNumber = phoneNumber.slice(-visibleDigits); // Extracts last 'visibleDigits' digits
    const maskedNumber = '*'.repeat(phoneNumber.length - visibleDigits) + lastNumber; // Masks the rest
    return maskedNumber;
}