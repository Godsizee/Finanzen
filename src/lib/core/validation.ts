export function isValidEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

export function isValidPassword(password: string): { valid: boolean; message?: string } {
	if (password.length < 8) {
		return { valid: false, message: 'Das Passwort muss mindestens 8 Zeichen lang sein.' };
	}
	const hasLetter = /[a-zA-Z]/.test(password);
	const hasNumber = /[0-9]/.test(password);
	if (!hasLetter || !hasNumber) {
		return {
			valid: false,
			message: 'Das Passwort muss mindestens einen Buchstaben und eine Zahl enthalten.'
		};
	}
	return { valid: true };
}

export function isValidAmount(amount: string): boolean {
	const normalized = amount.replace(',', '.');
	const parsed = parseFloat(normalized);
	return !isNaN(parsed) && parsed > 0;
}

export function sanitizeText(text: string): string {
	return text.replace(/[<>]/g, '');
}
