import { useState, useEffect } from 'react';
import { dialogState } from '../lib/dialogs';

export default function DialogContainer() {
    const [dialog, setDialog] = useState(null);
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        return dialogState.subscribe((d) => {
            setDialog(d);
            setInputValue('');
        });
    }, []);

    if (!dialog) return null;

    const close = (value) => {
        dialog.resolve(value);
        setDialog(null);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700/50 rounded-2xl shadow-xl shadow-black/50 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 flex flex-col gap-4 text-slate-200">
                    <div className="text-lg font-medium">{dialog.message}</div>
                    
                    {dialog.type === 'prompt' && (
                        <input 
                            type={dialog.inputType || "text"}
                            autoFocus
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') close(inputValue) }}
                            className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                        />
                    )}

                    <div className="flex justify-end gap-3 mt-4">
                        {dialog.type !== 'alert' && (
                            <button 
                                onClick={() => close(dialog.type === 'prompt' ? null : false)} 
                                className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 hover:text-white transition"
                            >
                                Cancel
                            </button>
                        )}
                        <button 
                            onClick={() => close(dialog.type === 'prompt' ? inputValue : true)}
                            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition"
                        >
                            OK
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}