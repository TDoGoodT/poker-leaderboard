import { format } from 'date-fns';

export function formatSignedAmount(value) {
    const amount = Number(value || 0);
    const formatter = new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 0,
    });

    if (amount > 0) {
        return `+${formatter.format(amount)}`;
    }

    return formatter.format(amount);
}

export function formatWholeNumber(value) {
    return new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 0,
    }).format(Number(value || 0));
}

export function formatSessionDate(value) {
    return format(new Date(value), 'EEE, MMM d');
}

export function formatSessionDateTime(value) {
    return format(new Date(value), 'EEEE, MMM d, yyyy');
}