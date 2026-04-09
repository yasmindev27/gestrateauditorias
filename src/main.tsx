import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const CHUNK_RELOAD_KEY = "__chunk_reload_once__";

function isDynamicImportError(reason: unknown): boolean {
	const message =
		typeof reason === "string"
			? reason
			: reason && typeof reason === "object" && "message" in reason
			? String((reason as { message?: unknown }).message)
			: "";

	const checks = [
		"Failed to fetch dynamically imported module",
		"Importing a module script failed",
		"Loading chunk",
		"dynamically imported module",
		"ChunkLoadError",
	];

	return checks.some((txt) => message.includes(txt));
}

function reloadOnceForChunkError() {
	const hasReloaded = sessionStorage.getItem(CHUNK_RELOAD_KEY) === "1";
	if (!hasReloaded) {
		sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
		window.location.reload();
	}
}

// Reset the one-time flag on successful bootstrap.
sessionStorage.removeItem(CHUNK_RELOAD_KEY);

window.addEventListener("vite:preloadError", (event) => {
	event.preventDefault();
	reloadOnceForChunkError();
});

window.addEventListener("unhandledrejection", (event) => {
	if (isDynamicImportError(event.reason)) {
		reloadOnceForChunkError();
	}
});

createRoot(document.getElementById("root")!).render(<App />);
