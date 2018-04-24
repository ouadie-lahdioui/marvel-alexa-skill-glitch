'use strict';
var _ = require('lodash');
var Alexa = require('alexa-app');
var app = new Alexa.app('wikia');
var WikiaHelper = require('../../../node_modules/alexa-wikia-app-server/wikia_helper');

//Which Wikia are you using????
var sWikiaName = 'starwars';

//What Name are you are going to use for the Skill in the Skill store
var sSkillName = "Star Wars Fandom";

// What wikia Catergories to use to build the word lists for the speech model
var oListWikiaCatergories = {
  "LIST_OF_WHO"   : "Named_creatures,Males,Females",
  "LIST_OF_WHAT"  : "Governments,Political_institutions,Military_units,Force-based_organizations,Organizations,Starfighters,Vehicles,Planets,Stars,Weapons",
  "LIST_OF_LISTS" : "Individuals_by_occupation,Individuals_by_species,Starships_by_type"
};

// What Alexa will say in certain situations
var Phrases = {
  "Launch"    :'Hello, you can ask me about the Marvel Cinematic Universe.',
  "Help"      :'I can answer questions about Marvel Cinematic Universe. Ask "who was", or "what is", or to "list" a catergory of things. Go ahead and ask a question.',
  "Stop"      :'Avengers Assemble!',
  "Error"     :"By the Hoary hosts of Hoggoth, I need you to try again.",
  "NotHeard"  :'What is it?  I suggest you try it again.',
  "NotFound"  :'Not found, how about you try something else.',
  "NoList"    :'No list has that name. You can try it again.',
  "Reprompt"  :'Lets give it another go.',
  "TakingTooLong":'Get on with it!'
};


var sLicence = 'This article is licensed under the Creative Commons Attribution-ShareAlike 3.0 Unported license. It uses material from the http://'+sWikiaName+'.wikia.com/wiki/'

app.getHelper = function(){
  return new WikiaHelper(sWikiaName, oListWikiaCatergories);
};

app.messages.GENERIC_ERROR = Phrases.Error;
app.error = function(exception, request, response) {
  response.say(Phrases.Error);
};

app.launch(function(req, res) {
  res.say("Hello guys ! welcome to this TachLab").reprompt(Phrases.TakingTooLong).shouldEndSession(false).send();
});

app.intent("AMAZON.HelpIntent",
  function(req, res) {
    res.say("Yes i'm here for that, ask me any things").reprompt("I wait for your question").shouldEndSession(false).send();
  }
);

app.intent("AMAZON.StopIntent",
  function(req, res) {
    res.say(Phrases.Stop);
});

app.intent("AMAZON.CancelIntent",
  function(req, res) {
    res.say(Phrases.Stop);
});

app.fetchArticle =   function(sSlot, req, res) {
  console.log(JSON.stringify(req));
  var sSubject = "";
  try {
    sSubject = req.slot(sSlot)
  } catch(err) {
    console.log("err", err);
    res.say(Phrases.NotHeard).reprompt(Phrases.Reprompt).shouldEndSession(false);
    return true;
  }
   
  if (_.isEmpty(sSubject)) {
    res.say(Phrases.NotHeard).reprompt(Phrases.Reprompt).shouldEndSession(false);
    return true;
  } 
  
  console.log(sSlot, sSubject);
  var oWikiaHelper = this.getHelper();
  
  oWikiaHelper.getLucky(sSubject).then(function(iID) {
    if(iID !== false){
      console.log("iID", iID);
      oWikiaHelper.getArticle(iID).then(function(aData) {
        if(aData.length > 0 ){
          var sTitle = sSubject;
          //https://www.npmjs.com/package/alexa-app#card-examples
          res.card({
            "type": "Simple",
            "title": sSkillName + " - "+sTitle,
            "content": aData.join("\n")+'\n'+sLicence+sTitle
          }).say(aData.join(" ")).send();
          return aData.join(" ");
        } else {
          res.say(Phrases.NotFound).reprompt(Phrases.Reprompt).shouldEndSession(false).send();
        }
      }).catch(function(err) {
        console.log("err", err);
        if(err.exception.type == "NotFoundApiException"){
          res.say(Phrases.NotFound).reprompt(Phrases.Reprompt).shouldEndSession(false).send();
        } else {
          res.say(Phrases.Error).reprompt(Phrases.Reprompt).shouldEndSession(false).send();
        }
      });
    }
  }).catch(function(err) {
    console.log("err",err.statusCode);
    res.say(Phrases.Error).reprompt(Phrases.Reprompt).shouldEndSession(false).send();
  });
  return false;
};

app.intent('wikia_who',
  function(req, res) {
    console.log(JSON.stringify(req));
    return app.fetchArticle("WHO", req, res);
  }
);

app.intent('wikia_what',
  function(req, res) {
    return app.fetchArticle("WHAT", req, res);
  }
);
    
app.intent('random',
  function(req, res) {
    res.say("Yes, you ask for a random whaat ?");
  }
);

app.intent('wikia_subject',
  function(req, res) {
    return app.fetchArticle("SUBJECT", req, res);
  }
);

app.intent('wikia_list',
  function(req, res) {
    var sSubject = "";
    try {
      sSubject = req.slot('WIKIALIST');
    } catch(err) {
      console.log("err", err);
      res.say(Phrases.NotHeard).reprompt(Phrases.Reprompt).shouldEndSession(false);
      return true;
    }
    
    if (_.isEmpty(sSubject)) {
      res.say(Phrases.NotHeard).reprompt(Phrases.Reprompt).shouldEndSession(false);
      return true;
    } 
    
    var oWikiaHelper = app.getHelper();
    oWikiaHelper.getList(sSubject).then(function(aData) {
      //console.log("aData", aData);
      if(aData.length > 0){
        var sParagraph = aData.join(", ");
        console.log("sParagraph", sParagraph);
        res.say(sParagraph).send();
        return sParagraph;
      } else {
        res.say(Phrases.NoList).reprompt(Phrases.Reprompt).shouldEndSession(false).send();
      }
    }).catch(function(err) {
      console.log("err in getList",err);
      if(err.exception.type == "NotFoundApiException"){
        console.log("NoList");
        res.say(Phrases.NoList).reprompt(Phrases.Reprompt).shouldEndSession(false).send();
      } else {
        console.log("Error");
        res.say(Phrases.Error).reprompt(Phrases.Reprompt).shouldEndSession(false).send();
      }
    });
    return false;
  }
);

module.exports = app;