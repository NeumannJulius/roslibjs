var ActionResult = require("./ActionResult");
var ActionFeedback = require("./ActionFeedback");
var Service = require('../core/Service');
var EventEmitter2 = require("eventemitter2").EventEmitter2;
var ActionGoal = require("./ActionGoal");
var ActionHandle = require("./Actions");

function GoalWrapper(actionhandler,goal){
    this.actionhandler = actionhandler;
    this.goal = goal;

    this._goalCallback = function (data) {
      if (data.response_type === "feedback") {
        this.emit("feedback", new ActionFeedback(data));
      } else if (data.response_type === "result" || "error") {
        this.emit("result", new ActionResult(data));
      }
    };

    this.on("feedback", function (msg) {
      //console.log("feedback", msg.values);
      that.feedback = msg.values;
    })
  
    this.on("result", function (msg) {
      console.log("result", msg);
      that.status = msg.values;
    })

    this.cancel = new Service({
      ros: this.actionhandler.ros,
      name: this.actionhandler.name + '/_action/cancel_goal',
      messageType: 'action_msgs/srv/CancelGoal'
    });

}


GoalWrapper.prototype.__proto__ = EventEmitter2.prototype;

GoalWrapper.prototype.sendGoal = function (callback, feedbackCallback) {

  if (typeof callback === "function") {
    this.on("result", callback);
  }

  if (typeof feedbackCallback === "function") {
    this.on("feedback", feedbackCallback);
  }

  this.goalid =
    "create_goal:" + this.actionhandler.name + ":" + ++this.actionhandler.ros.idCounter;
  this.actionhandler.ros.on(this.goalid, this._messageCallback);

  var call = {
    op: "send_goal",
    feedback: true,
    id: this.goalid,
    action_name: this.actionhandler.name,
    action_type: this.actionhandler.actionType,
    goal_msg: this.goal,
  };
  this.actionhandler.ros.callOnConnection(call);

}

GoalWrapper.prototype.cancelGoal = function () {

  var call = {
    op: "cancel_goal",
    action_name: this.actionhandler.name,
    id: this.goalid,
  };
  this.actionhandler.ros.callOnConnection(call);

}





module.exports = GoalWrapper;