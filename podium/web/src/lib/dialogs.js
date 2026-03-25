export const dialogState = {
    listeners: [],
    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    },
    dispatch(action) {
        this.listeners.forEach(l => l(action));
    }
};

export function customAlert(message) {
    return new Promise((resolve) => {
        dialogState.dispatch({ type: 'alert', message, resolve });
    });
}

export function customConfirm(message) {
    return new Promise((resolve) => {
        dialogState.dispatch({ type: 'confirm', message, resolve });
    });
}

export function customPrompt(message, type = "text") {
    return new Promise((resolve) => {
        dialogState.dispatch({ type: 'prompt', message, inputType: type, resolve });
    });
}
