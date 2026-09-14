// ============================================================
// MEAOW LOG SYSTEM V4
// Discord.js v14
// Render Ready
// ============================================================

require("dotenv").config();

const {
    Client,
    GatewayIntentBits,
    Partials,
    EmbedBuilder,
    ChannelType,
    PermissionFlagsBits,
    AuditLogEvent
} = require("discord.js");

const express = require("express");

// ============================================================
// WEB SERVER
// ============================================================

const app = express();

const PORT =
    process.env.PORT || 3000;

// ============================================================
// CONFIG
// ============================================================

const TOKEN =
    process.env.TOKEN;

const SOURCE_GUILD_ID =
    process.env.SOURCE_GUILD_ID;

const LOG_GUILD_ID =
    process.env.LOG_GUILD_ID;

if (
    !TOKEN ||
    !SOURCE_GUILD_ID ||
    !LOG_GUILD_ID
) {

    console.error("❌ ตั้งค่า ENV ไม่ครบ");

    console.error(`
TOKEN=
SOURCE_GUILD_ID=
LOG_GUILD_ID=
`);

    process.exit(1);
}

// ============================================================
// CLIENT
// ============================================================

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

        GatewayIntentBits.GuildEmojisAndStickers,

        GatewayIntentBits.GuildPresences
    ],

    partials: [

        Partials.Channel,

        Partials.Message,

        Partials.GuildMember,

        Partials.User
    ]
});

// ============================================================
// LOG STRUCTURE
// ============================================================

const LOG_STRUCTURE = {

    "LOG-MEMBER": [

        ["สถานะบอท", "bot_status"],

        ["คนเข้าเซิร์ฟเวอร์", "member_join"],

        ["คนออกเซิร์ฟเวอร์", "member_leave"],

        ["จำนวนสมาชิก", "member_count"]
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

// ============================================================
// CATEGORY ICON
// ============================================================

const CATEGORY_ICONS = {

    "LOG-MEMBER": "📋",

    "LOG-VOICE": "🔊",

    "LOG-MODERATOR": "🔨",

    "LOG-MESSAGE": "💬",

    "LOG-GENERAL": "⚙️"
};

// ============================================================
// COLORS
// ============================================================

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

// ============================================================
// CACHE
// ============================================================

const auditCache =
    new Map();

const lastMemberCount =
    new Map();

const lastPresenceCount =
    new Map();

// ============================================================
// TIME
// ============================================================

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

// ============================================================
// SAFE TEXT
// ============================================================

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

    text =
        String(text);

    if (
        text.length > max
    ) {

        return (
            text.substring(0, max) +
            "..."
        );
    }

    return text;
}

// ============================================================
// USER INFO
// ============================================================

function userInfo(user) {

    if (!user) {

        return "ไม่ทราบข้อมูล";
    }

    return `${user.tag || user.username || "Unknown"}\n\`${user.id}\``;
}

// ============================================================
// GUILD
// ============================================================

function getSourceGuild() {

    return client.guilds.cache.get(
        SOURCE_GUILD_ID
    );
}

function getLogGuild() {

    return client.guilds.cache.get(
        LOG_GUILD_ID
    );
}

// ============================================================
// FIND LOG CHANNEL
// ============================================================

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
        of Object.entries(
            LOG_STRUCTURE
        )
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

// ============================================================
// SEND LOG
// ============================================================

async function sendLog({

    key,

    title,

    description,

    color = COLORS.blue,

    fields = [],

    thumbnail = null,

    image = null
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

                .setTitle(
                    safeText(
                        title,
                        256
                    )
                )

                .setColor(color)

                .setTimestamp()

                .setFooter({

                    text:
                        `Meaow Log V4 • ${thaiTime()}`
                });

        if (description) {

            embed.setDescription(
                safeText(
                    description,
                    4000
                )
            );
        }

        if (fields.length) {

            embed.addFields(
                fields.slice(
                    0,
                    25
                )
            );
        }

        if (thumbnail) {

            try {

                embed.setThumbnail(
                    thumbnail
                );

            } catch {}
        }

        if (image) {

            try {

                embed.setImage(
                    image
                );

            } catch {}
        }

        await channel.send({

            embeds: [embed]
        });

    } catch (error) {

        console.error(
            `❌ ส่ง Log [${key}] ไม่สำเร็จ:`,
            error.message
        );
    }
}

// ============================================================
// AUDIT LOG
// ============================================================

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

        const cacheKey =
            `${guild.id}:${action}:${targetId || "none"}`;

        const old =
            auditCache.get(
                cacheKey
            );

        if (
            old &&
            Date.now() - old.time < 3000
        ) {

            return old.data;
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

                    if (
                        age > 15000
                    ) {

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

        const data = {

            user:
                entry.executor,

            reason:
                entry.reason ||
                "ไม่ได้ระบุเหตุผล",

            entry
        };

        auditCache.set(
            cacheKey,
            {
                time:
                    Date.now(),
                data
            }
        );

        return data;

    } catch (error) {

        console.error(
            "⚠️ อ่าน Audit Log ไม่ได้:",
            error.message
        );

        return null;
    }
}

// ============================================================
// AUDIT FIELDS
// ============================================================

function auditFields(
    audit
) {

    if (!audit) {

        return [];
    }

    return [

        {

            name:
                "👮 ผู้ดำเนินการ",

            value:
                userInfo(
                    audit.user
                ),

            inline:
                true
        },

        {

            name:
                "📝 เหตุผล",

            value:
                safeText(
                    audit.reason,
                    300
                ),

            inline:
                true
        }
    ];
}

// ============================================================
// MEMBER COUNT
// ============================================================

function getOnlineCount(
    guild
) {

    let count = 0;

    guild.members.cache.forEach(
        member => {

            if (
                member.presence &&
                member.presence.status !==
                "offline"
            ) {

                count++;
            }
        }
    );

    return count;
}

// ============================================================
// ROLE PERMISSION NAME
// ============================================================

function permissionNames(
    permissions
) {

    if (!permissions) {

        return [];
    }

    const names = {

        Administrator:
            "ผู้ดูแลระบบ",

        ManageGuild:
            "จัดการเซิร์ฟเวอร์",

        ManageChannels:
            "จัดการห้อง",

        ManageRoles:
            "จัดการยศ",

        ManageMessages:
            "จัดการข้อความ",

        ManageWebhooks:
            "จัดการ Webhook",

        ManageNicknames:
            "จัดการชื่อเล่น",

        KickMembers:
            "เตะสมาชิก",

        BanMembers:
            "แบนสมาชิก",

        ModerateMembers:
            "Timeout สมาชิก",

        ViewAuditLog:
            "ดู Audit Log",

        ViewChannel:
            "ดูห้อง",

        SendMessages:
            "ส่งข้อความ",

        SendMessagesInThreads:
            "ส่งข้อความในกระทู้",

        EmbedLinks:
            "ฝังลิงก์",

        AttachFiles:
            "แนบไฟล์",

        ReadMessageHistory:
            "ดูประวัติข้อความ",

        MentionEveryone:
            "Mention Everyone",

        AddReactions:
            "เพิ่ม Reaction",

        Connect:
            "เข้าห้องเสียง",

        Speak:
            "พูดในห้องเสียง",

        MuteMembers:
            "ปิดไมค์สมาชิก",

        DeafenMembers:
            "ปิดหูสมาชิก",

        MoveMembers:
            "ย้ายสมาชิก",

        Stream:
            "สตรีม",

        UseVAD:
            "ใช้ Voice Activity",

        ViewGuildInsights:
            "ดูข้อมูลเซิร์ฟเวอร์"
    };

    return permissions
        .toArray()
        .map(
            permission =>
                names[permission] ||
                permission
        );
}

// ============================================================
// ROLE CHANGE DETAILS
// ============================================================

function getRoleChanges(
    oldRole,
    newRole
) {

    const changes = [];

    // --------------------------------------------------------
    // NAME
    // --------------------------------------------------------

    if (
        oldRole.name !==
        newRole.name
    ) {

        changes.push({

            name:
                "✏️ ชื่อยศ",

            value:
                `ก่อน: **${safeText(oldRole.name, 100)}**\n` +
                `หลัง: **${safeText(newRole.name, 100)}**`
        });
    }

    // --------------------------------------------------------
    // COLOR
    // --------------------------------------------------------

    if (
        oldRole.color !==
        newRole.color
    ) {

        const oldColor =
            oldRole.hexColor ||
            "#000000";

        const newColor =
            newRole.hexColor ||
            "#000000";

        changes.push({

            name:
                "🎨 สีของยศ",

            value:
                `ก่อน: \`${oldColor}\`\n` +
                `หลัง: \`${newColor}\``
        });
    }

    // --------------------------------------------------------
    // MENTIONABLE
    // --------------------------------------------------------

    if (
        oldRole.mentionable !==
        newRole.mentionable
    ) {

        changes.push({

            name:
                "📣 Mentionable",

            value:
                `ก่อน: ${
                    oldRole.mentionable
                        ? "เปิด"
                        : "ปิด"
                }\n` +
                `หลัง: ${
                    newRole.mentionable
                        ? "เปิด"
                        : "ปิด"
                }`
        });
    }

    // --------------------------------------------------------
    // HOIST
    // --------------------------------------------------------

    if (
        oldRole.hoist !==
        newRole.hoist
    ) {

        changes.push({

            name:
                "📌 แสดงยศแยก",

            value:
                `ก่อน: ${
                    oldRole.hoist
                        ? "เปิด"
                        : "ปิด"
                }\n` +
                `หลัง: ${
                    newRole.hoist
                        ? "เปิด"
                        : "ปิด"
                }`
        });
    }

    // --------------------------------------------------------
    // POSITION
    // --------------------------------------------------------

    if (
        oldRole.position !==
        newRole.position
    ) {

        changes.push({

            name:
                "↕️ ตำแหน่งยศ",

            value:
                `ก่อน: \`${oldRole.position}\`\n` +
                `หลัง: \`${newRole.position}\``
        });
    }

    // --------------------------------------------------------
    // PERMISSIONS
    // --------------------------------------------------------

    const oldPermissions =
        permissionNames(
            oldRole.permissions
        );

    const newPermissions =
        permissionNames(
            newRole.permissions
        );

    const addedPermissions =
        newPermissions.filter(
            permission =>
                !oldPermissions.includes(
                    permission
                )
        );

    const removedPermissions =
        oldPermissions.filter(
            permission =>
                !newPermissions.includes(
                    permission
                )
        );

    if (
        addedPermissions.length
    ) {

        changes.push({

            name:
                "🟢 เพิ่มสิทธิ์",

            value:
                safeText(
                    addedPermissions
                        .map(
                            permission =>
                                `+ ${permission}`
                        )
                        .join("\n"),
                    1000
                )
        });
    }

    if (
        removedPermissions.length
    ) {

        changes.push({

            name:
                "🔴 ลบสิทธิ์",

            value:
                safeText(
                    removedPermissions
                        .map(
                            permission =>
                                `- ${permission}`
                        )
                        .join("\n"),
                    1000
                )
        });
    }

    return changes;
}

// ============================================================
// SETUP LOG SYSTEM
// ============================================================

async function setupLogSystem(
    guild
) {

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

        // ----------------------------------------------------
        // CREATE CATEGORY
        // ----------------------------------------------------

        if (!category) {

            try {

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

            } catch (error) {

                console.error(
                    `❌ สร้าง Category ไม่ได้: ${categoryNameFull}`,
                    error.message
                );

                continue;
            }
        }

        // ----------------------------------------------------
        // CREATE CHANNELS
        // ----------------------------------------------------

        for (
            const [
                channelName
            ]
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

            try {

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

            } catch (error) {

                console.error(
                    `❌ สร้าง Channel ไม่ได้: ${fullName}`,
                    error.message
                );
            }
        }
    }

    console.log(
        "===================================="
    );

    console.log(
        "✅ LOG SYSTEM V4 พร้อมใช้งาน"
    );

    console.log(
        "===================================="
    );
}

// ============================================================
// READY
// ============================================================

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
            "🚀 MEAOW LOG SYSTEM V4"
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

        await sourceGuild.members
            .fetch()
            .catch(() => {});

        lastMemberCount.set(
            sourceGuild.id,
            sourceGuild.memberCount
        );

        lastPresenceCount.set(
            sourceGuild.id,
            getOnlineCount(
                sourceGuild
            )
        );

        await sendLog({

            key:
                "bot_status",

            title:
                "🟢 LOG SYSTEM V4 ONLINE",

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
                        "👥 สมาชิก",

                    value:
                        `${sourceGuild.memberCount}`,

                    inline:
                        true
                },

                {

                    name:
                        "🟢 ออนไลน์",

                    value:
                        `${getOnlineCount(
                            sourceGuild
                        )}`,

                    inline:
                        true
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

// ============================================================
// MEMBER JOIN
// ============================================================

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

                    inline:
                        true
                },

                {

                    name:
                        "🆔 ID",

                    value:
                        `\`${member.id}\``,

                    inline:
                        true
                }
            ]
        });

        // ----------------------------------------------------
        // BOT ADD
        // ----------------------------------------------------

        if (
            member.user.bot
        ) {

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

        // ----------------------------------------------------
        // MEMBER COUNT
        // ----------------------------------------------------

        const oldCount =
            lastMemberCount.get(
                member.guild.id
            );

        lastMemberCount.set(
            member.guild.id,
            member.guild.memberCount
        );

        if (
            oldCount !== undefined &&
            oldCount !==
            member.guild.memberCount
        ) {

            await sendLog({

                key:
                    "member_count",

                title:
                    "👥 จำนวนสมาชิกเปลี่ยนแปลง",

                description:
                    "มีสมาชิกใหม่เข้ามาในเซิร์ฟเวอร์",

                color:
                    COLORS.green,

                fields: [

                    {

                        name:
                            "👥 จำนวนสมาชิก",

                        value:
                            `${member.guild.memberCount} คน`
                    }
                ]
            });
        }
    }
);

// ============================================================
// MEMBER LEAVE
// ============================================================

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

        // ----------------------------------------------------
        // KICK
        // ----------------------------------------------------

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

        } else if (
            member.user?.bot
        ) {

            // ------------------------------------------------
            // BOT LEAVE
            // ------------------------------------------------

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

        } else {

            // ------------------------------------------------
            // NORMAL LEAVE
            // ------------------------------------------------

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
        }

        // ----------------------------------------------------
        // MEMBER COUNT
        // ----------------------------------------------------

        lastMemberCount.set(
            member.guild.id,
            member.guild.memberCount
        );

        await sendLog({

            key:
                "member_count",

            title:
                "👥 จำนวนสมาชิกเปลี่ยนแปลง",

            description:
                "สมาชิกออกจากเซิร์ฟเวอร์",

            color:
                COLORS.red,

            fields: [

                {

                    name:
                        "👥 จำนวนสมาชิก",

                    value:
                        `${member.guild.memberCount} คน`
                }
            ]
        });
    }
);

// ============================================================
// MEMBER UPDATE
// ============================================================

client.on(
    "guildMemberUpdate",
    async (
        oldMember,
        newMember
    ) => {

        if (
            newMember.guild.id !==
            SOURCE_GUILD_ID
        ) {

            return;
        }

        // ====================================================
        // NICKNAME
        // ====================================================

        if (
            oldMember.nickname !==
            newMember.nickname
        ) {

            await sendLog({

                key:
                    "nickname",

                title:
                    "✏️ เปลี่ยนชื่อเล่น",

                description:
                    `${newMember.user.tag} เปลี่ยนชื่อเล่น`,

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
                            "ไม่มีชื่อเล่น"
                    },

                    {

                        name:
                            "หลังเปลี่ยน",

                        value:
                            newMember.nickname ||
                            "ไม่มีชื่อเล่น"
                    }
                ]
            });
        }

        // ====================================================
        // ROLES
        // ====================================================

        const oldRoles =
            new Set(
                oldMember.roles.cache.keys()
            );

        const newRoles =
            new Set(
                newMember.roles.cache.keys()
            );

        const addedRoles =
            [...newRoles].filter(
                id =>
                    !oldRoles.has(id)
            );

        const removedRoles =
            [...oldRoles].filter(
                id =>
                    !newRoles.has(id)
            );

        // ----------------------------------------------------
        // ROLE ADD
        // ----------------------------------------------------

        for (
            const roleId of addedRoles
        ) {

            if (
                roleId ===
                newMember.guild.id
            ) {

                continue;
            }

            const role =
                newMember.guild.roles.cache.get(
                    roleId
                );

            if (!role) {

                continue;
            }

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
                    "➕ เพิ่มยศ",

                description:
                    `${newMember.user.tag} ได้รับยศ ${role.name}`,

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
                            "🎖️ ยศ",

                        value:
                            `${role.name}\n\`${role.id}\``
                    },

                    ...auditFields(audit)
                ]
            });
        }

        // ----------------------------------------------------
        // ROLE REMOVE
        // ----------------------------------------------------

        for (
            const roleId of removedRoles
        ) {

            if (
                roleId ===
                newMember.guild.id
            ) {

                continue;
            }

            const role =
                newMember.guild.roles.cache.get(
                    roleId
                );

            if (!role) {

                continue;
            }

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
                    "➖ ถอดยศ",

                description:
                    `${newMember.user.tag} ถูกถอดยศ ${role.name}`,

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
                            "🎖️ ยศ",

                        value:
                            `${role.name}\n\`${role.id}\``
                    },

                    ...auditFields(audit)
                ]
            });
        }

        // ====================================================
        // TIMEOUT
        // ====================================================

        const oldTimeout =
            oldMember.communicationDisabledUntilTimestamp;

        const newTimeout =
            newMember.communicationDisabledUntilTimestamp;

        if (
            oldTimeout !==
            newTimeout
        ) {

            if (newTimeout) {

                const audit =
                    await getAuditExecutor(

                        newMember.guild,

                        AuditLogEvent.MemberUpdate,

                        newMember.id
                    );

                await sendLog({

                    key:
                        "timeout",

                    title:
                        "⏱️ หมดเวลา / Timeout",

                    description:
                        `${newMember.user.tag} ถูก Timeout`,

                    color:
                        COLORS.orange,

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
                                "⏰ สิ้นสุด",

                            value:
                                `<t:${Math.floor(
                                    newTimeout / 1000
                                )}:F>`
                        },

                        ...auditFields(audit)
                    ]
                });

            } else {

                await sendLog({

                    key:
                        "timeout",

                    title:
                        "✅ ยกเลิก Timeout",

                    description:
                        `${newMember.user.tag} พ้นจาก Timeout แล้ว`,

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
                        }
                    ]
                });
            }
        }

        // ====================================================
        // COMBINED ROLE LOG
        // ====================================================

        if (
            addedRoles.length ||
            removedRoles.length
        ) {

            const audit =
                await getAuditExecutor(

                    newMember.guild,

                    AuditLogEvent.MemberRoleUpdate,

                    newMember.id
                );

            await sendLog({

                key:
                    "role_update_member",

                title:
                    "🎖️ อัปเดตยศสมาชิก",

                description:
                    `มีการเปลี่ยนแปลงยศของ ${newMember.user.tag}`,

                color:
                    COLORS.purple,

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
                            "➕ เพิ่ม",

                        value:
                            addedRoles.length
                                ? addedRoles
                                    .map(
                                        id =>
                                            newMember.guild.roles.cache.get(id)?.name || id
                                    )
                                    .join(", ")
                                : "ไม่มี"
                    },

                    {

                        name:
                            "➖ ถอด",

                        value:
                            removedRoles.length
                                ? removedRoles
                                    .map(
                                        id =>
                                            oldMember.guild.roles.cache.get(id)?.name || id
                                    )
                                    .join(", ")
                                : "ไม่มี"
                    },

                    ...auditFields(audit)
                ]
            });
        }
    }
);

// ============================================================
// MESSAGE DELETE
// ============================================================

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

        if (
            message.author?.bot
        ) {

            return;
        }

        // ----------------------------------------------------
        // FETCH PARTIAL MESSAGE
        // ----------------------------------------------------

        if (
            message.partial
        ) {

            try {

                await message.fetch();

            } catch {}
        }

        const attachments =
            [...message.attachments.values()];

        const images =
            attachments.filter(
                file =>
                    file.contentType?.startsWith(
                        "image/"
                    ) ||
                    /\.(png|jpe?g|gif|webp|bmp|svg)$/i
                        .test(
                            file.name || ""
                        )
            );

        const videos =
            attachments.filter(
                file =>
                    file.contentType?.startsWith(
                        "video/"
                    ) ||
                    /\.(mp4|mov|webm|avi|mkv)$/i
                        .test(
                            file.name || ""
                        )
            );

        // ====================================================
        // MESSAGE DELETE
        // ====================================================

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
                        message.content
                            ? `\`\`\`\n${safeText(
                                message.content,
                                700
                            )}\n\`\`\``
                            : "ไม่มีข้อความ"
                },

                {

                    name:
                        "📎 ไฟล์แนบ",

                    value:
                        `${attachments.length} ไฟล์`
                }
            ]
        });

        // ====================================================
        // IMAGE DELETE
        // ====================================================

        if (
            images.length > 0
        ) {

            for (
                const imageFile of images
            ) {

                const fileName =
                    imageFile.name ||
                    "ไม่ทราบชื่อ";

                const fileSize =
                    imageFile.size
                        ? `${(
                            imageFile.size /
                            1024 /
                            1024
                        ).toFixed(2)} MB`
                        : "ไม่ทราบ";

                const contentType =
                    imageFile.contentType ||
                    "ไม่ทราบ";

                const url =
                    imageFile.url ||
                    null;

                await sendLog({

                    key:
                        "image_delete",

                    title:
                        "🖼️ ลบรูปภาพ",

                    description:
                        `${message.author?.tag || "สมาชิก"} ลบรูปภาพออกจาก ${message.channel}`,

                    color:
                        COLORS.red,

                    image:
                        url,

                    fields: [

                        {

                            name:
                                "👤 ผู้ลบ / ผู้ส่ง",

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
                                "🖼️ ชื่อรูป",

                            value:
                                `\`${safeText(
                                    fileName,
                                    200
                                )}\``
                        },

                        {

                            name:
                                "📦 ขนาด",

                            value:
                                fileSize,

                            inline:
                                true
                        },

                        {

                            name:
                                "📄 ประเภท",

                            value:
                                contentType,

                            inline:
                                true
                        },

                        {

                            name:
                                "🔗 URL รูป",

                            value:
                                url
                                    ? safeText(
                                        url,
                                        1000
                                    )
                                    : "ไม่พบ URL"
                        }
                    ]
                });
            }
        }

        // ====================================================
        // VIDEO DELETE
        // ====================================================

        if (
            videos.length > 0
        ) {

            for (
                const videoFile of videos
            ) {

                await sendLog({

                    key:
                        "video_delete",

                    title:
                        "🎥 ลบวิดีโอ",

                    description:
                        `${message.author?.tag || "สมาชิก"} ลบวิดีโอออกจาก ${message.channel}`,

                    color:
                        COLORS.red,

                    fields: [

                        {

                            name:
                                "👤 ผู้ลบ / ผู้ส่ง",

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
                                "🎥 ชื่อวิดีโอ",

                            value:
                                `\`${safeText(
                                    videoFile.name ||
                                    "ไม่ทราบชื่อ",
                                    200
                                )}\``
                        },

                        {

                            name:
                                "📦 ขนาด",

                            value:
                                videoFile.size
                                    ? `${(
                                        videoFile.size /
                                        1024 /
                                        1024
                                    ).toFixed(2)} MB`
                                    : "ไม่ทราบ"
                        },

                        {

                            name:
                                "🔗 URL",

                            value:
                                safeText(
                                    videoFile.url ||
                                    "ไม่พบ URL",
                                    1000
                                )
                        }
                    ]
                });
            }
        }
    }
);

// ============================================================
// MESSAGE UPDATE
// ============================================================

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

        if (
            oldMessage.author?.bot
        ) {

            return;
        }

        if (
            oldMessage.partial ||
            newMessage.partial
        ) {

            try {

                await oldMessage.fetch();

            } catch {}

            try {

                await newMessage.fetch();

            } catch {}
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
                        `${oldMessage.channel}\n\`${oldMessage.channel.id}\``
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

// ============================================================
// VOICE STATE
// ============================================================

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

        // ----------------------------------------------------
        // JOIN
        // ----------------------------------------------------

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
        }

        // ----------------------------------------------------
        // LEAVE
        // ----------------------------------------------------

        if (
            oldState.channel &&
            !newState.channel
        ) {

            const audit =
                await getAuditExecutor(

                    oldState.guild,

                    AuditLogEvent.MemberDisconnect,

                    member.id
                );

            if (audit) {

                await sendLog({

                    key:
                        "voice_disconnect",

                    title:
                        "🔌 ตัดการเชื่อมต่อ",

                    description:
                        `${member.user.tag} ถูกตัดการเชื่อมต่อจากห้องเสียง`,

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
                                "🔊 ห้อง",

                            value:
                                oldState.channel.name
                        },

                        ...auditFields(audit)
                    ]
                });

            } else {

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
                                oldState.channel.name
                        }
                    ]
                });
            }
        }

        // ----------------------------------------------------
        // MOVE
        // ----------------------------------------------------

        if (
            oldState.channel &&
            newState.channel &&
            oldState.channel.id !==
            newState.channel.id
        ) {

            const audit =
                await getAuditExecutor(

                    newState.guild,

                    AuditLogEvent.MemberMove,

                    member.id
                );

            await sendLog({

                key:
                    audit
                        ? "voice_move_member"
                        : "voice_move",

                title:
                    audit
                        ? "🔄 แอดมินย้ายสมาชิก"
                        : "🔄 ย้ายห้อง",

                description:
                    `${member.user.tag} ย้ายจากห้องหนึ่งไปอีกห้องหนึ่ง`,

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
                    },

                    ...auditFields(audit)
                ]
            });
        }

        // ----------------------------------------------------
        // SELF MUTE
        // ----------------------------------------------------

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
                    `${member.user.tag} ${
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

        // ----------------------------------------------------
        // SERVER MUTE
        // ----------------------------------------------------

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
                    `${member.user.tag} ${
                        newState.serverMute
                            ? "ถูกปิดไมค์โดยเซิร์ฟเวอร์"
                            : "ถูกเปิดไมค์โดยเซิร์ฟเวอร์"
                    }`,

                color:
                    COLORS.orange,

                fields: [

                    {

                        name:
                            "👤 สมาชิก",

                        value:
                            userInfo(
                                member.user
                            )
                    },

                    ...auditFields(audit)
                ]
            });
        }

        // ----------------------------------------------------
        // SELF DEAF
        // ----------------------------------------------------

        if (
            oldState.selfDeaf !==
            newState.selfDeaf
        ) {

            await sendLog({

                key:
                    "voice_deaf",

                title:
                    newState.selfDeaf
                        ? "🙉 ปิดหู"
                        : "🎧 เปิดหู",

                description:
                    `${member.user.tag} ${
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

        // ----------------------------------------------------
        // STREAM
        // ----------------------------------------------------

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
                    `${member.user.tag} ${
                        newState.streaming
                            ? "เริ่มแชร์หน้าจอ"
                            : "หยุดแชร์หน้าจอ"
                    }`,

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
                    },

                    {

                        name:
                            "🔊 ห้อง",

                        value:
                            newState.channel?.name ||
                            oldState.channel?.name ||
                            "ไม่ทราบ"
                    }
                ]
            });
        }

        // ----------------------------------------------------
        // CAMERA
        // ----------------------------------------------------

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
                        : "📷 ปิดกล้อง",

                description:
                    `${member.user.tag} ${
                        newState.selfVideo
                            ? "เปิดกล้อง"
                            : "ปิดกล้อง"
                    }`,

                color:
                    COLORS.cyan,

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

        // ----------------------------------------------------
        // SUPPRESS
        // ----------------------------------------------------

        if (
            oldState.suppress !==
            newState.suppress
        ) {

            await sendLog({

                key:
                    "voice_status",

                title:
                    "🔊 อัปเดตสถานะเสียง",

                description:
                    `${member.user.tag} มีการเปลี่ยนแปลงสถานะเสียง`,

                color:
                    COLORS.cyan,

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
                            "สถานะ",

                        value:
                            newState.suppress
                                ? "ถูก Suppress"
                                : "ยกเลิก Suppress"
                    }
                ]
            });
        }
    }
);

// ============================================================
// BAN
// ============================================================

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

        const reason =
            audit?.reason || "";

        const isBlacklist =
            reason
                .toLowerCase()
                .includes(
                    "blacklist"
                );

        await sendLog({

            key:
                isBlacklist
                    ? "blacklist_ban"
                    : "ban",

            title:
                isBlacklist
                    ? "🚫 แบน BLACKLIST"
                    : "🔨 แบนสมาชิก",

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

                ...auditFields(audit)
            ]
        });
    }
);

// ============================================================
// UNBAN
// ============================================================

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

        const reason =
            audit?.reason || "";

        const isBlacklist =
            reason
                .toLowerCase()
                .includes(
                    "blacklist"
                );

        await sendLog({

            key:
                isBlacklist
                    ? "blacklist_unban"
                    : "unban",

            title:
                isBlacklist
                    ? "✅ ปลด BLACKLIST"
                    : "✅ ปลดแบน",

            description:
                `${ban.user.tag} ถูกปลดแบน`,

            color:
                COLORS.green,

            fields: [

                {

                    name:
                        "👤 สมาชิก",

                    value:
                        userInfo(
                            ban.user
                        )
                },

                ...auditFields(audit)
            ]
        });
    }
);

// ============================================================
// CHANNEL CREATE
// ============================================================

client.on(
    "channelCreate",
    async channel => {

        if (
            channel.guild?.id !==
            SOURCE_GUILD_ID
        ) {

            return;
        }

        let key =
            "channel_create";

        let title =
            "📁 สร้างห้อง";

        if (
            channel.type ===
            ChannelType.GuildAnnouncement
        ) {

            key =
                "announcement_create";

            title =
                "📢 สร้างประกาศ";
        }

        if (
            channel.type ===
            ChannelType.GuildStageVoice
        ) {

            key =
                "stage_create";

            title =
                "🎤 สร้างเวที";
        }

        const audit =
            await getAuditExecutor(

                channel.guild,

                AuditLogEvent.ChannelCreate,

                channel.id
            );

        await sendLog({

            key,

            title,

            description:
                `มีการสร้าง ${channel.name}`,

            color:
                COLORS.green,

            fields: [

                {

                    name:
                        "📢 ชื่อห้อง",

                    value:
                        `${channel.name}\n\`${channel.id}\``
                },

                {

                    name:
                        "📂 ประเภท",

                    value:
                        `${channel.type}`
                },

                ...auditFields(audit)
            ]
        });
    }
);

// ============================================================
// CHANNEL DELETE
// ============================================================

client.on(
    "channelDelete",
    async channel => {

        if (
            channel.guild?.id !==
            SOURCE_GUILD_ID
        ) {

            return;
        }

        let key =
            "channel_delete";

        let title =
            "🗑️ ลบห้อง";

        if (
            channel.type ===
            ChannelType.GuildAnnouncement
        ) {

            key =
                "announcement_delete";

            title =
                "🗑️ ลบประกาศ";
        }

        const audit =
            await getAuditExecutor(

                channel.guild,

                AuditLogEvent.ChannelDelete,

                channel.id
            );

        await sendLog({

            key,

            title,

            description:
                `ห้อง ${channel.name} ถูกลบ`,

            color:
                COLORS.red,

            fields: [

                {

                    name:
                        "📢 ห้อง",

                    value:
                        `${channel.name}\n\`${channel.id}\``
                },

                ...auditFields(audit)
            ]
        });
    }
);

// ============================================================
// CHANNEL UPDATE
// ============================================================

client.on(
    "channelUpdate",
    async (
        oldChannel,
        newChannel
    ) => {

        if (
            newChannel.guild?.id !==
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
                `ชื่อ: ${oldChannel.name} → ${newChannel.name}`
            );
        }

        if (
            oldChannel.parentId !==
            newChannel.parentId
        ) {

            changes.push(
                "หมวดหมู่มีการเปลี่ยนแปลง"
            );
        }

        if (
            oldChannel.topic !==
            newChannel.topic
        ) {

            changes.push(
                "Topic มีการเปลี่ยนแปลง"
            );
        }

        if (
            oldChannel.rateLimitPerUser !==
            newChannel.rateLimitPerUser
        ) {

            changes.push(
                `Slowmode: ${oldChannel.rateLimitPerUser || 0}s → ${newChannel.rateLimitPerUser || 0}s`
            );
        }

        if (!changes.length) {

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
                `มีการแก้ไขห้อง ${newChannel.name}`,

            color:
                COLORS.yellow,

            fields: [

                {

                    name:
                        "📢 ห้อง",

                    value:
                        `${newChannel.name}\n\`${newChannel.id}\``
                },

                {

                    name:
                        "🔧 แก้ไขอะไรบ้าง",

                    value:
                        safeText(
                            changes.join("\n"),
                            1500
                        )
                },

                ...auditFields(audit)
            ]
        });
    }
);

// ============================================================
// ROLE CREATE
// ============================================================

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
                "🎖️ สร้างยศ",

            description:
                `สร้างยศ ${role.name}`,

            color:
                COLORS.green,

            fields: [

                {

                    name:
                        "🎖️ ยศ",

                    value:
                        `${role.name}\n\`${role.id}\``
                },

                {

                    name:
                        "🎨 สี",

                    value:
                        role.hexColor ||
                        "#000000",

                    inline:
                        true
                },

                {

                    name:
                        "📣 Mentionable",

                    value:
                        role.mentionable
                            ? "เปิด"
                            : "ปิด",

                    inline:
                        true
                },

                {

                    name:
                        "📌 แสดงแยก",

                    value:
                        role.hoist
                            ? "เปิด"
                            : "ปิด",

                    inline:
                        true
                },

                ...auditFields(audit)
            ]
        });
    }
);

// ============================================================
// ROLE DELETE
// ============================================================

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
                `ลบยศ ${role.name}`,

            color:
                COLORS.red,

            fields: [

                {

                    name:
                        "🎖️ ยศ",

                    value:
                        `${role.name}\n\`${role.id}\``
                },

                {

                    name:
                        "🎨 สี",

                    value:
                        role.hexColor ||
                        "#000000",

                    inline:
                        true
                },

                ...auditFields(audit)
            ]
        });
    }
);

// ============================================================
// ROLE UPDATE - DETAILED
// ============================================================

client.on(
    "roleUpdate",
    async (
        oldRole,
        newRole
    ) => {

        if (
            newRole.guild.id !==
            SOURCE_GUILD_ID
        ) {

            return;
        }

        const changes =
            getRoleChanges(
                oldRole,
                newRole
            );

        if (
            !changes.length
        ) {

            return;
        }

        const audit =
            await getAuditExecutor(

                newRole.guild,

                AuditLogEvent.RoleUpdate,

                newRole.id
            );

        const fields = [

            {

                name:
                    "🎖️ ยศ",

                value:
                    `${newRole.name}\n\`${newRole.id}\``
            },

            {

                name:
                    "🔧 แก้ไขทั้งหมด",

                value:
                    `${changes.length} รายการ`
            }
        ];

        // ----------------------------------------------------
        // ADD CHANGES
        // ----------------------------------------------------

        for (
            const change of changes
        ) {

            fields.push({

                name:
                    change.name,

                value:
                    change.value
            });
        }

        // ----------------------------------------------------
        // AUDIT
        // ----------------------------------------------------

        fields.push(
            ...auditFields(audit)
        );

        await sendLog({

            key:
                "role_update",

            title:
                "✏️ แก้ไขยศ",

            description:
                `มีการแก้ไขยศ **${newRole.name}**`,

            color:
                COLORS.yellow,

            fields
        });
    }
);

// ============================================================
// GUILD UPDATE
// ============================================================

client.on(
    "guildUpdate",
    async (
        oldGuild,
        newGuild
    ) => {

        if (
            newGuild.id !==
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
                `ชื่อ: ${oldGuild.name} → ${newGuild.name}`
            );
        }

        if (
            oldGuild.description !==
            newGuild.description
        ) {

            changes.push(
                "คำอธิบายเซิร์ฟเวอร์มีการเปลี่ยนแปลง"
            );
        }

        if (
            oldGuild.icon !==
            newGuild.icon
        ) {

            changes.push(
                "ไอคอนเซิร์ฟเวอร์มีการเปลี่ยนแปลง"
            );
        }

        if (
            oldGuild.banner !==
            newGuild.banner
        ) {

            changes.push(
                "Banner เซิร์ฟเวอร์มีการเปลี่ยนแปลง"
            );
        }

        if (!changes.length) {

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
                "มีการเปลี่ยนแปลงข้อมูลเซิร์ฟเวอร์",

            color:
                COLORS.yellow,

            fields: [

                {

                    name:
                        "🏠 เซิร์ฟเวอร์",

                    value:
                        `${newGuild.name}\n\`${newGuild.id}\``
                },

                {

                    name:
                        "🔧 การเปลี่ยนแปลง",

                    value:
                        safeText(
                            changes.join("\n"),
                            1500
                        )
                },

                ...auditFields(audit)
            ]
        });
    }
);

// ============================================================
// EMOJI CREATE
// ============================================================

client.on(
    "emojiCreate",
    async emoji => {

        if (
            emoji.guild.id !==
            SOURCE_GUILD_ID
        ) {

            return;
        }

        const audit =
            await getAuditExecutor(

                emoji.guild,

                AuditLogEvent.EmojiCreate,

                emoji.id
            );

        await sendLog({

            key:
                "emoji_create",

            title:
                "😀 เพิ่มอีโมจิ",

            description:
                `เพิ่ม Emoji ${emoji.name}`,

            color:
                COLORS.green,

            fields: [

                {

                    name:
                        "😀 Emoji",

                    value:
                        `${emoji.name}\n\`${emoji.id}\``
                },

                ...auditFields(audit)
            ]
        });
    }
);

// ============================================================
// EMOJI DELETE
// ============================================================

client.on(
    "emojiDelete",
    async emoji => {

        if (
            emoji.guild.id !==
            SOURCE_GUILD_ID
        ) {

            return;
        }

        const audit =
            await getAuditExecutor(

                emoji.guild,

                AuditLogEvent.EmojiDelete,

                emoji.id
            );

        await sendLog({

            key:
                "emoji_delete",

            title:
                "🗑️ ลบอีโมจิ",

            description:
                `ลบ Emoji ${emoji.name}`,

            color:
                COLORS.red,

            fields: [

                {

                    name:
                        "😀 Emoji",

                    value:
                        `${emoji.name || "ไม่ทราบชื่อ"}\n\`${emoji.id}\``
                },

                ...auditFields(audit)
            ]
        });
    }
);

// ============================================================
// STICKER CREATE
// ============================================================

client.on(
    "stickerCreate",
    async sticker => {

        if (
            sticker.guild?.id !==
            SOURCE_GUILD_ID
        ) {

            return;
        }

        const audit =
            await getAuditExecutor(

                sticker.guild,

                AuditLogEvent.StickerCreate,

                sticker.id
            );

        await sendLog({

            key:
                "sticker_create",

            title:
                "🏷️ เพิ่มสติกเกอร์",

            description:
                `เพิ่ม Sticker ${sticker.name}`,

            color:
                COLORS.green,

            fields: [

                {

                    name:
                        "🏷️ Sticker",

                    value:
                        `${sticker.name}\n\`${sticker.id}\``
                },

                ...auditFields(audit)
            ]
        });
    }
);

// ============================================================
// STICKER DELETE
// ============================================================

client.on(
    "stickerDelete",
    async sticker => {

        if (
            sticker.guild?.id !==
            SOURCE_GUILD_ID
        ) {

            return;
        }

        const audit =
            await getAuditExecutor(

                sticker.guild,

                AuditLogEvent.StickerDelete,

                sticker.id
            );

        await sendLog({

            key:
                "sticker_delete",

            title:
                "🗑️ ลบสติกเกอร์",

            description:
                `ลบ Sticker ${sticker.name}`,

            color:
                COLORS.red,

            fields: [

                {

                    name:
                        "🏷️ Sticker",

                    value:
                        `${sticker.name || "ไม่ทราบชื่อ"}\n\`${sticker.id}\``
                },

                ...auditFields(audit)
            ]
        });
    }
);

// ============================================================
// INVITE DELETE
// ============================================================

client.on(
    "inviteDelete",
    async invite => {

        if (
            invite.guild?.id !==
            SOURCE_GUILD_ID
        ) {

            return;
        }

        const audit =
            await getAuditExecutor(

                invite.guild,

                AuditLogEvent.InviteDelete
            );

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
                        invite.code ||
                        "ไม่ทราบ"
                },

                {

                    name:
                        "📢 ห้อง",

                    value:
                        invite.channel
                            ? `${invite.channel}`
                            : "ไม่ทราบ"
                },

                ...auditFields(audit)
            ]
        });
    }
);

// ============================================================
// WEBHOOK UPDATE
// ============================================================

client.on(
    "webhookUpdate",
    async channel => {

        if (
            channel.guild?.id !==
            SOURCE_GUILD_ID
        ) {

            return;
        }

        const createAudit =
            await getAuditExecutor(

                channel.guild,

                AuditLogEvent.WebhookCreate
            );

        if (createAudit) {

            await sendLog({

                key:
                    "webhook_create",

                title:
                    "🔗 สร้าง Webhook",

                description:
                    `มีการสร้าง Webhook ใน ${channel}`,

                color:
                    COLORS.green,

                fields: [

                    {

                        name:
                            "📢 ห้อง",

                        value:
                            `${channel.name}\n\`${channel.id}\``
                    },

                    ...auditFields(
                        createAudit
                    )
                ]
            });

            return;
        }

        const deleteAudit =
            await getAuditExecutor(

                channel.guild,

                AuditLogEvent.WebhookDelete
            );

        if (deleteAudit) {

            await sendLog({

                key:
                    "webhook_delete",

                title:
                    "🗑️ ลบ Webhook",

                description:
                    `มีการลบ Webhook ใน ${channel}`,

                color:
                    COLORS.red,

                fields: [

                    {

                        name:
                            "📢 ห้อง",

                        value:
                            `${channel.name}\n\`${channel.id}\``
                    },

                    ...auditFields(
                        deleteAudit
                    )
                ]
            });
        }
    }
);

// ============================================================
// PRESENCE UPDATE
// ============================================================

client.on(
    "presenceUpdate",
    async (
        oldPresence,
        newPresence
    ) => {

        const guild =
            newPresence.guild ||
            oldPresence?.guild;

        if (!guild) {

            return;
        }

        if (
            guild.id !==
            SOURCE_GUILD_ID
        ) {

            return;
        }

        const online =
            getOnlineCount(
                guild
            );

        const oldCount =
            lastPresenceCount.get(
                guild.id
            );

        if (
            oldCount === undefined ||
            oldCount === online
        ) {

            lastPresenceCount.set(
                guild.id,
                online
            );

            return;
        }

        lastPresenceCount.set(
            guild.id,
            online
        );

        await sendLog({

            key:
                "member_count",

            title:
                "🟢 จำนวนคนออนไลน์",

            description:
                "มีการเปลี่ยนแปลงจำนวนสมาชิกออนไลน์",

            color:
                COLORS.cyan,

            fields: [

                {

                    name:
                        "🟢 ออนไลน์",

                    value:
                        `${online} คน`
                },

                {

                    name:
                        "👥 สมาชิกทั้งหมด",

                    value:
                        `${guild.memberCount} คน`
                }
            ]
        });
    }
);

// ============================================================
// ERROR HANDLER
// ============================================================

client.on(
    "error",
    error => {

        console.error(
            "❌ Discord Client Error:",
            error
        );
    }
);

client.on(
    "shardError",
    error => {

        console.error(
            "❌ Shard Error:",
            error
        );
    }
);

process.on(
    "unhandledRejection",
    error => {

        console.error(
            "❌ Unhandled Promise Rejection:",
            error
        );
    }
);

process.on(
    "uncaughtException",
    error => {

        console.error(
            "❌ Uncaught Exception:",
            error
        );
    }
);

// ============================================================
// DASHBOARD
// ============================================================

app.get(
    "/",
    (req, res) => {

        const uptime =
            process.uptime();

        const days =
            Math.floor(
                uptime / 86400
            );

        const hours =
            Math.floor(
                (uptime % 86400) / 3600
            );

        const minutes =
            Math.floor(
                (uptime % 3600) / 60
            );

        const seconds =
            Math.floor(
                uptime % 60
            );

        const sourceGuild =
            getSourceGuild();

        const status =
            client.isReady()
                ? "🟢 Online"
                : "🟡 Connecting";

        const botName =
            client.user
                ? client.user.tag
                : "กำลังเชื่อมต่อ...";

        const memberCount =
            sourceGuild
                ? sourceGuild.memberCount
                : 0;

        const onlineCount =
            sourceGuild
                ? getOnlineCount(
                    sourceGuild
                )
                : 0;

        res.send(`

<!DOCTYPE html>

<html lang="th">

<head>

<meta charset="UTF-8">

<meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
>

<title>
Meaow Log System V4
</title>

<style>

* {
    box-sizing: border-box;
}

body {

    margin: 0;

    min-height: 100vh;

    font-family:
        Arial,
        "Segoe UI",
        sans-serif;

    background:
        radial-gradient(
            circle at top,
            #202938,
            #0d1117 55%
        );

    color: #ffffff;

    display: flex;

    align-items: center;

    justify-content: center;

    padding: 20px;
}

.card {

    width: 100%;

    max-width: 480px;

    background:
        rgba(
            22,
            27,
            34,
            0.96
        );

    border:
        1px solid #30363d;

    border-radius: 18px;

    padding: 32px;

    box-shadow:
        0 15px 50px
        rgba(
            0,
            0,
            0,
            0.45
        );
}

.logo {

    width: 80px;

    height: 80px;

    border-radius: 50%;

    margin:
        0 auto 15px;

    display: flex;

    align-items: center;

    justify-content: center;

    background: #5865F2;

    font-size: 38px;
}

h1 {

    text-align: center;

    margin:
        0 0 8px;

    font-size: 26px;
}

.subtitle {

    text-align: center;

    color: #8b949e;

    margin-bottom: 25px;
}

.status {

    text-align: center;

    padding: 10px;

    border-radius: 10px;

    background:
        rgba(
            35,
            134,
            54,
            0.2
        );

    color: #57F287;

    font-weight: bold;

    margin-bottom: 25px;
}

.row {

    display: flex;

    justify-content: space-between;

    gap: 15px;

    padding:
        13px 0;

    border-bottom:
        1px solid #30363d;
}

.row:last-child {

    border-bottom: none;
}

.label {

    color: #8b949e;
}

.value {

    text-align: right;

    font-weight: bold;
}

.footer {

    margin-top: 25px;

    text-align: center;

    color: #6e7681;

    font-size: 12px;
}

</style>

</head>

<body>

<div class="card">

<div class="logo">
🐱
</div>

<h1>
Meaow Log System V4
</h1>

<div class="subtitle">
Discord Security & Audit Log
</div>

<div class="status">
${status}
</div>

<div class="row">

<div class="label">
🤖 บอท
</div>

<div class="value">
${botName}
</div>

</div>

<div class="row">

<div class="label">
🏠 เซิร์ฟเวอร์
</div>

<div class="value">
${sourceGuild
    ? sourceGuild.name
    : "ไม่พบเซิร์ฟเวอร์"}
</div>

</div>

<div class="row">

<div class="label">
👥 สมาชิก
</div>

<div class="value">
${memberCount}
</div>

</div>

<div class="row">

<div class="label">
🟢 ออนไลน์
</div>

<div class="value">
${onlineCount}
</div>

</div>

<div class="row">

<div class="label">
⏱️ Uptime
</div>

<div class="value">
${days} วัน
${hours} ชม.
${minutes} น.
${seconds} วิ.
</div>

</div>

<div class="footer">

Meaow Log System V4 • ${thaiTime()}

</div>

</div>

</body>

</html>

        `);
    }
);

// ============================================================
// HEALTH CHECK
// ============================================================

app.get(
    "/health",
    (req, res) => {

        res.status(200).json({

            status:
                "ok",

            bot:
                client.isReady(),

            uptime:
                process.uptime(),

            time:
                thaiTime()
        });
    }
);

// ============================================================
// START WEB SERVER
// ============================================================

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `🌐 Dashboard เปิดที่ PORT ${PORT}`
        );
    }
);

// ============================================================
// LOGIN
// ============================================================

console.log(
    "🔐 กำลัง Login Discord..."
);

client.login(
    TOKEN
).catch(error => {

    console.error(
        "❌ Login Discord ไม่สำเร็จ:",
        error.message
    );

    process.exit(1);
});
