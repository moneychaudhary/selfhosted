const express = require('express');
const bodyParser = require("body-parser");
const pulse = require('random-name-sdk').init("apiKeyHere");

let app = express();
let port = process.env.PORT || 3000;
app.use(bodyParser.json({extended : true}));

app.post('/', (req, res) => {
  handleRequest(req.body,res);
});

async function handleRequest(event, response) {
  try {
    let res;
    let request = event.request;
    if(request.type === "LaunchRequest") {
      let options = {
        speechText: "Welcome to Self hosted skill. Say play short audio to listen to a audio clip",
        repromptText: "You can say play short audio",
        shouldEndSession: false
      };
      res = buildResponse(options);
      await pulse.log(request, res);
      response.send(res);
    } else if(request.type === "IntentRequest") {
      let options = {};
      if(request.intent.name === "ShortAudioIntent") {
        options.speechText ="<audio src='https://s3-us-west-2.amazonaws.com/jessie.stieger/pulselabsprofessor/Intro.1.mp3' />";
        options.speechText+= "Now say play long form audio to play using audio player";
        options.shouldEndSession = false;
      } else {
        options.speechText = "Sorry I don't know how to respond to that";
      }
      res = buildResponse(options);
      // pulse.log(request, res);
      response.send(res);
    } else if(request.type === "SessionEndedRequest") {
      let options = {
        speechText: "Bye for now",
        shouldEndSession: true
      };
      response.send(buildResponse(options));
    } else {
      let options = {
        speechText: "Got unknown request type",
        shouldEndSession: true
      };
      response.send(buildResponse(options));
    }
  } catch (e) {
    let options = {
      speechText: "Some Error occurred",
      shouldEndSession: true
    };
    response.send(buildResponse(options));
  }
}

function buildResponse(options) {
  let response = {
    version: "1.0",
    sessionAttributes: {},
    response: {
      outputSpeech: {
        type: "SSML",
        ssml: "<speak>" + options.speechText + "</speak>"
      },
      shouldEndSession: options.shouldEndSession
    }
  };

  if(options.repromptText) {
    response.response.reprompt = {
      outputSpeech: {
        type: "SSML",
        ssml: "<speak>" + options.repromptText + "</speak>"
      }
    }
  }

  return response;
}

app.listen(port);