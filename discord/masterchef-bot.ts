import { Client, Collection, Intents } from "discord.js";
import { commandHandlers } from "./commands";

const TOKEN = process.env.DISCORD_TOKEN!;

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

export const commands: Collection<string, any> = new Collection();

commandHandlers.forEach((handler) => {
  commands.set(handler.definition.name, handler);
});
client.once("ready", (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) {
    return;
  }

  const command = commands.get(interaction.commandName);

  if (!command) {
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "There was an error while executing this command!",
      ephemeral: true,
    });
  }
});

client.login(TOKEN);
