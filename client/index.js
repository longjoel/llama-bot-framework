"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function () { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function () { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotFrameworkClient = void 0;
var BotFrameworkClient = /** @class */ (function () {
    function BotFrameworkClient(ircClient, ollamaClient, name, thoughtPatterns, idleThoughts, activityLevel, mood, instructions) {
        var _this = this;
        this.ircChannel = '#bots';
        this.ollamaMessageHistory = [];
        this.chatMessageHistory = [];
        this.name = '';
        this.activityLevel = 'reactive';
        this.ircClient = ircClient;
        this.ollamaClient = ollamaClient;
        this.name = name;
        this.thoughtPatterns = thoughtPatterns;
        this.idleThoughts = idleThoughts;
        this.activityLevel = activityLevel;
        this.mood = mood;
        this.instructions = __spreadArray(__spreadArray([], this.baseInstructions(), true), instructions, true);
        this.ircClient.addListener('message', function (from, to, message) {
            if (from === _this.name)
                return;
            _this.chatMessageHistory.push({ from: from, to: to, message: message, timestamp: new Date().toISOString() });
        });
        this.replyTimerHandle = setInterval(function () {
            return __awaiter(_this, void 0, void 0, function () {
                var convoHistory, response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            convoHistory = JSON.stringify(this.chatMessageHistory.slice(-10));
                            // step 2, iterate over the thought patterns and apply them to the chat history.
                            this.ollamaMessageHistory.push({ content: convoHistory, role: 'user' });
                            return [4 /*yield*/, this.ollamaClient.chat({ stream: false, model: 'llama3.2', messages: [{ role: 'system', content: this.instructions.join('\n') }, { content: convoHistory, role: 'user' }] })];
                        case 1:
                            response = _a.sent();
                            this.ircClient.say(this.ircChannel, response.message.content);
                            return [2 /*return*/];
                    }
                });
            });
        }, 1000);
    }
    BotFrameworkClient.prototype.baseInstructions = function () {
        return [
            "You are a participant in a multi user chat room ".concat(this.ircChannel, ". Messages from the user will messages from the chat."),
            "Messages will be formatted as follows in JSON format: [{\n                \"from\": \"username\",\n                \"to\": \"channel\",\n                \"message\": \"message\",\n                \"time\": \"timestamp\"}].",
            'Respond as if you are responding to a room of people, instead of a single person.',
            "You will identify yourself in the chat as \"".concat(this.name, "\"."),
            'You are aware you are a bot. You do not know if other participants are bots or humans.',
            'Do not impersonate or pretend to be another participant in the chat.',
            "If you do not wish to respond to a message, return a single message with the text \"<pass>\".",
            "You are forbidden from responding to your own messages.",
            "You have a ".concat(this.activityLevel, " activity level."),
            "You have a ".concat(this.mood, " base mood."),
            'You are not responding to messages in real time, but are instead responding to messages in a batch.',
        ];
    };
    ;
    ;
    BotFrameworkClient.prototype.destroy = function () {
        this.ircClient.disconnect('bye', function () { process.exit(0); });
        this.ircClient.off('message', function () { });
        clearInterval(this.replyTimerHandle);
    };
    return BotFrameworkClient;
}());
exports.BotFrameworkClient = BotFrameworkClient;
