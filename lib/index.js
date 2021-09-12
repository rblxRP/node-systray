"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var child = require("child_process");
var path = require("path");
var EventEmitter = require("events");
var readline = require("readline");
var debug_1 = require("debug");
var pkg = require('../package.json');
var debug = debug_1.default(pkg.name);
var getTrayBinPath = function (debug, traybinPath) {
    if (debug === void 0) { debug = false; }
    var binName = ({
        win32: "tray_windows" + (debug ? '' : '_release') + ".exe",
        darwin: "tray_darwin" + (debug ? '' : '_release'),
        linux: "tray_linux" + (debug ? '' : '_release'),
    })[process.platform];
    if (traybinPath)
        return path.resolve(path.join(traybinPath, binName));
    var binPath = path.resolve(__dirname + "/../traybin/" + binName);
    return binPath;
};
var CHECK_STR = ' (√)';
function updateCheckedInLinux(item) {
    if (process.platform !== 'linux') {
        return item;
    }
    if (item.checked) {
        item.title += CHECK_STR;
    }
    else {
        item.title = (item.title || '').replace(RegExp(CHECK_STR + '$'), '');
    }
    return item;
}
var SysTray = /** @class */ (function (_super) {
    __extends(SysTray, _super);
    function SysTray(conf) {
        var _this = _super.call(this) || this;
        _this._conf = conf;
        _this._binPath = getTrayBinPath(conf.debug, conf.traybinPath);
        _this._process = child.spawn(_this._binPath, [], {
            windowsHide: true
        });
        _this._rl = readline.createInterface({
            input: _this._process.stdout,
        });
        conf.menu.items = conf.menu.items.map(updateCheckedInLinux);
        _this._rl.on('line', function (data) { return debug('onLine', data); });
        _this.onReady(function () { return _this.writeLine(JSON.stringify(conf.menu)); });
        return _this;
    }
    SysTray.prototype.onReady = function (listener) {
        this._rl.on('line', function (line) {
            var action = JSON.parse(line);
            if (action.type === 'ready') {
                listener();
                debug('onReady', action);
            }
        });
        return this;
    };
    SysTray.prototype.onClick = function (listener) {
        this._rl.on('line', function (line) {
            var action = JSON.parse(line);
            if (action.type === 'clicked') {
                debug('onClick', action);
                listener(action);
            }
        });
        return this;
    };
    SysTray.prototype.writeLine = function (line) {
        if (line) {
            debug('writeLine', line + '\n', '=====');
            this._process.stdin.write(line.trim() + '\n');
        }
        return this;
    };
    SysTray.prototype.sendAction = function (action) {
        switch (action.type) {
            case 'update-item':
                action.item = updateCheckedInLinux(action.item);
                break;
            case 'update-menu':
                action.menu.items = action.menu.items.map(updateCheckedInLinux);
                break;
            case 'update-menu-and-item':
                action.menu.items = action.menu.items.map(updateCheckedInLinux);
                action.item = updateCheckedInLinux(action.item);
                break;
        }
        debug('sendAction', action);
        this.writeLine(JSON.stringify(action));
        return this;
    };
    /**
     * Kill the systray process
     * @param exitNode Exit current node process after systray process is killed, default is true
     */
    SysTray.prototype.kill = function (exitNode) {
        if (exitNode === void 0) { exitNode = true; }
        if (exitNode) {
            this.onExit(function () { return process.exit(0); });
        }
        this._rl.close();
        this._process.kill();
    };
    SysTray.prototype.onExit = function (listener) {
        this._process.on('exit', listener);
    };
    SysTray.prototype.onError = function (listener) {
        var _this = this;
        this._process.on('error', function (err) {
            debug('onError', err, 'binPath', _this.binPath);
            listener(err);
        });
    };
    Object.defineProperty(SysTray.prototype, "killed", {
        get: function () {
            return this._process.killed;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(SysTray.prototype, "binPath", {
        get: function () {
            return this._binPath;
        },
        enumerable: false,
        configurable: true
    });
    return SysTray;
}(EventEmitter.EventEmitter));
exports.default = SysTray;
//# sourceMappingURL=index.js.map