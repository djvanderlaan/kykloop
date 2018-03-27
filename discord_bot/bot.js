const Discord = require("discord.js");
const SerialPort = require('serialport');

// ======= Set up serial port =======

let port = new SerialPort('/dev/ttyACM1', {
  baudRate: 9600
});

port.on('error', function(err) {
  console.log('Arduino error: ', err.message);
});

// ====== Start discord client ========

const auth = require('./auth.json');
const client = new Discord.Client();

let stored_positions = {};
let pan = 90;
let tilt = 90;

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {

  // ===== up/down/left/right
  // Messages of the form "kyk left 10"
  const turn_re = /^kyk[ ]+([a-z]+)[ ]+([0-9]+)[ ]*$/;
  if (turn_re.test(msg.content)) {
    let res = turn_re.exec(msg.content);
    if (res[1] == 'up') {
      tilt -= (+res[2]);
    } else if (res[1] == 'down') {
      tilt += (+res[2]);
    } else if (res[1] == 'left') {
      pan += (+res[2]);
    } else if (res[1] == 'right') {
      pan -= (+res[2]);
    } else {
      msg.reply("Unknown direction: '" + res[1] + "'.");
    }

    if (pan < 0) pan = 0;
    if (pan > 180) pan = 180;
    if (tilt < 0) tilt = 0;
    if (tilt > 180) tilt = 180;

    msg.reply('Turning camera ' + res[1] + ' by ' + res[2] +
      ' degrees (' + pan + ',' + tilt + ').');

    let new_position = 't' + tilt + ';p' + pan + ';';
    port.write(String(new_position), function(err) {
      if (err) return console.log('Error on write: ', err.message);
    });
  }

  // ====== store prosition
  // Message of the format "kyk store word"
  const store_re = /^kyk[ ]+store[ ]+([a-z]+)[ ]*$/;
  if (store_re.test(msg.content)) {
    let store_res = store_re.exec(msg.content);
    stored_positions[store_res[1]] = { 'pan' : pan, 'tilt': tilt };
     msg.reply("Stored current position in '" + store_res[1], "'.")
  }

  // ======= retrieve prosition
  // Message of the format "kyk word"
  const retr_re = /^kyk[ ]+([a-z]+)[ ]*$/;
  if (retr_re.test(msg.content)) {
    let retr_res = retr_re.exec(msg.content);
    let pos = stored_positions[retr_res[1]];
    if (pos !== null) {
      pan = pos.pan;
      tilt = pos.tilt;
      let new_position = 't' + tilt + ';p' + pan + ';';
      port.write(String(new_position), function(err) {
        if (err) return console.log('Error on write: ', err.message);
      });
      msg.reply("Moving to '" + retr_res[1] + "'.")
    } else {
      msg.reply("Could not find stored position '" + retr_res[1] + "'.")
    }
  }

  if (msg.content === 'ping') {
    msg.reply('Pong!');
  }
});

client.login(auth.token);

