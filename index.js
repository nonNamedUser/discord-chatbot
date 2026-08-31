const axios = require("axios") // using REST because i don't trust google as much 3:
const {Client,Events,GatewayIntentBits} = require("discord.js") // yk what this is :sob:
const {discord_token,gemini_api_key,channel_id,system_prompt} = require("./config.json")

let convos={} // I'm too lazy to make it using node:fs and node:path xD

const client= new Client({intents: [ // create the client
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.Guilds
]})

async function ai(message, userid) { // returns a string
    // you can add functionality here
    const headers = {
        "x-goog-api-key": gemini_api_key,
        "Content-Type": "application/json"
    }
    const payload = {
        "system_instruction": system_prompt,
        "input": message,
        "model": "gemini-3.5-flash-lite" // check https://aistudio.google.com/docs for the ai stuff
    }
    if (convos[`user_${userid}`]) {
        payload["previous_interaction_id"]=convos[`user_${userid}`]
    }
    var data=null
    try {
        data = await axios.post("https://generativelanguage.googleapis.com/v1beta/interactions",payload,{headers:headers})
    } catch (e) {
        console.log("Error: "+e)
    }

    if (data === null) {
        return "There has been an error."
    }


    convos[`user_${userid}`]=data.data.id
    
    // time to find the response lol

    const output = data.data.steps.find(
        step => step.type === "model_output"
    )

    console.log(output?.content)

    const response = output?.content[0]?.text ?? null

    if (response === null) {
        return "There has been an error."
    }

    return response
}

client.once(Events.ClientReady,async c => {
    console.log(`Logged in as ${c.user.tag}`)
})

client.on(Events.MessageCreate,async c => { //make it listen to messages
    if (c.channelId !== channel_id || c.author.bot) return;
    const content = c.content

    const message = await ai(content, c.author.id) //returns a string

    //console.log(message)

    try {
        await c.reply({content: message})
    } catch (e) {
        await c.reply({content: "There has been an error."})
    }
})

client.login(discord_token)