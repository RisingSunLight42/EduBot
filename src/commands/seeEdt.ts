// Importe le nécessaire pour réaliser la commande
import {
    ChannelType,
    ChatInputCommandInteraction,
    SlashCommandBuilder,
} from "discord.js";
import { fetchEdt } from "../helpers/functions/fetchEdt";
import { dataEdtProcessing } from "../helpers/functions/dataEdtProcessing";
import { staticDay } from "../helpers/constants/daysCode";
import { staticMonth } from "../helpers/constants/monthsCode";
import { embedGenerator } from "../helpers/generators/embed";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("edt")
        .setDescription("Permet d'avoir l'edt")
        .addNumberOption((option) =>
            option
                .setName("classe")
                .setDescription("La classe dont tu veux l'emploi du temps")
                .addChoices(
                    { name: "TP2.1", value: 1185 },
                    { name: "TP2.2", value: 1186 }
                )
                .setRequired(true)
        )
        .addNumberOption((option) =>
            option
                .setName("jour")
                .setDescription(
                    "La semaine ne prend pas en compte les W-E, donc aujourd'hui en weed-end donnera Lundi !"
                )
                .addChoices(
                    { name: "Aujourd'hui", value: 0 },
                    { name: "+ 1 jour", value: 1 },
                    { name: "+ 2 jours", value: 2 },
                    { name: "+ 3 jours", value: 3 },
                    { name: "+ 4 jours", value: 4 },
                    { name: "+ 5 jours", value: 5 }
                )
                .setRequired(true)
        )
        .addBooleanOption((option) =>
            option
                .setName("affichage")
                .setDescription(
                    "Dois-je afficher les jours intermédiaires ou pas ?"
                )
                .setRequired(true)
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        const classe = interaction.options.getNumber("classe", true);
        const jour = interaction.options.getNumber("jour", true);
        const affichage = interaction.options.getBoolean("affichage", true);
        const edtData = await fetchEdt(classe);
        const edtDataAsked = await dataEdtProcessing(edtData, jour, affichage);

        const arrEmbed = [];
        for (const jourData of edtDataAsked) {
            const numJour = parseInt(jourData[0].jour);
            const numMonth = jourData[0].mois;
            const year = jourData[0].annee;
            const day = new Date(
                `${year}-${numMonth}-${numJour} 12:00:00`
            ).getDay();
            const arrFields = [];
            for (const heureData of jourData) {
                arrFields.push({
                    name: `${heureData.hDebut} - ${heureData.hFin}`,
                    value: `${heureData.cours}\n${heureData.enseignant}\nSalle : ${heureData.salle}`,
                });
            }
            arrEmbed.push(
                embedGenerator({
                    title: `Emploi du Temps du ${staticDay[day]} ${numJour} ${staticMonth[numMonth]} ${year}`,
                    fields: arrFields,
                })
            );
        }

        await interaction.reply({
            content: "Voici l'emploi du temps demandé !",
            embeds: arrEmbed,
            ephemeral:
                interaction.channel?.type === ChannelType.DM ||
                interaction.channel?.type === undefined
                    ? false
                    : true,
        });
    },
};
