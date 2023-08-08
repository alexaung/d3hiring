// Desc: This file contains utility functions

// Desc: This function checks if an email is valid
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // A basic email format validation
    return emailRegex.test(email);
}

// Desc: This function parses the mentioned emails from a text
export function parseMentionedEmails(text: string): string[] {
    const matches = text.match(/@\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+/g) || [];
    return matches
        .map((email: string) => email.substring(1)) // Remove the @ symbol
        .filter(email => isValidEmail(email)); // Filter only valid emails
}