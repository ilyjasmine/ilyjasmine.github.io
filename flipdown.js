"use strict";

function pad(n, len) {
  n = n.toString();
  return n.length < len ? pad("0" + n, len) : n;
}

function appendChildren(parent, children) {
  children.forEach(function (el) {
    parent.appendChild(el);
  });
}

class FlipUp {
  constructor(startTimestamp, el = "flipdown", opt = {}) {
    if (typeof startTimestamp !== "number") {
      throw new Error("FlipUp: Expected a unix timestamp.");
    }

    if (typeof el === "object") {
      opt = el;
      el = "flipdown";
    }

    this.startTime = startTimestamp;
    this.now = this._getTime();
    this.element = document.getElementById(el);
    this.opts = this._parseOptions(opt);
    this.rotors = [];
    this.rotorLeafFront = [];
    this.rotorLeafRear = [];
    this.rotorTop = [];
    this.rotorBottom = [];
    this.clockValues = {};
    this.clockStrings = {};
    this.prevClockValuesAsString = [];

    this._setOptions();
    this._init();
    this.countup = setInterval(this._tick.bind(this), 1000);
  }

  _getTime() {
    return new Date().getTime() / 1000;
  }

  _parseOptions(opt) {
    let headings = ["Years", "Days", "Hours", "Minutes", "Seconds"];
    if (opt.headings && opt.headings.length === 5) {
      headings = opt.headings;
    }
    return {
      theme: opt.hasOwnProperty("theme") ? opt.theme : "dark",
      headings: headings,
    };
  }

  _setOptions() {
    this.element.classList.add(`flipdown__theme-${this.opts.theme}`);
  }

  _init() {
    let dayDigits = 3; // Support 3-digit day display
    let totalRotors = 1 + dayDigits + 8; // 1 for years, 3 for days, 2x4 for h/m/s

    for (let i = 0; i < totalRotors; i++) {
      this.rotors.push(this._createRotor(0));
    }

    let count = 0;

    // Year group (1 digit)
    this.element.appendChild(this._createRotorGroup([this.rotors[count++]], 0));

    // Day group (3 digits)
    let dayRotors = [];
    for (let i = 0; i < dayDigits; i++) {
      dayRotors.push(this.rotors[count++]);
    }
    this.element.appendChild(this._createRotorGroup(dayRotors, 1));

    // h/m/s groups
    for (let i = 2; i < 5; i++) {
      let group = [this.rotors[count++], this.rotors[count++]];
      this.element.appendChild(this._createRotorGroup(group, i));
    }

    this.rotorLeafFront = Array.from(this.element.getElementsByClassName("rotor-leaf-front"));
    this.rotorLeafRear = Array.from(this.element.getElementsByClassName("rotor-leaf-rear"));
    this.rotorTop = Array.from(this.element.getElementsByClassName("rotor-top"));
    this.rotorBottom = Array.from(this.element.getElementsByClassName("rotor-bottom"));

    this._tick();
    this._updateClockValues(true);
  }

  _createRotorGroup(rotors, rotorIndex) {
    const rotorGroup = document.createElement("div");
    rotorGroup.className = "rotor-group";

    const heading = document.createElement("div");
    heading.className = "rotor-group-heading";
    heading.setAttribute("data-before", this.opts.headings[rotorIndex]);
    rotorGroup.appendChild(heading);

    appendChildren(rotorGroup, rotors);
    return rotorGroup;
  }

  _createRotor(v = 0) {
    const rotor = document.createElement("div");
    const rotorLeaf = document.createElement("div");
    const rotorLeafRear = document.createElement("figure");
    const rotorLeafFront = document.createElement("figure");
    const rotorTop = document.createElement("div");
    const rotorBottom = document.createElement("div");

    rotor.className = "rotor";
    rotorLeaf.className = "rotor-leaf";
    rotorLeafRear.className = "rotor-leaf-rear";
    rotorLeafFront.className = "rotor-leaf-front";
    rotorTop.className = "rotor-top";
    rotorBottom.className = "rotor-bottom";

    rotorLeafRear.textContent = v;
    rotorTop.textContent = v;
    rotorBottom.textContent = v;

    appendChildren(rotor, [rotorLeaf, rotorTop, rotorBottom]);
    appendChildren(rotorLeaf, [rotorLeafRear, rotorLeafFront]);

    return rotor;
  }

  _tick() {
    this.now = this._getTime();
    let diff = Math.max(0, this.now - this.startTime);

    this.clockValues.y = Math.floor(diff / (365.25 * 86400));
    diff -= this.clockValues.y * 365.25 * 86400;
    this.clockValues.d = Math.floor(diff / 86400);
    diff -= this.clockValues.d * 86400;
    this.clockValues.h = Math.floor(diff / 3600);
    diff -= this.clockValues.h * 3600;
    this.clockValues.m = Math.floor(diff / 60);
    diff -= this.clockValues.m * 60;
    this.clockValues.s = Math.floor(diff);

    this._updateClockValues();
  }

  _updateClockValues(init = false) {
    this.clockStrings.y = pad(this.clockValues.y, 1);
    this.clockStrings.d = pad(this.clockValues.d, 3);
    this.clockStrings.h = pad(this.clockValues.h, 2);
    this.clockStrings.m = pad(this.clockValues.m, 2);
    this.clockStrings.s = pad(this.clockValues.s, 2);

    const all = this.clockStrings.y + this.clockStrings.d + this.clockStrings.h + this.clockStrings.m + this.clockStrings.s;
    const chars = all.split("");

    this.rotorLeafFront.forEach((el, i) => {
      el.textContent = this.prevClockValuesAsString[i] || "0";
    });
    this.rotorBottom.forEach((el, i) => {
      el.textContent = this.prevClockValuesAsString[i] || "0";
    });

    const rotorTopFlip = () => {
      this.rotorTop.forEach((el, i) => {
        if (el.textContent !== chars[i]) {
          el.textContent = chars[i];
        }
      });
    };

    const rotorLeafRearFlip = () => {
      this.rotorLeafRear.forEach((el, i) => {
        if (el.textContent !== chars[i]) {
          el.textContent = chars[i];
          el.parentElement.classList.add("flipped");
          const flip = setTimeout(() => {
            el.parentElement.classList.remove("flipped");
            clearTimeout(flip);
          }, 500);
        }
      });
    };

    if (!init) {
      setTimeout(rotorTopFlip, 500);
      setTimeout(rotorLeafRearFlip, 500);
    } else {
      rotorTopFlip();
      rotorLeafRearFlip();
    }

    this.prevClockValuesAsString = chars;
  }
}
