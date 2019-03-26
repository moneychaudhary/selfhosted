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
  let res;
  let request = event.request;
  try {
    if(request.type === "LaunchRequest") {
      res = handleLaunchRequest();
    } else if(request.type === "IntentRequest") {
      res = handleIntentRequest(request);
    } else if(request.type === "SessionEndedRequest") {
      res = handleSessionEndedRequest();
    } else {
      res = handleUnknownRequest();
    }
  } catch (e) {
    res = handleError();
  } finally {
    await pulse.log(request, res);
    response.send(res);
  }
}

function handleLaunchRequest() {
  let options = {
    speechText: "Welcome to demo self hosted skill. Say play audio to listen to a audio clip",
    repromptText: "You can say play short audio or help",
    shouldEndSession: false
  };
  return buildResponse(options);
}

function handleIntentRequest(request) {
  let options = {};
  if(request.intent.name === "ShortAudioIntent") {
    //TODO:: Change the audio file used here
    options.speechText ="<audio src='https://s3-us-west-2.amazonaws.com/jessie.stieger/pulselabsprofessor/Intro.1.mp3' />";
    options.shouldEndSession = false;
  } else if(request.intent.name === "AMAZON.StopIntent" || request.intent.name === "AMAZON.CancelIntent") {
    options.speechText = "Exiting from the skill";
    options.shouldEndSession = true;
  } else if(request.intent.name === "AMAZON.HelpIntent") {
    options.speechText = "You can say play audio to listen to audio clip or stop to exit from skill";
    options.shouldEndSession = false;
  } else {
    options.speechText = "Sorry I don't know how to respond to that. Exiting you from the skill";
    options.shouldEndSession = true;
  }
  return buildResponse(options);
}

function handleSessionEndedRequest() {
  let options = {
    speechText: "Bye for now",
    shouldEndSession: true
  };
  return buildResponse(options);
}

function handleUnknownRequest() {
  let options = {
    speechText: "Got unknown request type. Exiting you from the skill",
    shouldEndSession: true
  };
  return buildResponse(options);
}

function handleError() {
  let options = {
    speechText: "Some error occurred while processing the requested information",
    shouldEndSession: true
  };
  return buildResponse(options);
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

  if(options.cardTitle){
    response.response.card = {
      type: "Simple",
      title: options.cardTitle
    };

    if(options.imageUrl){
      response.response.card.type = "Standard";
      response.response.card.text = options.cardContent;
      response.response.card.image = {
        smallImageUrl: options.imageUrl,
        largeImageUrl: options.imageUrl
      };
    }
    else{
      response.response.card.content = options.cardContent;
    }
  }

  if("session" in options && "attributes" in options.session) {
    response.sessionAttributes = options.session.attributes;
  }

  return response;
}

app.listen(port);