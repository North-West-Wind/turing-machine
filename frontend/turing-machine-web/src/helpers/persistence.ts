// A wrapper of localStorage.setItem to store timestamp as well
export function save(key: string, value: string) {
	window.localStorage.setItem(key, value);
	window.localStorage.setItem("tm:save_time", Date.now().toString());
}