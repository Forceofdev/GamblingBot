require('discord.js')
const { fsync, readFileSync, readFile, writeFile, writeFileSync } = require("fs")
function writeUserData(map) {
    console.log(map)
    const stringData = JSON.stringify(Array.from(map.entries()))
    writeFileSync('./userinfo.txt', stringData)
}

function getUserData() {
    const rawData = readFileSync('./userinfo.txt', { encoding: 'utf-8' })
    const data = JSON.parse(rawData)

    return data
}

module.exports = {
    getUserData, writeUserData
}