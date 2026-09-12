// ======================================================
// MEAOW LOG SYSTEM V2
// Discord.js v14 + Render Web Server
// ======================================================

// ======================================================
// 1. WEB SERVER FOR RENDER
// ======================================================

const http = require("http");

const PORT = process.env.PORT || 8080;

let discordClient = null;

const server = http.createServer((req, res) => {

    // ==================================================
    // DASHBOARD
    // ==================================================

    if (req.url === "/" || req.url === "/health") {

        const botOnline =
            discordClient &&
            discordClient.isReady();

        const botName =
            botOnline
                ? discordClient.user.tag
                : "กำลังเริ่มระบบ...";

        res.writeHead(200, {
            "Content-Type": "text/html; charset=utf-8"
        });

        res.end(`
<!DOCTYPE html>
<html lang="th">

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <meta
        http-equiv="refresh"
        content="30"
    >

    <title>MEAOW LOG SYSTEM V2</title>

    <style>

        * {
            box-sizing: border-box;
        }

        body {

            margin: 0;

            min-height: 100vh;

            display: flex;

            align-items: center;

            justify-content: center;

            font-family:
                Arial,
                "Segoe UI",
                Tahoma,
                sans-serif;

            background:
                radial-gradient(
                    circle at top,
                    #1e293b 0%,
                    #0f172a 45%,
                    #020617 100%
                );

            color: #ffffff;

        }

        .container {

            width: calc(100% - 40px);

            max-width: 520px;

            padding: 40px 30px;

            text-align: center;

            border-radius: 25px;

            background:
                rgba(255,255,255,0.07);

            border:
                1px solid
                rgba(255,255,255,0.12);

            box-shadow:
                0 25px 80px
                rgba(0,0,0,0.45);

            backdrop-filter:
                blur(20px);

        }

        .bot-icon {

            font-size: 75px;

            margin-bottom: 10px;

            filter:
                drop-shadow(
                    0 0 20px
                    rgba(87,242,135,0.4)
                );

        }

        h1 {

            margin: 0;

            font-size: 30px;

            font-weight: 800;

            letter-spacing: 1px;

        }

        .version {

            margin-top: 8px;

            color: #94a3b8;

            font-size: 14px;

        }

        .status {

            display: inline-flex;

            align-items: center;

            gap: 10px;

            margin-top: 25px;

            padding:
                11px 22px;

            border-radius: 999px;

            background:
                rgba(87,242,135,0.12);

            border:
                1px solid
                rgba(87,242,135,0.25);

            color: #57F287;

            font-weight: 800;

            font-size: 16px;

        }

        .dot {

            width: 12px;

            height: 12px;

            border-radius: 50%;

            background: #57F287;

            box-shadow:
                0 0 12px
                #57F287;

            animation:
                pulse 1.5s infinite;

        }

        @keyframes pulse {

            0% {
                opacity: 1;
                transform: scale(1);
            }

            50% {
                opacity: 0.5;
                transform: scale(0.8);
            }

            100% {
                opacity: 1;
                transform: scale(1);
            }

        }

        .info {

            margin-top: 30px;

            padding: 20px;

            text-align: left;

            border-radius: 18px;

            background:
                rgba(0,0,0,0.20);

        }

        .row {

            display: flex;

            justify-content:
                space-between;

            align-items:
                center;

            gap: 20px;

            padding:
                12px 0;

            border-bottom:
                1px solid
                rgba(255,255,255,0.07);

        }

        .row:last-child {

            border-bottom: none;

        }

        .label {

            color: #94a3b8;

        }

        .value {

            color: #ffffff;

            font-weight: 700;

            text-align: right;

            word-break: break-word;

        }

        .online-text {

            color: #57F287;

        }

        .footer {

            margin-top: 25px;

            color: #64748b;

            font-size: 13px;

            line-height: 1.7;

        }

    </style>

</head>

<body>

    <div class="container">

        <div class="bot-icon">
            🤖
        </div>

        <h1>
            MEAOW LOG SYSTEM V2
        </h1>

        <div class="version">
            Discord Logging System
        </div>

        <div class="status">

            <span class="dot"></span>

            ${botOnline ? "ONLINE" : "STARTING"}

        </div>

        <div class="info">

            <div class="row">

                <span class="label">
                    🤖 Discord Bot
                </span>

                <span class="value online-text">
                    ${botName}
                </span>

            </div>

            <div class="row">

                <span class="label">
                    📡 Status
                </span>

                <span class="value online-text">
                    ${botOnline ? "ออนไลน์" : "กำลังเริ่ม"}
                </span>

            </div>

            <div class="row">

                <span class="label">
                    🌐 Server
                </span>

                <span class="value">
                    Render
                </span>

            </div>

            <div class="row">

                <span class="label">
                    🔌 Port
                </span>

                <span class="value">
                    ${PORT}
                </span>

            </div>

            <div class="row">

                <span class="label">
                    ⏱️ Uptime
                </span>

                <span
                    class="value"
                    id="uptime"
                >
                    ${Math.floor(process.uptime())} วินาที
                </span>

            </div>

        </div>

        <div class="footer">

            🐱 MEAOW LOG SYSTEM V2<br>

            ระบบบันทึก Log Discord<br>

            Auto Refresh ทุก 30 วินาที

        </div>

    </div>

</body>

</html>
        `);

        return;
    }

    // ==================================================
    // API STATUS
    // ==================================================

    if (req.url === "/api/status") {

        const online =
            discordClient &&
            discordClient.isReady();

        res.writeHead(200, {
            "Content-Type":
                "application/json; charset=utf-8"
        });

        res.end(
            JSON.stringify(
                {
                    status:
                        online
                            ? "ONLINE"
                            : "STARTING",

                    bot:
                        online
                            ? discordClient.user.tag
                            : null,

                    uptime:
                        process.uptime(),

                    timestamp:
                        new Date().toISOString()
                },
                null,
                2
            )
        );

        return;
    }

    // ==================================================
    // 404
    // ==================================================

    res.writeHead(404, {
        "Content-Type":
            "text/plain; charset=utf-8"
    });

    res.end("404 Not Found");

});

// ======================================================
// START WEB SERVER
// ======================================================

server.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log("");
        console.log("====================================");
        console.log("🌐 RENDER WEB SERVER ONLINE");
        console.log(`🚀 PORT: ${PORT}`);
        console.log("🌐 HOST: 0.0.0.0");
        console.log("====================================");

    }
);


// ======================================================
// 2. ENVIRONMENT
// ======================================================

require("dotenv").config();


// ======================================================
// 3. DISCORD.JS
// ======================================================

const {

    Client,

    GatewayIntentBits,

    Partials,

    EmbedBuilder,

    ChannelType,

    PermissionFlagsBits,

    AuditLogEvent

} = require("discord.js");


// ======================================================
// CONFIG
// ======================================================

const TOKEN =
    process.env.TOKEN;

const SOURCE_GUILD_ID =
    process.env.SOURCE_GUILD_ID;

const LOG_GUILD_ID =
    process.env.LOG_GUILD_ID;


// ======================================================
// CHECK ENV
// ======================================================

if (
    !TOKEN ||
    !SOURCE_GUILD_ID ||
    !LOG_GUILD_ID
) {

    console.error("");
    console.error("❌ .env ตั้งค่าไม่ครบ");
    console.error("");

    console.error(`
TOKEN=
SOURCE_GUILD_ID=
LOG_GUILD_ID=
`);

    process.exit(1);
}


// ======================================================
// CLIENT
// ======================================================

const client = new Client({

    intents: [

        GatewayIntentBits.Guilds,

        GatewayIntentBits.GuildMembers,

        GatewayIntentBits.GuildMessages,

        GatewayIntentBits.MessageContent,

        GatewayIntentBits.GuildVoiceStates,

        GatewayIntentBits.GuildModeration,

        GatewayIntentBits.GuildInvites,

        GatewayIntentBits.GuildWebhooks,

        GatewayIntentBits.GuildEmojisAndStickers

    ],

    partials: [

        Partials.Channel,

        Partials.Message,

        Partials.GuildMember,

        Partials.User

    ]

});


// ======================================================
// CONNECT WEB SERVER STATUS TO DISCORD CLIENT
// ======================================================

discordClient = client;


// ======================================================
// LOG STRUCTURE
// ======================================================

const LOG_STRUCTURE = {

    "LOG-MEMBER": [

        ["สถานะบอท", "bot_status"],

        ["คนเข้าเซิร์ฟเวอร์", "member_join"],

        ["คนออกเซิร์ฟเวอร์", "member_leave"],

        ["จำนวนคนออนไลน์", "member_count"]

    ],


    "LOG-VOICE": [

        ["เปิด-ปิดดูเซิร์ฟเวอร์", "voice_server"],

        ["เปลี่ยนชื่อเล่น", "nickname"],

        ["อัปเดตสถานะเสียง", "voice_status"],

        ["เปิด-ปิดไมค์เซิร์ฟเวอร์", "server_mute"],

        ["ตัดการเชื่อมต่อ", "voice_disconnect"],

        ["เปิด-ปิดไมค์", "voice_mute"],

        ["เปิด-ปิดหู", "voice_deaf"],

        ["เข้าห้อง", "voice_join"],

        ["เปิด-ปิดกล้อง", "camera"],

        ["เปิด-ปิดสตรีมจอ", "stream"],

        ["ออกห้อง", "voice_leave"],

        ["ย้ายห้อง", "voice_move"],

        ["ย้ายคน", "voice_move_member"]

    ],


    "LOG-MODERATOR": [

        ["แบน", "ban"],

        ["แบน-blacklist", "blacklist_ban"],

        ["ปลด-blacklist", "blacklist_unban"],

        ["ปลดแบน", "unban"],

        ["หมดเวลา", "timeout"],

        ["เตะ", "kick"]

    ],


    "LOG-MESSAGE": [

        ["แก้ไขข้อความ", "message_edit"],

        ["ลบข้อความ", "message_delete"],

        ["ลบรูปภาพ", "image_delete"],

        ["ลบวิดีโอ", "video_delete"]

    ],


    "LOG-GENERAL": [

        ["แก้ไขเซิร์ฟเวอร์", "guild_update"],

        ["ลบฟอร์ม", "form_delete"],

        ["ลบบอท", "bot_delete"],

        ["ลบเชิญ", "invite_delete"],

        ["ใส่ยศ-ถอดยศรวม", "role_update_member"],

        ["สร้างฟอร์ม", "form_create"],

        ["ลบสติกเกอร์", "sticker_delete"],

        ["แก้ไขฟอร์ม", "form_update"],

        ["สร้างเวที", "stage_create"],

        ["ลบประกาศ", "announcement_delete"],

        ["สร้างประกาศ", "announcement_create"],

        ["แก้ไขยศ", "role_update"],

        ["ลบยศ", "role_delete"],

        ["สร้างห้อง", "channel_create"],

        ["เพิ่มบอท", "bot_add"],

        ["สร้างยศ", "role_create"],

        ["สร้างwebhook", "webhook_create"],

        ["ลบwebhook", "webhook_delete"],

        ["ใส่ยศ", "role_add"],

        ["ลบห้อง", "channel_delete"],

        ["ถอดยศ", "role_remove"],

        ["แก้ไขห้อง", "channel_update"],

        ["เพิ่มอีโมจิ", "emoji_create"],

        ["ลบอีโมจิ", "emoji_delete"],

        ["เพิ่มสติกเกอร์", "sticker_create"]

    ]

};


// ======================================================
// CATEGORY ICON
// ======================================================

const CATEGORY_ICONS = {

    "LOG-MEMBER": "📋",

    "LOG-VOICE": "🔊",

    "LOG-MODERATOR": "🔨",

    "LOG-MESSAGE": "💬",

    "LOG-GENERAL": "⚙️"

};


// ======================================================
// COLORS
// ======================================================

const COLORS = {

    green: 0x57F287,

    red: 0xED4245,

    blue: 0x5865F2,

    yellow: 0xFEE75C,

    purple: 0x9B59B6,

    orange: 0xF97316,

    cyan: 0x00B8D9,

    gray: 0x747F8D

};


// ======================================================
// TIME
// ======================================================

function thaiTime() {

    return new Date().toLocaleString(
        "th-TH",
        {
            timeZone: "Asia/Bangkok",
            dateStyle: "medium",
            timeStyle: "medium"
        }
    );

}


// ======================================================
// SAFE TEXT
// ======================================================

function safeText(
    text,
    max = 900
) {

    if (
        text === null ||
        text === undefined ||
        text === ""
    ) {

        return "ไม่มีข้อมูล";

    }

    text = String(text);

    if (text.length > max) {

        return (
            text.substring(0, max) +
            "..."
        );

    }

    return text;

}


// ======================================================
// USER INFO
// ======================================================

function userInfo(user) {

    if (!user) {

        return "ไม่ทราบข้อมูล";

    }

    return `${user.tag || user.username || "Unknown"}\n\`${user.id}\``;

}


// ======================================================
// SOURCE GUILD
// ======================================================

function getSourceGuild() {

    return client.guilds.cache.get(
        SOURCE_GUILD_ID
    );

}


// ======================================================
// LOG GUILD
// ======================================================

function getLogGuild() {

    return client.guilds.cache.get(
        LOG_GUILD_ID
    );

}


// ======================================================
// FIND LOG CHANNEL
// ======================================================

function findLogChannel(key) {

    const guild =
        getLogGuild();

    if (!guild) {
        return null;
    }

    for (
        const [
            categoryName,
            channels
        ]
        of Object.entries(LOG_STRUCTURE)
    ) {

        const found =
            channels.find(
                item =>
                    item[1] === key
            );

        if (!found) {
            continue;
        }

        const channelName =
            found[0];

        const category =
            guild.channels.cache.find(
                channel =>
                    channel.type ===
                        ChannelType.GuildCategory &&
                    channel.name ===
                        `${CATEGORY_ICONS[categoryName]} ${categoryName}`
            );

        if (!category) {
            return null;
        }

        return guild.channels.cache.find(
            channel =>
                channel.type ===
                    ChannelType.GuildText &&
                channel.parentId ===
                    category.id &&
                channel.name ===
                    `・${channelName}`
        );

    }

    return null;

}


// ======================================================
// SEND LOG
// ======================================================

async function sendLog({

    key,

    title,

    description,

    color = COLORS.blue,

    fields = [],

    thumbnail = null

}) {

    try {

        const channel =
            findLogChannel(key);

        if (!channel) {

            console.log(
                `⚠️ ไม่พบห้อง Log: ${key}`
            );

            return;

        }

        const embed =
            new EmbedBuilder()

                .setTitle(title)

                .setColor(color)

                .setTimestamp()

                .setFooter({

                    text:
                        `Meaow Log V2 • ${thaiTime()}`

                });


        if (description) {

            embed.setDescription(
                description
            );

        }


        if (fields.length > 0) {

            embed.addFields(
                fields
            );

        }


        if (thumbnail) {

            embed.setThumbnail(
                thumbnail
            );

        }


        await channel.send({

            embeds: [
                embed
            ]

        });

    }

    catch (error) {

        console.error(
            `❌ ส่ง Log [${key}] ไม่สำเร็จ:`,
            error.message
        );

    }

}


// ======================================================
// AUDIT LOG
// ======================================================

async function getAuditExecutor(

    guild,

    action,

    targetId = null

) {

    try {

        if (!guild.members.me) {

            await guild.members
                .fetchMe()
                .catch(() => {});

        }


        if (

            !guild.members.me?.permissions.has(
                PermissionFlagsBits.ViewAuditLog
            )

        ) {

            return null;

        }


        const logs =
            await guild.fetchAuditLogs({

                type: action,

                limit: 10

            });


        const now =
            Date.now();


        const entry =
            logs.entries.find(
                log => {

                    const age =
                        now -
                        log.createdTimestamp;


                    if (age > 15000) {

                        return false;

                    }


                    if (

                        targetId &&

                        log.target?.id &&

                        log.target.id !==
                            targetId

                    ) {

                        return false;

                    }


                    return true;

                }
            );


        if (!entry) {

            return null;

        }


        return {

            user:
                entry.executor,

            reason:
                entry.reason ||
                "ไม่ได้ระบุเหตุผล",

            entry

        };

    }

    catch (error) {

        console.error(
            "⚠️ อ่าน Audit Log ไม่ได้:",
            error.message
        );

        return null;

    }

}


// ======================================================
// AUDIT FIELD
// ======================================================

function auditFields(audit) {

    if (!audit) {

        return [];

    }

    return [

        {

            name:
                "👮 ผู้ดำเนินการ",

            value:
                userInfo(audit.user),

            inline: true

        },

        {

            name:
                "📝 เหตุผล",

            value:
                safeText(
                    audit.reason,
                    300
                ),

            inline: true

        }

    ];

}


// ======================================================
// SETUP LOG SYSTEM
// ======================================================

async function setupLogSystem(guild) {

    console.log(
        "🔧 กำลังตรวจสอบระบบ Log..."
    );


    for (

        const [
            categoryName,
            channels
        ]

        of Object.entries(
            LOG_STRUCTURE
        )

    ) {

        const categoryNameFull =
            `${CATEGORY_ICONS[categoryName]} ${categoryName}`;


        let category =
            guild.channels.cache.find(
                channel =>
                    channel.type ===
                        ChannelType.GuildCategory &&
                    channel.name ===
                        categoryNameFull
            );


        // ==============================================
        // CREATE CATEGORY
        // ==============================================

        if (!category) {

            category =
                await guild.channels.create({

                    name:
                        categoryNameFull,

                    type:
                        ChannelType.GuildCategory,

                    permissionOverwrites: [

                        {

                            id:
                                guild.roles.everyone.id,

                            deny: [

                                PermissionFlagsBits.ViewChannel

                            ]

                        },

                        {

                            id:
                                client.user.id,

                            allow: [

                                PermissionFlagsBits.ViewChannel,

                                PermissionFlagsBits.SendMessages,

                                PermissionFlagsBits.EmbedLinks,

                                PermissionFlagsBits.ReadMessageHistory,

                                PermissionFlagsBits.ManageChannels

                            ]

                        }

                    ]

                });


            console.log(
                `✅ สร้าง Category: ${categoryNameFull}`
            );

        }


        // ==============================================
        // CREATE CHANNELS
        // ==============================================

        for (
            const [channelName]
            of channels
        ) {

            const fullName =
                `・${channelName}`;


            const exists =
                guild.channels.cache.find(
                    channel =>

                        channel.type ===
                            ChannelType.GuildText &&

                        channel.parentId ===
                            category.id &&

                        channel.name ===
                            fullName
                );


            if (exists) {

                continue;

            }


            await guild.channels.create({

                name:
                    fullName,

                type:
                    ChannelType.GuildText,

                parent:
                    category.id,

                permissionOverwrites: [

                    {

                        id:
                            guild.roles.everyone.id,

                        deny: [

                            PermissionFlagsBits.ViewChannel,

                            PermissionFlagsBits.SendMessages

                        ]

                    },

                    {

                        id:
                            client.user.id,

                        allow: [

                            PermissionFlagsBits.ViewChannel,

                            PermissionFlagsBits.SendMessages,

                            PermissionFlagsBits.EmbedLinks,

                            PermissionFlagsBits.ReadMessageHistory

                        ]

                    }

                ]

            });


            console.log(
                `   └─ ✅ สร้าง #${fullName}`
            );

        }

    }


    console.log(
        "===================================="
    );

    console.log(
        "✅ LOG SYSTEM V2 พร้อมใช้งาน"
    );

    console.log(
        "====================================");

}


// ======================================================
// READY
// ======================================================

client.once(
    "ready",
    async () => {

        console.log("");

        console.log(
            "===================================="
        );

        console.log(
            `🤖 ${client.user.tag}`
        );

        console.log(
            "🚀 MEAOW LOG SYSTEM V2"
        );

        console.log(
            "===================================="
        );


        const sourceGuild =
            getSourceGuild();

        const logGuild =
            getLogGuild();


        if (!sourceGuild) {

            console.error(
                "❌ ไม่พบ SOURCE_GUILD_ID"
            );

            return;

        }


        if (!logGuild) {

            console.error(
                "❌ ไม่พบ LOG_GUILD_ID"
            );

            return;

        }


        console.log(
            `🏠 SOURCE: ${sourceGuild.name}`
        );

        console.log(
            `📋 LOG: ${logGuild.name}`
        );


        await setupLogSystem(
            logGuild
        );


        await sendLog({

            key:
                "bot_status",

            title:
                "🟢 LOG SYSTEM V2 ONLINE",

            description:
                "ระบบบันทึก Log ออนไลน์และพร้อมใช้งานแล้ว",

            color:
                COLORS.green,

            fields: [

                {

                    name:
                        "🏠 ดิสหลัก",

                    value:
                        `${sourceGuild.name}\n\`${sourceGuild.id}\``

                },

                {

                    name:
                        "📋 ดิส Log",

                    value:
                        `${logGuild.name}\n\`${logGuild.id}\``

                },

                {

                    name:
                        "⏰ เวลา",

                    value:
                        thaiTime()

                }

            ]

        });

    }
);


// ======================================================
// MEMBER JOIN
// ======================================================

client.on(
    "guildMemberAdd",
    async member => {

        if (
            member.guild.id !==
            SOURCE_GUILD_ID
        ) {

            return;

        }


        await sendLog({

            key:
                "member_join",

            title:
                "📥 สมาชิกเข้าเซิร์ฟเวอร์",

            description:
                `${member} เข้าร่วมเซิร์ฟเวอร์`,

            color:
                COLORS.green,

            thumbnail:
                member.user.displayAvatarURL({
                    size: 256
                }),

            fields: [

                {

                    name:
                        "👤 สมาชิก",

                    value:
                        userInfo(
                            member.user
                        )

                },

                {

                    name:
                        "👥 สมาชิกทั้งหมด",

                    value:
                        `${member.guild.memberCount}`,

                    inline: true

                },

                {

                    name:
                        "🆔 ID",

                    value:
                        `\`${member.id}\``,

                    inline: true

                }

            ]

        });


        // BOT ADD

        if (member.user.bot) {

            await sendLog({

                key:
                    "bot_add",

                title:
                    "🤖 เพิ่มบอทเข้าเซิร์ฟเวอร์",

                description:
                    `${member.user.tag} ถูกเพิ่มเข้าสู่เซิร์ฟเวอร์`,

                color:
                    COLORS.purple,

                fields: [

                    {

                        name:
                            "🤖 Bot",

                        value:
                            userInfo(
                                member.user
                            )

                    }

                ]

            });

        }

    }
);


// ======================================================
// MEMBER LEAVE
// ======================================================

client.on(
    "guildMemberRemove",
    async member => {

        if (
            member.guild.id !==
            SOURCE_GUILD_ID
        ) {

            return;

        }


        const auditKick =
            await getAuditExecutor(

                member.guild,

                AuditLogEvent.MemberKick,

                member.id

            );


        // KICK

        if (auditKick) {

            await sendLog({

                key:
                    "kick",

                title:
                    "👢 เตะสมาชิก",

                description:
                    `${member.user?.tag || "สมาชิก"} ถูกเตะออกจากเซิร์ฟเวอร์`,

                color:
                    COLORS.red,

                thumbnail:
                    member.user?.displayAvatarURL({
                        size: 256
                    }),

                fields: [

                    {

                        name:
                            "👤 ผู้ถูกเตะ",

                        value:
                            userInfo(
                                member.user
                            )

                    },

                    ...auditFields(
                        auditKick
                    )

                ]

            });

            return;

        }


        // NORMAL LEAVE

        await sendLog({

            key:
                "member_leave",

            title:
                "📤 สมาชิกออกจากเซิร์ฟเวอร์",

            description:
                `${member.user?.tag || "สมาชิก"} ออกจากเซิร์ฟเวอร์`,

            color:
                COLORS.red,

            thumbnail:
                member.user?.displayAvatarURL({
                    size: 256
                }),

            fields: [

                {

                    name:
                        "👤 สมาชิก",

                    value:
                        userInfo(
                            member.user
                        )

                }

            ]

        });


        // BOT LEAVE

        if (member.user?.bot) {

            await sendLog({

                key:
                    "bot_delete",

                title:
                    "🤖 บอทออกจากเซิร์ฟเวอร์",

                description:
                    `${member.user.tag} ออกจากเซิร์ฟเวอร์`,

                color:
                    COLORS.red,

                fields: [

                    {

                        name:
                            "🤖 Bot",

                        value:
                            userInfo(
                                member.user
                            )

                    }

                ]

            });

        }

    }
);


// ======================================================
// MESSAGE DELETE
// ======================================================

client.on(
    "messageDelete",
    async message => {

        if (!message.guild) {
            return;
        }


        if (
            message.guild.id !==
            SOURCE_GUILD_ID
        ) {

            return;

        }


        if (message.author?.bot) {
            return;
        }


        const attachments =
            [...message.attachments.values()];


        let imageCount = 0;

        let videoCount = 0;


        for (
            const file
            of attachments
        ) {

            if (
                file.contentType?.startsWith(
                    "image/"
                )
            ) {

                imageCount++;

            }


            if (
                file.contentType?.startsWith(
                    "video/"
                )
            ) {

                videoCount++;

            }

        }


        await sendLog({

            key:
                "message_delete",

            title:
                "🗑️ ลบข้อความ",

            description:
                `มีการลบข้อความใน ${message.channel}`,

            color:
                COLORS.red,

            fields: [

                {

                    name:
                        "👤 ผู้ส่ง",

                    value:
                        userInfo(
                            message.author
                        )

                },

                {

                    name:
                        "📢 ห้อง",

                    value:
                        `${message.channel}\n\`${message.channel.id}\``

                },

                {

                    name:
                        "💬 ข้อความ",

                    value:
                        `\`\`\`\n${safeText(
                            message.content
                        )}\n\`\`\``

                }

            ]

        });


        // IMAGE

        if (imageCount > 0) {

            await sendLog({

                key:
                    "image_delete",

                title:
                    "🖼️ ลบรูปภาพ",

                description:
                    `มีการลบรูปภาพ ${imageCount} ไฟล์`,

                color:
                    COLORS.red,

                fields: [

                    {

                        name:
                            "👤 ผู้ส่ง",

                        value:
                            userInfo(
                                message.author
                            )

                    },

                    {

                        name:
                            "📢 ห้อง",

                        value:
                            `${message.channel}`

                    }

                ]

            });

        }


        // VIDEO

        if (videoCount > 0) {

            await sendLog({

                key:
                    "video_delete",

                title:
                    "🎥 ลบวิดีโอ",

                description:
                    `มีการลบวิดีโอ ${videoCount} ไฟล์`,

                color:
                    COLORS.red,

                fields: [

                    {

                        name:
                            "👤 ผู้ส่ง",

                        value:
                            userInfo(
                                message.author
                            )

                    },

                    {

                        name:
                            "📢 ห้อง",

                        value:
                            `${message.channel}`

                    }

                ]

            });

        }

    }
);


// ======================================================
// MESSAGE UPDATE
// ======================================================

client.on(
    "messageUpdate",
    async (
        oldMessage,
        newMessage
    ) => {

        if (!oldMessage.guild) {
            return;
        }


        if (
            oldMessage.guild.id !==
            SOURCE_GUILD_ID
        ) {

            return;

        }


        if (oldMessage.author?.bot) {
            return;
        }


        if (
            oldMessage.content ===
            newMessage.content
        ) {

            return;

        }


        await sendLog({

            key:
                "message_edit",

            title:
                "✏️ แก้ไขข้อความ",

            description:
                `มีการแก้ไขข้อความใน ${oldMessage.channel}`,

            color:
                COLORS.yellow,

            fields: [

                {

                    name:
                        "👤 ผู้ใช้",

                    value:
                        userInfo(
                            oldMessage.author
                        )

                },

                {

                    name:
                        "📢 ห้อง",

                    value:
                        `${oldMessage.channel}`

                },

                {

                    name:
                        "ก่อนแก้ไข",

                    value:
                        `\`\`\`\n${safeText(
                            oldMessage.content,
                            600
                        )}\n\`\`\``

                },

                {

                    name:
                        "หลังแก้ไข",

                    value:
                        `\`\`\`\n${safeText(
                            newMessage.content,
                            600
                        )}\n\`\`\``

                }

            ]

        });

    }
);


// ======================================================
// VOICE
// ======================================================

client.on(
    "voiceStateUpdate",
    async (
        oldState,
        newState
    ) => {

        if (
            oldState.guild.id !==
            SOURCE_GUILD_ID
        ) {

            return;

        }


        const member =
            newState.member ||
            oldState.member;


        if (!member) {
            return;
        }


        // ==============================================
        // JOIN
        // ==============================================

        if (
            !oldState.channel &&
            newState.channel
        ) {

            await sendLog({

                key:
                    "voice_join",

                title:
                    "🎙️ เข้าห้อง",

                description:
                    `${member} เข้าห้องเสียง`,

                color:
                    COLORS.green,

                fields: [

                    {

                        name:
                            "👤 สมาชิก",

                        value:
                            userInfo(
                                member.user
                            )

                    },

                    {

                        name:
                            "🔊 ห้อง",

                        value:
                            `${newState.channel.name}\n\`${newState.channel.id}\``

                    }

                ]

            });

            return;

        }


        // ==============================================
        // LEAVE
        // ==============================================

        if (
            oldState.channel &&
            !newState.channel
        ) {

            await sendLog({

                key:
                    "voice_leave",

                title:
                    "📴 ออกจากห้อง",

                description:
                    `${member} ออกจากห้องเสียง`,

                color:
                    COLORS.red,

                fields: [

                    {

                        name:
                            "👤 สมาชิก",

                        value:
                            userInfo(
                                member.user
                            )

                    },

                    {

                        name:
                            "🔊 ห้องเดิม",

                        value:
                            `${oldState.channel.name}`

                    }

                ]

            });

            return;

        }


        // ==============================================
        // MOVE
        // ==============================================

        if (
            oldState.channel &&
            newState.channel &&
            oldState.channel.id !==
                newState.channel.id
        ) {

            await sendLog({

                key:
                    "voice_move",

                title:
                    "🔄 ย้ายห้อง",

                description:
                    `${member} ย้ายห้องเสียง`,

                color:
                    COLORS.blue,

                fields: [

                    {

                        name:
                            "👤 สมาชิก",

                        value:
                            userInfo(
                                member.user
                            )

                    },

                    {

                        name:
                            "🔊 จาก",

                        value:
                            oldState.channel.name

                    },

                    {

                        name:
                            "🔊 ไป",

                        value:
                            newState.channel.name

                    }

                ]

            });

            return;

        }


        // ==============================================
        // SELF MUTE
        // ==============================================

        if (
            oldState.selfMute !==
            newState.selfMute
        ) {

            await sendLog({

                key:
                    "voice_mute",

                title:
                    newState.selfMute
                        ? "🔇 ปิดไมค์"
                        : "🎤 เปิดไมค์",

                description:
                    `${member} ${
                        newState.selfMute
                            ? "ปิด"
                            : "เปิด"
                    }ไมค์`,

                color:
                    COLORS.blue,

                fields: [

                    {

                        name:
                            "👤 สมาชิก",

                        value:
                            userInfo(
                                member.user
                            )

                    }

                ]

            });

        }


        // ==============================================
        // SELF DEAF
        // ==============================================

        if (
            oldState.selfDeaf !==
            newState.selfDeaf
        ) {

            await sendLog({

                key:
                    "voice_deaf",

                title:
                    newState.selfDeaf
                        ? "🔇 ปิดหู"
                        : "🎧 เปิดหู",

                description:
                    `${member} ${
                        newState.selfDeaf
                            ? "ปิด"
                            : "เปิด"
                    }หู`,

                color:
                    COLORS.blue,

                fields: [

                    {

                        name:
                            "👤 สมาชิก",

                        value:
                            userInfo(
                                member.user
                            )

                    }

                ]

            });

        }


        // ==============================================
        // SERVER MUTE
        // ==============================================

        if (
            oldState.serverMute !==
            newState.serverMute
        ) {

            const audit =
                await getAuditExecutor(

                    newState.guild,

                    AuditLogEvent.MemberUpdate,

                    member.id

                );


            await sendLog({

                key:
                    "server_mute",

                title:
                    newState.serverMute
                        ? "🔇 ปิดไมค์เซิร์ฟเวอร์"
                        : "🎤 เปิดไมค์เซิร์ฟเวอร์",

                description:
                    `${member} ${
                        newState.serverMute
                            ? "ถูกปิดไมค์"
                            : "ถูกเปิดไมค์"
                    }`,

                color:
                    newState.serverMute
                        ? COLORS.red
                        : COLORS.green,

                fields: [

                    {

                        name:
                            "👤 สมาชิก",

                        value:
                            userInfo(
                                member.user
                            )

                    },

                    ...auditFields(
                        audit
                    )

                ]

            });

        }


        // ==============================================
        // SERVER DEAF
        // ==============================================

        if (
            oldState.serverDeaf !==
            newState.serverDeaf
        ) {

            await sendLog({

                key:
                    "voice_server",

                title:
                    newState.serverDeaf
                        ? "🔇 ปิดเสียงเซิร์ฟเวอร์"
                        : "🔊 เปิดเสียงเซิร์ฟเวอร์",

                description:
                    `${member} เปลี่ยนสถานะเสียง`,

                color:
                    COLORS.blue,

                fields: [

                    {

                        name:
                            "👤 สมาชิก",

                        value:
                            userInfo(
                                member.user
                            )

                    }

                ]

            });

        }


        // ==============================================
        // CAMERA
        // ==============================================

        if (
            oldState.selfVideo !==
            newState.selfVideo
        ) {

            await sendLog({

                key:
                    "camera",

                title:
                    newState.selfVideo
                        ? "📹 เปิดกล้อง"
                        : "📹 ปิดกล้อง",

                description:
                    `${member} ${
                        newState.selfVideo
                            ? "เปิด"
                            : "ปิด"
                    }กล้อง`,

                color:
                    COLORS.purple,

                fields: [

                    {

                        name:
                            "👤 สมาชิก",

                        value:
                            userInfo(
                                member.user
                            )

                    }

                ]

            });

        }


        // ==============================================
        // STREAM
        // ==============================================

        if (
            oldState.streaming !==
            newState.streaming
        ) {

            await sendLog({

                key:
                    "stream",

                title:
                    newState.streaming
                        ? "🖥️ เปิดสตรีมจอ"
                        : "🖥️ ปิดสตรีมจอ",

                description:
                    `${member} ${
                        newState.streaming
                            ? "เริ่ม"
                            : "หยุด"
                    }สตรีม`,

                color:
                    COLORS.purple,

                fields: [

                    {

                        name:
                            "👤 สมาชิก",

                        value:
                            userInfo(
                                member.user
                            )

                    }

                ]

            });

        }

    }
);


// ======================================================
// MEMBER UPDATE
// ======================================================

client.on(
    "guildMemberUpdate",
    async (
        oldMember,
        newMember
    ) => {

        if (
            oldMember.guild.id !==
            SOURCE_GUILD_ID
        ) {

            return;

        }


        // ==============================================
        // NICKNAME
        // ==============================================

        if (
            oldMember.nickname !==
            newMember.nickname
        ) {

            const audit =
                await getAuditExecutor(

                    newMember.guild,

                    AuditLogEvent.MemberUpdate,

                    newMember.id

                );


            await sendLog({

                key:
                    "nickname",

                title:
                    "✏️ เปลี่ยนชื่อเล่น",

                description:
                    `${newMember} เปลี่ยนชื่อเล่น`,

                color:
                    COLORS.yellow,

                fields: [

                    {

                        name:
                            "👤 สมาชิก",

                        value:
                            userInfo(
                                newMember.user
                            )

                    },

                    {

                        name:
                            "ก่อนเปลี่ยน",

                        value:
                            oldMember.nickname ||
                            "ไม่มี"

                    },

                    {

                        name:
                            "หลังเปลี่ยน",

                        value:
                            newMember.nickname ||
                            "ไม่มี"

                    },

                    ...auditFields(
                        audit
                    )

                ]

            });

        }


        // ==============================================
        // TIMEOUT
        // ==============================================

        const oldTimeout =
            oldMember
                .communicationDisabledUntilTimestamp;


        const newTimeout =
            newMember
                .communicationDisabledUntilTimestamp;


        if (
            oldTimeout !==
            newTimeout
        ) {

            const audit =
                await getAuditExecutor(

                    newMember.guild,

                    AuditLogEvent.MemberUpdate,

                    newMember.id

                );


            if (newTimeout) {

                await sendLog({

                    key:
                        "timeout",

                    title:
                        "⏳ หมดเวลา",

                    description:
                        `${newMember} ถูก Timeout`,

                    color:
                        COLORS.red,

                    fields: [

                        {

                            name:
                                "👤 สมาชิก",

                            value:
                                userInfo(
                                    newMember.user
                                )

                        },

                        {

                            name:
                                "หมดเวลา",

                            value:
                                `<t:${Math.floor(
                                    newTimeout / 1000
                                )}:F>`

                        },

                        ...auditFields(
                            audit
                        )

                    ]

                });

            }

            else {

                await sendLog({

                    key:
                        "timeout",

                    title:
                        "✅ ยกเลิก Timeout",

                    description:
                        `${newMember} ถูกยกเลิก Timeout`,

                    color:
                        COLORS.green,

                    fields: [

                        {

                            name:
                                "👤 สมาชิก",

                            value:
                                userInfo(
                                    newMember.user
                                )

                        },

                        ...auditFields(
                            audit
                        )

                    ]

                });

            }

        }


        // ==============================================
        // ROLES
        // ==============================================

        const oldRoles =
            new Set(
                oldMember.roles.cache.keys()
            );


        const newRoles =
            new Set(
                newMember.roles.cache.keys()
            );


        const addedRoles =
            newMember.roles.cache.filter(

                role =>

                    !oldRoles.has(
                        role.id
                    ) &&

                    role.id !==
                        newMember.guild.id

            );


        const removedRoles =
            oldMember.roles.cache.filter(

                role =>

                    !newRoles.has(
                        role.id
                    ) &&

                    role.id !==
                        newMember.guild.id

            );


        // ==============================================
        // ADDED ROLE
        // ==============================================

        for (
            const role
            of addedRoles.values()
        ) {

            const audit =
                await getAuditExecutor(

                    newMember.guild,

                    AuditLogEvent.MemberRoleUpdate,

                    newMember.id

                );


            await sendLog({

                key:
                    "role_add",

                title:
                    "🎭 ใส่ยศ",

                description:
                    `${newMember} ได้รับ Role`,

                color:
                    COLORS.green,

                fields: [

                    {

                        name:
                            "👤 สมาชิก",

                        value:
                            userInfo(
                                newMember.user
                            )

                    },

                    {

                        name:
                            "🎭 Role",

                        value:
                            `${role.name}\n\`${role.id}\``

                    },

                    ...auditFields(
                        audit
                    )

                ]

            });


            await sendLog({

                key:
                    "role_update_member",

                title:
                    "🎭 ใส่ยศ-ถอดยศรวม",

                description:
                    `${newMember} ได้รับ Role`,

                color:
                    COLORS.green,

                fields: [

                    {

                        name:
                            "👤 สมาชิก",

                        value:
                            userInfo(
                                newMember.user
                            )

                    },

                    {

                        name:
                            "🎭 Role",

                        value:
                            role.name

                    },

                    ...auditFields(
                        audit
                    )

                ]

            });

        }


        // ==============================================
        // REMOVED ROLE
        // ==============================================

        for (
            const role
            of removedRoles.values()
        ) {

            const audit =
                await getAuditExecutor(

                    newMember.guild,

                    AuditLogEvent.MemberRoleUpdate,

                    newMember.id

                );


            await sendLog({

                key:
                    "role_remove",

                title:
                    "🎭 ถอดยศ",

                description:
                    `${newMember} ถูกนำ Role ออก`,

                color:
                    COLORS.red,

                fields: [

                    {

                        name:
                            "👤 สมาชิก",

                        value:
                            userInfo(
                                newMember.user
                            )

                    },

                    {

                        name:
                            "🎭 Role",

                        value:
                            `${role.name}\n\`${role.id}\``

                    },

                    ...auditFields(
                        audit
                    )

                ]

            });


            await sendLog({

                key:
                    "role_update_member",

                title:
                    "🎭 ใส่ยศ-ถอดยศรวม",

                description:
                    `${newMember} ถูกนำ Role ออก`,

                color:
                    COLORS.red,

                fields: [

                    {

                        name:
                            "👤 สมาชิก",

                        value:
                            userInfo(
                                newMember.user
                            )

                    },

                    {

                        name:
                            "🎭 Role",

                        value:
                            role.name

                    },

                    ...auditFields(
                        audit
                    )

                ]

            });

        }

    }
);


// ======================================================
// BAN
// ======================================================

client.on(
    "guildBanAdd",
    async ban => {

        if (
            ban.guild.id !==
            SOURCE_GUILD_ID
        ) {

            return;

        }


        const audit =
            await getAuditExecutor(

                ban.guild,

                AuditLogEvent.MemberBanAdd,

                ban.user.id

            );


        await sendLog({

            key:
                "ban",

            title:
                "🔨 แบนสมาชิก",

            description:
                `${ban.user.tag} ถูกแบนออกจากเซิร์ฟเวอร์`,

            color:
                COLORS.red,

            thumbnail:
                ban.user.displayAvatarURL({
                    size: 256
                }),

            fields: [

                {

                    name:
                        "👤 ผู้ถูกแบน",

                    value:
                        userInfo(
                            ban.user
                        )

                },

                ...auditFields(
                    audit
                )

            ]

        });

    }
);


// ======================================================
// UNBAN
// ======================================================

client.on(
    "guildBanRemove",
    async ban => {

        if (
            ban.guild.id !==
            SOURCE_GUILD_ID
        ) {

            return;

        }


        const audit =
            await getAuditExecutor(

                ban.guild,

                AuditLogEvent.MemberBanRemove,

                ban.user.id

            );


        await sendLog({

            key:
                "unban",

            title:
                "🔓 ปลดแบน",

            description:
                `${ban.user.tag} ถูกปลดแบน`,

            color:
                COLORS.green,

            fields: [

                {

                    name:
                        "👤 ผู้ใช้",

                    value:
                        userInfo(
                            ban.user
                        )

                },

                ...auditFields(
                    audit
                )

            ]

        });

    }
);


// ======================================================
// ROLE CREATE
// ======================================================

client.on(
    "roleCreate",
    async role => {

        if (
            role.guild.id !==
            SOURCE_GUILD_ID
        ) {

            return;

        }


        const audit =
            await getAuditExecutor(

                role.guild,

                AuditLogEvent.RoleCreate,

                role.id

            );


        await sendLog({

            key:
                "role_create",

            title:
                "🎭 สร้างยศ",

            description:
                "มีการสร้าง Role ใหม่",

            color:
                COLORS.green,

            fields: [

                {

                    name:
                        "🎭 Role",

                    value:
                        `${role.name}\n\`${role.id}\``

                },

                ...auditFields(
                    audit
                )

            ]

        });

    }
);


// ======================================================
// ROLE DELETE
// ======================================================

client.on(
    "roleDelete",
    async role => {

        if (
            role.guild.id !==
            SOURCE_GUILD_ID
        ) {

            return;

        }


        const audit =
            await getAuditExecutor(

                role.guild,

                AuditLogEvent.RoleDelete,

                role.id

            );


        await sendLog({

            key:
                "role_delete",

            title:
                "🗑️ ลบยศ",

            description:
                "มีการลบ Role",

            color:
                COLORS.red,

            fields: [

                {

                    name:
                        "🎭 Role",

                    value:
                        `${role.name}\n\`${role.id}\``

                },

                ...auditFields(
                    audit
                )

            ]

        });

    }
);


// ======================================================
// ROLE UPDATE
// ======================================================

client.on(
    "roleUpdate",
    async (
        oldRole,
        newRole
    ) => {

        if (
            oldRole.guild.id !==
            SOURCE_GUILD_ID
        ) {

            return;

        }


        const changes = [];


        if (
            oldRole.name !==
            newRole.name
        ) {

            changes.push(
                `ชื่อ: **${oldRole.name}** → **${newRole.name}**`
            );

        }


        if (
            oldRole.color !==
            newRole.color
        ) {

            changes.push(
                "สี Role เปลี่ยน"
            );

        }


        if (
            oldRole.permissions.bitfield !==
            newRole.permissions.bitfield
        ) {

            changes.push(
                "Permissions เปลี่ยน"
            );

        }


        if (changes.length === 0) {
            return;
        }


        const audit =
            await getAuditExecutor(

                newRole.guild,

                AuditLogEvent.RoleUpdate,

                newRole.id

            );


        await sendLog({

            key:
                "role_update",

            title:
                "✏️ แก้ไขยศ",

            description:
                changes.join("\n"),

            color:
                COLORS.yellow,

            fields: [

                {

                    name:
                        "🎭 Role",

                    value:
                        `${newRole.name}\n\`${newRole.id}\``

                },

                ...auditFields(
                    audit
                )

            ]

        });

    }
);


// ======================================================
// CHANNEL CREATE
// ======================================================

client.on(
    "channelCreate",
    async channel => {

        if (!channel.guild) {
            return;
        }


        if (
            channel.guild.id !==
            SOURCE_GUILD_ID
        ) {

            return;

        }


        const audit =
            await getAuditExecutor(

                channel.guild,

                AuditLogEvent.ChannelCreate,

                channel.id

            );


        await sendLog({

            key:
                "channel_create",

            title:
                "📁 สร้างห้อง",

            description:
                "มีการสร้าง Channel ใหม่",

            color:
                COLORS.green,

            fields: [

                {

                    name:
                        "📢 Channel",

                    value:
                        `${channel.name}\n\`${channel.id}\``

                },

                {

                    name:
                        "ประเภท",

                    value:
                        `${channel.type}`

                },

                ...auditFields(
                    audit
                )

            ]

        });

    }
);


// ======================================================
// CHANNEL DELETE
// ======================================================

client.on(
    "channelDelete",
    async channel => {

        if (!channel.guild) {
            return;
        }


        if (
            channel.guild.id !==
            SOURCE_GUILD_ID
        ) {

            return;

        }


        const audit =
            await getAuditExecutor(

                channel.guild,

                AuditLogEvent.ChannelDelete,

                channel.id

            );


        await sendLog({

            key:
                "channel_delete",

            title:
                "🗑️ ลบห้อง",

            description:
                "มีการลบ Channel",

            color:
                COLORS.red,

            fields: [

                {

                    name:
                        "📢 Channel",

                    value:
                        `${channel.name}\n\`${channel.id}\``

                },

                ...auditFields(
                    audit
                )

            ]

        });

    }
);


// ======================================================
// CHANNEL UPDATE
// ======================================================

client.on(
    "channelUpdate",
    async (
        oldChannel,
        newChannel
    ) => {

        if (!oldChannel.guild) {
            return;
        }


        if (
            oldChannel.guild.id !==
            SOURCE_GUILD_ID
        ) {

            return;

        }


        const changes = [];


        if (
            oldChannel.name !==
            newChannel.name
        ) {

            changes.push(
                `ชื่อ: **${oldChannel.name}** → **${newChannel.name}**`
            );

        }


        if (
            oldChannel.parentId !==
            newChannel.parentId
        ) {

            changes.push(
                "หมวดหมู่เปลี่ยน"
            );

        }


        if (changes.length === 0) {
            return;
        }


        const audit =
            await getAuditExecutor(

                newChannel.guild,

                AuditLogEvent.ChannelUpdate,

                newChannel.id

            );


        await sendLog({

            key:
                "channel_update",

            title:
                "✏️ แก้ไขห้อง",

            description:
                changes.join("\n"),

            color:
                COLORS.yellow,

            fields: [

                {

                    name:
                        "📢 Channel",

                    value:
                        `${newChannel.name}\n\`${newChannel.id}\``

                },

                ...auditFields(
                    audit
                )

            ]

        });

    }
);


// ======================================================
// GUILD UPDATE
// ======================================================

client.on(
    "guildUpdate",
    async (
        oldGuild,
        newGuild
    ) => {

        if (
            oldGuild.id !==
            SOURCE_GUILD_ID
        ) {

            return;

        }


        const changes = [];


        if (
            oldGuild.name !==
            newGuild.name
        ) {

            changes.push(
                `ชื่อ: **${oldGuild.name}** → **${newGuild.name}**`
            );

        }


        if (
            oldGuild.icon !==
            newGuild.icon
        ) {

            changes.push(
                "ไอคอนเซิร์ฟเวอร์เปลี่ยน"
            );

        }


        if (changes.length === 0) {
            return;
        }


        const audit =
            await getAuditExecutor(

                newGuild,

                AuditLogEvent.GuildUpdate,

                newGuild.id

            );


        await sendLog({

            key:
                "guild_update",

            title:
                "⚙️ แก้ไขเซิร์ฟเวอร์",

            description:
                changes.join("\n"),

            color:
                COLORS.yellow,

            fields: [

                {

                    name:
                        "🏠 เซิร์ฟเวอร์",

                    value:
                        `${newGuild.name}\n\`${newGuild.id}\``

                },

                ...auditFields(
                    audit
                )

            ]

        });

    }
);


// ======================================================
// EMOJI CREATE
// ======================================================

client.on(
    "emojiCreate",
    async emoji => {

        if (
            emoji.guild.id !==
            SOURCE_GUILD_ID
        ) {

            return;

        }


        await sendLog({

            key:
                "emoji_create",

            title:
                "😀 เพิ่มอีโมจิ",

            description:
                "มีการเพิ่ม Emoji",

            color:
                COLORS.green,

            fields: [

                {

                    name:
                        "😀 Emoji",

                    value:
                        `${emoji.name}\n\`${emoji.id}\``

                }

            ]

        });

    }
);


// ======================================================
// EMOJI DELETE
// ======================================================

client.on(
    "emojiDelete",
    async emoji => {

        if (
            emoji.guild.id !==
            SOURCE_GUILD_ID
        ) {

            return;

        }


        await sendLog({

            key:
                "emoji_delete",

            title:
                "🗑️ ลบอีโมจิ",

            description:
                "มีการลบ Emoji",

            color:
                COLORS.red,

            fields: [

                {

                    name:
                        "😀 Emoji",

                    value:
                        `${emoji.name}\n\`${emoji.id}\``

                }

            ]

        });

    }
);


// ======================================================
// STICKER CREATE
// ======================================================

client.on(
    "stickerCreate",
    async sticker => {

        if (
            sticker.guild.id !==
            SOURCE_GUILD_ID
        ) {

            return;

        }


        await sendLog({

            key:
                "sticker_create",

            title:
                "🏷️ เพิ่มสติกเกอร์",

            description:
                "มีการเพิ่ม Sticker",

            color:
                COLORS.green,

            fields: [

                {

                    name:
                        "🏷️ Sticker",

                    value:
                        `${sticker.name}\n\`${sticker.id}\``

                }

            ]

        });

    }
);


// ======================================================
// STICKER DELETE
// ======================================================

client.on(
    "stickerDelete",
    async sticker => {

        if (
            sticker.guild.id !==
            SOURCE_GUILD_ID
        ) {

            return;

        }


        await sendLog({

            key:
                "sticker_delete",

            title:
                "🗑️ ลบสติกเกอร์",

            description:
                "มีการลบ Sticker",

            color:
                COLORS.red,

            fields: [

                {

                    name:
                        "🏷️ Sticker",

                    value:
                        `${sticker.name}\n\`${sticker.id}\``

                }

            ]

        });

    }
);


// ======================================================
// INVITE CREATE
// ======================================================

client.on(
    "inviteCreate",
    async invite => {

        if (!invite.guild) {
            return;
        }


        if (
            invite.guild.id !==
            SOURCE_GUILD_ID
        ) {

            return;

        }


        await sendLog({

            key:
                "invite_delete",

            title:
                "🔗 สร้างคำเชิญ",

            description:
                "มีการสร้าง Invite",

            color:
                COLORS.green,

            fields: [

                {

                    name:
                        "👤 ผู้สร้าง",

                    value:
                        userInfo(
                            invite.inviter
                        )

                },

                {

                    name:
                        "🔗 Invite",

                    value:
                        `\`${invite.code}\``

                }

            ]

        });

    }
);


// ======================================================
// INVITE DELETE
// ======================================================

client.on(
    "inviteDelete",
    async invite => {

        if (!invite.guild) {
            return;
        }


        if (
            invite.guild.id !==
            SOURCE_GUILD_ID
        ) {

            return;

        }


        await sendLog({

            key:
                "invite_delete",

            title:
                "🗑️ ลบเชิญ",

            description:
                "มีการลบ Invite",

            color:
                COLORS.red,

            fields: [

                {

                    name:
                        "🔗 Invite",

                    value:
                        `\`${invite.code}\``

                }

            ]

        });

    }
);


// ======================================================
// WEBHOOK
// ======================================================

client.on(
    "webhookUpdate",
    async channel => {

        if (!channel.guild) {
            return;
        }


        if (
            channel.guild.id !==
            SOURCE_GUILD_ID
        ) {

            return;

        }


        await sendLog({

            key:
                "webhook_create",

            title:
                "🪝 Webhook เปลี่ยนแปลง",

            description:
                "มีการสร้าง / แก้ไข / ลบ Webhook",

            color:
                COLORS.yellow,

            fields: [

                {

                    name:
                        "📢 ห้อง",

                    value:
                        `${channel.name}\n\`${channel.id}\``

                }

            ]

        });

    }
);


// ======================================================
// COMMAND !setup-log
// ======================================================

client.on(
    "messageCreate",
    async message => {

        if (!message.guild) {
            return;
        }


        if (message.author.bot) {
            return;
        }


        if (
            message.guild.id !==
            LOG_GUILD_ID
        ) {

            return;

        }


        if (
            message.content.trim() !==
            "!setup-log"
        ) {

            return;

        }


        if (
            !message.member.permissions.has(
                PermissionFlagsBits.Administrator
            )
        ) {

            await message.reply(
                "❌ คุณต้องมี Administrator เพื่อใช้คำสั่งนี้"
            );

            return;

        }


        await message.reply(
            "⏳ กำลังตรวจสอบและสร้างระบบ Log V2..."
        );


        try {

            await setupLogSystem(
                message.guild
            );


            await message.channel.send(

                "✅ **LOG SYSTEM V2 พร้อมใช้งานแล้ว!**\n\n" +

                "📋 LOG-MEMBER\n" +

                "🔊 LOG-VOICE\n" +

                "🔨 LOG-MODERATOR\n" +

                "💬 LOG-MESSAGE\n" +

                "⚙️ LOG-GENERAL\n\n" +

                "👮 Audit Log เปิดใช้งานแล้ว"

            );

        }

        catch (error) {

            console.error(error);


            await message.channel.send(

                "❌ **สร้างระบบ Log ไม่สำเร็จ**\n" +

                `\`${safeText(
                    error.message,
                    500
                )}\``

            );

        }

    }
);


// ======================================================
// DISCORD ERROR
// ======================================================

client.on(
    "error",
    error => {

        console.error(
            "❌ Discord Client Error:",
            error
        );

    }
);


// ======================================================
// UNHANDLED REJECTION
// ======================================================

process.on(
    "unhandledRejection",
    error => {

        console.error(
            "❌ Unhandled Promise Rejection:",
            error
        );

    }
);


// ======================================================
// UNCAUGHT EXCEPTION
// ======================================================

process.on(
    "uncaughtException",
    error => {

        console.error(
            "❌ Uncaught Exception:",
            error
        );

    }
);


// ======================================================
// LOGIN
// ======================================================

console.log(
    "🚀 กำลังเชื่อมต่อ Discord..."
);

client.login(TOKEN);
