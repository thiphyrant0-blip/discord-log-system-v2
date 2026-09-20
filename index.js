require("dotenv").config();

const {
  Client, GatewayIntentBits, Partials, EmbedBuilder,
  ChannelType, PermissionFlagsBits, AuditLogEvent
} = require("discord.js");
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;
const TOKEN = process.env.TOKEN;
const SOURCE_GUILD_ID = process.env.SOURCE_GUILD_ID;
const LOG_GUILD_ID = process.env.LOG_GUILD_ID;

if (!TOKEN || !SOURCE_GUILD_ID || !LOG_GUILD_ID) {
  console.error("❌ ENV ไม่ครบ: TOKEN / SOURCE_GUILD_ID / LOG_GUILD_ID");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildInvites, GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.GuildEmojisAndStickers, GatewayIntentBits.GuildPresences
  ],
  partials: [Partials.Channel, Partials.Message, Partials.GuildMember, Partials.User]
});

const LOG_STRUCTURE = {
  "LOG-MEMBER": [
    ["สถานะบอท","bot_status"],["คนเข้าเซิร์ฟเวอร์","member_join"],
    ["คนออกเซิร์ฟเวอร์","member_leave"],["จำนวนสมาชิก","member_count"]
  ],
  "LOG-VOICE": [
    ["เปิด-ปิดดูเซิร์ฟเวอร์","voice_server"],["เปลี่ยนชื่อเล่น","nickname"],
    ["อัปเดตสถานะเสียง","voice_status"],["เปิด-ปิดไมค์เซิร์ฟเวอร์","server_mute"],
    ["ตัดการเชื่อมต่อ","voice_disconnect"],["เปิด-ปิดไมค์","voice_mute"],
    ["เปิด-ปิดหู","voice_deaf"],["เข้าห้อง","voice_join"],
    ["เปิด-ปิดกล้อง","camera"],["เปิด-ปิดสตรีมจอ","stream"],
    ["ออกห้อง","voice_leave"],["ย้ายห้อง","voice_move"],
    ["ย้ายคน","voice_move_member"]
  ],
  "LOG-MODERATOR": [
    ["แบน","ban"],["แบน-blacklist","blacklist_ban"],
    ["ปลด-blacklist","blacklist_unban"],["ปลดแบน","unban"],
    ["หมดเวลา","timeout"],["เตะ","kick"]
  ],
  "LOG-MESSAGE": [
    ["แก้ไขข้อความ","message_edit"],["ลบข้อความ","message_delete"],
    ["ลบรูปภาพ","image_delete"],["ลบวิดีโอ","video_delete"]
  ],
  "LOG-GENERAL": [
    ["แก้ไขเซิร์ฟเวอร์","guild_update"],["ลบฟอร์ม","form_delete"],
    ["ลบบอท","bot_delete"],["ลบเชิญ","invite_delete"],
    ["ใส่ยศ-ถอดยศรวม","role_update_member"],["สร้างฟอร์ม","form_create"],
    ["ลบสติกเกอร์","sticker_delete"],["แก้ไขฟอร์ม","form_update"],
    ["สร้างเวที","stage_create"],["ลบประกาศ","announcement_delete"],
    ["สร้างประกาศ","announcement_create"],["แก้ไขยศ","role_update"],
    ["ลบยศ","role_delete"],["สร้างห้อง","channel_create"],
    ["เพิ่มบอท","bot_add"],["สร้างยศ","role_create"],
    ["สร้างwebhook","webhook_create"],["ลบwebhook","webhook_delete"],
    ["ใส่ยศ","role_add"],["ลบห้อง","channel_delete"],
    ["ถอดยศ","role_remove"],["แก้ไขห้อง","channel_update"],
    ["เพิ่มอีโมจิ","emoji_create"],["ลบอีโมจิ","emoji_delete"],
    ["เพิ่มสติกเกอร์","sticker_create"]
  ]
};

const ICON = {
  "LOG-MEMBER":"📋","LOG-VOICE":"🔊","LOG-MODERATOR":"🔨",
  "LOG-MESSAGE":"💬","LOG-GENERAL":"⚙️"
};
const C = {
  green:0x57F287, red:0xED4245, blue:0x5865F2, yellow:0xFEE75C,
  purple:0x9B59B6, orange:0xF97316, cyan:0x00B8D9, gray:0x747F8D
};

const auditCache = new Map();
const lastMemberCount = new Map();
const lastPresenceCount = new Map();
const messageCache = new Map();
const MAX_CACHE = 5000;

const source = () => client.guilds.cache.get(SOURCE_GUILD_ID);
const logGuild = () => client.guilds.cache.get(LOG_GUILD_ID);
const thaiTime = () => new Date().toLocaleString("th-TH", {
  timeZone:"Asia/Bangkok", dateStyle:"medium", timeStyle:"medium"
});
function safe(v,max=900) {
  if (v === null || v === undefined || v === "") return "ไม่มีข้อมูล";
  v = String(v);
  return v.length > max ? v.slice(0,max)+"..." : v;
}
function userInfo(u) {
  return u ? `${u.tag || u.username || "Unknown"}\n\`${u.id}\`` : "ไม่ทราบข้อมูล";
}
function onlineCount(g) {
  let n=0;
  g.members.cache.forEach(m => { if (m.presence && m.presence.status !== "offline") n++; });
  return n;
}

function findLogChannel(key) {
  const g = logGuild();
  if (!g) return null;
  for (const [cat, items] of Object.entries(LOG_STRUCTURE)) {
    const item = items.find(x => x[1] === key);
    if (!item) continue;
    const category = g.channels.cache.find(c =>
      c.type === ChannelType.GuildCategory &&
      c.name.trim() === `${ICON[cat]} ${cat}`.trim()
    );
    if (!category) return null;
    return g.channels.cache.find(c =>
      c.type === ChannelType.GuildText &&
      c.parentId === category.id &&
      c.name.trim() === `・${item[0]}`.trim()
    ) || null;
  }
  return null;
}

async function sendLog({key,title,description,color=C.blue,fields=[],thumbnail=null,image=null}) {
  try {
    const ch = findLogChannel(key);
    if (!ch) { console.log(`⚠️ ไม่พบห้อง Log: ${key}`); return; }
    const e = new EmbedBuilder().setTitle(safe(title,256)).setColor(color)
      .setTimestamp().setFooter({text:`Meaow Log V4.1 • ${thaiTime()}`});
    if (description) e.setDescription(safe(description,4000));
    if (fields.length) e.addFields(fields.slice(0,25).map(f => ({
      name:safe(f.name,256), value:safe(f.value,1024), inline:!!f.inline
    })));
    if (thumbnail) e.setThumbnail(thumbnail);
    if (image) e.setImage(image);
    await ch.send({embeds:[e]});
  } catch(e) { console.error(`❌ ส่ง Log [${key}] ไม่สำเร็จ:`,e.message); }
}

async function audit(guild, action, targetId=null) {
  try {
    if (!guild.members.me) await guild.members.fetchMe().catch(()=>{});
    if (!guild.members.me?.permissions.has(PermissionFlagsBits.ViewAuditLog)) return null;
    const k = `${guild.id}:${action}:${targetId||"none"}`;
    const old = auditCache.get(k);
    if (old && Date.now()-old.time < 2500) return old.data;
    const logs = await guild.fetchAuditLogs({type:action,limit:10});
    const now = Date.now();
    const entry = logs.entries.find(x =>
      now-x.createdTimestamp <= 15000 &&
      (!targetId || !x.target?.id || x.target.id === targetId)
    );
    if (!entry) return null;
    const data = {user:entry.executor,reason:entry.reason||"ไม่ได้ระบุเหตุผล",entry};
    auditCache.set(k,{time:Date.now(),data});
    return data;
  } catch(e) { return null; }
}
function auditFields(a) {
  return a ? [
    {name:"👮 ผู้ดำเนินการ",value:userInfo(a.user),inline:true},
    {name:"📝 เหตุผล",value:safe(a.reason,300),inline:true}
  ] : [];
}

async function setupLogSystem(guild) {
  for (const [cat,items] of Object.entries(LOG_STRUCTURE)) {
    const catName = `${ICON[cat]} ${cat}`;
    let category = guild.channels.cache.find(c =>
      c.type===ChannelType.GuildCategory && c.name.trim()===catName.trim()
    );
    if (!category) {
      try {
        category = await guild.channels.create({
          name:catName,type:ChannelType.GuildCategory,
          permissionOverwrites:[
            {id:guild.roles.everyone.id,deny:[PermissionFlagsBits.ViewChannel]},
            {id:client.user.id,allow:[
              PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.EmbedLinks,PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.ManageChannels
            ]}
          ]
        });
      } catch(e) { console.error("❌ สร้าง Category:",e.message); continue; }
    }
    for (const [name] of items) {
      const full=`・${name}`;
      let ch=guild.channels.cache.find(c =>
        c.type===ChannelType.GuildText && c.parentId===category.id &&
        c.name.trim()===full.trim()
      );
      if (!ch) {
        try {
          await guild.channels.create({
            name:full,type:ChannelType.GuildText,parent:category.id,
            permissionOverwrites:[
              {id:guild.roles.everyone.id,deny:[
                PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages
              ]},
              {id:client.user.id,allow:[
                PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.EmbedLinks,PermissionFlagsBits.ReadMessageHistory
              ]}
            ]
          });
        } catch(e) { console.error(`❌ สร้าง ${full}:`,e.message); }
      }
    }
  }
  console.log("🔍 ตรวจสอบห้อง Log:");
  let ok=0,bad=0;
  for (const [cat,items] of Object.entries(LOG_STRUCTURE)) {
    for (const [name,key] of items) {
      if (findLogChannel(key)) { ok++; console.log(`  ✅ ${key}`); }
      else { bad++; console.log(`  ❌ ${key}`); }
    }
  }
  console.log(`✅ พร้อม ${ok} ห้อง | ❌ มีปัญหา ${bad} ห้อง`);
}

async function updateVoiceCountRealtime(guild) {
  try {
    const CHANNEL_ID = process.env.VOICE_COUNT_CHANNEL_ID || "1551177753808867418";
    const statChannel = await guild.channels.fetch(CHANNEL_ID).catch(() => null);

    if (!statChannel) {
      console.error(`❌ ไม่พบห้องนับคนลงห้อง: ${CHANNEL_ID}`);
      return;
    }

    // นับสมาชิกจาก VoiceState ของทุกห้องในเซิร์ฟเวอร์
    // 1 สมาชิก = 1 ครั้ง และไม่นับบอท
    let count = 0;
    for (const [, voiceState] of guild.voiceStates.cache) {
      if (!voiceState.channelId) continue;
      const member = voiceState.member || guild.members.cache.get(voiceState.id);
      if (member?.user?.bot) continue;
      count++;
    }

    const newName = `👥 คนลงห้อง : ${count}`;

    console.log(`🔊 VOICE COUNT = ${count} | ${newName}`);

    if (statChannel.name !== newName) {
      await statChannel.setName(newName, "อัปเดตจำนวนสมาชิกใน Voice ทุกห้อง");
      console.log(`✅ เปลี่ยนชื่อห้องเป็น: ${newName}`);
    }
  } catch (err) {
    console.error("❌ updateVoiceCountRealtime:", err);
  }
}

function roleChanges(oldR,newR) {
  const out=[];
  if(oldR.name!==newR.name) out.push({name:"✏️ ชื่อยศ",value:`ก่อน: **${safe(oldR.name,100)}**\nหลัง: **${safe(newR.name,100)}**`});
  if(oldR.color!==newR.color) out.push({name:"🎨 สี",value:`ก่อน: \`${oldR.hexColor}\`\nหลัง: \`${newR.hexColor}\``});
  if(oldR.mentionable!==newR.mentionable) out.push({name:"📣 Mentionable",value:`ก่อน: ${oldR.mentionable?"เปิด":"ปิด"}\nหลัง: ${newR.mentionable?"เปิด":"ปิด"}`});
  if(oldR.hoist!==newR.hoist) out.push({name:"📌 แสดงแยก",value:`ก่อน: ${oldR.hoist?"เปิด":"ปิด"}\nหลัง: ${newR.hoist?"เปิด":"ปิด"}`});
  if(oldR.position!==newR.position) out.push({name:"↕️ ตำแหน่ง",value:`ก่อน: ${oldR.position}\nหลัง: ${newR.position}`});
  const a=oldR.permissions.toArray(),b=newR.permissions.toArray();
  const add=b.filter(x=>!a.includes(x)),rem=a.filter(x=>!b.includes(x));
  if(add.length) out.push({name:"🟢 เพิ่มสิทธิ์",value:safe(add.join("\n"),1000)});
  if(rem.length) out.push({name:"🔴 ลบสิทธิ์",value:safe(rem.join("\n"),1000)});
  return out;
}

client.once("ready",async()=>{
  console.log(`🤖 ${client.user.tag} | MEAOW LOG SYSTEM V4.1`);
  const sg=source(), lg=logGuild();
  if(!sg || !lg){ console.error("❌ ไม่พบ SOURCE_GUILD_ID หรือ LOG_GUILD_ID"); return; }
  await setupLogSystem(lg);
  await sg.channels.fetch().catch(()=>{});
  await updateVoiceCountRealtime(sg);
  setInterval(() => updateVoiceCountRealtime(sg), 2000);
  await sg.members.fetch().catch(()=>{});
  lastMemberCount.set(sg.id,sg.memberCount);
  lastPresenceCount.set(sg.id,onlineCount(sg));
  await sendLog({
    key:"bot_status",title:"🟢 LOG SYSTEM V4.1 ONLINE",
    description:"ระบบ Log ออนไลน์และพร้อมใช้งาน",
    color:C.green,
    fields:[
      {name:"🏠 ดิสหลัก",value:`${sg.name}\n\`${sg.id}\``,inline:true},
      {name:"📋 ดิส Log",value:`${lg.name}\n\`${lg.id}\``,inline:true},
      {name:"👥 สมาชิก",value:`${sg.memberCount}`,inline:true},
      {name:"🟢 ออนไลน์",value:`${onlineCount(sg)}`,inline:true}
    ]
  });
});

client.on("guildMemberAdd",async m=>{
  if(m.guild.id!==SOURCE_GUILD_ID)return;
  await sendLog({key:"member_join",title:"📥 สมาชิกเข้าเซิร์ฟเวอร์",description:`${m} เข้าร่วมเซิร์ฟเวอร์`,color:C.green,thumbnail:m.user.displayAvatarURL({size:256}),fields:[
    {name:"👤 สมาชิก",value:userInfo(m.user)},{name:"👥 สมาชิกทั้งหมด",value:`${m.guild.memberCount}`,inline:true}
  ]});
  if(m.user.bot) await sendLog({key:"bot_add",title:"🤖 เพิ่มบอทเข้าเซิร์ฟเวอร์",description:`${m.user.tag} ถูกเพิ่มเข้าสู่เซิร์ฟเวอร์`,color:C.purple,fields:[{name:"🤖 Bot",value:userInfo(m.user)}]});
  lastMemberCount.set(m.guild.id,m.guild.memberCount);
  await sendLog({key:"member_count",title:"👥 จำนวนสมาชิกเปลี่ยนแปลง",description:"มีสมาชิกใหม่เข้ามา",color:C.green,fields:[{name:"จำนวน",value:`${m.guild.memberCount} คน`}]});
});

client.on("guildMemberRemove",async m=>{
  if(m.guild.id!==SOURCE_GUILD_ID)return;
  const k=await audit(m.guild,AuditLogEvent.MemberKick,m.id);
  if(k) await sendLog({key:"kick",title:"👢 เตะสมาชิก",description:`${m.user?.tag||"สมาชิก"} ถูกเตะ`,color:C.red,fields:[{name:"👤 ผู้ถูกเตะ",value:userInfo(m.user)},...auditFields(k)]});
  else if(m.user?.bot) await sendLog({key:"bot_delete",title:"🤖 บอทออกจากเซิร์ฟเวอร์",description:`${m.user.tag} ออกจากเซิร์ฟเวอร์`,color:C.red,fields:[{name:"🤖 Bot",value:userInfo(m.user)}]});
  else await sendLog({key:"member_leave",title:"📤 สมาชิกออกจากเซิร์ฟเวอร์",description:`${m.user?.tag||"สมาชิก"} ออกจากเซิร์ฟเวอร์`,color:C.red,thumbnail:m.user?.displayAvatarURL({size:256}),fields:[{name:"👤 สมาชิก",value:userInfo(m.user)}]});
  lastMemberCount.set(m.guild.id,m.guild.memberCount);
  await sendLog({key:"member_count",title:"👥 จำนวนสมาชิกเปลี่ยนแปลง",description:"สมาชิกออกจากเซิร์ฟเวอร์",color:C.red,fields:[{name:"จำนวน",value:`${m.guild.memberCount} คน`}]});
});

client.on("guildMemberUpdate",async(o,n)=>{
  if(n.guild.id!==SOURCE_GUILD_ID)return;
  if(o.nickname!==n.nickname) await sendLog({key:"nickname",title:"✏️ เปลี่ยนชื่อเล่น",description:`${n.user.tag} เปลี่ยนชื่อเล่น`,color:C.yellow,fields:[
    {name:"👤 สมาชิก",value:userInfo(n.user)},{name:"ก่อน",value:o.nickname||"ไม่มีชื่อเล่น"},{name:"หลัง",value:n.nickname||"ไม่มีชื่อเล่น"}
  ]});
  const oldR=new Set(o.roles.cache.keys()),newR=new Set(n.roles.cache.keys());
  const add=[...newR].filter(x=>!oldR.has(x)),rem=[...oldR].filter(x=>!newR.has(x));
  for(const id of add){if(id===n.guild.id)continue;const r=n.guild.roles.cache.get(id);if(!r)continue;
    const a=await audit(n.guild,AuditLogEvent.MemberRoleUpdate,n.id);
    await sendLog({key:"role_add",title:"➕ เพิ่มยศ",description:`${n.user.tag} ได้รับยศ ${r.name}`,color:C.green,fields:[{name:"👤 สมาชิก",value:userInfo(n.user)},{name:"🎖️ ยศ",value:`${r.name}\n\`${r.id}\``},...auditFields(a)]});
  }
  for(const id of rem){if(id===n.guild.id)continue;const r=n.guild.roles.cache.get(id);if(!r)continue;
    const a=await audit(n.guild,AuditLogEvent.MemberRoleUpdate,n.id);
    await sendLog({key:"role_remove",title:"➖ ถอดยศ",description:`${n.user.tag} ถูกถอดยศ ${r.name}`,color:C.red,fields:[{name:"👤 สมาชิก",value:userInfo(n.user)},{name:"🎖️ ยศ",value:`${r.name}\n\`${r.id}\``},...auditFields(a)]});
  }
  if(add.length||rem.length) await sendLog({key:"role_update_member",title:"🎖️ อัปเดตยศสมาชิก",description:`มีการเปลี่ยนแปลงยศของ ${n.user.tag}`,color:C.purple,fields:[
    {name:"👤 สมาชิก",value:userInfo(n.user)},
    {name:"➕ เพิ่ม",value:add.map(x=>n.guild.roles.cache.get(x)?.name||x).join(", ")||"ไม่มี"},
    {name:"➖ ถอด",value:rem.map(x=>o.guild.roles.cache.get(x)?.name||x).join(", ")||"ไม่มี"}
  ]});
  const ot=o.communicationDisabledUntilTimestamp,nt=n.communicationDisabledUntilTimestamp;
  if(ot!==nt) await sendLog({key:"timeout",title:nt?"⏱️ Timeout":"✅ ยกเลิก Timeout",description:nt?`${n.user.tag} ถูก Timeout`:`${n.user.tag} พ้น Timeout แล้ว`,color:nt?C.orange:C.green,fields:[
    {name:"👤 สมาชิก",value:userInfo(n.user)},...(nt?[{name:"⏰ สิ้นสุด",value:`<t:${Math.floor(nt/1000)}:F>`}]:[])
  ]});
});

client.on("messageCreate",m=>{
  if(!m.guild||m.guild.id!==SOURCE_GUILD_ID||m.author.bot)return;
  const files=[...m.attachments.values()];
  if(files.length) {
    messageCache.set(m.id,{author:m.author,channelId:m.channel.id,channelName:m.channel.name,content:m.content,attachments:files.map(f=>({name:f.name,url:f.url,size:f.size,type:f.contentType}))});
    if(messageCache.size>MAX_CACHE) messageCache.delete(messageCache.keys().next().value);
  }
});

client.on("messageDelete",async m=>{
  if(!m.guild||m.guild.id!==SOURCE_GUILD_ID)return;
  const saved=messageCache.get(m.id);
  const author=m.author||saved?.author;
  const attachments=saved?.attachments || [...m.attachments.values()].map(f=>({name:f.name,url:f.url,size:f.size,type:f.contentType}));
  if(author?.bot)return;
  const ch=m.channel||{name:saved?.channelName||"ไม่ทราบ",id:saved?.channelId||"ไม่ทราบ"};
  await sendLog({key:"message_delete",title:"🗑️ ลบข้อความ",description:`มีการลบข้อความใน #${ch.name}`,color:C.red,fields:[
    {name:"👤 ผู้ส่ง",value:userInfo(author)},{name:"📢 ห้อง",value:`#${ch.name}\n\`${ch.id}\``},
    {name:"💬 ข้อความ",value:m.content?`\`\`\`\n${safe(m.content,700)}\n\`\`\``:saved?.content?`\`\`\`\n${safe(saved.content,700)}\n\`\`\``:"ไม่มีข้อความ"},
    {name:"📎 ไฟล์แนบ",value:`${attachments.length} ไฟล์`}
  ]});
  for(const f of attachments){
    const type=(f.type||"").toLowerCase();
    if(type.startsWith("image/")||/\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(f.name||""))
      await sendLog({key:"image_delete",title:"🖼️ ลบรูปภาพ",description:`${author?.tag||"สมาชิก"} ลบรูปภาพ`,color:C.red,image:f.url,fields:[
        {name:"👤 ผู้ลบ / ผู้ส่ง",value:userInfo(author)},{name:"🖼️ ชื่อรูป",value:`\`${safe(f.name||"ไม่ทราบ",200)}\``},
        {name:"📦 ขนาด",value:f.size?`${(f.size/1024/1024).toFixed(2)} MB`:"ไม่ทราบ",inline:true},
        {name:"📄 ประเภท",value:f.type||"ไม่ทราบ",inline:true},{name:"🔗 URL",value:safe(f.url||"ไม่พบ URL",1000)}
      ]});
    if(type.startsWith("video/")||/\.(mp4|mov|webm|avi|mkv)$/i.test(f.name||""))
      await sendLog({key:"video_delete",title:"🎥 ลบวิดีโอ",description:`${author?.tag||"สมาชิก"} ลบวิดีโอ`,color:C.red,fields:[
        {name:"👤 ผู้ลบ / ผู้ส่ง",value:userInfo(author)},{name:"🎥 ชื่อวิดีโอ",value:`\`${safe(f.name||"ไม่ทราบ",200)}\``},
        {name:"📦 ขนาด",value:f.size?`${(f.size/1024/1024).toFixed(2)} MB`:"ไม่ทราบ"},{name:"🔗 URL",value:safe(f.url||"ไม่พบ URL",1000)}
      ]});
  }
  messageCache.delete(m.id);
});

client.on("messageDeleteBulk",async messages=>{
  const m=messages.first(); if(!m?.guild||m.guild.id!==SOURCE_GUILD_ID)return;
  const a=await audit(m.guild,AuditLogEvent.MessageBulkDelete);
  await sendLog({key:"message_delete",title:"🗑️ ลบข้อความหลายรายการ",description:`มีการลบข้อความ ${messages.size} รายการ`,color:C.red,fields:[
    {name:"📢 ห้อง",value:`${m.channel}\n\`${m.channel.id}\``},{name:"🗑️ จำนวน",value:`${messages.size} รายการ`},...auditFields(a)
  ]});
});

client.on("messageUpdate",async(o,n)=>{
  if(!o.guild||o.guild.id!==SOURCE_GUILD_ID||o.author?.bot)return;
  if(o.partial)await o.fetch().catch(()=>{});
  if(n.partial)await n.fetch().catch(()=>{});
  if(o.content===n.content)return;
  await sendLog({key:"message_edit",title:"✏️ แก้ไขข้อความ",description:`มีการแก้ไขข้อความใน ${n.channel}`,color:C.yellow,fields:[
    {name:"👤 ผู้ใช้",value:userInfo(n.author)},{name:"📢 ห้อง",value:`${n.channel}\n\`${n.channel.id}\``},
    {name:"ก่อนแก้ไข",value:`\`\`\`\n${safe(o.content,600)}\n\`\`\``},{name:"หลังแก้ไข",value:`\`\`\`\n${safe(n.content,600)}\n\`\`\``}
  ]});
});

client.on("voiceStateUpdate",async(o,n)=>{
  if(o.guild.id!==SOURCE_GUILD_ID)return;
  await updateVoiceCountRealtime(n.guild);
  const m=n.member||o.member;if(!m)return;
  if(!o.channel&&n.channel) await sendLog({key:"voice_join",title:"🎙️ เข้าห้อง",description:`${m.user.tag} เข้าห้องเสียง`,color:C.green,fields:[{name:"👤 สมาชิก",value:userInfo(m.user)},{name:"🔊 ห้อง",value:n.channel.name}]});
  if(o.channel&&!n.channel){
    const a=await audit(o.guild,AuditLogEvent.MemberDisconnect,m.id);
    await sendLog({key:a?"voice_disconnect":"voice_leave",title:a?"🔌 ตัดการเชื่อมต่อ":"📴 ออกจากห้อง",description:`${m.user.tag} ${a?"ถูกตัดการเชื่อมต่อ":"ออกจากห้องเสียง"}`,color:C.red,fields:[{name:"👤 สมาชิก",value:userInfo(m.user)},{name:"🔊 ห้อง",value:o.channel.name},...auditFields(a)]});
  }
  if(o.channel&&n.channel&&o.channel.id!==n.channel.id){
    const a=await audit(n.guild,AuditLogEvent.MemberMove,m.id);
    await sendLog({key:a?"voice_move_member":"voice_move",title:a?"🔄 แอดมินย้ายสมาชิก":"🔄 ย้ายห้อง",description:`${m.user.tag} ย้ายห้อง`,color:C.blue,fields:[
      {name:"👤 สมาชิก",value:userInfo(m.user)},{name:"🔊 จาก",value:o.channel.name},{name:"🔊 ไป",value:n.channel.name},...auditFields(a)
    ]});
  }
  if(o.selfMute!==n.selfMute) await sendLog({key:"voice_mute",title:n.selfMute?"🔇 ปิดไมค์":"🎤 เปิดไมค์",description:`${m.user.tag} ${n.selfMute?"ปิด":"เปิด"}ไมค์`,color:C.blue,fields:[{name:"👤 สมาชิก",value:userInfo(m.user)}]});
  if(o.serverMute!==n.serverMute){const a=await audit(n.guild,AuditLogEvent.MemberUpdate,m.id);await sendLog({key:"server_mute",title:n.serverMute?"🔇 ปิดไมค์เซิร์ฟเวอร์":"🎤 เปิดไมค์เซิร์ฟเวอร์",description:`${m.user.tag}`,color:C.orange,fields:[{name:"👤 สมาชิก",value:userInfo(m.user)},...auditFields(a)]});}
  if(o.selfDeaf!==n.selfDeaf) await sendLog({key:"voice_deaf",title:n.selfDeaf?"🙉 ปิดหู":"🎧 เปิดหู",description:`${m.user.tag}`,color:C.blue,fields:[{name:"👤 สมาชิก",value:userInfo(m.user)}]});
  if(o.streaming!==n.streaming) await sendLog({key:"stream",title:n.streaming?"🖥️ เปิดสตรีมจอ":"🖥️ ปิดสตรีมจอ",description:`${m.user.tag}`,color:C.purple,fields:[{name:"👤 สมาชิก",value:userInfo(m.user)},{name:"🔊 ห้อง",value:n.channel?.name||o.channel?.name||"ไม่ทราบ"}]});
  if(o.selfVideo!==n.selfVideo) await sendLog({key:"camera",title:n.selfVideo?"📹 เปิดกล้อง":"📷 ปิดกล้อง",description:`${m.user.tag}`,color:C.cyan,fields:[{name:"👤 สมาชิก",value:userInfo(m.user)}]});
  if(o.suppress!==n.suppress) await sendLog({key:"voice_status",title:"🔊 อัปเดตสถานะเสียง",description:`${m.user.tag}`,color:C.cyan,fields:[{name:"สถานะ",value:n.suppress?"ถูก Suppress":"ยกเลิก Suppress"}]});
});

client.on("guildBanAdd",async b=>{
  if(b.guild.id!==SOURCE_GUILD_ID)return;const a=await audit(b.guild,AuditLogEvent.MemberBanAdd,b.user.id);
  const bl=(a?.reason||"").toLowerCase().includes("blacklist");
  await sendLog({key:bl?"blacklist_ban":"ban",title:bl?"🚫 แบน BLACKLIST":"🔨 แบนสมาชิก",description:`${b.user.tag} ถูกแบน`,color:C.red,thumbnail:b.user.displayAvatarURL({size:256}),fields:[{name:"👤 ผู้ถูกแบน",value:userInfo(b.user)},...auditFields(a)]});
});
client.on("guildBanRemove",async b=>{
  if(b.guild.id!==SOURCE_GUILD_ID)return;const a=await audit(b.guild,AuditLogEvent.MemberBanRemove,b.user.id);
  const bl=(a?.reason||"").toLowerCase().includes("blacklist");
  await sendLog({key:bl?"blacklist_unban":"unban",title:bl?"✅ ปลด BLACKLIST":"✅ ปลดแบน",description:`${b.user.tag} ถูกปลดแบน`,color:C.green,fields:[{name:"👤 สมาชิก",value:userInfo(b.user)},...auditFields(a)]});
});

client.on("channelCreate",async ch=>{
  if(ch.guild?.id!==SOURCE_GUILD_ID)return;
  let key="channel_create",title="📁 สร้างห้อง";
  if(ch.type===ChannelType.GuildAnnouncement){key="announcement_create";title="📢 สร้างประกาศ";}
  if(ch.type===ChannelType.GuildStageVoice){key="stage_create";title="🎤 สร้างเวที";}
  if(ch.type===ChannelType.GuildForum){key="form_create";title="📝 สร้างฟอร์ม";}
  const a=await audit(ch.guild,AuditLogEvent.ChannelCreate,ch.id);
  await sendLog({key,title,description:`สร้าง ${ch.name}`,color:C.green,fields:[{name:"📢 ห้อง",value:`${ch.name}\n\`${ch.id}\``},{name:"📂 ประเภท",value:`${ch.type}`},...auditFields(a)]});
});
client.on("channelDelete",async ch=>{
  if(ch.guild?.id!==SOURCE_GUILD_ID)return;
  let key="channel_delete",title="🗑️ ลบห้อง";
  if(ch.type===ChannelType.GuildAnnouncement){key="announcement_delete";title="🗑️ ลบประกาศ";}
  if(ch.type===ChannelType.GuildForum){key="form_delete";title="🗑️ ลบฟอร์ม";}
  const a=await audit(ch.guild,AuditLogEvent.ChannelDelete,ch.id);
  await sendLog({key,title,description:`ลบ ${ch.name}`,color:C.red,fields:[{name:"📢 ห้อง",value:`${ch.name}\n\`${ch.id}\``},...auditFields(a)]});
});
client.on("channelUpdate",async(o,n)=>{
  if(n.guild?.id!==SOURCE_GUILD_ID)return;
  const x=[];
  if(o.name!==n.name)x.push(`ชื่อ: ${o.name} → ${n.name}`);
  if(o.parentId!==n.parentId)x.push("หมวดหมู่เปลี่ยน");
  if(o.topic!==n.topic)x.push("Topic เปลี่ยน");
  if(o.rateLimitPerUser!==n.rateLimitPerUser)x.push(`Slowmode: ${o.rateLimitPerUser||0}s → ${n.rateLimitPerUser||0}s`);
  if(o.permissionOverwrites.cache.size!==n.permissionOverwrites.cache.size)x.push("🔐 Permission ของห้องเปลี่ยน");
  if(o.type===ChannelType.GuildForum||n.type===ChannelType.GuildForum) if(x.length)x.push("Forum Channel มีการแก้ไข");
  if(!x.length)return;
  const a=await audit(n.guild,AuditLogEvent.ChannelUpdate,n.id);
  await sendLog({key:n.type===ChannelType.GuildForum?"form_update":"channel_update",title:n.type===ChannelType.GuildForum?"✏️ แก้ไขฟอร์ม":"✏️ แก้ไขห้อง",description:`มีการแก้ไข ${n.name}`,color:C.yellow,fields:[
    {name:"📢 ห้อง",value:`${n.name}\n\`${n.id}\``},{name:"🔧 แก้ไขอะไรบ้าง",value:safe(x.join("\n"),1500)},...auditFields(a)
  ]});
});

client.on("roleCreate",async r=>{
  if(r.guild.id!==SOURCE_GUILD_ID)return;const a=await audit(r.guild,AuditLogEvent.RoleCreate,r.id);
  await sendLog({key:"role_create",title:"🎖️ สร้างยศ",description:`สร้างยศ ${r.name}`,color:C.green,fields:[
    {name:"🎖️ ยศ",value:`${r.name}\n\`${r.id}\``},{name:"🎨 สี",value:r.hexColor,inline:true},{name:"📣 Mentionable",value:r.mentionable?"เปิด":"ปิด",inline:true},...auditFields(a)
  ]});
});
client.on("roleDelete",async r=>{
  if(r.guild.id!==SOURCE_GUILD_ID)return;const a=await audit(r.guild,AuditLogEvent.RoleDelete,r.id);
  await sendLog({key:"role_delete",title:"🗑️ ลบยศ",description:`ลบยศ ${r.name}`,color:C.red,fields:[{name:"🎖️ ยศ",value:`${r.name}\n\`${r.id}\``},...auditFields(a)]});
});
client.on("roleUpdate",async(o,n)=>{
  if(n.guild.id!==SOURCE_GUILD_ID)return;const changes=roleChanges(o,n);if(!changes.length)return;
  const a=await audit(n.guild,AuditLogEvent.RoleUpdate,n.id);
  await sendLog({key:"role_update",title:"✏️ แก้ไขยศ",description:`มีการแก้ไขยศ **${n.name}**`,color:C.yellow,fields:[
    {name:"🎖️ ยศ",value:`${n.name}\n\`${n.id}\``},...changes,...auditFields(a)
  ]});
});

client.on("guildUpdate",async(o,n)=>{
  if(n.id!==SOURCE_GUILD_ID)return;const x=[];
  if(o.name!==n.name)x.push(`ชื่อ: ${o.name} → ${n.name}`);
  if(o.description!==n.description)x.push("คำอธิบายเปลี่ยน");
  if(o.icon!==n.icon)x.push("ไอคอนเปลี่ยน");
  if(o.banner!==n.banner)x.push("Banner เปลี่ยน");
  if(!x.length)return;const a=await audit(n,AuditLogEvent.GuildUpdate,n.id);
  await sendLog({key:"guild_update",title:"⚙️ แก้ไขเซิร์ฟเวอร์",description:"มีการเปลี่ยนแปลงข้อมูลเซิร์ฟเวอร์",color:C.yellow,fields:[
    {name:"🏠 เซิร์ฟเวอร์",value:`${n.name}\n\`${n.id}\``},{name:"🔧 การเปลี่ยนแปลง",value:x.join("\n")},...auditFields(a)
  ]});
});

client.on("emojiCreate",async e=>{
  if(e.guild.id!==SOURCE_GUILD_ID)return;const a=await audit(e.guild,AuditLogEvent.EmojiCreate,e.id);
  await sendLog({key:"emoji_create",title:"😀 เพิ่มอีโมจิ",description:`เพิ่ม Emoji ${e.name}`,color:C.green,fields:[{name:"😀 Emoji",value:`${e.name}\n\`${e.id}\``},...auditFields(a)]});
});
client.on("emojiDelete",async e=>{
  if(e.guild.id!==SOURCE_GUILD_ID)return;const a=await audit(e.guild,AuditLogEvent.EmojiDelete,e.id);
  await sendLog({key:"emoji_delete",title:"🗑️ ลบอีโมจิ",description:`ลบ Emoji ${e.name||"ไม่ทราบชื่อ"}`,color:C.red,fields:[{name:"😀 Emoji",value:`${e.name||"ไม่ทราบชื่อ"}\n\`${e.id}\``},...auditFields(a)]});
});
client.on("stickerCreate",async s=>{
  if(s.guild?.id!==SOURCE_GUILD_ID)return;const a=await audit(s.guild,AuditLogEvent.StickerCreate,s.id);
  await sendLog({key:"sticker_create",title:"🏷️ เพิ่มสติกเกอร์",description:`เพิ่ม Sticker ${s.name}`,color:C.green,fields:[{name:"🏷️ Sticker",value:`${s.name}\n\`${s.id}\``},...auditFields(a)]});
});
client.on("stickerDelete",async s=>{
  if(s.guild?.id!==SOURCE_GUILD_ID)return;const a=await audit(s.guild,AuditLogEvent.StickerDelete,s.id);
  await sendLog({key:"sticker_delete",title:"🗑️ ลบสติกเกอร์",description:`ลบ Sticker ${s.name||"ไม่ทราบชื่อ"}`,color:C.red,fields:[{name:"🏷️ Sticker",value:`${s.name||"ไม่ทราบชื่อ"}\n\`${s.id}\``},...auditFields(a)]});
});
client.on("inviteDelete",async i=>{
  if(i.guild?.id!==SOURCE_GUILD_ID)return;const a=await audit(i.guild,AuditLogEvent.InviteDelete);
  await sendLog({key:"invite_delete",title:"🗑️ ลบเชิญ",description:"มีการลบ Invite",color:C.red,fields:[{name:"🔗 Invite",value:i.code||"ไม่ทราบ"},{name:"📢 ห้อง",value:i.channel?`${i.channel}`:"ไม่ทราบ"},...auditFields(a)]});
});
client.on("webhookUpdate",async ch=>{
  if(ch.guild?.id!==SOURCE_GUILD_ID)return;
  const a=await audit(ch.guild,AuditLogEvent.WebhookCreate);
  if(a) return sendLog({key:"webhook_create",title:"🔗 สร้าง Webhook",description:`มีการสร้าง Webhook ใน ${ch}`,color:C.green,fields:[{name:"📢 ห้อง",value:`${ch.name}\n\`${ch.id}\``},...auditFields(a)]});
  const d=await audit(ch.guild,AuditLogEvent.WebhookDelete);
  if(d) await sendLog({key:"webhook_delete",title:"🗑️ ลบ Webhook",description:`มีการลบ Webhook ใน ${ch}`,color:C.red,fields:[{name:"📢 ห้อง",value:`${ch.name}\n\`${ch.id}\``},...auditFields(d)]});
});

client.on("presenceUpdate",async(o,n)=>{
  const g=n.guild||o?.guild;if(!g||g.id!==SOURCE_GUILD_ID)return;
  const count=onlineCount(g),old=lastPresenceCount.get(g.id);
  if(old===undefined){lastPresenceCount.set(g.id,count);return;}
  if(old===count)return;
  lastPresenceCount.set(g.id,count);
  await sendLog({key:"member_count",title:"🟢 จำนวนคนออนไลน์",description:"มีการเปลี่ยนแปลงจำนวนสมาชิกออนไลน์",color:C.cyan,fields:[
    {name:"🟢 ออนไลน์",value:`${count} คน`,inline:true},{name:"👥 สมาชิกทั้งหมด",value:`${g.memberCount} คน`,inline:true}
  ]});
});

client.on("error",e=>console.error("❌ Discord Client Error:",e));
client.on("shardError",e=>console.error("❌ Shard Error:",e));
process.on("unhandledRejection",e=>console.error("❌ Unhandled Promise Rejection:",e));
process.on("uncaughtException",e=>console.error("❌ Uncaught Exception:",e));

app.get("/",(req,res)=>{
  const g=source(),up=process.uptime(),d=Math.floor(up/86400),h=Math.floor(up%86400/3600),m=Math.floor(up%3600/60),s=Math.floor(up%60);
  res.send(`<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Meaow Log System V4.1</title><style>
  body{margin:0;min-height:100vh;background:radial-gradient(circle at top,#202938,#0d1117 55%);color:#fff;font-family:Arial;display:flex;align-items:center;justify-content:center;padding:20px}
  .card{width:100%;max-width:480px;background:#161b22;border:1px solid #30363d;border-radius:18px;padding:32px;box-shadow:0 15px 50px #0007}.logo{text-align:center;font-size:50px}h1{text-align:center;margin:8px 0}.sub{text-align:center;color:#8b949e;margin-bottom:24px}.status{text-align:center;padding:10px;border-radius:10px;background:#23863633;color:#57F287;font-weight:bold;margin-bottom:20px}.row{display:flex;justify-content:space-between;padding:13px 0;border-bottom:1px solid #30363d}.label{color:#8b949e}.value{text-align:right;font-weight:bold}.foot{text-align:center;color:#6e7681;font-size:12px;margin-top:24px}</style></head><body><div class="card"><div class="logo">🐱</div><h1>Meaow Log System V4.1</h1><div class="sub">Discord Security & Audit Log</div><div class="status">${client.isReady()?"🟢 Online":"🟡 Connecting"}</div>
  <div class="row"><span class="label">🤖 บอท</span><span class="value">${client.user?.tag||"กำลังเชื่อมต่อ..."}</span></div>
  <div class="row"><span class="label">🏠 เซิร์ฟเวอร์</span><span class="value">${g?.name||"ไม่พบ"}</span></div>
  <div class="row"><span class="label">👥 สมาชิก</span><span class="value">${g?.memberCount||0}</span></div>
  <div class="row"><span class="label">🟢 ออนไลน์</span><span class="value">${g?onlineCount(g):0}</span></div>
  <div class="row"><span class="label">⏱️ Uptime</span><span class="value">${d} วัน ${h} ชม. ${m} น. ${s} วิ.</span></div>
  <div class="foot">Meaow Log System V4.1 • ${thaiTime()}</div></div></body></html>`);
});
app.get("/health",(req,res)=>res.status(200).json({status:"ok",bot:client.isReady(),uptime:process.uptime(),time:thaiTime()}));
app.listen(PORT,"0.0.0.0",()=>console.log(`🌐 Dashboard PORT ${PORT}`));
console.log("🔐 กำลัง Login Discord...");
client.login(TOKEN).catch(e=>{console.error("❌ Login Discord ไม่สำเร็จ:",e.message);process.exit(1);});
