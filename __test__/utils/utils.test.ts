import { isValidEmail, parseMentionedEmails } from "../../src/utils/utils";

describe('isValidEmail utility function', () => {

    it('should return true for a valid email', () => {
        const email = "test@example.com";
        expect(isValidEmail(email)).toBe(true);
    });

    it('should return false for an email without a domain', () => {
        const email = "test@";
        expect(isValidEmail(email)).toBe(false);
    });

    it('should return false for an email without a local part', () => {
        const email = "@example.com";
        expect(isValidEmail(email)).toBe(false);
    });

    it('should return false for an email with spaces', () => {
        const email = "test @example.com";
        expect(isValidEmail(email)).toBe(false);
    });
});


describe('parseMentionedEmails utility function', () => {

    it('should return all valid mentioned emails', () => {
        const text = "Hello @test1@example.com and @test2@example.com!";
        const expectedEmails = ["test1@example.com", "test2@example.com"];
        expect(parseMentionedEmails(text)).toEqual(expectedEmails);
    });

    it('should not return invalid emails', () => {
        const text = "Hello @invalidEmail and @test@example.com!";
        const expectedEmails = ["test@example.com"];
        expect(parseMentionedEmails(text)).toEqual(expectedEmails);
    });

    it('should return an empty array if no emails are mentioned', () => {
        const text = "Hello everyone!";
        expect(parseMentionedEmails(text)).toEqual([]);
    });
});
