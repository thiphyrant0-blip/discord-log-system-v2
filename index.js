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

// ======================================================
// CONFIG
// ======================================================

const TOKEN = process.env.TOKEN;
const SOURCE_GUILD_ID = process.env.SOURCE_GUILD_ID;
const LOG_GUILD_ID = process.env.LOG_GUILD_ID;

if (!TOKEN || !SOURCE_GUILD_ID || !LOG_GUILD_ID) {
    console.error("❌ .env ตั้งค่าไม่ครบ");
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

    return new Date().toLocaleString("th-TH", {
        timeZone: "Asia/Bangkok",
        dateStyle: "medium",
        timeStyle: "medium"
    });
}

// ======================================================
// SAFE TEXT
// ======================================================

function safeText(text, max = 900) {

    if (
        text === null ||
        text === undefined ||
        text === ""
    ) {
        return "ไม่มีข้อมูล";
    }

    text = String(text);

    if (text.length > max) {
        return text.substring(0, max) + "...";
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

    const guild = getLogGuild();

    if (!guild) {
        return null;
    }

    for (
        const [categoryName, channels]
        of Object.entries(LOG_STRUCTURE)
    ) {

        const found = channels.find(
            item => item[1] === key
        );

        if (!found) {
            continue;
        }

        const channelName = found[0];

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
                channel.parentId === category.id &&
                channel.name === `・${channelName}`
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

            embed.addFields(fields);
        }

        if (thumbnail) {

            embed.setThumbnail(
                thumbnail
            );
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

        const now = Date.now();

        const entry =
            logs.entries.find(log => {

                const age =
                    now - log.createdTimestamp;

                if (age > 15000) {
                    return false;
                }

                if (
                    targetId &&
                    log.target?.id &&
                    log.target.id !== targetId
                ) {

                    return false;
                }

                return true;
            });

        if (!entry) {
            return null;
        }

        return {
            user: entry.executor,
            reason:
                entry.reason ||
                "ไม่ได้ระบุเหตุผล",
            entry
        };

    } catch (error) {

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
            name: "👮 ผู้ดำเนินการ",
            value:
                userInfo(audit.user),
            inline: true
        },

        {
            name: "📝 เหตุผล",
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
        const [categoryName, channels]
        of Object.entries(LOG_STRUCTURE)
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

        // ----------------------------------------------
        // CREATE CATEGORY
        // ----------------------------------------------

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

        // ----------------------------------------------
        // CREATE CHANNELS
        // ----------------------------------------------

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
                `    └─ ✅ สร้าง #${fullName}`
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
        "===================================="
    );
}

// ======================================================
// READY
// ======================================================

client.once("ready", async () => {

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
});

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

        // Bot

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
// MEMBER LEAVE (Fixed)
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

        // Kick

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

        // Bot Leave
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

            return;
        }

        // Normal Leave

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

        // Image

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

        // Video

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

        // Join

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

        // Leave

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
                            oldState.channel.name
                    }

                ]

            });

            return;
        }

        // Move

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

        // Self Mute

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

        // Self Deaf

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
    }
);

// ======================================================
// LOGIN
// ======================================================

client.login(TOKEN);
