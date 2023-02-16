var ActionResult = require("./ActionResult");
var ActionFeedback = require("./ActionFeedback");
var Service = require('../core/Service');
var EventEmitter2 = require("eventemitter2").EventEmitter2;
var ActionGoal = require("./ActionGoal");

function ActionHandle(options) {
  var that = this;
  options = options || {};
  this.ros = options.ros;
  this.name = options.name;
  this.actionType = options.actionType;


  this._messageCallback = function (data) {
    if (data.response_type === "feedback") {
      that.emit("feedback", new ActionFeedback(data));
    } else if (data.response_type === "result" || "error") {
      that.emit("result", new ActionResult(data));
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
    ros: this.ros,
    name: this.name + '/_action/cancel_goal',
    messageType: 'action_msgs/srv/CancelGoal'
  });


}
ActionHandle.prototype.__proto__ = EventEmitter2.prototype;
/**
 * Calls the service. Returns the service response in the
 * callback. Does nothing if this service is currently advertised.
 *
 * @param request - the ROSLIB.ServiceRequest to send
 * @param callback - function with params:
 *   * response - the response from the service request
 * @param failedCallback - the callback function when the service call failed (optional). Params:
 *   * error - the error message reported by ROS
 */

ActionHandle.prototype.createClient = function (
  goal,
  callback,
  feedbackCallback
) {
  if (typeof callback === "function") {
    this.on("result", callback);
  }

  if (typeof feedbackCallback === "function") {
    this.on("feedback", feedbackCallback);
  }

  this.actionClientId =
    "create_client:" + this.name + ":" + ++this.ros.idCounter;
  this.ros.on(this.actionClientId, this._messageCallback);

  var call = {
    op: "send_goal",
    feedback: true,
    id: this.actionClientId,
    action_name: this.name,
    action_type: this.actionType,
    goal_msg: goal,
  };
  this.ros.callOnConnection(call);
};



ActionHandle.prototype.destroyClient = function () {
  var call = {
    op: "destroy_client",
    action_name: this.name,
  };
  this.ros.callOnConnection(call);

};

ActionHandle.prototype.cancelGoal = function () {
  var call = {
    op: "cancel_goal",
    action_name: this.name,
    id: this.actionClientId,
  };
  this.ros.callOnConnection(call);

};

ActionHandle.prototype.cancelGoalById = function (id) {
  var call = {
    op: "cancel_goal",
    action_name: this.name,
    id: id,
  };
  this.ros.callOnConnection(call);

}

module.exports = ActionHandle;



function GoalWrapper(actionhandler,value){
    this.actionhandler = actionhandler;
    this.goal = ActionGoal(value);

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