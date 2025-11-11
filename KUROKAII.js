// === FILE: KUROKAII.js ===
export const KEY = "KUROKAII"; // jangan diganti tolol kalo gak mau error

export function checkKeyLocal() {
    const a = KEY.split("").map(c => c.charCodeAt(0));
    const b = [75, 85, 82, 79, 75, 65, 73, 73];
    if (a.length !== b.length || !a.every((v, i) => v === b[i])) {
        throw new Error("❌ Kunci salah! Bot error.");
    }
}