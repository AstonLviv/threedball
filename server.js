#!/usr/bin/env node

var url = require("url");
var botgram = require("botgram");
var express = require("express");

var gameName = "ThreeDBallAndCube";
var publicBase = process.env.gameurl;
var bot = botgram(process.env.bottoken);
var port = process.env.PORT || 3103;
var hurl = process.env.URL;

var server = express();

var queries = {};

bot.command("help", function (msg, reply, next) {
  reply.text("This bot implements a dumb minigame. Say /game if you want to play.");
});

bot.command("start", "game", function (msg, reply, next) {
  reply.game(gameName);
});

bot.callback(function (query, next) {
  console.error(query.gameShortName);
  if (query.gameShortName !== gameName) return next();
  queries[query.id] = query;
  query.answer({
    //url: url.resolve(publicBase, "/telegramBot/game.html?id="+query.id)
    url: url.resolve(publicBase, "?id="+query.id+"?un="+query.from.name+"?pt="+port)
  });
});

server.get("/telegramBot/game.html", function (req, res, next) {
  if (!Object.hasOwnProperty.call(queries, req.query.id)) return next();
  console.log("Serving game to %s...", queries[req.query.id].from.name);
  res.sendFile(__dirname + "/game.html");
});

server.get("/submit/:score", function (req, res, next) {
  if (!Object.hasOwnProperty.call(queries, req.query.id)) return next();
  res.send("score submitted");
  var query = queries[req.query.id];
  console.log("Submitting score %s for «%s».", req.params.score, query.from.name);
  bot.setGameScore(query.from, parseInt(req.params.score), {
    chat: query.message ? query.message.chat : null,
    message: query.message || query.inlineMessageId,
  }, function (err, result) {});
});

// Easy way for the user to test deployment
server.get("/telegramBot/test.html", function (req, res, next) {
  res.send("<h1>It works!</h1> <p>Server set up successfully. Use <a href=\"" + bot.linkGame(gameName) + "\">this link</a> to play the game.");
});

server.listen(port, function () {
  bot.ready(function () {
    console.log("Server & bot ready.\nOpen %s to verify that the HTTP server is accessible publicly.", url.resolve(publicBase, "/telegramBot/test.html"));
    console.log("To play, send /game or use the following link to play:\n");
    console.log("  %s\n", bot.linkGame(gameName));
    console.log("Using port: %s\n", port);
    console.log("Using url: %s\n", hurl);
  });
});

// FIXME: use getGameHighScores and display them on game too
