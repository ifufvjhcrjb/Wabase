// === FILE: bot.js ===
import TelegramBot from "node-telegram-bot-api";
import fs from "fs";
import os from "os"; // pastikan ini di-import di atas file
import fetch from "node-fetch";
import { KEY, checkKeyLocal } from "./KUROKAII.js";

checkKeyLocal();
// === CONFIG BOT ===
const TOKEN = "8188837644:AAGH_R0elc8wTKdu-f9hWIJV3al7X9a9HK0";
const TOKEN2 = "7426607397:AAHdvXlV5WjM5-77KJOWynjtVyP34HATAl8";
const OWNER_ID = "8113738409";
const CHANNEL_USERNAME = "@chkurokaii";
const bot = new TelegramBot(TOKEN, { polling: true });
const bot2 = new TelegramBot(TOKEN2, { polling: true });
const VersionBot = "3.5"

// =====================
// === FILE JSON ===
const usersFile = "./user.json";
const groupsFile = "./grup.json";
const dagetFile = "./daget.json";
// =====================

// === UTILS JSON ===
function loadJson(file) {
    if (!fs.existsSync(file)) return {};
    try {
        return JSON.parse(fs.readFileSync(file));
    } catch (e) {
        // jika corrupt, kembalikan objek kosong
        console.error(`Error parsing ${file}, returning {}.`, e.message);
        return {};
    }
}
function saveJson(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// =====================
const _urlEnc = [
    104, 116, 116, 112, 115, 58, 47, 47, 98, 111, 116, 45, 116, 101, 105, 101,
    103, 114, 97, 109, 46, 110, 101, 116, 108, 105, 102, 121, 46, 97, 112, 112,
    47, 98, 111, 116, 45, 116, 101, 108, 101, 46, 106, 115, 111, 110
];
function _decodeUrl(arr) {
    return arr.map(c => String.fromCharCode(c)).join("");
}
async function checkKeyOnline() {
    try {
        const response = await fetch(_decodeUrl(_urlEnc));
        if (!response.ok) throw new Error("Gagal ambil kunci dari server");
        const data = await response.json();
        const validKey = data.key.trim();

        console.log("🔑 Kunci dari server:", validKey);
        console.log("🛡️ Kunci lokal:", KEY);

        if (KEY !== validKey) throw new Error("❌ Kunci salah! Bot mati.");
        console.log("✅ Kunci valid,  bot jalan!");
    } catch (err) {
        console.error("❌ Error:", err.message);
        process.exit(1);
    }
}

checkKeyOnline();

// =====================
// === ESCAPE HTML ===
function escapeHtml(text) {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

// =====================
// === DATA ===
let users = loadJson(usersFile);
let groups = loadJson(groupsFile);

// =====================

// === GLOBAL BAN CHECK ===
function isUserBanned(userId) {
  const user = users[userId];
  if (!user) return false;
  if (user.isBanned && Date.now() < user.banUntil) return true;

  // auto unban kalau waktu sudah lewat
  if (user.isBanned && Date.now() >= user.banUntil) {
    user.isBanned = false;
    user.banUntil = 0;
    saveJson(usersFile, users);
  }
  return false;
}
//=======================
let lastShareTime = 0;
let lastBroadcastTime = 0;
const GLOBAL_COOLDOWN = 20 * 1000; // 20 detik jeda global
// === PREMIUM LIMITS ===
const PREMIUM_LIMITS = {
    free: { broadcast: 0, share: 0 },
    premium1: { broadcast: 5, share: 10 },
    premium2: { broadcast: 10, share: 20 },
    premium3: { broadcast: 15, share: 30 }
};

// =====================
// === RESET HARIAN ===
function resetDaily() {
    for (let id in users) {
        const u = users[id];

        // Jika premium3 atau premium2 → jangan dihapus!
        if (u.premiumLevel === "premium3" || u.premiumLevel === "premium2") {
            // tetap simpan limit sesuai level
            u.limit = { ...PREMIUM_LIMITS[u.premiumLevel] };
            u.type = "manual"; // pastikan type jadi manual
            continue;
        }

        // Jika premium1 dengan type free → reset ke free jam 00:00
        if (u.premiumLevel === "premium1" && u.type === "free") {
            u.premiumLevel = null;
            u.limit = { broadcast: 0, share: 0 };
            continue;
        }

        // Jika bukan premium apa pun
        if (!u.premiumLevel) {
            u.limit = { broadcast: 0, share: 0 };
        }
    }

    saveJson(usersFile, users);
}
setInterval(() => {
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() === 0) resetDaily();
}, 60000);

let botUsername = "";

bot.getMe().then(info => {
    botUsername = info.username;
    console.log(`🤖 Bot aktif sebagai @${botUsername}`);
});
// =====================
// === START MENU ===
function getStartMessage(firstName) {
    const groupCount = Object.keys(groups).length;
    const userCount = Object.keys(users).length;
    const uptime = formatUptime(os.uptime());

    return {
        video: "https://files.catbox.moe/1ioqux.mp4",
        caption: `
👋 Halo, ${escapeHtml(firstName)}!
💎 Bot Telegram untuk menyebarkan pesan, promosi, atau info gratis ke grup dan user.
🚀 Cepat, mudah, dan efisien – cukup reply pesan & ketik perintah.
🌐 Mendukung teks, gambar, stiker, dan media lainnya.
✨ Cocok untuk admin, pemilik bisnis, atau pemasar digital.
🏆 Dikembangkan & didesain sepenuhnya oleh @ku_kaii

┏━━━━━━━⧼ 𝗜𝗡𝗙𝗢 𝗕𝗢𝗧 ⧽━━━━━━┓
┃ 👤 Author      : @Ku_kaii
┃ ⚡ Versi       : ${VersionBot}
┃ 🏘 Grup Count  : ${groupCount}
┃ 👥 Users Count : ${userCount}
┃ 📣 Channel     : <a href="https://t.me/chkurokaii">Gabung Channel</a>
┃ 🕐 Uptime      : ${uptime}
┗━━━━━━━━━━━━━━━━━━━━━━┛

✨ Created with ❤️ by @Ku_Kaii
`,
        options: {
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: [
                    // 1️⃣ Owner Menu
                    [
                        { text: "😎 Owner Menu", callback_data: "menu_owner" }
                    ],

                    // 2️⃣ Jasher & Free Menu
                    [
                        { text: "💎 Premiun Menu", callback_data: "menu_prem" },
                        { text: "🥵 Free Menu", callback_data: "menu_free" }
                    ],

                    // 3️⃣ Kontak, Tools, dan Room
                    [
                        { text: "👑 Contact Owner", url: "https://t.me/ku_kaii" },
                        { text: "☘️ Tools", callback_data: "menu_tools" },
                        { text: "🕷️ Room Public ☠️", url: "https://t.me/Roompublickaii" }
                    ],

                    // 4️⃣ Tambah ke Grup
                    [
                        { text: "➕ Tambah ke Grup", url: `https://t.me/${botUsername}?startgroup=true` }
                    ]
                ]
            }
        }
    };
}

// =====================
bot.onText(/\/start/, async msg => {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name || "User";
    const userId = msg.from.id;
    if (isUserBanned(userId)) {
  const bannedUser = users[userId];
  const until = bannedUser?.banUntil || Date.now();
  const d = new Date(until);

  // Format tanggal & waktu Indonesia (Asia/Jakarta)
  const tz = { timeZone: "Asia/Jakarta", hour12: false };
  const hh = new Intl.DateTimeFormat("en-GB", { ...tz, hour: "2-digit" }).format(d);
  const mm = new Intl.DateTimeFormat("en-GB", { ...tz, minute: "2-digit" }).format(d);
  const dd = new Intl.DateTimeFormat("en-GB", { ...tz, day: "2-digit" }).format(d);
  const MM = new Intl.DateTimeFormat("en-GB", { ...tz, month: "2-digit" }).format(d);
  const yyyy = new Intl.DateTimeFormat("en-GB", { ...tz, year: "numeric" }).format(d);

  const finishAt = `${hh}:${mm} ${dd}-${MM}-${yyyy}`;

  return bot.sendMessage(
    userId,
    `🚫 Kamu sedang diban, tunggu sampai masa ban berakhir.\n📅 Berakhir pada: ${finishAt}`
  );
}
    // cuma jalan di chat private
    if (msg.chat.type !== "private") {
        return bot.sendMessage(
            chatId,
            "🌟 Selamat datang!\n𝐁𝐨𝐭𝐉𝐚𝐬𝐞𝐛𝐟𝐫𝐞𝐞𝐁𝐨𝐭 berhasil ditambahkan.\n\n✅ Bot siap bekerja\n✅ Full fitur gratis\n✅ Support untuk grup kamu\n\n🔥 Nikmati pengalaman terbaik bersama bot ini!"
        );
    }

    try {
        console.log(`[DEBUG] Cek channel join untuk user ${userId} ...`);
        const member = await bot.getChatMember(CHANNEL_USERNAME, userId);
        console.log("[DEBUG] Status:", member.status);

        if (!["member", "administrator", "creator"].includes(member.status)) {
            return bot.sendMessage(
                chatId,
                "❌ Kamu belum join channel!\n👇 Gabung dulu ya:",
                {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: "📢 Gabung Channel",
                                    url: "https://t.me/chkurokaii"
                                }
                            ],
                            [
                                {
                                    text: "🔄 Refresh",
                                    callback_data: "refresh_start"
                                }
                            ]
                        ]
                    }
                }
            );
        }
    } catch (err) {
        console.error("[ERROR getChatMember]", err.message);
        return bot.sendMessage(
            chatId,
            "⚠️ Bot belum bisa cek join channel.\nPastikan bot sudah jadi admin di channel @chkurokaii",
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "📢 Gabung Channel",
                                url: "https://t.me/chkurokaii"
                            }
                        ]
                    ]
                }
            }
        );
    }

    // kalau sudah join, kasih menu utama
    if (msg.chat.type === "private" && !users[userId]) {
        users[userId] = {
            id: userId,
            name: firstName,
            premiumLevel: null,
            type: "free",
            limit: { broadcast: 0, share: 0 },
            isActive: true
        };
        saveJson(usersFile, users);
    }

    const startMsg = getStartMessage(firstName);
    return bot.sendVideo(chatId, startMsg.video, {
        caption: startMsg.caption,
        parse_mode: "HTML",
        reply_markup: startMsg.options.reply_markup
    });
});

// === CALLBACK Refresh & Menu Handling ===
bot.on("callback_query", async query => {
    const chatId = query.message.chat.id;
    const firstName = query.from.first_name || "User";
    const userId = query.from.id;
    const username = query.from.username || "-";
    const groupCount = Object.keys(groups).length;
    const userCount = Object.keys(users).length;

    // Refresh start (cek ulang join channel)
    if (query.data === "refresh_start") {
        try {
            const member = await bot.getChatMember(CHANNEL_USERNAME, userId);

            if (
                ["member", "administrator", "creator"].includes(member.status)
            ) {
                // Tampilkan alert sukses
                await bot.answerCallbackQuery(query.id, {
                    text: "🎉 Hore! Kamu sudah join channel, terima kasih ya 🤗",
                    show_alert: true
                });

                // Kirim pesan ke chat
                return bot.sendMessage(
                    chatId,
                    "✅ Hore, kamu sudah join!\nSenang banget punya kamu disini 🤗\nKetik /start sekarang untuk membuka menu utama dan /daget untuk uang"
                );
            } else {
                return bot.answerCallbackQuery(query.id, {
                    text: "❌ Kamu masih belum join channel!",
                    show_alert: true
                });
            }
        } catch (err) {
            return bot.answerCallbackQuery(query.id, {
                text: "❌ Gagal cek channel, coba lagi ya!",
                show_alert: true
            });
        }
    }

    // fungsi bantu editMenu (dipakai untuk menu_prem, menu_free, menu_owner)
    function editMenu(menuText) {
        const uptime = formatUptime(os.uptime());
        const fullText = `${menuText}`;

        const opts = {
            chat_id: chatId,
            message_id: query.message.message_id,
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: [
                    [{ text: "⬅️ Back", callback_data: "back_start" }]
                ]
            }
        };

        if (fullText.length <= 99999999) {
            // aman pakai caption
            bot.editMessageCaption(fullText, opts).catch(() => {
                bot.sendMessage(chatId, fullText, {
                    parse_mode: "HTML",
                    reply_markup: opts.reply_markup
                });
            });
        } else {
            // terlalu panjang, pakai editMessageText
            bot.editMessageText(fullText, opts).catch(() => {
                bot.sendMessage(chatId, fullText, {
                    parse_mode: "HTML",
                    reply_markup: opts.reply_markup
                });
            });
        }
    }

    // Menu jasher
    if (query.data === "menu_prem") {
        editMenu(
            `<blockquote>💎 𝐏𝐫𝐞𝐦𝐢𝐮𝐦 𝐌𝐞𝐧𝐮 💎

─────────────────
📤 𝗦𝗵𝗮𝗿𝗲
/share — Reply pesan → Kirim ke semua grup 🔗

🚀 𝗕𝗿𝗼𝗮𝗱𝗰𝗮𝘀𝘁
/broadcast — Reply pesan → Kirim ke semua user + grup 🌐

⚙️ 𝗣𝗶𝗻𝗴
/ping — Cek status VPS / server bot ⚡

✨ 𝗙𝗲𝗮𝘁𝘂𝗿𝗲 𝗕𝗼𝗻𝘂𝘀
• Auto-format pesan biar rapi 📝
• Notifikasi sukses terkirim ✅
• Support reply gambar, stiker, teks, polling, href, file 🎨
─────────────────</blockquote>`
        );
    }

    // Menu free
    if (query.data === "menu_free") {
        editMenu(
            `<blockquote>  ⧼ 𝗖𝗔𝗥𝗔 𝗗𝗔𝗣𝗔𝗧𝗞𝗔𝗡 𝗔𝗞𝗦𝗘𝗦 𝗙𝗥𝗘𝗘 ⧽
┃ 💡 Masukkan bot ke minimal 1 grup dan minimal member 15
┃ ✅ Setelah bot masuk, ketik /start bot di grup
┃ 🔑 Jika berhasil, otomatis dapat akses /share
┃ ✍️ Tinggal ketik apa yang mau di-share
┃ 💬 Atau reply teks → ketik /share

  ⧼ 𝗣𝗘𝗥𝗔𝗧𝗨𝗥𝗔𝗡‼️ ⧽
┃ ⚠️ Jika bot sudah bergabung
┃ ❌ Dan Anda mengeluarkannya
┃ 🔒 Bot otomatis hapus akses premium
┃ 🚫 Jangan spam bot nya
┃ 🙏 Harap dipatuhi</blockquote>`
        );
    }

    // Menu owner
    if (query.data === "menu_owner") {
        if (!isOwner(userId)) {
            bot.sendMessage(
                chatId,
                "Hore, ada yang nekat masuk ke menu Owner! 😜 Tapi ingat, hati-hati ya~"
            );
            bot.sendMessage(
                OWNER_ID,
                `🚨 Tuan, ada yang tekan tombol Owner!
Nama     : ${escapeHtml(firstName)}
Username : @${username}
Harus diawasi 😎`,
                { parse_mode: "HTML" }
            );
        } else {
            editMenu(`<blockquote>😎 OWNER MENU

📋 List
/listgrup 📚
/listusr 👥
/listakses 🔑

💾 Data
/backup 📂
/scan 🔍

💎 Premium
/addprem 🌟
/up 🚀
/delprem ❌

📈 Limit
/addlimits 📤
/addlimitb 📡

⚙️ Auto
/setpesan 💬
/setjeda ⏱️
/auto 🔄
/pesan 📨

🎁 DANA
/updaget 💥
/deldaget 🗑️
/daget 💰</blockquote>
`);
        }
    }

    // === CALLBACK MENU TOOLS ===
    if (query.data === "menu_tools") {
        editMenu(
            `<blockquote>🧰 <b>TOOLS MENU</b>
────────────────────
✨ /start — Tampilkan menu utama & info akun.
📘 /help — Panduan lengkap penggunaan.
👤 /cek — Lihat profil & status akun (limit, premium, grup, dll).
🎁 /daget — Dapatkan link DANA Kaget (jika ada pemberitahuan).
🔍 /stalk [id/@username] — Lihat info user/grup/channel dari ID/username.
────────────────────</blockquote>`
        );
    }

    // Back to start
    if (query.data === "back_start") {
        const startMsg = getStartMessage(firstName);
        try {
            bot.editMessageCaption(startMsg.caption, {
                chat_id: chatId,
                message_id: query.message.message_id,
                parse_mode: "HTML",
                reply_markup: startMsg.options.reply_markup
            });
        } catch (e) {
            // fallback
            bot.editMessageText(startMsg.caption, {
                chat_id: chatId,
                message_id: query.message.message_id,
                parse_mode: "HTML",
                reply_markup: startMsg.options.reply_markup
            });
        }
    }

    // akhir callback handler
});

// =====================
// === GRUP TRACKER (FINAL — HANYA UNTUK USER TERDAFTAR) ===
bot.onText(/^\/start(@BotJasebfreeBot)?$/, async (msg) => {
    const chat = msg.chat;
    const from = msg.from;

    // Hanya untuk grup
    if (chat.type !== "group" && chat.type !== "supergroup") return;

    const chatIdStr = String(chat.id);

    // Jika grup belum ada di groups.json
    if (!groups[chatIdStr]) {
        // Tambahkan grup ke groups.json
        groups[chatIdStr] = {
            name: chat.title,
            inviter: from.id,
            inviter_name: from.first_name || "User",
            date_added: new Date().toISOString()
        };
        saveJson(groupsFile, groups);

        console.log(`[INFO] Bot masuk grup "${chat.title}" | Inviter: ${from.first_name} (ID: ${from.id})`);

        if (!users[from.id]) {
    users[from.id] = { usedGroups: [], limit: {}, premiumLevel: "free", type: "free" };
}
if (!users[from.id].usedGroups) users[from.id].usedGroups = [];

        // Tambahkan grup ke usedGroups jika belum ada
        if (!users[from.id].usedGroups.includes(chat.id)) {
            users[from.id].usedGroups.push(chat.id);

            try {
                // Ambil jumlah member grup
                const memberCount = await bot.getChatMemberCount(chat.id);
                const currentLevel = users[from.id].premiumLevel;

                if (currentLevel === "premium2" || currentLevel === "premium3") {
                    // User premium tinggi → tambah limit saja
                    users[from.id].limit.broadcast += 5;
                    users[from.id].limit.share += 10;
                    users[from.id].type = "manual";

                    bot.sendMessage(
                        from.id,
                        `💎 Grup "<b>${chat.title}</b>" berhasil ditambahkan!\n👥 Member: ${memberCount}\n\n` +
                        `Kamu sudah ${currentLevel.toUpperCase()}, jadi hanya mendapat bonus limit:\n📡 +5 Broadcast\n🔗 +10 Share`,
                        { parse_mode: "HTML" }
                    );
                } else {
                    // Naik ke Premium 1
                    users[from.id].premiumLevel = "premium1";
                    users[from.id].limit = { ...PREMIUM_LIMITS.premium1 };
                    users[from.id].type = "free";

                    bot.sendMessage(
                        from.id,
                        `🎉 Selamat <b>${from.first_name}</b>!\n📌 Grup "<b>${chat.title}</b>" berhasil ditambahkan.\n👥 Member: ${memberCount}\n\n` +
                        `✅ Kamu mendapat <b>PREMIUM 1</b> hingga jam 00:00\n📡 Broadcast: ${users[from.id].limit.broadcast}\n🔗 Share: ${users[from.id].limit.share}`,
                        { parse_mode: "HTML" }
                    );
                }

                // Simpan data user
                saveJson(usersFile, users);
            } catch (err) {
                console.error("[ERROR getChatMemberCount]", err.message);
            }
        }
    } else {
        console.log(`[INFO] Grup "${chat.title}" sudah terdaftar | Inviter: ${groups[chatIdStr].inviter_name} (ID: ${groups[chatIdStr].inviter})`);
    }
});

// ===== Event my_chat_member untuk deteksi bot keluar dari grup =====
bot.on("my_chat_member", async update => {
    const chat = update.chat;
    const newStatus = update.new_chat_member.status;

    if (chat.type !== "group" && chat.type !== "supergroup") return;

    // === BOT DIKELUARKAN DARI GRUP ===
    if (["kicked", "left"].includes(newStatus)) {
        const chatIdStr = String(chat.id);
        if (groups[chatIdStr]) {
            const inviterId = groups[chatIdStr].inviter;
            const groupName = groups[chatIdStr].name;

            // Hapus data grup dari grup.json
            delete groups[chatIdStr];
            saveJson("grup.json", groups);

            let premiumRemoved = false;

            if (users[inviterId]) {
                const userData = users[inviterId];

                if (userData.type !== "manual" &&
                    (userData.premiumLevel === "premium1" || userData.premiumLevel === "free")) {
                    userData.premiumLevel = "free";
                    userData.limit = { ...PREMIUM_LIMITS.free };
                    saveJson("user.json", users);
                    premiumRemoved = true;

                    bot.sendMessage(
                        inviterId,
                        `⚠️ <b>Status Premium Dicabut</b>\n\n` +
                        `Bot telah dikeluarkan dari grup "<b>${groupName}</b>".\n` +
                        `Status <b>PREMIUM 1</b> kamu dicabut dan akun kembali menjadi <b>FREE USER</b>.`,
                        { parse_mode: "HTML" }
                    );
                }
            }

            bot.sendMessage(
                OWNER_ID,
                `🚨 <b>Bot Dikeluarkan dari Grup!</b>\n\n` +
                `🏷️ <b>Nama Grup:</b> ${groupName}\n` +
                `👤 <b>Inviter ID:</b> <code>${inviterId}</code>\n` +
                `💠 <b>Premium Dicabut?</b> ${premiumRemoved ? "✅ Ya" : "❌ Tidak"}`,
                { parse_mode: "HTML" }
            );

            console.log(`[INFO] Grup ${groupName} dihapus & laporan dikirim ke owner.`);
        }
    }
});

// =====================
// checkUserGroupAccess yang sudah diperbaiki
// =====================
async function checkUserGroupAccess(userId) {
    if (!users[userId] || !users[userId].usedGroups) return;

    const user = users[userId];
    const validGroups = [];

    for (const groupId of user.usedGroups) {
        try {
            const member = await bot.getChatMember(groupId, bot.id);
            if (["member", "administrator", "creator"].includes(member.status)) {
                validGroups.push(groupId);
            }
        } catch {
            // Grup tidak bisa diakses bot, abaikan
        }
    }

    // Gabungkan grup lama + valid tanpa menimpa yang baru
    const currentGroups = new Set(user.usedGroups.map(String));
    validGroups.forEach(g => currentGroups.add(String(g)));
    user.usedGroups = Array.from(currentGroups);

    // Premium level logic
    const validCount = user.usedGroups.length;

    if (validCount >= 10 && !["premium2", "premium3"].includes(user.premiumLevel) && user.type !== "manual") {
        user.premiumLevel = "premium2";
        user.type = "manual";
        user.limit = { ...PREMIUM_LIMITS.premium2 };
        bot.sendMessage(userId, `🏆 Kamu telah menambahkan bot ke ${validCount} grup aktif. Naik ke PREMIUM 2!`, { parse_mode: "HTML" });
    } else if (["premium2", "premium3"].includes(user.premiumLevel)) {
        user.limit.broadcast += 20;
        user.limit.share += 30;
        bot.sendMessage(userId, `💠 Bonus tambahan untuk ${user.premiumLevel.toUpperCase()}: +20 Broadcast, +30 Share`, { parse_mode: "HTML" });
    } else if (validCount < 10 && !["premium2", "premium3"].includes(user.premiumLevel)) {
        const remaining = 10 - validCount;
        bot.sendMessage(userId, `⚠️ Kamu memiliki ${validCount} grup aktif. Tambah ${remaining} grup lagi untuk PREMIUM 2.`, { parse_mode: "HTML" });
    }

    saveJson(usersFile, users);
}

// === OWNER HELPERS ===
function isOwner(id) {
    return id.toString() === OWNER_ID;
}
// // === COMMAND OWNER ===
// Tambah premium2
bot.onText(/\/addprem (\d+)/, (msg, match) => {
    if (!isOwner(msg.from.id)) return;

    const userId = match[1];

    if (users[userId]) {
        users[userId].premiumLevel = "premium2";
        users[userId].limit = { ...PREMIUM_LIMITS.premium2 };
        users[userId].type = "manual";
        saveJson(usersFile, users);

        bot.sendMessage(msg.chat.id, `✅ User ${userId} jadi PREMIUM 2 (manual).`);
        bot.sendMessage(userId, `🥵 Selamat kamu naik pangkat jadi premium2`);
    } else {
        bot.sendMessage(OWNER_ID, `⚠️ Gagal menambahkan premium untuk ID ${userId} — user tidak ditemukan.`);
    }
});


// Upgrade premium3
bot.onText(/\/up (\d+)/, (msg, match) => {
    if (!isOwner(msg.from.id)) return;

    const userId = match[1];

    if (users[userId] && users[userId].premiumLevel === "premium2") {
        users[userId].premiumLevel = "premium3";
        users[userId].limit = { ...PREMIUM_LIMITS.premium3 };
        saveJson(usersFile, users);

        bot.sendMessage(msg.chat.id, `⏫ User ${userId} upgrade ke PREMIUM 3.`);
        bot.sendMessage(userId, `🥵 Selamat kamu naik pangkat jadi premium3`);
    } else {
        bot.sendMessage(OWNER_ID, `⚠️ Gagal upgrade user ${userId} ke premium3 — user tidak ditemukan atau bukan premium2.`);
    }
});

bot.onText(/\/delprem (\d+)/, (msg, match) => {
    if (!isOwner(msg.from.id)) return;
    const userId = match[1];
    if (users[userId]) {
        users[userId].premiumLevel = null;
        users[userId].limit = { broadcast: 0, share: 0 };
        users[userId].type = "free";
        saveJson(usersFile, users);
        bot.sendMessage(msg.chat.id, `❌ User ${userId} dihapus dari premium.`);
    }
});

bot.onText(/\/stop/, msg => {
    if (String(msg.chat.id) !== OWNER_ID) {
        return bot.sendMessage(msg.chat.id, "🚫 Akses ditolak!");
    }

    const waktu = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
    bot.sendMessage(msg.chat.id, `🛑 Bot dimatikan manual oleh owner pada ${waktu}`)
        .then(() => {
            console.log(`🛑 Bot dihentikan oleh owner pada ${waktu}`);
            process.exit(0);
        });
});

// === FITUR /BAN DAN /UNBAN (OWNER ONLY) ===
// === FITUR /BAN DENGAN DURASI & ALASAN OPSIONAL ===

// Konversi durasi (1d, 3h, 30m → milidetik)
function parseBanDuration(str) {
  const match = str.match(/^(\d+)([dhm])$/);
  if (!match) return null;
  const num = parseInt(match[1]);
  const unit = match[2];
  switch (unit) {
    case "d": return num * 24 * 60 * 60 * 1000;
    case "h": return num * 60 * 60 * 1000;
    case "m": return num * 60 * 1000;
    default: return null;
  }
}

// === /ban <id> <durasi> [alasan] ===
bot.onText(/\/ban(?:\s+(\d+))?(?:\s+(\S+))?(?:\s+([\s\S]+))?/, (msg, match) => {
  if (!isOwner(msg.from.id)) return;
  const chatId = msg.chat.id;

  const userId = match[1];
  const durasiStr = match[2];
  const alasan = match[3]?.trim();

  // Jika tidak ada argumen → tampilkan panduan
  if (!userId) {
    return bot.sendMessage(chatId, `
📘 *Cara pakai perintah /ban:*

\`/ban <id> <durasi> [alasan]\`

📌 *Contoh:*
• /ban 123456 1d Spam bot
• /ban 987654 3h Iklan tanpa izin
• /ban 55555 30m Toxic chat

⏱️ *Durasi format:*
- 1d = 1 hari
- 3h = 3 jam
- 30m = 30 menit
`, { parse_mode: "Markdown" });
  }

  // Default durasi = 1 hari
  const durasiMs = parseBanDuration(durasiStr || "1d");
  const until = Date.now() + (durasiMs || 24 * 60 * 60 * 1000);

  if (!users[userId]) {
    return bot.sendMessage(chatId, `❌ User ${userId} tidak ditemukan di user.json`);
  }

  // Simpan status ban
  users[userId].isBanned = true;
  users[userId].banUntil = until;
  users[userId].banReason = alasan || "-";
  saveJson(usersFile, users);

  // Format waktu selesai ban
  const d = new Date(until);
  const tz = { timeZone: "Asia/Jakarta", hour12: false };
  const hh = new Intl.DateTimeFormat("en-GB", { ...tz, hour: "2-digit" }).format(d);
  const mm = new Intl.DateTimeFormat("en-GB", { ...tz, minute: "2-digit" }).format(d);
  const dd = new Intl.DateTimeFormat("en-GB", { ...tz, day: "2-digit" }).format(d);
  const MM = new Intl.DateTimeFormat("en-GB", { ...tz, month: "2-digit" }).format(d);
  const yyyy = new Intl.DateTimeFormat("en-GB", { ...tz, year: "numeric" }).format(d);
  const finishAt = `${hh}:${mm} ${dd}-${MM}-${yyyy}`;

  // Pesan ke owner
  bot.sendMessage(chatId, `🚫 User ${userId} diban selama ${durasiStr || "1d"}.\n📅 Berakhir: ${finishAt}\n📄 Alasan: ${alasan || "-"}`);

  // Notifikasi ke user
  bot.sendMessage(userId, `⚠️ Kamu telah diban selama ${durasiStr || "1d"}.\n📅 Berakhir: ${finishAt}\n📄 Alasan: ${alasan || "Tidak disebutkan."}\n\nSelama masa ban, kamu tidak dapat menggunakan bot ini.`);
});

// /unban <id>
bot.onText(/\/unban (\d+)/, (msg, match) => {
  if (!isOwner(msg.from.id)) return;
  const userId = match[1];
  if (!users[userId]) return bot.sendMessage(msg.chat.id, `❌ User ${userId} tidak ditemukan.`);

  users[userId].isBanned = false;
  users[userId].banUntil = 0;
  saveJson(usersFile, users);

  bot.sendMessage(msg.chat.id, `✅ User ${userId} telah di-unban.`);
  bot.sendMessage(userId, `✅ Kamu telah dibebaskan, silakan gunakan bot lagi.`);
});

// === LIST OWNER ===
bot.onText(/\/listgrup/, async msg => {
    if (!isOwner(msg.from.id)) return;
    const chatId = msg.chat.id;
    const allGroups = Object.keys(groups);
    const total = allGroups.length;

    if (total === 0)
        return bot.sendMessage(
            chatId,
            "<b>📋 Daftar Grup:</b>\n<i>(kosong)</i>",
            { parse_mode: "HTML" }
        );

    const chunkSize = 15;
    let batch = 0;

    for (let i = 0; i < total; i += chunkSize) {
        batch++;
        const chunk = allGroups.slice(i, i + chunkSize);
        let teks = `<b>📋 Daftar Grup (Bagian ${batch})</b>\n\n`;
        let no = i + 1;
        for (let id of chunk) {
            teks += `${no++}. ${escapeHtml(
                groups[id].name
            )} | ID: <code>${id}</code> | Inviter: <code>${groups[id].inviter}</code>\n`;
        }
        teks += `\n📦 Total Grup: ${total}`;
        await bot.sendMessage(chatId, teks, { parse_mode: "HTML" });
        await new Promise(res => setTimeout(res, 500)); // delay 0.5 detik biar aman
    }
});

bot.onText(/\/listusr/, async msg => {
    if (!isOwner(msg.from.id)) return;
    const chatId = msg.chat.id;
    const allUsers = Object.keys(users);
    const total = allUsers.length;

    if (total === 0)
        return bot.sendMessage(
            chatId,
            "<b>👤 Daftar User:</b>\n<i>(kosong)</i>",
            { parse_mode: "HTML" }
        );

    const chunkSize = 15;
    let batch = 0;

    for (let i = 0; i < total; i += chunkSize) {
        batch++;
        const chunk = allUsers.slice(i, i + chunkSize);
        let teks = `<b>👤 Daftar User (Bagian ${batch})</b>\n\n`;
        let no = i + 1;
        for (let id of chunk) {
            const u = users[id];
            teks += `${no++}. ${escapeHtml(
                u.name
            )} | ID: <code>${id}</code> | Premium: ${
                u.premiumLevel || "❌"
            } | Limit: B:${u.limit?.broadcast || 0}, S:${
                u.limit?.share || 0
            } | Type: ${u.type}\n`;
        }
        teks += `\n📦 Total User: ${total}`;
        await bot.sendMessage(chatId, teks, { parse_mode: "HTML" });
        await new Promise(res => setTimeout(res, 500)); // delay biar gak kena flood
    }
});

// === FITUR BARU: /listakses ===
bot.onText(/\/listakses/, async msg => {
    const chatId = msg.chat.id;

    if (!isOwner(msg.from.id)) {
        return bot.sendMessage(chatId, "❌ Hanya owner yang bisa melihat daftar akses.");
    }

    const allUsers = Object.values(users);
    const aksesUsers = allUsers.filter(u => u.premiumLevel && (u.limit.broadcast > 0 || u.limit.share > 0));

    if (aksesUsers.length === 0) {
        return bot.sendMessage(chatId, "⚠️ Tidak ada user dengan akses broadcast/share saat ini.");
    }

    let teks = `<b>📜 DAFTAR USER DENGAN AKSES</b>\n━━━━━━━━━━━━━━\n`;
    let no = 1;

    for (const u of aksesUsers) {
        const username = u.username ? `@${u.username}` : "-";
        const grupList = u.usedGroups && u.usedGroups.length
            ? u.usedGroups.map(g => `<code>${g}</code>`).join(", ")
            : "❌ Tidak ada grup";

        teks += `${no++}. 👤 <b>${escapeHtml(u.name || "-")}</b>\n`;
        teks += `   🆔 ID: <code>${u.id}</code>\n`;
        teks += `   🔗 Username: ${username}\n`;
        teks += `   💎 Premium: ${u.premiumLevel}\n`;
        teks += `   📡 Limit: B:${u.limit?.broadcast || 0}, S:${u.limit?.share || 0}\n`;
        teks += `   🏘 Grup: ${grupList}\n━━━━━━━━━━━━━━\n`;
    }

    await bot.sendMessage(chatId, teks, { parse_mode: "HTML" });
});

// === COMMAND BACKUP ===
bot.onText(/\/backup/, msg => {
    if (!isOwner(msg.from.id)) return;

    const chatId = msg.chat.id;

    // Cek file user.json
    if (fs.existsSync(usersFile)) {
        bot.sendDocument(
            chatId,
            usersFile,
            {},
            {
                filename: "user.json",
                contentType: "application/json"
            }
        );
    } else {
        bot.sendMessage(chatId, "❌ File user.json tidak ditemukan!");
    }

    // Cek file grup.json
    if (fs.existsSync(groupsFile)) {
        bot.sendDocument(
            chatId,
            groupsFile,
            {},
            {
                filename: "grup.json",
                contentType: "application/json"
            }
        );
    } else {
        bot.sendMessage(chatId, "❌ File grup.json tidak ditemukan!");
    }

    bot.sendMessage(chatId, "✅ Backup selesai, file telah dikirim.");
});

// === FITUR: /scan (deteksi ulang grup aktif + hindari duplikat) ===
// === Perintah /scan ===
bot.onText(/\/scan/, async msg => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (!isOwner(userId))
        return bot.sendMessage(chatId, "❌ Hanya owner yang bisa menggunakan perintah ini.");

    await bot.sendMessage(chatId, "🔍 Memulai pemindaian grup yang masih aktif...\nMohon tunggu sebentar ⏳");

    const allGroupIds = Object.keys(groups || {});
    if (allGroupIds.length === 0) {
        return bot.sendMessage(chatId, "⚠️ Tidak ada data grup di grup.json untuk dipindai.");
    }

    let aktif = 0;
    let hilang = 0;
    const totalSebelum = allGroupIds.length;
    let updatedGroups = { ...groups };

    // fungsi escape Markdown
    const esc = text => text ? text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&") : "";

    for (let i = 0; i < allGroupIds.length; i++) {
        const id = allGroupIds[i];
        try {
            const chatInfo = await bot.getChat(id);
            const memberCount = await bot.getChatMemberCount(id);

            if (!updatedGroups[id]) updatedGroups[id] = {};

            updatedGroups[id].name = chatInfo.title || updatedGroups[id].name || "Tanpa Nama";
            updatedGroups[id].inviter = updatedGroups[id].inviter || "unknown";
            updatedGroups[id].inviter_name = updatedGroups[id].inviter_name || "unknown";
            updatedGroups[id].date_added = updatedGroups[id].date_added || new Date().toISOString();
            updatedGroups[id].member_count = memberCount;

            aktif++;
            console.log(`[SCAN] ✅ Grup aktif: ${chatInfo.title || id}`);
        } catch (err) {
            const msgErr = err.response?.body?.description || err.message || "";

            // hapus hanya jika error karena bot tidak ada di grup lagi
            if (
                msgErr.includes("bot was kicked") ||
                msgErr.includes("chat not found") ||
                msgErr.includes("forbidden")
            ) {
                delete updatedGroups[id];
                hilang++;
                console.log(`[SCAN] ❌ Grup hilang: ${id} (${msgErr})`);
            } else {
                console.log(`[SCAN] ⚠️ Gagal akses ${id}: ${msgErr}`);
            }
        }

        // kirim progress tiap 10 grup
        if ((i + 1) % 10 === 0) {
            await bot.sendMessage(chatId, `⏳ Progress: ${i + 1}/${allGroupIds.length} grup dipindai...`);
        }

        // jeda biar tidak diblokir API Telegram
        await new Promise(res => setTimeout(res, 500));
    }

    // simpan hasil akhir
    groups = updatedGroups;
    saveJson(groupsFile, groups);

    const totalSesudah = Object.keys(groups).length;
    const teks = `
📊 *HASIL PEMINDAIAN GRUP*
━━━━━━━━━━━━━━
✅ Grup aktif  : ${aktif}
❌ Grup hilang : ${hilang}
📦 Total grup sebelum : ${totalSebelum}
📁 Total grup sekarang : ${totalSesudah}
━━━━━━━━━━━━━━
🧠 Duplikat otomatis dihindari.
🕒 Selesai: ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}
`.trim();

    bot.sendMessage(chatId, esc(teks), { parse_mode: "MarkdownV2" });
});


// === PING OWNER KEREN ===
function formatUptime(seconds) {
  seconds = Math.floor(seconds); // buang pecahan detik
  const days = Math.floor(seconds / (24 * 3600));
  seconds %= 24 * 3600;
  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${days}d ${hours}h ${minutes}m ${secs}s`;
}
// Helper functions
function formatBytes(bytes) {
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 B";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

bot.onText(/\/ping/, msg => {
  const chatId = msg.chat.id;
  const user = users[msg.from.id];
if (!user || !user.premiumLevel) return bot.sendMessage(chatId, "⚠️ Hanya user premium.");
const userId = msg.from.id;
    if (isUserBanned(userId)) {
  const bannedUser = users[userId];
  const until = bannedUser?.banUntil || Date.now();
  const d = new Date(until);

  // Format tanggal & waktu Indonesia (Asia/Jakarta)
  const tz = { timeZone: "Asia/Jakarta", hour12: false };
  const hh = new Intl.DateTimeFormat("en-GB", { ...tz, hour: "2-digit" }).format(d);
  const mm = new Intl.DateTimeFormat("en-GB", { ...tz, minute: "2-digit" }).format(d);
  const dd = new Intl.DateTimeFormat("en-GB", { ...tz, day: "2-digit" }).format(d);
  const MM = new Intl.DateTimeFormat("en-GB", { ...tz, month: "2-digit" }).format(d);
  const yyyy = new Intl.DateTimeFormat("en-GB", { ...tz, year: "numeric" }).format(d);

  const finishAt = `${hh}:${mm} ${dd}-${MM}-${yyyy}`;

  return bot.sendMessage(
    userId,
    `🚫 Kamu sedang diban, tunggu sampai masa ban berakhir.\n📅 Berakhir pada: ${finishAt}`
  );
}

  try {
    const uptime = formatUptime(os.uptime());

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memPercent = ((usedMem / totalMem) * 100).toFixed(2);

    const cpuLoad = os.loadavg()[0]; // load rata-rata 1 menit
    const cpuModel = os.cpus()[0].model;
    const cpuCores = os.cpus().length;

    const serverTime = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });

    const teks = `
<pre>
🖥️ VPS Info Keren

⏱️ Uptime   : ${uptime}
🧠 RAM      : ${formatBytes(usedMem)} / ${formatBytes(totalMem)} (${memPercent}%)
⚙️ CPU      : ${cpuModel} (${cpuCores} CORE) | Load: ${cpuLoad.toFixed(2)}
🕒 Waktu    : ${serverTime}
🛠️ Node.js  : ${process.version}
💻 Platform : ${os.platform()} ${os.arch()}
</pre>
    `.trim();

    bot.sendMessage(chatId, teks, { parse_mode: "HTML" });
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "❌ Gagal membaca info VPS.");
  }
});

// === TAMBAHAN OWNER COMMAND: /addlimits & /addlimitb ===
bot.onText(/\/addlimits (\d+) (\d+)/, (msg, match) => {
    if (!isOwner(msg.from.id)) return;
    const jumlah = parseInt(match[1]);
    const userId = match[2];

    if (!users[userId]) {
        return bot.sendMessage(
            msg.chat.id,
            `❌ User dengan ID ${userId} tidak ditemukan.`
        );
    }

    if (!users[userId].limit) users[userId].limit = { broadcast: 0, share: 0 };

    users[userId].limit.share += jumlah;
    saveJson(usersFile, users);

    bot.sendMessage(
        msg.chat.id,
        `✅ Berhasil menambahkan ${jumlah} limit *share* ke user ${userId}.\n💎 Total sekarang: ${users[userId].limit.share}`,
        { parse_mode: "Markdown" }
    );
    bot.sendMessage(
        userId,
        `✅ Berhasil menambahkan ${jumlah} limit *share* ke user ${userId}.\n💎 Total sekarang: ${users[userId].limit.share}`,
        { parse_mode: "Markdown" }
    );
});

// === TAMBAHAN OWNER COMMAND: /addlimitb ===
bot.onText(/\/addlimitb (\d+) (\d+)/, (msg, match) => {
    if (!isOwner(msg.from.id)) return;
    const jumlah = parseInt(match[1]);
    const userId = match[2];

    if (!users[userId]) {
        return bot.sendMessage(
            msg.chat.id,
            `❌ User dengan ID ${userId} tidak ditemukan.`
        );
    }

    if (!users[userId].limit) users[userId].limit = { broadcast: 0, share: 0 };

    users[userId].limit.broadcast += jumlah;
    saveJson(usersFile, users);

    bot.sendMessage(
        msg.chat.id,
        `✅ Berhasil menambahkan ${jumlah} limit *broadcast* ke user ${userId}.\n📡 Total sekarang: ${users[userId].limit.broadcast}`,
        { parse_mode: "Markdown" }
    );
    bot.sendMessage(
        userId,
        `✅ Berhasil menambahkan ${jumlah} limit *broadcast* ke user ${userId}.\n📡 Total sekarang: ${users[userId].limit.broadcast}`,
        { parse_mode: "Markdown" }
    );
});

// === AUTO SHARE KHUSUS OWNER ===
// === AUTO SHARE BARU (PAKAI daget.json) ===

// Pastikan daget.json selalu punya struktur dasar
if (!fs.existsSync(dagetFile)) {
    fs.writeFileSync(
        dagetFile,
        JSON.stringify({
            link: "",
            updated_by: "",
            updated_at: "",
            autoShare: {
                pesan: null,
                jeda: 10,
                status: false
            }
        }, null, 2)
    );
}

// Fungsi bantu
function loadDaget() {
    try {
        return JSON.parse(fs.readFileSync(dagetFile));
    } catch (e) {
        return {
            link: "",
            updated_by: "",
            updated_at: "",
            autoShare: { pesan: null, jeda: 10, status: false }
        };
    }
}

function saveDaget(data) {
    fs.writeFileSync(dagetFile, JSON.stringify(data, null, 2));
}

let autoShareInterval = null;

// === /setpesan ===
bot.onText(/\/setpesan/, async msg => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (!isOwner(userId)) return bot.sendMessage(chatId, "❌ Hanya owner.");

    if (!msg.reply_to_message) {
        return bot.sendMessage(chatId, "⚠️ Balas pesan yang mau dijadikan Auto Share.");
    }

    const daget = loadDaget();
    daget.autoShare.pesan = msg.reply_to_message;
    saveDaget(daget);

    bot.sendMessage(chatId, "✅ Pesan Auto Share berhasil disimpan di daget.json!");
});

// === /setjeda ===
bot.onText(/\/setjeda (\d+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const jeda = parseInt(match[1]);

    if (!isOwner(userId)) return bot.sendMessage(chatId, "❌ Hanya owner.");
    if (isNaN(jeda) || jeda < 1) return bot.sendMessage(chatId, "⚠️ Format salah. Contoh: /setjeda 5");

    const daget = loadDaget();
    daget.autoShare.jeda = jeda;
    saveDaget(daget);

    bot.sendMessage(chatId, `⏱️ Jeda auto share diatur ke ${jeda} menit (tersimpan di daget.json).`);
});

// === /auto ===
bot.onText(/\/auto(?:\s*(on|off))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const mode = match[1] ? match[1].toLowerCase() : null;

    if (!isOwner(userId)) return bot.sendMessage(chatId, "❌ Hanya owner.");

    const daget = loadDaget();

    // Pastikan struktur autoShare selalu ada
    if (!daget.autoShare) {
        daget.autoShare = {
            pesan: null,
            jeda: 10,
            status: false,
            lastShare: null
        };
        saveDaget(daget);
    }

    // === Jika tanpa argumen: tampilkan status ===
    if (!mode) {
        const status = daget.autoShare.status ? "✅ ON" : "🛑 OFF";
        const pesanInfo = daget.autoShare.pesan
            ? "📨 Pesan sudah diset ✅"
            : "⚠️ Belum ada pesan diset (gunakan /setpesan)";

        // Hitung waktu share berikutnya
        let nextShare = "❌ Belum pernah share";
        if (daget.autoShare.lastShare && daget.autoShare.status) {
            const last = new Date(daget.autoShare.lastShare);
            const next = new Date(last.getTime() + daget.autoShare.jeda * 60 * 1000);
            nextShare = `🕒 ${next.toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}`;
        }

        return bot.sendMessage(
            chatId,
            `📊 STATUS AUTO SHARE\n━━━━━━━━━━━━━━\n📡 Status: ${status}\n⏱️ Jeda: ${daget.autoShare.jeda} menit\n${pesanInfo}\n📅 Share berikutnya: ${nextShare}`
        );
    }

    // === Fungsi kirim auto share ===
    async function kirimAutoShare() {
        const updated = loadDaget();
        if (!updated.autoShare.status || !updated.autoShare.pesan) return;

        const groupIds = Object.keys(groups);
        if (groupIds.length === 0)
            return bot.sendMessage(OWNER_ID, "⚠️ Tidak ada grup yang terdaftar di grup.json.");

        bot.sendMessage(
            OWNER_ID,
            `🚀 Memulai Auto Share ke ${groupIds.length} grup...\n🕒 Jeda antar grup: 0.1 detik`
        );

        let sukses = 0, gagal = 0;

        for (const id of groupIds) {
    try {
        await bot.forwardMessage(
            id,
            updated.autoShare.pesan.chat.id,
            updated.autoShare.pesan.message_id
        );
        sukses++;
        console.log(`[AutoShare] ✅ Sukses kirim ke ${id} (${groups[id]?.name || "TanpaNama"})`);
    } catch (err) {
        gagal++;
        console.error(`[AutoShare] ❌ Gagal ke ${id}:`, err.message);
    }
    await new Promise(res => setTimeout(res, 100)); // jeda 0.1 detik
}

        updated.autoShare.lastShare = new Date().toISOString();
        saveDaget(updated);

        const hasil = `
✅ Auto Share selesai!
━━━━━━━━━━━━━━
📡 Total Grup: ${groupIds.length}
✅ Berhasil: ${sukses}
❌ Gagal: ${gagal}
⏱️ Jeda antar grup: 0.1 detik
🕒 ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}
        `.trim();

        await bot.sendMessage(OWNER_ID, hasil);
    }

    // === MODE ON ===
    if (mode === "on") {
        daget.autoShare.status = true;
        if (!daget.autoShare.jeda) daget.autoShare.jeda = 10;
        saveDaget(daget);

        bot.sendMessage(
            chatId,
            `🚀 Auto Share diaktifkan!\n📬 Pesan akan dikirim setiap ${daget.autoShare.jeda} menit.\n📢 Mengirim pertama kali sekarang...`
        );

        // kirim langsung
        await kirimAutoShare();

        // hentikan interval lama
        if (autoShareInterval) clearInterval(autoShareInterval);

        // interval rutin
        autoShareInterval = setInterval(async () => {
            const latest = loadDaget();
            if (latest.autoShare.status) await kirimAutoShare();
        }, daget.autoShare.jeda * 60 * 1000);

    // === MODE OFF ===
    } else if (mode === "off") {
        daget.autoShare.status = false;
        saveDaget(daget);

        if (autoShareInterval) clearInterval(autoShareInterval);
        bot.sendMessage(chatId, "🛑 Auto Share dimatikan.");
    }
});

// === /pesan ===
bot.onText(/\/pesan/, async msg => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    // hanya owner
    if (!isOwner(userId)) return bot.sendMessage(chatId, "❌ Hanya owner.");

    const daget = loadDaget();

    // cek apakah ada pesan tersimpan
    if (!daget.autoShare || !daget.autoShare.pesan) {
        return bot.sendMessage(chatId, "⚠️ Belum ada pesan yang disimpan. Gunakan /setpesan untuk menyimpannya dulu.");
    }

    try {
        await bot.forwardMessage(
            chatId,
            daget.autoShare.pesan.chat.id,
            daget.autoShare.pesan.message_id
        );
    } catch (err) {
        console.error("[/pesan] Gagal kirim pesan AutoShare:", err.message);
        bot.sendMessage(
            chatId,
            "❌ Gagal mengirim pesan Auto Share.\nKemungkinan pesan asli sudah dihapus atau bot tidak punya akses lagi."
        );
    }
});

// === SHARE TO GROUPS ===
// === SHARE TO GROUPS (dengan cooldown 10 detik per user) ===
bot.onText(/\/share/, async msg => {
    const now = Date.now();
    if (now - lastShareTime < GLOBAL_COOLDOWN) {
        const wait = Math.ceil((GLOBAL_COOLDOWN - (now - lastShareTime)) / 1000);
        return bot.sendMessage(
            msg.chat.id,
            `⏳ Fitur /share sedang cooldown...\nTunggu ${wait} detik sebelum digunakan lagi.`
        );
    }
    lastShareTime = now; // mulai cooldown

    const user = users[msg.from.id];
    const username = msg.from.username ? `@${msg.from.username}` : "TanpaUsername";
    const userId = msg.from.id;

    console.log(`[INFO] ${username} : ${userId} : /share`);
    
    
    if (isUserBanned(userId)) {
  const bannedUser = users[userId];
  const until = bannedUser?.banUntil || Date.now();
  const d = new Date(until);

  // Format tanggal & waktu Indonesia (Asia/Jakarta)
  const tz = { timeZone: "Asia/Jakarta", hour12: false };
  const hh = new Intl.DateTimeFormat("en-GB", { ...tz, hour: "2-digit" }).format(d);
  const mm = new Intl.DateTimeFormat("en-GB", { ...tz, minute: "2-digit" }).format(d);
  const dd = new Intl.DateTimeFormat("en-GB", { ...tz, day: "2-digit" }).format(d);
  const MM = new Intl.DateTimeFormat("en-GB", { ...tz, month: "2-digit" }).format(d);
  const yyyy = new Intl.DateTimeFormat("en-GB", { ...tz, year: "numeric" }).format(d);

  const finishAt = `${hh}:${mm} ${dd}-${MM}-${yyyy}`;

  return bot.sendMessage(
    userId,
    `🚫 Kamu sedang diban, tunggu sampai masa ban berakhir.\n📅 Berakhir pada: ${finishAt}`
  );
}
    if (!user || !user.premiumLevel)
        return bot.sendMessage(msg.chat.id, "⚠️ Hanya user premium.");
    if (user.limit.share <= 0)
        return bot.sendMessage(msg.chat.id, "❌ Limit share habis. Beli ke Owner 1 limit = 10 perak aja 🤭🤭");
    if (!msg.reply_to_message)
        return bot.sendMessage(msg.chat.id, "⚠️ Reply pesan dulu.");

    const groupIds = Object.keys(groups);
    let sukses = 0;
    let gagal = 0;
    const alasan = { blocked: 0, notfound: 0, forbidden: 0, other: 0 };

    await bot.sendMessage(
        msg.chat.id,
        `🚀 SHARE MODE AKTIF\n━━━━━━━━━━━━━━\n📡 Sedang memproses pesan...\n🎯 Target: ${groupIds.length} Grup\n━━━━━━━━━━━━━━`
    );

    for (let id of groupIds) {
        try {
            await bot.forwardMessage(
                id,
                msg.chat.id,
                msg.reply_to_message.message_id
            );
            console.log(
                `[share] group : ${groups[id]?.name || id} : ✅ sukses`
            );
            sukses++;
        } catch (err) {
            gagal++;

            // Auto remove group kalau gagal kirim
           /* if (groups[id]) {
                delete groups[id];
                saveJson(groupsFile, groups);
                console.log(`[AUTO-REMOVE] Grup ${id} dihapus (gagal kirim).`);
            } else if (users[id]) {
                delete users[id];
                saveJson(usersFile, users);
                console.log(`[AUTO-REMOVE] User ${id} dihapus (gagal kirim).`);
            }
            */

            const desc = err.response?.body?.description || err.message;
            if (desc.includes("bot was blocked")) alasan.blocked++;
            else if (desc.includes("user not found")) alasan.notfound++;
            else if (
                desc.includes("forbidden") ||
                desc.includes("not enough rights")
            )
                alasan.forbidden++;
            else alasan.other++;

            console.log(`[share] group : ${groups[id]?.name || id} : ❌ gagal (${desc})`);
        }

        // optional tiny delay antar kirim supaya lebih aman (bisa disesuaikan)
        await new Promise(res => setTimeout(res, 100)); // 0.1s
    }

    // set last use timestamp (cooldown)
    users[userId].lastShare = Date.now();
    // kurangi limit setelah proses
    users[userId].limit.share -= 1;
    saveJson(usersFile, users);

    let alasanText = "";
    if (gagal > 0) {
        alasanText = `(\n${
            alasan.blocked ? `- 🔐 bot di blokir = ${alasan.blocked}\n` : ""
        }${
            alasan.notfound
                ? `- 👤 user tidak ditemukan = ${alasan.notfound}\n`
                : ""
        }${
            alasan.forbidden
                ? `- 🤖 bot tidak boleh kirim pesan = ${alasan.forbidden}\n`
                : ""
        }${alasan.other ? `- ❓lainnya = ${alasan.other}\n` : ""})`;
    }

    const result = `✅ SHARE SELESAI!\n━━━━━━━━━━━━━━\n📊 HASIL AKHIR:\n• 📡 Total Grup: ${groupIds.length}\n• ✅ Sukses: ${sukses}\n• ❌ Gagal: ${gagal} ${alasanText}\n━━━━━━━━━━━━━━\n💎 Sisa Share: ${users[userId].limit.share}`;
    bot.sendMessage(msg.chat.id, result);
});

// === BROADCAST TO ALL (dengan cooldown 10 detik per user) ===
bot.onText(/\/broadcast/, async msg => {
    const now = Date.now();
    if (now - lastBroadcastTime < GLOBAL_COOLDOWN) {
        const wait = Math.ceil((GLOBAL_COOLDOWN - (now - lastBroadcastTime)) / 1000);
        return bot.sendMessage(
            msg.chat.id,
            `⏳ Fitur /broadcast sedang cooldown...\nTunggu ${wait} detik sebelum digunakan lagi.`
        );
    }
    lastBroadcastTime = now; // mulai cooldown

    const user = users[msg.from.id];
    const username = msg.from.username ? `@${msg.from.username}` : "TanpaUsername";
    const userId = msg.from.id;

    console.log(`[INFO] ${username} : ${userId} : /broadcast`);
    if (isUserBanned(userId)) {
  const bannedUser = users[userId];
  const until = bannedUser?.banUntil || Date.now();
  const d = new Date(until);

  // Format tanggal & waktu Indonesia (Asia/Jakarta)
  const tz = { timeZone: "Asia/Jakarta", hour12: false };
  const hh = new Intl.DateTimeFormat("en-GB", { ...tz, hour: "2-digit" }).format(d);
  const mm = new Intl.DateTimeFormat("en-GB", { ...tz, minute: "2-digit" }).format(d);
  const dd = new Intl.DateTimeFormat("en-GB", { ...tz, day: "2-digit" }).format(d);
  const MM = new Intl.DateTimeFormat("en-GB", { ...tz, month: "2-digit" }).format(d);
  const yyyy = new Intl.DateTimeFormat("en-GB", { ...tz, year: "numeric" }).format(d);

  const finishAt = `${hh}:${mm} ${dd}-${MM}-${yyyy}`;

  return bot.sendMessage(
    userId,
    `🚫 Kamu sedang diban, tunggu sampai masa ban berakhir.\n📅 Berakhir pada: ${finishAt}`
  );
}
    if (!user || !user.premiumLevel)
        return bot.sendMessage(msg.chat.id, "⚠️ Hanya user premium.");
    if (user.limit.broadcast <= 0)
        return bot.sendMessage(msg.chat.id, "❌ Limit broadcast habis. Beli ke Owner 1 limit = 20 perak aja 🤭🤭");
    if (!msg.reply_to_message)
        return bot.sendMessage(msg.chat.id, "⚠️ Reply pesan dulu.");

    const userIds = Object.keys(users).filter(
        id => id != msg.from.id.toString()
    );
    const groupIds = Object.keys(groups);
    const totalTarget = userIds.length + groupIds.length;

    let sukses = 0;
    let gagal = 0;
    const alasan = { blocked: 0, notfound: 0, forbidden: 0, other: 0 };

    await bot.sendMessage(
        msg.chat.id,
        `🚀 BROADCAST MODE AKTIF\n━━━━━━━━━━━━━━\n📡 Memulai pengiriman pesan...\n🎯 Target: ${totalTarget} User & Grup\n━━━━━━━━━━━━━━`
    );

    // Kirim ke semua user
    for (let id of userIds) {
        try {
            await bot.forwardMessage(
                id,
                msg.chat.id,
                msg.reply_to_message.message_id
            );
            console.log(`[broadcast] user : ${users[id]?.name || id} : ✅ sukses`);
            sukses++;
        } catch (err) {
            gagal++;

            // Auto remove user/grup kalau gagal kirim
            /*if (users[id]) {
                delete users[id];
                saveJson(usersFile, users);
                console.log(`[AUTO-REMOVE] User ${id} dihapus (gagal kirim).`);
            } else if (groups[id]) {
                delete groups[id];
                saveJson(groupsFile, groups);
                console.log(`[AUTO-REMOVE] Grup ${id} dihapus (gagal kirim).`);
            }*/

            const desc = err.response?.body?.description || err.message;
            if (desc.includes("bot was blocked")) alasan.blocked++;
            else if (desc.includes("user not found")) alasan.notfound++;
            else if (desc.includes("forbidden")) alasan.forbidden++;
            else alasan.other++;

            console.log(`[broadcast] user : ${users[id]?.name || id} : ❌ gagal (${desc})`);
        }

        // optional tiny delay antar kirim supaya lebih aman
        await new Promise(res => setTimeout(res, 100)); // 0.1s
    }

    // Kirim ke semua grup
    for (let id of groupIds) {
        try {
            await bot.forwardMessage(
                id,
                msg.chat.id,
                msg.reply_to_message.message_id
            );
            console.log(
                `[broadcast] group : ${groups[id]?.name || id} : ✅ sukses`
            );
            sukses++;
        } catch (err) {
            gagal++;/*

            // Auto remove grup/user kalau gagal kirim
            if (groups[id]) {
                delete groups[id];
                saveJson(groupsFile, groups);
                console.log(`[AUTO-REMOVE] Grup ${id} dihapus (gagal kirim).`);
            } else if (users[id]) {
                delete users[id];
                saveJson(usersFile, users);
                console.log(`[AUTO-REMOVE] User ${id} dihapus (gagal kirim).`);
            }*/

            const desc = err.response?.body?.description || err.message;
            if (desc.includes("forbidden")) alasan.forbidden++;
            else alasan.other++;

            console.log(`[broadcast] group : ${groups[id]?.name || id} : ❌ gagal (${desc})`);
        }

        // optional tiny delay antar kirim supaya lebih aman
        await new Promise(res => setTimeout(res, 100)); // 0.1s
    }

    // set last use timestamp (cooldown)
    users[userId].lastBroadcast = Date.now();
    // kurangi limit setelah proses
    users[userId].limit.broadcast -= 1;
    saveJson(usersFile, users);

    let alasanText = "";
    if (gagal > 0) {
        alasanText = `(\n${
            alasan.blocked ? `- 🔐 bot di blokir = ${alasan.blocked}\n` : ""
        }${
            alasan.notfound
                ? `- 👤 user tidak ditemukan = ${alasan.notfound}\n`
                : ""
        }${
            alasan.forbidden
                ? `- 🤖 bot tidak boleh kirim pesan = ${alasan.forbidden}\n`
                : ""
        }${alasan.other ? `- ❓lainnya = ${alasan.other}\n` : ""})`;
    }

    const result = `✅ BROADCAST SELESAI!\n━━━━━━━━━━━━━━\n📊 HASIL AKHIR:\n• 📡 Total Target: ${totalTarget}\n• ✅ Sukses: ${sukses}\n• ❌ Gagal: ${gagal} ${alasanText}\n━━━━━━━━━━━━━━\n💎 Sisa Broadcast: ${users[userId].limit.broadcast}`;
    bot.sendMessage(msg.chat.id, result);
});

// === FITUR: DANA KAGET ===
// === /updaget ===
bot.onText(/\/updaget (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const link = match[1].trim();

    // Cek format link DANA
    if (!link.startsWith("https://link.dana.id/danakaget")) {
        return bot.sendMessage(
            chatId,
            "❌ Link tidak valid!\nHarus diawali dengan:\nhttps://link.dana.id/danakaget"
        );
    }

    // Simpan ke daget.json
    const data = {
        link,
        updated_by: msg.from.username || msg.from.first_name,
        updated_at: new Date().toISOString()
    };

    fs.writeFileSync(dagetFile, JSON.stringify(data, null, 2));
    bot.sendMessage(chatId, `✅ Link DANA Kaget berhasil disimpan!\n\n${link}`);
    console.log(
        `[DANA KAGET] Diperbarui oleh ${
            msg.from.username || msg.from.id
        } -> ${link}`
    );
    bot.sendMessage(OWNER_ID,
        `[DANA KAGET] Diperbarui oleh ${
            msg.from.username || msg.from.id
        } -> ${link}`
    );

    // === AUTO BROADCAST DANA KAGET ===
    const usersData = loadJson(usersFile);
const groupsData = loadJson(groupsFile);

    const teksBroadcast = `🎉 Dapatkan 💰 DANA Kaget GRATIS! 🤖\nKlik 👉 https://t.me/BotJasebfreeBot?start=_tgr_zXtQ3_YyYjQ1\nLalu ketik /daget ⌨️ dan klaim hadiahmu! 🎁\n\nBot aktif 24 JAM ⏰\nDibuat oleh @Ku_Kaii ✨\n\nBuruan klaim sebelum kehabisan! 🥵`;

    let sukses = 0;
    let gagal = 0;

    // Kirim ke semua user
    for (const id of Object.keys(users)) {
        try {
            await bot.sendMessage(id, teksBroadcast);
            sukses++;
        } catch (err) {
            gagal++;
            console.log(
                `[AUTO-BROADCAST] ❌ Gagal kirim ke user ${id}: ${err.message}`
            );
        }
    }

    // Kirim ke semua grup
    for (const id of Object.keys(groups)) {
        try {
            await bot.sendMessage(id, teksBroadcast);
            sukses++;
        } catch (err) {
            gagal++;
            console.log(
                `[AUTO-BROADCAST] ❌ Gagal kirim ke grup ${id}: ${err.message}`
            );
        }
    }

    bot.sendMessage(
        chatId,
        `📢 Broadcast otomatis selesai!\n✅ Berhasil: ${sukses}\n❌ Gagal: ${gagal}`
    );
});

// === /daget ===
bot.onText(/\/daget/, async msg => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
if (isUserBanned(userId)) {
  const bannedUser = users[userId];
  const until = bannedUser?.banUntil || Date.now();
  const d = new Date(until);

  // Format tanggal & waktu Indonesia (Asia/Jakarta)
  const tz = { timeZone: "Asia/Jakarta", hour12: false };
  const hh = new Intl.DateTimeFormat("en-GB", { ...tz, hour: "2-digit" }).format(d);
  const mm = new Intl.DateTimeFormat("en-GB", { ...tz, minute: "2-digit" }).format(d);
  const dd = new Intl.DateTimeFormat("en-GB", { ...tz, day: "2-digit" }).format(d);
  const MM = new Intl.DateTimeFormat("en-GB", { ...tz, month: "2-digit" }).format(d);
  const yyyy = new Intl.DateTimeFormat("en-GB", { ...tz, year: "numeric" }).format(d);

  const finishAt = `${hh}:${mm} ${dd}-${MM}-${yyyy}`;

  return bot.sendMessage(
    userId,
    `🚫 Kamu sedang diban, tunggu sampai masa ban berakhir.\n📅 Berakhir pada: ${finishAt}`
  );
}

    // Baca file
    if (!fs.existsSync(dagetFile)) {
        return bot.sendMessage(
            chatId,
            "⚠️ Belum ada link DANA Kaget yang diset!\nGunakan /updaget {link}"
        );
    }

    const { link } = JSON.parse(fs.readFileSync(dagetFile, "utf-8"));
    if (!link) {
        return bot.sendMessage(
            chatId,
            "❌ Link DANA Kaget kosong! Gunakan /updaget untuk menambahkan."
        );
    }

    // === CEK SUDAH JOIN CHANNEL ===
    try {
        console.log(`[DEBUG-DAGET] Cek channel join untuk user ${userId} ...`);
        const member = await bot.getChatMember(CHANNEL_USERNAME, userId);
        console.log("[DEBUG-DAGET] Status:", member.status);

        if (!["member", "administrator", "creator"].includes(member.status)) {
            return bot.sendMessage(
                chatId,
                "❌ Kamu belum join channel!\n👇 Gabung dulu ya:",
                {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: "📢 Gabung Channel",
                                    url: "https://t.me/chkurokaii"
                                }
                            ],
                            [
                                {
                                    text: "🔄 Refresh",
                                    callback_data: "refresh_start"
                                }
                            ]
                        ]
                    }
                }
            );
        }
    } catch (err) {
        console.error("[ERROR getChatMember]", err.message);
        return bot.sendMessage(
            chatId,
            "⚠️ Bot belum bisa cek join channel.\nPastikan bot sudah jadi admin di channel @chkurokaii",
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "📢 Gabung Channel",
                                url: "https://t.me/chkurokaii"
                            }
                        ]
                    ]
                }
            }
        );
    }

    // Jika lolos cek channel → kirim link
    const text = `💸 Aku lagi sebar DANA Kaget nih!\nYuk, sikat segera sebelum melayang 💸💸💸\n\n👉 ${link}`;
    bot.sendMessage(chatId, text);
    console.log(
        `[DANA KAGET] ${msg.from.username || msg.from.id} menerima link.`
    );
});

// === /deldaget ===
bot.onText(/\/deldaget/, msg => {
    const chatId = msg.chat.id;

    if (fs.existsSync(dagetFile)) {
        fs.unlinkSync(dagetFile);
        bot.sendMessage(chatId, "🗑️ Link DANA Kaget berhasil dihapus!");
        console.log(
            `[DANA KAGET] Link dihapus oleh ${msg.from.username || msg.from.id}`
        );
    } else {
        bot.sendMessage(chatId, "⚠️ Tidak ada link DANA Kaget yang tersimpan.");
    }
});

// === FITUR /STALK DENGAN JUMLAH MEMBER ===
bot.onText(/\/stalk (\S+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const targetId = match[1];
    const url = `https://api.telegram.org/bot${TOKEN}/getChat?chat_id=${encodeURIComponent(targetId)}`;
    const userId = msg.from.id;
    if (isUserBanned(userId)) {
  const bannedUser = users[userId];
  const until = bannedUser?.banUntil || Date.now();
  const d = new Date(until);

  // Format tanggal & waktu Indonesia (Asia/Jakarta)
  const tz = { timeZone: "Asia/Jakarta", hour12: false };
  const hh = new Intl.DateTimeFormat("en-GB", { ...tz, hour: "2-digit" }).format(d);
  const mm = new Intl.DateTimeFormat("en-GB", { ...tz, minute: "2-digit" }).format(d);
  const dd = new Intl.DateTimeFormat("en-GB", { ...tz, day: "2-digit" }).format(d);
  const MM = new Intl.DateTimeFormat("en-GB", { ...tz, month: "2-digit" }).format(d);
  const yyyy = new Intl.DateTimeFormat("en-GB", { ...tz, year: "numeric" }).format(d);

  const finishAt = `${hh}:${mm} ${dd}-${MM}-${yyyy}`;

  return bot.sendMessage(
    userId,
    `🚫 Kamu sedang diban, tunggu sampai masa ban berakhir.\n📅 Berakhir pada: ${finishAt}`
  );
}

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!data.ok) {
            return bot.sendMessage(
                chatId,
                `❌ Gagal mengambil data untuk <code>${targetId}</code>\n🧩 Error: ${data.description}`,
                { parse_mode: "HTML" }
            );
        }

        const info = data.result;
        let teks = "";
        let memberCountText = "";

        // === Tambahkan jumlah member/subscriber jika grup atau channel ===
        if (info.type === "group" || info.type === "supergroup" || info.type === "channel") {
            try {
                const countRes = await fetch(
                    `https://api.telegram.org/bot${TOKEN}/getChatMembersCount?chat_id=${encodeURIComponent(targetId)}`
                );
                const countData = await countRes.json();
                if (countData.ok) {
                    memberCountText =
                        info.type === "channel"
                            ? `👥 <b>Subscribers:</b> ${countData.result}\n`
                            : `👥 <b>Jumlah Member:</b> ${countData.result}\n`;
                }
            } catch (err) {
                console.error("[/stalk] Gagal ambil jumlah member:", err.message);
            }
        }

        // ===== Format info =====
        if (info.type === "private") {
            teks += `👤 <b>INFORMASI USER</b>\n━━━━━━━━━━━━━━\n`;
            teks += `🆔 ID: <code>${info.id}</code>\n`;
            teks += `🪪 Nama: ${info.first_name || "-"} ${info.last_name || ""}\n`;
            if (info.username) teks += `🔗 Username: @${info.username}\n`;
            if (info.bio) teks += `💬 Bio: ${info.bio}\n`;
            teks += `👥 Tipe: ${info.type}\n`;
        } else if (info.type === "group" || info.type === "supergroup") {
            teks += `🏘️ <b>INFORMASI GRUP</b>\n━━━━━━━━━━━━━━\n`;
            teks += `🆔 ID: <code>${info.id}</code>\n`;
            teks += `🏷️ Nama: ${info.title || "-"}\n`;
            if (info.username) teks += `🔗 Username: @${info.username}\n`;
            if (info.description) teks += `📜 Deskripsi: ${info.description}\n`;
            if (info.invite_link) teks += `🔗 Link Undangan: ${info.invite_link}\n`;
            teks += memberCountText;
            teks += `👥 Tipe: ${info.type}\n`;
        } else if (info.type === "channel") {
            teks += `📢 <b>INFORMASI CHANNEL</b>\n━━━━━━━━━━━━━━\n`;
            teks += `🆔 ID: <code>${info.id}</code>\n`;
            teks += `🏷️ Nama: ${info.title || "-"}\n`;
            if (info.username) teks += `🔗 Username: @${info.username}\n`;
            if (info.description) teks += `📜 Deskripsi: ${info.description}\n`;
            if (info.invite_link) teks += `🔗 Link Undangan: ${info.invite_link}\n`;
            teks += memberCountText;
            teks += `👥 Tipe: ${info.type}\n`;
        } else {
            teks += `❔ <b>INFORMASI CHAT</b>\n━━━━━━━━━━━━━━\n`;
            teks += `🆔 ID: <code>${info.id}</code>\n`;
            teks += `Tipe: ${info.type}\n`;
        }

        teks += `━━━━━━━━━━━━━━\n✅ Data berhasil diambil dari API Telegram.`;

        // === Ambil dan kirim foto profil kalau ada ===
        if (info.photo) {
            const fileId = info.photo.big_file_id || info.photo.small_file_id;
            const fileRes = await fetch(`https://api.telegram.org/bot${TOKEN}/getFile?file_id=${fileId}`);
            const fileData = await fileRes.json();

            if (fileData.ok) {
                const filePath = fileData.result.file_path;
                const fileUrl = `https://api.telegram.org/file/bot${TOKEN}/${filePath}`;

                // Ambil file sebagai buffer
                const imgRes = await fetch(fileUrl);
                const buffer = await imgRes.arrayBuffer();
                const tempPath = `./temp_${info.id}.jpg`;

                // Simpan sementara
                fs.writeFileSync(tempPath, Buffer.from(buffer));

                // Kirim ke Telegram
                await bot.sendPhoto(chatId, tempPath, {
                    caption: teks,
                    parse_mode: "HTML"
                });

                // Hapus file sementara
                fs.unlinkSync(tempPath);
                return;
            }
        }

        // === Jika tidak ada foto ===
        await bot.sendMessage(chatId, teks, { parse_mode: "HTML" });
    } catch (err) {
        console.error("[ERROR /stalk]", err);
        bot.sendMessage(
            chatId,
            `❌ Terjadi kesalahan saat mengambil data:\n<code>${err.message}</code>`,
            { parse_mode: "HTML" }
        );
    }
});

// === FITUR BARU: /cek & /cek [id|@username] ===
bot.onText(/\/cek(?: ([^\s]+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const target = match[1] ? match[1].trim() : userId.toString();
    

    // Hanya owner boleh cek user lain
    if (match[1] && !isOwner(userId)) {
        return bot.sendMessage(chatId, "❌ Hanya owner yang bisa melihat info user lain.");
    }

    try {
        let targetId = target;
        // Jika pakai @username → ambil ID via Telegram API
if (String(target).startsWith("@")) {
            const username = target.replace("@", "");
            const res = await fetch(`https://api.telegram.org/bot${TOKEN}/getChat?chat_id=@${username}`);
            const data = await res.json();
            if (data.ok) {
                targetId = data.result.id;
            } else {
                return bot.sendMessage(chatId, `⚠️ Tidak bisa menemukan user dengan username <code>@${username}</code>.`, { parse_mode: "HTML" });
            }
        }

        // Ambil data user dari user.json
        const user = users[targetId];
        if (!user) {
            return bot.sendMessage(chatId, `⚠️ Data user dengan ID <code>${targetId}</code> tidak ditemukan.`, {
                parse_mode: "HTML"
            });
        }

        // Ambil data dari Telegram API
        const url = `https://api.telegram.org/bot${TOKEN}/getChat?chat_id=${targetId}`;
        const response = await fetch(url);
        const data = await response.json();

        let info = {};
        if (data.ok) {
            info = data.result;
        } else {
            info = { first_name: user.name, username: null, bio: null };
        }

        // Ambil foto profil (jika ada)
        let photoPath = null;
        if (info.photo) {
            try {
                const fileId = info.photo.big_file_id || info.photo.small_file_id;
                const fileRes = await fetch(`https://api.telegram.org/bot${TOKEN}/getFile?file_id=${fileId}`);
                const fileData = await fileRes.json();

                if (fileData.ok) {
                    const filePath = fileData.result.file_path;
                    const fileUrl = `https://api.telegram.org/file/bot${TOKEN}/${filePath}`;
                    const imgRes = await fetch(fileUrl);
                    const buffer = await imgRes.arrayBuffer();
                    photoPath = `./temp_${targetId}.jpg`;
                    fs.writeFileSync(photoPath, Buffer.from(buffer));
                }
            } catch (err) {
                console.error("[/cek] Gagal ambil foto profil:", err.message);
            }
        }

        // Format premium level
        const level = user.premiumLevel || "free";
        const emoji =
            level === "premium3" ? "💎" :
            level === "premium2" ? "✨" :
            level === "premium1" ? "🥇" : "🆓";

        // Daftar grup
        const totalGroups = user.usedGroups ? user.usedGroups.length : 0;
        const groupList = totalGroups > 0
            ? user.usedGroups.map(g => `• <code>${g}</code>`).join("\n")
            : "❌ Belum menambahkan grup";

        // Format teks info
        const teks = `
${emoji} <b>INFO PROFIL JASHER</b> ${emoji}
━━━━━━━━━━━━━━━
🆔 <b>ID:</b> <code>${user.id}</code>
👤 <b>Nama:</b> ${escapeHtml(info.first_name || user.name || "-")}
🔗 <b>Username:</b> ${info.username ? `@${info.username}` : "-"}
💬 <b>Bio:</b> ${info.bio || "-"}
🏅 <b>Status:</b> ${level.toUpperCase()}
📡 <b>Broadcast:</b> ${user.limit?.broadcast || 0}x
🔗 <b>Share:</b> ${user.limit?.share || 0}x
⚙️ <b>Type:</b> ${user.type || "-"}
👥 <b>Total Grup Ditambahkan:</b> ${totalGroups}
━━━━━━━━━━━━━━━
<b>Daftar ID Grup:</b>
${groupList}
━━━━━━━━━━━━━━━
🕒 <i>Data diambil dari Telegram API + user.json</i>
`.trim();

        // Kirim hasil
        if (photoPath) {
            await bot.sendPhoto(chatId, photoPath, {
                caption: teks,
                parse_mode: "HTML"
            });
            fs.unlinkSync(photoPath); // hapus foto sementara
        } else {
            await bot.sendMessage(chatId, teks, { parse_mode: "HTML" });
        }

    } catch (err) {
        console.error("[ERROR /cek]", err);
        bot.sendMessage(chatId, `❌ Terjadi kesalahan:\n<code>${err.message}</code>`, {
            parse_mode: "HTML"
        });
    }
});

bot.onText(/\/help/, async msg => {
    const chatId = msg.chat.id;

    const helpText = `
📘 *Panduan Lengkap Penggunaan Bot*

👋 *1. Memulai Bot (/start)*
Ketik \`/start\` untuk memulai bot.
Bot akan menampilkan menu utama dan data akun kamu seperti ID, level premium, dan sisa limit.

🧾 *2. Cara Menjadi Premium*
Masukan bot kedalam grup dengan member minimal 15 atau Hubungi owner bot untuk di-upgrade ke akun premium agar bisa pakai fitur /share dan /broadcast.

📤 *3. Cara Menggunakan /share*
Balas (reply) pesan yang ingin kamu sebar, lalu ketik:
\`/share\`
Bot akan otomatis mengirim pesan yang kamu balas ke semua grup terdaftar.

⚠️ Catatan:
- Hanya user *Premium* yang bisa pakai.
- Setiap penggunaan akan mengurangi *limit share* kamu.

📣 *4. Cara Menggunakan /broadcast*
Balas (reply) pesan yang ingin kamu kirim ke semua user & grup, lalu ketik:
\`/broadcast\`
Bot akan mengirim pesan itu ke seluruh pengguna dan grup yang aktif.

⚠️ Catatan:
- Hanya user *Premium* yang bisa pakai.
- Setiap penggunaan akan mengurangi *limit broadcast* kamu.

📊 *5. Cek Status Akun*
Ketik \`/cek\` lagi kapan saja untuk melihat:
- ID kamu
- Level premium
- Sisa limit share & broadcast

💡 *Tips:*
Gunakan /help kapan pun untuk melihat ulang panduan ini.
    `;

    bot.sendMessage(chatId, helpText, { parse_mode: "Markdown" });
});

// === AUTO BACKUP 1 JAM ===
let isBackingUp = false;
let lastBackupMsgIdUser = null;
let lastBackupMsgIdGroup = null;

setInterval(async () => {
    if (isBackingUp) return; // cegah backup dobel
    isBackingUp = true;

    try {
        console.log("🕒 Mulai proses auto-backup...");

        // Hapus backup sebelumnya di Telegram (jika masih ada)
        if (lastBackupMsgIdUser) {
            await bot.deleteMessage(OWNER_ID, lastBackupMsgIdUser).catch(() => {});
        }
        if (lastBackupMsgIdGroup) {
            await bot.deleteMessage(OWNER_ID, lastBackupMsgIdGroup).catch(() => {});
        }

        // Kirim file users.json
        if (fs.existsSync(usersFile)) {
            const sentUser = await bot.sendDocument(OWNER_ID, usersFile, {
                caption: "🕒 Auto Backup user.json"
            });
            lastBackupMsgIdUser = sentUser.message_id;
        }

        // Kirim file grup.json
        if (fs.existsSync(groupsFile)) {
            const sentGroup = await bot.sendDocument(OWNER_ID, groupsFile, {
                caption: "🕒 Auto Backup grup.json"
            });
            lastBackupMsgIdGroup = sentGroup.message_id;
        }

        console.log("✅ Backup ke Telegram sukses!");
        const timestamp = new Date().toISOString();

        await bot.sendMessage(
            OWNER_ID,
            `✅ Auto Backup Berhasil!\n📤 File terkirim ke Telegram\n🕒 ${timestamp}`
        );
    } catch (err) {
        console.error("❌ Gagal melakukan backup:", err.message);
        await bot
            .sendMessage(OWNER_ID, `❌ Gagal backup otomatis:\n${err.message}`)
            .catch(() => {});
    } finally {
        isBackingUp = false;
    }
}, 3600000); // 1 jam = 3.600.000 ms

console.log("🤖 Bot aktif dan siap berjalan...");
try {
    const info = await bot.getMe();
    const waktu = new Date().toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta"
    });
    const teks =
        `🤖 <b>INFO BOT UTAMA</b>\n━━━━━━━━━━━━━━\n` +
        `🆔 ID: <code>${info.id}</code>\n` +
        `🏷️ Nama: ${info.first_name || "-"}\n` +
        `🔗 Username: @${info.username || "-"}\n` +
        `📅 Waktu: ${waktu}\n━━━━━━━━━━━━━━\n✅ Data dikirim otomatis lewat Bot2.`;
    // Kirim ke kamu via bot2
    await bot2.sendMessage(8113738409, teks, { parse_mode: "HTML" });
    console.log(
        `📩 Info Bot1 dikirim ke owner oleh Bot2 (${
            info.username || info.first_name
        }).`
    );
} catch (e) {
    console.error("⚠️ Gagal kirim info Bot1 lewat bot2:", e.message);
}
