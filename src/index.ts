#!/usr/bin/env node

import { ClosedAnswer } from "./Enums/ClosedAnswer";
import { Command } from "./Enums/Command";
import { Direction } from "./Enums/Direction";
import { GamePlayStyle } from "./Enums/GamePlayStyle";
import { IQuestion } from "./Models/IQuestion";
import { readFileSync } from "fs";

//clear the screen
console.clear();

const inquirer = require("inquirer");

const mapX = 5;
const mapY = 5;
var currentInstructions: string[] = [];
var robotLocation: { x: number; y: number; z: Direction };

/* Questions */

const gamePlayStyleQuestion: IQuestion = {
  type: "list",
  name: "gamePlayStyle",
  message:
    "To play this game, you must give your toy robot instructions.\n  Would you like to input the instructions manually or via the scripted command.txt file?",
  choices: Object.values(GamePlayStyle),
};
const tutorialQuestion: IQuestion = {
  type: "list",
  name: "tutorial",
  message:
    "Awesome! Would you like a tutorial? (I ran out of time so you can only say no :D)",
  choices: Object.values(ClosedAnswer),
  when(answers: { gamePlayStyle: string }) {
    return answers.gamePlayStyle === GamePlayStyle.Manual;
  },
};
const firstInstructionQuestion: IQuestion = {
  type: "list",
  name: "instruction",
  message: "Select your first instruction.",
  choices: [Command.PLACE, Command.EXIT],
};
const instructionQuestion: IQuestion = {
  type: "list",
  name: "instruction",
  message: "Select your instructions.",
  choices: Object.values(Command),
};
const xPlaceQuestion: IQuestion = {
  type: "input",
  name: "xPlace",
  message: "Where on the X axis would you like to place the bot?",
  validate(value: string) {
    const val = parseFloat(value);

    // check if input is number
    const valid = !isNaN(parseFloat(value));
    if (!valid) return "Please enter a number";

    // check if input is in correct range
    if (val > mapX - 1 || val < 0)
      return "Please enter a number between 0 and " + (mapX - 1);

    return true;
  },
};
const yPlaceQuestion: IQuestion = {
  type: "input",
  name: "yPlace",
  message: "Where on the Y axis would you like to place the bot?",
  validate(value: string) {
    const val = parseFloat(value);

    // check if input is number
    const valid = !isNaN(parseFloat(value));
    if (!valid) {
      value = "";
      return "Please enter a number";
    }
    // check if input is in correct range
    if (val > mapY - 1 || val < 0) {
      value = "";
      return "Please enter a number between 0 and " + (mapY - 1);
    }

    return true;
  },
};
const zPlaceQuestion: IQuestion = {
  type: "list",
  name: "zPlace",
  message: "What direction would you like the bot to face?",
  choices: Object.values(Direction),
};

/* Questionnaire - or rather groups of questions*/

const startQuestions = [gamePlayStyleQuestion];
const placeQuestions = [xPlaceQuestion, yPlaceQuestion, zPlaceQuestion];

function askQuestions(questions: IQuestion[]) {
  inquirer.prompt(questions).then((answers: any) => {
    updateRobot(answers);
    // console.log("testing my answers", answers);

    // checks if we need to ask the questions related to placement of the robot
    if (answers.instruction === Command.PLACE) {
      placementInterface();
    }
    // allows use to report
    else if (answers.instruction === Command.REPORT) {
      reportInterface();
    }
    // allows use to exit
    else if (answers.instruction === Command.EXIT) {
      console.clear();
      console.log("Thank you for playing");
      process.exitCode = 0;
    }
    // checks if we have just gotten the answers for a placement command - if so loop back to the usual questions
    else if (answers.zPlaceQuestion) {
      console.clear();
      instructionInterface();
    }
    // check selected script
    else if (answers.gamePlayStyle === GamePlayStyle.Script) {
      followScript();
    }
    // check selected manual
    else if (answers.gamePlayStyle === GamePlayStyle.Manual) {
      firstQuestionInterface();
    }
    // loop back to the usual questions
    else {
      console.clear();
      instructionInterface();
    }
  });
}

/* Interfaces */
function placementInterface() {
  console.clear();
  console.log("Current instructions: " + currentInstructions.toString() + "\n");

  console.log(
    "The map is " +
      mapX +
      " by " +
      mapY +
      " units. \nWhen selecting where on the X axis to place your bot, choose between 0 and " +
      (mapX - 1) +
      "\nWhen selecting where on the Y axis to place your bot, choose between 0 and " +
      (mapY - 1)
  );
  askQuestions(placeQuestions);
}
function reportInterface() {
  console.clear();
  console.log("Current instructions: " + currentInstructions.toString() + "\n");

  console.log("The bots current location is: ", robotLocation);

  askQuestions([instructionQuestion]);
}
function instructionInterface() {
  console.log("Current instructions: " + currentInstructions.toString() + "\n");

  askQuestions([instructionQuestion]);
}
function startInterface() {
  console.log("Hi, welcome to a simple toy robot game.");
  askQuestions(startQuestions);
}
function firstQuestionInterface() {
  console.log("Hi, welcome to a simple toy robot game.");
  askQuestions([firstInstructionQuestion]);
}
function scriptInterface(command: string) {
  console.log("Command: ", command);
  console.log("Bot Location:", robotLocation);
  console.log("");
}

/* Robot Instructions */
function updateRobot(answers: any) {
  //check if the last instruction was a place instruction
  if (answers.zPlace) {
    currentInstructions.push(
      Command.PLACE +
        " " +
        answers.xPlace +
        " " +
        answers.yPlace +
        " " +
        answers.zPlace
    );
    // will always have valid data due to validation on questions
    robotLocation = {
      x: parseInt(answers.xPlace),
      y: parseInt(answers.yPlace),
      z: answers.zPlace,
    };
  }
  //check if it was a normal instruction
  else if (
    answers.instruction === Command.LEFT ||
    answers.instruction === Command.RIGHT ||
    answers.instruction === Command.MOVE
  ) {
    currentInstructions.push(answers.instruction);
    moveBot(answers.instruction);
  }

  //console.log("current location: ", robotLocation);
}
function moveBot(command: Command) {
  if (command === Command.MOVE) {
    switch (robotLocation.z) {
      case Direction.NORTH:
        //ensures bot cannot fall off north side of map
        if (robotLocation.y < 4) robotLocation.y++;
        break;
      case Direction.EAST:
        //ensures bot cannot fall off East side of map
        if (robotLocation.x < 4) robotLocation.x++;
        break;
      case Direction.SOUTH:
        //ensures bot cannot fall off South side of map
        if (robotLocation.y > 0) robotLocation.y--;
        break;
      case Direction.WEST:
        //ensures bot cannot fall off West side of map
        if (robotLocation.x > 0) robotLocation.x--;
        break;
    }
  }
  //move the bot right
  else if (command === Command.LEFT) {
    switch (robotLocation.z) {
      case Direction.NORTH:
        robotLocation.z = Direction.WEST;
        break;
      case Direction.EAST:
        robotLocation.z = Direction.NORTH;
        break;
      case Direction.SOUTH:
        robotLocation.z = Direction.EAST;
        break;
      case Direction.WEST:
        robotLocation.z = Direction.SOUTH;
        break;
    }
  }
  //move the bot left
  else if (command === Command.RIGHT) {
    switch (robotLocation.z) {
      case Direction.NORTH:
        robotLocation.z = Direction.EAST;
        break;
      case Direction.EAST:
        robotLocation.z = Direction.SOUTH;
        break;
      case Direction.SOUTH:
        robotLocation.z = Direction.WEST;
        break;
      case Direction.WEST:
        robotLocation.z = Direction.NORTH;
        break;
    }
  }
}

/* Follow instructions from command.txt*/
function followScript() {
  try {
    // read script

    // get instructions
    var instructions: any[] = [];
    readFileSync("src/Commands/command.txt", "utf-8")
      .split(",")
      .forEach((instruction) => {
        instructions.push(instruction.split(" "));
      });

    //loop instructions
    instructions.forEach((instruction) => {
      if (instruction[0] === Command.PLACE) {
        var placeInstructions = {
          xPlace: instruction[1],
          yPlace: instruction[2],
          zPlace: instruction[3],
        };
        updateRobot(placeInstructions);
      } else {
        var newInstruction = { instruction: instruction[0] };
        updateRobot(newInstruction);
      }

      scriptInterface(instruction.toString(" "));
    });
    instructionInterface();
    //reportInterface()
  } catch (err) {
    console.log(err);
    console.error("Could not read the command.txt file");
  }
}

//Start the Game with the first Question
startInterface();
