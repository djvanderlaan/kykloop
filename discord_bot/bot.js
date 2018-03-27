
const Discord = require('discord.js');
const SerialPort = require('serialport');
const fs = require('fs');


// ========= Kykloop class ================
// Keeps track of the current pan and tilt and sends commands to the 
// arduino device
class Kykloop {
  constructor(device) {
    this.device = device;
    this.pan_ = 90;
    this.tilt_ = 90;
    if (this.device != "test") {
      this.port = new SerialPort(this.device, {baudRate: 9600});
      this.port.on('error', function(err) {
        console.log('Problem with sesial device: ', err.message);
      });
    }
  }

  tilt(angle) {
    if (arguments.length === 0) 
      return this.tilt_;
    if (angle > 179) angle = 179;
    if (angle < 1) angle = 1;
    this.tilt_ = angle;
    // send command to arduino
    let new_position = 't' + this.tilt_ + ';';
    if (this.device === "test") {
      console.log("Command to arduino: '" + new_position + "'");
    } else {
      this.port.write(String(new_position), function(err) {
        if (err) return console.log('Error on write: ', err.message);
      });
    }
    return this;
  }
  
  change_tilt(angle) {
    let new_tilt = this.tilt_ + (+angle);
    return this.tilt(new_tilt);
  }

  pan(angle) {
    if (arguments.length === 0) 
      return this.pan_;
    if (angle > 179) angle = 179;
    if (angle < 1) angle = 1;
    this.pan_ = angle;
    // send command to arduino
    let new_position = 'p' + this.pan_ + ';';
    if (this.device === "test") {
      console.log("Command to arduino: '" + new_position + "'");
    } else {
      this.port.write(String(new_position), function(err) {
        if (err) return console.log('Error on write: ', err.message);
      });
    }
    return this;
  }
  
  change_pan(angle) {
    let new_pan = this.pan_ + (+angle);
    return this.pan(new_pan);
  }
}



// ======= Set up connection to arduino device  =======

// Try to detect the port to which the arduino device is connected
const possible_ports = ['/dev/ttyACM0', '/dev/ttyACM1', '/dev/ttyACM2'];

let port = 'test';
for (p in possible_ports) {
  if (fs.existsSync(possible_ports[p])) {
    port = possible_ports[p];
    break; 
  }
}
if (port == 'test') {
  console.log('Could not detect serial port; running in test mode.');
} else {
  console.log('Connecting to ' + port + '.');
}

let kykloop = new Kykloop(port);


// ====== Start discord client ========

const auth = require('./auth.json');
const client = new Discord.Client();

let stored_positions = {};


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
      kykloop.change_tilt(-res[2]);
    } else if (res[1] == 'down') {
      kykloop.change_tilt(+res[2]);
    } else if (res[1] == 'left') {
      kykloop.change_pan(+res[2]);
    } else if (res[1] == 'right') {
      kykloop.change_pan(-res[2]);
    } else {
      msg.reply("Unknown direction: '" + res[1] + "'.");
    }

    msg.reply('Turning camera ' + res[1] + ' by ' + res[2] +
      ' degrees (' + kykloop.pan() + ',' + kykloop.tilt() + ').');
  }

  // ====== store prosition
  // Message of the format "kyk store word"
  const store_re = /^kyk[ ]+store[ ]+([a-z]+)[ ]*$/;
  if (store_re.test(msg.content)) {
    let res = store_re.exec(msg.content);
    stored_positions[res[1]] = { 'pan' : kykloop.pan(), 'tilt': kykloop.tilt() };
     msg.reply("Stored current position in '" + res[1], "'.")
  }

  // ======= retrieve prosition
  // Message of the format "kyk word"
  const retr_re = /^kyk[ ]+([a-z]+)[ ]*$/;
  if (retr_re.test(msg.content)) {
    let res = retr_re.exec(msg.content);
    let pos = stored_positions[res[1]];
    if (pos !== null) {
      kykloop.tilt(pos.tilt).pan(pos.pan);
      msg.reply("Moving to '" + res[1] + "'.")
    } else {
      msg.reply("Could not find stored position '" + res[1] + "'.")
    }
  }
  
});

client.login(auth.token);

