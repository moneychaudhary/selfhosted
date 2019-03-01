const express = require('express');
const request = require("request");
const bodyParser = require("body-parser");
const http = require("http");
const pulselabsSdk = require('pulselabs-sdk').default.init("apiKeyHere");

let app = express();
let port = process.env.PORT || 3000;
pulselabsSdk.setInterceptUrls(["/"]);
app.use(bodyParser.json({extended : true}));

app.post('/', (req, res) => {
  handleRequest(req.body,res);
});

async function handleRequest(event, response) {
  try {
    let request = event.request;
    if(request.type === "LaunchRequest") {
      let options = {
        speechText: "Welcome to Greeting skill. Using our skill you can greet the guests. Whom do you want to greet?",
        repromptText: "You can say for example say hello to john",
        shouldEndSession: false
      };
      response.send(buildResponse(options));
    } else if(request.type === "IntentRequest") {
      let options = {};
      if(request.intent.name === "HelloIntent") {
        let name = request.intent.slots.FirstName.value;
        options.speechText = `Hello ${name}. Hope you are doing well today.`;
        options.speechText += await getQuote();
        options.shouldEndSession = true;
      } else {
        options.speechText = "Sorry I donot know how to respond to that";
      }
      response.send(buildResponse(options));
    } else if(request.type === "SessionEndedRequest") {
      let options = {
        speechText: "Bye for now",
        shouldEndSession: true
      };
      response.send(buildResponse(options));
    } else {
      let options = {
        speechText: "Got unknown request type",
      };
      response.send(buildResponse(options));
    }
  } catch (e) {
    let options = {
      speechText: "Some Error occurred",
    };
    response.send(buildResponse(options));
  }
}

function getQuote() {
  return new Promise((resolve) => {
    request({
      url: 'http://api.forismatic.com/api/1.0/json?method=getQuote&lang=en&format=json',
      json: true
    }, (error, response, body) => {
      if (error) {
        resolve("");
      } else if (response && response.statusCode === 200) {
        let quote = body.quoteText;
        resolve(quote);
      } else {
        resolve("");
      }
    });
  });
}

function buildResponse(options) {
  let response = {
    version: "1.0",
    sessionAttributes: {},
    response: {
      outputSpeech: {
        type: "PlainText",
        text: options.speechText
      },
      card: {
        type: "Simple",
        title: "Greetings",
        content: "Welcome to Greetings skill."
      },
      shouldEndSession: options.shouldEndSession
    }
  };

  if(options.repromptText) {
    response.response.reprompt = {
      outputSpeech: {
        type: "PlainText",
        text: options.repromptText
      }
    }
  }

  return response;
}

app.listen(port, () => {
  console.log("app started");
});