var ActionResult = require("./ActionResult");
var ActionFeedback = require("./ActionFeedback");
var Service = require('../core/Service');
var EventEmitter2 = require("eventemitter2").EventEmitter2;
var ActionGoal = require("./ActionGoal");
var ActionHandle = require("./Actions");

class GoalWrapper extends EventEmitter2 {
    constructor(actionhandler, goal) {
        super();
        var that = this;
        this.actionhandler = actionhandler;
        this.goal = goal;

        this._goalCallback = function (data) {
            if (data.response_type === "feedback") {
                that.emit("feedback", new ActionFeedback(data));
            } else if (data.response_type === "result" || "error") {
                that.emit("result", new ActionResult(data));
            }
        };

        this.on("feedback", function (msg) {
            //console.log("feedback", msg.values);
            that.feedback = msg.values;
        });

        this.on("result", function (msg) {
            console.log("result", msg);
            that.status = msg.values;
        });

        this.cancel = new Service({
            ros: this.actionhandler.ros,
            name: this.actionhandler.name + '/_action/cancel_goal',
            messageType: 'action_msgs/srv/CancelGoal'
        });

    }
    sendGoal(callback, feedbackCallback) {

        if (typeof callback === "function") {
            this.on("result", callback);
        }

        if (typeof feedbackCallback === "function") {
            this.on("feedback", feedbackCallback);
        }

        this.goalid =
            "create_goal:" + this.actionhandler.name + ":" + ++this.actionhandler.ros.idCounter;
        this.actionhandler.ros.on(this.goalid, this._goalCallback);

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
    cancelGoal() {

        var call = {
            op: "cancel_goal",
            action_name: this.actionhandler.name,
            id: this.goalid,
        };
        this.actionhandler.ros.callOnConnection(call);

    }

    cancelSingleGoal() {

        var call = {
            op: "cancel_single_goal",
            action_name: this.actionhandler.name,
            id: this.goalid,
        };
        this.actionhandler.ros.callOnConnection(call);
    }

};
// GoalWrapper.prototype.__proto__ = EventEmitter2.prototype;

module.exports = GoalWrapper;