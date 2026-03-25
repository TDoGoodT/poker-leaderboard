function colorFromName(name) {
    const palette = [
        'from-emerald-400 to-teal-500',
        'from-amber-400 to-orange-500',
        'from-rose-400 to-red-500',
        'from-cyan-400 to-sky-500',
        'from-fuchsia-400 to-pink-500',
        'from-lime-400 to-green-500',
    ];

    const hash = Array.from(name).reduce((total, character) => total + character.charCodeAt(0), 0);
    return palette[hash % palette.length];
}

function getInitials(name) {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();
}

export default function PlayerAvatar({ name, size = 'md' }) {
    const sizes = {
        sm: 'h-9 w-9 text-xs',
        md: 'h-11 w-11 text-sm',
        lg: 'h-14 w-14 text-base',
        xl: 'h-18 w-18 text-lg',
    };

    return (
        <div className={`inline-flex items-center justify-center rounded-2xl bg-gradient-to-br ${colorFromName(name)} ${sizes[size]} font-display font-bold text-slate-950 shadow-[0_10px_30px_rgba(15,23,42,0.35)]`}>
            {getInitials(name)}
        </div>
    );
}