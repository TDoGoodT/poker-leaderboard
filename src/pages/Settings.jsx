import { Database, RefreshCcw, Shield } from 'lucide-react';
import useAppData from '../hooks/useAppData';
import { clearLocalSessions } from '../lib/api';

export default function Settings() {
    const { reload } = useAppData();

    function handleClearLocalSessions() {
        const confirmed = window.confirm('Remove locally logged sessions from this browser?');
        if (!confirmed) {
            return;
        }

        clearLocalSessions();
        reload();
    }

    return (
        <div className="flex w-full flex-col gap-6 pb-28">
            <section className="hero-panel p-6 sm:p-8">
                <div className="section-kicker">Settings</div>
                <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-white">Operational controls</h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                    Keep the app lightweight: the base dataset stays in public data, while manually logged sessions live locally in this browser.
                </p>
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
                <Panel icon={<Database className="h-5 w-5 text-cyan-300" />} title="Data Source" description="Primary data loads from public/data.json and merges with locally saved sessions for quick iteration." />
                <Panel icon={<Shield className="h-5 w-5 text-emerald-300" />} title="Validation" description="New sessions require a zero balance before save, so buy-ins and cash-outs stay internally consistent." />
                <Panel icon={<RefreshCcw className="h-5 w-5 text-amber-200" />} title="Local Reset" description="Clear sessions added from this browser only. The bundled dataset remains untouched.">
                    <button type="button" className="app-button-secondary mt-5" onClick={handleClearLocalSessions}>Clear local sessions</button>
                </Panel>
            </section>
        </div>
    );
}

function Panel({ icon, title, description, children }) {
    return (
        <article className="glass-panel p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950/60">{icon}</div>
            <h2 className="mt-5 font-display text-2xl font-bold text-white">{title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">{description}</p>
            {children}
        </article>
    );
}