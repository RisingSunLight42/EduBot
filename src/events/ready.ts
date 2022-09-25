import { ActivityType } from "discord.js";
import { deployCommands, recupFichier } from "../deployCommands"; // Importe la fonction pour déployer les commandes
import { ClientExtend } from "../helpers/types/clientExtend";
import { ref, get, child } from "firebase/database";
import { dataDettesProcessing } from "../helpers/functions/dataDettesProcessing";
const CronJob = require("cron").CronJob;
require("dotenv").config();

const guildGestionId = process.env.GUILD_GESTION_ID;

if (!guildGestionId)
    throw new Error("L'ID de la guild de gestion est manquant !");

module.exports = {
    name: "ready",
    once: true,
    async execute(client: ClientExtend) {
        console.log(`🟢 Je suis allumé !`);

        client.user?.setPresence({
            status: "online",
            activities: [
                {
                    name: "son repo Github",
                    type: ActivityType.Watching,
                    url: "https://github.com/RisingSunLight42/EduBot",
                },
            ],
        });

        //* Push les commandes suivant si les serveurs recherchés sont présents et si c'est le bot principal
        const liste_commandes = recupFichier();
        deployCommands(liste_commandes, true);
        client.guilds.fetch().then(function (result) {
            const guild_liste_snowflake = result.map((objet) => objet.id);
            if (guild_liste_snowflake.includes(guildGestionId))
                deployCommands(liste_commandes, false);
        });

        new CronJob(
            "0 0 20 * * *",
            async function () {
                if (!client.database) return;
                const refDB = ref(client.database);
                client.anglais = (await get(child(refDB, "anglais/"))).val();
            },
            null,
            true,
            "Europe/Paris",
            this,
            true
        );

        new CronJob(
            "0 0 20 * * *",
            function () {
                if (!client.database) return;
                const refDB = ref(client.database);
                get(child(refDB, "dettes/")).then(async (snapshot) => {
                    const embed = dataDettesProcessing(snapshot.val());

                    const channel = await client.channels.fetch(
                        "1016397992674218035"
                    );
                    if (channel?.isTextBased()) {
                        await channel.send({ embeds: [embed] });
                    }
                });
            },
            null,
            true,
            "Europe/Paris"
        );
    },
};
