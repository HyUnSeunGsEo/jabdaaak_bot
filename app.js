const express = require('express');
const fetch = require('node-fetch');
const { prefix, token, mongo_rul, port, clientId, kdtoken, actoken, botname, prefix2 } = require('./database/config.json')
const { Client , Intents , Collection }  = require('discord.js')
const { Koreanbots } = require("koreanbots")
const Discord = require("discord.js")
const client = new Discord.Client({intents:32767})
const fs = require('fs')
module.exports = client;
client.login(token)
const { DiscordTogether } = require('discord-together')
client.discordTogether = new DiscordTogether(client);
const mongoose = require("mongoose")
const Levels = require("discord-xp")
Levels.setURL(mongo_rul)
mongoose.connect(mongo_rul, { 
}).then(console.log("데이터베이스 연결 완료"))
const { REST } = require("@discordjs/rest")
const { Routes } = require("discord-api-types/v9")
const commands = []
client.slashcommands = new Collection()

//슬래쉬 커맨드 핸들
fs.readdirSync("./slashcommands").forEach(dirs => {
    const commandfolder = fs.readdirSync(`./slashcommands/${dirs}/`).filter(file => file.endsWith(".js"))
    for (const file of commandfolder) {
        const command = require(`./slashcommands/${dirs}/${file}`)
        commands.push(command.data.toJSON());
        client.slashcommands.set(command.data.name, command)
        delete require.cache[require.resolve(`./slashcommands/${dirs}/${file}`)]
    }
})
const rest = new REST({version:'9'}).setToken(token)

client.on("interactionCreate",async interaction =>{
    if(!interaction.isCommand()) return;
    const command = client.slashcommands.get(interaction.commandName)
    if (!command) return
    try {
        await command.execute(interaction)
    } catch (err) {
        console.error(err)
        await interaction.reply({ content: "오류가 발생했습니다.", ephemeral: true })
    }
}) 

client.once('ready', async ()=>{
    try{
        console.log(`${botname}의 빗금 커맨드 푸쉬중 . . .`)
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands }
        )
        console.log(`${botname}의 빗금 커맨드 푸쉬 완료`)
    }catch (e) {
        console.error(e)
    }
    console.log(`${botname} 봇 index.js 최종 가동완료`);
})

//오류 무시
process.on("unhandledRejection", err=>{
    if(err == "DiscordAPIError: Missing Access") return console.log("봇에게 슬래쉬 커맨드를 서버에 푸쉬 할 권한이 없어서 서버에 슬래쉬 커맨드를 푸쉬하지 못했습니다.")
    console.error(err)
})

//메세지 커맨드 핸들
client.commands = new Collection()
fs.readdirSync(`./commands`).forEach(dirs2 => {
    const commandsFile = fs.readdirSync(`./commands/${dirs2}/`).filter(file => file.endsWith('.js'))
for(const file of commandsFile){
    const command = require(`./commands/${dirs2}/${file}`)
    client.commands.set(command.name , command)
}})

client.on('messageCreate' , message=>{
    if(!message.content.startsWith(prefix)) return
    const args = message.content.slice(prefix.length).trim().split(/ +/)
    const commandName = args.shift()
    const command = client.commands.get(commandName)
    if (!command) return
    try{
        command.execute(message,args)
    } catch (error) {
        console.error(error)
    }
})

//이벤트 핸들
fs.readdirSync(`./events`).forEach(dirs3 => {
    const eventFiles = fs.readdirSync(`./events/${dirs3}/`).filter(file => file.endsWith('.js'));

eventFiles.forEach(file => {
    const event = require(`./events/${dirs3}/${file}`);
        if (event.once) {
            client.once(event.name, (...args) => event.run(...args));
        } else {
            client.on(event.name, (...args) => event.run(...args));
        }
    })
})