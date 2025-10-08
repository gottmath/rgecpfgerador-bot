
const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder } = require('discord.js');

const TOKEN = "token";
const CLIENT_ID = "clientid";

function validateCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
    let sum, remainder;
    sum = 0;
    for (let i = 1; i <= 9; i++) sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(9, 10))) return false;
    sum = 0;
    for (let i = 1; i <= 10; i++) sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(10, 11))) return false;
    return true;
}

function generateCPF(formatted = true) {
    const digits = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
    const calc = (d) => {
        let sum = d.reduce((acc, digit, i) => acc + digit * (d.length + 1 - i), 0);
        let rem = 11 - (sum % 11);
        return rem >= 10 ? 0 : rem;
    };
    digits.push(calc(digits));
    digits.push(calc(digits));
    const cpf = digits.join('');
    return formatted ? cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : cpf;
}

// rg sp
function validateRGSP(rg) {
    rg = rg.replace(/\D/g, '').toUpperCase();
    if (rg.length !== 9) return false;
    const base = rg.slice(0, 8);
    const dv = rg.slice(8, 9);
    const weights = [2, 3, 4, 5, 6, 7, 8, 9];
    let sum = 0;
    for (let i = 0; i < 8; i++) sum += parseInt(base[i]) * weights[i];
    const remainder = sum % 11;
    const calculatedDV = (11 - remainder).toString();
    if (calculatedDV === "10") return dv === "X";
    if (calculatedDV === "11") return dv === "0";
    return dv === calculatedDV;
}

function generateRGSP(formatted = true) {
    const base = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10));
    const weights = [2, 3, 4, 5, 6, 7, 8, 9];
    let sum = 0;
    for (let i = 0; i < 8; i++) sum += base[i] * weights[i];
    let dv = 11 - (sum % 11);
    if (dv === 10) dv = "X";
    else if (dv === 11) dv = "0";
    const rg = base.join('') + dv;
    return formatted ? rg.replace(/(\d{2})(\d{3})(\d{3})(\w{1})/, '$1.$2.$3-$4') : rg;
}

// rg rj
function validateRGRJ(rg) {
    rg = rg.replace(/\D/g, '');
    if (rg.length !== 9) return false;
    const base = rg.slice(0, 8);
    const dv = parseInt(rg.slice(8, 9));
    const weights = [2, 3, 4, 5, 6, 7, 8, 9];
    let sum = 0;
    for (let i = 0; i < 8; i++) sum += parseInt(base[7 - i]) * weights[i];
    const remainder = sum % 11;
    const calculatedDV = remainder > 1 ? 11 - remainder : 0;
    return dv === calculatedDV;
}

function generateRGRJ(formatted = true) {
    const base = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10));
    const weights = [2, 3, 4, 5, 6, 7, 8, 9];
    let sum = 0;
    for (let i = 0; i < 8; i++) sum += base[7 - i] * weights[i];
    const remainder = sum % 11;
    const dv = remainder > 1 ? 11 - remainder : 0;
    const rg = base.join('') + dv;
    return formatted ? rg.replace(/(\d{2})(\d{3})(\d{3})(\d{1})/, '$1.$2.$3-$4') : rg;
}

// rg mg
function validateRGMG(rg) {
    rg = rg.replace(/\D/g, '');
    if (rg.length < 8 || rg.length > 11) return false;
    const base = rg.slice(0, -1);
    const dv = parseInt(rg.slice(-1));
    let str = base.padStart(8, '0');
    let result = '';
    for (let i = 0; i < str.length; i++) {
        result += str[i] + (i % 2 === 0 ? '1' : '2');
    }
    let sum = Array.from(result).reduce((acc, digit) => acc + parseInt(digit), 0);
    const calculatedDV = (Math.ceil(sum / 10) * 10) - sum;
    return dv === calculatedDV;
}

function generateRGMG(formatted = true) {
    const base = Array.from({ length: 7 }, () => Math.floor(Math.random() * 10));
    let str = base.join('').padStart(8, '0');
    let result = '';
    for (let i = 0; i < str.length; i++) {
        result += str[i] + (i % 2 === 0 ? '1' : '2');
    }
    let sum = Array.from(result).reduce((acc, digit) => acc + parseInt(digit), 0);
    const dv = (Math.ceil(sum / 10) * 10) - sum;
    const rg = base.join('') + dv;
    return formatted ? rg.replace(/(\d{2})(\d{3})(\d{3})(\d{1})/, '$1.$2.$3-$4') : rg;
}


const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
    console.log('Bot iniciando...');

    const commands = [
        new SlashCommandBuilder().setName('gerarcpf').setDescription('Gera um número de CPF válido.'),
        new SlashCommandBuilder().setName('validarcpf').setDescription('Verifica se um CPF é válido.')
            .addStringOption(option => option.setName('cpf').setDescription('O CPF a ser validado').setRequired(true)),

        new SlashCommandBuilder().setName('gerarrg').setDescription('Gera um RG válido para o estado selecionado.')
            .addStringOption(option =>
                option.setName('estado')
                    .setDescription('Selecione o estado (UF) para gerar o RG.')
                    .setRequired(true)
                    .addChoices(
                        { name: 'São Paulo (SP)', value: 'SP' },
                        { name: 'Rio de Janeiro (RJ)', value: 'RJ' },
                        { name: 'Minas Gerais (MG)', value: 'MG' }
                    )),
        new SlashCommandBuilder().setName('validarrg').setDescription('Verifica se um RG é válido para o estado selecionado.')
            .addStringOption(option => option.setName('rg').setDescription('O RG a ser validado').setRequired(true))
            .addStringOption(option =>
                option.setName('estado')
                    .setDescription('Selecione o estado (UF) do RG.')
                    .setRequired(true)
                    .addChoices(
                        { name: 'São Paulo (SP)', value: 'SP' },
                        { name: 'Rio de Janeiro (RJ)', value: 'RJ' },
                        { name: 'Minas Gerais (MG)', value: 'MG' }
                    )),
    ].map(command => command.toJSON());

    const rest = new REST({ version: '10' }).setToken(TOKEN);

    try {
        console.log('registrando os comandos slash (/)');
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
        console.log('comandos slash (/) registrados');
    } catch (error) {
        console.error('Erro ao registrar comandos:', error);
    }
    
    console.log(`bot ligou`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    // --- Comandos de CPF ---
    if (commandName === 'gerarcpf') {
        const cpfGerado = generateCPF();
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('✅ CPF Gerado com Sucesso!')
            .addFields({ name: 'CPF Válido', value: `\`\`\`${cpfGerado}\`\`\`` })
            .setFooter({ text: 'Use este CPF para fins de teste.' });
        await interaction.reply({ embeds: [embed] });

    } else if (commandName === 'validarcpf') {
        const cpfParaValidar = interaction.options.getString('cpf');
        const ehValido = validateCPF(cpfParaValidar);
        const embed = new EmbedBuilder()
            .setTitle(ehValido ? '✅ CPF Válido' : '❌ CPF Inválido')
            .setColor(ehValido ? '#00FF00' : '#FF0000')
            .setDescription(`O CPF \`${cpfParaValidar}\` é **${ehValido ? 'válido' : 'inválido'}**.`);
        await interaction.reply({ embeds: [embed] });
    
    // --- Comandos de RG ---
    } else if (commandName === 'gerarrg') {
        const estado = interaction.options.getString('estado');
        let rgGerado = '';
        
        switch (estado) {
            case 'SP': rgGerado = generateRGSP(); break;
            case 'RJ': rgGerado = generateRGRJ(); break;
            case 'MG': rgGerado = generateRGMG(); break;
        }

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`✅ RG (${estado}) Gerado com Sucesso!`)
            .addFields({ name: `RG Válido (Padrão ${estado})`, value: `\`\`\`${rgGerado}\`\`\`` })
            .setFooter({ text: `Este RG segue o algoritmo de validação de ${estado}.` });
        await interaction.reply({ embeds: [embed] });
    
    } else if (commandName === 'validarrg') {
        const rgParaValidar = interaction.options.getString('rg');
        const estado = interaction.options.getString('estado');
        let ehValido = false;

        switch (estado) {
            case 'SP': ehValido = validateRGSP(rgParaValidar); break;
            case 'RJ': ehValido = validateRGRJ(rgParaValidar); break;
            case 'MG': ehValido = validateRGMG(rgParaValidar); break;
        }

        const embed = new EmbedBuilder()
            .setTitle(ehValido ? `✅ RG (${estado}) Válido` : `❌ RG (${estado}) Inválido`)
            .setColor(ehValido ? '#00FF00' : '#FF0000')
            .setDescription(`O RG \`${rgParaValidar}\` é **${ehValido ? 'válido' : 'inválido'}** segundo o algoritmo de ${estado}.`);
        await interaction.reply({ embeds: [embed] });
    }
});


if (!TOKEN || !CLIENT_ID || TOKEN === "token" || CLIENT_ID === "clientid") {
    console.error("esqueceu de colocar o token do bot, meu");
    process.exit(1);
}

client.login(TOKEN);