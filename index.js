const Discord = require('discord.js')
const client = new Discord.Client()
const Eris = require('eris');
const randomPuppy = require('random-puppy');
var quotes = [];
var jokes = [];
var redditRequests = [];
var raw_content;
var main_channel_user_index;
var server_user_ids;
var raw_data;
var channel_ids = [];
var user_messages = [];
var channel_name = "";
var user_id_and_msg = [];
const config = require('./config.json');
const { prefix, token } = require('./config.json');
//const bot = new Eris(process.env.DISCORD_BOT_TOKEN);   // Replace DISCORD_BOT_TOKEN in .env with your bot accounts token
client.login(token);
var freeToChat = 1;

var fs = require('fs'),
    path = require('path'),    
    quote_filePath = path.join(__dirname, 'res/hyperion_quotes.txt');
    joke_filePath  = path.join(__dirname, "res/jokes.txt");
    lbc_filePath = path.join(__dirname, "res/lbc_may_31.txt");

// returns discord user id
function yoinkID(username) {
  let user_id = "";
  for (var user_key in server_user_ids) {
    if (user_key.includes(username)){
      user_id = String(user_key);
    }
  }
  return user_id;
}

// returns discord-history-tracker index (0~250)
function yoinkUserIndex(username) {
  let target_id = yoinkID(username);
  let target_index = -1;
  for (var ui in main_channel_user_index){
    if (main_channel_user_index[ui] === target_id) {
      target_index = ui;
      //console.log(ui);
    }
  }
  return target_index;
}

// determines whether message is valid 
function validMsg(msg) {
  var validMsg = 1;
  let minWordCount = 3;
  let preferableWordCount = 8;
  let chanceForSmallerMsg = 0.2;
  if (msg === null)
    validMsg = 0;

  if (msg === undefined)
    validMsg = 0;
    try {
      if (msg.split(' ').length < minWordCount)
      validMsg = 0;
    }
    catch {
      validMsg = 0;
    }

  return validMsg;
}

// driver
function yoinkRandomMessage(username) {
  //check if user has been queried for already, otherwise load 'em up

  let userIndex = yoinkUserIndex(username);
  if (userIndex < 0) {
    console.log("couldn't find em~")
    return "couldn't find em~";
  }
  console.log('yoinking random msg from ' + username + ' user id: ' + userIndex);

    var user_msg_count = user_id_and_msg[userIndex].length;
    if (user_msg_count === 0) {
      return "they ain't said bubkis!";
    }
    //console.log(sums.length);
    console.log("user msg count: " + user_msg_count);
    let rand_index = Math.floor(Math.random()*user_msg_count);
    console.log("rand index: " + rand_index);
    random_msg_obj = user_id_and_msg[userIndex][rand_index];
    var message = random_msg_obj.msg;
    if (!validMsg(message)) {
      console.log(message + " is invalid!")
      return -1;
    }

    var msg = filterMsg(message);
    if (msg === -1){
      console.log(message + " contains a quote to someone who left! faggeditaboutit")
      return -1;
    }

    // console.log(msg);


    var returnMsg = "on " + random_msg_obj.ts + ", <@" + username + "> said in #" + random_msg_obj.channel_name + "\n `" + random_msg_obj.msg + "`"; 
    return returnMsg;
}

// if contains discord user id replace with actual name
function filterMsg(msg) {
  console.log('workin wit: ' + msg);
  if (msg.includes("<@!")) {
    let userID = msg.split(" ")[0].replace("<@!", "");
    let restOfMsg = msg.split(" ");
    restOfMsg = restOfMsg.slice(1);
    restOfMsg = Array.prototype.join.call(restOfMsg, " ");

    let name = findUsername(userID.replace(">", ""));
    console.log("find username result:" + name)
    if (name === -1){
      return -1;
    }
    msg = "@" + name + " " + restOfMsg;  
  }
  return msg;
}

function findUsername(userID) {
  let ui = user_ids.indexOf(userID);
  if (ui < 0) {
    return -1;
  }
  return server_user_ids[userID].name
}


var timah = (function(){
  var timer = 0;

  // Because the inner function is bound to the slideTimer variable,
  // it will remain in score and will allow the timer variable to be manipulated.

  return function(callback, ms){
       clearTimeout (timer);
       timer = setTimeout(callback, ms);
  };  
})();

client.on('messageCreate', async (msg) => {

});

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}~`)
  quotes = fs.readFileSync(quote_filePath).toString().split("\n");
  jokes = fs.readFileSync(joke_filePath).toString().split("\n");
  raw_lbc = JSON.parse(fs.readFileSync(lbc_filePath).toString());
  server_user_ids = raw_lbc.meta.users;
  main_channel_user_index = raw_lbc.meta.userindex;
  channel_info = raw_lbc.meta.channels;
  user_ids = Object.keys(server_user_ids);

  //console.log(channel_info)
  //console.log(Object.keys(channel_info))
  var channel_ids = Object.keys(channel_info);
  var channel_data = [];
  for (var ci in channel_ids) { // for each channel
    let channel_id = channel_ids[ci]
    var channel_msgs = [];
    channel_data.push(raw_lbc.data[channel_id])
  }
  var fci = channel_ids[0];
  //channel_name = raw_lbc.meta.channels[String(channel_id)].name;

  //var raw_data = channel_data[0];
  var raw_data = []
  var total_m = [];
  var user_id_msg_count = {};
  for( var i=0; i<main_channel_user_index.length; i++ ) {
    user_id_and_msg.push( [] );
  }
  for (let [key, value] of Object.entries(channel_data)) { // for each channel
    for (let [k, o] of Object.entries(value)) { // for each message in channel
      obj = {
        channel_name: channel_info[channel_ids[parseInt(key)]].name,
        message_id: k,
        user_id: o.u,
        msg: o.m,
        ts: timeConverter(o.t)
      };
      total_m.push(obj)
      id = obj.user_id
      user_id_msg_count[id] = user_id_msg_count[id] ? user_id_msg_count[id] + 1 : 1;
      user_id_and_msg[id].push(obj);
    }
  }
  console.log("loaded " + total_m.length + " messages from " + user_id_and_msg.length + " users across " + channel_data.length + " channels!\n\nnever forget: ogh doubted us..");
  // var raw_data_length = Object.keys(raw_data).length
  // var entries = Object.entries(total_m);
    
  // for (var i = 0; i < entries.length; i++) {
  //   var num = entries[i][1].u;
  //   counts[num] = counts[num] ? counts[num] + 1 : 1;
  // }

  // var user_id_name = {};
  // for (var id = 0; id < Object.keys(counts).length; id++) {
  //   let n = server_user_ids[main_channel_user_index[id]].name
  //   user_id_name[id] = n;
  // }
  //console.log(user_id_name);
  //console.log(counts);
  
  // [["you",100],["me",75],["foo",116],["bar",15]]

  //let sorted = entries.sort((a, b) => a[1].u - b[1].u);
  //console.log(sorted)
  //raw_lbc.forEach(ch => console.log(ch));
  //console.log(channel_name)
  //supplied_user = "mmmeh";
  // console.log(user_list["150831941422284800"].name)
});

function yoinkMsgWrapper(msg, cleanedUser) {
  msg.reply(yoinkRandomMessage(cleanedUser));

}

function freeUp() {
  freeToChat = 1;
}

client.on('message', msg => {
  var whoSaidIt = findUsername(msg.author.id)
  if (msg.author.id === "150831941422284800"){
    if (msg.toString().startsWith("ree!")){

    }

    if (msg.toString().startsWith("just"))
    async () => {
      let message = await channel.send("<:dew_it:712873443657515038>");
      //now you can grab the ID from it like
      console.log("msg id: " + message.id)
     }
  }

  if (msg.toString().startsWith("bopa"))
    msg.channel.send("<a:kirb_jammingslower:684821910424387725>")
  if (msg.toString().startsWith("h")) {
    msg.channel.send("ello!");
  }
  if (msg.toString().includes("well that's")) 
    msg.channel.send("__Enough.__");
  // if (msg.toString().includes("ello")) {
  //   msg.channel.send("Enough.");
  // }
  // if (msg.toString().includes("Enough.")) {
  //   msg.channel.send("h");
  // }
  if (msg.toString().startsWith("<@!600453432364761094>")) {
    if (msg.toString().includes("dumbass")) {
      msg.channel.send('ACTUALLY! you are the dumb grass (:');
    //   msg.channel.send('well...').then(m => {
    //     m.edit('bro i will END you');
    // });
  }
     else {
      msg.channel.send('hi!');
    //   .then(m => {
    //     m.edit('hi!');
    // });    
  }
  }
  console.log("oo girl " + whoSaidIt + " said:\n" + msg);

  
  if (msg.content.toLowerCase() === 'ping') {
    msg.reply('pong bruh up to 0 good')
  } else if (msg.content.toLowerCase().startsWith('~q') || msg.content.toLowerCase().startsWith("~quote")) {
    if (msg.content.includes("@")) {
      let supplied_user = msg.content.split('@')[1];
      let cleanedUser = supplied_user.substr(1).replace(">", "");

    if (freeToChat) {
      freeToChat = 0;
      let replyMsg = yoinkRandomMessage(cleanedUser)
      while(replyMsg === -1)
        replyMsg = yoinkRandomMessage(cleanedUser)
      msg.reply(replyMsg);
    }
    setTimeout(freeUp, 5000); // Hello, John
    } else 
    {
      msg.reply("NOR!! do `~q @<name>`");
    }
  } 
  
  else if (msg.content.toLowerCase() === '~hype') {
    hyperionQuote = quotes[Math.floor(Math.random()*quotes.length)];
    msg.reply(hyperionQuote);
  } else if (msg.content.toLowerCase() === "~heh") {
    funny_joke = jokes[Math.floor(Math.random()*jokes.length)];
    msg.reply(funny_joke);
  } else if (msg.content.toLowerCase().startsWith("~redd") || msg.content.toLowerCase().startsWith("~r")) {
    if (!msg.content.includes(" ")) {
      msg.reply("forgetting something  ??");
      return 0;
    } else {
      let sub = msg.content.split(' ')[1]; 
      pluckPost(msg, sub)
      redditRequests.push(sub);
    }


  } 
  else if (msg.content.toLowerCase().startsWith("~again") || msg.content.toLowerCase().startsWith("~a")) {
    let distance = 0;
    if (msg.content.includes(" ")) { 
      distance = msg.content.split(' ')[1];
    }
    pluckPost(msg, redditRequests[redditRequests.length-(1+distance)])
  }
})

function pluckPost(msg, sub) {
  let puppyPromise = randomPuppy(sub)
  .then(url => {
    msg.reply(url)
  }).catch(console.error); 
}



//not mine !
function timeConverter(UNIX_timestamp){
  var a = new Date(UNIX_timestamp);
  var months = ['Jan','Feb','mmmar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var months = ["january", "february", "maruary", "apruary", "mayuary", "junuary", "juluary", "aguary", "sepuary", "octuary", "novuary", "decuary"]
  var year = a.getFullYear();
  var month = months[a.getMonth()];
  var date = a.getDate();
  var hour = ("0" + a.getHours()).slice(-2);
  var min = ("0" + a.getMinutes()).slice(-2);
  var sec = a.getSeconds();
  //var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
  var time = "the " + date + ' of ' + month + ' ' + year + ' at ' + hour + ':' + min;
  return time;
}

/*

TODO
 - grab message link
 - lyric scrape
 - timer !!!!!!!!
 - async everything? 
*/